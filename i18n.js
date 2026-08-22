// =============================================================
// Sistema de traducció CA/ES del text FIX del web (menú, footer,
// "qui som", "serveis"...). Cada element traduïble porta l'atribut
// data-i18n="clau" al HTML; aquest script li assigna el text segons
// l'idioma actiu.
//
// IMPORTANT: això NOMÉS tradueix el text fix. El contingut de
// "Sabies que...?" (generat cada dia per Gemini, dins
// data/efemerides.json) es tracta a part — encara no està cobert
// per aquest sistema.
//
// L'idioma triat es desa a localStorage (clau "idioma") perquè es
// recordi en canviar de pàgina i en properes visites. Per defecte,
// si l'usuari no ha triat mai, es mostra en català.
// =============================================================

const TRADUCCIONS = {
  ca: {
    "menu.inici": "Inici",
    "menu.qui-som": "Qui som",
    "menu.sabies": "Sabies que...?",
    "menu.serveis": "Serveis",
    "menu.contacta": "Contacta'ns",
    "footer.contacte": "Contacte",
    "footer.enllacos": "Enllaços",
    "footer.avis-legal": "Avís legal",
    "footer.mapa-avis": "Al clicar acceptes cookies de Google Maps.",
    "footer.mapa-boto": "Veure el mapa",
    "footer.drets": "Tots els drets reservats",
    "quisom.titol": "Qui som",
    "quisom.subtitol": "Empresa familiar amb més de dos dècades d'experiència, compromís i servei des de Flix",
    "quisom.text": "A Trans Català Rodes SL som una empresa familiar fundada l'any 2000 a Flix (Ribera d'Ebre). Des dels nostres inicis, fa més de 25 anys, hem mantingut ferms els valors que ens van vore nàixer: el tracte proper, la serietat en cada projecte i la vocació de donar solucions eficients i adaptades a les necessitats reals dels nostres clients. Al llarg d'aquests anys, a Trans Català Rodes SL hem sabut evolucionar paral·lelament a les exigències del mercat i de les normatives ambientals. Els nostres orígens estan estretament vinculats al transport de material de construcció i servei a la indústria, actualment també ens hem especialitzat de manera destacada en la gestió i transport de residus. Entenem la gestió de residus no només com un servei logístic, sinó com un compromís ferm amb el nostre entorn. Treballem rigorosament per garantir que la recollida, el transport i el posterior tractament de les restes d'obra, residus banals o voluminosos es realitza d'acord amb la normativa vigent i els gestors autoritzats, promovent la sostenibilitat i el respecte pel medi ambient.",
    "serveis.titol": "Serveis",
    "serveis.subtitol": "Solucions de transport i camió grua adaptades a cada feina",
    "serveis.residus.titol": "Transport i gestió de residus",
    "serveis.residus.text": "Oferim solucions per a la recollida i gestió de residus no perillosos i de construcció. Comptem amb contenidors de diferents cubicatges i maquinària especialitzada per un transport segur i eficient. Complim estrictament amb totes les normatives mediambientals vigents, per garantir un correcte tractament dels diferents residus. Ens comprometem a una gestió responsable, ràpida i personalitzada adaptada a qualsevol necessitat.",
    "serveis.carregues.titol": "Transport de mercaderies",
    "serveis.carregues.text": "Som especialistes en el moviment i transport de mercaderies de diferents volums i pesos. Disposem de vehicles d'alta capacitat i equips homologats per assegurar la màxima protecció de la càrrega. Planifiquem cada ruta detalladament, gestionant els permisos i la logística necessària per a un servei eficient. Confia en la nostra experiència per traslladar la teva maquinària i materials pesats de forma ràpida i segura.",
    "serveis.altura.titol": "Serveis de grua en alçada",
    "serveis.altura.text": "Proporcionem serveis de grua, elevació de càrregues i maniobres complexes. Equipats amb braç i cavestants operats per personal amb gran experiència, altament qualificat i amb certificat. Oferim solucions a mida per a projectes de construcció, instal·lacions industrials i treballs d'alta dificultat. Prioritzem la seguretat operacional i la precisió en cada moviment per garantir un resultat impecable.",
    "slider.1.eyebrow": "Trans-Català Rodes S.L.",
    "slider.1.titol": "Transport i serveis de camió grua",
    "slider.1.text": "Vehicles versàtils i de gran capacitat, ideals tant per al transport com per a la descàrrega i manipulació de materials pesats o de difícil accés en obres i terrenys complexos.",
    "slider.1.boto": "Parla amb nosaltres",
    "slider.2.eyebrow": "Gestió de residus",
    "slider.2.titol": "Retirada i gestió de residus",
    "slider.2.text": "Disposem d'un ampli parc de contenidors per a la recollida de residus no perillosos i runa, adaptats a les diferents tipoligies de materials.",
    "slider.veure-serveis": "Veure serveis",
    "slider.3.eyebrow": "Transport nacional de mercaderies",
    "slider.3.titol": "Càrregues voluminoses i pesades",
    "slider.3.text": "Oferim un servei especialitzat en el transport de tot tipus de mercaderies, volumètriques i de gran tonatge.",
    "slider.4.eyebrow": "Serveis de camió amb grua",
    "slider.4.titol": "Elevació i col·locació en alçada",
    "slider.4.text": "Mitjançant els nostres camions ploma autocargants, maniobrem fàcilment en alçada per col·laborar en el muntatge i entrega de tot tipus de materials.",
    "slider.5.eyebrow": "La nostra flota",
    "slider.5.titol": "Vehicles preparats per a cada feina",
    "slider.5.text": "Per respondre amb rapidesa, seguretat i eficàcia a qualsevol repte logístic, comptem amb un parc mòbil i maquinària pròpia adaptats a les diferents necessitats del nostre territori:",
    "cta.titol": "Per què triar Trans Català Rodes SL?",
    "cta.1.label": "Experiència i professionalitat des de l'any 2000:",
    "cta.1.text": "Més de 25 anys d'ofici ens avalen. Sabem com resoldre qualsevol necessitat de transport, servei grua autocargant i gestió de residus amb la màxima eficiència.",
    "cta.2.label": "Servei integral:",
    "cta.2.text": "Oferim una solució completa que va des de transport amb camió ploma, fins al lloguer de contenidors i la gestió dels residus.",
    "cta.3.label": "Tracte humà i de confiança:",
    "cta.3.text": "Com a empresa familiar, el tracte directe, l'honestedat i la proximitat amb el client són la nostra filosofia de treball.",
    "cta.4.label": "Compromís ambiental:",
    "cta.4.text": "Aportem solucions responsables per al tractament adequat de la runa i els residus vanals i/o voluminosos, contribuint a un futur més sostenible per al nostre territori.",
    "cta.5.text": "A Trans Català Rodes SL continuem treballant dia a dia amb la mateixa il·lusió, combinant l'experiència acumulada durant dècades amb la modernització constant del nostre equip i serveis.",
    "legal.titol": "Avís legal, privacitat i cookies",
    "legal.actualitzat": "Última actualització:",
    "legal.index.titol": "Contingut d'aquesta pàgina",
    "legal.index.1": "Avís legal",
    "legal.index.2": "Política de privacitat",
    "legal.index.3": "Política de cookies",
    "legal.1.titol": "1. Avís legal",
    "legal.1.1.titol": "1.1. Dades identificatives",
    "legal.1.1.text": "En compliment del deure d'informació que estableix l'article 10 de la Llei 34/2002, d'11 de juliol, de Serveis de la Societat de la Informació i de Comerç Electrònic (LSSI-CE), s'exposen a continuació les dades identificatives de l'empresa titular d'aquest lloc web:",
    "legal.1.1.label1": "Denominació social:",
    "legal.1.1.label2": "NIF/CIF:",
    "legal.1.1.label3": "Domicili social:",
    "legal.1.1.label4": "Dades registrals:",
    "legal.1.1.label5": "Telèfon:",
    "legal.1.1.label6": "Correu electrònic:",
    "legal.1.1.label7": "Lloc web:",
    "legal.1.2.titol": "1.2. Objecte i àmbit d'aplicació",
    "legal.1.2.text": "Aquest avís legal regula l'ús del lloc web (d'ara endavant, \"el Lloc Web\") que Trans-Català Rodes S.L. (d'ara endavant, \"l'Empresa\") posa a disposició dels usuaris d'Internet amb la finalitat de donar a conèixer els seus serveis de transport, gestió de residus i camió grua. L'accés i la navegació pel Lloc Web impliquen l'acceptació d'aquest avís legal.",
    "legal.1.3.titol": "1.3. Condicions d'ús",
    "legal.1.3.text": "L'usuari es compromet a fer un ús adequat i lícit del Lloc Web, d'acord amb la legislació vigent, la bona fe, l'ordre públic i aquest avís legal. Queda expressament prohibit:",
    "legal.1.3.li1": "Fer un ús del Lloc Web que pugui ser contrari a la llei, a la moral o a l'ordre públic.",
    "legal.1.3.li2": "Reproduir, distribuir o modificar total o parcialment els continguts del Lloc Web sense autorització expressa de l'Empresa.",
    "legal.1.3.li3": "Introduir o difondre virus informàtics o qualsevol altre sistema que pugui causar danys al Lloc Web o a tercers.",
    "legal.1.4.titol": "1.4. Propietat intel·lectual i industrial",
    "legal.1.4.text": "Tots els continguts del Lloc Web —textos, imatges, logotips, dissenys i codi font, entre d'altres— són propietat de l'Empresa o de tercers que n'han autoritzat l'ús, i estan protegits per la normativa de propietat intel·lectual i industrial. Queda prohibida la seva reproducció, distribució o comunicació pública sense autorització prèvia i per escrit.",
    "legal.1.5.titol": "1.5. Exclusió de responsabilitat",
    "legal.1.5.text1": "L'Empresa no es fa responsable de les interrupcions del servei, errors de connexió, absència de disponibilitat o fallades en l'accés al Lloc Web derivats de causes alienes al seu control. Tampoc es fa responsable dels danys que puguin derivar-se de l'ús incorrecte del Lloc Web per part de l'usuari.",
    "legal.1.5.text2": "La secció \"Sabies que...?\" es genera de manera automàtica mitjançant intel·ligència artificial, amb revisió humana periòdica però no necessàriament prèvia a cada publicació. El seu contingut té una finalitat merament divulgativa i no constitueix assessorament tècnic, legal ni de cap altre tipus.",
    "legal.1.6.titol": "1.6. Enllaços a tercers",
    "legal.1.6.text": "El Lloc Web pot contenir enllaços a pàgines web de tercers (com Google Maps). L'Empresa no assumeix cap responsabilitat pel contingut, funcionament o polítiques de privacitat d'aquests llocs externs.",
    "legal.1.7.titol": "1.7. Legislació aplicable i jurisdicció",
    "legal.1.7.text": "Aquest avís legal es regeix per la legislació espanyola. Per a la resolució de qualsevol controvèrsia derivada de l'accés o l'ús d'aquest Lloc Web, les parts se sotmeten als jutjats i tribunals del domicili de l'Empresa, llevat que la normativa de consumidors i usuaris estableixi un altre fur imperatiu.",
    "legal.2.titol": "2. Política de privacitat",
    "legal.2.avis": "Aquest lloc web, en el seu estat actual, no incorpora formularis de contacte ni sistemes de registre d'usuaris: les úniques vies de contacte són el telèfon i el correu electrònic indicats a la pàgina. Aquesta política s'aplica igualment a aquestes vies i quedarà ampliada si en el futur s'afegeixen formularis web.",
    "legal.2.1.titol": "2.1. Responsable del tractament",
    "legal.2.1.text": "El responsable del tractament de les dades personals que ens faciliteu per telèfon o correu electrònic és Trans-Català Rodes S.L., amb domicili a Avgda Catalunya, nº 14, 43750 Flix (Tarragona), i adreça de contacte",
    "legal.2.2.titol": "2.2. Finalitat del tractament",
    "legal.2.2.text": "Les dades que ens faciliteu (nom, telèfon, correu electrònic i qualsevol informació inclosa al vostre missatge) s'utilitzen únicament per gestionar la vostra sol·licitud d'informació o pressupost i per respondre-us.",
    "legal.2.3.titol": "2.3. Base legal",
    "legal.2.3.text": "La base legal per al tractament és el consentiment de la persona interessada, que s'entén atorgat en el moment de contactar-nos voluntàriament per telèfon o correu electrònic, i/o l'execució d'un possible contracte o relació precontractual de prestació de serveis de transport.",
    "legal.2.4.titol": "2.4. Conservació de les dades",
    "legal.2.4.text": "Les dades es conservaran durant el temps necessari per atendre la sol·licitud i, posteriorment, durant els terminis legals de prescripció de responsabilitats que puguin derivar-se de la relació comercial.",
    "legal.2.5.titol": "2.5. Cessió a tercers",
    "legal.2.5.text": "No es cedeixen dades a tercers, excepte obligació legal o quan sigui estrictament necessari per a la prestació del servei sol·licitat (per exemple, proveïdors logístics implicats en el transport).",
    "legal.2.6.titol": "2.6. Drets de la persona interessada",
    "legal.2.6.text1": "Podeu exercir els vostres drets d'accés, rectificació, supressió, oposició, limitació del tractament i portabilitat de les dades enviant un correu a",
    "legal.2.6.text2": "indicant el dret que voleu exercir i adjuntant una còpia d'un document identificatiu. També teniu dret a presentar una reclamació davant l'Agència Espanyola de Protecció de Dades (",
    "legal.2.6.text3": ") si considereu que el tractament de les vostres dades no s'ajusta a la normativa vigent.",
    "legal.3.titol": "3. Política de cookies",
    "legal.3.1.titol": "3.1. Què és una cookie",
    "legal.3.1.text": "Una cookie és un petit fitxer de text que un lloc web desa al vostre navegador quan el visiteu, i que permet, entre altres coses, recordar preferències o mesurar l'ús del lloc.",
    "legal.3.2.titol": "3.2. Cookies utilitzades en aquest lloc web",
    "legal.3.2.text1": "Aquest lloc web no instal·la cookies pròpies ni de tercers de manera automàtica en carregar la pàgina. L'única excepció és el mapa de la secció de contacte: les cookies de Google Maps només es carreguen si feu clic voluntàriament al botó \"Veure el mapa\"; fins llavors, el mapa no es mostra ni es contacta amb els servidors de Google.",
    "legal.3.2.text2": "Si feu clic en aquest botó, Google podrà instal·lar les seves pròpies cookies d'acord amb la seva política de privacitat, que podeu consultar a",
    "legal.3.2.text3": "Aquest lloc web no té control sobre aquestes cookies de tercers.",
    "legal.3.3.titol": "3.3. Com desactivar o eliminar les cookies",
    "legal.3.3.text": "Podeu permetre, bloquejar o eliminar les cookies instal·lades al vostre equip mitjançant la configuració de les opcions del navegador que feu servir (Chrome, Firefox, Safari, Edge, etc.).",
  },
  es: {
    "menu.inici": "Inicio",
    "menu.qui-som": "Quiénes somos",
    "menu.sabies": "¿Sabías que...?",
    "menu.serveis": "Servicios",
    "menu.contacta": "Contáctanos",
    "footer.contacte": "Contacto",
    "footer.enllacos": "Enlaces",
    "footer.avis-legal": "Aviso legal",
    "footer.mapa-avis": "Al hacer clic aceptas cookies de Google Maps.",
    "footer.mapa-boto": "Ver el mapa",
    "footer.drets": "Todos los derechos reservados",
    "quisom.titol": "Quiénes somos",
    "quisom.subtitol": "Empresa familiar con más de dos décadas de experiencia, compromiso y servicio desde Flix",
    "quisom.text": "En Trans Català Rodes SL somos una empresa familiar fundada en el año 2000 en Flix (Ribera d'Ebre). Desde nuestros inicios, hace más de 25 años, hemos mantenido firmes los valores que nos vieron nacer: el trato cercano, la seriedad en cada proyecto y la vocación de dar soluciones eficientes y adaptadas a las necesidades reales de nuestros clientes. A lo largo de estos años, en Trans Català Rodes SL hemos sabido evolucionar paralelamente a las exigencias del mercado y de la normativa ambiental. Nuestros orígenes están estrechamente vinculados al transporte de material de construcción y servicio a la industria; actualmente también nos hemos especializado de forma destacada en la gestión y transporte de residuos. Entendemos la gestión de residuos no solo como un servicio logístico, sino como un compromiso firme con nuestro entorno. Trabajamos rigurosamente para garantizar que la recogida, el transporte y el posterior tratamiento de los restos de obra, residuos banales o voluminosos se realiza de acuerdo con la normativa vigente y los gestores autorizados, promoviendo la sostenibilidad y el respeto por el medio ambiente.",
    "serveis.titol": "Servicios",
    "serveis.subtitol": "Soluciones de transporte y camión grúa adaptadas a cada trabajo",
    "serveis.residus.titol": "Transporte y gestión de residuos",
    "serveis.residus.text": "Ofrecemos soluciones para la recogida y gestión de residuos no peligrosos y de construcción. Contamos con contenedores de diferentes capacidades y maquinaria especializada para un transporte seguro y eficiente. Cumplimos estrictamente con toda la normativa medioambiental vigente, para garantizar un correcto tratamiento de los diferentes residuos. Nos comprometemos a una gestión responsable, rápida y personalizada adaptada a cualquier necesidad.",
    "serveis.carregues.titol": "Transporte de mercancías",
    "serveis.carregues.text": "Somos especialistas en el movimiento y transporte de mercancías de diferentes volúmenes y pesos. Disponemos de vehículos de alta capacidad y equipos homologados para asegurar la máxima protección de la carga. Planificamos cada ruta detalladamente, gestionando los permisos y la logística necesaria para un servicio eficiente. Confía en nuestra experiencia para trasladar tu maquinaria y materiales pesados de forma rápida y segura.",
    "serveis.altura.titol": "Servicios de grúa en altura",
    "serveis.altura.text": "Proporcionamos servicios de grúa, elevación de cargas y maniobras complejas. Equipados con brazo y cabrestantes operados por personal con gran experiencia, altamente cualificado y con certificado. Ofrecemos soluciones a medida para proyectos de construcción, instalaciones industriales y trabajos de alta dificultad. Priorizamos la seguridad operacional y la precisión en cada movimiento para garantizar un resultado impecable.",
    "slider.1.eyebrow": "Trans-Català Rodes S.L.",
    "slider.1.titol": "Transporte y servicios de camión grúa",
    "slider.1.text": "Vehículos versátiles y de gran capacidad, ideales tanto para el transporte como para la descarga y manipulación de materiales pesados o de difícil acceso en obras y terrenos complejos.",
    "slider.1.boto": "Habla con nosotros",
    "slider.2.eyebrow": "Gestión de residuos",
    "slider.2.titol": "Retirada y gestión de residuos",
    "slider.2.text": "Disponemos de un amplio parque de contenedores para la recogida de residuos no peligrosos y escombros, adaptados a los diferentes tipos de materiales.",
    "slider.veure-serveis": "Ver servicios",
    "slider.3.eyebrow": "Transporte nacional de mercancías",
    "slider.3.titol": "Cargas voluminosas y pesadas",
    "slider.3.text": "Ofrecemos un servicio especializado en el transporte de todo tipo de mercancías, volumétricas y de gran tonelaje.",
    "slider.4.eyebrow": "Servicios de camión con grúa",
    "slider.4.titol": "Elevación y colocación en altura",
    "slider.4.text": "Mediante nuestros camiones pluma autocargantes, maniobramos fácilmente en altura para colaborar en el montaje y entrega de todo tipo de materiales.",
    "slider.5.eyebrow": "Nuestra flota",
    "slider.5.titol": "Vehículos preparados para cada trabajo",
    "slider.5.text": "Para responder con rapidez, seguridad y eficacia a cualquier reto logístico, contamos con un parque móvil y maquinaria propia adaptados a las diferentes necesidades de nuestro territorio:",
    "cta.titol": "¿Por qué elegir Trans Català Rodes SL?",
    "cta.1.label": "Experiencia y profesionalidad desde el año 2000:",
    "cta.1.text": "Más de 25 años de oficio nos avalan. Sabemos cómo resolver cualquier necesidad de transporte, servicio grúa autocargante y gestión de residuos con la máxima eficiencia.",
    "cta.2.label": "Servicio integral:",
    "cta.2.text": "Ofrecemos una solución completa que va desde el transporte con camión pluma, hasta el alquiler de contenedores y la gestión de los residuos.",
    "cta.3.label": "Trato humano y de confianza:",
    "cta.3.text": "Como empresa familiar, el trato directo, la honestidad y la cercanía con el cliente son nuestra filosofía de trabajo.",
    "cta.4.label": "Compromiso ambiental:",
    "cta.4.text": "Aportamos soluciones responsables para el tratamiento adecuado de los escombros y los residuos banales y/o voluminosos, contribuyendo a un futuro más sostenible para nuestro territorio.",
    "cta.5.text": "En Trans Català Rodes SL seguimos trabajando día a día con la misma ilusión, combinando la experiencia acumulada durante décadas con la modernización constante de nuestro equipo y servicios.",
    "legal.titol": "Aviso legal, privacidad y cookies",
    "legal.actualitzat": "Última actualización:",
    "legal.index.titol": "Contenido de esta página",
    "legal.index.1": "Aviso legal",
    "legal.index.2": "Política de privacidad",
    "legal.index.3": "Política de cookies",
    "legal.1.titol": "1. Aviso legal",
    "legal.1.1.titol": "1.1. Datos identificativos",
    "legal.1.1.text": "En cumplimiento del deber de información que establece el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se exponen a continuación los datos identificativos de la empresa titular de este sitio web:",
    "legal.1.1.label1": "Denominación social:",
    "legal.1.1.label2": "NIF/CIF:",
    "legal.1.1.label3": "Domicilio social:",
    "legal.1.1.label4": "Datos registrales:",
    "legal.1.1.label5": "Teléfono:",
    "legal.1.1.label6": "Correo electrónico:",
    "legal.1.1.label7": "Sitio web:",
    "legal.1.2.titol": "1.2. Objeto y ámbito de aplicación",
    "legal.1.2.text": "Este aviso legal regula el uso del sitio web (en adelante, «el Sitio Web») que Trans-Català Rodes S.L. (en adelante, «la Empresa») pone a disposición de los usuarios de Internet con la finalidad de dar a conocer sus servicios de transporte, gestión de residuos y camión grúa. El acceso y la navegación por el Sitio Web implican la aceptación de este aviso legal.",
    "legal.1.3.titol": "1.3. Condiciones de uso",
    "legal.1.3.text": "El usuario se compromete a hacer un uso adecuado y lícito del Sitio Web, de acuerdo con la legislación vigente, la buena fe, el orden público y este aviso legal. Queda expresamente prohibido:",
    "legal.1.3.li1": "Hacer un uso del Sitio Web que pueda ser contrario a la ley, a la moral o al orden público.",
    "legal.1.3.li2": "Reproducir, distribuir o modificar total o parcialmente los contenidos del Sitio Web sin autorización expresa de la Empresa.",
    "legal.1.3.li3": "Introducir o difundir virus informáticos o cualquier otro sistema que pueda causar daños al Sitio Web o a terceros.",
    "legal.1.4.titol": "1.4. Propiedad intelectual e industrial",
    "legal.1.4.text": "Todos los contenidos del Sitio Web —textos, imágenes, logotipos, diseños y código fuente, entre otros— son propiedad de la Empresa o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o comunicación pública sin autorización previa y por escrito.",
    "legal.1.5.titol": "1.5. Exclusión de responsabilidad",
    "legal.1.5.text1": "La Empresa no se hace responsable de las interrupciones del servicio, errores de conexión, ausencia de disponibilidad o fallos en el acceso al Sitio Web derivados de causas ajenas a su control. Tampoco se hace responsable de los daños que puedan derivarse del uso incorrecto del Sitio Web por parte del usuario.",
    "legal.1.5.text2": "La sección \"¿Sabías que...?\" se genera de forma automática mediante inteligencia artificial, con revisión humana periódica pero no necesariamente previa a cada publicación. Su contenido tiene una finalidad meramente divulgativa y no constituye asesoramiento técnico, legal ni de ningún otro tipo.",
    "legal.1.6.titol": "1.6. Enlaces a terceros",
    "legal.1.6.text": "El Sitio Web puede contener enlaces a páginas web de terceros (como Google Maps). La Empresa no asume ninguna responsabilidad por el contenido, funcionamiento o políticas de privacidad de estos sitios externos.",
    "legal.1.7.titol": "1.7. Legislación aplicable y jurisdicción",
    "legal.1.7.text": "Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o el uso de este Sitio Web, las partes se someten a los juzgados y tribunales del domicilio de la Empresa, salvo que la normativa de consumidores y usuarios establezca otro fuero imperativo.",
    "legal.2.titol": "2. Política de privacidad",
    "legal.2.avis": "Este sitio web, en su estado actual, no incorpora formularios de contacto ni sistemas de registro de usuarios: las únicas vías de contacto son el teléfono y el correo electrónico indicados en la página. Esta política se aplica igualmente a estas vías y quedará ampliada si en el futuro se añaden formularios web.",
    "legal.2.1.titol": "2.1. Responsable del tratamiento",
    "legal.2.1.text": "El responsable del tratamiento de los datos personales que nos facilitéis por teléfono o correo electrónico es Trans-Català Rodes S.L., con domicilio en Avgda Catalunya, nº 14, 43750 Flix (Tarragona), y dirección de contacto",
    "legal.2.2.titol": "2.2. Finalidad del tratamiento",
    "legal.2.2.text": "Los datos que nos facilitéis (nombre, teléfono, correo electrónico y cualquier información incluida en vuestro mensaje) se utilizan únicamente para gestionar vuestra solicitud de información o presupuesto y para responderos.",
    "legal.2.3.titol": "2.3. Base legal",
    "legal.2.3.text": "La base legal para el tratamiento es el consentimiento de la persona interesada, que se entiende otorgado en el momento de contactarnos voluntariamente por teléfono o correo electrónico, y/o la ejecución de un posible contrato o relación precontractual de prestación de servicios de transporte.",
    "legal.2.4.titol": "2.4. Conservación de los datos",
    "legal.2.4.text": "Los datos se conservarán durante el tiempo necesario para atender la solicitud y, posteriormente, durante los plazos legales de prescripción de responsabilidades que puedan derivarse de la relación comercial.",
    "legal.2.5.titol": "2.5. Cesión a terceros",
    "legal.2.5.text": "No se ceden datos a terceros, salvo obligación legal o cuando sea estrictamente necesario para la prestación del servicio solicitado (por ejemplo, proveedores logísticos implicados en el transporte).",
    "legal.2.6.titol": "2.6. Derechos de la persona interesada",
    "legal.2.6.text1": "Podéis ejercer vuestros derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de los datos enviando un correo a",
    "legal.2.6.text2": "indicando el derecho que queréis ejercer y adjuntando una copia de un documento identificativo. También tenéis derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (",
    "legal.2.6.text3": ") si consideráis que el tratamiento de vuestros datos no se ajusta a la normativa vigente.",
    "legal.3.titol": "3. Política de cookies",
    "legal.3.1.titol": "3.1. Qué es una cookie",
    "legal.3.1.text": "Una cookie es un pequeño archivo de texto que un sitio web guarda en vuestro navegador cuando lo visitáis, y que permite, entre otras cosas, recordar preferencias o medir el uso del sitio.",
    "legal.3.2.titol": "3.2. Cookies utilizadas en este sitio web",
    "legal.3.2.text1": "Este sitio web no instala cookies propias ni de terceros de forma automática al cargar la página. La única excepción es el mapa de la sección de contacto: las cookies de Google Maps solo se cargan si hacéis clic voluntariamente en el botón \"Ver el mapa\"; hasta entonces, el mapa no se muestra ni se contacta con los servidores de Google.",
    "legal.3.2.text2": "Si hacéis clic en este botón, Google podrá instalar sus propias cookies de acuerdo con su política de privacidad, que podéis consultar en",
    "legal.3.2.text3": "Este sitio web no tiene control sobre estas cookies de terceros.",
    "legal.3.3.titol": "3.3. Cómo desactivar o eliminar las cookies",
    "legal.3.3.text": "Podéis permitir, bloquear o eliminar las cookies instaladas en vuestro equipo mediante la configuración de las opciones del navegador que utilicéis (Chrome, Firefox, Safari, Edge, etc.).",
  },
};

// Idioma actiu: el que hi ha desat, o català per defecte
function idiomaActual() {
  return localStorage.getItem("idioma") || "ca";
}

// Aplica el diccionari de l'idioma donat a tots els elements marcats
function aplicarTraduccions(idioma) {
  const diccionari = TRADUCCIONS[idioma] || TRADUCCIONS.ca;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const clau = element.getAttribute("data-i18n");
    if (diccionari[clau]) {
      element.textContent = diccionari[clau];
    }
  });

  document.documentElement.lang = idioma;

  // El botó mostra l'idioma AL QUAL es canviaria en tornar a prémer
  const boto = document.getElementById("idiomaToggle");
  if (boto) {
    boto.textContent = idioma === "ca" ? "ES" : "CA";
  }
}

// Alterna entre català i castellà i ho desa per a properes pàgines
function canviarIdioma() {
  const nou = idiomaActual() === "ca" ? "es" : "ca";
  localStorage.setItem("idioma", nou);
  aplicarTraduccions(nou);
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarTraduccions(idiomaActual());

  const boto = document.getElementById("idiomaToggle");
  if (boto) {
    boto.addEventListener("click", canviarIdioma);
  }
});
