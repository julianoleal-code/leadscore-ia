import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { leads, analises } from "../src/db/schema";
import { analisarLeadComClaude } from "../src/lib/analisarLead";

const leadsDeTeste = [
  // 1. Quente
  {
    nome: "Marcos Andrade",
    email: "marcos@distribuidoravaledoaco.com.br",
    empresa: "Distribuidora Vale do Aço",
    segmento: "Logística & Transporte",
    mensagem:
      "Temos 35 vendedores em campo e estamos perdendo contratos por demora no retorno. Precisamos implantar uma solução de qualificação urgente até o final deste mês. Qual é a disponibilidade para reunião hoje?",
    origem: "site",
  },
  // 2. Quente
  {
    nome: "Carla Mendes",
    email: "carla.mendes@clinicasaudeplena.med.br",
    empresa: "Clínica Saúde Plena",
    segmento: "Saúde & Clínicas",
    mensagem:
      "Nosso WhatsApp recebe mais de 150 mensagens por dia e a recepção não dá conta de priorizar os exames particulares mais caros. Temos orçamento aprovado pela diretoria para contratar já.",
    origem: "whatsapp",
  },
  // 3. Quente
  {
    nome: "Roberto Faria",
    email: "rfaria@techsolutions.io",
    empresa: "Tech Solutions Brasil",
    segmento: "Tecnologia & Software",
    mensagem:
      "Sou o Head de Vendas e quero fechar o contrato ainda essa semana para integrar com o nosso CRM. Me liguem no número cadastrado assim que possível.",
    origem: "site",
  },
  // 4. Quente
  {
    nome: "Patrícia Silveira",
    email: "patricia@oticasvisao.com.br",
    empresa: "Rede Óticas Visão (8 lojas)",
    segmento: "Varejo & E-commerce",
    mensagem:
      "Estamos expandindo para o e-commerce e precisamos filtrar imediatamente os clientes com interesse em armações premium. Gostaria de receber a minuta de proposta comercial.",
    origem: "site",
  },
  // 5. Morno
  {
    nome: "Felipe Nogueira",
    email: "fnogueira@consultoriarh.com.br",
    empresa: "Nogueira & Associados RH",
    segmento: "Serviços",
    mensagem:
      "Gostaria de entender melhor a tabela de preços de vocês para um time pequeno de 3 pessoas. Vocês cobram por usuário ou por volume de leads?",
    origem: "site",
  },
  // 6. Morno
  {
    nome: "Juliana Castro",
    email: "juliana@escolaaprender.edu.br",
    empresa: "Colégio Aprender Sempre",
    segmento: "Educação",
    mensagem:
      "Estamos avaliando fornecedores de automação para o período de matrículas do próximo ano (novembro). Gostaria de agendar uma demonstração sem compromisso.",
    origem: "site",
  },
  // 7. Morno
  {
    nome: "Bruno Albuquerque",
    email: "bruno@emporiomineiro.com.br",
    empresa: "Empório Mineiro Gourmet",
    segmento: "Varejo & E-commerce",
    mensagem:
      "Achei a ferramenta interessante no LinkedIn. Como funciona a integração com o WhatsApp Business? Tem período de teste grátis?",
    origem: "site",
  },
  // 8. Frio
  {
    nome: "Lucas Pereira",
    email: "lucaspereira.estudante@gmail.com",
    empresa: "Universidade",
    segmento: "Educação",
    mensagem:
      "Olá! Sou estudante de Sistemas de Informação e estou fazendo um TCC sobre inteligência artificial em vendas. Vocês poderiam responder um questionário acadêmico de 5 perguntas?",
    origem: "site",
  },
  // 9. Frio
  {
    nome: "Agência Crescimento Rápido",
    email: "parcerias@crescimentorapido.agency",
    empresa: "Agência Crescimento Rápido",
    segmento: "Marketing",
    mensagem:
      "Queremos oferecer serviços de tráfego pago e SEO para alavancar as vendas da sua empresa. Fale com nosso especialista para dobrar seu faturamento.",
    origem: "site",
  },
  // 10. Frio
  {
    nome: "Rodrigo Lima",
    email: "rodrigo99@hotmail.com",
    empresa: "",
    segmento: "Outros",
    mensagem: "Opa, tudo bem? Só passando pra ver como é essa plataforma.",
    origem: "site",
  },
];

async function runSeed() {
  console.log("🚀 [Seed] Iniciando população de 10 leads realistas de teste...");

  const dbUrl = process.env.DATABASE_URL;
  const isDbReady = dbUrl && !dbUrl.includes("placeholder") && dbUrl.startsWith("postgres");

  let dbInstance: ReturnType<typeof drizzle> | null = null;
  if (isDbReady) {
    const client = neon(dbUrl);
    dbInstance = drizzle(client, { schema });
    console.log(" Conectado ao NeonDB com sucesso.");
  } else {
    console.log("⚠️ DATABASE_URL não configurada ou placeholder. Executando simulação de seed local.");
  }

  for (let i = 0; i < leadsDeTeste.length; i++) {
    const l = leadsDeTeste[i];
    console.log(`\n[${i + 1}/10] Processando lead: ${l.nome} (${l.empresa || "Sem empresa"})...`);

    let leadId = crypto.randomUUID();

    if (dbInstance) {
      const [inserted] = await dbInstance
        .insert(leads)
        .values({
          nome: l.nome,
          email: l.email,
          empresa: l.empresa || null,
          segmento: l.segmento || null,
          mensagem: l.mensagem,
          origem: l.origem,
        })
        .returning();
      leadId = inserted.id;
    }

    // Executar análise via Claude API ou mock resiliente
    console.log(`  🤖 Solicitando avaliação da IA para "${l.nome}"...`);
    const { analise, modelo } = await analisarLeadComClaude({
      id: leadId,
      nome: l.nome,
      email: l.email,
      empresa: l.empresa,
      segmento: l.segmento,
      mensagem: l.mensagem,
    });

    console.log(
      `  📊 Resultado: Score ${analise.score} | Classificação: [${analise.classificacao.toUpperCase()}]`
    );
    console.log(`  💡 Justificativa: ${analise.justificativa}`);

    if (dbInstance) {
      await dbInstance.insert(analises).values({
        leadId,
        score: analise.score,
        classificacao: analise.classificacao,
        justificativa: analise.justificativa,
        respostaSugerida: analise.resposta_sugerida,
        modelo,
      });
      console.log(`  💾 Lead e análise salvos no NeonDB.`);
    }
  }

  console.log("\n🎉 [Seed Finalizado com Sucesso!] 10 leads processados e qualificados.");
}

runSeed().catch((err) => {
  console.error("❌ Erro durante a execução do seed:", err);
  process.exit(1);
});

