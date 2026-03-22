import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════════

const LESSONS = [
  {
    id: 1, day: "Day 1", title: "At the Coffee Shop",
    level: "B1", topic: "Ordering & Small Talk",
    dialogue: [
      { speaker: "Barista", text: "Hi there! What can I get for you today?" },
      { speaker: "You", text: "I'd like a flat white, please. Actually, make that a large one." },
      { speaker: "Barista", text: "Sure thing! Would you like anything to eat with that?" },
      { speaker: "You", text: "I'll grab a blueberry muffin as well, thanks." },
      { speaker: "Barista", text: "Great choice! That'll be six pounds fifty. Eating in or taking away?" },
      { speaker: "You", text: "I'll eat in. Could I also get the Wi-Fi password?" },
      { speaker: "Barista", text: "Of course! It's on the chalkboard by the door. Enjoy!" }
    ],
    vocabulary: [
      { word: "flat white", phonetic: "/flæt waɪt/", meaning: "café con leche suave de origen australiano", example: "I switched from lattes to flat whites last year." },
      { word: "grab", phonetic: "/ɡræb/", meaning: "coger, pillar (informal)", example: "Let me grab a sandwich before we go." },
      { word: "sure thing", phonetic: "/ʃʊr θɪŋ/", meaning: "¡claro que sí!, ¡por supuesto!", example: "Can you help me? — Sure thing!" },
      { word: "take away", phonetic: "/teɪk əˈweɪ/", meaning: "para llevar", example: "Is this for here or to take away?" },
      { word: "chalkboard", phonetic: "/ˈtʃɔːk.bɔːrd/", meaning: "pizarra de tiza", example: "The specials are written on the chalkboard." }
    ],
    expressions: [
      { phrase: "Make that a...", meaning: "Cambiar el pedido sobre la marcha", example: "I'll have a tea. Actually, make that a coffee." },
      { phrase: "That'll be...", meaning: "Fórmula para decir el precio total", example: "That'll be twelve euros, please." },
      { phrase: "Eating in or taking away?", meaning: "¿Para aquí o para llevar?", example: "Is your order eating in or taking away?" }
    ],
    grammar: {
      title: "Using 'I'd like' vs 'I want'",
      explanation: "'I'd like' (I would like) es más educado y natural en contextos de servicio. 'I want' suena más directo y puede parecer brusco.",
      examples: ["I'd like a coffee, please. ✓ (educado)", "I want a coffee. ✗ (demasiado directo)", "I'd like to order the chicken. ✓", "Could I have a glass of water? ✓ (alternativa educada)"]
    }
  },
  {
    id: 2, day: "Day 2", title: "Job Interview Basics",
    level: "B2", topic: "Professional Communication",
    dialogue: [
      { speaker: "Interviewer", text: "Tell me a bit about yourself and your background." },
      { speaker: "You", text: "I've been working in data analysis for about three years now." },
      { speaker: "Interviewer", text: "What would you say is your biggest strength?" },
      { speaker: "You", text: "I'd say I'm particularly good at breaking down complex problems into manageable steps." },
      { speaker: "Interviewer", text: "And where do you see yourself in five years?" },
      { speaker: "You", text: "I'd love to take on more leadership responsibilities and grow within the company." },
      { speaker: "Interviewer", text: "Excellent. Do you have any questions for us?" }
    ],
    vocabulary: [
      { word: "background", phonetic: "/ˈbæk.ɡraʊnd/", meaning: "formación, trayectoria", example: "She has a background in marketing." },
      { word: "strength", phonetic: "/streŋkθ/", meaning: "punto fuerte, fortaleza", example: "Communication is one of my key strengths." },
      { word: "break down", phonetic: "/breɪk daʊn/", meaning: "descomponer, desglosar", example: "Let's break down the project into phases." },
      { word: "manageable", phonetic: "/ˈmæn.ɪ.dʒə.bəl/", meaning: "manejable, abarcable", example: "The workload is challenging but manageable." },
      { word: "take on", phonetic: "/teɪk ɒn/", meaning: "asumir (responsabilidades)", example: "She took on extra duties last quarter." }
    ],
    expressions: [
      { phrase: "I'd say...", meaning: "Yo diría que... (suaviza la afirmación)", example: "I'd say the project is about 80% complete." },
      { phrase: "I'd love to...", meaning: "Me encantaría... (expresa deseo profesionalmente)", example: "I'd love to collaborate on that initiative." },
      { phrase: "Tell me a bit about...", meaning: "Cuéntame un poco sobre...", example: "Tell me a bit about your experience with Python." }
    ],
    grammar: {
      title: "Present Perfect for Experience",
      explanation: "Usamos el Present Perfect (have/has + past participle) para hablar de experiencia acumulada hasta ahora, sin especificar cuándo exactamente.",
      examples: ["I've been working here for three years. ✓", "I've managed teams of up to 10 people. ✓", "I worked here for three years. (implica que ya no)", "Have you ever led a project? ✓"]
    }
  },
  {
    id: 3, day: "Day 3", title: "Making Plans with Friends",
    level: "B1", topic: "Social English & Suggestions",
    dialogue: [
      { speaker: "Friend", text: "Hey! Fancy doing something this weekend?" },
      { speaker: "You", text: "Yeah, I'm up for it! What did you have in mind?" },
      { speaker: "Friend", text: "How about checking out that new Mexican place downtown?" },
      { speaker: "You", text: "Sounds great! What time works for you?" },
      { speaker: "Friend", text: "Shall we say Saturday around eight?" },
      { speaker: "You", text: "Perfect. I'll book a table just in case it's busy." },
      { speaker: "Friend", text: "Legend! See you there then." }
    ],
    vocabulary: [
      { word: "fancy", phonetic: "/ˈfæn.si/", meaning: "apetecer, tener ganas de (coloquial UK)", example: "Do you fancy a walk after lunch?" },
      { word: "up for it", phonetic: "/ʌp fɔːr ɪt/", meaning: "estar dispuesto, tener ganas", example: "I'm always up for trying new food." },
      { word: "check out", phonetic: "/tʃek aʊt/", meaning: "echar un vistazo, probar", example: "You should check out that new series on Netflix." },
      { word: "just in case", phonetic: "/dʒʌst ɪn keɪs/", meaning: "por si acaso", example: "Bring an umbrella just in case." },
      { word: "legend", phonetic: "/ˈledʒ.ənd/", meaning: "crack, leyenda (elogio informal UK)", example: "Thanks for helping me move — you're a legend!" }
    ],
    expressions: [
      { phrase: "What did you have in mind?", meaning: "¿Qué tenías pensado?", example: "We could go out. — What did you have in mind?" },
      { phrase: "How about...?", meaning: "¿Qué tal si...? (sugerencia)", example: "How about meeting at the park?" },
      { phrase: "Shall we say...?", meaning: "¿Quedamos en...? (proponer hora/lugar)", example: "Shall we say 7pm at the cinema?" }
    ],
    grammar: {
      title: "Making Suggestions: How about / Shall we / Fancy",
      explanation: "En inglés hay varias formas naturales de proponer planes. 'How about + -ing' y 'Fancy + -ing' son informales. 'Shall we...' es un poco más formal pero muy común.",
      examples: ["How about going to the beach? ✓", "Fancy grabbing a coffee? ✓ (muy británico)", "Shall we meet at noon? ✓", "Why don't we try that new place? ✓"]
    }
  },
  {
    id: 4, day: "Day 4", title: "At the Airport",
    level: "B1", topic: "Travel & Check-in",
    dialogue: [
      { speaker: "Staff", text: "Good morning! May I see your passport and booking reference, please?" },
      { speaker: "You", text: "Sure, here you go. I booked online — the reference is BK4729." },
      { speaker: "Staff", text: "Thank you. Would you like a window or an aisle seat?" },
      { speaker: "You", text: "An aisle seat, please. And could I check in this suitcase?" },
      { speaker: "Staff", text: "Of course. Please place it on the belt. It's within the weight limit." },
      { speaker: "You", text: "Great. What time does boarding start?" },
      { speaker: "Staff", text: "Boarding begins at 10:45 from gate B12. Have a pleasant flight!" }
    ],
    vocabulary: [
      { word: "booking reference", phonetic: "/ˈbʊk.ɪŋ ˌref.ər.əns/", meaning: "código/localizador de reserva", example: "Please have your booking reference ready at check-in." },
      { word: "aisle seat", phonetic: "/aɪl siːt/", meaning: "asiento de pasillo", example: "I prefer an aisle seat so I can stretch my legs." },
      { word: "check in", phonetic: "/tʃek ɪn/", meaning: "facturar (equipaje) / registrarse", example: "You can check in online 24 hours before the flight." },
      { word: "boarding", phonetic: "/ˈbɔː.dɪŋ/", meaning: "embarque", example: "Boarding will begin in approximately 20 minutes." },
      { word: "belt", phonetic: "/belt/", meaning: "cinta transportadora", example: "Place your luggage on the belt for scanning." }
    ],
    expressions: [
      { phrase: "Here you go", meaning: "Aquí tiene / Toma (al entregar algo)", example: "Can I see your ID? — Here you go." },
      { phrase: "Within the weight limit", meaning: "Dentro del límite de peso", example: "Your bag is within the weight limit, don't worry." },
      { phrase: "Have a pleasant flight!", meaning: "¡Que tenga un buen vuelo!", example: "Everything's ready. Have a pleasant flight!" }
    ],
    grammar: {
      title: "Polite Requests with 'Could I' and 'May I'",
      explanation: "'Could I...?' y 'May I...?' son formas educadas de pedir permiso o solicitar algo. 'May I' es más formal. 'Can I' es más informal pero aceptable.",
      examples: ["Could I have a window seat? ✓ (educado)", "May I see your passport? ✓ (muy formal)", "Can I check this bag? ✓ (informal)", "Could you tell me the gate number? ✓"]
    }
  },
  {
    id: 5, day: "Day 5", title: "At the Doctor's",
    level: "B2", topic: "Health & Symptoms",
    dialogue: [
      { speaker: "Doctor", text: "Hello! What seems to be the problem today?" },
      { speaker: "You", text: "I've been having a terrible headache for the past three days." },
      { speaker: "Doctor", text: "I see. Have you experienced any other symptoms? Fever, nausea?" },
      { speaker: "You", text: "I've felt a bit dizzy as well, especially in the mornings." },
      { speaker: "Doctor", text: "Have you been getting enough sleep? Any recent stress?" },
      { speaker: "You", text: "To be honest, I've been working overtime and not sleeping much." },
      { speaker: "Doctor", text: "That's likely the cause. I'll prescribe some pain relief and I'd recommend getting proper rest." }
    ],
    vocabulary: [
      { word: "headache", phonetic: "/ˈhed.eɪk/", meaning: "dolor de cabeza", example: "I always get a headache when I'm stressed." },
      { word: "dizzy", phonetic: "/ˈdɪz.i/", meaning: "mareado", example: "I felt dizzy after standing up too quickly." },
      { word: "symptoms", phonetic: "/ˈsɪmp.təmz/", meaning: "síntomas", example: "What symptoms have you been experiencing?" },
      { word: "prescribe", phonetic: "/prɪˈskraɪb/", meaning: "recetar", example: "The doctor prescribed antibiotics for the infection." },
      { word: "overtime", phonetic: "/ˈəʊ.və.taɪm/", meaning: "horas extra", example: "I've been working overtime to meet the deadline." }
    ],
    expressions: [
      { phrase: "What seems to be the problem?", meaning: "¿Cuál parece ser el problema? (fórmula médica)", example: "Good morning, what seems to be the problem?" },
      { phrase: "To be honest...", meaning: "Para ser sincero/a...", example: "To be honest, I haven't been taking care of myself." },
      { phrase: "I'd recommend...", meaning: "Le recomendaría... (consejo profesional)", example: "I'd recommend cutting down on caffeine." }
    ],
    grammar: {
      title: "Present Perfect Continuous for Recent Duration",
      explanation: "Usamos 'have/has been + -ing' para hablar de algo que empezó en el pasado y sigue hasta ahora, enfatizando la duración.",
      examples: ["I've been having headaches for three days. ✓", "She's been feeling unwell since Monday. ✓", "Have you been sleeping well lately? ✓", "I've been working too much. ✓"]
    }
  },
  {
    id: 6, day: "Day 6", title: "Shopping for Clothes",
    level: "B1", topic: "Shops & Sizes",
    dialogue: [
      { speaker: "Assistant", text: "Hi! Can I help you find anything?" },
      { speaker: "You", text: "Yes, I'm looking for a jacket. Something smart but casual." },
      { speaker: "Assistant", text: "We've got some lovely ones over here. What size are you?" },
      { speaker: "You", text: "I'm usually a medium. Could I try this navy one on?" },
      { speaker: "Assistant", text: "Of course! The fitting rooms are just around the corner." },
      { speaker: "You", text: "It fits perfectly! How much is it?" },
      { speaker: "Assistant", text: "It's on sale — forty-five pounds, down from seventy. Shall I ring that up for you?" }
    ],
    vocabulary: [
      { word: "smart casual", phonetic: "/smɑːt ˈkæʒ.u.əl/", meaning: "elegante pero informal", example: "The dress code for the party is smart casual." },
      { word: "try on", phonetic: "/traɪ ɒn/", meaning: "probarse (ropa)", example: "Can I try on this dress in a smaller size?" },
      { word: "fitting room", phonetic: "/ˈfɪt.ɪŋ ruːm/", meaning: "probador", example: "The fitting rooms are at the back of the store." },
      { word: "on sale", phonetic: "/ɒn seɪl/", meaning: "en rebajas, de oferta", example: "These shoes are on sale — half price!" },
      { word: "ring up", phonetic: "/rɪŋ ʌp/", meaning: "cobrar, pasar por caja", example: "Shall I ring that up for you?" }
    ],
    expressions: [
      { phrase: "I'm looking for...", meaning: "Estoy buscando...", example: "I'm looking for a gift for my sister." },
      { phrase: "It fits perfectly!", meaning: "¡Me queda perfecto!", example: "Try the smaller size — it fits perfectly!" },
      { phrase: "Down from...", meaning: "Rebajado de... (precio original)", example: "It's thirty pounds, down from fifty." }
    ],
    grammar: {
      title: "Adjective Order in English",
      explanation: "En inglés, los adjetivos siguen un orden fijo: opinión → tamaño → color → material → sustantivo. No necesitas memorizarlo, pero suena más natural.",
      examples: ["A lovely navy jacket ✓ (opinión + color)", "A big brown leather bag ✓ (tamaño + color + material)", "A navy lovely jacket ✗ (suena raro)", "Smart casual clothes ✓"]
    }
  },
  {
    id: 7, day: "Day 7", title: "Asking for Directions",
    level: "B1", topic: "Navigation & Landmarks",
    dialogue: [
      { speaker: "You", text: "Excuse me, could you tell me how to get to the train station?" },
      { speaker: "Local", text: "Sure! Go straight down this road until you reach the roundabout." },
      { speaker: "You", text: "OK, and then?" },
      { speaker: "Local", text: "Take the second exit and keep going for about five minutes." },
      { speaker: "You", text: "Is it on the left or the right?" },
      { speaker: "Local", text: "You'll see it on your left, just past the big supermarket. You can't miss it!" },
      { speaker: "You", text: "Brilliant, thanks so much!" }
    ],
    vocabulary: [
      { word: "roundabout", phonetic: "/ˈraʊnd.ə.baʊt/", meaning: "rotonda, glorieta", example: "Take the third exit at the roundabout." },
      { word: "straight", phonetic: "/streɪt/", meaning: "recto, todo derecho", example: "Go straight for about 200 metres." },
      { word: "exit", phonetic: "/ˈek.sɪt/", meaning: "salida", example: "Take the second exit off the motorway." },
      { word: "past", phonetic: "/pɑːst/", meaning: "pasado, más allá de", example: "Walk past the church and turn right." },
      { word: "landmark", phonetic: "/ˈlænd.mɑːk/", meaning: "punto de referencia", example: "The tower is the main landmark of the city." }
    ],
    expressions: [
      { phrase: "Could you tell me how to get to...?", meaning: "¿Podría indicarme cómo llegar a...?", example: "Could you tell me how to get to the museum?" },
      { phrase: "You can't miss it!", meaning: "¡No te lo puedes perder! (es fácil de encontrar)", example: "It's the big red building. You can't miss it!" },
      { phrase: "Keep going for...", meaning: "Sigue recto durante...", example: "Keep going for about ten minutes." }
    ],
    grammar: {
      title: "Imperatives for Giving Directions",
      explanation: "Para dar indicaciones usamos imperativos directos (sin sujeto). No es descortés, es lo natural. Añadimos 'please' si queremos ser extra educados.",
      examples: ["Go straight down this road. ✓", "Turn left at the traffic lights. ✓", "Take the second exit. ✓", "Keep going until you see the park. ✓"]
    }
  }
];

const FLASHCARD_BANK = [
  { id: 1, en: "straightforward", es: "sencillo, directo", sentence: "The instructions are pretty straightforward.", phonetic: "/ˌstreɪt.ˈfɔː.wəd/", difficulty: 2 },
  { id: 2, en: "reliable", es: "fiable, de confianza", sentence: "She's one of the most reliable people I know.", phonetic: "/rɪˈlaɪ.ə.bəl/", difficulty: 1 },
  { id: 3, en: "come across", es: "encontrarse con / dar la impresión de", sentence: "I came across an interesting article yesterday.", phonetic: "/kʌm əˈkrɒs/", difficulty: 2 },
  { id: 4, en: "figure out", es: "averiguar, resolver", sentence: "I can't figure out how to fix this.", phonetic: "/ˈfɪɡ.ər aʊt/", difficulty: 1 },
  { id: 5, en: "accountable", es: "responsable (rendir cuentas)", sentence: "Leaders should be held accountable for their decisions.", phonetic: "/əˈkaʊn.tə.bəl/", difficulty: 3 },
  { id: 6, en: "get along with", es: "llevarse bien con", sentence: "I get along with most of my colleagues.", phonetic: "/ɡet əˈlɒŋ wɪð/", difficulty: 1 },
  { id: 7, en: "thorough", es: "exhaustivo, minucioso", sentence: "The report was very thorough and well-researched.", phonetic: "/ˈθʌr.ə/", difficulty: 3 },
  { id: 8, en: "put off", es: "posponer / desanimar", sentence: "Don't put off until tomorrow what you can do today.", phonetic: "/pʊt ɒf/", difficulty: 2 },
  { id: 9, en: "carry out", es: "llevar a cabo, realizar", sentence: "We need to carry out further research.", phonetic: "/ˈkær.i aʊt/", difficulty: 2 },
  { id: 10, en: "awkward", es: "incómodo, embarazoso", sentence: "There was an awkward silence after the question.", phonetic: "/ˈɔː.kwəd/", difficulty: 2 },
  { id: 11, en: "bear in mind", es: "tener en cuenta", sentence: "Bear in mind that the deadline is next Friday.", phonetic: "/beər ɪn maɪnd/", difficulty: 2 },
  { id: 12, en: "willing", es: "dispuesto", sentence: "She's willing to help if you ask.", phonetic: "/ˈwɪl.ɪŋ/", difficulty: 1 },
  { id: 13, en: "look forward to", es: "tener ganas de, esperar con ilusión", sentence: "I look forward to hearing from you.", phonetic: "/lʊk ˈfɔː.wəd tuː/", difficulty: 1 },
  { id: 14, en: "breakthrough", es: "avance, gran descubrimiento", sentence: "Scientists announced a major breakthrough.", phonetic: "/ˈbreɪk.θruː/", difficulty: 2 },
  { id: 15, en: "give up", es: "rendirse, abandonar", sentence: "Don't give up — you're almost there!", phonetic: "/ɡɪv ʌp/", difficulty: 1 },
  { id: 16, en: "outcome", es: "resultado, desenlace", sentence: "The outcome of the election was unexpected.", phonetic: "/ˈaʊt.kʌm/", difficulty: 2 },
  { id: 17, en: "narrow down", es: "reducir, acotar (opciones)", sentence: "We need to narrow down the list of candidates.", phonetic: "/ˈnær.əʊ daʊn/", difficulty: 2 },
  { id: 18, en: "self-conscious", es: "cohibido, inseguro", sentence: "He feels self-conscious about his accent.", phonetic: "/ˌself ˈkɒn.ʃəs/", difficulty: 3 },
  { id: 19, en: "turn out", es: "resultar (ser)", sentence: "The party turned out to be really fun.", phonetic: "/tɜːn aʊt/", difficulty: 1 },
  { id: 20, en: "deadline", es: "fecha límite, plazo", sentence: "We need to meet the deadline no matter what.", phonetic: "/ˈded.laɪn/", difficulty: 1 },
  { id: 21, en: "hassle", es: "lío, molestia", sentence: "It's such a hassle to find parking downtown.", phonetic: "/ˈhæs.əl/", difficulty: 2 },
  { id: 22, en: "run into", es: "encontrarse con (por casualidad)", sentence: "I ran into my old teacher at the supermarket.", phonetic: "/rʌn ˈɪn.tuː/", difficulty: 1 },
  { id: 23, en: "take for granted", es: "dar por sentado", sentence: "Don't take your health for granted.", phonetic: "/teɪk fɔː ˈɡrɑːn.tɪd/", difficulty: 3 },
  { id: 24, en: "wholesome", es: "saludable, sano, positivo", sentence: "It's a really wholesome family film.", phonetic: "/ˈhəʊl.səm/", difficulty: 2 },
  { id: 25, en: "wind up", es: "acabar (en un sitio/situación)", sentence: "We wound up staying until midnight.", phonetic: "/waɪnd ʌp/", difficulty: 2 }
];

const PRONUNCIATION_SENTENCES = [
  { text: "I'd like a flat white, please.", tip: "Presta atención a la 'd' suave en 'I'd' y la 'w' en 'white'." },
  { text: "Could I have the bill, please?", tip: "La 'ld' en 'could' apenas se pronuncia. Suena como /kʊd/." },
  { text: "I've been working here for three years.", tip: "Cuidado con 'three' — la 'th' es /θ/, no /t/." },
  { text: "She's one of the most reliable people I know.", tip: "El acento en 'reliable' cae en la segunda sílaba: re-LY-able." },
  { text: "How about checking out that new place?", tip: "Enlaza 'about' y 'checking': aboutchecking suena fluido." },
  { text: "What would you say is your biggest strength?", tip: "La combinación 'ngth' en 'strength' es difícil: /streŋkθ/." },
  { text: "I can't figure out how to fix this.", tip: "'Can't' en inglés británico rima con 'aunt': /kɑːnt/." },
  { text: "Bear in mind that the deadline is Friday.", tip: "'Bear' suena exactamente como 'bare': /beər/." },
  { text: "The outcome turned out to be quite unexpected.", tip: "'Quite' se pronuncia /kwaɪt/, no confundir con 'quiet' /ˈkwaɪ.ət/." },
  { text: "I'd love to take on more responsibilities.", tip: "'Responsibilities' tiene 6 sílabas. Acento en '-bil-': re-spon-si-BIL-i-ties." },
  { text: "Go straight down this road until you reach the roundabout.", tip: "'Straight' y 'street' suenan diferente: /streɪt/ vs /striːt/." },
  { text: "I've been having a terrible headache for three days.", tip: "'Terrible' tiene acento en la primera sílaba: TER-ri-ble, no te-RRI-ble." },
  { text: "The fitting rooms are just around the corner.", tip: "Enlaza 'just around': /dʒʌstəˈraʊnd/. La 't' casi desaparece." },
  { text: "Please place your luggage on the belt.", tip: "'Luggage' es /ˈlʌɡ.ɪdʒ/, cuidado con la 'g' suave al final." }
];

const FILL_IN_EXERCISES = [
  { id: 1, sentence: "I _____ a flat white, please.", options: ["want", "'d like", "am wanting", "liked"], correct: 1, explanation: "'I'd like' es la forma educada de pedir algo en un servicio." },
  { id: 2, sentence: "I _____ working here for three years.", options: ["am", "was", "'ve been", "had"], correct: 2, explanation: "Present Perfect Continuous (have been + -ing) para duración hasta ahora." },
  { id: 3, sentence: "How about _____ out that new restaurant?", options: ["check", "checking", "to check", "checked"], correct: 1, explanation: "Después de 'How about' usamos gerundio (-ing)." },
  { id: 4, sentence: "Could you tell me how _____ to the station?", options: ["get", "getting", "to get", "I get"], correct: 2, explanation: "'How to get' — question word + to infinitive." },
  { id: 5, sentence: "She _____ to help if you ask her.", options: ["willing", "is willing", "wills", "will"], correct: 1, explanation: "'Be willing to' = estar dispuesto a." },
  { id: 6, sentence: "I've been _____ a headache for three days.", options: ["have", "having", "had", "has"], correct: 1, explanation: "Present Perfect Continuous: have been + -ing." },
  { id: 7, sentence: "Don't _____ off until tomorrow what you can do today.", options: ["put", "take", "get", "give"], correct: 0, explanation: "'Put off' = posponer. Es un phrasal verb muy común." },
  { id: 8, sentence: "The jacket is on sale — forty-five pounds, _____ from seventy.", options: ["up", "down", "off", "out"], correct: 1, explanation: "'Down from' indica el precio original antes de la rebaja." },
  { id: 9, sentence: "_____ we say Saturday around eight?", options: ["Will", "Do", "Shall", "Are"], correct: 2, explanation: "'Shall we...?' es una forma educada de proponer algo." },
  { id: 10, sentence: "I'd _____ I'm good at solving complex problems.", options: ["tell", "speak", "say", "talk"], correct: 2, explanation: "'I'd say' = Yo diría que... suaviza una afirmación." },
  { id: 11, sentence: "Bear in _____ that the deadline is next Friday.", options: ["head", "mind", "brain", "thought"], correct: 1, explanation: "'Bear in mind' = tener en cuenta. Expresión fija." },
  { id: 12, sentence: "You _____ miss it — it's the big red building.", options: ["don't", "won't", "can't", "aren't"], correct: 2, explanation: "'You can't miss it' = es imposible que no lo veas." },
  { id: 13, sentence: "I'm really looking forward _____ seeing you.", options: ["for", "at", "to", "of"], correct: 2, explanation: "'Look forward to + -ing' — la preposición es siempre 'to'." },
  { id: 14, sentence: "Would you like a window or an _____ seat?", options: ["corridor", "aisle", "side", "edge"], correct: 1, explanation: "'Aisle seat' = asiento de pasillo. Se pronuncia /aɪl/." },
  { id: 15, sentence: "It _____ perfectly! I'll take it.", options: ["suits", "fits", "matches", "goes"], correct: 1, explanation: "'It fits' se refiere a la talla. 'It suits' se refiere al estilo." }
];

const DICTATION_SENTENCES = [
  { id: 1, text: "I'd like a flat white, please.", level: "B1", hint: "Ordering a drink at a café" },
  { id: 2, text: "Could I have the Wi-Fi password?", level: "B1", hint: "Asking for something politely" },
  { id: 3, text: "I've been working in data analysis for about three years.", level: "B2", hint: "Talking about work experience" },
  { id: 4, text: "How about checking out that new Mexican place downtown?", level: "B1", hint: "Suggesting plans with friends" },
  { id: 5, text: "Shall we say Saturday around eight?", level: "B1", hint: "Proposing a time to meet" },
  { id: 6, text: "May I see your passport and booking reference?", level: "B1", hint: "At the airport check-in" },
  { id: 7, text: "I've been having a terrible headache for the past three days.", level: "B2", hint: "Describing symptoms to a doctor" },
  { id: 8, text: "I'm looking for a jacket, something smart but casual.", level: "B1", hint: "Shopping for clothes" },
  { id: 9, text: "Go straight down this road until you reach the roundabout.", level: "B1", hint: "Giving directions" },
  { id: 10, text: "I'd love to take on more leadership responsibilities.", level: "B2", hint: "Job interview answer" }
];

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; }

  :root {
    --bg: #0f1923; --surface: #1a2733; --surface2: #223344;
    --accent: #00d4aa; --accent2: #7c5cfc; --accent3: #ff6b6b; --accent4: #ffd93d;
    --text: #e8ecf1; --text2: #8899aa; --text3: #556677;
    --radius: 16px; --radius-sm: 10px;
    --font: 'DM Sans', sans-serif; --font-display: 'Fraunces', serif;
  }

  body { font-family: var(--font); background: var(--bg); color: var(--text); max-width: 480px; margin: 0 auto; min-height: 100vh; overflow-x: hidden; }
  .app-container { padding-bottom: 80px; min-height: 100vh; }

  .app-header { padding: 20px 20px 16px; display: flex; align-items: center; justify-content: space-between; }
  .app-logo { font-family: var(--font-display); font-size: 22px; font-weight: 700; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .streak-badge { display: flex; align-items: center; gap: 6px; background: var(--surface); padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 600; color: var(--accent4); border: 1px solid rgba(255,217,61,0.2); cursor: pointer; transition: all 0.2s; }
  .streak-badge:hover { border-color: rgba(255,217,61,0.5); background: var(--surface2); }

  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(15,25,35,0.95); backdrop-filter: blur(20px); border-top: 1px solid var(--surface2); display: flex; justify-content: space-around; padding: 6px 0 max(6px, env(safe-area-inset-bottom)); z-index: 100; }
  .nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 5px 8px; border-radius: 12px; cursor: pointer; transition: all 0.2s; border: none; background: none; color: var(--text3); font-family: var(--font); font-size: 9px; font-weight: 500; }
  .nav-item.active { color: var(--accent); }
  .nav-item.active svg { stroke: var(--accent); }
  .nav-item svg { transition: all 0.2s; }

  .section-wrap { padding: 0 20px 20px; }
  .section-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  .section-sub { color: var(--text2); font-size: 14px; margin-bottom: 20px; }

  .card { background: var(--surface); border-radius: var(--radius); padding: 18px; margin-bottom: 14px; border: 1px solid transparent; transition: all 0.3s; }
  .card:hover { border-color: var(--surface2); }
  .card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 8px; }

  .dialogue-line { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; animation: fadeInUp 0.3s ease both; }
  .dialogue-line:nth-child(n) { animation-delay: calc(0.05s * var(--i, 0)); }
  .speaker-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .speaker-avatar.barista, .speaker-avatar.staff, .speaker-avatar.assistant { background: linear-gradient(135deg, var(--accent2), #9b7cfc); color: white; }
  .speaker-avatar.you { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); }
  .speaker-avatar.interviewer, .speaker-avatar.doctor { background: linear-gradient(135deg, #ff8c42, #ff6b6b); color: white; }
  .speaker-avatar.friend, .speaker-avatar.local { background: linear-gradient(135deg, var(--accent4), #ffaa00); color: var(--bg); }
  .dialogue-bubble { background: var(--surface2); border-radius: 14px 14px 14px 4px; padding: 10px 14px; font-size: 14px; line-height: 1.5; flex: 1; cursor: pointer; transition: all 0.2s; }
  .dialogue-bubble:hover { background: #2a4055; }
  .dialogue-bubble .speaker-name { font-size: 11px; font-weight: 600; color: var(--accent); margin-bottom: 2px; }
  .dialogue-bubble.playing { border: 1px solid var(--accent); box-shadow: 0 0 20px rgba(0,212,170,0.15); }

  .vocab-item { background: var(--surface2); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 10px; cursor: pointer; }
  .vocab-word { font-weight: 700; font-size: 16px; color: var(--accent); }
  .vocab-phonetic { font-size: 12px; color: var(--text2); margin-left: 8px; }
  .vocab-meaning { font-size: 13px; color: var(--text); margin-top: 4px; }
  .vocab-example { font-size: 12px; color: var(--text2); margin-top: 6px; font-style: italic; padding-left: 10px; border-left: 2px solid var(--accent); }

  .expression-item { background: linear-gradient(135deg, rgba(124,92,252,0.1), rgba(0,212,170,0.05)); border: 1px solid rgba(124,92,252,0.2); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 10px; cursor: pointer; }
  .expression-phrase { font-weight: 700; font-size: 15px; color: var(--accent2); }

  .grammar-box { background: linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,212,170,0.02)); border: 1px solid rgba(0,212,170,0.2); border-radius: var(--radius); padding: 18px; margin-top: 10px; }
  .grammar-title { font-family: var(--font-display); font-size: 17px; font-weight: 600; color: var(--accent); margin-bottom: 8px; }
  .grammar-text { font-size: 13px; line-height: 1.6; color: var(--text2); }
  .grammar-example { font-size: 13px; padding: 4px 0; color: var(--text); cursor: pointer; }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-family: var(--font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
  .btn-primary { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,212,170,0.3); }
  .btn-secondary { background: var(--surface2); color: var(--text); }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn-full { width: 100%; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .pronun-card { background: var(--surface); border-radius: var(--radius); padding: 24px; text-align: center; margin-bottom: 16px; }
  .pronun-sentence { font-family: var(--font-display); font-size: 20px; line-height: 1.5; margin-bottom: 8px; }
  .pronun-tip { font-size: 13px; color: var(--accent4); background: rgba(255,217,61,0.08); padding: 8px 14px; border-radius: 8px; margin-bottom: 20px; }
  .mic-btn { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent3), #ff8888); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; transition: all 0.3s; box-shadow: 0 4px 30px rgba(255,107,107,0.3); }
  .mic-btn.recording { animation: pulse 1.2s infinite; }
  .mic-btn:hover { transform: scale(1.05); }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(255,107,107,0.6); } 70% { box-shadow: 0 0 0 20px rgba(255,107,107,0); } 100% { box-shadow: 0 0 0 0 rgba(255,107,107,0); } }

  .result-box { background: var(--surface2); border-radius: var(--radius-sm); padding: 16px; margin-top: 12px; text-align: left; }
  .result-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .result-text { font-size: 15px; line-height: 1.5; }
  .score-display { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 16px; }
  .score-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
  .score-good { background: rgba(0,212,170,0.15); color: var(--accent); border: 2px solid var(--accent); }
  .score-ok { background: rgba(255,217,61,0.15); color: var(--accent4); border: 2px solid var(--accent4); }
  .score-bad { background: rgba(255,107,107,0.15); color: var(--accent3); border: 2px solid var(--accent3); }

  .flashcard { background: var(--surface); border-radius: 20px; padding: 32px 24px; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; cursor: pointer; transition: all 0.4s; border: 1px solid var(--surface2); }
  .flashcard:hover { border-color: var(--accent); }
  .flashcard-word { font-family: var(--font-display); font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .flashcard-phonetic { font-size: 16px; color: var(--text2); margin-bottom: 16px; }
  .flashcard-hint { font-size: 13px; color: var(--text3); margin-top: auto; }
  .flashcard-back .flashcard-meaning { font-size: 20px; color: var(--accent); margin-bottom: 12px; }
  .flashcard-back .flashcard-sentence { font-size: 14px; color: var(--text2); font-style: italic; line-height: 1.5; }
  .flashcard-progress { display: flex; justify-content: center; gap: 6px; margin-bottom: 16px; }
  .progress-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--surface2); }
  .progress-dot.done { background: var(--accent); }
  .progress-dot.current { background: var(--accent4); box-shadow: 0 0 8px rgba(255,217,61,0.5); }
  .rating-btns { display: flex; gap: 10px; margin-top: 20px; }
  .rating-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .rating-btn:hover { transform: translateY(-2px); }
  .rating-hard { background: rgba(255,107,107,0.15); color: var(--accent3); }
  .rating-ok { background: rgba(255,217,61,0.15); color: var(--accent4); }
  .rating-easy { background: rgba(0,212,170,0.15); color: var(--accent); }

  .chat-container { display: flex; flex-direction: column; height: calc(100vh - 150px); }
  .chat-messages { flex: 1; overflow-y: auto; padding: 0 0 16px; display: flex; flex-direction: column; gap: 12px; }
  .chat-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; animation: fadeInUp 0.3s ease both; white-space: pre-wrap; }
  .chat-msg.user { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); align-self: flex-end; border-bottom-right-radius: 4px; }
  .chat-msg.assistant { background: var(--surface2); color: var(--text); align-self: flex-start; border-bottom-left-radius: 4px; }
  .chat-msg.system { background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.2); color: var(--text2); align-self: center; text-align: center; font-size: 13px; max-width: 95%; }
  .chat-input-row { display: flex; gap: 10px; padding-top: 12px; border-top: 1px solid var(--surface2); }
  .chat-input { flex: 1; background: var(--surface); border: 1px solid var(--surface2); border-radius: 12px; padding: 12px 16px; color: var(--text); font-family: var(--font); font-size: 14px; outline: none; transition: border-color 0.2s; }
  .chat-input:focus { border-color: var(--accent); }
  .chat-input::placeholder { color: var(--text3); }
  .send-btn { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg, var(--accent2), #9b7cfc); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .send-btn:hover { transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; }

  .lesson-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
  .lesson-tabs::-webkit-scrollbar { display: none; }
  .lesson-tab { flex-shrink: 0; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--surface2); background: var(--surface); color: var(--text2); transition: all 0.2s; font-family: var(--font); }
  .lesson-tab.active { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); border-color: transparent; }
  .sub-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--surface); padding: 4px; border-radius: 12px; overflow-x: auto; scrollbar-width: none; }
  .sub-tabs::-webkit-scrollbar { display: none; }
  .sub-tab { flex: 1; min-width: 0; padding: 8px 6px; text-align: center; font-size: 11px; font-weight: 600; border-radius: 10px; cursor: pointer; color: var(--text2); border: none; background: none; font-family: var(--font); transition: all 0.2s; white-space: nowrap; }
  .sub-tab.active { background: var(--surface2); color: var(--text); }
  .play-all-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.3); border-radius: 10px; color: var(--accent); font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 16px; transition: all 0.2s; }
  .play-all-btn:hover { background: rgba(0,212,170,0.2); }

  .loading-dots { display: flex; gap: 4px; padding: 8px 0; }
  .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--text3); animation: dotBounce 1.4s infinite ease-in-out both; }
  .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
  .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .api-key-setup { background: var(--surface); border-radius: var(--radius); padding: 20px; margin-bottom: 16px; }
  .api-key-setup input { width: 100%; background: var(--surface2); border: 1px solid var(--text3); border-radius: 8px; padding: 10px 14px; color: var(--text); font-family: var(--font); font-size: 14px; margin: 10px 0; outline: none; }
  .api-key-setup input:focus { border-color: var(--accent); }

  /* Exercises */
  .exercise-card { background: var(--surface); border-radius: var(--radius); padding: 22px; margin-bottom: 16px; }
  .exercise-sentence { font-family: var(--font-display); font-size: 18px; line-height: 1.6; margin-bottom: 16px; }
  .exercise-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .exercise-option { padding: 12px; border-radius: 10px; border: 2px solid var(--surface2); background: var(--surface2); font-family: var(--font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; color: var(--text); text-align: center; }
  .exercise-option:hover { border-color: var(--accent); }
  .exercise-option.correct { border-color: var(--accent); background: rgba(0,212,170,0.15); color: var(--accent); }
  .exercise-option.wrong { border-color: var(--accent3); background: rgba(255,107,107,0.15); color: var(--accent3); }
  .exercise-option.disabled { pointer-events: none; opacity: 0.5; }
  .exercise-explanation { margin-top: 14px; padding: 12px; background: rgba(0,212,170,0.05); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; font-size: 13px; color: var(--text2); line-height: 1.5; }
  .exercise-score-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px 16px; background: var(--surface); border-radius: 10px; }
  .exercise-score-fill { height: 8px; border-radius: 4px; background: linear-gradient(90deg, var(--accent), #00f0c0); transition: width 0.5s; }

  /* Dictation */
  .dictation-input { width: 100%; background: var(--surface2); border: 2px solid var(--surface2); border-radius: 12px; padding: 14px 16px; color: var(--text); font-family: var(--font); font-size: 15px; outline: none; transition: border-color 0.2s; margin-top: 12px; }
  .dictation-input:focus { border-color: var(--accent2); }
  .dictation-input.correct { border-color: var(--accent); }
  .dictation-input.wrong { border-color: var(--accent3); }
  .dictation-hint { font-size: 12px; color: var(--text3); margin-top: 8px; }

  /* Calendar */
  .calendar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeInUp 0.3s ease; }
  .calendar-modal { background: var(--surface); border-radius: var(--radius); padding: 24px; width: 100%; max-width: 380px; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 12px; }
  .calendar-day-header { text-align: center; font-size: 11px; font-weight: 600; color: var(--text3); padding: 4px; }
  .calendar-day { text-align: center; padding: 8px 4px; border-radius: 8px; font-size: 13px; color: var(--text2); transition: all 0.2s; }
  .calendar-day.active { background: rgba(0,212,170,0.15); color: var(--accent); font-weight: 700; }
  .calendar-day.today { border: 1px solid var(--accent4); color: var(--accent4); font-weight: 700; }
  .calendar-day.empty { visibility: hidden; }
  .calendar-stats { display: flex; justify-content: space-around; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--surface2); }
  .calendar-stat { text-align: center; }
  .calendar-stat-num { font-size: 24px; font-weight: 700; font-family: var(--font-display); }
  .calendar-stat-label { font-size: 11px; color: var(--text2); }

  /* Tab switcher for exercises */
  .exercise-mode-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .exercise-mode-tab { flex: 1; padding: 10px; border-radius: 12px; font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--surface2); background: var(--surface); color: var(--text2); transition: all 0.2s; text-align: center; }
  .exercise-mode-tab.active { background: linear-gradient(135deg, var(--accent2), #9b7cfc); color: white; border-color: transparent; }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const Icons = {
  Lesson: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Mic: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Cards: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/></svg>,
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Exercise: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Volume: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  Fire: () => <span style={{fontSize:'16px'}}>🔥</span>,
  MicLarge: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function speak(text, rate = 0.9) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB'; u.rate = rate; u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) u.voice = enVoice;
    window.speechSynthesis.speak(u);
    return u;
  }
  return null;
}

function getToday() { return new Date().toISOString().split('T')[0]; }

function getPracticeDays() {
  try { return JSON.parse(localStorage.getItem('speakflow_days') || '[]'); } catch { return []; }
}

function markPracticeDay() {
  const days = getPracticeDays();
  const today = getToday();
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem('speakflow_days', JSON.stringify(days));
  }
}

function useStreak() {
  const [streak, setStreak] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('speakflow_streak') || '{}');
      const today = getToday();
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (data.lastDate === today) return data.count || 1;
      if (data.lastDate === yesterday) return (data.count || 0) + 1;
      return 1;
    } catch { return 1; }
  });
  useEffect(() => {
    const today = getToday();
    try {
      const data = JSON.parse(localStorage.getItem('speakflow_streak') || '{}');
      if (data.lastDate !== today) localStorage.setItem('speakflow_streak', JSON.stringify({ lastDate: today, count: streak }));
    } catch {}
    markPracticeDay();
  }, [streak]);
  return streak;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function CalendarModal({ onClose }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const practiceDays = getPracticeDays();
  const today = getToday();

  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(month.year, month.month, 1).getDay() + 6) % 7; // Monday start
  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const monthPracticeDays = practiceDays.filter(d => d.startsWith(`${month.year}-${String(month.month+1).padStart(2,'0')}`));
  const totalPracticeDays = practiceDays.length;

  const prevMonth = () => setMonth(m => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 });
  const nextMonth = () => setMonth(m => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 });

  return (
    <div className="calendar-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
          <button className="btn btn-sm btn-secondary" onClick={prevMonth}>←</button>
          <div style={{fontFamily:'var(--font-display)', fontSize:'18px', fontWeight:'600'}}>
            {monthNames[month.month]} {month.year}
          </div>
          <button className="btn btn-sm btn-secondary" onClick={nextMonth}>→</button>
        </div>

        <div className="calendar-grid">
          {["L","M","X","J","V","S","D"].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
          {days.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="calendar-day empty"></div>;
            const dateStr = `${month.year}-${String(month.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const isActive = practiceDays.includes(dateStr);
            const isToday = dateStr === today;
            return <div key={i} className={`calendar-day ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}>{d}</div>;
          })}
        </div>

        <div className="calendar-stats">
          <div className="calendar-stat">
            <div className="calendar-stat-num" style={{color:'var(--accent)'}}>{monthPracticeDays.length}</div>
            <div className="calendar-stat-label">Este mes</div>
          </div>
          <div className="calendar-stat">
            <div className="calendar-stat-num" style={{color:'var(--accent4)'}}>{totalPracticeDays}</div>
            <div className="calendar-stat-label">Total días</div>
          </div>
        </div>

        <button className="btn btn-secondary btn-full" onClick={onClose} style={{marginTop:'16px'}}>Cerrar</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function LessonPage() {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [subTab, setSubTab] = useState("dialogue");
  const [playingIdx, setPlayingIdx] = useState(-1);
  const lesson = LESSONS[lessonIdx];

  const playLine = (text, idx) => { setPlayingIdx(idx); const u = speak(text); if (u) u.onend = () => setPlayingIdx(-1); else setTimeout(() => setPlayingIdx(-1), 2000); };
  const playAll = () => { let delay = 0; lesson.dialogue.forEach((line, i) => { setTimeout(() => playLine(line.text, i), delay); delay += line.text.length * 65 + 800; }); };

  const getAvatar = (speaker) => {
    const s = speaker.toLowerCase();
    if (s === 'you') return <div className="speaker-avatar you">TÚ</div>;
    const cls = s === 'barista' ? 'barista' : s === 'interviewer' ? 'interviewer' : s === 'friend' ? 'friend' : s === 'doctor' ? 'doctor' : s === 'local' ? 'local' : s === 'staff' || s === 'assistant' ? 'staff' : 'barista';
    return <div className={`speaker-avatar ${cls}`}>{speaker[0]}</div>;
  };

  return (
    <div className="section-wrap">
      <div className="section-title">Lecciones</div>
      <div className="section-sub">Nivel {lesson.level} · {lesson.topic}</div>
      <div className="lesson-tabs">
        {LESSONS.map((l, i) => <button key={l.id} className={`lesson-tab ${i === lessonIdx ? 'active' : ''}`} onClick={() => { setLessonIdx(i); setSubTab("dialogue"); }}>{l.day}</button>)}
      </div>
      <div className="sub-tabs">
        {["dialogue","vocabulary","expressions","grammar"].map(t => (
          <button key={t} className={`sub-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'dialogue' ? '💬 Diálogo' : t === 'vocabulary' ? '📖 Vocab' : t === 'expressions' ? '💡 Expr.' : '📐 Gram.'}
          </button>
        ))}
      </div>

      {subTab === "dialogue" && (<div>
        <button className="play-all-btn" onClick={playAll}><Icons.Play /> Reproducir diálogo completo</button>
        {lesson.dialogue.map((line, i) => (
          <div className="dialogue-line" key={i} style={{'--i': i}}>
            {getAvatar(line.speaker)}
            <div className={`dialogue-bubble ${playingIdx === i ? 'playing' : ''}`} onClick={() => playLine(line.text, i)}>
              <div className="speaker-name">{line.speaker}</div>{line.text}
            </div>
          </div>
        ))}
        <div style={{fontSize:'12px', color:'var(--text3)', textAlign:'center', marginTop:'12px'}}>Toca cualquier línea para escuchar</div>
      </div>)}

      {subTab === "vocabulary" && (<div>
        {lesson.vocabulary.map((v, i) => (
          <div className="vocab-item" key={i} onClick={() => speak(v.word)}>
            <span className="vocab-word">{v.word}</span><span className="vocab-phonetic">{v.phonetic}</span>
            <span style={{marginLeft:'8px', cursor:'pointer'}} onClick={e => { e.stopPropagation(); speak(v.example); }}><Icons.Volume /></span>
            <div className="vocab-meaning">{v.meaning}</div>
            <div className="vocab-example">"{v.example}"</div>
          </div>
        ))}
      </div>)}

      {subTab === "expressions" && (<div>
        {lesson.expressions.map((e, i) => (
          <div className="expression-item" key={i} onClick={() => speak(e.phrase)}>
            <div className="expression-phrase">{e.phrase}</div>
            <div className="vocab-meaning">{e.meaning}</div>
            <div className="vocab-example">"{e.example}"</div>
          </div>
        ))}
      </div>)}

      {subTab === "grammar" && (
        <div className="grammar-box">
          <div className="grammar-title">{lesson.grammar.title}</div>
          <div className="grammar-text">{lesson.grammar.explanation}</div>
          <div style={{marginTop:'12px'}}>
            {lesson.grammar.examples.map((ex, i) => <div className="grammar-example" key={i} onClick={() => speak(ex.replace(/[✓✗]/g, ''))}>• {ex}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRONUNCIATION PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function PronunciationPage() {
  const [sentIdx, setSentIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState("");
  const recognitionRef = useRef(null);
  const current = PRONUNCIATION_SENTENCES[sentIdx];

  const calculateScore = (original, spoken) => {
    const origWords = original.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    const spokenWords = spoken.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    let matches = 0;
    origWords.forEach((w, i) => { if (spokenWords[i] === w) matches++; else if (spokenWords.includes(w)) matches += 0.5; });
    return Math.min(100, Math.round((matches / origWords.length) * 100));
  };

  const generateFeedback = (original, spoken, pct) => {
    if (pct >= 90) return "¡Excelente pronunciación! Suenas muy natural. 🎯";
    if (pct >= 70) {
      const origWords = original.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
      const spokenWords = spoken.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
      const missed = origWords.filter(w => !spokenWords.includes(w));
      return missed.length > 0 ? `Bien, pero revisa: "${missed.slice(0,3).join('", "')}". Escucha de nuevo.` : "¡Casi perfecto! Enlaza más las palabras.";
    }
    if (pct >= 40) return "Vas por buen camino. Escucha despacio y repite por partes.";
    return "No te preocupes — toca 🔊 para escuchar despacio e intenta por partes.";
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setFeedback("Tu navegador no soporta reconocimiento de voz. Prueba con Chrome."); return; }
    const recognition = new SR();
    recognition.lang = 'en-GB'; recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = (e) => { const text = e.results[0][0].transcript; setTranscript(text); const pct = calculateScore(current.text, text); setScore(pct); setFeedback(generateFeedback(current.text, text, pct)); setRecording(false); };
    recognition.onerror = (e) => { setRecording(false); setFeedback(e.error === 'no-speech' ? "No detecté audio. Habla claro y cerca del micrófono." : "Error con el micrófono. Revisa los permisos."); };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    setTranscript(""); setScore(null); setFeedback(""); setRecording(true); recognition.start();
  };

  return (
    <div className="section-wrap">
      <div className="section-title">Pronunciación</div>
      <div className="section-sub">Frase {sentIdx + 1} de {PRONUNCIATION_SENTENCES.length}</div>
      <div className="pronun-card">
        <div className="pronun-sentence">{current.text}</div>
        <button className="btn btn-sm btn-secondary" onClick={() => speak(current.text, 0.75)} style={{marginBottom:'12px'}}>🔊 Escuchar despacio</button>
        <div className="pronun-tip">💡 {current.tip}</div>
        <button className={`mic-btn ${recording ? 'recording' : ''}`} onClick={recording ? () => { recognitionRef.current?.stop(); setRecording(false); } : startRecording}><Icons.MicLarge /></button>
        <div style={{fontSize:'13px', color:'var(--text2)'}}>{recording ? "Escuchando... habla ahora" : "Pulsa para grabar"}</div>
      </div>
      {transcript && <div className="result-box"><div className="result-label" style={{color:'var(--text3)'}}>Lo que dijiste:</div><div className="result-text">{transcript}</div></div>}
      {score !== null && (
        <div style={{textAlign:'center'}}>
          <div className="score-display">
            <div className={`score-circle ${score >= 80 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad'}`}>{score}%</div>
            <div style={{textAlign:'left'}}><div style={{fontWeight:'600', fontSize:'15px'}}>{score >= 80 ? '¡Genial!' : score >= 50 ? 'Casi' : 'Sigue practicando'}</div><div style={{fontSize:'12px', color:'var(--text2)'}}>Precisión</div></div>
          </div>
          <div style={{marginTop:'12px', fontSize:'14px', color:'var(--text2)', lineHeight:'1.5', padding:'0 10px'}}>{feedback}</div>
        </div>
      )}
      <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
        <button className="btn btn-secondary btn-full" onClick={() => { setTranscript(""); setScore(null); setFeedback(""); }}>🔄 Repetir</button>
        <button className="btn btn-primary btn-full" onClick={() => { setSentIdx((sentIdx + 1) % PRONUNCIATION_SENTENCES.length); setTranscript(""); setScore(null); setFeedback(""); }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARDS PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function FlashcardsPage() {
  const [cards] = useState(() => [...FLASHCARD_BANK].sort(() => Math.random() - 0.5).slice(0, 10));
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const currentCard = cards[cardIdx];

  const rate = (difficulty) => {
    const newResults = [...results, { card: currentCard, difficulty }];
    setResults(newResults);
    setFlipped(false);
    if (cardIdx + 1 >= cards.length) { setFinished(true); try { const prev = JSON.parse(localStorage.getItem('speakflow_flashcards') || '{}'); prev[getToday()] = { total: cards.length, easy: newResults.filter(r => r.difficulty === 'easy').length }; localStorage.setItem('speakflow_flashcards', JSON.stringify(prev)); } catch {} }
    else setCardIdx(cardIdx + 1);
  };
  const restart = () => { setCardIdx(0); setFlipped(false); setResults([]); setFinished(false); };

  if (finished) {
    const easy = results.filter(r => r.difficulty === 'easy').length;
    const ok = results.filter(r => r.difficulty === 'ok').length;
    const hard = results.filter(r => r.difficulty === 'hard').length;
    return (
      <div className="section-wrap">
        <div className="section-title">Sesión completa</div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:'48px', marginBottom:'10px'}}>🎉</div>
          <div style={{fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:'600', marginBottom:'16px'}}>¡Bien hecho!</div>
          <div style={{display:'flex', justifyContent:'center', gap:'20px', marginBottom:'20px'}}>
            <div><div style={{fontSize:'28px', fontWeight:'700', color:'var(--accent)'}}>{easy}</div><div style={{fontSize:'12px', color:'var(--text2)'}}>Fácil</div></div>
            <div><div style={{fontSize:'28px', fontWeight:'700', color:'var(--accent4)'}}>{ok}</div><div style={{fontSize:'12px', color:'var(--text2)'}}>Regular</div></div>
            <div><div style={{fontSize:'28px', fontWeight:'700', color:'var(--accent3)'}}>{hard}</div><div style={{fontSize:'12px', color:'var(--text2)'}}>Difícil</div></div>
          </div>
          {hard > 0 && <div style={{fontSize:'13px', color:'var(--text2)', marginBottom:'16px'}}>Palabras para repasar: {results.filter(r => r.difficulty === 'hard').map(r => r.card.en).join(', ')}</div>}
          <button className="btn btn-primary btn-full" onClick={restart}>Nueva ronda</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-wrap">
      <div className="section-title">Flashcards</div>
      <div className="section-sub">Vocabulario B1-B2 · {cardIdx + 1}/{cards.length}</div>
      <div className="flashcard-progress">{cards.map((_, i) => <div key={i} className={`progress-dot ${i < cardIdx ? 'done' : i === cardIdx ? 'current' : ''}`} />)}</div>
      <div className="flashcard" onClick={() => { setFlipped(!flipped); speak(currentCard.en); }}>
        {!flipped ? (<><div className="flashcard-word">{currentCard.en}</div><div className="flashcard-phonetic">{currentCard.phonetic}</div><div className="flashcard-hint">Toca para ver la traducción</div></>) : (
          <div className="flashcard-back"><div className="flashcard-word" style={{fontSize:'22px'}}>{currentCard.en}</div><div className="flashcard-meaning">{currentCard.es}</div><div className="flashcard-sentence">"{currentCard.sentence}"</div></div>
        )}
      </div>
      {flipped && (<div className="rating-btns">
        <button className="rating-btn rating-hard" onClick={() => rate('hard')}>😤 Difícil</button>
        <button className="rating-btn rating-ok" onClick={() => rate('ok')}>🤔 Regular</button>
        <button className="rating-btn rating-easy" onClick={() => rate('easy')}>😎 Fácil</button>
      </div>)}
      <div style={{textAlign:'center', marginTop:'16px'}}><button className="btn btn-sm btn-secondary" onClick={() => speak(currentCard.sentence)}>🔊 Escuchar ejemplo</button></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISES PAGE (Fill-in-the-gap + Dictation)
// ═══════════════════════════════════════════════════════════════════════════════

function ExercisesPage() {
  const [mode, setMode] = useState("fill"); // "fill" | "dictation"
  return (
    <div className="section-wrap">
      <div className="section-title">Ejercicios</div>
      <div className="section-sub">Pon a prueba lo que has aprendido</div>
      <div className="exercise-mode-tabs">
        <button className={`exercise-mode-tab ${mode === 'fill' ? 'active' : ''}`} onClick={() => setMode('fill')}>✍️ Rellenar huecos</button>
        <button className={`exercise-mode-tab ${mode === 'dictation' ? 'active' : ''}`} onClick={() => setMode('dictation')}>🎧 Dictado</button>
      </div>
      {mode === "fill" ? <FillInExercises /> : <DictationExercises />}
    </div>
  );
}

function FillInExercises() {
  const [exercises] = useState(() => [...FILL_IN_EXERCISES].sort(() => Math.random() - 0.5).slice(0, 10));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const exercise = exercises[current];

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === exercise.correct) setCorrectCount(c => c + 1);
  };

  const next = () => {
    if (current + 1 >= exercises.length) { setFinished(true); return; }
    setCurrent(current + 1); setSelected(null);
  };

  const restart = () => { setCurrent(0); setSelected(null); setCorrectCount(0); setFinished(false); };

  if (finished) {
    const pct = Math.round((correctCount / exercises.length) * 100);
    return (
      <div className="card" style={{textAlign:'center'}}>
        <div style={{fontSize:'48px', marginBottom:'10px'}}>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
        <div style={{fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:'600', marginBottom:'8px'}}>{correctCount}/{exercises.length} correctas</div>
        <div style={{fontSize:'14px', color:'var(--text2)', marginBottom:'16px'}}>{pct >= 80 ? '¡Excelente dominio!' : pct >= 50 ? '¡Buen trabajo! Repasa los errores.' : 'Revisa las lecciones y vuelve a intentarlo.'}</div>
        <button className="btn btn-primary btn-full" onClick={restart}>Intentar de nuevo</button>
      </div>
    );
  }

  return (
    <div>
      <div className="exercise-score-bar">
        <span style={{fontSize:'13px', fontWeight:'600', color:'var(--accent)'}}>{correctCount}/{exercises.length}</span>
        <div style={{flex:1, height:'8px', background:'var(--surface2)', borderRadius:'4px'}}>
          <div className="exercise-score-fill" style={{width: `${((current) / exercises.length) * 100}%`}}></div>
        </div>
        <span style={{fontSize:'12px', color:'var(--text3)'}}>{current + 1}/{exercises.length}</span>
      </div>

      <div className="exercise-card">
        <div className="exercise-sentence">{exercise.sentence.replace('_____', '______')}</div>
        <div className="exercise-options">
          {exercise.options.map((opt, i) => (
            <button key={i} className={`exercise-option ${selected === null ? '' : i === exercise.correct ? 'correct' : i === selected ? 'wrong' : 'disabled'}`} onClick={() => handleSelect(i)}>{opt}</button>
          ))}
        </div>
        {selected !== null && <div className="exercise-explanation">{selected === exercise.correct ? '✅ ' : '❌ '}{exercise.explanation}</div>}
      </div>

      {selected !== null && <button className="btn btn-primary btn-full" onClick={next}>{current + 1 >= exercises.length ? 'Ver resultados' : 'Siguiente →'}</button>}
    </div>
  );
}

function DictationExercises() {
  const [sentences] = useState(() => [...DICTATION_SENTENCES].sort(() => Math.random() - 0.5).slice(0, 5));
  const [current, setCurrent] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const sentence = sentences[current];

  const checkAnswer = () => {
    const originalWords = sentence.text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    const userWords = userInput.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    let matches = 0;
    originalWords.forEach((w, i) => { if (userWords[i] === w) matches++; });
    const pct = Math.round((matches / originalWords.length) * 100);
    setScore(pct);
    setChecked(true);
    if (pct >= 80) setCorrectCount(c => c + 1);
  };

  const next = () => {
    if (current + 1 >= sentences.length) { setFinished(true); return; }
    setCurrent(current + 1); setUserInput(""); setChecked(false); setScore(null); setShowHint(false);
  };

  const restart = () => { setCurrent(0); setUserInput(""); setChecked(false); setScore(null); setCorrectCount(0); setFinished(false); setShowHint(false); };

  if (finished) {
    return (
      <div className="card" style={{textAlign:'center'}}>
        <div style={{fontSize:'48px', marginBottom:'10px'}}>{correctCount >= 4 ? '🎧' : '📝'}</div>
        <div style={{fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:'600', marginBottom:'8px'}}>{correctCount}/{sentences.length} correctas</div>
        <button className="btn btn-primary btn-full" onClick={restart} style={{marginTop:'16px'}}>Intentar de nuevo</button>
      </div>
    );
  }

  return (
    <div>
      <div className="exercise-score-bar">
        <span style={{fontSize:'13px', fontWeight:'600', color:'var(--accent2)'}}>{correctCount}/{sentences.length}</span>
        <div style={{flex:1, height:'8px', background:'var(--surface2)', borderRadius:'4px'}}>
          <div className="exercise-score-fill" style={{width: `${(current / sentences.length) * 100}%`, background:'linear-gradient(90deg, var(--accent2), #9b7cfc)'}}></div>
        </div>
        <span style={{fontSize:'12px', color:'var(--text3)'}}>{current + 1}/{sentences.length}</span>
      </div>

      <div className="exercise-card">
        <div style={{textAlign:'center', marginBottom:'16px'}}>
          <div style={{fontSize:'13px', color:'var(--text3)', marginBottom:'8px'}}>Nivel {sentence.level}</div>
          <button className="btn btn-primary" onClick={() => speak(sentence.text, 0.85)} style={{marginRight:'8px'}}>🔊 Escuchar</button>
          <button className="btn btn-sm btn-secondary" onClick={() => speak(sentence.text, 0.6)}>🐢 Lento</button>
        </div>

        <input
          className={`dictation-input ${checked ? (score >= 80 ? 'correct' : 'wrong') : ''}`}
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !checked) checkAnswer(); }}
          placeholder="Escribe lo que escuches..."
          disabled={checked}
        />

        {!checked && <div className="dictation-hint" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span onClick={() => setShowHint(true)} style={{cursor:'pointer', color:'var(--accent4)'}}>💡 {showHint ? sentence.hint : 'Ver pista'}</span>
        </div>}

        {checked && (
          <div style={{marginTop:'12px'}}>
            <div style={{fontSize:'13px', color:'var(--text3)', marginBottom:'4px'}}>Respuesta correcta:</div>
            <div style={{fontSize:'15px', color:'var(--accent)', fontWeight:'600'}}>{sentence.text}</div>
            <div style={{marginTop:'8px'}}>
              <div className={`score-circle ${score >= 80 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad'}`} style={{width:'50px', height:'50px', fontSize:'16px', margin:'8px auto'}}>{score}%</div>
            </div>
          </div>
        )}
      </div>

      <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
        {!checked && <button className="btn btn-primary btn-full" onClick={checkAnswer} disabled={!userInput.trim()}>Comprobar</button>}
        {checked && <button className="btn btn-primary btn-full" onClick={next}>{current + 1 >= sentences.length ? 'Ver resultados' : 'Siguiente →'}</button>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TUTOR CHAT PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TUTOR_SYSTEM_PROMPT = `You are a friendly English tutor helping a B1-B2 Spanish speaker improve their English. Your rules:
1. ALWAYS respond in English primarily, but include Spanish translations in parentheses for key corrections.
2. If the user makes grammar, vocabulary, or phrasing errors, GENTLY correct them: "✏️ Small fix: [corrected version]" then explain briefly why.
3. If correct, acknowledge: "✅ Perfect sentence!"
4. Continue naturally with follow-up questions.
5. Occasionally introduce expressions: "💡 New expression: ..."
6. Keep responses concise (2-4 sentences max).
7. Be encouraging and warm.
8. If user writes in Spanish, help them translate to English.`;

function TutorPage() {
  const [messages, setMessages] = useState([{ role: 'system', content: "👋 Hi! I'm your English tutor. Write me anything in English and I'll help you improve. ¡Escríbeme en inglés y te ayudo!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem('speakflow_api_key') || ''; } catch { return ''; } });
  const [showKeySetup, setShowKeySetup] = useState(false);
  const chatRef = useRef(null);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const saveApiKey = (key) => { setApiKey(key); try { localStorage.setItem('speakflow_api_key', key); } catch {} setShowKeySetup(false); };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput(""); setMessages(prev => [...prev, { role: 'user', content: userMsg }]); setLoading(true);
    const conversationHistory = messages.filter(m => m.role !== 'system').concat([{ role: 'user', content: userMsg }]).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
    try {
      let reply = null;
      try { const fn = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: conversationHistory }) }); if (fn.ok) { const d = await fn.json(); reply = d.reply; } } catch {}
      if (!reply && apiKey) {
        const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: TUTOR_SYSTEM_PROMPT, messages: conversationHistory }) });
        const d = await r.json(); reply = d.content?.map(c => c.text || '').join('');
      }
      if (!reply) reply = getLocalTutorReply(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: getLocalTutorReply(userMsg) }]); }
    setLoading(false);
  };

  const quickPrompts = ["Let's talk about my weekend plans", "Help me practice job interview questions", "Teach me phrasal verbs with 'get'", "I want to describe my daily routine"];

  return (
    <div className="section-wrap">
      <div className="section-title">English Tutor</div>
      <div className="section-sub">Practica conversación con correcciones en tiempo real</div>
      {!apiKey && (<div style={{marginBottom:'12px'}}>
        <button className="btn btn-sm btn-secondary" onClick={() => setShowKeySetup(!showKeySetup)} style={{fontSize:'11px', width:'100%'}}>⚙️ {showKeySetup ? 'Ocultar' : 'Configurar API Key (opcional)'}</button>
        {showKeySetup && <div className="api-key-setup"><p style={{fontSize:'12px', color:'var(--text2)', lineHeight:'1.5'}}>Para IA avanzada, introduce tu API key de Anthropic.</p><input type="password" placeholder="sk-ant-..." onKeyDown={e => { if (e.key === 'Enter') saveApiKey(e.target.value); }} /><button className="btn btn-sm btn-primary" onClick={e => { const i = e.target.parentNode.querySelector('input'); if (i.value.trim()) saveApiKey(i.value.trim()); }}>Guardar</button></div>}
      </div>)}
      <div className="chat-container">
        <div className="chat-messages" ref={chatRef}>
          {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>)}
          {loading && <div className="chat-msg assistant"><div className="loading-dots"><span/><span/><span/></div></div>}
          {messages.length === 1 && <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px'}}>{quickPrompts.map((p, i) => <button key={i} className="btn btn-sm btn-secondary" onClick={() => setInput(p)} style={{fontSize:'12px'}}>{p}</button>)}</div>}
        </div>
        <div className="chat-input-row">
          <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Write in English..." disabled={loading} />
          <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}><Icons.Send /></button>
        </div>
      </div>
    </div>
  );
}

function getLocalTutorReply(userMsg) {
  const lower = userMsg.toLowerCase();
  const corrections = [];
  if (/\bi am agree\b/.test(lower)) corrections.push('✏️ Small fix: "I agree" (not "I am agree")');
  if (/\bi have \d+ years\b/.test(lower) && !/old/.test(lower)) corrections.push('✏️ Small fix: "I am X years old" (use "be" for age)');
  if (/\bhe don\'t\b|\bshe don\'t\b/.test(lower)) corrections.push('✏️ Small fix: "he/she doesn\'t"');
  if (/\bmore better\b/.test(lower)) corrections.push('✏️ Small fix: just "better" (already comparative)');
  if (/\bpeoples\b/.test(lower)) corrections.push('✏️ Small fix: "people" (already plural)');
  if (/\binformations\b/.test(lower)) corrections.push('✏️ Small fix: "information" (uncountable)');
  let response = corrections.length > 0 ? corrections.join('\n') + '\n\n' : userMsg.length > 10 ? '✅ Good sentence!\n\n' : '';
  if (/weekend|saturday|sunday/i.test(lower)) response += "What do you usually enjoy doing on weekends?\n\n💡 \"to have a lie-in\" = quedarse en la cama";
  else if (/interview|job|work/i.test(lower)) response += "Tell me about your current role!\n\n💡 \"to wear many hats\" = tener muchos roles";
  else if (/food|eat|restaurant|cook/i.test(lower)) response += "What's your favourite dish to cook?\n\n💡 \"to grab a bite\" = comer algo rápido";
  else if (/travel|holiday|trip/i.test(lower)) response += "Where was the last place you visited?\n\n💡 \"off the beaten track\" = fuera de rutas turísticas";
  else if (/hello|hi|hey/i.test(lower)) response += "Hello! What would you like to talk about?\n\n💡 \"How's it going?\" = ¿Qué tal?";
  else if (/phrasal|verb|get|take|put/i.test(lower)) response += "Phrasal verbs are key!\n• get along with — llevarse bien\n• get over — superar\n• get by — arreglárselas\nMake a sentence with one!";
  else { const f = ["Can you tell me more about that?", "Give me an example!", "Try using 'I think that...'", "Can you rephrase that differently?"]; response += f[Math.floor(Math.random() * f.length)]; }
  return response;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function EnglishLearningApp() {
  const [tab, setTab] = useState("lessons");
  const [showCalendar, setShowCalendar] = useState(false);
  const streak = useStreak();

  useEffect(() => { if ('speechSynthesis' in window) window.speechSynthesis.getVoices(); }, []);

  return (
    <div className="app-container">
      <style>{appStyles}</style>
      <div className="app-header">
        <div className="app-logo">SpeakFlow</div>
        <div className="streak-badge" onClick={() => setShowCalendar(true)}>
          <Icons.Fire /> {streak} {streak === 1 ? 'día' : 'días'}
        </div>
      </div>

      {tab === "lessons" && <LessonPage />}
      {tab === "exercises" && <ExercisesPage />}
      {tab === "pronunciation" && <PronunciationPage />}
      {tab === "flashcards" && <FlashcardsPage />}
      {tab === "tutor" && <TutorPage />}

      {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} />}

      <div className="bottom-nav">
        <button className={`nav-item ${tab === 'lessons' ? 'active' : ''}`} onClick={() => setTab('lessons')}><Icons.Lesson />Lecciones</button>
        <button className={`nav-item ${tab === 'exercises' ? 'active' : ''}`} onClick={() => setTab('exercises')}><Icons.Exercise />Ejercicios</button>
        <button className={`nav-item ${tab === 'pronunciation' ? 'active' : ''}`} onClick={() => setTab('pronunciation')}><Icons.Mic />Habla</button>
        <button className={`nav-item ${tab === 'flashcards' ? 'active' : ''}`} onClick={() => setTab('flashcards')}><Icons.Cards />Flashcards</button>
        <button className={`nav-item ${tab === 'tutor' ? 'active' : ''}`} onClick={() => setTab('tutor')}><Icons.Chat />Tutor</button>
      </div>
    </div>
  );
}
