# Banco de dados

O bot usa Prisma ORM com PostgreSQL. Configure `DATABASE_URL` a partir de `.env.example`.

```bash
npm install
npm run db:generate
npm run db:migrate
```

O bot acessa diretamente os modelos relacionais gerados pelo Prisma. Os campos variáveis de inventário, baús, chips e cooldowns permanecem em suas tabelas próprias, sem migração de dados em JSON ou alterações de schema durante a execução.
