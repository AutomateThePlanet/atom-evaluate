import { round2 } from "./metrics.js";

export function renderTrendChart(canvas, snapshots) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0,0,W,H);

  // Frame
  ctx.fillStyle = "rgba(0,0,0,.10)";
  ctx.fillRect(0,0,W,H);

  const pad = { l: 46, r: 16, t: 18, b: 32 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const points = (snapshots || []).map(s => ({
    t: new Date(s.timestamp).getTime(),
    TAEI: s.metrics?.TAEI,
    overallC: s.metrics?.overallCriteria
  }));

  const valid = points.filter(p => Number.isFinite(p.TAEI) || Number.isFinite(p.overallC));
  if (valid.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "14px system-ui";
    ctx.fillText("Add 2+ snapshots to see a trend line.", pad.l, pad.t + 18);
    drawAxes(ctx, pad, iw, ih);
    return;
  }

  const tMin = Math.min(...valid.map(p=>p.t));
  const tMax = Math.max(...valid.map(p=>p.t));
  const x = (t) => pad.l + (tMax === tMin ? 0 : ((t - tMin) / (tMax - tMin)) * iw);
  const y = (v) => pad.t + (10 - v) / 10 * ih;

  drawAxes(ctx, pad, iw, ih);

  // Series helper
  function drawSeries(key, color, label, legendXOffset = 0) {
    const series = points.filter(p => Number.isFinite(p[key]));
    if (series.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach((p, i) => {
      const xx = x(p.t), yy = y(p[key]);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();

    // dots
    ctx.fillStyle = color;
    for (const p of series) {
      const xx = x(p.t), yy = y(p[key]);
      ctx.beginPath();
      ctx.arc(xx, yy, 3.2, 0, Math.PI*2);
      ctx.fill();
    }

    // legend
    ctx.fillStyle = color;
    ctx.font = "12px system-ui";
    ctx.fillText(label, pad.l + 6 + legendXOffset, pad.t - 4);
  }

  drawSeries("TAEI", "rgba(93,214,199,.95)", "TAEI", 0);
  drawSeries("overallC", "rgba(207,224,255,.90)", "Overall (Criteria)", 56);

  // last value label
  const last = valid[valid.length - 1];
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "12px system-ui";
  const lv = [];
  if (Number.isFinite(last.TAEI)) lv.push(`TAEI ${round2(last.TAEI)}`);
  if (Number.isFinite(last.overallC)) lv.push(`Overall(C) ${round2(last.overallC)}`);
  ctx.fillText(lv.join(" • "), pad.l, H - 10);
}

function drawAxes(ctx, pad, iw, ih) {
  // grid + y labels (0..10)
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;

  for (let i=0;i<=5;i++){
    const v = i*2;
    const yy = pad.t + (10 - v)/10 * ih;
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(pad.l + iw, yy);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "11px system-ui";
    ctx.fillText(String(v), 14, yy + 4);
  }

  // axis box
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.strokeRect(pad.l, pad.t, iw, ih);
}
