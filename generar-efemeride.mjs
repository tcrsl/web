/**
 * generar-efemeride.mjs
 * -----------------------------------------------------------
 * Aquest script es dissenyat per executar-se 1 COP AL DIA
 * (via GitHub Actions, veure .github/workflows/efemeride-diaria.yml)
 * un cop la web ja estigui allotjada en un repositori de GitHub.
 *
 * NO cal executar-lo ara: és la peça d'automatització que
 * substituirà les dades d'exemple del widget quan es publiqui
 * la web de veritat.
 *
 * NOMÉS 3 categories, totes de baix risc (sense normativa, lleis
 * ni res que pugui quedar desactualitzat o generar responsabilitat
 * legal si la IA s'equivoca): curiositats tècniques, història de
 * la maquinària i dades generals/curioses del sector.
 *
 * Per reduir el risc d'invenció, la IA fa servir l'eina de cerca
 * web abans de redactar (web_search), i ha de tornar sempre com a
 * mínim una font amb URL real trobada a la cerca. Si no en troba
 * cap de fiable, el script descarta el resultat i no publica res
 * aquell dia (millor no publicar que publicar una dada dubtosa).
 *
 * Què fa:
 *  1. Llegeix l'historial de temes ja publicats (evita repeticions).
 *  2. Crida a l'API d'Anthropic amb l'eina de cerca web activada.
 *  3. Valida que la resposta porti almenys una font amb URL real.
 *  4. Genera una pàgina HTML nova a /efemerides/AAAA-MM-DD.html
 *  5. Actualitza l'historial i el llistat de l'arxiu (/efemerides/index.html)
 *  6. Actualitza el widget de la portada (index.html) amb la dada d'avui.
 *
 * Requereix la variable d'entorn ANTHROPIC_API_KEY (es configura
 * com a "Secret" al repositori de GitHub, mai al codi).
 * -----------------------------------------------------------
 */

import fs from "fs/promises";
import path from "path";

const ARREL = path.resolve(new URL(".", import.meta.url).pathname, "..");
const HISTORIAL_PATH = path.join(ARREL, "efemerides", "data", "historial.json");
const CARPETA_EFEMERIDES = path.join(ARREL, "efemerides");
const INDEX_ARXIU = path.join(CARPETA_EFEMERIDES, "index.html");
const INDEX_PORTADA = path.join(ARREL, "index.html");

// Rotem entre les 3 categories de baix risc segons el dia de la setmana.
const CATEGORIES_PER_DIA = [
  "Dada curiosa",              // diumenge
  "Història de la maquinària", // dilluns
  "Curiositat tècnica",        // dimarts
  "Dada curiosa",              // dimecres
  "Història de la maquinària", // dijous
  "Curiositat tècnica",        // divendres
  "Dada curiosa"               // dissabte
];

async function llegirHistorial() {
  try {
    const contingut = await fs.readFile(HISTORIAL_PATH, "utf-8");
    return JSON.parse(contingut);
  } catch {
    return [];
  }
}

async function demanarEfemerideALaIA(categoria, historial) {
  const temesRecents = historial.slice(-60).map((e) => e.titol);

  const prompt = `Ets un redactor especialitzat en el sector del transport de mercaderies i els serveis de camió grua.

Busca a internet UNA dada real i verificable per publicar avui sobre la categoria: "${categoria}" (història de maquinària de transport/grues, curiositats tècniques d'enginyeria, o dades generals del sector — mai normativa, lleis, sancions ni res que pugui quedar desactualitzat legalment).

Passos:
1. Fes una cerca web per trobar un fet concret i datat (amb any) sobre aquest tema, relacionat amb camions, grues, transport de mercaderies o logística.
2. Confirma que el fet apareix en almenys una font real trobada a la cerca.
3. Redacta una píldora de 2-3 frases (250-400 caràcters) en català, to professional i proper.
4. NO incloguis mai normativa, articles de llei, sancions ni xifres legals concretes.
5. Si no trobes cap font fiable per a un fet concret, tria'n un altre dins la mateixa categoria.

Evita repetir aquests temes ja publicats: ${temesRecents.join(", ") || "cap encara"}.

Un cop tinguis el fet confirmat, respon NOMÉS amb aquest JSON (sense text addicional, sense markdown):
{
  "categoria": "${categoria}",
  "any": "AAAA",
  "titol": "...",
  "text": "...",
  "fonts": [{"nom": "Nom de la font", "url": "https://..."}]
}
El camp "fonts" ha de tenir com a mínim 1 element amb una URL real trobada a la cerca.`;

  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }]
    })
  });

  if (!resposta.ok) {
    throw new Error(`Error API Anthropic: ${resposta.status} ${await resposta.text()}`);
  }

  const dades = await resposta.json();

  // Amb l'eina de cerca activada, la resposta pot portar diversos
  // blocs (tool_use, tool_result, text...). Ens quedem amb l'ÚLTIM
  // bloc de text, que és la resposta final un cop feta la cerca.
  const blocsText = dades.content.filter((b) => b.type === "text");
  const text = blocsText.length ? blocsText[blocsText.length - 1].text : "";
  const net = text.replace(/```json|```/g, "").trim();

  const entrada = JSON.parse(net);

  // Xarxa de seguretat: si no hi ha cap font amb URL vàlida, es descarta.
  const teFontValida = Array.isArray(entrada.fonts) &&
    entrada.fonts.some((f) => f.url && /^https?:\/\//.test(f.url));

  if (!teFontValida) {
    throw new Error("La IA no ha aportat cap font amb URL vàlida: es descarta aquesta generació.");
  }

  return entrada;
}

function formatarDataCatala(data) {
  return data.toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" });
}

function fontsAHtml(fonts) {
  if (!fonts || fonts.length === 0) return "";
  const enllacos = fonts
    .map((f) => `<a href="${f.url}" target="_blank" rel="noopener">${f.nom}</a>`)
    .join(" · ");
  return `Font: ${enllacos}`;
}

async function generarPaginaIndividual(dataISO, dataFormatada, entrada) {
  const plantilla = await fs.readFile(
    path.join(CARPETA_EFEMERIDES, "_template.html"),
    "utf-8"
  );
  const titolAmbAny = entrada.any ? `${entrada.titol} (${entrada.any})` : entrada.titol;
  const html = plantilla
    .replaceAll("{{DATA}}", dataFormatada)
    .replaceAll("{{CATEGORIA}}", entrada.categoria)
    .replaceAll("{{TITOL}}", titolAmbAny)
    .replaceAll("{{TEXT}}", entrada.text)
    .replaceAll("{{TEXT_CURT}}", entrada.text.slice(0, 155))
    .replaceAll("{{FONTS_HTML}}", fontsAHtml(entrada.fonts));

  await fs.writeFile(path.join(CARPETA_EFEMERIDES, `${dataISO}.html`), html, "utf-8");
  return titolAmbAny;
}

async function afegirAlArxiu(dataISO, dataFormatada, entrada, titolAmbAny) {
  const indexActual = await fs.readFile(INDEX_ARXIU, "utf-8");
  const nouBloc = `
        <article class="efemerides-llista__item">
          <span class="efemeride__data">Publicat el ${dataFormatada}</span>
          <span class="efemeride__categoria">${entrada.categoria}</span>
          <h3><a href="${dataISO}.html">${titolAmbAny}</a></h3>
          <p>${entrada.text}</p>
        </article>
`;
  const actualitzat = indexActual.replace(
    '<div class="efemerides-llista">',
    `<div class="efemerides-llista">\n${nouBloc}`
  );
  await fs.writeFile(INDEX_ARXIU, actualitzat, "utf-8");
  // Nota: en producció, quan l'arxiu superi ~30 entrades, cal
  // paginar (moure les més antigues a pagina-2.html, etc.)
}

async function actualitzarWidgetPortada(dataFormatada, entrada, titolAmbAny) {
  // En producció, el més robust és NO dependre només del JS del
  // navegador: aquí escrivim el valor d'avui directament al HTML
  // de la portada, perquè també el vegin els cercadors sense
  // executar JavaScript.
  let portada = await fs.readFile(INDEX_PORTADA, "utf-8");
  portada = portada
    .replace(/(<span class="efemeride__data" id="efemerideData">)[^<]*/, `$1${dataFormatada}`)
    .replace(/(<span class="efemeride__categoria" id="efemerideCategoria">)[^<]*/, `$1${entrada.categoria}`)
    .replace(/(<h3 id="efemerideTitol">)[^<]*/, `$1${titolAmbAny}`)
    .replace(/(<p id="efemerideText">)[^<]*/, `$1${entrada.text}`)
    .replace(/(<p class="efemeride__fonts" id="efemerideFonts">)[^<]*/, `$1${fontsAHtml(entrada.fonts)}`);
  await fs.writeFile(INDEX_PORTADA, portada, "utf-8");
}

async function main() {
  const avui = new Date();
  const dataISO = avui.toISOString().slice(0, 10);
  const dataFormatada = formatarDataCatala(avui);
  const categoria = CATEGORIES_PER_DIA[avui.getDay()];

  const historial = await llegirHistorial();

  // Evita duplicats si el workflow s'executa dos cops el mateix dia
  if (historial.some((e) => e.data === dataISO)) {
    console.log(`Ja existeix una efemèride per a ${dataISO}, no es genera cap de nova.`);
    return;
  }

  const entrada = await demanarEfemerideALaIA(categoria, historial);
  const titolAmbAny = await generarPaginaIndividual(dataISO, dataFormatada, entrada);
  await afegirAlArxiu(dataISO, dataFormatada, entrada, titolAmbAny);
  await actualitzarWidgetPortada(dataFormatada, entrada, titolAmbAny);

  historial.push({ data: dataISO, titol: entrada.titol, categoria: entrada.categoria });
  await fs.mkdir(path.dirname(HISTORIAL_PATH), { recursive: true });
  await fs.writeFile(HISTORIAL_PATH, JSON.stringify(historial, null, 2), "utf-8");

  console.log(`Efemèride generada per a ${dataISO}: "${titolAmbAny}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
