/* Build-A-Bear Social Demand Tracker — front-end renderer.
   Loads data/*.json and renders KPIs + Chart.js line charts.
   All data is static JSON so the page works on GitHub Pages with no backend. */

const COLORS = {
  accent: "#ffb23e",
  accent2: "#ff5d73",
  grid: "rgba(255,255,255,.06)",
  text: "#9aa6cc",
};

const ARROW = { up: ["▲", "up"], down: ["▼", "down"], flat: ["—", "flat"] };

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function fmt(n) { return n.toLocaleString("en-US"); }

function chartBase(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { labels: { color: COLORS.text, usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
      tooltip: {
        backgroundColor: "#0b1020",
        borderColor: "#26305c", borderWidth: 1,
        titleColor: "#e8ecf8", bodyColor: "#cfd6f0", padding: 10,
      },
    },
    scales: {
      x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text, maxTicksLimit: 9, font: { size: 11 } } },
      y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text, font: { size: 11 } }, beginAtZero: true },
    },
    ...extra,
  };
}

function tagFor(isIllustrative, el) {
  if (!el) return;
  if (isIllustrative) { el.textContent = "illustrative"; el.className = "tag illustrative"; }
  else { el.textContent = "live"; el.className = "tag live"; }
}

/* ---------- renderers ---------- */

function renderHeader(m) {
  document.getElementById("lede").textContent = m.thesis;
  document.getElementById("status").innerHTML =
    `<b>Status:</b> ${m.status}`;
  document.getElementById("converge-note").textContent = m.signal_convergence_note;
  document.getElementById("updated").textContent = m.last_updated;
}

function renderKPIs(kpis) {
  const grid = document.getElementById("kpi-grid");
  grid.innerHTML = kpis.cards.map(c => {
    const [glyph, cls] = ARROW[c.trend] || ARROW.flat;
    return `<div class="kpi">
      <div class="k-label">${c.label}</div>
      <div class="k-value">${c.value}<span class="arrow ${cls}">${glyph}</span></div>
      <div class="k-sub">${c.sub}</div>
      <div class="k-src">${c.source}</div>
    </div>`;
  }).join("");
}

function movingAvg(values, window) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1).filter(v => v != null);
    if (!slice.length) return null;
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  });
}

function renderTrends(gt) {
  tagFor(gt.is_illustrative, document.getElementById("trends-tag"));
  document.getElementById("trends-src").textContent = "Google Trends";
  document.getElementById("trends-note").textContent = gt.note || "";
  const labels = gt.series.map(r => r.date);
  const main = gt.queries[0];
  const mainVals = gt.series.map(r => r[main]);

  // thin raw series (shows seasonality) + a bold 12-month moving average (trend)
  const datasets = [
    {
      label: `${main} (12-mo avg)`,
      data: movingAvg(mainVals, 12),
      borderColor: COLORS.accent, backgroundColor: "rgba(255,178,62,.10)",
      borderWidth: 3, pointRadius: 0, tension: 0.4, fill: true, order: 0,
    },
    {
      label: `${main} (monthly)`,
      data: mainVals,
      borderColor: "rgba(255,178,62,.45)", backgroundColor: "transparent",
      borderWidth: 1.25, pointRadius: 0, tension: 0.35, order: 1,
    },
  ];
  if (gt.queries[1]) {
    const q2 = gt.queries[1];
    datasets.push({
      label: `${q2} (monthly)`,
      data: gt.series.map(r => r[q2]),
      borderColor: "rgba(255,93,115,.7)", backgroundColor: "transparent",
      borderWidth: 1.5, pointRadius: 0, tension: 0.35, order: 2,
    });
  }
  new Chart(document.getElementById("trendsChart"), {
    type: "line", data: { labels, datasets }, options: chartBase(),
  });
}

function cagr(first, last, years) {
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function renderReddit(rd) {
  tagFor(rd.is_illustrative, document.getElementById("reddit-tag"));
  document.getElementById("reddit-note").textContent = rd.note || "";
  const labels = rd.series.map(r => r.date);
  const values = rd.series.map(r => r.value);
  new Chart(document.getElementById("redditChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "subscribers",
        data: values,
        borderColor: COLORS.accent,
        backgroundColor: "rgba(255,178,62,.12)",
        borderWidth: 2, pointRadius: 2, fill: true, tension: 0.3,
      }],
    },
    options: chartBase({ plugins: { legend: { display: false } } }),
  });
  // stats
  const first = values[0], last = values[values.length - 1];
  const yrs = (new Date(rd.series[rd.series.length - 1].date + "-01") - new Date(rd.series[0].date + "-01")) / (365.25 * 864e5);
  const g = cagr(first, last, yrs).toFixed(1);
  const mult = (last / first).toFixed(1);
  document.getElementById("reddit-stats").innerHTML = `
    <div><div class="big">${fmt(last)}<small> members</small></div><p>current community size (latest tracked point)</p></div>
    <div><div class="big">+${g}%<small> CAGR</small></div><p>compound annual growth over ~${yrs.toFixed(0)} years</p></div>
    <div><div class="big">${mult}×<small> since 2019</small></div><p>${fmt(first)} → ${fmt(last)} subscribers</p></div>`;
}

function renderCulture() {
  const cards = [
    { h: "TikTok pulls in adults", p: "Influencers run Build-A-Bear \"stuffing parties\" and limited products sell fast — older buyers are not discount-driven and make multiple purchases.", s: "Entrepreneur, 2024" },
    { h: "From kids' toy to collectible", p: "Build-A-Bear leaned into the psychology of adult collectors: points + early access to limited drops make loyalty feel like a collector's club, not a rewards card.", s: "Suzy, 2024-25" },
    { h: "Licensed collabs drive hype", p: "Strong collector demand for Pokémon, Star Wars, The Nightmare Before Christmas, and video-game tie-ins (Mario & Luigi).", s: "Trade coverage, 2025" },
    { h: "The stock noticed", p: "BBW shares up ~2,000% over five years and ~60% YTD in 2025 — the adult pivot is showing up in the financials.", s: "Market data, 2025" },
  ];
  document.getElementById("culture-grid").innerHTML = cards.map(c =>
    `<div class="q-card"><h4>${c.h}</h4><p>${c.p}</p><div class="src">${c.s}</div></div>`).join("");
}

/* ---------- boot ---------- */
(async function () {
  try {
    const [m, kpis, gt, rd] = await Promise.all([
      loadJSON("data/manifest.json"),
      loadJSON("data/kpis.json"),
      loadJSON("data/google_trends.json"),
      loadJSON("data/reddit_subscribers.json"),
    ]);
    renderHeader(m);
    renderKPIs(kpis);
    renderTrends(gt);
    renderReddit(rd);
    renderCulture();
  } catch (e) {
    document.getElementById("status").innerHTML =
      `<b style="color:#ff6b6b">Failed to load data:</b> ${e.message}`;
    console.error(e);
  }
})();
