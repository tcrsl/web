// =============================================================
// Genera l'efemèride del dia amb l'API gratuïta de Gemini
// (Google AI Studio) i l'afegeix a data/efemerides.json
//
// Es fa servir des del workflow de GitHub Actions
// (.github/workflows/efemeride-diaria.yml), un cop al dia.
//
// Requereix la variable d'entorn GEMINI_API_KEY (secret de
// GitHub, mai s'escriu al codi ni es puja al repositori).
// =============================================================

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RUTA_DADES = path.resolve("data/efemerides.json");
const RUTA_PLANTILLA_ARXIU = path.resolve("efemerides/_template.html");
const RUTA_INDEX_ARXIU = path.resolve("efemerides/index.html");
const CARPETA_ARXIU = path.resolve("efemerides");
const MODEL = "gemini-flash-latest"; // àlies oficial: Google el manté apuntant sempre al Flash més recent
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Falta la variable d'entorn GEMINI_API_KEY.");
  process.exit(1);
}

// Escapa text perquè es pugui inserir amb seguretat dins d'HTML,
// tant en contingut com dins d'atributs (title, meta description...).
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

// Substitueix cada placeholder {{CLAU}} pel seu valor de manera literal
// (sense regex), per evitar el bug que hi havia abans amb {{FONTS_HTML}}
// quedant-se mal inserit enmig d'una altra paraula.
function omplirPlantilla(plantilla, valors) {
  let resultat = plantilla;
  for (const [clau, valor] of Object.entries(valors)) {
    resultat = resultat.split(`{{${clau}}}`).join(valor);
  }
  return resultat;
}

function dataLlargaCatalana() {
  const avui = new Date();
  const formatador = new Intl.DateTimeFormat("ca-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatador.format(avui);
}

function construirFontsHtml(fonts) {
  if (!fonts || fonts.length === 0) return "";
  const enllacos = fonts.map((f) => {
    const nom = escaparHtml(f.nom || "");
    if (f.url) {
      const url = escaparHtml(f.url);
      return `<a href="${url}" target="_blank" rel="noopener">${nom}</a>`;
    }
    return nom;
  });
  return "Font: " + enllacos.join(" · ");
}

// Data d'avui en horari d'Europa/Madrid, format YYYY-MM-DD
function dataAvuiISO() {
  const avui = new Date();
  const formatador = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatador.format(avui); // ja retorna YYYY-MM-DD
}

async function llegirHistorial() {
  try {
    const contingut = await readFile(RUTA_DADES, "utf-8");
    const dades = JSON.parse(contingut);
    return Array.isArray(dades) ? dades : [];
  } catch {
    return [];
  }
}

function extreureJSON(text) {
  // El model a vegades embolcalla la resposta amb ```json ... ```
  const net = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const inici = net.indexOf("{");
  const final = net.lastIndexOf("}");
  if (inici === -1 || final === -1) {
    throw new Error("La resposta del model no conté un objecte JSON vàlid.");
  }
  return JSON.parse(net.slice(inici, final + 1));
}

// Petita espera entre reintents (backoff progressiu).
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Crida l'API de Gemini amb reintents automàtics quan l'error és
// transitori: p. ex. FAILED_PRECONDITION (regió del runner de GitHub
// Actions no suportada en aquell moment) o UNAVAILABLE (sobrecàrrega
// temporal de Google). Amb un altre intent, sovint el runner cau en
// una altra regió i la crida funciona sense cap intervenció manual.
async function cridarGeminiAmbReintents(url, cos, intentsMaxims = 3) {
  for (let intent = 1; intent <= intentsMaxims; intent++) {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cos),
    });

    if (resposta.ok) return resposta;

    const errText = await resposta.text();
    const esTransitori = errText.includes("FAILED_PRECONDITION") || errText.includes("UNAVAILABLE");

    if (!esTransitori || intent === intentsMaxims) {
      throw new Error(`Error de l'API de Gemini (${resposta.status}): ${errText}`);
    }

    console.warn(`Intent ${intent}/${intentsMaxims} fallit (error transitori), reintentant en ${intent * 5}s...`);
    await esperar(intent * 5000);
  }
}

async function generarEfemeride(historial) {
  const titolsPrevis = historial
    .slice(-40)
    .map((e) => e.titol)
    .filter(Boolean);

  const prompt = `
Ets un redactor tècnic que escriu per al web d'una empresa catalana de transport
i serveis de camió grua (Trans-Català Rodes S.L.). Cada dia has de proposar UNA
"efemèride del dia" curta i interessant per a la secció "Sabies que...?" del web.

Regles estrictes:
- Categoria: tria NOMÉS una d'aquestes tres, sense excepcions: "Curiositat tècnica",
  "Història de la maquinària" o "Dada curiosa".
- Temàtica: camions, grues, transport de mercaderies, logística, contenidors,
  maquinària pesant, enginyeria del transport, o similars.
- NO tractis normativa vigent, legislació, seguretat vial actual, política ni cap
  tema legal o controvertit. Ha de ser una dada històrica, tècnica o curiosa de
  baix risc.
- Redacta en català, to proper però amable, entre 2 i 4 frases (uns 40-70 mots).
- No repeteixis cap d'aquests temes ja publicats: ${titolsPrevis.length ? titolsPrevis.join(" | ") : "(cap encara)"}.
- Fes servir NOMÉS fets ben establerts i consolidats (els que trobaries a
  enciclopèdies o llocs oficials de fabricants/institucions). Si no n'estàs
  segur d'una dada concreta (any exacte, xifra, nom), tria un altre fet del
  qual sí que estiguis segur.
- Cita 1 o 2 fonts reals i conegudes (per exemple el lloc web oficial d'un
  fabricant, una institució com un museu, o una organització del sector) amb
  la seva URL real i coneguda. Si no estàs seguríssim que la URL és correcta,
  posa només el nom de la font sense URL.

Respon ÚNICAMENT amb un objecte JSON, sense text addicional, sense markdown,
amb exactament aquesta forma:
{
  "categoria": "...",
  "any": "any o dècada de referència, com a text, p. ex. 1952",
  "titol": "títol curt, sense punt final",
  "text": "el text de l'efemèride",
  "fonts": [{ "nom": "nom de la font", "url": "https://..." }]
}
`.trim();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  // NOTA: la cerca web (tools: [{ google_search: {} }]) s'ha tret perquè
  // consumeix una quota separada que Google sol exigir amb facturació
  // activada, fins i tot dins el "nivell gratuït". Sense cerca, el model
  // respon només amb el seu coneixement, cosa que segueix sent gratuïta.
  const resposta = await cridarGeminiAmbReintents(url, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9 },
  });

  const dades = await resposta.json();
  const text = dades?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
  if (!text) throw new Error("Resposta buida del model.");

  const entrada = extreureJSON(text);

  // Validació mínima
  const camps = ["categoria", "any", "titol", "text", "fonts"];
  for (const camp of camps) {
    if (!(camp in entrada)) throw new Error(`Falta el camp "${camp}" a la resposta del model.`);
  }

  return entrada;
}

async function generarPaginaArxiu(entrada, avuiISO, dataText) {
  const plantilla = await readFile(RUTA_PLANTILLA_ARXIU, "utf-8");

  const titolAny = entrada.any && entrada.any !== "avui"
    ? `${entrada.titol} (${entrada.any})`
    : entrada.titol;

  const pagina = omplirPlantilla(plantilla, {
    TITOL: escaparHtml(titolAny),
    TEXT_CURT: escaparHtml(truncar(entrada.text, 155)),
    DATA: escaparHtml(`Publicat el ${dataText}`),
    CATEGORIA: escaparHtml(entrada.categoria),
    TEXT: escaparHtml(entrada.text),
    FONTS_HTML: construirFontsHtml(entrada.fonts),
  });

  const rutaFitxer = path.join(CARPETA_ARXIU, `${avuiISO}.html`);
  await writeFile(rutaFitxer, pagina, "utf-8");
  console.log(`Pàgina d'arxiu creada: efemerides/${avuiISO}.html`);
}

async function afegirAIndexArxiu(entrada, avuiISO, dataText) {
  const indexActual = await readFile(RUTA_INDEX_ARXIU, "utf-8");

  const titolAny = entrada.any && entrada.any !== "avui"
    ? `${entrada.titol} (${entrada.any})`
    : entrada.titol;

  const item = `        <article class="efemerides-llista__item">
          <span class="efemeride__data">${escaparHtml(dataText)}</span>
          <span class="efemeride__categoria">${escaparHtml(entrada.categoria)}</span>
          <h3><a href="${avuiISO}.html">${escaparHtml(titolAny)}</a></h3>
          <p>${escaparHtml(truncar(entrada.text, 160))}</p>
        </article>
`;

  const marcador = `<div class="efemerides-llista">`;
  if (!indexActual.includes(marcador)) {
    throw new Error(`No s'ha trobat '${marcador}' a efemerides/index.html; no es pot inserir l'entrada nova.`);
  }

  const nouIndex = indexActual.replace(marcador, `${marcador}\n${item}`);
  await writeFile(RUTA_INDEX_ARXIU, nouIndex, "utf-8");
  console.log("efemerides/index.html actualitzat amb l'entrada nova.");
}

async function main() {
  const historial = await llegirHistorial();
  const avui = dataAvuiISO();

  // Si ja hi ha una entrada generada avui (p. ex. reexecució manual), no en fem una altra
  if (historial.some((e) => e.data === avui)) {
    console.log(`Ja existeix una efemèride per a ${avui}. No es genera cap de nova.`);
    return;
  }

  const entrada = await generarEfemeride(historial);
  entrada.data = avui;

  // Les noves entrades es posen al principi (la més recent primera)
  const nouHistorial = [entrada, ...historial];

  await writeFile(RUTA_DADES, JSON.stringify(nouHistorial, null, 2) + "\n", "utf-8");
  console.log(`Efemèride del ${avui} generada i desada: "${entrada.titol}"`);

  const dataText = dataLlargaCatalana();
  await generarPaginaArxiu(entrada, avui, dataText);
  await afegirAIndexArxiu(entrada, avui, dataText);
}

main().catch((err) => {
  console.error("Error generant l'efemèride:", err);
  process.exit(1);
});
