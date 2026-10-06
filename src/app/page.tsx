"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  User,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Home() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    segmento: "Tecnologia & Software",
    mensagem: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [leadCriadoId, setLeadCriadoId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage("Salvando informações do contato...");

    try {
      // 1. Salvar Lead no banco
      const resLead = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!resLead.ok) {
        const errorData = await resLead.json();
        throw new Error(
          errorData.details
            ? Object.values(errorData.details).flat().join(", ")
            : errorData.error || "Erro ao salvar lead"
        );
      }

      const lead = await resLead.json();
      setLeadCriadoId(lead.id);

      // 2. Disparar análise via Claude API
      setStatusMessage("Qualificando o lead com Claude API...");
      const resAnalise = await fetch(`/api/analisar/${lead.id}`, {
        method: "POST",
      });

      if (!resAnalise.ok) {
        console.warn("Aviso: Falha ao disparar análise imediata, o lead foi salvo com sucesso.");
      }

      setStatusMessage("Lead captado e qualificado pela IA com sucesso!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Ocorreu um erro inesperado ao enviar o formulário.");
      }
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nome: "",
      email: "",
      empresa: "",
      segmento: "Tecnologia & Software",
      mensagem: "",
    });
    setLeadCriadoId(null);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-indigo-500/20">
              LS
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                LeadScore IA
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                FAETERJ Barra Mansa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/painel"
              className="inline-flex items-center gap-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              Acessar Painel de Vendas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Coluna Esquerda: Contexto & Proposta de Valor */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Qualificador Inteligente B2B com Claude API
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Fale com nossos especialistas comerciais
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">
            Preencha o formulário ao lado com as necessidades da sua empresa. Nosso sistema
            analisa automaticamente o perfil do contato com Inteligência Artificial para
            oferecer o melhor atendimento em tempo recorde.
          </p>

          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Classificação Instantânea</h4>
                <p className="text-xs text-slate-400">
                  Cada lead recebe nota de 0 a 100 e status (Quente, Morno ou Frio) em segundos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Follow-up Sob Medida</h4>
                <p className="text-xs text-slate-400">
                  A IA redige a abordagem ideal pronta para o vendedor enviar via WhatsApp ou E-mail.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Captação */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {leadCriadoId ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Lead Enviado com Sucesso!</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {statusMessage ||
                    "O lead foi registrado no NeonDB e classificado pela Claude API."}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/painel"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Visualizar no Painel de Vendas
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto text-sm text-slate-400 hover:text-white px-5 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-800/60 transition-colors"
                >
                  Cadastrar outro lead
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white">Formulário de Contato</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Os dados preenchidos serão salvos no banco de dados e qualificados pela IA.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: carlos@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Inova Logística"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Segmento / Setor
                  </label>
                  <select
                    value={formData.segmento}
                    onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Tecnologia & Software">Tecnologia & Software</option>
                    <option value="Varejo & E-commerce">Varejo & E-commerce</option>
                    <option value="Logística & Transporte">Logística & Transporte</option>
                    <option value="Serviços Financeiros">Serviços Financeiros</option>
                    <option value="Saúde & Clínicas">Saúde & Clínicas</option>
                    <option value="Educação">Educação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mensagem ou Necessidade do Projeto *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Conte um pouco sobre o que sua empresa busca, urgência de implantação e objetivos..."
                  value={formData.mensagem}
                  onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-400 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{statusMessage || "Processando..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Contato e Analisar com IA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>LeadScore IA — FAETERJ Barra Mansa · Inteligência Artificial (Prof. Vinicius)</p>
        <p className="mt-1">Desenvolvido com Next.js, Claude API, Drizzle ORM e NeonDB</p>
      </footer>
    </div>
  );
}
