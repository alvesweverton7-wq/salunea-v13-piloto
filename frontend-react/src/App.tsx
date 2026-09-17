import { useState, type FormEvent } from 'react';
import { Boxes, CalendarDays, CircleDollarSign, LayoutDashboard, Radar, Users } from 'lucide-react';
import { useAuthTenant } from './auth/AuthTenantProvider';
import { ClientsPage } from './clients/ClientsPage';
import { AgendaPage } from './agenda/AgendaPage';
import { AttendancePage } from './attendance/AttendancePage';
import { CashPage } from './cash/CashPage';
import { StockPage } from './stock/StockPage';
import { RadarPage } from './radar/RadarPage';
import './mobile-shell.css';

type Module = 'Inicio' | 'Radar' | 'Agenda' | 'Clientes' | 'Atendimento' | 'Caixa' | 'Estoque';
const modules: [Module, typeof LayoutDashboard][] = [
  ['Inicio', LayoutDashboard], ['Radar', Radar], ['Agenda', CalendarDays], ['Clientes', Users],
  ['Atendimento', Users], ['Caixa', CircleDollarSign], ['Estoque', Boxes],
];

export function App() {
  const auth = useAuthTenant();
  const [active, setActive] = useState<Module>('Inicio');
  const [contextClientId, setContextClientId] = useState<string | null>(null);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setLoginError(null); setLoginError(await auth.signIn(email.trim(), password)); setBusy(false); }
  function navigate(module: Module, clientId: string | null = null) { setContextClientId(clientId); setActive(module); }
  if (auth.status === 'loading') return <div className="gate"><strong>Salúnea</strong><p>Carregando sua sessão…</p></div>;
  if (auth.status === 'signed_out') return <div className="gate"><form className="login" onSubmit={submit}><small>SALÚNEA · GESTÃO SIMPLIFICADA</small><h1>Seu negócio em movimento.</h1><p>Organize clientes, agenda e caixa. O Radar mostra quem merece sua atenção agora.</p><label>E-mail<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>{loginError && <div className="error">Não foi possível entrar. Confira suas credenciais.</div>}</form></div>;
  if (auth.status === 'error') return <div className="gate"><strong>Salúnea</strong><p>{auth.error}</p><button onClick={() => auth.reload()}>Tentar novamente</button></div>;
  const home = <section className="content home-page"><div className="hero"><div><p className="eyebrow">SEU NEGÓCIO · HOJE</p><h1>Não perca quem já escolheu você.</h1><p className="lead">O Salúnea organiza sua operação e transforma o histórico dos seus clientes em ações simples de retorno.</p></div><button className="hero-radar" onClick={() => navigate('Radar')}><Radar size={20}/><span><strong>Abrir Radar</strong><small>Ver quem precisa de atenção</small></span></button></div><div className="home-grid"><article className="home-feature"><div className="feature-icon"><Radar size={22}/></div><p className="eyebrow">CARRO-CHEFE</p><h2>Radar de Clientes</h2><p>O sistema encontra sinais de retorno e mostra quem você pode recuperar agora — com motivo, prioridade e próxima ação.</p><button className="primary" onClick={() => navigate('Radar')}>Ver meu Radar</button></article><article className="home-route"><span className="route-label">COMO O SALÚNEA FUNCIONA</span><div className="route"><b>01</b><strong>Cliente</strong><small>Nome + telefone</small></div><div className="route"><b>02</b><strong>Histórico</strong><small>Recorrência e valor</small></div><div className="route"><b>03</b><strong>Radar</strong><small>Quem precisa de atenção</small></div><div className="route"><b>04</b><strong>Ação</strong><small>Contato e agendamento</small></div></article></div><div className="home-tools"><button onClick={() => navigate('Clientes')}><Users/><span><strong>Clientes</strong><small>Seu principal ativo</small></span></button><button onClick={() => navigate('Agenda')}><CalendarDays/><span><strong>Agenda</strong><small>Seu dia organizado</small></span></button><button onClick={() => navigate('Caixa')}><CircleDollarSign/><span><strong>Caixa</strong><small>Seu dinheiro sob controle</small></span></button></div></section>;
  const page = active === 'Inicio' ? home : active === 'Agenda' ? <AgendaPage initialClientId={contextClientId}/> : active === 'Clientes' ? <ClientsPage focusClientId={contextClientId}/> : active === 'Atendimento' ? <AttendancePage/> : active === 'Caixa' ? <CashPage/> : active === 'Estoque' ? <StockPage/> : <RadarPage onViewClient={id => navigate('Clientes', id)} onSchedule={id => navigate('Agenda', id)}/>;
  const nav = <>{modules.map(([name, Icon]) => <button type="button" onClick={() => navigate(name)} className={active === name ? 'active' : ''} key={name} aria-current={active === name ? 'page' : undefined}><Icon size={18}/><span>{name}</span></button>)}</>;
  return <div className="shell"><aside className="sidebar"><div className="brand"><span>salúnea</span><small>gestão que cuida do retorno</small></div><nav>{nav}</nav><div className="sidebar-footer"><span>OPERANDO EM</span><strong>{auth.company?.trade_name || auth.company?.legal_name || 'Sua empresa'}</strong><small>{auth.unit?.name || 'Selecione a unidade'}</small></div></aside><main><header><div className="mobile-brand"><strong>salúnea</strong><span>{auth.unit?.name || 'Sua operação'}</span></div><div className="tenant-controls">{auth.companies.length > 1 && <select value={auth.company?.id || ''} onChange={e => { setContextClientId(null); void auth.selectCompany(e.target.value); }}>{auth.companies.map(x => <option key={x.id} value={x.id}>{x.trade_name || x.legal_name}</option>)}</select>}{auth.units.length > 1 && <select value={auth.unit?.id || ''} onChange={e => { setContextClientId(null); auth.selectUnit(e.target.value); }}><option value="">Selecione a unidade</option>{auth.units.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}<button onClick={() => void auth.signOut()}>Sair</button></div></header>{auth.status === 'needs_unit' ? <section className="content"><div className="empty-hero"><p className="eyebrow">PRIMEIRO PASSO</p><h1>Escolha sua unidade.</h1><p className="lead">O Salúnea precisa saber em qual operação trabalhar antes de mostrar seus dados.</p></div></section> : page}<nav className="mobile-nav" aria-label="Navegação principal">{nav}</nav></main></div>;
}
