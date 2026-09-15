import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  Package, 
  BarChart3, 
  Settings, 
  Bell, 
  Menu, 
  X,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', name: 'Agenda', icon: Calendar },
    { id: 'clientes', name: 'Clientes', icon: Users },
    { id: 'atendimento', name: 'Atendimento', icon: Scissors },
    { id: 'caixa', name: 'Caixa', icon: DollarSign },
    { id: 'radar', name: 'Radar / Estoque', icon: Package },
    { id: 'relatorios', name: 'Relatórios', icon: BarChart3 },
    { id: 'configuracoes', name: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row w-full h-full">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-4 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950">S</div>
            <div>
              <h1 className="font-bold tracking-wider text-lg">SALÚNEA</h1>
              <p className="text-xs text-slate-400">Gestão Inteligente v13</p>
            </div>
          </div>

          <nav className="space-y-1">
            {modules.map((m) => {
              const Icon = m.icon;
              const active = currentModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setCurrentModule(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {m.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Unidade Principal</p>
          <p className="text-emerald-400 flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sincronizado
          </p>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm">S</div>
          <span className="font-bold text-base">SALÚNEA</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Menu Mobile Expandido */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1">
          {modules.map((m) => {
            const Icon = m.icon;
            const active = currentModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setCurrentModule(m.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                  active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                {m.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold capitalize text-slate-100">{currentModule.replace('-', ' / ')}</h2>
            <p className="text-xs text-slate-400">Visão geral e controle em tempo real do salão</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
            </button>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">Ana Souza</p>
              <p className="text-[10px] text-slate-400">Admin / Gestor</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {currentModule === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Produção Hoje</p>
                  <h3 className="text-2xl font-bold mt-2 text-slate-100">R$ 2.845,00</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2 font-medium">
                    <TrendingUp size={14} /> +12% vs. média
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Recebido</p>
                  <h3 className="text-2xl font-bold mt-2 text-slate-100">R$ 2.640,00</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2 font-medium">
                    <TrendingUp size={14} /> +10% confirmado
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Em Aberto</p>
                  <h3 className="text-2xl font-bold mt-2 text-slate-100">R$ 205,00</h3>
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-2 font-medium">
                    <Clock size={14} /> 2 comandas
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">Ocupação da Agenda</p>
                  <h3 className="text-2xl font-bold mt-2 text-slate-100">78%</h3>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">Visão Executiva</span>
                  <h3 className="text-2xl font-bold text-white">Seu salão, mais claro.</h3>
                  <p className="text-sm text-slate-400 max-w-xl">Acompanhe o que merece atenção imediata, controle o estoque crítico e tome decisões com segurança baseada em dados reais.</p>
                </div>
                <button 
                  onClick={() => setCurrentModule('radar')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  Ver Radar Beta
                </button>
              </div>
            </div>
          )}

          {currentModule !== 'dashboard' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center py-16">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-white capitalize">Módulo {currentModule}</h3>
              <p className="text-sm text-slate-400 mt-2">Estrutura pronta para integração com tabelas do Supabase e fluxo operacional.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
