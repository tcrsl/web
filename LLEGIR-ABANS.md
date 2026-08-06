# Trans-Català Rodes — "Sabies que...?"

## Estat actual: en producció

A diferència de la primera demo (ZIP local, dades incrustades al JS),
**el sistema ja està desplegat i funcionant de veritat** a:

- Web: https://tcrsl.github.io/web/
- Arxiu: https://tcrsl.github.io/web/efemerides/
- Repositori: `tcrsl/web` (GitHub)

Cada dia, sense intervenció humana, es genera una efemèride nova, es
publica al widget de portada ("Sabies que...?") i es crea una fitxa
permanent nova a l'arxiu.

## Com funciona (peça per peça)

| Peça | Què fa |
|---|---|
| **GitHub Pages** | Serveix la web estàtica directament des del repositori. Gratuït, sense hosting extern. |
| **GitHub Actions** (`.github/workflows/efemeride-diaria.yml`) | Es dispara cada dia a les 05:30 UTC i també es pot llançar a mà des de la pestanya "Actions". |
| **`scripts/generar-efemeride.mjs`** | Crida l'API de Gemini, valida la resposta, i escriu els tres llocs següents. |
| **`data/efemerides.json`** | Historial complet en JSON. El `script.js` de la portada el llegeix per mostrar l'efemèride d'avui al widget "Sabies que...?". |
| **`efemerides/_template.html`** | Plantilla amb placeholders (`{{TITOL}}`, `{{DATA}}`, `{{CATEGORIA}}`, `{{TEXT}}`, `{{TEXT_CURT}}`, `{{FONTS_HTML}}`) que el script omple cada dia. |
| **`efemerides/YYYY-MM-DD.html`** | Una pàgina nova cada dia, indexable per Google, amb URL pròpia i permanent. |
| **`efemerides/index.html`** | Llistat de l'arxiu; el script hi insereix l'entrada nova a dalt de tot, automàticament. |

Cost total: **0 €/mes**. Tot corre amb els nivells gratuïts de GitHub
(Pages + Actions) i de l'API de Gemini (Google AI Studio).

## Sobre el proveïdor d'IA: per què Gemini i no Anthropic

La versió inicial d'aquest document preveia fer servir l'API
d'Anthropic amb cerca web integrada. En la pràctica, es va optar per
**Gemini (Google AI Studio)** pel seu nivell gratuït sense targeta de
crèdit, suficient per a 1 crida diària.

Dos matisos importants que val la pena tenir presents:

1. **Sense cerca web en temps real.** La funció de cerca de Gemini
   consumeix una quota que, a la pràctica, exigeix facturació
   activada fins i tot dins el "nivell gratuït" — així que es va
   treure. Per compensar-ho, el prompt exigeix explícitament que el
   model faci servir **només fets ben establerts i consolidats**
   (els que trobaries a una enciclopèdia o al lloc oficial d'un
   fabricant), i que descarti qualsevol dada de la qual no estigui
   segur, en comptes de verificar-la en viu.
2. **Model per àlies, no per versió fixa.** El script fa servir
   `gemini-flash-latest` (àlies oficial de Google) en lloc d'un nom
   de model concret com `gemini-2.5-flash`. Google va retirar aquest
   últim als pocs mesos de sortir — l'àlies evita que això torni a
   trencar el sistema sense avís.

Si en algun moment es vol tornar a activar la verificació amb cerca
web real (més fiabilitat, cost lleugerament més alt), cal:
- Activar facturació al projecte de Google Cloud, o
- Migrar el script a l'API d'Anthropic o OpenAI amb cerca integrada.

## Mesures de fiabilitat sense supervisió humana

1. **Només 3 categories de baix risc**, sense excepcions: "Curiositat
   tècnica", "Història de la maquinària" i "Dada curiosa". Cap
   normativa, llei ni sanció — un error aquí no té conseqüència legal
   ni de credibilitat greu.
2. **Evita repetir temes**: el script passa a la IA els títols de les
   últimes 40 entrades perquè no els repeteixi.
3. **Instrucció explícita de no inventar**: si el model no està segur
   d'una dada concreta (any, xifra, nom), se li demana que triï'n una
   altra de la qual sí que ho estigui. Si no té una font coneguda amb
   URL real, pot citar només el nom de la font sense enllaç.
4. **Escapament d'HTML net**: totes les dades es passen per una
   funció d'escapament abans d'inserir-se a l'HTML, per evitar que
   cap caràcter especial (cometes, accents, símbols) trenqui la
   pàgina.

Amb tot això no cal revisió diària, però és recomanable fer una
ullada de tant en tant a `/efemerides/`, sobretot els primers mesos.

## Sobre el SEO

El widget de portada, per si sol, no puja gaire el SEO — un text que
canvia cada dia a la mateixa URL no és "contingut nou" indexable, és
contingut que substitueix l'anterior.

El que sí suma és **l'arxiu**: cada fitxa és una URL permanent pròpia,
amb el seu propi títol i meta descripció, que amb mesos pot posicionar
per cerques del sector. Val la pena presentar-ho al client així: "dona
sensació de web viva des del primer dia, i amb el temps construeix un
arxiu que atrau cerques" — no com un botó màgic de SEO immediat.

## Manteniment habitual

- **Canviar el secret `GEMINI_API_KEY`**: Settings → Secrets and
  variables → Actions, al repositori de GitHub.
- **Veure si ha fallat algun dia**: pestanya "Actions" del
  repositori — les execucions fallides surten en vermell.
- **Forçar una execució manual**: Actions → "Efemèride diària" → "Run
  workflow".
- **Si Google torna a retirar el model** i torna a donar error 404/
  429: el més probable és que calgui revisar el nom del model o
  activar facturació al projecte de Google Cloud (veure secció
  anterior).
