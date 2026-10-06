import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads, analises } from "@/db/schema";
import { eq } from "drizzle-orm";
import { analisarLeadComClaude } from "@/lib/analisarLead";

type MockLeadItem = {
  lead: typeof leads.$inferSelect;
  analise: typeof analises.$inferSelect | null;
};

const getMockStore = (): MockLeadItem[] => {
  const g = globalThis as unknown as { __mockLeadsStore?: MockLeadItem[] };
  if (!g.__mockLeadsStore) {
    g.__mockLeadsStore = [];
  }
  return g.__mockLeadsStore;
};

const isDatabaseConfigured = () => {
  const url = process.env.DATABASE_URL;
  return Boolean(url && !url.includes("placeholder") && url.startsWith("postgres"));
};

/**
 * POST /api/analisar/[leadId]
 * Analisa o lead correspondente com a Claude API e persiste o resultado em 'analises'.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;

    if (!leadId) {
      return NextResponse.json(
        { error: "Identificador do lead não informado." },
        { status: 400 }
      );
    }

    let leadData: typeof leads.$inferSelect | undefined;

    if (isDatabaseConfigured()) {
      const found = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      leadData = found[0];
    } else {
      const mockItem = getMockStore().find((item) => item.lead.id === leadId);
      leadData = mockItem?.lead;
    }

    if (!leadData) {
      return NextResponse.json(
        { error: `Lead com ID ${leadId} não encontrado.` },
        { status: 404 }
      );
    }

    // Executa análise via Claude API (com prompt B2B e validação Zod)
    const { analise, modelo } = await analisarLeadComClaude(leadData);

    if (isDatabaseConfigured()) {
      const [novaAnalise] = await db
        .insert(analises)
        .values({
          leadId: leadData.id,
          score: analise.score,
          classificacao: analise.classificacao,
          justificativa: analise.justificativa,
          respostaSugerida: analise.resposta_sugerida,
          modelo,
        })
        .returning();

      return NextResponse.json(novaAnalise, { status: 201 });
    }

    // Fallback Mock
    const mockAnaliseRow: typeof analises.$inferSelect = {
      id: crypto.randomUUID(),
      leadId: leadData.id,
      score: analise.score,
      classificacao: analise.classificacao,
      justificativa: analise.justificativa,
      respostaSugerida: analise.resposta_sugerida,
      modelo,
      createdAt: new Date(),
    };

    const store = getMockStore();
    const targetIndex = store.findIndex((item) => item.lead.id === leadId);
    if (targetIndex >= 0) {
      store[targetIndex].analise = mockAnaliseRow;
    }

    return NextResponse.json(mockAnaliseRow, { status: 201 });
  } catch (error) {
    console.error("Erro ao analisar lead:", error);
    return NextResponse.json(
      { error: "Erro interno durante a análise do lead." },
      { status: 500 }
    );
  }
}

