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
/* axis-title helper so every chart states its unit of measure */
function axT(text) { return { display: true, text, color: C.text, font: { size: 11, weight: "500" } }; }

/* Clickable, attributed source badges. Wrap the existing label text in a link. */
const SRC_LINKS = {
  "social-src": "https://www.tiktok.com/@buildabear",
  "reddit-src": "https://www.reddit.com/r/buildabear/",
  "search-src": "https://trends.google.com/trends/explore?date=today%205-y&geo=US&q=Build-A-Bear",
  "roblox-src": "https://www.roblox.com/games/11573230049/",
  "ecom-src": "https://ir.buildabear.com/",
  "resale-src": "https://www.ebay.com/sch/i.html?_nkw=build-a-bear&_sop=16&LH_Complete=1&LH_Sold=1",
};
function linkifySources() {
  for (const [id, href] of Object.entries(SRC_LINKS)) {
    const el = $(id);
    if (el && !el.querySelector("a")) {
      el.innerHTML = `<a href="${href}" target="_blank" rel="noopener">${el.textContent} ↗</a>`;
    }
  }
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
  if (m.bottom_line) $("bottomline").innerHTML = `<b>Bottom line.</b> ${m.bottom_line.replace(/^Bottom line:\s*/, "")}`;
  $("pills").innerHTML = (m.signals || []).map(s => `<span>${s}</span>`).join("");
  $("kpi-strip").innerHTML = kpis.cards.map(c => {
    const [g, cls] = ARROW[c.trend] || ARROW.flat;
    return `<div class="kpi">
      <div class="k-label">${c.label}</div>
      <div class="k-value">${c.value}<span class="arrow ${cls}">${g}</span></div>
      <div class="k-sub">${c.sub}</div><div class="k-src">${c.url
        ? `<a href="${c.url}" target="_blank" rel="noopener">${c.source} ↗</a>` : c.source}</div></div>`;
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
  new Chart($("trendsChart"), { type: "line", data: { labels, datasets: ds }, options: chartBase({
    scales: {
      x: { grid: { color: C.grid }, ticks: { color: C.text, maxTicksLimit: 9, font: { size: 11 } } },
      y: { grid: { color: C.grid }, ticks: { color: C.text, font: { size: 11 } }, beginAtZero: true, max: 100,
        title: axT("Relative search interest (0–100)") },
    },
  }) });
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
    options: chartBase({ plugins: { legend: { display: false } },
      scales: { x: { grid: { color: C.grid }, ticks: { color: C.text, maxTicksLimit: 9, font: { size: 11 } } },
        y: { grid: { color: C.grid }, beginAtZero: true,
          ticks: { color: C.text, font: { size: 11 }, callback: v => (v / 1e3) + "K" }, title: axT("Subscribers") } } }),
  });
  // Every point is a real Wayback archive value now — stats run over the full archived history.
  const reals = rd.series.filter(p => p.real);
  const a0 = reals[0], a1 = reals.at(-1);
  const yrs = yearsBetween(a0.date, a1.date);
  const dec23 = rd.series.find(p => p.date === "2023-12") || a0;
  $("reddit-scorecards").innerHTML =
    scorecard(fmt(a1.value), `members · ${a1.date} · archived`, "amber") +
    scorecard(`+${((a1.value / dec23.value - 1) * 100).toFixed(0)}%`,
      `since Dec-2023 (${fmt(dec23.value)})`, "pos") +
    scorecard(`+${cagr(a0.value, a1.value, yrs).toFixed(0)}%/yr`, `CAGR since ${a0.date.slice(0, 4)} (archived)`, "pos");
  // Qualitative mode (no real post classification yet): show themes WITHOUT
  // invented percentages or trend arrows. The collector flips this to real shares.
  const qualitative = topics.qualitative || topics.is_illustrative;
  const tb = $("reddit-tax-badge");
  if (tb) { tb.textContent = qualitative ? "qualitative" : "real"; tb.className = "badge " + (qualitative ? "illustrative" : "real"); }
  if (topics.note) { const n = $("reddit-tax-note"); if (n) n.textContent = topics.note; }
  $("reddit-tax").innerHTML = topics.topics.map(t => {
    let nums = "";
    if (!qualitative && t.share != null) {
      const [g, cls] = TREND[t.trend] || TREND.flat;
      nums = ` <span class="t-share">${t.share}%</span> <span class="${cls}">${g}</span>`;
    }
    return `<div class="tax-row"><div class="emoji">${t.emoji}</div><div>
      <div class="t-name">${t.name}${nums}</div>
      <div class="t-ins">${t.insight}</div></div></div>`;
  }).join("");
}

/* ---------- 03 social ---------- */
function renderSocial(s) {
  const p = s.platforms;
  $("social-note").textContent = s.hashtag_note || "";
  new Chart($("socialChart"), {
    type: "bar",
    data: {
      labels: p.map(x => x.platform),
      datasets: [{
        label: "followers",
        data: p.map(x => x.followers),
        backgroundColor: p.map(x => x.accent ? C.accent : "rgba(79,140,255,.7)"),
        borderRadius: 5, barThickness: 26,
      }],
    },
    options: chartBase({
      indexAxis: "y",
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: (c) => " " + fmt(c.raw) + " followers" } } },
      scales: {
        x: { grid: { color: C.grid }, beginAtZero: true, title: axT("Followers"),
          ticks: { color: C.text, font: { size: 11 }, callback: v => v >= 1e6 ? (v / 1e6) + "M" : (v / 1e3) + "K" } },
        y: { grid: { display: false }, ticks: { color: C.text, font: { size: 12 } } },
      },
    }),
  });
  const tt = p.find(x => x.platform === "TikTok");
  $("social-scorecards").innerHTML =
    scorecard(fmt(tt.followers), "TikTok followers (@buildabear)", "amber") +
    scorecard(tt.extra || "—", "total TikTok likes", "pos") +
    scorecard("13M+", "views on a single viral BBW TikTok", "pos") +
    scorecard("18+", "'Bear Cave' adults-only product line");
  $("social-grid").innerHTML = s.cards.map(c =>
    `<div class="q-card"><h4>${c.h}</h4><p>${c.p}</p><div class="src">${c.u
      ? `<a href="${c.u}" target="_blank" rel="noopener">${c.s} ↗</a>` : c.s}</div></div>`).join("");
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
        y: { grid: { color: C.grid }, beginAtZero: true, title: axT("Cumulative visits"),
          ticks: { color: C.text, font: { size: 11 }, callback: v => (v / 1e6).toFixed(0) + "M" } } } }),
  });
  const cur = rb.current;
  $("roblox-scorecards").innerHTML =
    scorecard(fmt(cur.visits), "cumulative visits (live)", "amber") +
    scorecard(fmt(cur.favorites), "favorites") +
    scorecard(fmt(cur.playing), "playing now");
}

/* ---------- 05 resale ---------- */
const CAT_COLORS = {
  "Sanrio / Hello Kitty": "#ff5d9e", "Limited / Seasonal": "#f5a623",
  "My Little Pony": "#9b8cff", "Zoo / Exclusive": "#38c793",
  "Licensed / Auto": "#4f8cff", "Other": "#8b97bf",
};
const dateToYear = (d) => Number(d.slice(0, 4)) + (Number(d.slice(5, 7)) - 1) / 12;

function renderResale(rs) {
  $("resale-note").textContent = rs.methodology || "";
  const cats = [...new Set(rs.sales.map(s => s.category))];
  const datasets = cats.map(cat => ({
    label: cat,
    data: rs.sales.filter(s => s.category === cat).map(s => ({ x: dateToYear(s.date), y: s.price, item: s.item, date: s.date })),
    backgroundColor: CAT_COLORS[cat] || "#8b97bf",
    pointRadius: 6, pointHoverRadius: 8,
  }));
  new Chart($("resaleChart"), {
    type: "scatter",
    data: { datasets },
    options: chartBase({
      plugins: {
        legend: { labels: { color: C.text, usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
        tooltip: { callbacks: { label: (c) => ` ${c.raw.item}: ${money(c.raw.y)} (${c.raw.date})` } },
      },
      scales: {
        x: { grid: { color: C.grid }, ticks: { color: C.text, font: { size: 11 }, stepSize: 1, callback: v => Math.round(v) }, min: 2021, max: 2026, title: axT("Year sold") },
        y: { type: "logarithmic", grid: { color: C.grid }, title: axT("Realized price (log scale)"),
          ticks: { color: C.text, font: { size: 11 }, callback: v => ([100, 250, 1000, 3000, 10000].includes(v) ? money(v) : null) } },
      },
    }),
  });
  const rows = rs.sales.slice().sort((a, b) => b.price - a.price);
  const tbl = $("resale-table");
  if (tbl) tbl.innerHTML =
    `<thead><tr><th>Item</th><th>Category</th><th>Sold</th><th>Price</th></tr></thead><tbody>` +
    rows.map(s => `<tr><td>${s.item}</td><td style="color:${CAT_COLORS[s.category] || "#8b97bf"}">${s.category}</td><td class="date">${s.date}</td><td class="price">${money(s.price)}</td></tr>`).join("") +
    `</tbody>`;
  const top = rows[0].price, retail = rs.retail_anchor || 40;
  $("resale-scorecards").innerHTML =
    scorecard(money(top), "top realized sale", "pos") +
    scorecard(`~${Math.round(top / retail)}×`, `vs. ~$${retail} original retail`, "amber") +
    scorecard(rows.filter(s => s.price >= 1000).length, "four/five-figure clears tracked");
}

/* ---------- 06 retail & commercial ---------- */
function renderRetail(rt) {
  const segs = rt.segments, maxPct = Math.max(...segs.map(s => s.pct));
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
    scorecard(`$${rt.total_revenue}M`, `${rt.fiscal_year} total revenue — record (+6.7%)`, "pos") +
    (rt.pretax_income ? scorecard(`$${rt.pretax_income}M`, `${rt.fiscal_year} pre-tax income — record`, "pos") : "") +
    scorecard(`${loc.net_new_recent}`, "net new locations (2nd straight yr)", "amber") +
    scorecard("+21.6%", "commercial + franchising rev YoY", "pos");
}

/* ---------- 05 online demand (e-commerce) ---------- */
function renderEcommerce(ec) {
  $("ecom-note").textContent = ec.note || "";
  const labels = ec.series.map(r => r.q), vals = ec.series.map(r => r.change);
  new Chart($("ecomChart"), {
    type: "bar",
    data: { labels, datasets: [{ label: "e-commerce demand YoY %", data: vals,
      backgroundColor: vals.map(v => v >= 0 ? "rgba(56,199,147,.8)" : "rgba(255,107,107,.8)"),
      borderRadius: 5 }] },
    options: chartBase({
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw > 0 ? "+" : ""}${c.raw}% YoY` } } },
      scales: { x: { grid: { color: C.grid }, ticks: { color: C.text, font: { size: 12 } } },
        y: { grid: { color: C.grid }, title: axT("E-commerce demand, YoY %"),
          ticks: { color: C.text, font: { size: 11 }, callback: v => v + "%" } } },
    }),
  });
  const latest = ec.series.at(-1), best = ec.series.reduce((a, b) => b.change > a.change ? b : a);
  const declines = ec.series.filter(s => s.change < 0).length;
  $("ecom-scorecards").innerHTML =
    scorecard(`${latest.change}%`, `latest demand (${latest.q})`, "neg") +
    scorecard(`${declines} of ${ec.series.length}`, "recent quarters with YoY decline", "") +
    scorecard(`+${best.change}%`, `peak was ${best.q}`, "amber");
  const a = ec.audience;
  if (a) {
    $("ecom-audience").innerHTML =
      scorecard(a.monthly_visits, `monthly visits (${a.visits_trend})`, "amber") +
      scorecard(a.top_age, "largest age cohort — adults", "pos") +
      scorecard(`${a.female_pct}%`, "female audience", "pos") +
      scorecard(a.traffic_lead, "lead traffic — non-paid", "amber");
    const an = $("ecom-aud-note"); if (an) an.textContent = a.note || "";
    const src = $("ecom-aud-src"); if (src && a.source) src.textContent = a.source.replace("SimilarWeb estimate — ", "SimilarWeb · ");
  }
}

/* ---------- 07 convergence ---------- */
function renderConvergence(m) {
  $("conv-lead").textContent = m.convergence;
  const cells = [
    { sig: "Social / TikTok", read: "0.8M TikTok-led audience; 18+ line", dir: "↑ growing", cls: "trend-up" },
    { sig: "Community", read: "Subscribers compounding; collector mix", dir: "↑ growing", cls: "trend-up" },
    { sig: "Search", read: "Trend rising through seasonality", dir: "↑ structural", cls: "trend-up" },
    { sig: "Digital", read: "24M+ Roblox visits, always-on", dir: "↑ growing", cls: "trend-up" },
    { sig: "Online / e-comm", read: "Adult audience, but demand softened (−26.1% Q1 FY26)", dir: "↓ watch-item", cls: "trend-down" },
    { sig: "Resale", read: "Four/five-figure clears for retired plush", dir: "↑ scarcity value", cls: "trend-up" },
    { sig: "Retail mix", read: "Asset-light commercial + franchise", dir: "↑ +21.6% FY25", cls: "trend-up" },
    { sig: "Loyalty", read: "~20M Bonus Club, early-access drops", dir: "→ large base", cls: "trend-flat" },
  ];
  $("conv-grid").innerHTML = cells.map(c =>
    `<div class="conv-cell"><div class="c-sig">${c.sig}</div><div class="c-read">${c.read}</div>
     <div class="c-dir ${c.cls}">${c.dir}</div></div>`).join("");
  if (m.caveats && m.caveats.length) {
    $("caveats").innerHTML = `<h4>Caveats &amp; what we're watching</h4><ul>` +
      m.caveats.map(c => `<li>${c}</li>`).join("") + `</ul>`;
  }
}

/* ---------- 08b convergence: cross-signal growth table ---------- */
function renderConvergenceCharts(gt, rd, rb, social, ec, rs, rt) {
  const sv = gt.series.map(r => r[gt.queries[0]]);
  // ---- cross-signal growth table ----
  const pct = (a, b) => (b / a - 1) * 100;
  const cagrPct = (a, b, yrs) => (Math.pow(b / a, 1 / yrs) - 1) * 100;
  const last12 = sv.slice(-12).reduce((x, y) => x + y, 0) / 12;
  const prev12 = sv.slice(-24, -12).reduce((x, y) => x + y, 0) / 12;
  const reals = rd.series.filter(p => p.real), r0 = reals[0], r1 = reals.at(-1);
  const ryrs = yearsBetween(r0.date, r1.date);
  const rb0 = rb.series.find(p => p.date === "2023-12") || rb.series.filter(p => p.visits > 0)[0];
  const rbyrs = yearsBetween(rb0.date, rb.current.updated.slice(0, 7));
  const best = ec.series.reduce((a, b) => b.change > a.change ? b : a);
  const top = rs.sales.slice().sort((a, b) => b.price - a.price)[0];
  const tt = social.platforms.find(p => p.platform === "TikTok");
  const rows = [
    { sig: "Search interest", base: `${prev12.toFixed(0)} (12-mo)`, now: `${last12.toFixed(0)} (12-mo)`, chg: `+${pct(prev12, last12).toFixed(0)}%`, win: "YoY", conf: "✓", pos: true },
    { sig: "Reddit members", base: `${fmt(r0.value)} · ${r0.date}`, now: `${fmt(r1.value)} · ${r1.date}`, chg: `+${pct(r0.value, r1.value).toFixed(0)}% · ${cagrPct(r0.value, r1.value, ryrs).toFixed(0)}%/yr`, win: `${ryrs.toFixed(1)}y`, conf: "✓", pos: true },
    { sig: "Roblox visits", base: `${(rb0.visits / 1e6).toFixed(1)}M · ${rb0.date}`, now: `${(rb.current.visits / 1e6).toFixed(1)}M · live`, chg: `+${pct(rb0.visits, rb.current.visits).toFixed(0)}% · ${cagrPct(rb0.visits, rb.current.visits, rbyrs).toFixed(0)}%/yr`, win: `${rbyrs.toFixed(1)}y`, conf: "~", pos: true },
    { sig: "TikTok followers", base: "—", now: `${(tt.followers / 1e3).toFixed(0)}K · ${tt.extra}`, chg: "—", win: "snapshot", conf: "—", pos: null },
    { sig: "E-commerce demand", base: `+${best.change}% peak (${best.q})`, now: `${ec.series.at(-1).change}% (${ec.series.at(-1).q})`, chg: "softening", win: "YoY", conf: "✓", pos: false },
    { sig: "Resale top clear", base: `~$${rs.retail_anchor} retail`, now: `${money(top.price)}`, chg: `~${Math.round(top.price / rs.retail_anchor)}×`, win: "sample", conf: "—", pos: true },
    { sig: "FY2025 revenue", base: `$${(rt.total_revenue / 1.067).toFixed(0)}M · FY24`, now: `$${rt.total_revenue}M`, chg: "+6.7% · record", win: "FY", conf: "✓", pos: true },
  ];
  $("conv-table").innerHTML =
    `<thead><tr><th>Signal</th><th>Baseline</th><th>Latest</th><th>Change</th><th>Win</th><th>±</th></tr></thead><tbody>` +
    rows.map(r => `<tr><td>${r.sig}</td><td class="num">${r.base}</td><td class="num">${r.now}</td><td class="num ${r.pos === true ? "pos" : r.pos === false ? "neg" : ""}">${r.chg}</td><td class="num">${r.win}</td><td class="num">${r.conf}</td></tr>`).join("") +
    `</tbody>`;
}

/* ---------- boot ---------- */
(async function () {
  try {
    const [m, kpis, gt, rd, topics, social, rb, rs, rt, ec] = await Promise.all([
      loadJSON("data/manifest.json"), loadJSON("data/kpis.json"),
      loadJSON("data/google_trends.json"), loadJSON("data/reddit_subscribers.json"),
      loadJSON("data/reddit_topics.json"), loadJSON("data/social.json"),
      loadJSON("data/roblox.json"), loadJSON("data/resale.json"), loadJSON("data/retail.json"),
      loadJSON("data/ecommerce.json"),
    ]);
    renderHeader(m, kpis);
    renderTrends(gt);
    renderReddit(rd, topics);
    renderSocial(social);
    renderRoblox(rb);
    renderEcommerce(ec);
    renderResale(rs);
    renderRetail(rt);
    renderConvergence(m);
    renderConvergenceCharts(gt, rd, rb, social, ec, rs, rt);
    linkifySources();
  } catch (e) {
    $("exec").innerHTML = `<b style="color:#ff6b6b">Failed to load data:</b> ${e.message}`;
    console.error(e);
  }
})();
