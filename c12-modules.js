(() => {
  "use strict";
  const style = document.createElement("style");
  style.textContent = `
    .c12-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:12px 16px 110px}
    .c12-panel{background:#fffdfa;border:1px solid #e8e2d8;border-radius:18px;padding:20px;box-shadow:0 16px 42px #16243b12}
    .c12-panel.wide{grid-column:1/-1}.c12-panel h4{margin:0 0 14px;color:#0e203d;font-size:18px}.c12-list{display:grid;gap:10px}
    .c12-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #eee7dc}.c12-row:last-child{border:0}
    .c12-row small{display:block;color:#667387;margin-top:4px}.c12-badge{padding:6px 9px;border-radius:99px;background:#e1f4eb;color:#11785e;font-size:11px;font-weight:900}
    .c12-badge.warn{background:#fff0d7;color:#8a4a00}.c12-bar{height:9px;background:#ede9e1;border-radius:99px;overflow:hidden;margin-top:8px}.c12-bar span{display:block;height:100%;background:#159875;border-radius:inherit}
    #atendimento .metrics,#relatorios .metrics{margin:10px 16px}.c12-action{border:0;border-radius:9px;background:#f47826;color:#fff;padding:9px 12px;font-weight:900;cursor:pointer}
    @media(max-width:700px){.c12-grid{grid-template-columns:1fr;margin-left:10px;margin-right:10px}.c12-panel.wide{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const safeRows = async (promise, kind) => {
    const { data, error } = await promise;
    if (error) { reportClientError(kind, error); throw error; }
    return data || [];
  };
  const dayRange = () => {
    const date = typeof unitDateText === "function" ? unitDateText() : new Date().toISOString().slice(0,10);
    const start = zonedDateTimeToIso(date, "00:00");
    const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+1);
    return [start, zonedDateTimeToIso(d.toISOString().slice(0,10), "00:00")];
  };
  const statusName = { in_progress:"Em atendimento", completed:"Concluído", open:"Em aberto", closed:"Fechada", cancelled:"Cancelado" };

  window.loadAttendance = async function(showConfirmation=false) {
    const box = document.getElementById("attendanceWorkspace");
    if (!box || !ctx?.unit?.id) return;
    box.innerHTML = '<div class="empty">Carregando atendimentos…</div>';
    try {
      const [start,end] = dayRange();
      const attendances = await safeRows(db.from("attendances").select("id,public_id,client_id,status,started_at,completed_at,notes").eq("company_id",ctx.company.id).eq("unit_id",ctx.unit.id).gte("started_at",start).lt("started_at",end).order("started_at",{ascending:false}),"c12.attendances");
      const ids = attendances.map(x=>x.id), clientIds=[...new Set(attendances.map(x=>x.client_id).filter(Boolean))];
      const clients = clientIds.length ? await safeRows(db.from("clients").select("id,full_name,phone").in("id",clientIds),"c12.attendanceClients") : [];
      const orders = ids.length ? await safeRows(db.from("orders").select("id,attendance_id,public_id,status,total_amount").in("attendance_id",ids),"c12.attendanceOrders") : [];
      const cmap=Object.fromEntries(clients.map(x=>[x.id,x])), omap=Object.fromEntries(orders.map(x=>[x.attendance_id,x]));
      const active=attendances.filter(x=>x.status!=="completed").length, completed=attendances.filter(x=>x.status==="completed").length, open=orders.filter(x=>x.status==="open").reduce((s,x)=>s+Number(x.total_amount||0),0);
      document.getElementById("attendanceSummary").innerHTML=`<div class="card"><span>Em atendimento</span><strong>${active}</strong></div><div class="card"><span>Concluídos hoje</span><strong>${completed}</strong></div><div class="card"><span>Em comandas abertas</span><strong>${money(open)}</strong></div>`;
      box.innerHTML=`<article class="c12-panel wide"><h4>Fluxo do dia</h4><div class="c12-list">${attendances.map(a=>{const c=cmap[a.client_id]||{},o=omap[a.id];return `<div class="c12-row"><div><strong>${esc(c.full_name||"Cliente")}</strong><small>${esc(a.public_id||"Atendimento")} · ${esc(statusName[a.status]||a.status)}${o?` · ${esc(o.public_id||"Comanda")}`:""}</small></div><div>${o?`<span class="c12-badge ${o.status==='open'?'warn':''}">${money(o.total_amount)}</span>`:'<span class="c12-badge">Sem comanda</span>'}${o?.status==='open'?` <button class="c12-action" data-pay="${esc(o.id)}">Receber</button>`:""}</div></div>`}).join("")||'<div class="empty">Nenhum atendimento iniciado hoje.</div>'}</div></article>`;
      box.querySelectorAll("[data-pay]").forEach(b=>b.addEventListener("click",()=>receivePayment(b.dataset.pay)));
      if(showConfirmation) feedback("Atendimentos atualizados com dados reais.","success");
    } catch { box.innerHTML='<div class="empty">Não foi possível carregar atendimentos. Nenhum dado foi alterado.</div>'; }
  };

  window.loadReports = async function(showConfirmation=false) {
    const box=document.getElementById("reportWorkspace"); if(!box||!ctx?.unit?.id)return;
    box.innerHTML='<div class="empty">Carregando indicadores…</div>';
    try {
      const [start,end]=dayRange();
      const [appointments,orders,payments]=await Promise.all([
        safeRows(db.from("appointments").select("id,status").eq("company_id",ctx.company.id).eq("unit_id",ctx.unit.id).gte("starts_at",start).lt("starts_at",end),"c12.reportAppointments"),
        safeRows(db.from("orders").select("id,status,total_amount").eq("company_id",ctx.company.id).eq("unit_id",ctx.unit.id).gte("created_at",start).lt("created_at",end),"c12.reportOrders"),
        safeRows(db.from("payment_records").select("id,payment_method,amount,status").eq("company_id",ctx.company.id).eq("unit_id",ctx.unit.id).gte("occurred_at",start).lt("occurred_at",end),"c12.reportPayments")
      ]);
      const paymentIds=payments.map(x=>x.id);
      const refunds=paymentIds.length ? await safeRows(db.from("payment_refunds").select("payment_record_id,amount").in("payment_record_id",paymentIds),"c12.reportRefunds") : [];
      const refundedByPayment={}; refunds.forEach(x=>refundedByPayment[x.payment_record_id]=(refundedByPayment[x.payment_record_id]||0)+Number(x.amount||0));
      const received=payments.filter(x=>x.status!=="cancelled").reduce((s,x)=>s+Math.max(0,Number(x.amount||0)-(refundedByPayment[x.id]||0)),0), produced=orders.reduce((s,x)=>s+Number(x.total_amount||0),0), closed=orders.filter(x=>x.status==="closed").length;
      document.getElementById("reportMetrics").innerHTML=`<div class="card"><span>Produção do dia</span><strong>${money(produced)}</strong></div><div class="card"><span>Recebido líquido</span><strong>${money(received)}</strong></div><div class="card"><span>Atendimentos</span><strong>${appointments.length}</strong></div>`;
      const counts={}; payments.filter(x=>x.status!=="cancelled").forEach(x=>counts[x.payment_method]=(counts[x.payment_method]||0)+Math.max(0,Number(x.amount||0)-(refundedByPayment[x.id]||0))); const max=Math.max(1,...Object.values(counts));
      box.innerHTML=`<article class="c12-panel"><h4>Formas de pagamento</h4>${Object.entries(counts).map(([k,v])=>`<div class="c12-row"><div><strong>${esc({pix:'PIX',cash:'Dinheiro',credit_card:'Crédito',debit_card:'Débito'}[k]||k)}</strong><div class="c12-bar"><span style="width:${Math.round(v/max*100)}%"></span></div></div><strong>${money(v)}</strong></div>`).join("")||'<div class="empty">Sem recebimentos hoje.</div>'}</article><article class="c12-panel"><h4>Operação</h4><div class="c12-row"><span>Comandas fechadas</span><strong>${closed}</strong></div><div class="c12-row"><span>Cancelamentos</span><strong>${appointments.filter(x=>x.status==='cancelled').length}</strong></div><div class="c12-row"><span>Não compareceu</span><strong>${appointments.filter(x=>x.status==='no_show').length}</strong></div></article>`;
      if(showConfirmation) feedback("Relatórios atualizados com dados reais.","success");
    } catch { box.innerHTML='<div class="empty">Não foi possível carregar os indicadores.</div>'; }
  };

  window.loadSettings = async function() {
    const box=document.getElementById("settingsWorkspace"); if(!box||!ctx?.company?.id)return;
    try {
      const [professionals,services]=await Promise.all([
        safeRows(db.from("professionals").select("id,display_name,full_name,status").eq("company_id",ctx.company.id).eq("status","active").order("display_name"),"c12.settingsProfessionals"),
        safeRows(db.from("services").select("id,name,status").eq("company_id",ctx.company.id).eq("status","active").order("name"),"c12.settingsServices")
      ]);
      box.innerHTML=`<article class="c12-panel wide"><h4>Dados da operação</h4><div class="c12-row"><span>Empresa</span><strong>${esc(ctx.company.trade_name||ctx.company.legal_name)}</strong></div><div class="c12-row"><span>Unidade ativa</span><strong>${esc(ctx.unit.name)}</strong></div><div class="c12-row"><span>Fuso horário</span><strong>${esc(ctx.unit.timezone||"America/Sao_Paulo")}</strong></div></article><article class="c12-panel"><h4>Profissionais (${professionals.length})</h4><div class="c12-list">${professionals.map(x=>`<div class="c12-row"><span>${esc(x.display_name||x.full_name)}</span><span class="c12-badge">Ativo</span></div>`).join("")||'<div class="empty">Nenhum profissional ativo.</div>'}</div></article><article class="c12-panel"><h4>Serviços (${services.length})</h4><div class="c12-list">${services.map(x=>`<div class="c12-row"><span>${esc(x.name)}</span><span class="c12-badge">Ativo</span></div>`).join("")||'<div class="empty">Nenhum serviço ativo.</div>'}</div></article>`;
    } catch { box.innerHTML='<div class="empty">Não foi possível carregar as configurações.</div>'; }
  };

  const previousGo=window.go;
  window.go=function(id){const result=previousGo.apply(this,arguments); if(id==="atendimento")loadAttendance(); if(id==="relatorios")loadReports(); if(id==="configuracoes")loadSettings(); return result;};
})();
