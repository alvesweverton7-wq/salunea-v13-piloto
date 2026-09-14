(() => {
  "use strict";
  const app = document.getElementById("app");
  if (!app || document.getElementById("visualWave1Sidebar")) return;
  const style = document.createElement("style");
  style.textContent = `
    :root { --vw-navy:#0e203d; --vw-cream:#f7f4ee; --vw-paper:#fffdfa; --vw-orange:#f47826; --vw-green:#159875; --vw-line:#e8e2d8; }
    #visualWave1Sidebar { display:flex; position:fixed; z-index:20; inset:0 auto 0 0; width:246px; background:var(--vw-navy); color:#fff; padding:24px 18px 18px; flex-direction:column; }
    #visualWave1Sidebar .vw-logo { display:flex; align-items:center; gap:11px; margin:0 13px 34px; }
    #visualWave1Sidebar .vw-mark { width:42px; height:42px; border:2px solid var(--vw-orange); border-radius:14px; display:grid; place-items:center; font-size:22px; font-weight:950; }
    #visualWave1Sidebar .vw-brand { font-size:25px; font-weight:950; letter-spacing:-.05em; }
    #visualWave1Sidebar .vw-sub { display:block; color:#aebbd0; font-size:10px; margin-top:-2px; }
    #visualWave1Sidebar nav { display:grid; gap:6px; }
    #visualWave1Sidebar button { width:100%; border:0; border-radius:28px; background:transparent; color:#eef3fa; padding:13px 14px; text-align:left; font:800 14px/1.2 Inter,system-ui,sans-serif; cursor:pointer; }
    #visualWave1Sidebar button:hover { background:#ffffff12; }
    #visualWave1Sidebar button.active { background:var(--vw-green); color:#fff; }
    #visualWave1Sidebar .vw-ico { display:inline-block; width:25px; margin-right:10px; text-align:center; font-size:20px; vertical-align:-2px; }
    #visualWave1Sidebar .vw-spacer { flex:1; }
    #visualWave1Sidebar .vw-foot { border-top:1px solid #ffffff1b; padding:16px 14px 0; color:#b7c4d5; font-size:11px; }
    #visualWave1Sidebar ~ * { position:relative; }
    #app .section.head, #app #agenda .section, #app #clientes .section, #app #caixa .section, #app #mais .section, #app #radar .section, #app #estoque .section { padding:0 0 8px; }
    #app .section.head h3, #app #caixa h3, #app #mais h3, #app #radar h3, #app #estoque h3 { font-size:34px; letter-spacing:-.045em; margin:0 0 5px; }
    #app .section.head p, #app #caixa .muted, #app #mais .muted, #app #radar .muted, #app #estoque .muted { color:#667387; font-size:14px; }
    #app .new, #app .fab { background:var(--vw-orange); color:#fff; border-radius:11px; padding:12px 16px; font-weight:900; border:0; }
    #app #agendaFull { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:18px; padding:15px 20px; box-shadow:0 16px 42px #16243b12; }
    #app .appt { display:grid; grid-template-columns:62px 1fr auto; gap:16px; align-items:center; padding:16px 4px; border-bottom:1px solid var(--vw-line); }
    #app .appt:last-child { border-bottom:0; }
    #app .appt time { font-size:18px; font-weight:950; color:var(--vw-navy); }
    #app .appt strong { font-size:15px; }
    #app .appt p { color:#667387; margin:5px 0 0; font-size:12px; }
    #app .appt .status { border-radius:99px; padding:7px 10px; background:#ddf4e9; color:#159875; font-size:11px; font-weight:900; white-space:nowrap; }
    #app .ops { margin-top:8px; }
    #app .opbtn { background:#fff1e8; color:#b74f14; border:0; border-radius:9px; padding:8px 10px; font-size:11px; font-weight:900; }
    #app .appt.vw-done { border-left:5px solid var(--vw-green); padding-left:12px; }
    #app .appt.vw-pending { border-left:5px solid #f3bd41; padding-left:12px; }
    #app .appt.vw-conflict { border-left:5px solid var(--vw-orange); padding-left:12px; background:#fff7ed; }
    #app .appt.vw-conflict .status { background:#ffe1ca; color:#b74f14; }
    #app .appt.vw-pending .status { background:#fff0c7; color:#966800; }
    #app #clientes .client-live { margin:10px 0 !important; border-radius:15px; border:1px solid var(--vw-line); box-shadow:0 10px 30px #16243b0c; padding:17px; }
    #app #clientes .client-live strong { font-size:15px; }
    #app #clientes .client-live span { color:#667387; font-size:12px; margin-top:5px; }
    #app #caixa .metrics { gap:14px; }
    #app #caixa .metrics .card { border-radius:18px; padding:22px; box-shadow:0 16px 42px #16243b12; }
    #app #caixa .metrics .card strong { display:block; font-size:35px; margin-top:10px; }
    #app #mais > .card { border-radius:16px; border:1px solid var(--vw-line); box-shadow:0 10px 30px #16243b0b; padding:18px !important; }
    #app #radar .prepilot-action { display:flex; align-items:center; gap:10px; margin:10px 0 15px; }
    #app #radar .prepilot-grid, #app #estoque .prepilot-grid { margin:10px 0; }
    #app #radar .prepilot-card { background:var(--vw-paper); border:1px solid var(--vw-line); border-left:6px solid var(--vw-orange); border-radius:18px; padding:19px; box-shadow:0 16px 42px #16243b12; }
    #app #radar .prepilot-card h4 { font-size:17px; margin:0 0 8px; }
    #app #radar .prepilot-card p { color:#667387; line-height:1.45; }
    #app #radar .prepilot-badge { border-radius:99px; padding:6px 9px; background:#eef1f5; color:#536172; font-size:11px; font-weight:900; }
    #app #estoque .prepilot-card { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:18px; padding:19px; box-shadow:0 16px 42px #16243b12; }
    #app #mais > .card { cursor:pointer; }
    #app .account-card { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:18px; box-shadow:0 16px 42px #16243b12; }
    #auth.auth { background:var(--vw-navy); }
    #auth .authbox { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:24px; box-shadow:0 24px 70px #07132666; padding:30px; }
    #auth .authbox h2 { color:var(--vw-navy); font-size:34px; letter-spacing:-.05em; }
    #auth .authbox button { background:var(--vw-orange); border-radius:11px; font-weight:950; padding:13px 16px; }
    #auth .authbox button#signupButton { background:#eef2f0 !important; color:var(--vw-navy) !important; border:1px solid var(--vw-line); }
    #app .wa-manual { background:#f0faf5; border:1px solid #cfeadd; border-radius:14px; padding:13px; }
    #app .wa-manual small { color:#47705f; }
    #app .wa-actions button { border-radius:9px; font-weight:900; }
    #app .wa-actions button:not([disabled]) { background:#159875; color:#fff; border:0; }
    #app .wa-actions button[disabled] { background:#e8ece9; color:#65726c; }
    #app .modal { background:#0e203db8; backdrop-filter:blur(8px); }
    #app .modal .sheet { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:22px; box-shadow:0 22px 70px #0e203d40; padding:25px; }
    #app .modal .sheet h3 { font-size:25px; letter-spacing:-.04em; margin:0 0 17px; }
    #app .modal .sheet label { color:#536172; font-size:12px; font-weight:900; margin-top:12px; }
    #app .modal .sheet input, #app .modal .sheet select { border:1px solid var(--vw-line); border-radius:11px; padding:12px; background:#fff; color:var(--vw-navy); }
    #app .modal .sheet .row { gap:9px; margin-top:18px; }
    #app .modal .sheet .row button { border-radius:10px; padding:11px 14px; font-weight:900; }
    #app .modal .sheet .row .save { background:var(--vw-orange); color:#fff; }
    #app #paymentOrderLabel { background:#fff1e8; color:#b74f14; border:1px solid #ffd8bd; border-radius:12px; padding:13px 14px; font-weight:900; }
    #app #paymentAmount { font-size:26px; font-weight:950; letter-spacing:-.04em; color:var(--vw-navy); }
    #app #paymentMethod { font-weight:800; }
    #app .feedback { border-radius:12px; box-shadow:0 12px 36px #0e203d25; font-weight:800; }
    @media (max-width:600px) {
      #app .appt { grid-template-columns:48px 1fr; gap:10px; padding:14px 2px; }
      #app .appt time { font-size:16px; }
      #app .appt .status { grid-column:2; width:max-content; }
      #app .appt .opbtn { max-width:100%; white-space:normal; text-align:left; }
      #app .modal .sheet { width:calc(100% - 32px); max-height:calc(100vh - 32px); overflow:auto; }
    }
    @media (min-width:901px) {
      body { background:var(--vw-navy) !important; }
      #app { padding-left:246px !important; background:var(--vw-cream) !important; min-height:100vh; }
      #app > header { background:#fbf9f4 !important; height:82px !important; border-bottom:1px solid var(--vw-line) !important; }
      #app > nav { display:none !important; }
      #app #inicio .hero { border-radius:26px !important; background:var(--vw-navy) !important; color:#fff !important; padding:30px !important; box-shadow:0 18px 50px #10203b24; }
      #app #inicio .hero h2 { font-size:clamp(34px,5vw,54px); letter-spacing:-.06em; line-height:1.02; margin:10px 0; }
      #app #inicio .hero p { color:#cad7e7 !important; max-width:560px; font-size:15px; line-height:1.5; }
      #app #inicio .hero button { background:var(--vw-orange); border-radius:11px; padding:12px 16px; font-weight:900; }
      #app #inicio .metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
      #app #inicio .metrics .card { border-radius:18px !important; box-shadow:0 16px 42px #16243b12 !important; padding:21px; }
      #app #inicio .metrics .card strong { display:block; font-size:34px; margin-top:9px; letter-spacing:-.05em; }
      #app #inicio .metrics .card em { color:#159875; font-size:12px; font-style:normal; font-weight:900; }
      #app #inicio .section.head { margin-top:24px; }
      #app #inicio .section.head h3 { font-size:23px; }
      #app #inicio .search input { border-radius:12px; border:1px solid var(--vw-line); padding:14px 16px; background:#fffdfa; }
      #app #inicio #agendaList { background:var(--vw-paper); border:1px solid var(--vw-line); border-radius:18px; padding:7px 18px; box-shadow:0 16px 42px #16243b12; }
      #app #inicio .radar { background:var(--vw-navy); color:#fff; border-radius:18px; padding:21px; margin-top:17px; }
      #app #inicio .radar p { color:#cad7e7; }
      #inicio .section { max-width:1200px; }
      #agenda .section, #clientes .section, #caixa .section, #mais .section, #radar .section, #estoque .section { max-width:1200px; }
    }
    @media (max-width:900px) { #visualWave1Sidebar { display:none; } #app { padding-left:0 !important; } #app #inicio .metrics { grid-template-columns:1fr; } }
  `;
  document.head.appendChild(style);
  const aside = document.createElement("aside");
  aside.id = "visualWave1Sidebar";
  aside.innerHTML = `
    <div class="vw-logo"><div class="vw-mark">✦</div><div><div class="vw-brand">Salunea</div><span class="vw-sub">Gestão de salão</span></div></div>
    <nav>
      <button data-vw="inicio" data-go="inicio"><span class="vw-ico">▣</span>Dashboard</button>
      <button data-vw="agenda" data-go="agenda"><span class="vw-ico">▦</span>Agenda</button>
      <button data-vw="clientes" data-go="clientes"><span class="vw-ico">♙</span>Clientes</button>
      <button data-vw="caixa" data-go="caixa"><span class="vw-ico">▤</span>Financeiro</button>
      <button data-vw="estoque" data-go="estoque"><span class="vw-ico">◇</span>Estoque</button>
      <button data-vw="radar" data-go="radar"><span class="vw-ico">✦</span>Radar beta</button>
      <button data-vw="mais" data-go="mais"><span class="vw-ico">⋯</span>Mais</button>
    </nav>
    <div class="vw-spacer"></div>
    <nav><button data-vw="mais"><span class="vw-ico">⚙</span>Configurações</button></nav>
    <div class="vw-foot">Piloto controlado gratuito<br><span id="visualWave1Tenant">Unidade ativa</span></div>
  `;
  app.prepend(aside);
  const tenantSource = document.getElementById("tenantLabel");
  const tenantTarget = document.getElementById("visualWave1Tenant");
  const syncTenant = () => {
    const label = tenantSource?.textContent?.trim();
    tenantTarget.textContent = label || "Unidade ativa";
  };
  if (tenantSource) {
    new MutationObserver(syncTenant).observe(tenantSource, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
  syncTenant();
  const sync = (id) => aside.querySelectorAll("button[data-vw]").forEach((b) => b.classList.toggle("active", b.dataset.vw === id));
  const originalGo = window.go;
  window.go = function(id) { const result = originalGo ? originalGo.apply(this, arguments) : undefined; sync(id); setTimeout(decorateAgenda, 0); return result; };
  aside.querySelectorAll("button[data-vw]").forEach((b) => b.addEventListener("click", () => window.go(b.dataset.vw)));
  function decorateAgenda() {
    document.querySelectorAll("#agendaList .appt, #agendaFull .appt").forEach((row) => {
      const label = row.querySelector(".status");
      if (!label) return;
      const text = label.textContent.toLowerCase();
      row.classList.remove("vw-conflict", "vw-pending", "vw-done");
      if (text.includes("conclu") || text.includes("confirm")) row.classList.add("vw-done");
      else if (text.includes("cancel") || text.includes("conflit")) row.classList.add("vw-conflict");
      else row.classList.add("vw-pending");
    });
  }
  const agendaList = document.getElementById("agendaList");
  if (agendaList) new MutationObserver(decorateAgenda).observe(agendaList, { childList:true, subtree:true });
  const agendaFull = document.getElementById("agendaFull");
  if (agendaFull) new MutationObserver(decorateAgenda).observe(agendaFull, { childList:true, subtree:true });
  sync(document.querySelector(".screen.active")?.id || "inicio");
  setTimeout(decorateAgenda, 250);
})();

/* C11 closure: render split-payment refunds by payment allocation and bind actions without inline JS. */
(() => {
  "use strict";
  if (typeof window.renderCashOrders !== "function") return;
  window.renderCashOrders = async function(rows) {
    const el = document.getElementById("cashOrders");
    if (!el) return { ok: false };
    if (!rows?.length) {
      el.innerHTML = '<h4>Comandas do dia</h4><div class="empty">Nenhuma comanda encontrada nesta unidade.</div>';
      return { ok: true, netByOrder: {} };
    }
    const state = await window.paymentStateForOrders(rows.map((x) => x.id));
    if (!state.ok) {
      window.reportClientError?.("loadDashboard.orderPayments", state.error);
      el.innerHTML = '<h4>Comandas do dia</h4><div class="empty">Não foi possível confirmar pagamentos e estornos. Atualize antes de operar.</div>';
      return state;
    }
    const methodLabel = { pix: "PIX", cash: "Dinheiro", debit_card: "Débito", credit_card: "Crédito" };
    const statusLabel = { open: "Em aberto", closed: "Fechada", cancelled: "Cancelada" };
    el.innerHTML = '<h4>Comandas do dia</h4>' + rows.map((x) => {
      const orderAllocations = state.allocations.filter((a) => a.order_id === x.id);
      const paid = state.netByOrder[x.id] || 0;
      const remaining = Math.max(0, Number(x.total_amount || 0) - paid);
      const methods = [...new Set(orderAllocations.map((a) => a.payment_record?.payment_method).filter(Boolean))];
      const methodText = methods.length > 1 ? `Múltiplos: ${methods.map((m) => methodLabel[m] || m).join(" + ")}` : methods.length === 1 ? methodLabel[methods[0]] || methods[0] : "Sem pagamento alocado";
      const actions = [];
      if (x.status === "open" && remaining > 0.005) {
        actions.push(`<button class="cash-order-action" data-receive-order="${window.esc(x.id)}">Receber ${window.money(remaining)}</button>`);
      }
      for (const a of orderAllocations) {
        const paymentId = a.payment_record?.id;
        const available = Math.max(0, Number(a.payment_record?.amount || a.amount || 0) - (state.refundedByPayment[paymentId] || 0));
        if (paymentId && available > 0.005) {
          const splitLabel = orderAllocations.length > 1 ? ` · ${methodLabel[a.payment_record?.payment_method] || a.payment_record?.payment_method || "Pagamento"}` : "";
          actions.push(`<button class="cash-order-action refund" data-refund-payment="${window.esc(paymentId)}" data-refund-available="${available}">Estornar ${window.money(available)}${splitLabel}</button>`);
        }
      }
      return `<div class="cash-order ${x.status === "open" ? "open" : "closed"}"><div><strong>${window.esc(x.public_id || "Comanda")}</strong><small>${window.esc(methodText)}</small>${actions.join("")}</div><div class="cash-order-right"><strong>${window.money(x.total_amount)}</strong><small>Pago líquido: ${window.money(paid)}</small><span class="cash-order-status">${window.esc(statusLabel[x.status] || x.status || "—")}</span></div></div>`;
    }).join("");
    el.querySelectorAll("[data-receive-order]").forEach((button) => {
      button.addEventListener("click", () => window.receivePayment(button.dataset.receiveOrder));
    });
    el.querySelectorAll("[data-refund-payment]").forEach((button) => {
      button.addEventListener("click", () => window.refundPayment(button.dataset.refundPayment, Number(button.dataset.refundAvailable)));
    });
    return state;
  };
})();
