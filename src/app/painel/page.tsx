"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  Snowflake,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  Download,
  Search,
  Building,
  Mail,
  Calendar,
  Sparkles,
  ArrowLeft,
  Tag,
  HelpCircle,
} from "lucide-react";

interface AnaliseData {
  id: string;
  leadId: string;
  score: number | null;
  classificacao: string | null;
  justificativa: string | null;
  respostaSugerida: string | null;
  modelo: string | null;
  createdAt: string;
}

interface LeadWithAnalise {
  id: string;
  nome: string;
  email: string;
  empresa: string | null;
  segmento: string | null;
  mensagem: string;
  origem: string | null;
  createdAt: string;
  analise: AnaliseData | null;
}

export default function PainelPage() {
  const [leads, setLeads] = useState<LeadWithAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [reanalisandoId, setReanalisandoId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filtroClassificacao, setFiltroClassificacao] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  const carregarLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ativo = true;
    fetch("/api/leads")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (ativo) {
          setLeads(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (ativo) {
          console.error("Erro ao carregar leads:", err);
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const handleCopiarResposta = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleReanalisar = async (leadId: string) => {
    try {
      setReanalisandoId(leadId);
      const res = await fetch(`/api/analisar/${leadId}`, {
        method: "POST",
      });
      if (res.ok) {
        await carregarLeads();
      }
    } catch (err) {
      console.error("Erro ao reanalisar:", err);
    } finally {
      setReanalisandoId(null);
    }
  };

  const exportarCSV = () => {
    if (leads.length === 0) return;
    const cabecalho = "Nome,Email,Empresa,Segmento,Mensagem,Score,Classificacao,Data\n";
    const linhas = leads
      .map((item) => {
        const nome = `"${(item.nome || "").replace(/"/g, '""')}"`;
        const email = `"${(item.email || "").replace(/"/g, '""')}"`;
        const empresa = `"${(item.empresa || "").replace(/"/g, '""')}"`;
        const segmento = `"${(item.segmento || "").replace(/"/g, '""')}"`;
        const msg = `"${(item.mensagem || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
        const score = item.analise?.score ?? "";
        const classificacao = item.analise?.classificacao ?? "Pendente";
        const data = new Date(item.createdAt).toLocaleDateString("pt-BR");
        return `${nome},${email},${empresa},${segmento},${msg},${score},${classificacao},${data}`;
      })
      .join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_leadscore_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contadores de métricas
  const contadores = useMemo(() => {
    let quentes = 0;
    let mornos = 0;
    let frios = 0;

    leads.forEach((l) => {
      const cls = l.analise?.classificacao?.toLowerCase();
      if (cls === "quente") quentes++;
      else if (cls === "morno") mornos++;
      else if (cls === "frio") frios++;
    });

    return {
      total: leads.length,
      quentes,
      mornos,
      frios,
    };
  }, [leads]);

  // Lista filtrada
  const leadsFiltrados = useMemo(() => {
    return leads.filter((item) => {
      // Filtro de classificação
      if (filtroClassificacao !== "todos") {
        const cls = item.analise?.classificacao?.toLowerCase() || "pendente";
        if (cls !== filtroClassificacao) return false;
      }

      // Busca por texto
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const nome = (item.nome || "").toLowerCase();
        const email = (item.email || "").toLowerCase();
        const empresa = (item.empresa || "").toLowerCase();
        const msg = (item.mensagem || "").toLowerCase();
        return (
          nome.includes(termo) ||
          email.includes(termo) ||
          empresa.includes(termo) ||
          msg.includes(termo)
        );
      }

      return true;
    });
  }, [leads, filtroClassificacao, busca]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              title="Voltar para a página de captação"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-md">
              LS
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Painel do Vendedor</h1>
              <p className="text-xs text-slate-400">Qualificação inteligente em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg border border-slate-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Novo Lead</span>
            </Link>

            <button
              onClick={carregarLeads}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg border border-slate-700 transition-colors"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Métricas e Cards Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-medium text-slate-400">Total de Leads</div>
            <div className="text-2xl font-bold text-white mt-1">{contadores.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Captados no sistema</div>
          </div>

          <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-4">
            <div className="text-xs font-medium text-rose-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Quentes (Prioridade)
            </div>
            <div className="text-2xl font-bold text-rose-300 mt-1">{contadores.quentes}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Score de 71 a 100</div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-4">
            <div className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Mornos (Em análise)
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-1">{contadores.mornos}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Score de 31 a 70</div>
          </div>

          <div className="bg-slate-900/80 border border-sky-500/20 rounded-xl p-4">
            <div className="text-xs font-medium text-sky-400 flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5" />
              Frios (Nutrição)
            </div>
            <div className="text-2xl font-bold text-sky-300 mt-1">{contadores.frios}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Score de 0 a 30</div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, empresa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setFiltroClassificacao("todos")}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  filtroClassificacao === "todos"
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroClassificacao("quente")}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  filtroClassificacao === "quente"
                    ? "bg-rose-500/20 text-rose-300 font-medium border border-rose-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Quentes
              </button>
              <button
                onClick={() => setFiltroClassificacao("morno")}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  filtroClassificacao === "morno"
                    ? "bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Mornos
              </button>
              <button
                onClick={() => setFiltroClassificacao("frio")}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  filtroClassificacao === "frio"
                    ? "bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Frios
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={exportarCSV}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Lista de Leads */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Carregando contatos e avaliações da IA...</p>
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl py-16 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Nenhum lead encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {busca || filtroClassificacao !== "todos"
                  ? "Nenhum resultado corresponde aos filtros selecionados."
                  : "Ainda não há leads cadastrados. Envie o formulário na página inicial ou execute o seed de testes."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Cadastrar Primeiro Lead
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {leadsFiltrados.map((item) => {
              const analise = item.analise;
              const classificacao = analise?.classificacao?.toLowerCase() || "pendente";
              const score = analise?.score ?? 0;

              // Cores e ícones de acordo com a classificação
              let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
              let badgeIcon = <Sparkles className="w-3.5 h-3.5" />;
              let scoreColor = "text-slate-400";
              let progressBarBg = "bg-slate-600";

              if (classificacao === "quente") {
                badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                badgeIcon = <Flame className="w-3.5 h-3.5 text-rose-500" />;
                scoreColor = "text-rose-400";
                progressBarBg = "bg-gradient-to-r from-orange-500 to-rose-500";
              } else if (classificacao === "morno") {
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                badgeIcon = <Clock className="w-3.5 h-3.5 text-amber-500" />;
                scoreColor = "text-amber-400";
                progressBarBg = "bg-amber-500";
              } else if (classificacao === "frio") {
                badgeColor = "bg-sky-500/10 text-sky-400 border-sky-500/30";
                badgeIcon = <Snowflake className="w-3.5 h-3.5 text-sky-500" />;
                scoreColor = "text-sky-400";
                progressBarBg = "bg-sky-500";
              }

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-5 transition-all shadow-md space-y-4"
                >
                  {/* Topo do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-white">{item.nome}</h3>
                        {item.empresa && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                            <Building className="w-3 h-3 text-slate-400" />
                            {item.empresa}
                          </span>
                        )}
                        {item.segmento && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            <Tag className="w-3 h-3 text-slate-500" />
                            {item.segmento}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {item.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    {/* Classificação e Score */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Score IA</div>
                        <div className={`text-xl font-extrabold ${scoreColor}`}>
                          {analise ? `${score}/100` : "—"}
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider ${badgeColor}`}
                      >
                        {badgeIcon}
                        <span>{classificacao}</span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso do Score */}
                  {analise && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressBarBg}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  )}

                  {/* Mensagem do Lead */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Mensagem do Contato:
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic whitespace-pre-wrap">
                      &ldquo;{item.mensagem}&rdquo;
                    </p>
                  </div>

                  {/* Bloco de Inteligência Artificial */}
                  {analise ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                      {/* Justificativa */}
                      <div className="md:col-span-5 bg-indigo-950/20 border border-indigo-900/30 rounded-lg p-3 space-y-1">
                        <div className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          Justificativa da IA:
                        </div>
                        <p className="text-xs text-indigo-100/90 leading-relaxed">
                          {analise.justificativa}
                        </p>
                        {analise.modelo && (
                          <div className="text-[10px] text-indigo-400/60 pt-1">
                            Modelo: {analise.modelo}
                          </div>
                        )}
                      </div>

                      {/* Resposta Sugerida para o Vendedor */}
                      <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                              Resposta Sugerida de Follow-up:
                            </span>
                            <button
                              onClick={() =>
                                handleCopiarResposta(item.id, analise.respostaSugerida || "")
                              }
                              className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors"
                              title="Copiar mensagem para área de transferência"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-semibold">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Copiar Resposta</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-slate-900/50 p-2.5 rounded border border-slate-800/60">
                            {analise.respostaSugerida}
                          </p>
                        </div>

                        {/* Botão de Reanalisar */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleReanalisar(item.id)}
                            disabled={reanalisandoId === item.id}
                            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                reanalisandoId === item.id ? "animate-spin text-indigo-400" : ""
                              }`}
                            />
                            <span>
                              {reanalisandoId === item.id
                                ? "Reanalisando na Claude API..."
                                : "Reanalisar Lead"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400">
                        Análise pendente para este contato.
                      </span>
                      <button
                        onClick={() => handleReanalisar(item.id)}
                        disabled={reanalisandoId === item.id}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {reanalisandoId === item.id ? "Analisando..." : "Qualificar com IA"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>LeadScore IA — FAETERJ Barra Mansa · Inteligência Artificial (Prof. Vinicius)</p>
      </footer>
    </div>
  );
}

