WJES 2026 · SCENARIO WEBGIS

Tol Getaci & KA Banjar–Cijulang: Siapa yang Makin Dekat?
https://fabianspramudya.github.io/WJES_Infrastucture_Induction_Framework/

Static WebGIS (HTML + CSS + Leaflet JS) showing potential accessibility for 131 sub-districts
(Garut, Kab./Kota Tasikmalaya, Ciamis, Kota Banjar, Pangandaran) under six scenarios:

| Code | Scenario |
|---|---|
| S0   | Existing connectivity (baseline) |
| S1   | Getaci toll to Tasikmalaya |
| S1E  | Getaci toll extended to Banjar |
| S2   | Banjar–Cijulang rail (basic service) |
| S3E  | Toll to Banjar + rail (basic service) |
| S3E+ | Toll to Banjar + rail (30-min headway, 70 km/h) |

Indicators: Hansen accessibility index, travel time to Bandung / nearest hub / rail station / district hospital,
Δ vs S0, and LISA clusters. Travel times are NOT recomputed in the browser — all values come from the
Google Colab export (Module 7).

Toll alignment and the Banjar interchange (SS Banjar) are indicative / author's assumption.
Results are potential accessibility, not actual impact.

## Structure
```
index.html   style.css   script.js   .nojekyll
data/
  kecamatan.geojson  kabupaten.geojson  jalan_utama.geojson
  tol_garis.geojson  tol_gerbang.geojson  rel_garis.geojson  stasiun_S2.geojson
  fasilitas.geojson  T10.json  T12.json  T18.json
```

## Run locally
Open the folder in VS Code → right-click `index.html` → **Open with Live Server**.
(Opening the file directly with file:// will block the data fetch.)

## References
1. Hansen, W.G. (1959), How Accessibility Shapes Land Use, JAIP 25(2), 73–76.
2. Anselin, L. (1995), Local Indicators of Spatial Association — LISA, Geographical Analysis 27(2), 93–115.
3. Boeing, G. (2017), OSMnx, Computers, Environment and Urban Systems 65, 126–139.

WJES 2026 · Infrastructure Induction Framework
Data: © OpenStreetMap contributors; administrative boundaries; author's analysis.
