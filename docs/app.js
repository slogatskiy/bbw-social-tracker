/* Build-A-Bear Workshop — Demand & Brand-Equity Tracker.
   Loads data/*.json and renders an institutional, multi-signal dashboard.
   All data is static JSON, so the page runs on GitHub Pages with no backend. */

const C = {
  accent: "#f5a623", blue: "#4f8cff", good: "#38c793", bad: "#ff6b6b",
  grid: "rgba(255,255,255,.05)", text: "#9aa6cc",
};
const ARROW = { up: ["▲", "up"], down: ["▼", "down"], flat: ["—", "flat"] };
const TREND = { up: ["↑", "trend-up"], flat: ["→", "trend-flat"], down: ["↓", "trend-down"] };

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString("en-US");
const money = (n) => "$" + fmt(n);

async function loadJSON(p) {
  const r = await fetch(p, { cache: "no-store" });
  if (!r.ok) throw new Error(`${p}: ${r.status}`);
  return r.json();
}

function chartBase(extra = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { labels: { color: C.text, usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
      tooltip: { backgroundColor: "#0a0d18", borderColor: "#232e52", borderWidth: 1,
        titleColor: "#eef1fa", bodyColor: "#cfd6f0", padding: 10 },
    },
    scales: {
      x: { grid: { color: C.grid }, ticks: { color: C.text, maxTicksLimit: 9, font: { size: 11 } } },
      y: { grid: { color: C.grid }, ticks: { color: C.text, font: { size: 11 } }, beginAtZero: true },
    },
    ...extra,
  };
}
function badge(el, isIllustrative, liveLabel = "live") {
  if (!el) return;
  if (isIllustrative) { el.textContent = "illustrative"; el.className = "badge illustrative"; }
  else { el.textContent = liveLabel; el.className = "badge real"; }
}
function movingAvg(vals, w) {
  return vals.map((_, i) => {
    const s = vals.slice(Math.max(0, i - w + 1), i + 1).filter(v => v != null);
    return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
  });
}
function cagr(first, last, years) { return (Math.pow(last / first, 1 / years) - 1) * 100; }
function yearsBetween(d1, d2) {
  return (new Date(d2 + "-01") - new Date(d1 + "-01")) / (365.25 * 864e5);
}
function scorecard(val, lab, cls = "") {
  return `<div class="scorecard"><div class="s-val ${cls}">${val}</div><div class="s-lab">${lab}</div></div>`;
}

/* ---------- header ---------- */
function renderHeader(m, kpis) {
  $("ticker").textContent = m.ticker;
  $("generated").textContent = m.generated;
  $("headline").textContent = m.project;
  $("exec").textContent = m.summary;
  $("updated").textContent = m.generated;
  $("pills").innerHTML = (m.signals || []).map(s => `<span>${s}</span>`).join("");
  $("kpi-strip").innerHTML = kpis.cards.map(c => {
    const [g, cls] = ARROW[c.trend] || ARROW.flat;
    return `<div class="kpi">
      <div class="k-label">${c.label}</div>
      <div class="k-value">${c.value}<span class="arrow ${cls}">${g}</span></div>
      <div class="k-sub">${c.sub}</div><div class="k-src">${c.source}</div></div>`;
  }).join("");
}

/* ---------- 01 search ---------- */
function renderTrends(gt) {
  badge($("search-badge"), gt.is_illustrative);
  $("trends-note").textContent = gt.note || "";
  const labels = gt.series.map(r => r.date);
  const main = gt.queries[0], mainVals = gt.series.map(r => r[main]);
  const ds = [
    { label: `${main} (12-mo avg)`, data: movingAvg(mainVals, 12), borderColor: C.accent,
      backgroundColor: "rgba(245,166,35,.10)", borderWidth: 3, pointRadius: 0, tension: .4, fill: true, order: 0 },
    { label: `${main} (monthly)`, data: mainVals, borderColor: "rgba(245,166,35,.4)",
      backgroundColor: "transparent", borderWidth: 1.25, pointRadius: 0, tension: .35, order: 1 },
  ];
  if (gt.queries[1]) {
    const q2 = gt.queries[1];
    ds.push({ label: `${q2} (monthly)`, data: gt.series.map(r => r[q2]),
      borderColor: "rgba(79,140,255,.7)", backgroundColor: "transparent", borderWidth: 1.5, pointRadius: 0, tension: .35, order: 2 });
  }
  new Chart($("trendsChart"), { type: "line", data: { labels, datasets: ds }, options: chartBase() });
}

/* ---------- 02 community ---------- */
function renderReddit(rd, topics) {
  badge($("reddit-badge"), rd.is_illustrative);
  $("reddit-note").textContent = rd.note || "";
  const labels = rd.series.map(r => r.date), values = rd.series.map(r => r.value);
  new Chart($("redditChart"), {
    type: "line",
    data: { labels, datasets: [{ label: "subscribers", data: values, borderColor: C.accent,
      backgroundColor: "rgba(245,166,35,.12)", borderWidth: 2, pointRadius: 2, fill: true, tension: .3 }] },
    options: chartBase({ plugins: { legend: { display: false } } }),
  });
  const first = values[0], last = values[values.length - 1];
  const yrs = yearsBetween(rd.series[0].date, rd.series.at(-1).date);
  $("reddit-scorecards").innerHTML =
    scorecard(fmt(last), "current members (latest point)", "amber") +
    scorecard(`+${cagr(first, last, yrs).toFixed(1)}%`, `CAGR over ~${yrs.toFixed(0)} yrs`, "pos") +
    scorecard(`${(last / first).toFixed(1)}×`, `since ${rd.series[0].date.slice(0, 4)}`);
  $("reddit-tax").innerHTML = topics.topics.map(t => {
    const [g, cls] = TREND[t.trend] || TREND.flat;
    return `<div class="tax-row"><div class="emoji">${t.emoji}</div><div>
      <div class="t-name">${t.name} <span class="t-share">${t.share}%</span> <span class="${cls}">${g}</span></div>
      <div class="t-ins">${t.insight}</div></div></div>`;
  }).join("");
}

/* ---------- 03 social ---------- */
function renderSocial(s) {
  $("social-grid").innerHTML = s.cards.map(c =>
    `<div class="q-card"><h4>${c.h}</h4><p>${c.p}</p><div class="src">${c.s}</div></div>`).join("");
}

/* ---------- 04 digital (roblox) ---------- */
function renderRoblox(rb) {
  $("roblox-note").textContent = rb.note || "";
  const labels = rb.series.map(r => r.date), values = rb.series.map(r => r.visits);
  new Chart($("robloxChart"), {
    type: "line",
    data: { labels, datasets: [{ label: "cumulative visits", data: values, borderColor: C.blue,
      backgroundColor: "rgba(79,140,255,.12)", borderWidth: 2, pointRadius: 0, fill: true, tension: .3 }] },
    options: chartBase({ plugins: { legend: { display: false } },
      scales: { x: { grid: { color: C.grid }, ticks: { color: C.text, maxTicksLimit: 8, font: { size: 11 } } },
        y: { grid: { color: C.grid }, beginAtZero: true,
          ticks: { color: C.text, font: { size: 11 }, callback: v => (v / 1e6).toFixed(0) + "M" } } } }),
  });
  const cur = rb.current;
  $("roblox-scorecards").innerHTML =
    scorecard(fmt(cur.visits), "cumulative visits (live)", "amber") +
    scorecard(fmt(cur.favorites), "favorites") +
    scorecard(fmt(cur.playing), "playing now");
}

/* ---------- 05 resale ---------- */
function renderResale(rs) {
  const rows = rs.sales.slice().sort((a, b) => b.price - a.price);
  $("resale-table").innerHTML =
    `<thead><tr><th>Item</th><th>Sold</th><th>Price</th></tr></thead><tbody>` +
    rows.map(s => `<tr><td>${s.item}</td><td class="date">${s.date}</td><td class="price">${money(s.price)}</td></tr>`).join("") +
    `</tbody>`;
  const top = rows[0].price, n = rows.length;
  const aboveRetail = Math.round(top / 40); // ~ vs $40 original retail
  $("resale-scorecards").innerHTML =
    scorecard(money(top), "top realized sale", "pos") +
    scorecard(`~${aboveRetail}×`, "vs. ~$40 original retail", "amber") +
    scorecard(n, "four/five-figure clears tracked");
}

/* ---------- 06 retail & commercial ---------- */
function renderRetail(rt) {
  const segs = rt.segments_fy2024, maxPct = Math.max(...segs.map(s => s.pct));
  $("segbars").innerHTML = segs.map((s, i) => `
    <div class="segbar ${i ? "alt" : ""}">
      <div class="seg-top"><span>${s.segment}</span><b>$${s.value}M · ${s.pct}%</b></div>
      <div class="track"><div class="fill" style="width:${(s.pct / maxPct * 100).toFixed(1)}%"></div></div>
    </div>`).join("");
  $("segments-note").textContent = rt.segments_note || "";

  const loc = rt.locations;
  $("loc-asof").textContent = loc.as_of;
  $("loc-table").innerHTML =
    `<thead><tr><th>Model</th><th>Locations</th><th>Share</th></tr></thead><tbody>` +
    loc.mix.map(m => `<tr><td>${m.type}</td><td class="num">${m.value}</td><td class="num">${(m.value / loc.total * 100).toFixed(0)}%</td></tr>`).join("") +
    `<tr><td><b>Total</b></td><td class="num"><b>${loc.total}</b></td><td class="num">100%</td></tr></tbody>`;
  $("loc-note").textContent = loc.guidance;

  $("retail-scorecards").innerHTML =
    scorecard(fmt(loc.total), "global experience locations", "amber") +
    scorecard(`+${loc.fy2024_end.net_new}`, "net new locations in FY2024", "pos") +
    scorecard("+21.6%", "commercial + franchising rev, FY2025", "pos") +
    scorecard("+37.5%", "those segments in Q4 FY2025", "pos");
}

/* ---------- 07 convergence ---------- */
function renderConvergence(m) {
  $("conv-lead").textContent = m.convergence;
  const cells = [
    { sig: "Search", read: "Trend rising through seasonality", dir: "↑ structural", cls: "trend-up" },
    { sig: "Community", read: "Subscribers compounding; collector mix", dir: "↑ growing", cls: "trend-up" },
    { sig: "Digital", read: "24M+ Roblox visits, always-on", dir: "↑ growing", cls: "trend-up" },
    { sig: "Resale", read: "Four/five-figure clears for retired plush", dir: "↑ scarcity value", cls: "trend-up" },
    { sig: "Social", read: "TikTok-driven adult acquisition", dir: "↑ emerging", cls: "trend-up" },
    { sig: "Retail mix", read: "Asset-light commercial + franchise", dir: "↑ +21.6% FY25", cls: "trend-up" },
    { sig: "Loyalty", read: "~20M Bonus Club, early-access drops", dir: "→ large base", cls: "trend-flat" },
    { sig: "Awareness", read: "90%+ aided, #1 NA toy retailer", dir: "→ near-ceiling", cls: "trend-flat" },
  ];
  $("conv-grid").innerHTML = cells.map(c =>
    `<div class="conv-cell"><div class="c-sig">${c.sig}</div><div class="c-read">${c.read}</div>
     <div class="c-dir ${c.cls}">${c.dir}</div></div>`).join("");
}

/* ---------- boot ---------- */
(async function () {
  try {
    const [m, kpis, gt, rd, topics, social, rb, rs, rt] = await Promise.all([
      loadJSON("data/manifest.json"), loadJSON("data/kpis.json"),
      loadJSON("data/google_trends.json"), loadJSON("data/reddit_subscribers.json"),
      loadJSON("data/reddit_topics.json"), loadJSON("data/social.json"),
      loadJSON("data/roblox.json"), loadJSON("data/resale.json"), loadJSON("data/retail.json"),
    ]);
    renderHeader(m, kpis);
    renderTrends(gt);
    renderReddit(rd, topics);
    renderSocial(social);
    renderRoblox(rb);
    renderResale(rs);
    renderRetail(rt);
    renderConvergence(m);
  } catch (e) {
    $("exec").innerHTML = `<b style="color:#ff6b6b">Failed to load data:</b> ${e.message}`;
    console.error(e);
  }
})();
