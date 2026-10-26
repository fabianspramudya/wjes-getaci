/* =========================================================
   WJES 2026 — WebGIS Skenario Tol Getaci & KA Banjar–Cijulang
   Static front end (Leaflet). Semua angka berasal dari ekspor
   Google Colab (Modul 7); tidak ada perhitungan ulang waktu tempuh.
   ========================================================= */
const VERSION = "1.0.0";
const DATA_DIR = "data/";
const FILES = {
  kec: "kecamatan.geojson", kab: "kabupaten.geojson",
  tol: "tol_garis.geojson", gerbang: "tol_gerbang.geojson",
  rel: "rel_garis.geojson", stasiun: "stasiun_S2.geojson",
  fas: "fasilitas.geojson", jalan: "jalan_utama.geojson",
  T10: "T10.json", T12: "T12.json", T18: "T18.json"
};
const CORRIDOR_VIEW = [[-7.80, 107.60], [-6.90, 108.85]];

/* ---------- Scenario definitions ---------- */
const SCENARIOS = [
  { key: "S0",   label: "S0",   t18: "S0",   lisaH: "lisa_Hansen_S0_tingkat", lisaT: null,              tol: false, ext: false, rel: false },
  { key: "S1",   label: "S1",   t18: "S1",   lisaH: "lisa_dHansen_S1",        lisaT: "lisa_dt_hub_S1",  tol: true,  ext: false, rel: false },
  { key: "S1E",  label: "S1E",  t18: "S1E",  lisaH: "lisa_dHansen_S1E",       lisaT: "lisa_dt_hub_S1E", tol: true,  ext: true,  rel: false },
  { key: "S2",   label: "S2",   t18: "S2",   lisaH: "lisa_dHansen_S2_30_mnt_70_km/jam", lisaT: null,  tol: false, ext: false, rel: true, lisaVariant: true },
  { key: "S3E",  label: "S3E",  t18: "S3E",  lisaH: "lisa_dHansen_S3E",       lisaT: "lisa_dt_hub_S3E", tol: true,  ext: true,  rel: true },
  { key: "S3Ep", label: "S3E+", t18: "S3E+", lisaH: "lisa_dHansen_S3E+_30_mnt_70_km/jam", lisaT: null, tol: true, ext: true, rel: true }
];

/* ---------- Indicators ---------- */
const INDICATORS = {
  hansen_idx: { better: "high", unit: "",    breaks: [20, 40, 60, 80, 100],  dBreaks: [0.5, 2, 5, 10, 20] },
  t_bandung:  { better: "low",  unit: "min", breaks: [90, 120, 180, 240, 300], dBreaks: [-60, -30, -10, -1, 1] },
  t_hub:      { better: "low",  unit: "min", breaks: [15, 30, 60, 90, 120],  dBreaks: [-60, -30, -10, -1, 1] },
  t_stasiun:  { better: "low",  unit: "min", breaks: [15, 30, 60, 90, 120],  dBreaks: [-60, -30, -10, -1, 1] },
  t_rsud:     { better: "low",  unit: "min", breaks: [15, 30, 60, 90, 120],  dBreaks: [-60, -30, -10, -1, 1] }
};

/* Sequential = one hue light→dark; diverging = blue ↔ red with gray midpoint */
const RAMP_BLUE   = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#104281"];
const RAMP_ORANGE = ["#fde4d4", "#f9c3a2", "#f29a6c", "#e2703f", "#c24f22", "#8f3612"];
const NEUTRAL = "#e7e6e2";
const DELTA_H = [NEUTRAL, "#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"];   // dH ≥ 0
const DELTA_T = ["#0d366b", "#1c5cab", "#3987e5", "#9ec5f4", NEUTRAL, "#e34948"];  // Δt: negatif = lebih cepat
const LISA_COLORS = {
  "High-High": "#c7362f", "Low-Low": "#1c5cab", "Low-High": "#9ec5f4",
  "High-Low": "#f29a9a", "Tidak signifikan": "#ebeae6"
};
const FAS_STYLE = {
  pusat:   { color: "#0f1d2e", r: 6 },
  rsud:    { color: "#e34948", r: 4.5 },
  stasiun: { color: "#1baf7a", r: 4 },
  wisata:  { color: "#e87ba4", r: 4.5 }
};

/* ---------- i18n ---------- */
const I18N = {
  id: {
    "nav.home": "Beranda", "nav.map": "Peta", "nav.method": "Metodologi",
    "hero.title": "Analisis Spasial Terpadu Transportasi Darat sebagai Katalis Integrasi Koridor Selatan Jawa Barat",
    "hero.sub": "Simulasi Implementasi Tol Getaci &amp; Reaktivasi KA Banjar–Cijulang",
    "hero.desc": "Simulasi potensi aksesibilitas 131 kecamatan di Garut, Tasikmalaya, Ciamis, Banjar, dan Pangandaran untuk enam skenario infrastruktur — dari kondisi eksisting hingga tol s.d. Banjar ditambah reaktivasi kereta api.",
    "hero.k1": "Banjar–Bandung (menit), S0 → S3E+", "hero.k2": "Penduduk ≤120 mnt ke Bandung", "hero.k3": "Rata-rata ΔHansen (S3E+)",
    "hero.button": "Lihat Peta",
    "map.title": "Peta Skenario Aksesibilitas",
    "map.subtitle": "Pilih skenario dan indikator; klik kecamatan untuk membandingkan antarskenario.",
    "map.reset": "Reset Peta",
    "map.badge": "Trase tol &amp; posisi SS Banjar: indikatif / asumsi penulis",
    "map.note": "Hasil adalah <b>potensi</b> aksesibilitas dari model jaringan, bukan dampak aktual. Waktu tempuh tidak dihitung ulang di peramban.",
    "ind.title": "Indikator", "mode.value": "Nilai", "mode.delta": "Δ vs S0",
    "corr.title": "Ringkasan Koridor", "corr.tb": "Rata-rata waktu ke Bandung", "corr.pb": "Penduduk ≤120 mnt ke Bandung",
    "corr.ts": "Rata-rata waktu ke stasiun", "corr.b40": "Manfaat ke 40% terbawah", "corr.b40n": "pangsa ΔHansen",
    "corr.hansen": "Indeks Hansen rata-rata",
    "sel.title": "Kecamatan Terpilih", "sel.empty": "Klik poligon kecamatan di peta.",
    "basemap.note": "Basemap tanpa API key: Esri World Light Gray dan OpenStreetMap Standard.",
    "method.title": "Bagaimana<br>Skenario<br>Dihitung?",
    "method.intro": "Jaringan jalan OSM dimodelkan sebagai graf berbobot waktu tempuh. Tiap skenario menambahkan ruas tol indikatif dan/atau layanan KA, lalu waktu tempuh tercepat dari pusat kecamatan ke hub, Bandung, RSUD dan stasiun dihitung ulang. Indeks Hansen merangkum akses ke peluang yang dibobot jarak; LISA memetakan klaster spasial perubahannya.",
    "t18.title": "Rantai simulasi (T18)", "t12.title": "Distribusi manfaat (T12)",
    "t10.title": "Ringkasan tingkat koridor (T10)",
    "refs.title": "Catatan &amp; referensi metodologis",
    "refs.n1": "Trase tol (Seksi 1–2 dan perpanjangan Tasikmalaya–Ciamis–Banjar) serta posisi SS Banjar adalah indikatif (±1–3 km) hasil interpretasi penulis, bukan trase resmi.",
    "refs.n5": "Penyederhanaan geometri: poligon 80 m, rel 20 m, jalan 30 m; presisi koordinat 5 desimal (±1 m).",
    "footer": "WJES 2026 · Infrastructure Induction Framework — Tol Getaci &amp; KA Banjar–Cijulang",
    "providers": "Data: © OpenStreetMap contributors; batas administrasi; analisis penulis (Google Colab, Modul 4–7).",
    /* dynamic */
    ind_hansen_idx: "Indeks aksesibilitas Hansen", ind_t_bandung: "Waktu tempuh ke Bandung",
    ind_t_hub: "Waktu tempuh ke hub terdekat", ind_t_stasiun: "Waktu tempuh ke stasiun KA", ind_t_rsud: "Waktu tempuh ke RSUD",
    note_value_high: "Semakin gelap = akses semakin baik.",
    note_value_low: "Semakin gelap = waktu tempuh semakin lama.",
    note_delta_high: "Kenaikan indeks Hansen terhadap S0 (biru = bertambah).",
    note_delta_low: "Selisih menit terhadap S0; biru = lebih cepat, merah = lebih lambat.",
    note_lisa_h: "Klaster LISA untuk ΔHansen (S0: tingkat Hansen).",
    note_lisa_t: "Klaster LISA untuk Δ waktu ke hub.",
    note_lisa_var: " Skenario ini memakai varian layanan KA 30 mnt, 70 km/jam.",
    note_s0delta: "Mode Δ tidak berlaku untuk S0 (pembanding).",
    note_nolisa: "LISA tersedia hanya untuk Hansen dan waktu ke hub.",
    note_rsud: "Catatan: akses RSUD tidak berubah di semua skenario.",
    lg_value: "Nilai", lg_delta: "Δ terhadap S0", lg_lisa: "Klaster LISA",
    lg_notsig: "Tidak signifikan", lg_nochange: "Tidak berubah",
    lg_tol: "Tol Getaci S1 (indikatif)", lg_ext: "Perpanjangan S1E (indikatif)", lg_rel: "KA Banjar–Cijulang", lg_off: "Tidak aktif di skenario ini",
    lg_gate: "Gerbang / SS tol", lg_st2: "Stasiun S2",
    ly_kab: "Batas kabupaten/kota", ly_jalan: "Jalan utama (tol, arteri, kolektor)", ly_tol: "Trase tol (indikatif)",
    ly_gate: "Gerbang tol", ly_rel: "Rel KA Banjar–Cijulang", ly_st2: "Stasiun S2",
    ly_pusat: "Pusat kab/kota", ly_rsud: "RSUD", ly_stasiun: "Stasiun aktif", ly_wisata: "Destinasi wisata",
    unit_min: "mnt", pop: "Penduduk", kab: "Kab/Kota",
    sel_cap: "per skenario", indikatif: "indikatif / asumsi penulis", ssbanjar: "Posisi SS Banjar: asumsi penulis",
    vs_s0: "vs S0", od_bt: "Banjar–Tasikmalaya", od_bb: "Banjar–Bandung", od_pb: "Pangandaran–Bandung",
    t10_metric: "Metrik", err: "Data gagal dimuat. Jalankan lewat Live Server / GitHub Pages (bukan file://) dan pastikan folder data/ lengkap.",
    scn: {
      S0: "Konektivitas eksisting — jaringan jalan OSM tanpa intervensi; menjadi pembanding semua Δ.",
      S1: "Tol Getaci Seksi 1–2 (Gedebage–Tasikmalaya), 80 km/jam, gerbang indikatif.",
      S1E: "S1 + perpanjangan indikatif Tasikmalaya–Ciamis–Banjar.",
      S2: "Reaktivasi KA Banjar–Cijulang (layanan dasar) dengan 9 stasiun.",
      S3E: "Kombinasi tol s.d. Banjar + KA layanan dasar.",
      S3Ep: "S3E dengan layanan KA ditingkatkan: headway 30 mnt, 70 km/jam."
    }
  },
  en: {
    "nav.home": "Home", "nav.map": "Map", "nav.method": "Methodology",
    "hero.title": "Integrated Spatial Analysis of Land Transport as a Catalyst for Southern West Java Corridor Integration",
    "hero.sub": "Simulating the Getaci Toll Road &amp; Banjar–Cijulang Rail Reactivation",
    "hero.desc": "Simulated potential accessibility for 131 sub-districts in Garut, Tasikmalaya, Ciamis, Banjar and Pangandaran under six infrastructure scenarios — from the existing network to the toll road extended to Banjar plus rail reactivation.",
    "hero.k1": "Banjar–Bandung (minutes), S0 → S3E+", "hero.k2": "Population ≤120 min to Bandung", "hero.k3": "Mean ΔHansen (S3E+)",
    "hero.button": "View Map",
    "map.title": "Accessibility Scenario Map",
    "map.subtitle": "Choose a scenario and indicator; click a sub-district to compare across scenarios.",
    "map.reset": "Reset Map",
    "map.badge": "Toll alignment &amp; Banjar interchange: indicative / author's assumption",
    "map.note": "Results show <b>potential</b> accessibility from a network model, not actual impact. Travel times are not recomputed in the browser.",
    "ind.title": "Indicator", "mode.value": "Value", "mode.delta": "Δ vs S0",
    "corr.title": "Corridor Summary", "corr.tb": "Mean travel time to Bandung", "corr.pb": "Population ≤120 min to Bandung",
    "corr.ts": "Mean travel time to station", "corr.b40": "Benefit to bottom 40%", "corr.b40n": "share of ΔHansen",
    "corr.hansen": "Mean Hansen index",
    "sel.title": "Selected Sub-district", "sel.empty": "Click a sub-district polygon on the map.",
    "basemap.note": "No-API-key basemaps: Esri World Light Gray and OpenStreetMap Standard.",
    "method.title": "How Are<br>Scenarios<br>Computed?",
    "method.intro": "The OSM road network is modelled as a travel-time weighted graph. Each scenario adds indicative toll links and/or rail service, and the fastest travel time from each sub-district centre to the hub, Bandung, district hospitals and stations is recomputed. The Hansen index summarises distance-decayed access to opportunities; LISA maps spatial clusters of its change.",
    "t18.title": "Simulation chain (T18)", "t12.title": "Benefit distribution (T12)",
    "t10.title": "Corridor-level summary (T10)",
    "refs.title": "Notes &amp; methodological references",
    "refs.n1": "Toll alignment (Sections 1–2 and the Tasikmalaya–Ciamis–Banjar extension) and the Banjar interchange are indicative (±1–3 km) interpretations by the author, not official alignments.",
    "refs.n5": "Geometry simplification: polygons 80 m, rail 20 m, roads 30 m; coordinate precision 5 decimals (±1 m).",
    "footer": "WJES 2026 · Infrastructure Induction Framework — Getaci Toll Road &amp; Banjar–Cijulang Rail",
    "providers": "Data: © OpenStreetMap contributors; administrative boundaries; author's analysis (Google Colab, Modules 4–7).",
    ind_hansen_idx: "Hansen accessibility index", ind_t_bandung: "Travel time to Bandung",
    ind_t_hub: "Travel time to nearest hub", ind_t_stasiun: "Travel time to rail station", ind_t_rsud: "Travel time to district hospital",
    note_value_high: "Darker = better access.",
    note_value_low: "Darker = longer travel time.",
    note_delta_high: "Increase in Hansen index vs S0 (blue = gain).",
    note_delta_low: "Minutes difference vs S0; blue = faster, red = slower.",
    note_lisa_h: "LISA clusters of ΔHansen (S0: Hansen level).",
    note_lisa_t: "LISA clusters of Δ travel time to hub.",
    note_lisa_var: " This scenario uses the 30-min, 70 km/h rail service variant.",
    note_s0delta: "Δ mode does not apply to S0 (the baseline).",
    note_nolisa: "LISA is available only for Hansen and time to hub.",
    note_rsud: "Note: hospital access is unchanged across scenarios.",
    lg_value: "Value", lg_delta: "Δ vs S0", lg_lisa: "LISA cluster",
    lg_notsig: "Not significant", lg_nochange: "No change",
    lg_tol: "Getaci toll S1 (indicative)", lg_ext: "S1E extension (indicative)", lg_rel: "Banjar–Cijulang rail", lg_off: "Inactive in this scenario",
    lg_gate: "Toll gate / interchange", lg_st2: "S2 station",
    ly_kab: "District/city boundary", ly_jalan: "Main roads (toll, trunk, primary)", ly_tol: "Toll alignment (indicative)",
    ly_gate: "Toll gates", ly_rel: "Banjar–Cijulang rail", ly_st2: "S2 stations",
    ly_pusat: "District centres", ly_rsud: "District hospitals", ly_stasiun: "Active stations", ly_wisata: "Tourism destinations",
    unit_min: "min", pop: "Population", kab: "District",
    sel_cap: "by scenario", indikatif: "indicative / author's assumption", ssbanjar: "Banjar interchange position: author's assumption",
    vs_s0: "vs S0", od_bt: "Banjar–Tasikmalaya", od_bb: "Banjar–Bandung", od_pb: "Pangandaran–Bandung",
    t10_metric: "Metric", err: "Data failed to load. Serve the site via Live Server / GitHub Pages (not file://) and check the data/ folder.",
    scn: {
      S0: "Existing connectivity — OSM road network without intervention; the baseline for all Δ.",
      S1: "Getaci toll Sections 1–2 (Gedebage–Tasikmalaya), 80 km/h, indicative gates.",
      S1E: "S1 + indicative Tasikmalaya–Ciamis–Banjar extension.",
      S2: "Banjar–Cijulang rail reactivation (basic service) with 9 stations.",
      S3E: "Toll to Banjar combined with basic rail service.",
      S3Ep: "S3E with upgraded rail service: 30-min headway, 70 km/h."
    }
  }
};
const t = k => (I18N[lang][k] !== undefined ? I18N[lang][k] : k);

/* ---------- State ---------- */
let lang = "id";
let scenario = "S0";
let indicator = "hansen_idx";
let mode = "value";
let selectedId = null;
let D = {};                     // loaded data
let map, grayMap, osmMap, layerControl;
let kecLayer, kabLayer, jalanLayer, tolLayer, gateLayer, relLayer, st2Layer, fasLayers = {};

/* ---------- Helpers ---------- */
function fmt(v, d = 1) {
  if (v === null || v === undefined || v === "" || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString(lang === "id" ? "id-ID" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
function signed(v, d = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (v > 0 ? "+" : v < 0 ? "−" : "±") + fmt(Math.abs(v), d);
}
const scn = k => SCENARIOS.find(s => s.key === k);
const t18Row = k => (D.T18 || []).find(r => r.kode === scn(k).t18);
const unit = ind => (INDICATORS[ind].unit ? " " + t("unit_min") : "");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function lisaName(c) { return c === "Tidak signifikan" ? t("lg_notsig") : c; }

function classify(v, breaks) {          // returns index 0..breaks.length
  let i = 0; while (i < breaks.length && v >= breaks[i]) i++; return i;
}
function valueOf(p, ind, s) { return p[`${ind}_${s}`]; }
function deltaOf(p, ind, s) {
  if (ind === "hansen_idx") return s === "S0" ? 0 : p[`dH_${s}`];
  const a = p[`${ind}_${s}`], b = p[`${ind}_S0`];
  return (a == null || b == null) ? null : +(a - b).toFixed(1);
}
function lisaField(s, ind) {
  const sc = scn(s);
  return ind === "hansen_idx" ? sc.lisaH : ind === "t_hub" ? sc.lisaT : null;
}
function effectiveMode() {
  if (mode === "delta" && scenario === "S0") return "value";
  if (mode === "lisa" && !lisaField(scenario, indicator)) return "value";
  return mode;
}

/* ---------- Color for a kecamatan ---------- */
function fillFor(p) {
  const m = effectiveMode(), cfg = INDICATORS[indicator];
  if (m === "lisa") return LISA_COLORS[p[lisaField(scenario, indicator)]] || NEUTRAL;
  if (m === "delta") {
    const d = deltaOf(p, indicator, scenario);
    if (d == null) return NEUTRAL;
    if (cfg.better === "high") return DELTA_H[classify(d, cfg.dBreaks)];
    // time: ≤-60 | -60..-30 | -30..-10 | -10..-1 | -1..1 | >1
    return DELTA_T[classify(d, cfg.dBreaks)];
  }
  const v = valueOf(p, indicator, scenario);
  if (v == null) return NEUTRAL;
  return (cfg.better === "high" ? RAMP_BLUE : RAMP_ORANGE)[classify(v, cfg.breaks)];
}
function kecStyle(f) {
  const sel = f.properties._id === selectedId;
  return { fillColor: fillFor(f.properties), fillOpacity: 0.82, color: sel ? "#0f1d2e" : "#ffffff", weight: sel ? 2.6 : 0.6 };
}

/* ---------- Map init ---------- */
function initMap() {
  // SVG renderer (bukan canvas): tiap pane punya <svg> sendiri yang hanya menangkap klik pada
  // path interaktif, sehingga poligon kecamatan tetap bisa diklik di bawah lapisan tol/rel.
  map = L.map("map", { zoomControl: true, preferCanvas: false, minZoom: 8 });
  [["kecPane", 400], ["kabPane", 410], ["jalanPane", 415], ["relPane", 430], ["tolPane", 440], ["ptPane", 610], ["gatePane", 620]]
    .forEach(([n, z]) => { map.createPane(n); map.getPane(n).style.zIndex = z; });
  grayMap = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors", maxZoom: 16 }).addTo(map);
  osmMap = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap contributors", maxZoom: 19 });
  map.fitBounds(CORRIDOR_VIEW);
  if (window.ResizeObserver) new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(document.getElementById("map-section"));
}

/* ---------- Load ---------- */
function getJSON(name) {
  return fetch(DATA_DIR + name).then(r => { if (!r.ok) throw new Error(`${name} HTTP ${r.status}`); return r.json(); });
}
function loadAll() {
  const keys = Object.keys(FILES);
  return Promise.all(keys.map(k => getJSON(FILES[k]))).then(arr => { keys.forEach((k, i) => D[k] = arr[i]); });
}

/* ---------- Build layers ---------- */
function buildLayers() {
  D.kec.features.forEach((f, i) => f.properties._id = i);

  kecLayer = L.geoJSON(D.kec, {
    pane: "kecPane", style: kecStyle,
    onEachFeature: (f, layer) => {
      layer.bindTooltip(() => kecTooltip(f.properties), { sticky: true, direction: "top", className: "kec-tip" });
      layer.on("click", () => selectKec(f.properties._id));
      layer.on("mouseover", () => layer.setStyle({ weight: 2, color: "#0f1d2e" }));
      layer.on("mouseout", () => layer.setStyle(kecStyle(f)));
    }
  }).addTo(map);

  kabLayer = L.geoJSON(D.kab, {
    pane: "kabPane", interactive: false,
    style: { color: "#24364b", weight: 1.6, fill: false, opacity: 0.9 }
  }).addTo(map);

  jalanLayer = L.geoJSON(D.jalan, {
    pane: "jalanPane", interactive: false,
    style: f => {
      const k = f.properties.kelas;
      return { color: k === "motorway" ? "#7a5a2b" : k === "trunk" ? "#5b6570" : "#8a949e", weight: k === "primary" ? 0.7 : 1.2, opacity: 0.7 };
    }
  }).addTo(map);

  tolLayer = L.geoJSON(D.tol, {
    pane: "tolPane", style: tolStyle,
    onEachFeature: (f, layer) => layer.bindTooltip(() => {
      const p = f.properties;
      return `<b>${esc(p.nama)}</b><br>${fmt(p.km, 1)} km · ${fmt(p.kecepatan_rencana_kmj, 0)} km/jam${p.lajur ? " · " + esc(p.lajur) : ""}<br><span class="lbl-indikatif">⚠ ${t("indikatif")}${p.akurasi ? " (" + esc(p.akurasi) + ")" : ""}</span>`;
    }, { sticky: true })
  }).addTo(map);

  gateLayer = L.geoJSON(D.gerbang, {
    pane: "ptPane",
    pointToLayer: (f, ll) => L.circleMarker(ll, { pane: "gatePane", ...gateStyle(f) }),
    onEachFeature: (f, layer) => layer.bindTooltip(() => {
      const g = f.properties.gerbang;
      return `<b>${esc(g)}</b><br><span class="lbl-indikatif">⚠ ${g === "SS Banjar" ? t("ssbanjar") : t("indikatif")}</span>`;
    }, { direction: "top" })
  }).addTo(map);

  relLayer = L.geoJSON(D.rel, { pane: "relPane", style: relStyle, interactive: false }).addTo(map);

  st2Layer = L.geoJSON(D.stasiun, {
    pane: "ptPane",
    pointToLayer: (f, ll) => L.circleMarker(ll, { pane: "ptPane", ...st2Style() }),
    onEachFeature: (f, layer) => layer.bindTooltip(() =>
      `<b>${esc(f.properties.nama)}</b><br>KM ${fmt(f.properties.chainage_m / 1000, 1)}`, { direction: "top" })
  }).addTo(map);

  Object.keys(FAS_STYLE).forEach(cat => {
    const st = FAS_STYLE[cat];
    fasLayers[cat] = L.geoJSON({ type: "FeatureCollection", features: D.fas.features.filter(f => f.properties.kategori === cat) }, {
      pane: "ptPane",
      pointToLayer: (f, ll) => cat === "pusat"
        ? L.circleMarker(ll, { pane: "ptPane", radius: st.r, color: "#fff", weight: 2, fillColor: st.color, fillOpacity: 1 })
        : L.circleMarker(ll, { pane: "ptPane", radius: st.r, color: "#fff", weight: 1.5, fillColor: st.color, fillOpacity: 0.95 }),
      onEachFeature: (f, layer) => layer.bindTooltip(esc(f.properties.nama), { direction: "top" })
    });
  });
  fasLayers.pusat.addTo(map);
  buildLayerControl();
}

function buildLayerControl() {
  if (layerControl) map.removeControl(layerControl);
  const sw = (c, shape = "dot") => shape === "dot"
    ? `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:5px;border:1px solid #fff;box-shadow:0 0 0 1px ${c}"></span>`
    : `<span style="display:inline-block;width:16px;border-top:3px ${shape} ${c};margin-right:5px;vertical-align:3px"></span>`;
  layerControl = L.control.layers(
    { "Esri Light Gray": grayMap, "OpenStreetMap": osmMap },
    {
      [sw("#d98a1f", "solid") + t("ly_tol")]: tolLayer,
      [sw("#0f1d2e") + t("ly_gate")]: gateLayer,
      [sw("#6250d6", "dashed") + t("ly_rel")]: relLayer,
      [sw("#6250d6") + t("ly_st2")]: st2Layer,
      [sw("#0f1d2e") + t("ly_pusat")]: fasLayers.pusat,
      [sw(FAS_STYLE.rsud.color) + t("ly_rsud")]: fasLayers.rsud,
      [sw(FAS_STYLE.stasiun.color) + t("ly_stasiun")]: fasLayers.stasiun,
      [sw(FAS_STYLE.wisata.color) + t("ly_wisata")]: fasLayers.wisata,
      [sw("#5b6570", "solid") + t("ly_jalan")]: jalanLayer,
      [sw("#24364b", "solid") + t("ly_kab")]: kabLayer
    },
    { collapsed: true, position: "topright" }
  ).addTo(map);
}

/* Scenario-dependent infrastructure styling */
function tolActive(f) {
  const s = scn(scenario), ext = (f.properties.nama || "").startsWith("Perpanjangan");
  return ext ? s.ext : s.tol;
}
function tolStyle(f) {
  return tolActive(f)
    ? { color: "#d98a1f", weight: 4.5, opacity: 1, dashArray: (f.properties.nama || "").startsWith("Perpanjangan") ? "10 6" : null }
    : { color: "#8a949e", weight: 2, opacity: 0.6, dashArray: "4 6" };
}
function gateStyle(f) {
  const g = f.properties.gerbang, s = scn(scenario);
  const active = (g === "SS Ciamis" || g === "SS Banjar") ? s.ext : s.tol;
  return active
    ? { radius: 5.5, color: "#fff", weight: 2, fillColor: "#0f1d2e", fillOpacity: 1 }
    : { radius: 5, color: "#6b7580", weight: 1.5, fillColor: "#ffffff", fillOpacity: 1 };
}
function relStyle() {
  return scn(scenario).rel
    ? { color: "#6250d6", weight: 4, opacity: 1, dashArray: "1 7", lineCap: "round" }
    : { color: "#8a949e", weight: 2, opacity: 0.55, dashArray: "2 6" };
}
function st2Style() {
  return scn(scenario).rel
    ? { radius: 5, color: "#fff", weight: 2, fillColor: "#6250d6", fillOpacity: 1 }
    : { radius: 4, color: "#6b7580", weight: 1.5, fillColor: "#ffffff", fillOpacity: 1 };
}

/* ---------- Tooltip ---------- */
function kecTooltip(p) {
  const m = effectiveMode();
  let line;
  if (m === "lisa") line = `LISA: <b>${esc(lisaName(p[lisaField(scenario, indicator)]))}</b>`;
  else if (m === "delta") line = `${t("ind_" + indicator)}: <b>${signed(deltaOf(p, indicator, scenario))}${unit(indicator)}</b> ${t("vs_s0")}`;
  else line = `${t("ind_" + indicator)}: <b>${fmt(valueOf(p, indicator, scenario))}${unit(indicator)}</b>`;
  return `<b>${esc(p.nama)}</b> · ${esc(p.kabupaten)}<br>${line}`;
}

/* ---------- UI: scenario bar, indicator, modes ---------- */
function renderScenarioBar() {
  const bar = document.getElementById("scenarioBar");
  bar.innerHTML = "";
  SCENARIOS.forEach(s => {
    const b = document.createElement("button");
    b.className = "scn-btn" + (s.key === scenario ? " active" : "");
    b.setAttribute("role", "tab");
    b.innerHTML = `<b>${s.label}</b><small>${esc((t18Row(s.key) || {}).isi || "")}</small>`;
    b.title = I18N[lang].scn[s.key];
    b.onclick = () => { scenario = s.key; refresh(); };
    bar.appendChild(b);
  });
}
function renderIndicatorSelect() {
  const sel = document.getElementById("indicatorSelect");
  sel.innerHTML = Object.keys(INDICATORS).map(k => `<option value="${k}"${k === indicator ? " selected" : ""}>${t("ind_" + k)}</option>`).join("");
}
function renderModes() {
  document.querySelectorAll("#modeButtons [data-mode]").forEach(b => {
    const md = b.dataset.mode;
    b.disabled = (md === "delta" && scenario === "S0") || (md === "lisa" && !lisaField(scenario, indicator));
    b.classList.toggle("active", md === effectiveMode());
  });
  const cfg = INDICATORS[indicator], m = effectiveMode();
  let note = m === "lisa" ? t(indicator === "hansen_idx" ? "note_lisa_h" : "note_lisa_t") + (scn(scenario).lisaVariant ? t("note_lisa_var") : "")
    : m === "delta" ? t(cfg.better === "high" ? "note_delta_high" : "note_delta_low")
    : t(cfg.better === "high" ? "note_value_high" : "note_value_low");
  if (mode === "delta" && scenario === "S0") note = t("note_s0delta") + " " + note;
  if (mode === "lisa" && !lisaField(scenario, indicator)) note = t("note_nolisa") + " " + note;
  if (indicator === "t_rsud") note += " " + t("note_rsud");
  document.getElementById("indicatorNote").textContent = note;
}

/* ---------- Legend ---------- */
function renderLegend() {
  const cfg = INDICATORS[indicator], m = effectiveMode();
  const u = unit(indicator).trim();
  const row = (c, txt) => `<div class="lg-row"><span class="lg-sw" style="background:${c}"></span>${txt}</div>`;
  let html = "";
  if (m === "lisa") {
    html += `<div class="lg-title">${t("lg_lisa")}</div>` + Object.keys(LISA_COLORS).map(k => row(LISA_COLORS[k], lisaName(k))).join("");
  } else if (m === "delta") {
    html += `<div class="lg-title">${t("lg_delta")} — ${t("ind_" + indicator)}</div>`;
    const b = cfg.dBreaks;
    if (cfg.better === "high") {
      html += row(DELTA_H[0], t("lg_nochange") + ` (&lt; ${fmt(b[0])})`);
      for (let i = 0; i < b.length; i++) html += row(DELTA_H[i + 1], i < b.length - 1 ? `+${fmt(b[i])} – ${fmt(b[i + 1])}` : `&gt; +${fmt(b[i])}`);
    } else {
      const lbl = [`≤ −60 ${u}`, `−60 – −30`, `−30 – −10`, `−10 – −1`, t("lg_nochange"), `&gt; +1 ${u}`];
      DELTA_T.forEach((c, i) => html += row(c, lbl[i]));
    }
  } else {
    html += `<div class="lg-title">${t("ind_" + indicator)}${u ? " (" + u + ")" : ""}</div>`;
    const b = cfg.breaks, ramp = cfg.better === "high" ? RAMP_BLUE : RAMP_ORANGE;
    ramp.forEach((c, i) => html += row(c, i === 0 ? `&lt; ${fmt(b[0], 0)}` : i === b.length ? `≥ ${fmt(b[i - 1], 0)}` : `${fmt(b[i - 1], 0)} – ${fmt(b[i], 0)}`));
  }
  const s = scn(scenario);
  const line = (c, style, txt, on) => `<div class="lg-row"><span class="lg-line" style="border-top-color:${on ? c : "#a8b0b8"};border-top-style:${on ? style : "dotted"}"></span>${txt}${on ? "" : ` <i style="color:#a8b0b8">· ${t("lg_off")}</i>`}</div>`;
  html += `<div class="lg-sep"></div>`
    + line("#d98a1f", "solid", t("lg_tol"), s.tol)
    + line("#d98a1f", "dashed", t("lg_ext"), s.ext)
    + line("#6250d6", "dotted", t("lg_rel"), s.rel)
    + `<div class="lg-row"><span class="lg-dot" style="background:#0f1d2e"></span><span class="lg-dot" style="background:#6250d6;margin-left:-4px"></span>${t("lg_gate")} / ${t("lg_st2")}</div>`
    + `<div class="lg-row"><span class="lg-dot off"></span>${t("lg_off")}</div>`;
  const lg = document.getElementById("mapLegend");
  const i = html.indexOf("</div>") + 6;                 // split title / body
  lg.innerHTML = html.slice(0, i) + `<div class="lg-body">${html.slice(i)}</div>`;
  lg.querySelector(".lg-title").onclick = () => lg.classList.toggle("collapsed");
}

/* ---------- Corridor panel (T18) ---------- */
function renderCorridor() {
  const r = t18Row(scenario), r0 = t18Row("S0");
  document.getElementById("corrCode").textContent = scn(scenario).label;
  document.getElementById("corrDesc").textContent = I18N[lang].scn[scenario];
  if (!r) return;
  const mn = " " + t("unit_min");
  const dl = (a, b, d = 1, suf = "") => scenario === "S0" ? "" : `${signed(a - b, d)}${suf} ${t("vs_s0")}`;
  document.getElementById("cTB").textContent = fmt(r.t_bandung, 0) + mn;
  document.getElementById("cTBd").textContent = dl(r.t_bandung, r0.t_bandung, 0, mn);
  document.getElementById("cPB").textContent = fmt(r["%pend_Bandung_≤120"], 1) + "%";
  document.getElementById("cPBd").textContent = dl(r["%pend_Bandung_≤120"], r0["%pend_Bandung_≤120"], 1, " pp");
  document.getElementById("cTS").textContent = fmt(r.t_stasiun, 0) + mn;
  document.getElementById("cTSd").textContent = dl(r.t_stasiun, r0.t_stasiun, 1, mn);
  document.getElementById("cB40").textContent = r["%manfaat_40%_terbawah"] == null ? "—" : fmt(r["%manfaat_40%_terbawah"], 1) + "%";
  document.getElementById("cH").textContent = fmt(r.Hansen, 1);
  document.getElementById("cHd").textContent = `ΔHansen ${signed(r.ΔHansen, 2)} · Gini ${fmt(r.Gini_Hansen, 2)}`;
  const od = [["od_bt", "Banjar–Tasikmalaya"], ["od_bb", "Banjar–Bandung"], ["od_pb", "Pangandaran–Bandung"]];
  document.getElementById("odList").innerHTML = od.map(([k, f]) =>
    `<div class="od-row"><span>${t(k)}</span><span><b>${fmt(r[f], 0)}${mn}</b>${scenario === "S0" ? "" : `<i>${signed(r[f] - r0[f], 0)}</i>`}</span></div>`).join("");
}

/* ---------- Selected kecamatan ---------- */
function selectKec(id) {
  selectedId = id;
  kecLayer.setStyle(kecStyle);
  kecLayer.eachLayer(l => { if (l.feature.properties._id === id) l.bringToFront(); });
  renderSelection();
}
function renderSelection() {
  const box = document.getElementById("selBox"), chart = document.getElementById("selChart");
  if (selectedId === null) { box.innerHTML = t("sel.empty"); chart.innerHTML = ""; return; }
  const p = D.kec.features[selectedId].properties;
  const lf = lisaField(scenario, indicator);
  box.innerHTML = `<h4>${esc(p.nama)}</h4>${t("kab")}: ${esc(p.kabupaten)}<br>${t("pop")}: ${fmt(p.pop, 0)}`
    + `<br>${t("ind_" + indicator)} (${scn(scenario).label}): <b>${fmt(valueOf(p, indicator, scenario))}${unit(indicator)}</b>`
    + (scenario !== "S0" ? ` · ${signed(deltaOf(p, indicator, scenario))} ${t("vs_s0")}` : "")
    + (lf ? `<br>LISA: ${esc(lisaName(p[lf]))}` : "");
  const vals = SCENARIOS.map(s => ({ s, v: valueOf(p, indicator, s.key) }));
  const max = Math.max(...vals.map(o => o.v || 0)) || 1;
  chart.innerHTML = `<div class="cap">${t("ind_" + indicator)} ${t("sel_cap")}${unit(indicator) ? " (" + t("unit_min") + ")" : ""}</div>`
    + vals.map(({ s, v }) => `<div class="bar-row${s.key === scenario ? " cur" : ""}" title="${s.label}: ${fmt(v)}${unit(indicator)}">
        <span class="lbl">${s.label}</span>
        <div class="trk"><div class="bar" style="width:${Math.max(1, 100 * (v || 0) / max)}%"></div></div>
        <span class="val">${fmt(v)}</span></div>`).join("");
}

/* ---------- Hero KPIs ---------- */
function renderHero() {
  const a = t18Row("S0"), b = t18Row("S3Ep");
  if (!a || !b) return;
  document.getElementById("heroBB").textContent = `${fmt(a["Banjar–Bandung"], 0)} → ${fmt(b["Banjar–Bandung"], 0)}`;
  document.getElementById("heroPop").textContent = `${fmt(a["%pend_Bandung_≤120"], 0)}% → ${fmt(b["%pend_Bandung_≤120"], 0)}%`;
  document.getElementById("heroDH").textContent = signed(b.ΔHansen, 1);
}

/* ---------- Methodology: scenario cards + tables ---------- */
function renderMethod() {
  document.getElementById("scenarioCards").innerHTML = SCENARIOS.map(s => {
    const r = t18Row(s.key) || {};
    return `<article class="method-card"><span class="method-number">${s.label} · ${esc(r.simulasi || "")}</span>
      <h3>${esc(r.isi || s.label)}</h3><p>${I18N[lang].scn[s.key]}</p></article>`;
  }).join("");

  const cell = (v, d = 1) => v === null || v === undefined ? `<td class="na">—</td>` : typeof v === "number" ? `<td>${fmt(v, d)}</td>` : `<td class="txt">${esc(v)}</td>`;
  const table = (id, rows, cols) => {
    document.getElementById(id).innerHTML =
      `<thead><tr>${cols.map(c => `<th${c.txt ? ' class="txt"' : ""}>${esc(c.h)}</th>`).join("")}</tr></thead>
       <tbody>${rows.map(r => `<tr>${cols.map(c => cell(r[c.k], c.d ?? 1)).join("")}</tr>`).join("")}</tbody>`;
  };
  table("tblT18", D.T18, [
    { k: "kode", h: "Kode", txt: 1 }, { k: "isi", h: lang === "id" ? "Isi" : "Description", txt: 1 },
    { k: "t_hub", h: "t_hub" }, { k: "t_bandung", h: "t_bandung" }, { k: "%pend_Bandung_≤120", h: "%pend Bdg ≤120" },
    { k: "t_stasiun", h: "t_stasiun" }, { k: "Hansen", h: "Hansen" }, { k: "ΔHansen", h: "ΔHansen", d: 2 },
    { k: "Gini_Hansen", h: "Gini", d: 2 }, { k: "%manfaat_40%_terbawah", h: "%manfaat 40%↓" },
    { k: "indeks_integrasi", h: "Indeks integrasi", d: 2 }, { k: "Δ%_internal", h: "Δ% internal" },
    { k: "Banjar–Tasikmalaya", h: "Banjar–Tasik" }, { k: "Banjar–Bandung", h: "Banjar–Bdg" }, { k: "Pangandaran–Bandung", h: "Pangandaran–Bdg" }
  ]);
  table("tblT12", D.T12, [
    { k: "skenario", h: lang === "id" ? "Skenario" : "Scenario", txt: 1 }, { k: "ΔHansen_rata2", h: "ΔHansen rata-rata", d: 2 },
    { k: "%manfaat_ke_40%_terbawah", h: "%manfaat ke 40%↓" }, { k: "%penduduk_40%_terbawah", h: "%penduduk 40%↓" },
    { k: "Gini_Hansen_S0", h: "Gini S0", d: 3 }, { k: "Gini_Hansen_skenario", h: "Gini skenario", d: 3 },
    { k: "spearman_S0_vs_Δ", h: "Spearman S0 vs Δ", d: 3 }, { k: "p", h: "p", d: 3 }
  ]);
  renderT10();
}
let t10Metric = "rata2";
function renderT10() {
  const metrics = ["rata2", "gini", "%pend_≤60", "%pend_≤120"];
  const scs = [...new Set(D.T10.map(r => r.skenario))];
  const inds = [...new Set(D.T10.map(r => r.indikator))];
  const tbl = document.getElementById("tblT10");
  const d = t10Metric === "gini" ? 3 : 1;
  tbl.innerHTML = `<thead><tr><th class="txt">
      <select id="t10Sel" class="select" style="padding:4px 6px;width:auto" aria-label="${t("t10_metric")}">
      ${metrics.map(m => `<option value="${m}"${m === t10Metric ? " selected" : ""}>${m}</option>`).join("")}</select></th>
      ${scs.map(s => `<th>${s}</th>`).join("")}</tr></thead>
    <tbody>${inds.map(i => `<tr><td class="txt">${i}</td>${scs.map(s => {
      const r = D.T10.find(x => x.indikator === i && x.skenario === s); const v = r ? r[t10Metric] : null;
      return v === null || v === undefined ? `<td class="na">—</td>` : `<td>${fmt(v, d)}</td>`;
    }).join("")}</tr>`).join("")}</tbody>`;
  document.getElementById("t10Sel").onchange = e => { t10Metric = e.target.value; renderT10(); };
}

/* ---------- Refresh everything that depends on state ---------- */
function refresh() {
  renderScenarioBar(); renderModes(); renderLegend(); renderCorridor(); renderSelection();
  if (kecLayer) kecLayer.setStyle(kecStyle);
  if (tolLayer) tolLayer.setStyle(tolStyle);
  if (gateLayer) gateLayer.eachLayer(l => l.setStyle(gateStyle(l.feature)));
  if (relLayer) relLayer.setStyle(relStyle);
  if (st2Layer) st2Layer.eachLayer(l => l.setStyle(st2Style()));
}

/* ---------- Language ---------- */
function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const v = I18N[lang][el.dataset.i18n]; if (typeof v === "string") el.innerHTML = v;
  });
  document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));
  if (!D.kec) return;
  renderIndicatorSelect(); renderHero(); renderMethod(); buildLayerControl(); refresh();
}

/* ---------- Events ---------- */
function bindEvents() {
  document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; applyLanguage(); }));
  document.getElementById("indicatorSelect").addEventListener("change", e => { indicator = e.target.value; refresh(); });
  document.querySelectorAll("#modeButtons [data-mode]").forEach(b => b.addEventListener("click", () => { mode = b.dataset.mode; refresh(); }));
  document.querySelectorAll("[data-basemap]").forEach(b => b.addEventListener("click", () => {
    const osm = b.dataset.basemap === "osm";
    map.addLayer(osm ? osmMap : grayMap); map.removeLayer(osm ? grayMap : osmMap);
    document.querySelectorAll("[data-basemap]").forEach(o => o.classList.toggle("active", o === b));
  }));
  map.on("baselayerchange", e => document.querySelectorAll("[data-basemap]").forEach(o =>
    o.classList.toggle("active", (o.dataset.basemap === "osm") === (e.layer === osmMap))));
  document.getElementById("visitMapBtn").addEventListener("click", () => scrollToId("#map-section"));
  document.getElementById("resetMapBtn").addEventListener("click", resetMap);
  document.querySelectorAll(".topbar nav a").forEach(a => a.addEventListener("click", e => {
    e.preventDefault(); scrollToId(a.getAttribute("href")); history.pushState(null, "", a.getAttribute("href"));
  }));
}
function resetMap() {
  scenario = "S0"; indicator = "hansen_idx"; mode = "value"; selectedId = null;
  map.closePopup(); map.eachLayer(l => l.closeTooltip && l.closeTooltip());
  if (!map.hasLayer(grayMap)) { map.addLayer(grayMap); map.removeLayer(osmMap); }
  document.querySelectorAll("[data-basemap]").forEach(o => o.classList.toggle("active", o.dataset.basemap === "gray"));
  [kecLayer, kabLayer, jalanLayer, tolLayer, gateLayer, relLayer, st2Layer, fasLayers.pusat].forEach(l => l && !map.hasLayer(l) && map.addLayer(l));
  ["rsud", "stasiun", "wisata"].forEach(k => map.hasLayer(fasLayers[k]) && map.removeLayer(fasLayers[k]));
  renderIndicatorSelect(); refresh();
  history.pushState(null, "", "#map-section");
  scrollToId("#map-section");
  setTimeout(() => { map.invalidateSize({ pan: false }); fitCorridor(); }, 650);
}
function scrollToId(sel) {
  const el = document.querySelector(sel); if (!el) return;
  const h = document.querySelector(".topbar").offsetHeight;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - h, behavior: "smooth" });
  if (sel === "#map-section") setTimeout(() => map.invalidateSize({ pan: false }), 700);
}
function fitCorridor() {
  const b = kecLayer ? kecLayer.getBounds() : null;
  b && b.isValid() ? map.fitBounds(b, { padding: [15, 15] }) : map.fitBounds(CORRIDOR_VIEW);
}

/* ---------- Boot ---------- */
initMap();
if (window.innerWidth < 600) document.getElementById("mapLegend").classList.add("collapsed");
applyLanguage();
loadAll()
  .then(() => {
    buildLayers(); bindEvents(); renderIndicatorSelect(); renderHero(); renderMethod(); refresh(); fitCorridor();
    console.log(`WJES 2026 WebGIS v${VERSION} initialized.`);
  })
  .catch(err => {
    console.error("WJES DATA ERROR:", err);
    const m = document.createElement("div");
    m.className = "map-badge"; m.style.cssText = "top:auto;bottom:22px;left:50%;transform:translateX(-50%);background:#b3261e;max-width:90%";
    m.textContent = t("err");
    document.querySelector(".map-wrap").appendChild(m);
  });
