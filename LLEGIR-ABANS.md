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

A més, des de la migració a plantilles compartides, **el header, el
footer i els extres del `<head>` (favicon, etc.) ja no estan escrits a
mà a cada pàgina** — viuen en un sol lloc (`partials/`) i es
propaguen automàticament a totes les pàgines, incloses les 300+ fitxes
que hi haurà a l'arxiu amb el temps.

## Com funciona (peça per peça)

| Peça | Què fa |
|---|---|
| **GitHub Pages** | Serveix la web estàtica directament des del repositori. Gratuït, sense hosting extern. |
| **GitHub Actions — `efemeride-diaria.yml`** | Es dispara cada dia a les 05:30 UTC (i també a mà des de la pestanya "Actions"): genera l'efemèride del dia i després reconstrueix el web. |
| **GitHub Actions — `build.yml`** | Es dispara automàticament cada cop que es fa `push` a `partials/`, `index.html`, `avis-legal.html`, `efemerides/_template.html` o `data/efemerides.json`. Reconstrueix i publica els canvis sol, sense que calgui fer res més. |
| **`scripts/generar-efemeride.mjs`** | Crida l'API de Gemini, valida la resposta, i l'afegeix a `data/efemerides.json`. |
| **`scripts/build.mjs`** | El "muntador" del web: injecta `partials/header.html`, `partials/footer.html` (o `footer-llarg.html`) i `partials/head-extra.html` a totes les pàgines, i regenera **totes** les fitxes de l'arxiu i `efemerides/index.html` a partir de `data/efemerides.json`. |
| **`partials/header.html`** | El `<header>` (menú, logo) compartit per tot el web. Es canvia una vegada, i es propaga a totes les pàgines al següent build. |
| **`partials/footer.html`** | Footer curt (només copyright). S'usa a `avis-legal.html` i a cada fitxa individual de l'arxiu. |
| **`partials/footer-llarg.html`** | Footer llarg (contacte, enllaços, mapa). S'usa a `index.html` i a `efemerides/index.html`. |
| **`partials/head-extra.html`** | Etiquetes addicionals del `<head>` comunes a tot el web (ara mateix, el favicon). Aquí s'afegirà en el futur qualsevol `<meta>` nova, `robots`, analítiques, etc. |
| **`data/efemerides.json`** | Historial complet en JSON — és la **font de veritat** de tot l'arxiu. El `script.js` de la portada el llegeix per mostrar l'efemèride d'avui al widget "Sabies que...?", i `build.mjs` el llegeix per regenerar totes les fitxes HTML. |
| **`efemerides/_template.html`** | Plantilla amb placeholders (`{{TITOL}}`, `{{DATA}}`, `{{CATEGORIA}}`, `{{TEXT}}`, `{{TEXT_CURT}}`, `{{FONTS_HTML}}`) més els marcadors `HEADER_START/END`, `FOOTER_START/END` i `HEAD_EXTRA_START/END` que `build.mjs` omple cada vegada. |
| **`efemerides/YYYY-MM-DD.html`** | Una pàgina nova cada dia, indexable per Google, amb URL pròpia i permanent. Es regenera sencera a cada build. |
| **`efemerides/index.html`** | Llistat de l'arxiu; `build.mjs` reescriu tota la llista a partir de `data/efemerides.json` a cada build (ja no cal inserir l'entrada nova a mà ni amb el marcador antic). |

Cost total: **0 €/mes**. Tot corre amb els nivells gratuïts de GitHub
(Pages + Actions) i de l'API de Gemini (Google AI Studio).

## Com fer canvis ara (header, footer, favicon, metadades...)

Amb el sistema de plantilles, **ja no cal tocar cada pàgina una per
una**. El flux és sempre:

1. Edita el fitxer corresponent dins de `partials/` (per exemple,
   `partials/header.html` si vols canviar el menú).
2. Fes `git push`.
3. El workflow `build.yml` es dispara sol, executa `scripts/build.mjs`
   i publica el canvi a totes les pàgines — incloses totes les fitxes
   de l'arxiu, encara que n'hi hagi centenars.

Si vols provar el resultat abans de fer push, es pot executar
`node scripts/build.mjs` en local (cal tenir Node instal·lat).

**On afegir metadades noves (robots, og:tags, analítiques...):**
`partials/head-extra.html`. És l'únic lloc a tocar; es propaga a totes
les pàgines igual que el header i el footer.

**Important:** les pàgines finals (`index.html`, `avis-legal.html`,
`efemerides/*.html`) **no s'han d'editar directament** en la part del
header/footer/head-extra — qualsevol canvi fet a mà allà es
sobreescriurà al següent build. Els únics llocs "font" per a
aquestes parts són els fitxers dins de `partials/`.

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
  repositori — les execucions fallides surten en vermell. Ara hi ha
  dos workflows a vigilar: "Efemèride diària" i "Reconstruir web".
- **Forçar una execució manual de l'efemèride**: Actions → "Efemèride
  diària" → "Run workflow".
- **Forçar una reconstrucció manual** (per exemple, després d'editar
  un `partial` sense voler que esperi al push): Actions →
  "Reconstruir web" — de moment només es dispara amb `push`, no té
  `workflow_dispatch`; si es vol poder llançar a mà cal afegir-lo a
  `build.yml`.
- **Si Google torna a retirar el model** i torna a donar error 404/
  429: el més probable és que calgui revisar el nom del model o
  activar facturació al projecte de Google Cloud (veure secció
  anterior).
