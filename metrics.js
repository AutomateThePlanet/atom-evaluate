export function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function hashCriteria(criteria) {
  // Simple stable-ish hash for v1: stringify essential fields in sorted id order
  const slim = [...criteria]
    .map(c => ({
      id: c.id, name: c.name, dimension: c.dimension,
      weight: c.weight, scaleMin: c.scaleMin, scaleMax: c.scaleMax, enabled: c.enabled
    }))
    .sort((a,b)=>a.id.localeCompare(b.id));

  const s = JSON.stringify(slim);
  let h = 2166136261; // FNV-1a-ish
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function weightedAverage(items) {
  // items: [{value, weight}]
  let wSum = 0;
  let vSum = 0;
  for (const it of items) {
    const w = Number(it.weight ?? 1);
    if (!(w > 0)) continue;
    const v = Number(it.value);
    if (!Number.isFinite(v)) continue;
    wSum += w;
    vSum += v * w;
  }
  return wSum > 0 ? (vSum / wSum) : null;
}

export function computeMetrics({ criteria, scores }) {
  // criteria: array
  // scores: { [criterionId]: number }
  const enabled = criteria.filter(c => c.enabled !== false);

  // Normalize each score to 0–10 based on criterion scale
  const normItems = enabled.map(c => {
    const raw = scores?.[c.id];
    const min = Number.isFinite(c.scaleMin) ? c.scaleMin : 0;
    const max = Number.isFinite(c.scaleMax) ? c.scaleMax : 10;
    if (!Number.isFinite(raw)) return { id: c.id, dim: c.dimension, weight: c.weight, value: null };

    const clamped = clamp(Number(raw), min, max);
    const normalized = (max === min) ? 0 : ((clamped - min) / (max - min)) * 10;
    return { id: c.id, dim: c.dimension, weight: c.weight ?? 1, value: normalized };
  });

  const byDim = {};
  for (const it of normItems) {
    const dim = (it.dim || "Other").toUpperCase();
    if (!byDim[dim]) byDim[dim] = [];
    if (Number.isFinite(it.value)) byDim[dim].push({ value: it.value, weight: it.weight });
  }

  const dims = ["TSI","TQI","ATC"];
  const dimScores = {};
  for (const d of dims) {
    const avg = weightedAverage(byDim[d] || []);
    dimScores[d] = avg == null ? null : round2(avg);
  }

  const overallCriteria = (() => {
    const all = normItems
      .filter(it => Number.isFinite(it.value))
      .map(it => ({ value: it.value, weight: it.weight }));
    const avg = weightedAverage(all);
    return avg == null ? null : round2(avg);
  })();

  const overallDims = (() => {
    // average only over available dims (not null)
    const present = dims.map(d => dimScores[d]).filter(v => Number.isFinite(v));
    if (!present.length) return null;
    const avg = present.reduce((a,b)=>a+b,0) / present.length;
    return round2(avg);
  })();

  const taei = (() => {
    // ATOM definition uses the three indices; if any missing, return null
    if (!Number.isFinite(dimScores.TSI) || !Number.isFinite(dimScores.TQI) || !Number.isFinite(dimScores.ATC)) return null;
    return round2((dimScores.TSI + dimScores.TQI + dimScores.ATC) / 3);
  })();

  return {
    ...dimScores,
    TAEI: taei,
    overallCriteria,
    overallDims
  };
}
