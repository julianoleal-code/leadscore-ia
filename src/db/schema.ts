import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Tabela de Leads
 * Representa os contatos captados pelo formulário público ou canais externos.
 */
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  empresa: text("empresa"),
  segmento: text("segmento"),
  mensagem: text("mensagem").notNull(),
  origem: text("origem").default("site"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Tabela de Análises
 * Salva a avaliação realizada pela Claude API.
 * Decisão técnica: Separada de `leads` para permitir histórico de reavaliações da IA.
 */
export const analises = pgTable("analises", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  score: integer("score"), // 0 a 100
  classificacao: text("classificacao"), // 'quente' | 'morno' | 'frio'
  justificativa: text("justificativa"),
  respostaSugerida: text("resposta_sugerida"),
  modelo: text("modelo"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relacionamentos Drizzle para facilitar joins e queries tipadas
export const leadsRelations = relations(leads, ({ many }) => ({
  analises: many(analises),
}));

export const analisesRelations = relations(analises, ({ one }) => ({
  lead: one(leads, {
    fields: [analises.leadId],
    references: [leads.id],
  }),
}));

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Analise = typeof analises.$inferSelect;
export type NewAnalise = typeof analises.$inferInsert;

