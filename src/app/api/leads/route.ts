import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { leads, analises } from "@/db/schema";
import { desc } from "drizzle-orm";

// Schema de validação Zod para o body do Lead
export const leadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Endereço de e-mail inválido"),
  empresa: z.string().optional().nullable(),
  segmento: z.string().optional().nullable(),
  mensagem: z.string().min(5, "Mensagem deve ter pelo menos 5 caracteres"),
  origem: z.string().default("site").optional(),
});

// Mock em memória para desenvolvimento offline caso NeonDB não esteja configurado
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
 * POST /api/leads
 * Valida os dados de entrada com Zod e persiste um novo lead no banco
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = leadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nome, email, empresa, segmento, mensagem, origem } = parsed.data;

    if (isDatabaseConfigured()) {
      const [insertedLead] = await db
        .insert(leads)
        .values({
          nome,
          email,
          empresa: empresa || null,
          segmento: segmento || null,
          mensagem,
          origem: origem || "site",
        })
        .returning();

      return NextResponse.json(insertedLead, { status: 201 });
    }

    // Fallback Mock se banco não configurado ainda
    const fallbackLead: typeof leads.$inferSelect = {
      id: crypto.randomUUID(),
      nome,
      email,
      empresa: empresa || null,
      segmento: segmento || null,
      mensagem,
      origem: origem || "site",
      createdAt: new Date(),
    };
    const store = getMockStore();
    store.unshift({ lead: fallbackLead, analise: null });

    return NextResponse.json(fallbackLead, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar lead:", error);
    return NextResponse.json(
      { error: "Erro interno ao cadastrar lead" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads
 * Retorna todos os leads cadastrados com suas respectivas análises
 */
export async function GET() {
  try {
    if (isDatabaseConfigured()) {
      // Buscar leads ordenados por data de criação desc
      const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
      const allAnalises = await db.select().from(analises).orderBy(desc(analises.createdAt));

      // Mapear a análise mais recente de cada lead
      const result = allLeads.map((lead) => {
        const leadAnalise = allAnalises.find((a) => a.leadId === lead.id) || null;
        return {
          ...lead,
          analise: leadAnalise,
        };
      });

      return NextResponse.json(result);
    }

    // Retornar dados mockados caso banco ainda não esteja conectado
    const mockList = getMockStore().map((item) => ({
      ...item.lead,
      analise: item.analise,
    }));

    return NextResponse.json(mockList);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar leads" },
      { status: 500 }
    );
  }
}

