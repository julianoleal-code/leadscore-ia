# 🚀 LeadScore IA — Qualificador Inteligente de Leads para PMEs

> **FAETERJ · Barra Mansa — Inteligência Artificial**  
> **Professor:** Vinicius  
> **Desafio de 1 Semana em Dupla**  
> **Entrega:** 29/09/2026  

[![Deploy Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://leadscore-ia-leal-code.vercel.app)
[![Neon Database](https://img.shields.io/badge/Database-Neon_Postgres-00E599?logo=postgresql)](https://neon.tech)
[![GitHub Repo](https://img.shields.io/badge/GitHub-leadscore--ia-181717?logo=github)](https://github.com/julianoleal-code/leadscore-ia)

🔗 **Aplicação no Ar:** [https://leadscore-ia-leal-code.vercel.app](https://leadscore-ia-leal-code.vercel.app)  
📊 **Painel de Vendas:** [https://leadscore-ia-leal-code.vercel.app/painel](https://leadscore-ia-leal-code.vercel.app/painel)  
📂 **Repositório:** [https://github.com/julianoleal-code/leadscore-ia](https://github.com/julianoleal-code/leadscore-ia)  

---

## 📋 Sumário
1. [Visão Geral e Problema](#-visão-geral-e-problema)
2. [Solução Proposta](#-solução-proposta)
3. [Arquitetura da Aplicação (Mermaid)](#-arquitetura-da-aplicação)
4. [Stack Tecnológica](#-stack-tecnológica)
5. [Modelo de Dados](#-modelo-de-dados)
6. [Como Usamos o Claude Code](#-como-usamos-o-claude-code)
7. [Divisão de Tarefas da Dupla](#-divisão-de-tarefas-da-dupla)
8. [Como Rodar Localmente](#-como-rodar-localmente)
9. [Variáveis de Ambiente](#-variáveis-de-ambiente)
10. [Instruções de Deploy (Vercel + NeonDB)](#-instruções-de-deploy-vercel--neondb)

---

## 🎯 Visão Geral e Problema

Pequenas e Médias Empresas (PMEs) recebem dezenas de contatos diários por formulários de site e WhatsApp, mas sofrem com a falta de triagem rápida:
- Vendedores perdem horas com leads frios (curiosos, propostas de parcerias e estudantes).
- Leads quentes (com dor urgente e orçamento disponível) demoram a ser respondidos e acabam fechando com a concorrência.
- O tempo de resposta (*Speed to Lead*) é o fator decisivo para a conversão de vendas.

---

## 💡 Solução Proposta

O **LeadScore IA** é uma solução *full-stack* moderna que capta contatos comerciais e aciona instantaneamente a **Claude API** para avaliar o potencial do lead com base em critérios de vendas B2B. A IA retorna:
1. **Score Numérico (0 a 100)**: Probabilidade de fechamento comercial.
2. **Classificação Tripla**:
   - 🔥 **Quente** (Score 71 a 100): Alta prioridade, decisor identificado, dor clara e urgência.
   - ⏳ **Morno** (Score 31 a 70): Prioridade média, pesquisando preços e comparando opções.
   - ❄️ **Frio** (Score 0 a 30): Baixa prioridade, mensagens vagas ou perfil fora do alvo.
3. **Justificativa da IA**: Explicação concisa do porquê daquela pontuação.
4. **Resposta Sugerida de Follow-up**: Mensagem personalizada e persuasiva pronta para o vendedor copiar e enviar via WhatsApp ou E-mail.

Tudo é persistido no **Neon Postgres** e exibido em tempo real em um **Painel de Vendas Operacional**.

---

## 🏗️ Arquitetura da Aplicação

```mermaid
flowchart LR
    subgraph Frontend["Frontend (Next.js 16 + Tailwind CSS)"]
        A["Formulário de Captação (/)"]
        B["Painel de Vendas (/painel)"]
    end

    subgraph Backend["Backend (App Router API)"]
        C["POST /api/leads<br/>Validação Zod"]
        D["POST /api/analisar/[leadId]<br/>Motor de Avaliação"]
        E["GET /api/leads<br/>Listagem com Joins"]
    end

    subgraph IA["Inteligência Artificial"]
        F["Claude API<br/>claude-haiku-4-5-20251001<br/>System Prompt B2B"]
        G["Validação JSON com Zod + Retry"]
    end

    subgraph Banco["Banco de Dados Serverless"]
        H[("Neon Postgres<br/>Drizzle ORM")]
        H1[("Tabela leads")]
        H2[("Tabela analises")]
    end

    A -->|"1. Submete contato"| C
    C -->|"2. Insere Lead"| H1
    A -->|"3. Dispara análise"| D
    D -->|"4. Prompt estruturado"| F
    F -->|"5. JSON gerado"| G
    G -->|"6. Salva análise"| H2
    B -->|"7. Consulta leads + análises"| E
    E -->|"8. Retorna dados consolidados"| B
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Motivo da Escolha |
|---|---|---|
| **Framework Full-Stack** | Next.js 16 (App Router) + TypeScript | Front-end e Back-end integrados no mesmo repositório com deploy zero-config na Vercel. |
| **Banco de Dados** | Neon (Serverless Postgres) | Postgres gerenciado em nuvem, rápido, com suporte nativo a branches (`dev-a`, `dev-b`, `main`). |
| **ORM** | Drizzle ORM + Drizzle Kit | Leve, type-safe de ponta a ponta, sem overhead e com migrações simples. |
| **IA no Produto** | Claude API (`claude-haiku-4-5-20251001` / `3.5 Haiku`) | Respostas estruturadas rápidas, com baixo custo e excelente raciocínio comercial. |
| **Validação de Dados** | Zod | Garantia em tempo de execução de esquemas de API e integridade do JSON gerado pela IA. |
| **Estilização** | Tailwind CSS v4 | Produtividade no desenvolvimento de UI responsiva, moderna e limpa. |
| **Ferramenta de IA Dev**| Claude Code | Utilizado para planejamento, scaffolding, geração de rotas e testes guiados por prompts. |
| **Versionamento** | GitHub + GitHub CLI (`gh`) | Gestão com branches protegidas, issues rastreáveis e Pull Requests revisados em dupla. |
| **Deploy** | Vercel | Integração contínua e publicação pública automática acionada via Git push. |

---

## 🗄️ Modelo de Dados

### 1. Tabela `leads`
Armazena as informações brutas do contato recebido.

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  segmento TEXT,
  mensagem TEXT NOT NULL,
  origem TEXT DEFAULT 'site',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Tabela `analises`
Armazena o histórico de análises de IA atreladas ao lead.

```sql
CREATE TABLE analises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 0 AND 100),
  classificacao TEXT CHECK (classificacao IN ('quente','morno','frio')),
  justificativa TEXT,
  resposta_sugerida TEXT,
  modelo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

> **Decisão técnica relevante:** A análise é separada da tabela `leads`. Isso permite manter a idempotência dos dados de contato, armazenar múltiplas versões de análise (histórico de evolução da IA) e possibilita reanalisar um lead a qualquer momento sem sobrescrever dados do cliente.

---

## 🤖 Como Usamos o Claude Code

Seguindo rigorosamente o roteiro pedagógico da FAETERJ Barra Mansa, o Claude Code foi utilizado como assistente de engenharia em 6 etapas sequenciais:

1. **Configuração e Governança (`CLAUDE.md`):**
   - Criação do arquivo de regras estritas: TypeScript rigoroso sem `any`, persistência exclusiva via Drizzle e commits em português.
2. **Persistência de Dados (Quarta-feira):**
   - Prompt: *"Configure o Drizzle ORM com o driver @neondatabase/serverless... Crie o schema com leads e analises... Rota POST /api/leads com validação Zod."*
3. **Engenharia de Prompt e Integração de IA (Quinta-feira):**
   - Prompt: *"Crie src/lib/analisarLead.ts que chama a Claude API com system prompt de especialista em vendas B2B... Valide com Zod, trate erro de parse com retry e crie POST /api/analisar/[leadId]."*
4. **Interface e Frontend (Sexta-feira):**
   - Prompt: *"Crie a página / com o formulário de lead que salva e dispara análise. Crie /painel listando leads com badges coloridos, score e resposta com botão de copiar."*
5. **Testes, Seed e Hardening (Sábado):**
   - Script com 10 leads variados para validação funcional do classificador e checklist pré-deploy.
6. **Documentação e Relatório (Segunda-feira):**
   - Criação do README técnico e estruturação completa do relatório acadêmico de 10 seções.

---

## 👥 Divisão de Tarefas da Dupla

| Integrante | Atribuições Principais |
|---|---|
| **Pessoa A (Back-end, Banco e IA)** | • Schema Drizzle, migrações e conexão NeonDB.<br/>• Rota de análise `POST /api/analisar/[leadId]`.<br/>• System prompt do classificador B2B, validação Zod e estratégia de retry.<br/>• Revisão de Pull Requests da Pessoa B. |
| **Pessoa B (Front-end, Deploy e Docs)** | • Formulário de captação (`/`) e Painel operacional (`/painel`).<br/>• Integração do front-end com as rotas de API.<br/>• Deploy na Vercel e configuração das variáveis de ambiente de produção.<br/>• Elaboração do README, Relatório Acadêmico e gravação da demo. |

---

## 🚀 Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/leadscore-ia.git
cd leadscore-ia
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie o arquivo `.env.local` na raiz do projeto baseado no `.env.example`:
```bash
cp .env.example .env.local
```
Preencha suas credenciais:
```env
DATABASE_URL="postgresql://usuario:senha@ep-xyz.neon.tech/neondb?sslmode=require"
ANTHROPIC_API_KEY="sk-ant-sua-chave-claude"
```

> **Dica de Resiliência:** Caso ainda não tenha a chave da Anthropic ou a URL do Neon configuradas, o sistema executa automaticamente em modo **simulação inteligente local**, permitindo testar a interface e o fluxo completo sem travar o desenvolvimento!

### 4. Executar as migrações do banco (NeonDB)
```bash
npm run db:push
```

### 5. Popular o banco com 10 leads de teste (Seed)
```bash
npm run seed
```

### 6. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse no navegador:
- Formulário de captação: [http://localhost:3000](http://localhost:3000)
- Painel do vendedor: [http://localhost:3000/painel](http://localhost:3000/painel)

---

## 🧪 Comandos Úteis

- `npm run dev`: Inicia o servidor local de desenvolvimento.
- `npm run build`: Valida tipagem TypeScript e gera a build otimizada de produção.
- `npm run lint`: Executa a verificação estrita de linter (ESLint).
- `npm run db:push`: Aplica as alterações do schema Drizzle diretamente no NeonDB.
- `npm run seed`: Executa a inserção e avaliação de 10 leads realistas de teste.

---

## ☁️ Instruções de Deploy (Vercel + NeonDB)

1. Faça o push do repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: projeto pronto para deploy de producao"
   git push origin main
   ```
2. Acesse a [Vercel](https://vercel.com) e importe o repositório `leadscore-ia`.
3. Na seção **Environment Variables**, adicione:
   - `DATABASE_URL`: Connection string do branch `main` do Neon.
   - `ANTHROPIC_API_KEY`: Chave da API Claude gerada no console da Anthropic.
4. Clique em **Deploy**. A cada novo commit na branch `main`, a Vercel executará o build e publicará automaticamente.
