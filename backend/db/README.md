# Seeds do banco

`seed.sql` contem dados e credenciais demo. Por seguranca, ele e bloqueado por padrao e so executa quando a sessao MySQL define explicitamente `@SMART_COMPLIANCE_ALLOW_DEMO_SEED = true`.

Para QA/dev, execute a partir da raiz do projeto:

```bash
mysql ... < backend/db/seed-qa-demo.sql
```

Em producao real, nao execute `seed.sql` nem `seed-qa-demo.sql`. Cadastre usuarios reais pelo fluxo administrativo depois de aplicar `schema.sql` e as migrations necessarias.
