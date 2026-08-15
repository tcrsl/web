import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARREL = path.resolve(".");
const PARTIALS = path.join(ARREL, "partials");
const DATA_JSON = path.join(ARREL, "data/efemerides.json");
const CARPETA_ARXIU = path.join(ARREL, "efemerides");
const RUTA_PLANTILLA_ARXIU = path.join(CARPETA_ARXIU, "_template.html");
const RUTA_SITEMAP = path.join(ARREL, "sitemap.xml");

function omplir(str, valors) {
  let out = str;
  for (const [k, v] of Object.entries(valors)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

async function partial(nom, valors) {
  const raw = await readFile(path.join(PARTIALS, nom), "utf-8");
  return omplir(raw, valors);
}

function substituirMarcador(html, nom, contingut) {
  const inici = `<!-- ${nom}_START -->`;
  const final = `<!-- ${nom}_END -->`;
  const i = html.indexOf(inici);
  const f = html.indexOf(final);
  if (i === -1 || f === -1) return html; // pàgina sense aquest marcador, la deixem tal qual
  return html.slice(0, i + inici.length) + "\n" + contingut + "\n" + html.slice(f);
}

async function injectarMarcadors(rutaFitxer, prefix, efemeridesHref, footerPartial = "footer.html") {
  let html = await readFile(rutaFitxer, "utf-8");
  const header = await partial("header.html", { PREFIX: prefix, EFEMERIDES_HREF: efemeridesHref });
  const footer = await partial(footerPartial, { PREFIX: prefix });
  const headExtra = await partial("head-extra.html", { PREFIX: prefix });
  html = substituirMarcador(html, "HEADER", header);
  html = substituirMarcador(html, "FOOTER", footer);
  html = substituirMarcador(html, "HEAD_EXTRA", headExtra);
  await writeFile(rutaFitxer, html, "utf-8");
}

function escaparHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncar(text, maxLength) {
  const net = String(text).trim();
  if (net.length <= maxLength) return net;
  return net.slice(0, maxLength - 1).replace(/\s+\S*$/, "") + "…";
}

function construirFontsHtml(fonts) {
  if (!fonts || fonts.length === 0) return "";
  const enllacos = fonts.map((f) => {
    const nom = escaparHtml(f.nom || "");
    return f.url ? `<a href="${escaparHtml(f.url)}" target="_blank" rel="noopener">${nom}</a>` : nom;
  });
  return "Font: " + enllacos.join(" · ");
}

function dataLlarga(dataISO) {
  const [any, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(any, mes - 1, dia, 10));
  return new Intl.DateTimeFormat("ca-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(data);
}

async function injectarMarcadorsEnMemoria(html, footerPartial = "footer.html") {
  html = substituirMarcador(html, "HEADER", await partial("header.html", { PREFIX: "../", EFEMERIDES_HREF: "index.html" }));
  html = substituirMarcador(html, "FOOTER", await partial(footerPartial, { PREFIX: "../" }));
  html = substituirMarcador(html, "HEAD_EXTRA", await partial("head-extra.html", { PREFIX: "../" }));
  return html;
}

async function generarSitemap(historial) {
  const base = "https://tcrsl.github.io/web/";
  const entrades = historial
    .filter((e) => e.data)
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  let urls = `  <url>\n    <loc>${base}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  urls += `  <url>\n    <loc>${base}efemerides/</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

  for (const e of entrades) {
    urls += `  <url>\n    <loc>${base}efemerides/${e.data}.html</loc>\n    <lastmod>${e.data}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;

  await writeFile(RUTA_SITEMAP, xml, "utf-8");
  console.log("sitemap.xml regenerat.");
}

async function regenerarArxiu() {
  const historial = JSON.parse(await readFile(DATA_JSON, "utf-8"));
  const plantillaBase = await readFile(RUTA_PLANTILLA_ARXIU, "utf-8");

  let llistaHtml = "";

  for (const entrada of historial) {
    if (!entrada.data) continue; // entrades de llavor sense data, no generen pàgina pròpia
    const dataText = dataLlarga(entrada.data);
    const titolAny = entrada.any && entrada.any !== "avui" ? `${entrada.titol} (${entrada.any})` : entrada.titol;

    let pagina = omplir(plantillaBase, {
      TITOL: escaparHtml(titolAny),
      TEXT_CURT: escaparHtml(truncar(entrada.text, 155)),
      DATA: escaparHtml(`Publicat el ${dataText}`),
      CATEGORIA: escaparHtml(entrada.categoria),
      TEXT: escaparHtml(entrada.text),
      FONTS_HTML: construirFontsHtml(entrada.fonts),
    });

    pagina = await injectarMarcadorsEnMemoria(pagina);

    await writeFile(path.join(CARPETA_ARXIU, `${entrada.data}.html`), pagina, "utf-8");

    llistaHtml += `        <article class="efemerides-llista__item">
          <span class="efemeride__data">${escaparHtml(dataText)}</span>
          <span class="efemeride__categoria">${escaparHtml(entrada.categoria)}</span>
          <h3><a href="${entrada.data}.html">${escaparHtml(titolAny)}</a></h3>
          <p>${escaparHtml(truncar(entrada.text, 160))}</p>
        </article>\n`;
  }

  const indexActual = await readFile(path.join(CARPETA_ARXIU, "index.html"), "utf-8");

  let nouIndex = await injectarMarcadorsEnMemoria(indexActual, "footer-llarg.html");
  nouIndex = nouIndex.replace(
    /<div class="efemerides-llista">[\s\S]*?\n {6}<\/div>/,
    `<div class="efemerides-llista">\n${llistaHtml}      </div>`
  );

  await writeFile(path.join(CARPETA_ARXIU, "index.html"), nouIndex, "utf-8");
  await generarSitemap(historial);
}

async function main() {
  await injectarMarcadors(path.join(ARREL, "index.html"), "", "efemerides/index.html", "footer-llarg.html");
  await injectarMarcadors(path.join(ARREL, "avis-legal.html"), "", "efemerides/index.html");
  await regenerarArxiu();
  console.log("Build completat: header/footer/head sincronitzats i arxiu regenerat des de data/efemerides.json.");
}

main().catch((err) => {
  console.error("Error al build:", err);
  process.exit(1);
});
