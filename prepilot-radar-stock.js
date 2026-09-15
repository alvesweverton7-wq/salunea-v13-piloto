/* Salunea pre-pilot Radar/Estoque preview.
 * Tenant-scoped reads plus controlled, idempotent stock movements.
 * Radar refresh requires the separately reviewed public.detect_radar_signals
 * wrapper; failures remain explicit and never fabricate state.
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
  function stockMount() {
    const list = document.getElementById("prepilotStockList");
    if (!list) return null;
    let mount = document.getElementById("prepilotStockMovementMount");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "prepilotStockMovementMount";
      list.parentNode.insertBefore(mount, list);
    }
    return mount;
  }
  function renderStockMovementForm(unitRows, products) {
    const mount = stockMount();
    if (!mount) return;
    const byProduct = Object.fromEntries((products || []).map(x => [x.id, x]));
    const options = (unitRows || []).map(x => `<option value="${safe(x.id)}">${safe(byProduct[x.product_id]?.name || "Produto")} · mínimo ${num(x.minimum_stock)}</option>`).join("");
    mount.innerHTML = `<div class="prepilot-card" style="margin:10px 16px"><strong>Movimentação controlada</strong><p class="muted">Use uma entrada ou saída idempotente. O saldo não pode ficar negativo.</p><div style="display:grid;gap:8px"><label>Produto<select id="prepilotStockProduct">${options}</select></label><label>Tipo<select id="prepilotStockType"><option value="purchase">Entrada / compra</option><option value="adjustment_in">Ajuste de entrada</option><option value="sale">Saída / venda</option><option value="loss">Perda</option><option value="service_consumption">Consumo de serviço</option></select></label><label>Quantidade<input id="prepilotStockQuantity" type="number" min="0.0001" step="0.0001" placeholder="Quantidade absoluta"></label><label>Custo unitário (obrigatório para compra)<input id="prepilotStockCost" type="number" min="0" step="0.0001" placeholder="R$"></label><label>Motivo<input id="prepilotStockReason" maxlength="180" placeholder="Motivo da movimentação"></label><button class="new" type="button" onclick="prepilotSubmitStockMovement()">Registrar movimentação</button><div id="prepilotStockFeedback" class="muted" aria-live="polite"></div></div></div>`;
  }
  async function submitStockMovement() {
    const c = currentCompany(), u = currentUnit(), feedbackEl = document.getElementById("prepilotStockFeedback");
    const setFeedback = (text, error = false) => { if (feedbackEl) { feedbackEl.textContent = text; feedbackEl.style.color = error ? "#a33" : "#185c37"; } };
    if (!c || !u || !dbRef()) return;
    const product = document.getElementById("prepilotStockProduct")?.value;
    const type = document.getElementById("prepilotStockType")?.value;
    const quantity = Number(document.getElementById("prepilotStockQuantity")?.value);
    const costRaw = document.getElementById("prepilotStockCost")?.value;
    const cost = costRaw === "" ? null : Number(costRaw);
    const reason = document.getElementById("prepilotStockReason")?.value.trim() || null;
    const incoming = ["purchase", "adjustment_in", "transfer_in"].includes(type);
    if (!product || !type || !Number.isFinite(quantity) || quantity <= 0) { setFeedback("Informe produto, tipo e quantidade positiva.", true); return; }
    if (type === "purchase" && (!Number.isFinite(cost) || cost < 0)) { setFeedback("Compra exige custo unitário válido.", true); return; }
    const delta = incoming ? quantity : -quantity;
    const button = document.querySelector("#prepilotStockMovementMount button");
    if (button) { button.disabled = true; button.textContent = "Registrando…"; }
    try {
      const { error } = await dbRef().rpc("record_stock_movement", { p_company_id: c.id, p_unit_id: u.id, p_unit_product_id: product, p_movement_type: type, p_quantity_delta: delta, p_unit_cost_snapshot: cost, p_reason: reason, p_reference_type: null, p_reference_id: null, p_idempotency_key: crypto.randomUUID() });
      if (error) { report("prepilot.stock.write", error, { companyId: c.id, unitId: u.id, unitProductId: product }); setFeedback("Não foi possível registrar. Nada foi alterado.", true); return; }
      setFeedback("Movimentação registrada e saldo confirmado.");
      await loadStock();
    } catch (e) { report("prepilot.stock.write", e, { companyId: c.id, unitId: u.id, unitProductId: product }); setFeedback("Falha inconclusiva. Atualize para confirmar.", true); }
    finally { if (button) { button.disabled = false; button.textContent = "Registrar movimentação"; } }
  }
  window.prepilotSubmitStockMovement = submitStockMovement;
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
      if (!rows.length) { el.innerHTML = '<div class="empty">Nenhum produto de estoque configurado nesta unidade.</div>'; stockMount()?.replaceChildren(); return; }
      renderStockMovementForm(unitRows, products);
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
