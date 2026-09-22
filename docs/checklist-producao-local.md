# Checklist de implantacao no servidor local

Objetivo: subir o Smart Compliance no servidor definitivo com frontend Angular e backend Node no mesmo dominio, usando MySQL gerenciado ou local autorizado. Este checklist nao substitui uma janela de backup/restore validada.

## 1. Antes da janela

- [ ] Preencher `docs/requisitos-servidor-local.md`.
- [ ] Confirmar commit que sera implantado.
- [ ] Confirmar URL final do sistema local.
- [ ] Confirmar se o MySQL definitivo sera Aiven ou outro MySQL autorizado.
- [ ] Confirmar credenciais `MYSQL_*` sem registra-las em documento ou chat.
- [ ] Confirmar diretorio persistente para `DATA_DIR` e `BACKUP_DIR`.
- [ ] Confirmar cliente MySQL disponivel no servidor: `mysql` e `mysqldump`, ou preencher `MYSQL_CLIENT_PATH` e `MYSQLDUMP_PATH`.
- [ ] Confirmar regra de proxy: `/api` deve encaminhar para o backend Node.
- [ ] Confirmar regra SPA: demais rotas devem servir `index.html` do Angular.

## 2. Backend

- [ ] Criar `.env` de producao a partir de `backend/.env.production.example`.
- [ ] Usar `NODE_ENV=production`.
- [ ] Usar `STORAGE_MODE=mysql`.
- [ ] Usar `AUTH_SECRET` forte, diferente do valor de exemplo.
- [ ] Usar `CORS_ORIGIN` com a URL final do frontend local, sem wildcard.
- [ ] Usar `LOG_FORMAT=json`.
- [ ] Configurar `DATA_DIR` em armazenamento persistente.
- [ ] Configurar `BACKUP_DIR` em armazenamento persistente e com permissao restrita.
- [ ] Rodar `npm run validate:production-config` dentro de `backend`.
- [ ] Iniciar o backend somente depois do validador passar.

## 3. Banco e dados

- [ ] Antes de qualquer mudanca em banco existente, parar o backend.
- [ ] Gerar backup com `npm run backup:mysql -- --backend-stopped`.
- [ ] Preservar juntos o `.sql` e o arquivo `.sql.state.json`.
- [ ] Validar restore em ambiente de homologacao, nunca direto no banco definitivo.
- [ ] Confirmar se `schema.sql` e migrations pendentes ja foram aplicados.
- [ ] Nao rodar seed demo no banco definitivo sem decisao explicita.

## 4. Frontend Angular

- [ ] Rodar `npm run build:production-local` em `frontend-angular`.
- [ ] Publicar `frontend-angular/dist/frontend-angular/browser` no servidor web local.
- [ ] Confirmar que o bundle de producao usa `/api`.
- [ ] Confirmar que assets estaticos sao servidos com cache adequado.
- [ ] Confirmar que rotas internas como `/app/dashboard` recarregam sem 404.

## 5. Validacao pos-subida

- [ ] `GET /health` retorna `status: ok`.
- [ ] `GET /health` retorna `ready: true`.
- [ ] `GET /health` retorna `storageMode: mysql`.
- [ ] Login com usuario autorizado funciona.
- [ ] Usuario com senha provisoria redireciona para troca de senha.
- [ ] Dashboard executivo carrega sem erro de API.
- [ ] Pessoas, areas e competencias carregam conforme perfil autorizado.
- [ ] Compliance carrega para colaborador e compliance.
- [ ] Feedback e aplausos carregam para colaborador.
- [ ] Auditoria carrega para perfil autorizado.
- [ ] Logs nao mostram erro 5xx recorrente.

## 6. Criterio de aceite

Considere a implantacao pronta para uso somente quando todos estes pontos estiverem verdadeiros:

- [ ] Configuracao validada por `npm run validate:production-config`.
- [ ] Backup e restore testado em ambiente de homologacao.
- [ ] Frontend production servido pelo dominio definitivo.
- [ ] Backend responde por `/api` atras do proxy local.
- [ ] Fluxos principais passam em navegacao real.
- [ ] Nenhuma credencial demo foi mantida por acidente no banco definitivo.

## 7. Rollback

- [ ] Manter pacote/build anterior do frontend disponivel.
- [ ] Manter versao anterior do backend disponivel.
- [ ] Em falha de codigo, voltar backend/frontend para a revisao anterior.
- [ ] Em falha de dados, nao improvisar restore: manter backend parado e restaurar apenas a partir de backup validado.
