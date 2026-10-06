# LeadScore IA

## Contexto
App Next.js (App Router, TypeScript) que capta leads, analisa com Claude API
e salva no Neon Postgres via Drizzle ORM. Trabalho acadêmico, prazo curto:
priorizar simplicidade e código legível.

## Regras
- TypeScript estrito, sem `any`.
- Acesso ao banco só via Drizzle, schema em `src/db/schema.ts`.
- Segredos só em variáveis de ambiente; nunca commitar `.env*`.
- Rotas de API em `src/app/api/`.
- A resposta da IA deve ser JSON validado com Zod antes de salvar.
- Commits pequenos, em português: `feat:`, `fix:`, `docs:`.
- Antes de concluir uma tarefa: rodar `npm run build` e `npm run lint`.

## Comandos
- dev: `npm run dev`
- migrations: `npx drizzle-kit push`
