# Plano de Remediação de Segurança

## 1. Objetivo e escopo

Este plano organiza a correção dos riscos encontrados na auditoria do backend do Smart Compliance. O escopo cobre inicialização em produção, autenticação, autorização, sessões, upload de evidências, exposição de informações operacionais, geração de identificadores e dependências.

O levantamento foi feito por inspeção estática dirigida. O lockfile foi sincronizado em 07/10/2026. Após as correções de `proxy-addr`, `@angular/cli`, `http-cache-semantics` e `source-map-js`, a auditoria reporta 0 vulnerabilidades críticas, 0 altas e 2 moderadas. Os testes de autenticação que carregam o armazenamento permanecem pendentes porque a restauração local de dependências não concluiu neste ambiente.

### Critérios de severidade

| Severidade | Critério |
| --- | --- |
| Alta | Pode permitir comprometimento administrativo, acesso amplo a dados ou impacto grave com baixa complexidade. |
| Média | Exige condições adicionais, mas pode permitir abuso de autenticação, persistência de acesso ou entrada de conteúdo malicioso. |
| Baixa | Reduz defesa em profundidade, facilita reconhecimento ou aumenta impacto de outra falha. |

## 2. Inventário consolidado

| ID | Vulnerabilidade | Severidade | Prioridade | Esforço estimado |
| --- | --- | --- | --- | --- |
| SEC-01 | Produção pode iniciar com armazenamento em memória e contas demo conhecidas | Alta | Imediata | Baixo |
| SEC-02 | Rate limiting de login é local e contornável | Média | Alta | Médio |
| SEC-03 | Upload valida apenas o MIME informado pelo cliente | Média | Alta | Médio |
| SEC-04 | Tokens não possuem revogação individual | Média | Média | Médio/alto |
| SEC-05 | IDs são gerados com `Math.random()` | Baixa | Média | Baixo |
| SEC-06 | Health check expõe detalhes operacionais | Baixa | Média | Baixo |
| SEC-07 | Faltam políticas explícitas de HSTS e não armazenamento em cache | Baixa | Média | Baixo |
| SEC-08 | Vulnerabilidades em dependências devem ser reavaliadas após sincronizar o lockfile | Indeterminada | Alta | Baixo/médio |
| SEC-09 | Lockfile fora de sincronia impede instalação reprodutível | Média | Alta | Baixo/médio |

## 3. Plano por issue

### SEC-01 — Bloquear contas demo em produção

**Causa:** `resolveStorageMode()` usa `memory` quando não encontra configuração do MySQL. O armazenamento em memória carrega usuários de demonstração com senha conhecida, inclusive administrador.

**Cenário de risco:** uma publicação com `NODE_ENV=production`, `AUTH_SECRET` configurado e banco ausente pode iniciar normalmente com `admin@demo.local / demo123`.

**Correção MVP:**

1. Interromper a inicialização quando `NODE_ENV=production` e `STORAGE_MODE` não for `mysql`.
2. Validar presença das variáveis obrigatórias do banco antes de criar o servidor.
3. Garantir que dados demo só possam ser carregados fora de produção.
4. Acrescentar teste de configuração cobrindo produção sem banco.

**Arquivos prováveis:**

- `backend/src/config/env.js`
- `backend/src/server.js`
- `backend/src/data/store.js`
- `backend/tests/security-config.test.mjs`

**Riscos da correção:** ambientes atualmente publicados com configuração incompleta deixarão de iniciar.

**Mitigação:** validar previamente os ambientes, publicar primeiro as variáveis do banco e retornar erro explícito sem registrar credenciais.

**Rollback:** restaurar a versão anterior somente em ambiente não produtivo. Em produção, corrigir configuração em vez de reativar o fallback.

**Critérios de aceite:**

- Produção não inicia com armazenamento em memória.
- Nenhuma conta demo pode autenticar em produção.
- Desenvolvimento continua podendo usar dados demo explicitamente.

### SEC-02 — Tornar o rate limiting efetivo e distribuído

**Causa:** tentativas são armazenadas em um `Map` por processo e agrupadas somente por `IP + e-mail`.

**Cenário de risco:** reinicializações, múltiplas réplicas, rotação de IP ou rotação de e-mails contornam o limite. Muitas chaves diferentes também podem elevar o consumo de memória.

**Correção MVP:**

1. Aplicar limites independentes por IP e por e-mail normalizado.
2. Impor limite global de chaves e limpeza determinística no mecanismo local.
3. Preservar resposta genérica para não permitir enumeração de contas.

**Correção recomendada para produção:** persistir contadores em Redis ou armazenamento compartilhado, com operações atômicas e TTL. A adoção de nova infraestrutura exige autorização específica.

**Arquivos prováveis:**

- `backend/src/routes/auth.js`
- `backend/src/config/env.js`
- `backend/tests/auth-access.test.mjs`

**Riscos da correção:** bloqueio indevido de usuários atrás de NAT e indisponibilidade do serviço compartilhado.

**Mitigação:** limites separados, janela curta, telemetria de bloqueios e política fail-safe definida. Não registrar e-mail ou senha em claro nos logs.

**Rollback:** feature flag para retornar temporariamente ao limitador local, mantendo ao menos o limite por IP.

**Critérios de aceite:**

- Tentativas permanecem limitadas entre réplicas e reinicializações.
- Alternar e-mail não remove o limite por IP.
- Alternar IP não remove o limite por conta.
- Respostas de usuário inexistente e senha incorreta são equivalentes.

### SEC-03 — Validar conteúdo real dos uploads

**Causa:** o tipo aceito é determinado por `file.mimetype`, controlado pelo cliente.

**Cenário de risco:** um conteúdo malicioso pode ser enviado com MIME permitido, armazenado como evidência e distribuído a usuários autorizados.

**Correção MVP:**

1. Verificar assinatura binária de PDF, JPEG e PNG.
2. Para texto, rejeitar bytes nulos, limitar encoding e impedir conteúdo incompatível.
3. Renomear o arquivo no armazenamento com identificador seguro; preservar o nome original apenas como metadado sanitizado.
4. Servir downloads com `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` e MIME detectado pelo servidor.
5. Manter limite de 2 MB e incluir limite de quantidade por requisição.

**Melhoria opcional:** varredura antimalware assíncrona e estado de quarentena antes de liberar o download.

**Arquivos prováveis:**

- `backend/src/data/storeIncidentsDomain.js`
- `backend/src/routes/incidents.js`
- testes específicos de incidentes/evidências

**Riscos da correção:** falsos negativos de detecção, rejeição de arquivos legítimos e aumento de memória durante análise.

**Mitigação:** validar apenas formatos suportados, usar amostras de teste reais e manter limite estrito antes do processamento.

**Rollback:** desabilitar temporariamente novos uploads, preservando downloads existentes como `application/octet-stream`.

**Critérios de aceite:**

- Arquivo com MIME falso é rejeitado.
- Conteúdo válido de cada formato permitido é aceito.
- Downloads nunca são renderizados inline pelo navegador.

### SEC-04 — Implementar sessões revogáveis

**Causa:** o token tem validade fixa de 12 horas e não existe identificador de sessão nem revogação individual.

**Cenário de risco:** um token capturado permanece válido até expirar, salvo mudança de senha ou desativação da conta.

**Correção MVP:**

1. Reduzir a duração do token de acesso para um período configurável e menor.
2. Adicionar `jti`, `iss` e `aud` ao token e validá-los no middleware.
3. Criar logout que revogue o `jti` até o vencimento.
4. Não armazenar tokens brutos; persistir somente hash ou identificador.

**Melhoria opcional:** access token curto combinado com refresh token rotativo, detecção de reutilização e revogação da família de tokens.

**Arquivos prováveis:**

- `backend/src/auth/token.js`
- `backend/src/auth/middleware.js`
- `backend/src/routes/auth.js`
- camada de armazenamento e testes de autenticação

**Riscos da correção:** mudanças incompatíveis podem desconectar usuários ou criar sessões que não renovam corretamente.

**Mitigação:** aceitar tokens antigos por janela curta e controlada, versionar o formato do token e publicar frontend/backend de forma coordenada.

**Rollback:** manter validação temporária do formato anterior sem emitir novos tokens antigos.

**Critérios de aceite:**

- Logout invalida imediatamente a sessão correspondente.
- Um token revogado retorna 401.
- Troca de senha continua invalidando todas as sessões.
- Segredos e tokens não aparecem em logs.

### SEC-05 — Usar identificadores criptograficamente seguros

**Causa:** `createId()` usa `Math.random()`.

**Correção:** substituir por `crypto.randomUUID()` mantendo o prefixo atual, por exemplo `user_<uuid>`.

**Arquivos prováveis:**

- `backend/src/data/storeSecurity.js`
- testes que assumam formato ou tamanho fixo de ID

**Riscos da correção:** validações, colunas ou testes podem assumir o comprimento atual.

**Mitigação:** confirmar largura das colunas e consumidores antes da troca. Se necessário, usar `crypto.randomBytes()` com tamanho compatível.

**Critérios de aceite:** IDs novos não são previsíveis, não colidem nos testes de volume e continuam compatíveis com banco e frontend.

### SEC-06 — Reduzir exposição do health check

**Causa:** o endpoint público retorna ambiente, versão, modo de armazenamento e detalhes do banco.

**Correção:**

1. Manter no endpoint público somente `status`, `ready` e um identificador de verificação não sensível.
2. Mover detalhes operacionais para logs ou endpoint interno protegido.
3. Garantir que exceções nunca sejam retornadas ao cliente.

**Arquivos prováveis:**

- `backend/src/app.js`
- testes de health check

**Riscos da correção:** monitoramento existente pode depender dos campos removidos.

**Mitigação:** mapear probes do Render e observabilidade antes da publicação; manter contrato mínimo estável.

**Critérios de aceite:** health check continua atendendo readiness sem revelar ambiente, versão, storage ou fornecedor do banco.

### SEC-07 — Completar cabeçalhos e política de cache

**Correção:**

1. Definir `Cache-Control: no-store` nas respostas de autenticação e dados sensíveis.
2. Configurar HSTS no proxy de borda; usar no Express apenas quando HTTPS e proxy estiverem corretamente garantidos.
3. Revisar CSP no frontend, onde ela é mais efetiva.
4. Manter os cabeçalhos já existentes: `nosniff`, `DENY`, referrer policy e permissions policy.

**Arquivos prováveis:**

- `backend/src/app.js`
- `backend/src/routes/auth.js`
- configuração de hospedagem/frontend

**Riscos da correção:** HSTS mal configurado pode impedir acesso a subdomínios sem HTTPS; `no-store` pode aumentar tráfego.

**Mitigação:** começar sem `includeSubDomains`, confirmar HTTPS integral e aplicar cache restritivo apenas a conteúdo sensível.

**Critérios de aceite:** tokens e dados pessoais não são armazenados em caches intermediários; HTTPS recebe HSTS no ambiente de produção.

### SEC-08 — Auditar dependências e cadeia de suprimentos

**Situação:** a auditoria automatizada do lockfile sincronizado foi executada em 07/10/2026, incluindo dependências de desenvolvimento. As vulnerabilidades de `proxy-addr`, `@modelcontextprotocol/sdk`, `http-cache-semantics` e `source-map-js` foram corrigidas. Restam somente os alertas moderados de `uuid` por meio de `exceljs`.

**Plano de tratamento:**

1. Atualizar o Angular CLI para `21.2.26` ou versão posterior compatível, corrigindo a cadeia de `@modelcontextprotocol/sdk`.
2. Identificar os pais de `proxy-addr`, `http-cache-semantics` e `source-map-js`; atualizar os transitivos por meio de versões compatíveis dos pacotes-pai ou overrides revisados.
3. Avaliar a substituição/atualização de `exceljs`, pois a correção automática sugerida exige alteração major e pode ser incompatível.
4. Reexecutar auditoria e testes após cada grupo de atualização; não usar `npm audit fix --force`.

**Plano:**

1. Restaurar dependências de forma reprodutível com o lockfile revisado.
2. Executar auditoria separadamente em raiz, backend e frontends.
3. Classificar cada CVE por alcançabilidade, contexto e versão em produção.
4. Atualizar primeiro patches compatíveis; mudanças major devem ter plano próprio.
5. Executar testes direcionados após cada grupo de atualização.
6. Habilitar atualização automatizada e revisão periódica de dependências.

**Riscos da correção:** atualizações podem introduzir regressões ou mudanças incompatíveis.

**Mitigação:** commits pequenos, atualização por pacote/grupo, testes específicos e possibilidade de rollback pelo lockfile.

**Critérios de aceite:** nenhuma vulnerabilidade crítica ou alta alcançável permanece sem exceção formal, prazo e responsável.

#### Exceção de risco residual — `uuid` via `exceljs`

**Status em 07/10/2026:** aceito como não alcançável no fluxo atual. O alerta GHSA-w5hq-g745-h8pq afeta apenas UUID v3, v5 e v6 quando recebem buffer e offset fornecidos pelo chamador. O backend usa ExcelJS somente para importar e exportar XLSX, e o ExcelJS usa UUID v4 sem argumentos nesse caminho.

**Justificativa técnica:** ExcelJS 4.4.0 é a versão estável atual e mantém `uuid ^8.3.0`. Não existe atualização compatível publicada. Forçar UUID 11.1.1 ou superior viola essa faixa e pode quebrar a importação/exportação; o downgrade automático sugerido pelo npm é uma alteração major regressiva.

**Controles compensatórios:** manter o upload limitado a XLSX/CSV para essa funcionalidade, conservar validações de conteúdo e executar testes de importação/exportação quando a árvore de dependências estiver completa.

**Revisão obrigatória:** reavaliar na próxima versão do ExcelJS que eleve UUID para 11.1.1 ou superior, em atualizações trimestrais de dependências, ou se o projeto passar a usar UUID v3/v5/v6 com buffers diretamente.

### SEC-09 — Sincronizar manifests e lockfile

**Causa:** `npm ci` não consegue restaurar as dependências porque o `package-lock.json` não está em sincronia com os `package.json`. O erro aponta referências ausentes do Angular `21.2.25` enquanto o lock registra versões `21.2.24` para parte da árvore.

**Impacto:** builds e testes não podem ser reproduzidos de forma confiável. Uma instalação com `npm install` pode modificar a árvore resolvida sem uma revisão explícita, reduzindo a rastreabilidade da cadeia de suprimentos.

**Correção:**

1. Revisar os manifests dos workspaces para confirmar as versões intencionais.
2. Regenerar o lockfile com a versão aprovada do npm, sem usar atualizações amplas ou `audit fix --force`.
3. Revisar o diff do lockfile para confirmar que apenas versões esperadas foram alteradas.
4. Executar `npm ci --ignore-scripts`, testes direcionados e `npm audit --package-lock-only` após a sincronização.
5. Adicionar validação de `npm ci` no CI para impedir nova divergência.

**Riscos da correção:** regenerar o lock pode atualizar transitivos e introduzir regressões.

**Mitigação:** usar branch isolada, revisar o diff de resoluções, instalar com scripts desativados inicialmente e testar por workspace.

**Critérios de aceite:** `npm ci --ignore-scripts` conclui sem modificar manifests ou lockfile, e a auditoria pós-sincronização continua sem vulnerabilidades críticas ou altas.

## 4. Fases de execução

### Fase 0 — Preparação e linha de base

1. Restaurar dependências sem atualizar versões inadvertidamente.
2. Executar testes atuais de autenticação e configuração.
3. Registrar comportamento atual dos endpoints afetados.
4. Confirmar variáveis e número de réplicas do ambiente de produção.

### Fase 1 — Bloqueador de produção

Implementar SEC-01 isoladamente, publicar em homologação e validar falha segura com banco ausente. Esta fase deve ser concluída antes das demais.

### Fase 2 — Autenticação

Implementar SEC-02 e SEC-04 em mudanças separadas. O rate limiting compartilhado depende de decisão sobre armazenamento. A migração de sessões deve ter janela de compatibilidade.

### Fase 3 — Conteúdo e exposição de dados

Implementar SEC-03, SEC-06 e SEC-07. Validar uploads com arquivos reais e confirmar compatibilidade do monitoramento.

### Fase 4 — Hardening e cadeia de suprimentos

Implementar SEC-05, SEC-08 e SEC-09, executar regressão dirigida e revisar configuração de produção.

## 5. Ordem recomendada e dependências

| Ordem | Issue | Dependência | Estratégia de entrega |
| --- | --- | --- | --- |
| 1 | SEC-01 | Configuração real de produção | Patch isolado e publicação imediata |
| 2 | SEC-09 | Revisão das versões intencionais | Lockfile sincronizado e instalação reproduzível |
| 3 | SEC-08 | Lockfile sincronizado | Relatório e patches compatíveis |
| 4 | SEC-02 | Decisão sobre armazenamento compartilhado | MVP local e depois solução distribuída |
| 5 | SEC-03 | Nenhuma biblioteca obrigatória se magic bytes forem validados nativamente | Patch com testes de amostras |
| 6 | SEC-06 | Contrato do monitoramento | Mudança compatível de readiness |
| 7 | SEC-07 | Configuração HTTPS/proxy | Backend e borda coordenados |
| 8 | SEC-05 | Compatibilidade de tamanho dos IDs | Mudança simples após validação do schema |
| 9 | SEC-04 | Persistência de sessões e coordenação com frontend | Implantação gradual |

## 6. Estratégia de testes

### Testes automatizados mínimos

- Produção sem banco falha antes de escutar a porta.
- Produção não contém autenticação demo.
- Rate limiting funciona por IP e por conta.
- Token expirado, revogado ou com `iss/aud` inválidos retorna 401.
- Upload com MIME falso ou assinatura inválida é rejeitado.
- Arquivos válidos e dentro do limite são aceitos.
- Health check público não contém detalhes internos.
- Respostas sensíveis contêm `Cache-Control: no-store`.
- IDs novos possuem formato válido e não colidem.

### Validação em homologação

1. Autenticar todos os perfis suportados.
2. Trocar senha, encerrar sessão e confirmar revogação.
3. Simular tentativas excessivas de múltiplos IPs e réplicas.
4. Enviar amostras válidas e inválidas de evidências.
5. Verificar readiness, logs e ausência de dados sensíveis.
6. Executar regressão direcionada de incidentes, usuários e avaliações.

## 7. Implantação, observabilidade e resposta

- Entregar cada issue em alteração independente para facilitar rollback.
- Não combinar remediação com refatorações de arquitetura.
- Monitorar 401, 403, 429, falhas de upload, falhas de readiness e erros de renovação de sessão.
- Criar alertas para tentativas de login distribuídas e uso de contas demo.
- Registrar eventos de segurança sem senhas, tokens ou conteúdo de evidências.
- Em caso de suspeita de exposição, rotacionar `AUTH_SECRET`, credenciais do banco e sessões ativas.

## 8. Itens futuros

- Varredura antimalware e quarentena de anexos.
- MFA para administradores, RH e compliance.
- Política centralizada de autorização por recurso, além de função.
- Gestão formal de segredos e rotação automática.
- SAST, secret scanning e auditoria de dependências no CI.
- Testes periódicos de restauração, incident response e segurança ofensiva autorizada.

## 9. Checklist final de produção

- [ ] `NODE_ENV=production` e `STORAGE_MODE=mysql` validados no startup.
- [ ] Nenhuma conta ou senha demo disponível.
- [ ] `AUTH_SECRET` forte, exclusivo e armazenado como segredo.
- [ ] Banco usa TLS com validação de certificado.
- [ ] Rate limiting compartilhado validado com todas as réplicas.
- [ ] Sessões podem ser revogadas.
- [ ] Uploads são verificados pelo conteúdo real.
- [ ] Health check público contém somente dados mínimos.
- [ ] Cache e cabeçalhos HTTPS foram validados.
- [ ] Dependências não possuem risco crítico/alto sem tratamento formal.
- [ ] Lockfile está sincronizado e `npm ci --ignore-scripts` é reprodutível.
- [ ] Testes específicos e regressão dirigida aprovados.
- [ ] Rollback foi ensaiado em homologação.

## 10. Definição de concluído

Uma issue é considerada resolvida somente quando a correção foi revisada, possui teste automatizado, foi validada em homologação, tem evidência de implantação e não deixou risco residual alto sem aceite formal. Exceções devem registrar responsável, justificativa, controles compensatórios e prazo de revisão.
