// =============================================
// Menú mòbil
// =============================================
const menuToggle = document.getElementById('menuToggle');
const menuEnllacos = document.getElementById('menuEnllacos');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    menuEnllacos.classList.toggle('obert');
  });
}

// =============================================
// Slider / carrusel automàtic
// =============================================
const slider = document.querySelector('.slider');
const slides = document.querySelectorAll('.slider__slide');
const puntsContenidor = document.getElementById('sliderPunts');

let actual = 0;
const interval = slider ? parseInt(slider.dataset.interval, 10) || 5000 : 5000;
let timer;

// Crear els punts de navegació segons el nombre de diapositives
slides.forEach((_, i) => {
  const punt = document.createElement('button');
  punt.setAttribute('aria-label', 'Anar a la diapositiva ' + (i + 1));
  if (i === 0) punt.classList.add('actiu');
  punt.addEventListener('click', () => {
    mostrarSlide(i);
    reiniciarTemporitzador();
  });
  puntsContenidor.appendChild(punt);
});

const punts = document.querySelectorAll('.slider__punts button');

function mostrarSlide(index) {
  slides[actual].classList.remove('actiu');
  punts[actual].classList.remove('actiu');

  actual = index;

  slides[actual].classList.add('actiu');
  punts[actual].classList.add('actiu');
}

function seguentSlide() {
  const seguent = (actual + 1) % slides.length;
  mostrarSlide(seguent);
}

function reiniciarTemporitzador() {
  clearInterval(timer);
  timer = setInterval(seguentSlide, interval);
}

if (slides.length > 0) {
  reiniciarTemporitzador();
}

// =============================================
// Efemèride del dia ("Sabies que...?")
// -----------------------------------------------
// Les dades ara es carreguen des de data/efemerides.json, que es
// regenera automàticament un cop al dia mitjançant un GitHub Action
// (.github/workflows/efemeride-diaria.yml) que crida l'API de Gemini
// amb cerca web activada.
//
// Format de cada entrada al JSON:
// { categoria, any, titol, text, fonts: [{ nom, url }], data? }
// El camp "data" (YYYY-MM-DD) només existeix a les entrades generades
// automàticament; les entrades de llavor/exemple no en tenen i es fan
// servir com a reserva (fallback) si encara no s'ha executat cap
// generació.
//
// NOTA: com que fem servir fetch(), aquesta secció requereix que el
// web es serveixi per http(s) (GitHub Pages, un servidor local, etc.);
// no funcionarà obrint l'index.html directament amb file://.
// =============================================

function dataAvuiISO() {
  const avui = new Date();
  const any = avui.getFullYear();
  const mes = String(avui.getMonth() + 1).padStart(2, '0');
  const dia = String(avui.getDate()).padStart(2, '0');
  return `${any}-${mes}-${dia}`;
}

// Identificador de categoria (entrades noves, bilingües) -> etiqueta
// visible en cada idioma. Ha de coincidir amb el mateix mapa que hi ha
// a scripts/generar-efemeride.mjs. Les entrades antigues (anteriors al
// suport bilingüe) ja porten l'etiqueta directament a "categoria" i no
// una d'aquestes claus; per això, si "categoria" no és cap d'aquestes
// claus, es mostra tal qual (només existeix en català).
const CATEGORIES = {
  "curiositat-tecnica": { ca: "Curiositat tècnica", es: "Curiosidad técnica" },
  "historia-maquinaria": { ca: "Història de la maquinària", es: "Historia de la maquinaria" },
  "dada-curiosa": { ca: "Dada curiosa", es: "Dato curioso" },
};

// Idioma d'aquesta pàgina concreta: el determina l'atribut lang de
// <html> (cada pàgina és estàtica en un sol idioma; ja no hi ha botó
// de canvi en calent). Per defecte, català.
const IDIOMA_PAGINA = document.documentElement.lang === "es" ? "es" : "ca";

function triarEntradaDelDia(historial) {
  if (!Array.isArray(historial) || historial.length === 0) return null;

  const avuiISO = dataAvuiISO();

  // 1. Si hi ha una entrada generada exactament avui, és la que toca
  const deAvui = historial.find((e) => e.data === avuiISO);
  if (deAvui) return deAvui;

  // 2. Si no, però ja hi ha entrades generades (amb camp "data"),
  //    mostrem la més recent (per si el GitHub Action encara no
  //    s'ha executat avui, p. ex. fa pocs minuts que és mitjanit).
  const generades = historial.filter((e) => e.data);
  if (generades.length > 0) {
    generades.sort((a, b) => (a.data < b.data ? 1 : -1));
    return generades[0];
  }

  // 3. Si encara no s'ha generat mai cap entrada (p. ex. abans de la
  //    primera execució del workflow), rotem entre les d'exemple
  //    segons el dia de l'any, com feia la versió de demo.
  const avui = new Date();
  const inici = new Date(avui.getFullYear(), 0, 0);
  const diesTranscorreguts = Math.floor((avui - inici) / (1000 * 60 * 60 * 24));
  return historial[diesTranscorreguts % historial.length];
}

function pintarEfemeride(entrada) {
  const avui = new Date();
  const localeData = IDIOMA_PAGINA === 'es' ? 'es-ES' : 'ca-ES';
  const dataFormatada = avui.toLocaleDateString(localeData, {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Entrades noves: { ca: "...", es: "..." }. Entrades antigues
  // (anteriors al suport bilingüe): string pla, només en català.
  const titol = typeof entrada.titol === 'object' ? (entrada.titol[IDIOMA_PAGINA] || entrada.titol.ca) : entrada.titol;
  const text = typeof entrada.text === 'object' ? (entrada.text[IDIOMA_PAGINA] || entrada.text.ca) : entrada.text;
  const categoria = CATEGORIES[entrada.categoria]
    ? CATEGORIES[entrada.categoria][IDIOMA_PAGINA]
    : entrada.categoria; // entrada antiga: l'etiqueta ja ve feta, sense traducció

  document.getElementById('efemerideData').textContent = dataFormatada;
  document.getElementById('efemerideCategoria').textContent = categoria;

  const titolAny = entrada.any && entrada.any !== "avui"
    ? `${titol} (${entrada.any})`
    : titol;
  document.getElementById('efemerideTitol').textContent = titolAny;
  document.getElementById('efemerideText').textContent = text;

  const fontsEl = document.getElementById('efemerideFonts');
  if (fontsEl) {
    fontsEl.innerHTML = '';
    if (entrada.fonts && entrada.fonts.length > 0) {
      fontsEl.appendChild(document.createTextNode(IDIOMA_PAGINA === 'es' ? 'Fuente: ' : 'Font: '));
      entrada.fonts.forEach((f, i) => {
        if (i > 0) fontsEl.appendChild(document.createTextNode(' · '));
        if (f.url) {
          const enllac = document.createElement('a');
          enllac.href = f.url;
          enllac.target = '_blank';
          enllac.rel = 'noopener';
          enllac.textContent = f.nom;
          fontsEl.appendChild(enllac);
        } else {
          fontsEl.appendChild(document.createTextNode(f.nom));
        }
      });
    }
  }
}

async function inicialitzarEfemeride() {
  const contenidor = document.getElementById('efemerideCard');
  if (!contenidor) return;

  try {
    // Calculem la ruta a partir d'on està script.js (no d'on està la
    // pàgina): així funciona igual des de l'arrel, des de /es/, des de
    // /efemerides/ o des de /es/efemerides/, sense haver de mantenir
    // rutes relatives diferents a cada plantilla.
    const rutaDades = new URL('data/efemerides.json', document.currentScript.src).href;
    const resposta = await fetch(rutaDades, { cache: 'no-store' });
    if (!resposta.ok) throw new Error('No s\'ha pogut carregar data/efemerides.json');
    const historial = await resposta.json();

    const entrada = triarEntradaDelDia(historial);
    if (!entrada) throw new Error('El fitxer de dades és buit.');

    pintarEfemeride(entrada);
  } catch (err) {
    console.error('Error carregant l\'efemèride del dia:', err);
    // Amaguem la targeta en lloc de mostrar-la buida
    contenidor.style.display = 'none';
  }
}

inicialitzarEfemeride();

// =============================================
// Any actual al footer
// =============================================
const anyActual = document.getElementById('anyActual');
if (anyActual) {
  anyActual.textContent = new Date().getFullYear();
}

// =============================================
// Animació d'entrada de les targetes de Serveis
// =============================================
const serveis = document.querySelectorAll('.servei');

if (serveis.length > 0) {
  const observador = new IntersectionObserver((entrades) => {
    entrades.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target); // només un cop
      }
    });
  }, { threshold: 0.3 });

  serveis.forEach((servei) => observador.observe(servei));
}
// =============================================
// Mapa de contacte: no carrega cookies de Google
// fins que l'usuari fa clic explícitament
// =============================================
const mapaAcceptar = document.getElementById('mapaAcceptar');
if (mapaAcceptar) {
  mapaAcceptar.addEventListener('click', () => {
    document.getElementById('mapaAvis').outerHTML = `
    <iframe
    src="https://www.google.com/maps?q=Avgda+Catalunya+14,+43750+Flix&output=embed"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
    title="Ubicació de Trans-Català Rodes S.L.">
   </iframe>`;
  });
}