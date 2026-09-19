# Banco de dados

O bot usa Prisma ORM com PostgreSQL. Configure `DATABASE_URL` a partir de `.env.example`.

```bash
npm install
npm run db:generate
npm run db:migrate
```

Para importar uma instalação que ainda usa as tabelas antigas, execute `npm run db:import-legacy` uma vez depois de aplicar a migração. O importador lê as tabelas legadas usando o Prisma e grava os registros no novo modelo.

Os campos variáveis de inventário, baús, chips e cooldowns são armazenados em JSON. O bot não executa mais `ALTER TABLE` durante a execução.
