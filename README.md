# Rodes Signage

Første offline MVP af Rodes' konfigurationsdrevne produktpræsentation. Den bruger kun HTML, CSS, vanilla JavaScript og JSON.

## Kør lokalt

Åbn ikke `index.html` direkte med `file://`; browseren blokerer ellers typisk for `fetch` af konfigurationen.

```bash
python3 -m http.server 8080
```

Åbn derefter <http://localhost:8080> i Chromium.

På Windows kan tilsvarende køres:

```powershell
py -m http.server 8080
```

Eller fra PowerShell:

```powershell
.\scripts\start-dev.ps1
```

## Konfiguration

Redigér [config/config.json](config/config.json) for produkter, priser, farver, kolonner og timings. Produktbilleder kan være WebP, PNG eller SVG. MVP'en leverer en lokal SVG-placeholder, indtil de rigtige billeder lægges i `assets/products/`.

Animationen bruger kortets oprindelige `getBoundingClientRect()` til at flytte det visuelt til detailvisningen og tilbage igen. Der er ingen internetafhængigheder eller build step.

## Næste skridt

Vis prototypen på 1920×1080 og justér især kortstørrelse, detailzoom, dimming og timings, før Raspberry Pi/systemd-installation tilføjes.
