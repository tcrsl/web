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
const MODEL = "gemini-flash-latest"; // dins del nivell gratuït
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Falta la variable d'entorn GEMINI_API_KEY.");
  process.exit(1);
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
- Verifica les dades amb la cerca web abans de respondre; si no n'estàs segur,
  tria un altre fet del qual sí que tinguis una font fiable.
- Cita 1 o 2 fonts reals amb la seva URL.

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

  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }], // cerca web gratuïta per verificar dades
      generationConfig: { temperature: 0.9 },
    }),
  });

  if (!resposta.ok) {
    const errText = await resposta.text();
    throw new Error(`Error de l'API de Gemini (${resposta.status}): ${errText}`);
  }

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
}

main().catch((err) => {
  console.error("Error generant l'efemèride:", err);
  process.exit(1);
});
