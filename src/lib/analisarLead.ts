import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Schema estrito de validação da saída da IA
export const AnaliseIaSchema = z.object({
  score: z.number().int().min(0).max(100),
  classificacao: z.enum(["quente", "morno", "frio"]),
  justificativa: z.string().min(5),
  resposta_sugerida: z.string().min(10),
});

export type AnaliseIaResult = z.infer<typeof AnaliseIaSchema>;

export interface LeadParaAnalise {
  id: string;
  nome: string;
  email: string;
  empresa?: string | null;
  segmento?: string | null;
  mensagem: string;
}

const SYSTEM_PROMPT = `Você é um especialista em vendas B2B e qualificação de leads (SDR/BDR Senior) para Pequenas e Médias Empresas (PMEs).
Sua missão é analisar o contato recebido, atribuir uma nota de potencial comercial, classificar a prioridade e gerar a resposta ideal para o vendedor fechar negócio.

Critérios de Avaliação:
- QUENTE (score 71 a 100): Alta urgência, dor explícita, decisor identificado, interesse imediato em fechar ou contratar solução.
- MORNO (score 31 a 70): Interesse genuíno, mas está cotando preços, em fase de descoberta ou sem prazo imediato definido.
- FRIO (score 0 a 30): Mensagem vaga, estudante, proposta de parceria/venda inversa, ou curiosidade sem intenção real de compra.

Regras Estritas de Saída:
Responda EXCLUSIVAMENTE em formato JSON puro, sem blocos de código com markdown desnecessário e sem texto antes ou depois.
Estrutura obrigatória:
{
  "score": <número inteiro entre 0 e 100>,
  "classificacao": "<quente | morno | frio>",
  "justificativa": "<resumo do motivo da nota com foco prático no vendedor>",
  "resposta_sugerida": "<mensagem personalizada e cordial para WhatsApp ou E-mail, já pronta para envio>"
}`;

/**
 * Função de classificação de fallback caso a chave da Anthropic não esteja configurada no ambiente.
 * Garante que o projeto continue funcional conforme Seção 12 (Riscos e Prevenção).
 */
function gerarAnaliseMock(lead: LeadParaAnalise): AnaliseIaResult {
  const texto = `${lead.mensagem} ${lead.empresa ?? ""} ${lead.segmento ?? ""}`.toLowerCase();
  
  if (
    texto.includes("urgente") ||
    texto.includes("fechar") ||
    texto.includes("implantar") ||
    texto.includes("orçamento") ||
    texto.includes("proposta") ||
    texto.includes("contratar")
  ) {
    return {
      score: 92,
      classificacao: "quente",
      justificativa:
        "O lead demonstrou alta intenção de contratação, com termos indicando urgência e prontidão para receber proposta comercial.",
      resposta_sugerida: `Olá ${lead.nome}! Muito obrigado pelo contato. Vi que você tem interesse prioritário na nossa solução. Tenho horários disponíveis hoje às 14h ou 16h para alinharmos os detalhes e montar sua proposta. Qual horário fica melhor para você?`,
    };
  }

  if (
    texto.includes("preço") ||
    texto.includes("valores") ||
    texto.includes("como funciona") ||
    texto.includes("dúvida") ||
    texto.includes("funcionalidade")
  ) {
    return {
      score: 55,
      classificacao: "morno",
      justificativa:
        "Lead em fase de consideração buscando entender valores e dinâmica de funcionamento. Potencial interesse para maturação.",
      resposta_sugerida: `Olá ${lead.nome}! Tudo bem? Agradecemos o interesse. Posso te enviar uma apresentação rápida com os formatos e tabela de valores, ou se preferir bater um papo rápido de 10 minutinhos. Como prefere seguir?`,
    };
  }

  return {
    score: 20,
    classificacao: "frio",
    justificativa:
      "Mensagem genérica ou exploratória sem sinais claros de necessidade de compra no curto prazo.",
    resposta_sugerida: `Olá ${lead.nome}, obrigado pelo contato! Separei aqui um material com nossos principais casos de uso. Caso surja alguma demanda específica para sua empresa, estamos à total disposição.`,
  };
}

/**
 * Analisa um lead via Claude API (ou retry / mock resiliente)
 */
export async function analisarLeadComClaude(
  lead: LeadParaAnalise
): Promise<{ analise: AnaliseIaResult; modelo: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modeloPrincipal = "claude-haiku-4-5-20251001";
  const modeloAlternativo = "claude-3-5-haiku-20241022";

  // Se não houver chave real da Anthropic configurada, usar classificador resiliente
  if (!apiKey || apiKey.includes("placeholder") || !apiKey.startsWith("sk-ant")) {
    console.warn(
      "⚠️ [LeadScore IA] ANTHROPIC_API_KEY não configurada. Usando classificador inteligente em modo simulação."
    );
    return {
      analise: gerarAnaliseMock(lead),
      modelo: "claude-haiku-mock",
    };
  }

  const anthropic = new Anthropic({ apiKey });

  const userContent = `Analise este lead:
Nome: ${lead.nome}
E-mail: ${lead.email}
Empresa: ${lead.empresa || "Não informada"}
Segmento: ${lead.segmento || "Não informado"}
Mensagem/Necessidade: ${lead.mensagem}

Lembre-se: Retorne APENAS o JSON válido.`;

  // Função interna que tenta chamar a API e validar com Zod
  const tentarAnalise = async (modeloUsado: string, isRetry = false): Promise<AnaliseIaResult> => {
    const response = await anthropic.messages.create({
      model: modeloUsado,
      max_tokens: 600,
      system: isRetry
        ? `${SYSTEM_PROMPT}\nATENÇÃO: Sua resposta anterior não pôde ser lida como JSON. Responda ESTRITAMENTE com a sintaxe JSON válida, sem crases de código markdown e sem nenhum texto adicional.`
        : SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      throw new Error("Resposta da IA não contém bloco de texto");
    }

    let textoLimpo = block.text.trim();
    // Remover possíveis blocos ```json ... ``` caso a IA inclua markdown
    if (textoLimpo.startsWith("```")) {
      textoLimpo = textoLimpo.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    const parsedJson = JSON.parse(textoLimpo);
    const validado = AnaliseIaSchema.parse(parsedJson);
    return validado;
  };

  // Primeira tentativa
  try {
    const analise = await tentarAnalise(modeloPrincipal, false);
    return { analise, modelo: modeloPrincipal };
  } catch (error) {
    console.warn("Primeira tentativa com Claude API falhou, tentando retry com nova instrução...", error);
    try {
      // Retry com modelo haiku
      const analise = await tentarAnalise(modeloAlternativo, true);
      return { analise, modelo: modeloAlternativo };
    } catch (retryError) {
      console.error("Falha após retry com a Claude API:", retryError);
      // Fallback seguro em caso de timeout/cota da API para não quebrar a aplicação
      return {
        analise: gerarAnaliseMock(lead),
        modelo: "fallback-resilient",
      };
    }
  }
}

