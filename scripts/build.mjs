import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARREL = path.resolve(".");
const PARTIALS = path.join(ARREL, "partials");
const DATA_JSON = path.join(ARREL, "data/efemerides.json");

const CARPETA_ARXIU_CA = path.join(ARREL, "efemerides");
const RUTA_PLANTILLA_CA = path.join(CARPETA_ARXIU_CA, "_template.html");

const CARPETA_ARXIU_ES = path.join(ARREL, "es/efemerides");
const RUTA_PLANTILLA_ES = path.join(CARPETA_ARXIU_ES, "_template.html");

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

// Injecta HEADER/FOOTER/HEAD_EXTRA a una pàgina CATALANA (arrel o
// dins d'una subcarpeta com efemerides/).
async function injectarMarcadorsCA(rutaFitxer, prefix, efemeridesHref, idiomaEsHref, footerPartial = "footer.html") {
  let html = await readFile(rutaFitxer, "utf-8");
  const header = await partial("header.html", { PREFIX: prefix, EFEMERIDES_HREF: efemeridesHref, IDIOMA_ES_HREF: idiomaEsHref });
  const footer = await partial(footerPartial, { PREFIX: prefix });
  const headExtra = await partial("head-extra.html", { PREFIX: prefix });
  html = substituirMarcador(html, "HEADER", header);
  html = substituirMarcador(html, "FOOTER", footer);
  html = substituirMarcador(html, "HEAD_EXTRA", headExtra);
  await writeFile(rutaFitxer, html, "utf-8");
}

// Injecta HEADER/FOOTER/HEAD_EXTRA a una pàgina CASTELLANA dins
// /es/ (es/index.html, es/avis-legal.html). idiomaCaHref és la ruta
// completa (ja resolta) cap a la pàgina catalana equivalent, p. ex.
// "../index.html" o "../avis-legal.html".
async function injectarMarcadorsES(rutaFitxer, prefix, efemeridesHref, idiomaCaHref, footerPartial = "footer-es.html") {
  let html = await readFile(rutaFitxer, "utf-8");
  const header = await partial("header-es.html", { PREFIX: prefix, EFEMERIDES_HREF: efemeridesHref, IDIOMA_CA_HREF: idiomaCaHref });
  const footer = await partial(footerPartial, { PREFIX: prefix });
  const headExtra = await partial("head-extra-es.html", { PREFIX: prefix });
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
// Serialitza un valor per inserir-lo dins d'un bloc <script type="application/ld+json">.
// A diferència d'escaparHtml (pensat per a text dins d'etiquetes HTML),
// això produeix un literal JSON vàlid (amb cometes, barres invertides,
// salts de línia, etc. escapats correctament).
function jsonStr(valor) {
  return JSON.stringify(String(valor));
}

function truncar(text, maxLength) {
  const net = String(text).trim();
  if (net.length <= maxLength) return net;
  return net.slice(0, maxLength - 1).replace(/\s+\S*$/, "") + "…";
}

function construirFontsHtml(fonts, idioma) {
  if (!fonts || fonts.length === 0) return "";
  const paraula = idioma === "es" ? "Fuente" : "Font";
  const enllacos = fonts.map((f) => {
    const nom = escaparHtml(f.nom || "");
    return f.url ? `<a href="${escaparHtml(f.url)}" target="_blank" rel="noopener">${nom}</a>` : nom;
  });
  return `${paraula}: ` + enllacos.join(" · ");
}

function dataLlarga(dataISO, idioma) {
  const [any, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(any, mes - 1, dia, 10));
  return new Intl.DateTimeFormat(idioma === "es" ? "es-ES" : "ca-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(data);
}

async function injectarMarcadorsEnMemoriaCA(html, idiomaEsHref, footerPartial = "footer.html") {
  html = substituirMarcador(html, "HEADER", await partial("header.html", { PREFIX: "../", EFEMERIDES_HREF: "index.html", IDIOMA_ES_HREF: idiomaEsHref }));
  html = substituirMarcador(html, "FOOTER", await partial(footerPartial, { PREFIX: "../" }));
  html = substituirMarcador(html, "HEAD_EXTRA", await partial("head-extra.html", { PREFIX: "../" }));
  return html;
}

async function generarSitemap(historial) {
  const base = "https://transcatalarodes.cat/";
  // Entrades bilingües (titol/text són objectes {ca,es}): tenen fitxa a
  // les dues carpetes. Entrades antigues (titol/text són string pla):
  // només existeixen en català.
  const entrades = historial
    .filter((e) => e.data)
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  let urls = `  <url>\n    <loc>${base}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  urls += `  <url>\n    <loc>${base}efemerides/</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  urls += `  <url>\n    <loc>${base}es/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  urls += `  <url>\n    <loc>${base}es/efemerides/</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

  for (const e of entrades) {
    const esBilingue = typeof e.titol === "object";
    urls += `  <url>\n    <loc>${base}efemerides/${e.data}.html</loc>\n    <lastmod>${e.data}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    if (esBilingue) {
      urls += `  <url>\n    <loc>${base}es/efemerides/${e.data}.html</loc>\n    <lastmod>${e.data}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;

  await writeFile(RUTA_SITEMAP, xml, "utf-8");
  console.log("sitemap.xml regenerat (amb URLs /es/).");
}

// Regenera l'arxiu d'UN idioma (CA o ES) sencer a partir del JSON.
// Entrades antigues (titol/text en string pla) només es regeneren en
// CATALÀ; no generen fitxa en castellà perquè no en tenen traducció.
async function regenerarArxiuIdioma(idioma, historial) {
  const carpeta = idioma === "es" ? CARPETA_ARXIU_ES : CARPETA_ARXIU_CA;
  const rutaPlantilla = idioma === "es" ? RUTA_PLANTILLA_ES : RUTA_PLANTILLA_CA;
  const plantillaBase = await readFile(rutaPlantilla, "utf-8");

  let llistaHtml = "";

  for (const entrada of historial) {
    if (!entrada.data) continue; // entrades de llavor sense data, no generen pàgina pròpia

    const esBilingue = typeof entrada.titol === "object";
    if (idioma === "es" && !esBilingue) continue; // entrada antiga: no hi ha versió en castellà

    const titol = esBilingue ? entrada.titol[idioma] : entrada.titol;
    const text = esBilingue ? entrada.text[idioma] : entrada.text;
    const categoria = esBilingue
      ? { "curiositat-tecnica": { ca: "Curiositat tècnica", es: "Curiosidad técnica" }, "historia-maquinaria": { ca: "Història de la maquinària", es: "Historia de la maquinaria" }, "dada-curiosa": { ca: "Dada curiosa", es: "Dato curioso" } }[entrada.categoria]?.[idioma] ?? entrada.categoria
      : entrada.categoria;

    const dataText = dataLlarga(entrada.data, idioma);
    const titolAny = entrada.any && entrada.any !== "avui" ? `${titol} (${entrada.any})` : titol;
    const prefixData = idioma === "es" ? "Publicado el" : "Publicat el";

    const urlCanonica = idioma === "es"
      ? `https://transcatalarodes.cat/es/efemerides/${entrada.data}.html`
      : `https://transcatalarodes.cat/efemerides/${entrada.data}.html`;

    let pagina = omplir(plantillaBase, {
      TITOL: escaparHtml(titolAny),
      TEXT_CURT: escaparHtml(truncar(text, 155)),
      DATA: escaparHtml(`${prefixData} ${dataText}`),
      CATEGORIA: escaparHtml(categoria),
      TEXT: escaparHtml(text),
      FONTS_HTML: construirFontsHtml(entrada.fonts, idioma),
      SLUG: entrada.data,
      TITOL_JSON: jsonStr(titolAny),
      TEXT_CURT_JSON: jsonStr(truncar(text, 155)),
      DATA_ISO_JSON: jsonStr(entrada.data),
      CATEGORIA_JSON: jsonStr(categoria),
      URL_JSON: jsonStr(urlCanonica),
    });
    // La plantilla CA fa servir marcadors HEADER/FOOTER (es resolen
    // via partials); la plantilla ES ja porta el header/footer
    // incrustats directament (amb l'enllaç recíproc per SLUG), no
    // calen marcadors.
    if (idioma === "ca") {
      const idiomaEsHref = esBilingue ? `../es/efemerides/${entrada.data}.html` : "../es/efemerides/index.html";
      pagina = await injectarMarcadorsEnMemoriaCA(pagina, idiomaEsHref);
    }

    await writeFile(path.join(carpeta, `${entrada.data}.html`), pagina, "utf-8");

    llistaHtml += `        <article class="efemerides-llista__item">
          <span class="efemeride__data">${escaparHtml(dataText)}</span>
          <span class="efemeride__categoria">${escaparHtml(categoria)}</span>
          <h3><a href="${entrada.data}.html">${escaparHtml(titolAny)}</a></h3>
          <p>${escaparHtml(truncar(text, 160))}</p>
        </article>\n`;
  }

  const rutaIndex = path.join(carpeta, "index.html");
  const indexActual = await readFile(rutaIndex, "utf-8");

  let nouIndex = indexActual;
  if (idioma === "ca") {
    nouIndex = await injectarMarcadorsEnMemoriaCA(indexActual, "../es/efemerides/index.html", "footer-llarg.html");
  }
  // L'índex ES ja porta header/footer incrustats (com el _template ES), no calen marcadors.

  nouIndex = nouIndex.replace(
    /<div class="efemerides-llista">[\s\S]*?\n\s*<\/div>/,
    `<div class="efemerides-llista">\n${llistaHtml}      </div>`
  );

  await writeFile(rutaIndex, nouIndex, "utf-8");
}

async function main() {
  // Pàgines catalanes (arrel)
  await injectarMarcadorsCA(path.join(ARREL, "index.html"), "", "efemerides/index.html", "es/index.html", "footer-llarg.html");
  await injectarMarcadorsCA(path.join(ARREL, "avis-legal.html"), "", "efemerides/index.html", "es/avis-legal.html");
  // Pàgines castellanes (dins /es/)
  await injectarMarcadorsES(path.join(ARREL, "es/index.html"), "../", "efemerides/index.html", "../index.html", "footer-llarg-es.html");
  await injectarMarcadorsES(path.join(ARREL, "es/avis-legal.html"), "../", "efemerides/index.html", "../avis-legal.html");

  // Arxiu d'efemèrides, als dos idiomes
  const historial = JSON.parse(await readFile(DATA_JSON, "utf-8"));
  await regenerarArxiuIdioma("ca", historial);
  await regenerarArxiuIdioma("es", historial);

  await generarSitemap(historial);

  console.log("Build completat: header/footer/head sincronitzats (CA+ES) i arxiu regenerat als dos idiomes.");
}

main().catch((err) => {
  console.error("Error al build:", err);
  process.exit(1);
});
