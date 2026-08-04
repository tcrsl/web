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
// NOTA PER AL DESENVOLUPADOR / DEMO:
// Aquestes dades són d'EXEMPLE, escrites a mà, només per mostrar
// com es veurà el widget. En la versió final, aquest array es
// generarà automàticament (1 cop al dia, via IA amb cerca web) i
// es carregarà des d'un fitxer extern (per exemple data/efemerides.json).
// Aquí les tenim incrustades directament al JS perquè la demo
// funcioni obrint l'index.html sense servidor (evita problemes
// de CORS en local amb file://).
//
// NOMÉS 3 categories, totes de baix risc (sense normativa ni temes
// legals): curiositats tècniques, història de la maquinària i dades
// generals/curioses. Cada entrada porta un any de referència i les
// fonts són d'exemple/il·lustratives — en producció vindran d'una
// cerca web real feta per la IA abans de redactar el text.
// =============================================
const EFEMERIDES_EXEMPLE = [
  {
    categoria: "Història de la maquinària",
    any: "1952",
    titol: "El salt del cable a la hidràulica",
    text: "Els camions grua van passar de sistemes mecànics i de cables a la tecnologia hidràulica durant la dècada de 1950. El primer gran pas va arribar el 1952, amb la invenció de la grua hidràulica muntada a la part posterior d'un camió.",
    fonts: [{ nom: "Hiab — història de l'empresa", url: "https://www.hiab.com/en/about-us/our-history/" }]
  },
  {
    categoria: "Curiositat tècnica",
    any: "1956",
    titol: "El contenidor que va estandarditzar el transport",
    text: "El 1956, l'empresari Malcolm McLean va posar en marxa el primer transport marítim amb contenidors estandarditzats, una idea que després es va traslladar a camions i trens i que va abaratir dràsticament el transport de mercaderies a tot el món.",
    fonts: [{ nom: "World Shipping Council", url: "https://www.worldshipping.org/about-the-industry/history-of-containerization" }]
  },
  {
    categoria: "Dada curiosa",
    any: "1893",
    titol: "El motor que porta el nom del seu inventor",
    text: "El motor dièsel va ser patentat per l'enginyer alemany Rudolf Diesel l'any 1893. La seva eficiència respecte als motors de gasolina el va convertir, dècades més tard, en l'estàndard del transport pesat de mercaderies.",
    fonts: [{ nom: "Deutsches Museum", url: "https://www.deutsches-museum.de/en/" }]
  },
  {
    categoria: "Curiositat tècnica",
    any: "1919",
    titol: "El primer camió amb grua incorporada",
    text: "Els primers vehicles amb un braç de grua muntat sobre el propi camió van aparèixer després de la Primera Guerra Mundial, adaptant maquinària militar excedent per a tasques de càrrega i obra civil als anys 20.",
    fonts: [{ nom: "Historical Construction Equipment Association", url: "https://www.hcea.net/" }]
  },
  {
    categoria: "Història de la maquinària",
    any: "1954",
    titol: "Atlas i l'expansió de la grua a Europa",
    text: "A mitjans dels anys 50, fabricants com la sueca Hydrauliska Industrie AB (avui Hiab) i l'alemanya Atlas Weyhausen van popularitzar les grues hidràuliques muntades sobre camió arreu d'Europa, substituint els vells sistemes de politja.",
    fonts: [{ nom: "Atlas Weyhausen — arxiu històric", url: "https://www.atlas-weyhausen.de/en/company/history" }]
  },
  {
    categoria: "Dada curiosa",
    any: "1912",
    titol: "El primer semiremolc articulat",
    text: "El disseny de semiremolc articulat que encara s'utilitza avui —un remolc sense eix davanter que es recolza sobre la tractora— es va popularitzar a partir de la dècada de 1910 als Estats Units, per facilitar el transport de càrregues llargues.",
    fonts: [{ nom: "Smithsonian Institution", url: "https://americanhistory.si.edu/" }]
  },
  {
    categoria: "Dada curiosa",
    any: "1963",
    titol: "Quan es va estandarditzar el palet europeu",
    text: "El palet EUR de fusta, de 1200x800 mm, es va normalitzar el 1963 a partir d'un acord entre ferrocarrils europeus, i encara avui és la mida de referència que determina com es dissenyen caixes de camió i magatzems.",
    fonts: [{ nom: "European Pallet Association (EPAL)", url: "https://www.epal-pallets.org/eu-en/about-epal/history/" }]
  }
];

function inicialitzarEfemeride() {
  const contenidor = document.getElementById('efemerideCard');
  if (!contenidor) return;

  const avui = new Date();

  // Selecció determinista segons el dia de l'any: cada dia real
  // mostrarà una entrada diferent de la llista d'exemple, rotant
  // quan s'arriba al final. En producció, aquesta selecció ja no
  // caldrà: cada dia hi haurà una entrada nova generada per IA.
  const inici = new Date(avui.getFullYear(), 0, 0);
  const diesTranscorreguts = Math.floor((avui - inici) / (1000 * 60 * 60 * 24));
  const entrada = EFEMERIDES_EXEMPLE[diesTranscorreguts % EFEMERIDES_EXEMPLE.length];

  const dataFormatada = avui.toLocaleDateString('ca-ES', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  document.getElementById('efemerideData').textContent = dataFormatada;
  document.getElementById('efemerideCategoria').textContent = entrada.categoria;

  const titolAny = entrada.any && entrada.any !== "avui"
    ? `${entrada.titol} (${entrada.any})`
    : entrada.titol;
  document.getElementById('efemerideTitol').textContent = titolAny;
  document.getElementById('efemerideText').textContent = entrada.text;

  const fontsEl = document.getElementById('efemerideFonts');
  if (fontsEl) {
    fontsEl.innerHTML = '';
    if (entrada.fonts && entrada.fonts.length > 0) {
      fontsEl.appendChild(document.createTextNode('Font: '));
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