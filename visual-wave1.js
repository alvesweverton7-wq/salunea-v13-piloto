(() => {
  "use strict";
  const app = document.getElementById("app");
  if (!app || document.getElementById("visualWave1Sidebar")) return;
  const style = document.createElement("style");
  style.textContent = `
    :root { --vw-deep:#153b36; --vw-cream:#f7f4ee; --vw-paper:#fbfaf6; --vw-coral:#f3b49f; --vw-green:#39796b; --vw-line:#e7e2d8; --vw-muted:#718078; }
    #visualWave1Sidebar { display:flex; position:fixed; z-index:20; inset:0 auto 0 0; width:244px; background:var(--vw-deep); color:#e9eee8; padding:25px 14px 18px; flex-direction:column; }
    #visualWave1Sidebar .vw-logo { display:flex; align-items:center; gap:10px; margin:0 10px 28px; }
    #visualWave1Sidebar .vw-mark { width:30px; height:30px; display:grid; place-items:center; color:var(--vw-deep); background:var(--vw-coral); border-radius:10px 10px 10px 3px; font:700 19px Georgia,serif; }
    #visualWave1Sidebar .vw-brand { font-size:23px; font-weight:800; letter-spacing:-.04em; }
    #visualWave1Sidebar .vw-sub { display:block; color:#a9bdb5; font-size:10px; margin-top:1px; }
    #visualWave1Sidebar .vw-nav { position:static; width:100%; min-height:0; margin:0; padding:0; background:transparent; border:0; display:grid; grid-template-columns:1fr; gap:4px; }
    #visualWave1Sidebar button { width:100%; border:0; border-radius:8px; background:transparent; color:#dce7e1; padding:11px 12px; text-align:left; font:700 12px/1.2 Manrope,system-ui,sans-serif; cursor:pointer; min-height:0; }
    #visualWave1Sidebar button:hover { background:#ffffff0d; }
    #visualWave1Sidebar button.active { background:#ffffff12; color:#fff; box-shadow:inset 2px 0 var(--vw-coral); }
    #visualWave1Sidebar .vw-ico { display:inline-block; width:23px; margin-right:8px; text-align:center; font-size:16px; vertical-align:-1px; }
    #visualWave1Sidebar .vw-spacer { flex:1; }
    #visualWave1Sidebar .vw-foot { border-top:1px solid #ffffff18; padding:15px 10px 0; color:#a9bdb5; font-size:10px; line-height:1.45; }
    #app .new, #app .fab { background:var(--vw-green); color:#fff; border-radius:8px; padding:11px 15px; font-weight:800; border:0; }
    #app .section.head h3, #app #caixa h3, #app #mais h3, #app #radar h3, #app #estoque h3 { color:var(--vw-deep); letter-spacing:-.04em; }
    #app #agendaFull, #app #inicio #agendaList, #app #radar .prepilot-card, #app #estoque .prepilot-card, #app .account-card { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:12px; box-shadow:0 10px 30px rgba(25,50,38,.055); }
    #app #radar .prepilot-card { border-left:5px solid var(--vw-coral); }
    #app #radar .prepilot-badge { border-radius:99px; padding:6px 9px; background:#e8f0e7; color:var(--vw-green); font-size:11px; font-weight:800; }
    #app .appt { display:grid; grid-template-columns:62px minmax(0,1fr) auto; gap:14px; align-items:center; padding:15px 4px; border-bottom:1px solid var(--vw-line); }
    #app .appt:last-child { border-bottom:0; }
    #app .appt time { font-size:17px; font-weight:800; color:var(--vw-deep); }
    #app .appt .status { border-radius:99px; padding:6px 9px; background:#e8f0e7; color:var(--vw-green); font-size:10px; font-weight:800; white-space:nowrap; }
    #app .opbtn { background:#f5e3dc; color:#8d594b; border:0; border-radius:8px; padding:8px 10px; font-size:11px; font-weight:800; }
    #app .appt.vw-done { border-left:4px solid var(--vw-green); padding-left:12px; }
    #app .appt.vw-pending { border-left:4px solid #e1bf7c; padding-left:12px; }
    #app .appt.vw-conflict { border-left:4px solid #e7a18d; padding-left:12px; background:#fbf0eb; }
    #app .modal { background:#1b2b25a8; backdrop-filter:blur(5px); }
    #app .modal .sheet { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:14px; box-shadow:0 25px 80px rgba(25,45,36,.2); }
    #app .wa-manual { background:#edf2eb; border:1px solid #dae6d8; border-radius:10px; }
    @media (min-width:901px) {
      html, body { width:100%; min-width:0; background:var(--vw-cream) !important; overflow-x:hidden; }
      body { margin:0 !important; }
      #app.app, #app { max-width:none !important; width:calc(100% - 244px) !important; margin:0 0 0 244px !important; padding:0 0 48px !important; background:var(--vw-cream) !important; min-height:100vh; overflow:visible !important; }
      #app > header { width:100%; height:70px !important; padding:0 clamp(24px,3vw,42px) !important; background:#fbfaf6 !important; border-bottom:1px solid var(--vw-line) !important; }
      #app > nav { display:none !important; }
      #app > .screen { width:100%; max-width:1440px; margin:0 auto; padding:34px clamp(24px,3vw,42px) 55px; }
      #app > .screen > .section, #app > .screen > .hero, #app > .screen > .metrics, #app > .screen > .search, #app > .screen > .radar { max-width:none !important; }
      #app #inicio .hero { margin:0 0 20px !important; border-radius:14px !important; background:var(--vw-deep) !important; color:#fff !important; padding:30px 32px !important; box-shadow:none; }
      #app #inicio .hero h2 { font-family:Georgia,'Times New Roman',serif; font-size:clamp(34px,4vw,52px); font-weight:600; letter-spacing:-.045em; line-height:1.02; margin:8px 0 10px; }
      #app #inicio .hero p { color:#b8cbc0 !important; max-width:620px; font-size:14px; line-height:1.55; }
      #app #inicio .hero button { background:var(--vw-coral); color:#473129; border-radius:8px; padding:11px 15px; font-weight:800; }
      #app #inicio .metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:13px; padding:0 !important; margin:0 0 20px; }
      #app #inicio .metrics .card { border-radius:11px !important; border:1px solid var(--vw-line); box-shadow:none !important; padding:18px; min-width:0; }
      #app #inicio .metrics .card strong { display:block; font-family:Georgia,'Times New Roman',serif; color:var(--vw-deep); font-size:29px; margin-top:12px; letter-spacing:-.035em; }
      #app .section { padding:20px 0 8px !important; }
      #app .search { margin:12px 0 !important; }
      #app .radar { margin:20px 0 !important; }
      #app #agendaFull { padding:12px 18px; }
      #app #radar .prepilot-grid, #app #estoque .prepilot-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:13px; }
    }
    @media (max-width:900px) {
      #visualWave1Sidebar { display:none; }
      #app.app, #app { width:100% !important; max-width:860px !important; margin:0 auto !important; padding-left:0 !important; }
    }
    @media (max-width:600px) {
      #app .appt { grid-template-columns:48px minmax(0,1fr); gap:10px; }
      #app .appt .status { grid-column:2; width:max-content; }
      #app .modal .sheet { width:calc(100% - 32px); max-height:calc(100vh - 32px); overflow:auto; }
    }
  `;
  document.head.appendChild(style);
  const aside = document.createElement("aside");
  aside.id = "visualWave1Sidebar";
  aside.innerHTML = `
    <div class="vw-logo"><div class="vw-mark">S</div><div><div class="vw-brand">Salúnea</div><span class="vw-sub">Gestão de salão</span></div></div>
    <div class="vw-nav" role="navigation" aria-label="Navegação principal">
      <button data-vw="inicio" data-go="inicio"><span class="vw-ico">▣</span>Dashboard</button>
      <button data-vw="agenda" data-go="agenda"><span class="vw-ico">▦</span>Agenda</button>
      <button data-vw="clientes" data-go="clientes"><span class="vw-ico">♙</span>Clientes</button>
      <button data-vw="atendimento" data-go="atendimento"><span class="vw-ico">✂</span>Atendimento</button>
      <button data-vw="caixa" data-go="caixa"><span class="vw-ico">▤</span>Financeiro</button>
      <button data-vw="estoque" data-go="estoque"><span class="vw-ico">◇</span>Estoque</button>
      <button data-vw="relatorios" data-go="relatorios"><span class="vw-ico">▥</span>Relatórios</button>
      <button data-vw="radar" data-go="radar"><span class="vw-ico">✦</span>Radar beta</button>
      <button data-vw="mais" data-go="mais"><span class="vw-ico">⋯</span>Mais</button>
    </div>
    <div class="vw-spacer"></div>
    <div class="vw-nav" role="navigation" aria-label="Configurações"><button data-vw="configuracoes" data-go="configuracoes"><span class="vw-ico">⚙</span>Configurações</button></div>
    <div class="vw-foot">Piloto controlado gratuito<br><span id="visualWave1Tenant">Unidade ativa</span></div>
  `;
  app.prepend(aside);
  const tenantSource = document.getElementById("tenantLabel");
  const tenantTarget = document.getElementById("visualWave1Tenant");
  const syncTenant = () => { tenantTarget.textContent = tenantSource?.textContent?.trim() || "Unidade ativa"; };
  if (tenantSource) new MutationObserver(syncTenant).observe(tenantSource,{childList:true,characterData:true,subtree:true});
  syncTenant();
  const sync = (id) => aside.querySelectorAll("button[data-vw]").forEach((b) => b.classList.toggle("active", b.dataset.vw === id));
  const originalGo = window.go;
  window.go = function(id) { const result = originalGo ? originalGo.apply(this, arguments) : undefined; sync(id); setTimeout(decorateAgenda,0); return result; };
  aside.querySelectorAll("button[data-vw]").forEach((b) => b.addEventListener("click", () => window.go(b.dataset.vw)));
  function decorateAgenda() {
    document.querySelectorAll("#agendaList .appt, #agendaFull .appt").forEach((row) => {
      const label=row.querySelector(".status"); if(!label) return;
      const text=label.textContent.toLowerCase(); row.classList.remove("vw-conflict","vw-pending","vw-done");
      if(text.includes("conclu")||text.includes("confirm")) row.classList.add("vw-done");
      else if(text.includes("cancel")||text.includes("conflit")) row.classList.add("vw-conflict");
      else row.classList.add("vw-pending");
    });
  }
  [document.getElementById("agendaList"),document.getElementById("agendaFull")].filter(Boolean).forEach((el)=>new MutationObserver(decorateAgenda).observe(el,{childList:true,subtree:true}));
  sync(document.querySelector(".screen.active")?.id || "inicio");
  setTimeout(decorateAgenda,250);
})();

/* C11 closure: render split-payment refunds by payment allocation and bind actions without inline JS. */
(() => {
  "use strict";
  if (typeof window.renderCashOrders !== "function") return;
  window.renderCashOrders = async function(rows) {
    const el = document.getElementById("cashOrders");
    if (!el) return { ok: false };
    if (!rows?.length) { el.innerHTML = '<h4>Comandas do dia</h4><div class="empty">Nenhuma comanda encontrada nesta unidade.</div>'; return { ok: true, netByOrder: {} }; }
    const state = await window.paymentStateForOrders(rows.map((x) => x.id));
    if (!state.ok) { window.reportClientError?.("loadDashboard.orderPayments", state.error); el.innerHTML = '<h4>Comandas do dia</h4><div class="empty">Não foi possível confirmar pagamentos e estornos. Atualize antes de operar.</div>'; return state; }
    const methodLabel = { pix:"PIX", cash:"Dinheiro", debit_card:"Débito", credit_card:"Crédito" };
    const statusLabel = { open:"Em aberto", closed:"Fechada", cancelled:"Cancelada" };
    el.innerHTML = '<h4>Comandas do dia</h4>' + rows.map((x) => {
      const orderAllocations=state.allocations.filter((a)=>a.order_id===x.id); const paid=state.netByOrder[x.id]||0; const remaining=Math.max(0,Number(x.total_amount||0)-paid);
      const methods=[...new Set(orderAllocations.map((a)=>a.payment_record?.payment_method).filter(Boolean))];
      const methodText=methods.length>1?`Múltiplos: ${methods.map((m)=>methodLabel[m]||m).join(" + ")}`:methods.length===1?methodLabel[methods[0]]||methods[0]:"Sem pagamento alocado";
      const actions=[];
      if(x.status==="open"&&remaining>0.005) actions.push(`<button class="cash-order-action" data-receive-order="${window.esc(x.id)}">Receber ${window.money(remaining)}</button>`);
      for(const a of orderAllocations){ const paymentId=a.payment_record?.id; const available=Math.max(0,Number(a.payment_record?.amount||a.amount||0)-(state.refundedByPayment[paymentId]||0)); if(paymentId&&available>0.005){ const splitLabel=orderAllocations.length>1?` · ${methodLabel[a.payment_record?.payment_method]||a.payment_record?.payment_method||"Pagamento"}`:""; actions.push(`<button class="cash-order-action refund" data-refund-payment="${window.esc(paymentId)}" data-refund-available="${available}">Estornar ${window.money(available)}${splitLabel}</button>`); } }
      return `<div class="cash-order ${x.status==="open"?"open":"closed"}"><div><strong>${window.esc(x.public_id||"Comanda")}</strong><small>${window.esc(methodText)}</small>${actions.join("")}</div><div class="cash-order-right"><strong>${window.money(x.total_amount)}</strong><small>Pago líquido: ${window.money(paid)}</small><span class="cash-order-status">${window.esc(statusLabel[x.status]||x.status||"—")}</span></div></div>`;
    }).join("");
    el.querySelectorAll("[data-receive-order]").forEach((button)=>button.addEventListener("click",()=>window.receivePayment(button.dataset.receiveOrder)));
    el.querySelectorAll("[data-refund-payment]").forEach((button)=>button.addEventListener("click",()=>window.refundPayment(button.dataset.refundPayment,Number(button.dataset.refundAvailable))));
    return state;
  };
})();
