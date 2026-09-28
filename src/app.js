const State = Object.freeze({ OVERVIEW: "overview", SELECTING: "selecting", DETAIL: "detail", RETURNING: "returning", WAITING: "waiting" });
const $ = (selector) => document.querySelector(selector);
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, Math.max(0, ms)));

const elements = { root: $("#signage"), grid: $("#product-grid"), dimmer: $("#scene-dimmer"), overlay: $("#detail-overlay"), detailProduct: $("#detail-product"), detailCopy: $("#detail-copy"), detailTitle: $("#detail-title"), detailPrice: $("#detail-price"), status: $("#status"), logo: $("#brand-logo") };
let config;
let products = [];
let state = State.OVERVIEW;

function number(value, fallback) { return Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback; }
function safeConfig(raw) {
  const animation = raw.animation || {};
  const grid = raw.grid || {};
  return {
    display: { backgroundColor: raw.display?.backgroundColor || "#4f8e91", accentColor: raw.display?.accentColor || "#fff", textColor: raw.display?.textColor || "#fff" },
    branding: raw.branding || {}, grid: { columns: Math.max(1, Math.round(number(grid.columns, 5))), gapX: number(grid.gapX, 34), gapY: number(grid.gapY, 22), cardAspectRatio: number(grid.cardAspectRatio, 1.55) || 1.55 },
    animation: { overviewInitialDurationMs: number(animation.overviewInitialDurationMs, 2200), betweenProductsDurationMs: number(animation.betweenProductsDurationMs, 900), transitionInDurationMs: number(animation.transitionInDurationMs, 750), detailDurationMs: number(animation.detailDurationMs, 2800), transitionOutDurationMs: number(animation.transitionOutDurationMs, 750), backgroundOpacityDuringDetail: Math.min(1, number(animation.backgroundOpacityDuringDetail, .38)), detailWidthPercent: Math.min(90, Math.max(25, number(animation.detailWidthPercent, 58))) },
    price: { displayMode: ["card", "detailOnly", "hidden"].includes(raw.price?.displayMode) ? raw.price.displayMode : "card", defaultPrice: raw.price?.defaultPrice || "" },
    promo: raw.promo || { enabled: false },
    products: Array.isArray(raw.products) ? raw.products.filter((item) => item && item.enabled !== false) : []
  };
}
function applyTheme() { const { display, grid, animation } = config; elements.root.style.setProperty("--background", display.backgroundColor); elements.root.style.setProperty("--accent", display.accentColor); elements.root.style.setProperty("--text", display.textColor); elements.root.style.setProperty("--columns", grid.columns); elements.root.style.setProperty("--gap-x", `${grid.gapX}px`); elements.root.style.setProperty("--gap-y", `${grid.gapY}px`); elements.root.style.setProperty("--card-ratio", grid.cardAspectRatio); elements.root.style.setProperty("--dim-opacity", animation.backgroundOpacityDuringDetail); elements.root.style.setProperty("--detail-width", `${animation.detailWidthPercent}%`); }
function productData(item) { return { id: String(item.id || "product"), name: String(item.name || item.id || "Produkt"), image: String(item.image || ""), price: String(item.price || config.price.defaultPrice || "") }; }
function createCard(item, index) {
  const product = productData(item); const card = document.createElement("article"); card.className = "product-card"; card.dataset.index = index; card.dataset.id = product.id;
  const imageWrap = document.createElement("div"); imageWrap.className = "product-card__image-wrap";
  const image = document.createElement("img"); image.className = "product-card__image"; image.alt = product.name; image.draggable = false; image.src = product.image; image.onerror = () => { console.warn(`[Signage] Missing image for "${product.id}"`); image.removeAttribute("src"); imageWrap.classList.add("is-placeholder"); };
  imageWrap.append(image); if (config.price.displayMode === "card" && product.price) { const price = document.createElement("span"); price.className = "product-card__price"; price.textContent = product.price; imageWrap.append(price); }
  const title = document.createElement("p"); title.className = "product-card__title"; title.textContent = product.name; card.append(imageWrap, title); return card;
}
function createPromo() { const promo = config.promo; if (!promo?.enabled) return null; const card = document.createElement("article"); card.className = "promo-card"; const title = document.createElement("strong"); title.textContent = promo.title || "KONTAKTLINSER"; const subtitle = document.createElement("span"); subtitle.textContent = promo.subtitle || "Frit valg kun"; const price = document.createElement("b"); price.textContent = promo.price || config.price.defaultPrice || ""; card.append(title, subtitle, price); return card; }
function renderGrid() { const cards = products.map(createCard); const promo = createPromo(); if (promo) cards.push(promo); elements.grid.replaceChildren(...cards); }
function transition(element, duration, transform) { element.style.transition = `transform ${duration}ms cubic-bezier(.2,.8,.2,1), opacity ${duration}ms ease`; requestAnimationFrame(() => { element.style.transform = transform; }); return wait(duration); }
async function showProduct(index) {
  const card = elements.grid.children[index]; if (!card) return;
  const product = productData(products[index]); state = State.SELECTING; console.info(`[Signage] Product "${product.id}" selected`);
  const from = card.getBoundingClientRect(); const detail = elements.detailProduct; const image = document.createElement("img"); image.src = product.image; image.alt = product.name; image.draggable = false; detail.replaceChildren(image); elements.detailTitle.textContent = product.name; elements.detailPrice.textContent = config.price.displayMode === "hidden" ? "" : product.price; elements.overlay.setAttribute("aria-hidden", "false"); elements.dimmer.classList.add("is-visible"); card.classList.add("is-hidden");
  const target = detail.getBoundingClientRect(); const scaleX = from.width / target.width; const scaleY = from.height / target.height; const offsetX = from.left + from.width / 2 - (target.left + target.width / 2); const offsetY = from.top + from.height / 2 - (target.top + target.height / 2);
  detail.style.transition = "none"; detail.style.opacity = "1"; detail.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scaleX}, ${scaleY})`; state = State.SELECTING; await wait(30); await transition(detail, config.animation.transitionInDurationMs, "translate3d(0, 0, 0) scale(1)"); state = State.DETAIL; elements.detailCopy.classList.add("is-visible"); await wait(config.animation.detailDurationMs); state = State.RETURNING; elements.detailCopy.classList.remove("is-visible"); await wait(180);
  const latest = card.getBoundingClientRect(); const current = detail.getBoundingClientRect(); const returnX = latest.left + latest.width / 2 - (current.left + current.width / 2); const returnY = latest.top + latest.height / 2 - (current.top + current.height / 2); await transition(detail, config.animation.transitionOutDurationMs, `translate3d(${returnX}px, ${returnY}px, 0) scale(${latest.width / current.width}, ${latest.height / current.height})`); detail.style.opacity = "0"; card.classList.remove("is-hidden"); elements.dimmer.classList.remove("is-visible"); elements.overlay.setAttribute("aria-hidden", "true"); state = State.OVERVIEW;
}
async function runPresentation() { await wait(config.animation.overviewInitialDurationMs); let index = 0; while (products.length) { await showProduct(index); index = (index + 1) % products.length; await wait(config.animation.betweenProductsDurationMs); } }
async function load() { try { if (window.location.protocol === "file:") throw new Error("Open the app through a local HTTP server, not file://"); const response = await fetch("config/config.json", { cache: "no-store" }); if (!response.ok) throw new Error(`HTTP ${response.status}`); config = safeConfig(await response.json()); products = config.products; applyTheme(); renderGrid(); if (!products.length) { elements.status.textContent = "Ingen aktive produkter i config/config.json"; elements.status.classList.add("is-visible"); return; } if (config.branding.showLogo && config.branding.logo) { elements.logo.src = config.branding.logo; elements.logo.hidden = false; } console.info(`[Signage] Loaded ${products.length} products`); runPresentation(); } catch (error) { console.error("[Signage] Could not load configuration", error); elements.status.textContent = window.location.protocol === "file:" ? "Start via scripts/start-dev.ps1 eller: py -m http.server 8080" : "Konfiguration kunne ikke indlæses – se browserens Console"; elements.status.classList.add("is-visible"); } }
window.addEventListener("resize", () => { if (state === State.OVERVIEW) elements.detailProduct.style.transform = "translate3d(0,0,0) scale(.96)"; });
load();
