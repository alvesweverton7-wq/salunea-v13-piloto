/* Salunea pre-pilot Radar/Estoque preview.
 * Read-only UI against existing tenant-scoped tables/views.
 * Requires the separately reviewed public.detect_radar_signals wrapper for the
 * refresh action; the baseline database does not expose that RPC yet.
 */
(() => {
  "use strict";
  const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v) => Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  // `db`/`ctx` are top-level lexical bindings in the baseline, so use a
  // safe resolver instead of assuming they are properties on window.
  const dbRef = () => (typeof db !== "undefined" ? db : window.db);
  const ctxRef = () => (typeof ctx !== "undefined" ? ctx : window.ctx);
  const safe = (v) => typeof esc === "function" ? esc(v) : String(v ?? "");
  const currentUnit = () => ctxRef() && ctxRef().unit;
  const currentCompany = () => ctxRef() && ctxRef().company;
  const inCurrentUnit = (row) => !row.unit_id || !currentUnit() || row.unit_id === currentUnit().id;
  function report(kind, error, context = {}) {
    if (typeof reportClientError === "function") reportClientError(kind, error, context);
    else console.error("[Salunea][prepilot]", kind, error, context);
  }
  function showError(el, text) {
    if (el) el.innerHTML = `<div class="empty">${safe(text)}</div>`;
  }
  function confidenceLabel(value) {
    const labels = { low: "baixa", medium: "média", high: "alta" };
    return labels[String(value || "").toLowerCase()] || "não informada";
  }
  function priorityLabel(signal) {
    const urgency = Number(signal?.urgency || 0);
    const actionability = Number(signal?.actionability || 0);
    if (urgency >= 4 || actionability >= 4) return "alta";
    if (urgency >= 2 || actionability >= 2) return "média";
    return "baixa";
  }
  function evidenceLabel(key) {
    const labels = { value: "Valor", quantity: "Quantidade", products: "Produtos", impact: "Impacto", impacto_estimado: "Impacto estimado" };
    return labels[key] || key.replaceAll("_", " ").replace(/^./, x => x.toUpperCase());
  }
  function formatEvidenceValue(value) {
    if (typeof value === "number") return num(value);
    return String(value ?? "—").replaceAll("unit", "unidade");
  }
  function radarCard(s) {
    let evidence = "";
    try {
      const e = typeof s.evidence === "string" ? JSON.parse(s.evidence) : s.evidence;
      if (e && typeof e === "object") evidence = Object.entries(e).map(([k,v]) => `${evidenceLabel(k)}: ${formatEvidenceValue(v)}`).join(" · ");
    } catch (_) { evidence = "Evidência disponível no registro"; }
    return `<article class="prepilot-card"><h4>${safe(s.title_pt_br)}</h4><p>${safe(s.diagnosis_pt_br)}</p><p class="prepilot-meta"><span class="prepilot-badge warn">Prioridade ${safe(priorityLabel(s))}</span><span class="prepilot-badge">Confiança ${safe(confidenceLabel(s.confidence))}</span><span class="prepilot-badge">Urgência ${safe(s.urgency)}/5</span></p><p>${safe(evidence)}</p></article>`;
  }
  async function loadRadar(refresh = false) {
    const el = document.getElementById("prepilotRadarList");
    const c = currentCompany(), u = currentUnit();
    if (!el || !c || !u || !dbRef()) return;
    el.innerHTML = '<div class="empty">Consultando sinais do tenant ativo…</div>';
    if (refresh) {
      try {
        const r = await dbRef().rpc("detect_radar_signals", { p_company: c.id, p_unit: u.id });
        if (r.error) {
          report("prepilot.radar.refresh", r.error, { companyId: c.id, unitId: u.id });
          showError(el, "A geração determinística ainda não está exposta neste baseline. Nada foi alterado.");
        }
      } catch (e) {
        report("prepilot.radar.refresh", e, { companyId: c.id, unitId: u.id });
        showError(el, "Não foi possível atualizar os sinais. Nada foi alterado.");
      }
    }
    try {
      let data = null, error = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        ({ data, error } = await dbRef().from("radar_signals").select("id,title_pt_br,diagnosis_pt_br,evidence,confidence,priority_score,urgency,actionability,status,unit_id,detected_at").eq("company_id", c.id).in("status", ["open", "acknowledged"]).order("priority_score", { ascending: false }).limit(50));
        if (!error) break;
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 800));
      }
      if (error) throw error;
      const rows = (data || []).filter(inCurrentUnit);
      el.innerHTML = rows.length ? rows.map(radarCard).join("") : '<div class="empty">Nenhum sinal determinístico aberto para esta unidade.</div>';
    } catch (e) {
      report("prepilot.radar.read", e, { companyId: c.id, unitId: u.id });
      showError(el, "Não foi possível carregar o Radar. Nada foi alterado; tente novamente.");
    }
  }
  async function loadStock() {
    const el = document.getElementById("prepilotStockList");
    const c = currentCompany(), u = currentUnit();
    if (!el || !c || !u || !dbRef()) return;
    el.innerHTML = '<div class="empty">Consultando saldo da unidade…</div>';
    try {
      const [stock, units] = await Promise.all([
        dbRef().from("v_projected_stock").select("unit_product_id,company_id,unit_id,on_hand,reliable_expected_inbound,future_committed,projected_quantity").eq("company_id", c.id).eq("unit_id", u.id),
        dbRef().from("unit_products").select("id,product_id,minimum_stock").eq("company_id", c.id).eq("unit_id", u.id).eq("status", "active")
      ]);
      if (stock.error) throw stock.error;
      if (units.error) throw units.error;
      const unitRows = units.data || [];
      const productIds = [...new Set(unitRows.map(x => x.product_id).filter(Boolean))];
      let products = [];
      if (productIds.length) {
        const p = await dbRef().from("products").select("id,name,unit_of_measure").eq("company_id", c.id).in("id", productIds);
        if (p.error) throw p.error;
        products = p.data || [];
      }
      const byUnit = Object.fromEntries(unitRows.map(x => [x.id, x]));
      const byProduct = Object.fromEntries(products.map(x => [x.id, x]));
      const rows = (stock.data || []).map(x => ({ ...x, ...byUnit[x.unit_product_id], product: byProduct[byUnit[x.unit_product_id]?.product_id] })).filter(x => x.unit_product_id);
      if (!rows.length) { el.innerHTML = '<div class="empty">Nenhum produto de estoque configurado nesta unidade.</div>'; return; }
      const unitLabel = (value) => ({ unit: "unidade", piece: "peça", liter: "litro", kilogram: "quilo", milliliter: "mililitro", gram: "grama" }[String(value || "").toLowerCase()] || value || "unidade");
      el.innerHTML = `<div class="prepilot-card"><table class="prepilot-table"><thead><tr><th>Produto</th><th>Saldo</th><th>Mínimo</th><th>Projetado</th></tr></thead><tbody>${rows.map(x => { const low = Number(x.on_hand || 0) < Number(x.minimum_stock || 0); return `<tr><td><strong>${safe(x.product?.name || "Produto")}</strong><br><span class="muted">${safe(unitLabel(x.product?.unit_of_measure))}</span></td><td>${num(x.on_hand)}</td><td>${num(x.minimum_stock)}</td><td><span class="prepilot-badge ${low ? "warn" : ""}">${num(x.projected_quantity)}${low ? " · abaixo do mínimo" : ""}</span></td></tr>`; }).join("")}</tbody></table></div>`;
    } catch (e) {
      report("prepilot.stock.read", e, { companyId: c.id, unitId: u.id });
      showError(el, "Não foi possível carregar o estoque. Nada foi alterado; tente novamente.");
    }
  }
  const originalGo = window.go;
  window.go = function(id) {
    const result = originalGo ? originalGo.apply(this, arguments) : undefined;
    if (id === "radar") loadRadar(false);
    if (id === "estoque") loadStock();
    return result;
  };
  window.prepilotLoadRadar = loadRadar;
  window.prepilotLoadStock = loadStock;
  window.addEventListener("load", () => setTimeout(() => { loadRadar(false); loadStock(); }, 300));
})();
