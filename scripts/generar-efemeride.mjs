// =============================================================
// Genera l'efemèride del dia amb l'API gratuïta de Gemini
// (Google AI Studio) i l'afegeix a data/efemerides.json
//
// Es fa servir des del workflow de GitHub Actions
// (.github/workflows/efemeride-diaria.yml), un cop al dia.
//
// Requereix la variable d'entorn GEMINI_API_KEY (secret de
// GitHub, mai s'escriu al codi ni es puja al repositori).
//
// BILINGÜE (CA/ES) AMB CARPETES SEPARADES: Gemini genera "titol" i
// "text" ja en els dos idiomes dins la mateixa resposta (un sol
// objecte JSON, una sola crida). Amb això, aquest script escriu DUES
// pàgines d'arxiu independents:
//   - efemerides/YYYY-MM-DD.html    (català,  des de efemerides/_template.html)
//   - es/efemerides/YYYY-MM-DD.html (castellà, des de es/efemerides/_template.html)
// i actualitza els DOS índexs (efemerides/index.html i
// es/efemerides/index.html). Cada pàgina és d'un sol idioma, sense
// JS de commutació — millor per SEO real en cada idioma.
//
// La "categoria" NO la tradueix Gemini: el model retorna un
// identificador fix (p. ex. "curiositat-tecnica") i l'etiqueta
// visible en cada idioma surt de CATEGORIES, aquí sota.
//
// Compatibilitat amb entrades antigues: les efemèrides generades
// abans d'aquest canvi tenen "titol"/"text" com a string pla (només
// català) i "categoria" com el nom ja visible, no un identificador.
// Aquest script només crea entrades noves amb el format nou.
// =============================================================

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RUTA_DADES = path.resolve("data/efemerides.json");

const RUTA_PLANTILLA_CA = path.resolve("efemerides/_template.html");
const RUTA_INDEX_CA = path.resolve("efemerides/index.html");
const CARPETA_ARXIU_CA = path.resolve("efemerides");

const RUTA_PLANTILLA_ES = path.resolve("es/efemerides/_template.html");
const RUTA_INDEX_ES = path.resolve("es/efemerides/index.html");
const CARPETA_ARXIU_ES = path.resolve("es/efemerides");

// Identificador fix -> etiqueta visible en cada idioma. Si mai cal
// afegir una quarta categoria, afegeix-la aquí I a la llista de
// l'array CATEGORIES_IDS més avall (s'ha de fer als dos llocs).
const CATEGORIES = {
  "curiositat-tecnica": { ca: "Curiositat tècnica", es: "Curiosidad técnica" },
  "historia-maquinaria": { ca: "Història de la maquinària", es: "Historia de la maquinaria" },
  "dada-curiosa": { ca: "Dada curiosa", es: "Dato curioso" },
};
const CATEGORIES_IDS = Object.keys(CATEGORIES);

// gemini-flash-latest apunta a un model experimental amb quota molt
// restrictiva i per això fallava sovint. En comptes d'un únic model,
// fem servir una llista de models ESTABLES amb nivell gratuït: si el
// primer falla de manera transitòria, es prova automàticament el
// següent.
//
// Si en el futur Google torna a donar error 404/429 de manera
// persistent amb tots tres, revisa la llista de models vigents a
// https://ai.google.dev/gemini-api/docs/models i actualitza aquest
// array (evita sempre els que acaben en "-preview" o "-latest" per a
// producció, són menys estables).
const MODELS_FALLBACK = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash"];

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
// (sense regex), per evitar bugs amb valors que continguin '$'.
function omplirPlantilla(plantilla, valors) {
  let resultat = plantilla;
  for (const [clau, valor] of Object.entries(valors)) {
    resultat = resultat.split(`{{${clau}}}`).join(valor);
  }
  return resultat;
}

// Data llarga formatada en l'idioma indicat ("ca" o "es")
function dataLlarga(idioma) {
  const avui = new Date();
  const locale = idioma === "es" ? "es-ES" : "ca-ES";
  const formatador = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatador.format(avui);
}

function construirFontsHtml(fonts, idioma) {
  if (!fonts || fonts.length === 0) return "";
  const paraula = idioma === "es" ? "Fuente" : "Font";
  const enllacos = fonts.map((f) => {
    const nom = escaparHtml(f.nom || "");
    if (f.url) {
      const url = escaparHtml(f.url);
      return `<a href="${url}" target="_blank" rel="noopener">${nom}</a>`;
    }
    return nom;
  });
  return `${paraula}: ` + enllacos.join(" · ");
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

// Crida l'API de Gemini provant, per ordre, cada model de
// MODELS_FALLBACK. Per a cada model es fan com a màxim
// `intentsPerModel` intents amb un backoff curt abans de passar al
// següent model. Distingim errors TRANSITORIS (val la pena
// reintentar o canviar de model) de DEFINITIUS (es llança l'error
// immediatament, reintentar no serviria de res).
async function cridarGeminiAmbReintents(cos, intentsPerModel = 2) {
  let ultimError;

  for (const model of MODELS_FALLBACK) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    for (let intent = 1; intent <= intentsPerModel; intent++) {
      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cos),
      });

      if (resposta.ok) return resposta;

      const errText = await resposta.text();
      const esTransitori =
        errText.includes("FAILED_PRECONDITION") ||
        errText.includes("UNAVAILABLE") ||
        errText.includes("RESOURCE_EXHAUSTED") ||
        [429, 500, 503, 504].includes(resposta.status);

      ultimError = new Error(`Error de l'API de Gemini amb ${model} (${resposta.status}): ${errText}`);

      if (!esTransitori) {
        throw ultimError;
      }

      if (intent < intentsPerModel) {
        console.warn(`${model}: intent ${intent}/${intentsPerModel} fallit (transitori), reintentant en ${intent * 5}s...`);
        await esperar(intent * 5000);
      } else {
        console.warn(`${model}: esgotats els intents per aquest model, es prova el següent (si n'hi ha).`);
      }
    }
  }

  throw ultimError;
}

async function generarEfemeride(historial) {
  const titolsPrevis = historial
    .slice(-40)
    .map((e) => (typeof e.titol === "string" ? e.titol : e.titol?.ca))
    .filter(Boolean);

  const prompt = `
Ets un redactor tècnic que escriu per al web d'una empresa catalana de transport
i serveis de camió grua (Trans-Català Rodes S.L.). Cada dia has de proposar UNA
"efemèride del dia" curta i interessant per a la secció "Sabies que...?" del web,
JA REDACTADA EN CATALÀ I EN CASTELLÀ (dues traduccions fidels, no dues notícies
diferents).

Regles estrictes:
- Categoria: tria NOMÉS un d'aquests tres identificadors, sense excepcions ni
  variacions d'escriptura: "curiositat-tecnica", "historia-maquinaria" o
  "dada-curiosa".
- Temàtica: camions, grues, transport de mercaderies, logística, contenidors,
  maquinària pesant, enginyeria del transport, o similars.
- NO tractis normativa vigent, legislació, seguretat vial actual, política ni cap
  tema legal o controvertit. Ha de ser una dada històrica, tècnica o curiosa de
  baix risc.
- Redacta "titol" i "text" en to proper però amable, entre 2 i 4 frases (uns
  40-70 mots), TANT en català com en castellà. El castellà ha de ser una
  traducció fidel del català, no una versió diferent.
- No repeteixis cap d'aquests temes ja publicats: ${titolsPrevis.length ? titolsPrevis.join(" | ") : "(cap encara)"}.
- Fes servir NOMÉS fets ben establerts i consolidats (els que trobaries a
  enciclopèdies o llocs oficials de fabricants/institucions). Si no n'estàs
  segur d'una dada concreta (any exacte, xifra, nom), tria un altre fet del
  qual sí que estiguis segur.
- Cita 1 o 2 fonts reals i conegudes (per exemple el lloc web oficial d'un
  fabricant, una institució com un museu, o una organització del sector) amb
  la seva URL real i coneguda. Si no estàs seguríssim que la URL és correcta,
  posa només el nom de la font sense URL. El nom de la font es queda igual en
  els dos idiomes (no el tradueixis).

Respon ÚNICAMENT amb un objecte JSON, sense text addicional, sense markdown,
amb exactament aquesta forma:
{
  "categoria": "curiositat-tecnica | historia-maquinaria | dada-curiosa",
  "any": "any o dècada de referència, com a text, p. ex. 1952",
  "titol": { "ca": "títol curt en català, sense punt final", "es": "títol curt en castellà, sense punt final" },
  "text": { "ca": "el text de l'efemèride en català", "es": "el mismo texto en castellano" },
  "fonts": [{ "nom": "nom de la font", "url": "https://..." }]
}
`.trim();

  const resposta = await cridarGeminiAmbReintents({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9 },
  });

  const dades = await resposta.json();
  const text = dades?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
  if (!text) throw new Error("Resposta buida del model.");

  const entrada = extreureJSON(text);

  const camps = ["categoria", "any", "titol", "text", "fonts"];
  for (const camp of camps) {
    if (!(camp in entrada)) throw new Error(`Falta el camp "${camp}" a la resposta del model.`);
  }
  if (!CATEGORIES_IDS.includes(entrada.categoria)) {
    throw new Error(`Categoria no reconeguda: "${entrada.categoria}". Ha de ser una de: ${CATEGORIES_IDS.join(", ")}`);
  }
  for (const camp of ["titol", "text"]) {
    if (typeof entrada[camp] !== "object" || !entrada[camp].ca || !entrada[camp].es) {
      throw new Error(`El camp "${camp}" ha de tenir "ca" i "es" (resposta del model incompleta).`);
    }
  }

  return entrada;
}

// Genera la pàgina d'arxiu d'un sol idioma (CA o ES) a partir de la
// plantilla corresponent.
async function generarPaginaArxiuIdioma(idioma, entrada, avuiISO, dataText) {
  const rutaPlantilla = idioma === "es" ? RUTA_PLANTILLA_ES : RUTA_PLANTILLA_CA;
  const carpeta = idioma === "es" ? CARPETA_ARXIU_ES : CARPETA_ARXIU_CA;

  const plantilla = await readFile(rutaPlantilla, "utf-8");
  const titol = entrada.titol[idioma];
  const text = entrada.text[idioma];
  const categoria = CATEGORIES[entrada.categoria][idioma];
  const titolAny = entrada.any && entrada.any !== "avui" ? `${titol} (${entrada.any})` : titol;
  const prefix = idioma === "es" ? "Publicado el" : "Publicat el";

  const pagina = omplirPlantilla(plantilla, {
    TITOL: escaparHtml(titolAny),
    TEXT_CURT: escaparHtml(truncar(text, 155)),
    DATA: escaparHtml(`${prefix} ${dataText}`),
    CATEGORIA: escaparHtml(categoria),
    TEXT: escaparHtml(text),
    FONTS_HTML: construirFontsHtml(entrada.fonts, idioma),
    SLUG: avuiISO,
  });

  await writeFile(path.join(carpeta, `${avuiISO}.html`), pagina, "utf-8");
  console.log(`Pàgina d'arxiu creada: ${idioma === "es" ? "es/" : ""}efemerides/${avuiISO}.html`);
}

// Insereix l'entrada nova al llistat d'un sol idioma (CA o ES).
async function afegirAIndexArxiuIdioma(idioma, entrada, avuiISO, dataText) {
  const rutaIndex = idioma === "es" ? RUTA_INDEX_ES : RUTA_INDEX_CA;

  const titol = entrada.titol[idioma];
  const text = entrada.text[idioma];
  const categoria = CATEGORIES[entrada.categoria][idioma];
  const titolAny = entrada.any && entrada.any !== "avui" ? `${titol} (${entrada.any})` : titol;

  const indexActual = await readFile(rutaIndex, "utf-8");

  const item = `        <article class="efemerides-llista__item">
          <span class="efemeride__data">${escaparHtml(dataText)}</span>
          <span class="efemeride__categoria">${escaparHtml(categoria)}</span>
          <h3><a href="${avuiISO}.html">${escaparHtml(titolAny)}</a></h3>
          <p>${escaparHtml(truncar(text, 160))}</p>
        </article>
`;

  const marcador = `<div class="efemerides-llista">`;
  if (!indexActual.includes(marcador)) {
    throw new Error(`No s'ha trobat '${marcador}' a ${rutaIndex}; no es pot inserir l'entrada nova.`);
  }

  const nouIndex = indexActual.replace(marcador, `${marcador}\n${item}`);
  await writeFile(rutaIndex, nouIndex, "utf-8");
  console.log(`${idioma === "es" ? "es/" : ""}efemerides/index.html actualitzat amb l'entrada nova.`);
}

async function main() {
  const historial = await llegirHistorial();
  const avui = dataAvuiISO();

  if (historial.some((e) => e.data === avui)) {
    console.log(`Ja existeix una efemèride per a ${avui}. No es genera cap de nova.`);
    return;
  }

  const entrada = await generarEfemeride(historial);
  entrada.data = avui;

  const nouHistorial = [entrada, ...historial];
  await writeFile(RUTA_DADES, JSON.stringify(nouHistorial, null, 2) + "\n", "utf-8");
  console.log(`Efemèride del ${avui} generada i desada: "${entrada.titol.ca}" / "${entrada.titol.es}"`);

  for (const idioma of ["ca", "es"]) {
    const dataText = dataLlarga(idioma);
    await generarPaginaArxiuIdioma(idioma, entrada, avui, dataText);
    await afegirAIndexArxiuIdioma(idioma, entrada, avui, dataText);
  }
}

main().catch((err) => {
  console.error("Error generant l'efemèride:", err);
  process.exit(1);
});
