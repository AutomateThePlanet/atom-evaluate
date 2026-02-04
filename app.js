import { loadState, saveState, resetState, downloadJson, importJsonFile } from "./storage.js";
import { computeMetrics, hashCriteria, round2 } from "./metrics.js";
import { renderTrendChart } from "./chart.js";

const DIMENSIONS = ["TSI","TQI","ATC"];

function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function nowIso() { return new Date().toISOString(); }

function defaultState() {
  const c1 = { id: uid("co"), name: "Example Co", createdAt: nowIso() };

  const criteria = [
  // --- OTHER / baseline QA presence & structure ---
  { id: uid("cr"), name: "Do you manually test your product or service?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you have manual QA engineers within your organization?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Are you doing any automated tests?", dimension: "ATC", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Are those coded automated tests?", dimension: "TQI", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TSI: people / roles / capability / standards ---
  { id: uid("cr"), name: "Do you have existing test automation engineers within your organization?", dimension: "TSI", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you have a QA Architect with significant technical expertise within your organization?", dimension: "TSI", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you adhere to specific industry standards or certifications in quality assurance, such as ISTQB?", dimension: "TSI", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: documentation & process foundations ---
  { id: uid("cr"), name: "Do you have any documented manual test cases that need to be executed to ensure the quality of your software?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you use a test case management system to store the manual test cases?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TSI: learning & upskilling via external expertise ---
  { id: uid("cr"), name: "Do you collaborate with external experts or consultants to gain insights into industry best practices or upskill your team qualification and level of expertise?", dimension: "TSI", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: defined processes & metrics culture ---
  { id: uid("cr"), name: "Do you have defined test processes and practices easily accessible by engineers?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you track test metrics to improve your software development and testing?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- ATC: coverage extent ---
  { id: uid("cr"), name: "What is the current system under test coverage with automated tests?", dimension: "ATC", weight: 1.2, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: reporting visibility ---
  { id: uid("cr"), name: "Are there specific reporting mechanisms or dashboards that provide visibility into the status and quality of your software?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: test environments ---
  { id: uid("cr"), name: "Do you have a dedicated test environment?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TQI: escaped defects / bug trends as quality signal ---
  { id: uid("cr"), name: "Are there any escalations or critical bugs reported after release on average?", dimension: "TQI", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Is the unresolved non-low priority bugs count increasing over time?", dimension: "TQI", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- ATC/TQI: execution frequency & gate coverage ---
  { id: uid("cr"), name: "Do you execute your automated test suite daily?", dimension: "ATC", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you execute your high-priority automated tests after each deployment of the app to the test environment?", dimension: "ATC", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TQI: flakiness & reliability ---
  { id: uid("cr"), name: "Are there any flaky tests part of your test suite?", dimension: "TQI", weight: 1.2, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Is more than 5% of your automated test suite failing regularly?", dimension: "TQI", weight: 1.2, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TQI: maintenance & locator churn ---
  { id: uid("cr"), name: "Do you have to update element locators too often?", dimension: "TQI", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TQI: test data robustness ---
  { id: uid("cr"), name: "Can your automated tests be executed without depending on existing (hard-coded) data on your test environment?", dimension: "TQI", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TQI: independence & design quality ---
  { id: uid("cr"), name: "Are there any automated tests that depend on other tests?", dimension: "TQI", weight: 1.0, scaleMin: 0, scaleMax: 10, enabled: true },
  { id: uid("cr"), name: "Do you use hard-coded pauses/sleeps in your tests?", dimension: "TQI", weight: 1.0, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- ATC: shift-left automation on new features ---
  { id: uid("cr"), name: "Do you automate newly developed features before they are released?", dimension: "ATC", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: planning & roadmap ---
  { id: uid("cr"), name: "Do you perform planning for automated tests tasks? Do you have a test automation roadmap?", dimension: "OTHER", weight: 1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- ATC: scalability of execution ---
  { id: uid("cr"), name: "Are your automated tests executed in parallel or distributed?", dimension: "ATC", weight: 1.0, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- ATC/TQI: portability & reuse across envs ---
  { id: uid("cr"), name: "Is it easy to reuse your tests to be executed against different instances/environments of your system?", dimension: "ATC", weight: 1.0, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TQI: cutting-edge resilience (self-heal, ML analysis, etc.) ---
  { id: uid("cr"), name: "Have you integrated any cutting-edge technologies within your test solution like machine learning auto-analysis of auto-failures or self-healing?", dimension: "TQI", weight: 0.9, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: CI integration overall (could be ATC too; keeping as process/integration) ---
  { id: uid("cr"), name: "Is your test suite integrated with your CI tools?", dimension: "OTHER", weight: 1.1, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- TSI: belief / buy-in / trust (culture) ---
  { id: uid("cr"), name: "Do you currently believe in the value test automation brings to your company?", dimension: "TSI", weight: 1.0, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- OTHER: delivery methodology affects how testing fits ---
  { id: uid("cr"), name: "Do you follow any specific development methodologies/frameworks, such as Agile, Scrum, or Lean?", dimension: "OTHER", weight: 0.8, scaleMin: 0, scaleMax: 10, enabled: true },

  // --- ATC: breadth of test levels (unit/integration/system/acceptance) ---
  { id: uid("cr"), name: "What are the different levels of testing you perform?", dimension: "ATC", weight: 1.0, scaleMin: 0, scaleMax: 10, enabled: true },
];


  return {
    version: 1,
    companies: [c1],
    selectedCompanyId: c1.id,
    criteria,
    assessments: {
      [c1.id]: { scores: {}, notes: {}, updatedAt: nowIso() }
    },
    snapshots: {
      [c1.id]: []
    }
  };
}

let state = loadState() ?? defaultState();
saveState(state);

// DOM
const el = (id) => document.getElementById(id);

const companySelect = el("companySelect");
const criteriaTableBody = el("criteriaTable").querySelector("tbody");
const assessmentTableBody = el("assessmentTable").querySelector("tbody");
const snapTableBody = el("snapTable").querySelector("tbody");
const trendCanvas = el("trendCanvas");

// Metrics fields
const mTSI = el("mTSI");
const mTQI = el("mTQI");
const mATC = el("mATC");
const mTAEI = el("mTAEI");
const mOverallCriteria = el("mOverallCriteria");
const mOverallDims = el("mOverallDims");
const mDeltaCD = el("mDeltaCD");
const mDeltaDC = el("mDeltaDC");
const mWarnings = el("mWarnings");

// ---- helpers
function getCompany() {
  return state.companies.find(c => c.id === state.selectedCompanyId) ?? state.companies[0];
}
function ensureAssessment(companyId) {
  if (!state.assessments[companyId]) state.assessments[companyId] = { scores: {}, notes: {}, updatedAt: nowIso() };
  if (!state.snapshots[companyId]) state.snapshots[companyId] = [];
  return state.assessments[companyId];
}
function fmt(n) {
  return Number.isFinite(n) ? round2(n).toFixed(2) : "—";
}

function recomputeAndRender() {
  const company = getCompany();
  if (!company) return;

  const ass = ensureAssessment(company.id);
  const metrics = computeMetrics({ criteria: state.criteria, scores: ass.scores });

  mTSI.textContent = fmt(metrics.TSI);
  mTQI.textContent = fmt(metrics.TQI);
  mATC.textContent = fmt(metrics.ATC);
  mTAEI.textContent = fmt(metrics.TAEI);
  mOverallCriteria.textContent = fmt(metrics.overallCriteria);
  mOverallDims.textContent = fmt(metrics.overallDims);

  const deltaCD = (Number.isFinite(metrics.overallCriteria) && Number.isFinite(metrics.overallDims))
    ? round2(metrics.overallCriteria - metrics.overallDims)
    : null;

  const deltaDC = (Number.isFinite(metrics.overallCriteria) && Number.isFinite(metrics.overallDims))
    ? round2(metrics.overallDims - metrics.overallCriteria)
    : null;

  mDeltaCD.textContent = Number.isFinite(deltaCD)
    ? (deltaCD >= 0 ? `+${deltaCD.toFixed(2)}` : deltaCD.toFixed(2))
    : "—";

  mDeltaDC.textContent = Number.isFinite(deltaDC)
    ? (deltaDC >= 0 ? `+${deltaDC.toFixed(2)}` : deltaDC.toFixed(2))
    : "—";

  // Flag large disagreement (tune threshold as you like)
  const THRESH = 0.75;
  const deltaCards = [mDeltaCD.closest(".metric"), mDeltaDC.closest(".metric")];
  for (const card of deltaCards) card?.classList.remove("warn");
  if (Number.isFinite(deltaCD) && Math.abs(deltaCD) >= THRESH) {
    for (const card of deltaCards) card?.classList.add("warn");
  }

  const enabled = state.criteria.filter(c => c.enabled !== false);
  const missingDims = DIMENSIONS.filter(d => {
    const hasAny = enabled.some(c => (c.dimension||"").toUpperCase() === d);
    return !hasAny;
  });
  const warns = [];
  if (missingDims.length) warns.push(`No enabled criteria in: ${missingDims.join(", ")}.`);
  if (enabled.length === 0) warns.push("All criteria are disabled. Enable at least one criterion.");
  if (warns.length === 0) warns.push("Tip: Save snapshots regularly to track trends over time.");

  mWarnings.textContent = warns.join(" ");

  // trend chart + snapshot table
  renderSnapshots();
  renderTrendChart(trendCanvas, state.snapshots[company.id] || []);

  saveState(state);
}

function renderCompanies() {
  companySelect.innerHTML = "";
  for (const c of state.companies) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    companySelect.appendChild(opt);
  }
  companySelect.value = state.selectedCompanyId || (state.companies[0]?.id ?? "");
}

function renderCriteria() {
  criteriaTableBody.innerHTML = "";
  for (const c of state.criteria) {
    const tr = document.createElement("tr");

    const tdEnabled = document.createElement("td");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = c.enabled !== false;
    chk.addEventListener("change", () => {
      c.enabled = chk.checked;

      // Clear stored data when disabling (across all companies)
      if (c.enabled === false) {
        for (const co of state.companies) {
          const ass = ensureAssessment(co.id);
          if (ass.scores && Object.prototype.hasOwnProperty.call(ass.scores, c.id)) delete ass.scores[c.id];
          if (ass.notes && Object.prototype.hasOwnProperty.call(ass.notes, c.id)) delete ass.notes[c.id];
          ass.updatedAt = nowIso();
        }
      }

      recomputeAndRender();
      renderAssessment();
    });
    tdEnabled.appendChild(chk);

    const tdName = document.createElement("td");
    const inpName = document.createElement("input");
    inpName.type = "text";
    inpName.value = c.name;
    inpName.style.width = "100%";
    inpName.addEventListener("change", () => {
      c.name = inpName.value.trim() || c.name;
      renderAssessment();
      recomputeAndRender();
    });
    tdName.appendChild(inpName);

    const tdDim = document.createElement("td");
    const sel = document.createElement("select");
    for (const d of [...DIMENSIONS, "OTHER"]) {
      const o = document.createElement("option");
      o.value = d;
      o.textContent = d;
      sel.appendChild(o);
    }
    sel.value = (c.dimension || "OTHER").toUpperCase();
    sel.addEventListener("change", () => {
      c.dimension = sel.value;
      renderAssessment();
      recomputeAndRender();
    });
    tdDim.appendChild(sel);

    const tdWeight = document.createElement("td"); tdWeight.className = "num";
    const w = document.createElement("input");
    w.type = "number"; w.step = "0.1"; w.min = "0";
    w.value = String(c.weight ?? 1);
    w.addEventListener("change", () => { c.weight = Math.max(0, Number(w.value)); recomputeAndRender(); });
    tdWeight.appendChild(w);

    const tdMin = document.createElement("td"); tdMin.className = "num";
    const min = document.createElement("input");
    min.type = "number"; min.step = "1";
    min.value = String(c.scaleMin ?? 0);
    min.addEventListener("change", () => { c.scaleMin = Number(min.value); recomputeAndRender(); renderAssessment(); });
    tdMin.appendChild(min);

    const tdMax = document.createElement("td"); tdMax.className = "num";
    const max = document.createElement("input");
    max.type = "number"; max.step = "1";
    max.value = String(c.scaleMax ?? 10);
    max.addEventListener("change", () => { c.scaleMax = Number(max.value); recomputeAndRender(); renderAssessment(); });
    tdMax.appendChild(max);

    const tdActions = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-danger";
    btnDel.textContent = "Delete";
    btnDel.addEventListener("click", () => {
      if (!confirm(`Delete criterion "${c.name}"? Scores will remain in storage but become orphaned.`)) return;
      state.criteria = state.criteria.filter(x => x.id !== c.id);
      recomputeAndRender();
      renderCriteria();
      renderAssessment();
    });
    tdActions.appendChild(btnDel);

    tr.append(tdEnabled, tdName, tdDim, tdWeight, tdMin, tdMax, tdActions);
    criteriaTableBody.appendChild(tr);
  }
}

function renderAssessment() {
  const company = getCompany();
  if (!company) return;
  const ass = ensureAssessment(company.id);

  state.ui ??= {};
  state.ui.assessmentCollapsedByCompany ??= {};
  const collapsed = (state.ui.assessmentCollapsedByCompany[company.id] ??= {});

  const dimOrder = { TSI: 1, TQI: 2, ATC: 3, OTHER: 4 };

  const items = [...state.criteria]
    .map(c => ({ ...c, _dim: (c.dimension || "OTHER").toUpperCase() }))
    .sort((a, b) =>
      (dimOrder[a._dim] ?? 99) - (dimOrder[b._dim] ?? 99) ||
      a.name.localeCompare(b.name)
    );

  assessmentTableBody.innerHTML = "";

  let currentDim = null;

  function dimHint(dim) {
    if (dim === "TSI") return "Team Skill Index criteria";
    if (dim === "TQI") return "Test Quality Index criteria";
    if (dim === "ATC") return "Automated Testing Coverage criteria";
    return "Other / process & foundations";
  }

  for (const c of items) {
    if (c._dim !== currentDim) {
      currentDim = c._dim;

      const isCollapsed = collapsed[currentDim] === true;
      const arrow = isCollapsed ? "▸" : "▾";

      const trH = document.createElement("tr");
      trH.className = "dim-row";
      trH.dataset.dim = currentDim;

      const tdH = document.createElement("td");
      tdH.colSpan = 5;
      tdH.innerHTML = `
        <div class="dim-title">
          <span class="dim-toggle">${arrow}</span>
          <span>${escapeHtml(currentDim)}</span>
          <span class="dim-hint">— ${escapeHtml(dimHint(currentDim))}</span>
        </div>
      `;

      trH.appendChild(tdH);
      assessmentTableBody.appendChild(trH);
    }

    const isCollapsed = collapsed[c._dim] === true;

    const tr = document.createElement("tr");
    tr.className = "assess-item";
    tr.dataset.dim = c._dim;
    if (isCollapsed) tr.classList.add("is-hidden");

    const tdCrit = document.createElement("td");
    tdCrit.innerHTML = `<div>${escapeHtml(c.name)}</div><div class="mini">${c.id}</div>`;

    const tdDim = document.createElement("td");
    tdDim.textContent = c._dim;

    const tdW = document.createElement("td");
    tdW.className = "num";
    tdW.textContent = String(c.weight ?? 1);

    const tdScore = document.createElement("td");
    tdScore.className = "num";
    const inp = document.createElement("input");
    inp.type = "number";
    inp.step = "0.5";
    inp.min = String(c.scaleMin ?? 0);
    inp.max = String(c.scaleMax ?? 10);
    inp.value = (ass.scores?.[c.id] ?? "").toString();
    inp.placeholder = "—";
    inp.disabled = (c.enabled === false);
    inp.addEventListener("input", () => {
      const v = inp.value === "" ? null : Number(inp.value);
      if (v === null || !Number.isFinite(v)) delete ass.scores[c.id];
      else ass.scores[c.id] = v;
      ass.updatedAt = nowIso();
      recomputeAndRender();
    });
    tdScore.appendChild(inp);

    const tdNotes = document.createElement("td");
    const ta = document.createElement("textarea");
    ta.value = (ass.notes?.[c.id] ?? "");
    ta.placeholder = c.enabled === false ? "(disabled criterion)" : "Notes…";
    ta.disabled = (c.enabled === false);
    ta.addEventListener("change", () => {
      const v = ta.value.trim();
      if (!v) delete ass.notes[c.id];
      else ass.notes[c.id] = v;
      ass.updatedAt = nowIso();
      saveState(state);
    });
    tdNotes.appendChild(ta);

    tr.append(tdCrit, tdDim, tdW, tdScore, tdNotes);
    assessmentTableBody.appendChild(tr);
  }

  saveState(state);
}

function renderSnapshots() {
  const company = getCompany();
  if (!company) return;

  const snaps = state.snapshots[company.id] || [];
  snapTableBody.innerHTML = "";
  for (const s of snaps.slice().reverse()) {
    const tr = document.createElement("tr");

    const when = new Date(s.timestamp);
    const tdWhen = document.createElement("td");
    tdWhen.textContent = when.toLocaleString();

    const tdTSI = td("num", fmt(s.metrics?.TSI));
    const tdTQI = td("num", fmt(s.metrics?.TQI));
    const tdATC = td("num", fmt(s.metrics?.ATC));
    const tdTAEI = td("num", fmt(s.metrics?.TAEI));
    const tdOC = td("num", fmt(s.metrics?.overallCriteria));
    const tdOD = td("num", fmt(s.metrics?.overallDims));

    const tdHash = document.createElement("td");
    tdHash.innerHTML = `<span class="mini">${escapeHtml(s.criteriaHash || "")}</span>`;

    tr.append(tdWhen, tdTSI, tdTQI, tdATC, tdTAEI, tdOC, tdOD, tdHash);
    snapTableBody.appendChild(tr);
  }
}

function td(cls, text) {
  const x = document.createElement("td");
  x.className = cls;
  x.textContent = text;
  return x;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---- events
companySelect.addEventListener("change", () => {
  state.selectedCompanyId = companySelect.value;
  ensureAssessment(state.selectedCompanyId);
  recomputeAndRender();
  renderAssessment();
});

el("btnAddCompany").addEventListener("click", () => {
  const name = prompt("Company name?");
  if (!name) return;
  const c = { id: uid("co"), name: name.trim(), createdAt: nowIso() };
  state.companies.push(c);
  state.selectedCompanyId = c.id;
  ensureAssessment(c.id);
  renderCompanies();
  renderAssessment();
  recomputeAndRender();
});

el("btnRenameCompany").addEventListener("click", () => {
  const c = getCompany(); if (!c) return;
  const name = prompt("New name?", c.name);
  if (!name) return;
  c.name = name.trim();
  renderCompanies();
  saveState(state);
});

el("btnDeleteCompany").addEventListener("click", () => {
  const c = getCompany(); if (!c) return;
  if (!confirm(`Delete company "${c.name}"? This removes its assessments and snapshots.`)) return;

  state.companies = state.companies.filter(x => x.id !== c.id);
  delete state.assessments[c.id];
  delete state.snapshots[c.id];

  state.selectedCompanyId = state.companies[0]?.id ?? "";
  renderCompanies();
  renderAssessment();
  recomputeAndRender();
});

el("btnAddCriterion").addEventListener("click", () => {
  const name = prompt("Criterion name?");
  if (!name) return;
  const dim = prompt("Dimension? (TSI / TQI / ATC / OTHER)", "TQI") || "OTHER";
  state.criteria.push({
    id: uid("cr"),
    name: name.trim(),
    dimension: dim.trim().toUpperCase(),
    weight: 1,
    scaleMin: 0,
    scaleMax: 10,
    enabled: true
  });
  renderCriteria();
  renderAssessment();
  recomputeAndRender();
});

el("btnClearScores").addEventListener("click", () => {
  const c = getCompany(); if (!c) return;
  if (!confirm(`Clear all scores & notes for "${c.name}" (snapshots remain)?`)) return;
  state.assessments[c.id] = { scores: {}, notes: {}, updatedAt: nowIso() };
  renderAssessment();
  recomputeAndRender();
});

el("btnSaveSnapshot").addEventListener("click", () => {
  const c = getCompany(); if (!c) return;
  const ass = ensureAssessment(c.id);
  const metrics = computeMetrics({ criteria: state.criteria, scores: ass.scores });
  const snap = {
    timestamp: nowIso(),
    scores: structuredClone(ass.scores),
    metrics,
    criteriaHash: hashCriteria(state.criteria)
  };
  state.snapshots[c.id].push(snap);
  recomputeAndRender();
});

el("btnDeleteLastSnapshot").addEventListener("click", () => {
  const c = getCompany(); if (!c) return;
  const snaps = state.snapshots[c.id] || [];
  if (!snaps.length) return;
  if (!confirm("Delete the last snapshot?")) return;
  snaps.pop();
  recomputeAndRender();
});

// Export/Import/Reset
el("btnExport").addEventListener("click", () => downloadJson(state));

el("fileImport").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const imported = await importJsonFile(file);
    if (!imported || imported.version !== 1) {
      alert("Unsupported import file (expected version 1).");
      return;
    }
    state = imported;
    saveState(state);
    init();
  } catch (err) {
    alert("Import failed: " + (err?.message || String(err)));
  } finally {
    e.target.value = "";
  }
});

el("btnReset").addEventListener("click", () => {
  if (!confirm("Reset everything? This clears LocalStorage for this app.")) return;
  resetState();
  state = defaultState();
  saveState(state);
  init();
});

// Toggle assessment dimension collapse/expand (event delegation)
assessmentTableBody.addEventListener("click", (e) => {
  const headerRow = e.target.closest?.("tr.dim-row");
  if (!headerRow) return;

  const company = getCompany();
  if (!company) return;

  const dim = headerRow.dataset.dim;
  if (!dim) return;

  state.ui ??= {};
  state.ui.assessmentCollapsedByCompany ??= {};
  const collapsed = (state.ui.assessmentCollapsedByCompany[company.id] ??= {});

  collapsed[dim] = !collapsed[dim];
  saveState(state);

  renderAssessment();      // re-render table to apply hiding
  recomputeAndRender();    // optional; safe (keeps everything in sync)
});


// ---- init
function init() {
  renderCompanies();
  renderCriteria();
  renderAssessment();
  recomputeAndRender();
}

init();
