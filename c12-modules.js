(() => {
    "use strict";

    const { useState } = React;
    const { createRoot } = ReactDOM;

    function App() {
        const [currentModule, setCurrentModule] = useState('dashboard');

        return (
            React.createElement("div", { className: "min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white" },
                
                // Header Corporativo Fixo
                React.createElement("header", { className: "bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md" },
                    React.createElement("div", { className: "flex items-center gap-3" },
                        React.createElement("div", { className: "w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-900/40" }, "S"),
                        React.createElement("div", null,
                            React.createElement("h1", { className: "text-lg font-bold tracking-tight text-white leading-none" }, "Salúnea v13"),
                            React.createElement("span", { className: "text-xs text-emerald-400 font-medium" }, "Clean Core Enterprise")
                        )
                    ),
                    React.createElement("div", { className: "flex items-center gap-4 text-sm text-slate-400" },
                        React.createElement("span", { className: "hidden sm:inline bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50" }, "Unidade Principal"),
                        React.createElement("div", { className: "w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-semibold" }, "W")
                    )
                ),

                // Conteúdo Principal Dinâmico
                React.createElement("main", { className: "flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28" },
                    
                    // Alerta de Sincronização
                    React.createElement("div", { className: "mb-6 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4 flex items-center gap-3 text-emerald-300 text-sm shadow-sm" },
                        React.createElement("svg", { className: "w-5 h-5 text-emerald-400 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                            React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
                        ),
                        React.createElement("span", null, "Sistema sincronizado em tempo real com o Clean Core e pronto para produção.")
                    ),

                    // Renderização Condicional dos Módulos
                    currentModule === 'dashboard' ? (
                        React.createElement("div", { className: "space-y-6" },
                            // Hero Banner
                            React.createElement("div", { className: "bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden" },
                                React.createElement("div", { className: "absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" }),
                                React.createElement("div", { className: "relative z-10 max-w-2xl" },
                                    React.createElement("span", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full inline-block mb-4" }, "Visão Executiva"),
                                    React.createElement("h2", { className: "text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2" }, "Seu salão, mais claro."),
                                    React.createElement("p", { className: "text-slate-400 text-sm sm:text-base mb-6" }, "Acompanhe o fluxo operacional, agendamentos e métricas críticas com total segurança e alta performance."),
                                    React.createElement("button", { 
                                        onClick: () => alert("Radar Beta ativado com sucesso!"),
                                        className: "bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 text-sm"
                                    }, "Ver Radar Beta")
                                )
                            ),

                            // Grid de Métricas Rápidas
                            React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" },
                                React.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm" },
                                    React.createElement("span", { className: "text-xs font-medium text-slate-400 uppercase tracking-wider" }, "Produção Hoje"),
                                    React.createElement("div", { className: "text-2xl font-bold text-white mt-2" }, "R$ 0,00"),
                                    React.createElement("span", { className: "text-xs text-slate-500 mt-1 block" }, "Aguardando sincronização")
                                ),
                                React.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm" },
                                    React.createElement("span", { className: "text-xs font-medium text-slate-400 uppercase tracking-wider" }, "Agenda Ativa"),
                                    React.createElement("div", { className: "text-2xl font-bold text-white mt-2" }, "0 horários"),
                                    React.createElement("span", { className: "text-xs text-emerald-400 mt-1 block" }, "Operando normalmente")
                                ),
                                React.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm sm:col-span-2 lg:col-span-1" },
                                    React.createElement("span", { className: "text-xs font-medium text-slate-400 uppercase tracking-wider" }, "Status do Core"),
                                    React.createElement("div", { className: "text-2xl font-bold text-emerald-400 mt-2" }, "v13 Online"),
                                    React.createElement("span", { className: "text-xs text-slate-500 mt-1 block" }, "Deploy Vercel bem-sucedido")
                                )
                            )
                        )
                    ) : (
                        React.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto mt-10 shadow-xl" },
                            React.createElement("div", { className: "w-16 h-16 bg-emerald-950 text-emerald-400 rounded-2xl border border-emerald-800 flex items-center justify-center mx-auto mb-4 text-2xl font-bold" }, "✓"),
                            React.createElement("h3", { className: "text-xl font-bold text-white capitalize mb-2" }, `Módulo ${currentModule}`),
                            React.createElement("p", { className: "text-slate-400 text-sm mb-6" }, "Estrutura isolada e pronta para receber os fluxos operacionais e tabelas do Supabase."),
                            React.createElement("button", { 
                                onClick: () => setCurrentModule('dashboard'),
                                className: "bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm transition-all border border-slate-700"
                            }, "Voltar ao Dashboard")
                        )
                    )
                ),

                // Barra de Navegação Inferior Fixa (Clean & Responsiva)
                React.createElement("nav", { className: "fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-3 px-4 z-40 shadow-2xl" },
                    React.createElement("div", { className: "max-w-md mx-auto flex justify-around items-center" },
                        ['dashboard', 'agenda', 'clientes', 'financeiro'].map((mod) => {
                            const isActive = currentModule === mod;
                            return React.createElement("button", {
                                key: mod,
                                onClick: () => setCurrentModule(mod),
                                className: `px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all capitalize ${
                                    isActive 
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                }`
                            }, mod);
                        })
                    )
                )
            )
        );
    }

    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(React.createElement(App));
    }
})();
