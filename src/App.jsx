import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const XP_VALUES = { lesson: 50, flashcard: 5, pronunciation: 20, tutorMsg: 5, exercise: 10 };

const LEVELS = [
  { name: "Newbie", min: 0, icon: "🌱" },
  { name: "Beginner", min: 100, icon: "🌿" },
  { name: "Elementary", min: 300, icon: "🌳" },
  { name: "Intermediate", min: 600, icon: "⭐" },
  { name: "Upper Int.", min: 1000, icon: "🌟" },
  { name: "Advanced", min: 1500, icon: "💎" },
  { name: "Expert", min: 2500, icon: "🔥" },
  { name: "Legend", min: 4000, icon: "👑" },
];

const ACHIEVEMENTS = [
  { id: "liftoff", name: "Liftoff", desc: "Completa el onboarding", icon: "🚀" },
  { id: "first_steps", name: "First Steps", desc: "Completa tu primera lección", icon: "👣" },
  { id: "on_fire", name: "On Fire", desc: "Racha de 3 días", icon: "🔥" },
  { id: "unstoppable", name: "Unstoppable", desc: "Racha de 7 días", icon: "⚡" },
  { id: "bookworm", name: "Bookworm", desc: "Completa las 8 lecciones", icon: "📚" },
  { id: "walking_dict", name: "Walking Dictionary", desc: "Aprende 30+ flashcards", icon: "📖" },
  { id: "rising_star", name: "Rising Star", desc: "Alcanza 500 XP", icon: "🌟" },
  { id: "diamond", name: "Diamond", desc: "Alcanza 2000 XP", icon: "💎" },
  { id: "perfect_accent", name: "Perfect Accent", desc: "90%+ en pronunciación", icon: "🎯" },
  { id: "chatterbox", name: "Chatterbox", desc: "Envía 20 mensajes al tutor", icon: "💬" },
  { id: "scholar", name: "Scholar", desc: "80%+ en todos los ejercicios", icon: "🎓" },
  { id: "polyglot", name: "Polyglot", desc: "Domina 40+ flashcards", icon: "🌍" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_STATE = {
  userName: "", onboarded: false, xp: 0,
  completedLessons: [], lessonExScores: {},
  pronunciationBest: {}, flashcardSM2: {},
  practiceDays: [], achievements: [],
  tutorMessages: [], totalTutorMsgs: 0,
  totalExCorrect: 0, totalExDone: 0,
  apiKey: "",
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('speakflow_v2'));
    if (saved) return { ...DEFAULT_STATE, ...saved };
    const oldDays = JSON.parse(localStorage.getItem('speakflow_days') || '[]');
    const oldApiKey = localStorage.getItem('speakflow_api_key') || '';
    return { ...DEFAULT_STATE, practiceDays: oldDays, apiKey: oldApiKey };
  } catch { return { ...DEFAULT_STATE }; }
}

function saveState(state) {
  try { localStorage.setItem('speakflow_v2', JSON.stringify(state)); } catch {}
}

function getToday() { return new Date().toISOString().split('T')[0]; }

function calculateStreak(practiceDays) {
  if (!practiceDays.length) return 0;
  const sorted = [...new Set(practiceDays)].sort().reverse();
  const today = getToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let count = 0;
  let checkDate = sorted[0] === today ? today : yesterday;
  for (const d of sorted) {
    if (d === checkDate) {
      count++;
      const dt = new Date(checkDate + "T12:00:00");
      dt.setDate(dt.getDate() - 1);
      checkDate = dt.toISOString().split('T')[0];
    }
  }
  return count;
}

function sm2(cardState, quality) {
  let { interval = 1, repetition = 0, easeFactor = 2.5 } = cardState || {};
  if (quality >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetition++;
  } else { repetition = 0; interval = 1; }
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const next = new Date(); next.setDate(next.getDate() + interval);
  return { interval, repetition, easeFactor, nextReview: next.toISOString().split('T')[0] };
}

function getLevel(xp) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.min) lvl = l; else break; }
  return lvl;
}

function getNextLevel(xp) {
  for (const l of LEVELS) { if (xp < l.min) return l; }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA — LESSONS
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
    },
    exercises: [
      { type: "cloze", sentence: "I _____ a flat white, please.", options: ["want", "'d like", "am wanting", "liked"], correct: 1, explanation: "'I'd like' es la forma educada de pedir algo." },
      { type: "cloze", sentence: "_____ in or taking away?", options: ["Eat", "Eating", "To eat", "Ate"], correct: 1, explanation: "Gerundio (-ing) en esta expresión fija." },
      { type: "order", words: ["I'd", "like", "a", "large", "flat", "white"], answer: "i'd like a large flat white" },
      { type: "translate", spanish: "¿Podría darme la contraseña del Wi-Fi?", answers: ["could i get the wifi password", "could i have the wifi password", "can i get the wifi password"] }
    ]
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
    },
    exercises: [
      { type: "cloze", sentence: "I _____ working here for three years.", options: ["am", "was", "'ve been", "had"], correct: 2, explanation: "Present Perfect Continuous para duración hasta ahora." },
      { type: "cloze", sentence: "I'd _____ I'm good at solving problems.", options: ["tell", "speak", "say", "talk"], correct: 2, explanation: "'I'd say' suaviza una afirmación." },
      { type: "order", words: ["I'd", "love", "to", "take", "on", "more", "responsibilities"], answer: "i'd love to take on more responsibilities" },
      { type: "translate", spanish: "Cuéntame un poco sobre tu formación.", answers: ["tell me a bit about your background", "tell me a little about your background"] }
    ]
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
    },
    exercises: [
      { type: "cloze", sentence: "How about _____ out that new restaurant?", options: ["check", "checking", "to check", "checked"], correct: 1, explanation: "'How about' va seguido de gerundio (-ing)." },
      { type: "cloze", sentence: "_____ we say Saturday around eight?", options: ["Will", "Do", "Shall", "Are"], correct: 2, explanation: "'Shall we...?' para proponer algo educadamente." },
      { type: "order", words: ["What", "did", "you", "have", "in", "mind"], answer: "what did you have in mind" },
      { type: "translate", spanish: "¿Te apetece hacer algo este fin de semana?", answers: ["fancy doing something this weekend", "do you fancy doing something this weekend"] }
    ]
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
    },
    exercises: [
      { type: "cloze", sentence: "Would you like a window or an _____ seat?", options: ["corridor", "aisle", "side", "edge"], correct: 1, explanation: "'Aisle seat' = asiento de pasillo. Se pronuncia /aɪl/." },
      { type: "cloze", sentence: "_____ I see your passport, please?", options: ["Can", "Do", "May", "Will"], correct: 2, explanation: "'May I' es la forma más formal de pedir permiso." },
      { type: "order", words: ["Could", "I", "check", "in", "this", "suitcase"], answer: "could i check in this suitcase" },
      { type: "translate", spanish: "¿A qué hora empieza el embarque?", answers: ["what time does boarding start", "when does boarding start", "what time does boarding begin"] }
    ]
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
    },
    exercises: [
      { type: "cloze", sentence: "I've been _____ a headache for three days.", options: ["have", "having", "had", "has"], correct: 1, explanation: "Present Perfect Continuous: have been + -ing." },
      { type: "cloze", sentence: "I'd _____ getting proper rest.", options: ["suggest", "recommend", "tell", "say"], correct: 1, explanation: "'I'd recommend + gerundio' para dar consejo profesional." },
      { type: "order", words: ["What", "seems", "to", "be", "the", "problem", "today"], answer: "what seems to be the problem today" },
      { type: "translate", spanish: "Para ser sincero, he estado trabajando horas extra.", answers: ["to be honest i've been working overtime", "to be honest i have been working overtime"] }
    ]
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
    },
    exercises: [
      { type: "cloze", sentence: "It's on sale — forty-five pounds, _____ from seventy.", options: ["up", "down", "off", "out"], correct: 1, explanation: "'Down from' indica el precio original antes de la rebaja." },
      { type: "cloze", sentence: "It _____ perfectly! I'll take it.", options: ["suits", "fits", "matches", "goes"], correct: 1, explanation: "'It fits' se refiere a la talla. 'It suits' se refiere al estilo." },
      { type: "order", words: ["I'm", "looking", "for", "a", "smart", "casual", "jacket"], answer: "i'm looking for a smart casual jacket" },
      { type: "translate", spanish: "¿Puedo probarme este azul marino?", answers: ["could i try this navy one on", "can i try this navy one on", "could i try on this navy one"] }
    ]
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
    },
    exercises: [
      { type: "cloze", sentence: "Could you tell me how _____ to the station?", options: ["get", "getting", "to get", "I get"], correct: 2, explanation: "'How to get' — question word + to infinitive." },
      { type: "cloze", sentence: "You _____ miss it — it's the big red building.", options: ["don't", "won't", "can't", "aren't"], correct: 2, explanation: "'You can't miss it' = es imposible no verlo." },
      { type: "order", words: ["Go", "straight", "down", "this", "road", "until", "you", "reach", "the", "roundabout"], answer: "go straight down this road until you reach the roundabout" },
      { type: "translate", spanish: "Sigue recto durante unos cinco minutos.", answers: ["keep going for about five minutes", "go straight for about five minutes"] }
    ]
  },
  {
    id: 8, day: "Day 8", title: "Tech Support Call",
    level: "B2", topic: "Technology & Troubleshooting",
    dialogue: [
      { speaker: "Support", text: "Thank you for calling TechHelp. How can I assist you today?" },
      { speaker: "You", text: "Hi, my internet connection has been really slow since yesterday." },
      { speaker: "Support", text: "I'm sorry to hear that. Have you tried restarting your router?" },
      { speaker: "You", text: "Yes, I've already rebooted it twice, but it didn't make any difference." },
      { speaker: "Support", text: "Let me run a quick diagnostic. Could you tell me the model number on the back of the router?" },
      { speaker: "You", text: "Sure, it says RT-500X on the label." },
      { speaker: "Support", text: "I can see there's a firmware update pending. If you install it, that should fix the issue. I'll walk you through it." }
    ],
    vocabulary: [
      { word: "reboot", phonetic: "/riːˈbuːt/", meaning: "reiniciar (un dispositivo)", example: "Try rebooting your computer if it freezes." },
      { word: "router", phonetic: "/ˈruː.tər/", meaning: "router, enrutador", example: "The router needs to be updated regularly." },
      { word: "bandwidth", phonetic: "/ˈbænd.wɪdθ/", meaning: "ancho de banda", example: "Streaming uses a lot of bandwidth." },
      { word: "firmware", phonetic: "/ˈfɜːm.weər/", meaning: "firmware (software del dispositivo)", example: "A firmware update can fix many bugs." },
      { word: "troubleshoot", phonetic: "/ˈtrʌb.əl.ʃuːt/", meaning: "diagnosticar / resolver problemas", example: "Let me troubleshoot the connection issue." }
    ],
    expressions: [
      { phrase: "I'll walk you through it", meaning: "Te guiaré paso a paso", example: "Don't worry, I'll walk you through the setup process." },
      { phrase: "It didn't make any difference", meaning: "No sirvió de nada", example: "I restarted it but it didn't make any difference." },
      { phrase: "Let me run a quick...", meaning: "Déjame hacer un/a rápido/a...", example: "Let me run a quick check on your account." }
    ],
    grammar: {
      title: "First Conditional for Troubleshooting",
      explanation: "Usamos el First Conditional (If + present, will + infinitive) para hablar de resultados probables. Muy útil en soporte técnico para dar instrucciones claras.",
      examples: ["If you restart the router, it will reconnect. ✓", "If you update the firmware, that should fix it. ✓", "If it still doesn't work, call us back. ✓", "If you press that button, the light will turn green. ✓"]
    },
    exercises: [
      { type: "cloze", sentence: "If you install the update, that _____ fix the issue.", options: ["would", "should", "can", "might have"], correct: 1, explanation: "'Should' indica un resultado probable en First Conditional." },
      { type: "cloze", sentence: "I've already _____ it twice, but it didn't help.", options: ["rebooted", "reboot", "rebooting", "reboots"], correct: 0, explanation: "Present Perfect: have + past participle (rebooted)." },
      { type: "order", words: ["Have", "you", "tried", "restarting", "your", "router"], answer: "have you tried restarting your router" },
      { type: "translate", spanish: "Mi conexión a internet ha estado muy lenta desde ayer.", answers: ["my internet connection has been really slow since yesterday", "my internet has been very slow since yesterday"] }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA — FLASHCARDS (50)
// ═══════════════════════════════════════════════════════════════════════════════

const FLASHCARD_BANK = [
  { id: 1, en: "straightforward", es: "sencillo, directo", sentence: "The instructions are pretty straightforward.", phonetic: "/ˌstreɪt.ˈfɔː.wəd/" },
  { id: 2, en: "reliable", es: "fiable, de confianza", sentence: "She's one of the most reliable people I know.", phonetic: "/rɪˈlaɪ.ə.bəl/" },
  { id: 3, en: "come across", es: "encontrarse con / dar impresión de", sentence: "I came across an interesting article yesterday.", phonetic: "/kʌm əˈkrɒs/" },
  { id: 4, en: "figure out", es: "averiguar, resolver", sentence: "I can't figure out how to fix this.", phonetic: "/ˈfɪɡ.ər aʊt/" },
  { id: 5, en: "accountable", es: "responsable (rendir cuentas)", sentence: "Leaders should be held accountable for their decisions.", phonetic: "/əˈkaʊn.tə.bəl/" },
  { id: 6, en: "get along with", es: "llevarse bien con", sentence: "I get along with most of my colleagues.", phonetic: "/ɡet əˈlɒŋ wɪð/" },
  { id: 7, en: "thorough", es: "exhaustivo, minucioso", sentence: "The report was very thorough and well-researched.", phonetic: "/ˈθʌr.ə/" },
  { id: 8, en: "put off", es: "posponer / desanimar", sentence: "Don't put off until tomorrow what you can do today.", phonetic: "/pʊt ɒf/" },
  { id: 9, en: "carry out", es: "llevar a cabo, realizar", sentence: "We need to carry out further research.", phonetic: "/ˈkær.i aʊt/" },
  { id: 10, en: "awkward", es: "incómodo, embarazoso", sentence: "There was an awkward silence after the question.", phonetic: "/ˈɔː.kwəd/" },
  { id: 11, en: "bear in mind", es: "tener en cuenta", sentence: "Bear in mind that the deadline is next Friday.", phonetic: "/beər ɪn maɪnd/" },
  { id: 12, en: "willing", es: "dispuesto", sentence: "She's willing to help if you ask.", phonetic: "/ˈwɪl.ɪŋ/" },
  { id: 13, en: "look forward to", es: "tener ganas de, esperar con ilusión", sentence: "I look forward to hearing from you.", phonetic: "/lʊk ˈfɔː.wəd tuː/" },
  { id: 14, en: "breakthrough", es: "avance, gran descubrimiento", sentence: "Scientists announced a major breakthrough.", phonetic: "/ˈbreɪk.θruː/" },
  { id: 15, en: "give up", es: "rendirse, abandonar", sentence: "Don't give up — you're almost there!", phonetic: "/ɡɪv ʌp/" },
  { id: 16, en: "outcome", es: "resultado, desenlace", sentence: "The outcome of the election was unexpected.", phonetic: "/ˈaʊt.kʌm/" },
  { id: 17, en: "narrow down", es: "reducir, acotar (opciones)", sentence: "We need to narrow down the list of candidates.", phonetic: "/ˈnær.əʊ daʊn/" },
  { id: 18, en: "self-conscious", es: "cohibido, inseguro", sentence: "He feels self-conscious about his accent.", phonetic: "/ˌself ˈkɒn.ʃəs/" },
  { id: 19, en: "turn out", es: "resultar (ser)", sentence: "The party turned out to be really fun.", phonetic: "/tɜːn aʊt/" },
  { id: 20, en: "deadline", es: "fecha límite, plazo", sentence: "We need to meet the deadline no matter what.", phonetic: "/ˈded.laɪn/" },
  { id: 21, en: "hassle", es: "lío, molestia", sentence: "It's such a hassle to find parking downtown.", phonetic: "/ˈhæs.əl/" },
  { id: 22, en: "run into", es: "encontrarse con (por casualidad)", sentence: "I ran into my old teacher at the supermarket.", phonetic: "/rʌn ˈɪn.tuː/" },
  { id: 23, en: "take for granted", es: "dar por sentado", sentence: "Don't take your health for granted.", phonetic: "/teɪk fɔː ˈɡrɑːn.tɪd/" },
  { id: 24, en: "wholesome", es: "saludable, sano, positivo", sentence: "It's a really wholesome family film.", phonetic: "/ˈhəʊl.səm/" },
  { id: 25, en: "wind up", es: "acabar (en un sitio/situación)", sentence: "We wound up staying until midnight.", phonetic: "/waɪnd ʌp/" },
  { id: 26, en: "keen on", es: "entusiasta de, aficionado a", sentence: "She's really keen on learning languages.", phonetic: "/kiːn ɒn/" },
  { id: 27, en: "get rid of", es: "deshacerse de, librarse de", sentence: "I need to get rid of these old clothes.", phonetic: "/ɡet rɪd ɒv/" },
  { id: 28, en: "make up", es: "inventar / reconciliarse / maquillarse", sentence: "He made up an excuse for being late.", phonetic: "/meɪk ʌp/" },
  { id: 29, en: "settle down", es: "asentarse, calmarse", sentence: "They plan to settle down in the countryside.", phonetic: "/ˈset.əl daʊn/" },
  { id: 30, en: "hang out", es: "pasar el rato", sentence: "We usually hang out at the park after school.", phonetic: "/hæŋ aʊt/" },
  { id: 31, en: "overwhelmed", es: "abrumado, desbordado", sentence: "I feel overwhelmed with all the deadlines.", phonetic: "/ˌəʊ.vəˈwelmd/" },
  { id: 32, en: "pull off", es: "lograr (algo difícil)", sentence: "She pulled off an amazing presentation.", phonetic: "/pʊl ɒf/" },
  { id: 33, en: "set up", es: "montar, configurar", sentence: "Can you help me set up the printer?", phonetic: "/set ʌp/" },
  { id: 34, en: "let down", es: "decepcionar", sentence: "I don't want to let my team down.", phonetic: "/let daʊn/" },
  { id: 35, en: "bring up", es: "sacar un tema / criar", sentence: "She brought up an interesting point in the meeting.", phonetic: "/brɪŋ ʌp/" },
  { id: 36, en: "sort out", es: "solucionar, arreglar", sentence: "We need to sort out this issue quickly.", phonetic: "/sɔːt aʊt/" },
  { id: 37, en: "fall behind", es: "quedarse atrás, retrasarse", sentence: "I've fallen behind on my reading list.", phonetic: "/fɔːl bɪˈhaɪnd/" },
  { id: 38, en: "keep up with", es: "mantenerse al día con", sentence: "It's hard to keep up with all the news.", phonetic: "/kiːp ʌp wɪð/" },
  { id: 39, en: "stand out", es: "destacar, sobresalir", sentence: "Her CV really stands out from the rest.", phonetic: "/stænd aʊt/" },
  { id: 40, en: "come up with", es: "ocurrírsele (una idea)", sentence: "She came up with a brilliant plan.", phonetic: "/kʌm ʌp wɪð/" },
  { id: 41, en: "drop by", es: "pasarse (por un sitio)", sentence: "Feel free to drop by anytime.", phonetic: "/drɒp baɪ/" },
  { id: 42, en: "cut back on", es: "reducir (consumo)", sentence: "I'm trying to cut back on sugar.", phonetic: "/kʌt bæk ɒn/" },
  { id: 43, en: "cope with", es: "lidiar con, sobrellevar", sentence: "She's coping well with the pressure.", phonetic: "/kəʊp wɪð/" },
  { id: 44, en: "pick up", es: "recoger / aprender rápido", sentence: "He picked up Spanish really quickly.", phonetic: "/pɪk ʌp/" },
  { id: 45, en: "show up", es: "aparecer, presentarse", sentence: "He didn't show up to the meeting.", phonetic: "/ʃəʊ ʌp/" },
  { id: 46, en: "end up", es: "terminar, acabar", sentence: "We ended up eating pizza at home.", phonetic: "/end ʌp/" },
  { id: 47, en: "point out", es: "señalar, indicar", sentence: "She pointed out a mistake in the report.", phonetic: "/pɔɪnt aʊt/" },
  { id: 48, en: "catch up", es: "ponerse al día", sentence: "Let's catch up over coffee sometime.", phonetic: "/kætʃ ʌp/" },
  { id: 49, en: "look into", es: "investigar, examinar", sentence: "We'll look into the issue right away.", phonetic: "/lʊk ˈɪn.tuː/" },
  { id: 50, en: "turn down", es: "rechazar / bajar (volumen)", sentence: "She turned down the job offer.", phonetic: "/tɜːn daʊn/" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA — PRONUNCIATION (20)
// ═══════════════════════════════════════════════════════════════════════════════

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
  { text: "Please place your luggage on the belt.", tip: "'Luggage' es /ˈlʌɡ.ɪdʒ/, cuidado con la 'g' suave al final." },
  { text: "Have you tried restarting your router?", tip: "'Router' puede ser /ˈruː.tər/ (UK) o /ˈraʊ.tər/ (US). Ambas son correctas." },
  { text: "I'll walk you through the setup process.", tip: "Enlaza 'walk you': /wɔːkjuː/. La 'l' se conecta con 'you'." },
  { text: "She came up with a brilliant idea.", tip: "'Brilliant' tiene acento en la primera sílaba: BRIL-liant /ˈbrɪl.jənt/." },
  { text: "We ended up staying until midnight.", tip: "'Midnight' tiene acento en la primera sílaba: MID-night /ˈmɪd.naɪt/." },
  { text: "I feel overwhelmed with all the deadlines.", tip: "'Overwhelmed' tiene acento en la tercera sílaba: o-ver-WHELMED /ˌəʊ.vəˈwelmd/." },
  { text: "Let me run a quick diagnostic on your connection.", tip: "'Diagnostic' tiene acento en la tercera sílaba: di-ag-NOS-tic /ˌdaɪ.əɡˈnɒs.tɪk/." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// DATA — GENERAL EXERCISES
// ═══════════════════════════════════════════════════════════════════════════════

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
  { id: 15, sentence: "It _____ perfectly! I'll take it.", options: ["suits", "fits", "matches", "goes"], correct: 1, explanation: "'It fits' se refiere a la talla. 'It suits' se refiere al estilo." },
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
  { id: 10, text: "I'd love to take on more leadership responsibilities.", level: "B2", hint: "Job interview answer" },
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
  .app-container { padding-bottom: 90px; min-height: 100vh; }

  /* Header */
  .app-header { padding: 16px 20px 8px; display: flex; align-items: center; justify-content: space-between; }
  .app-logo { font-family: var(--font-display); font-size: 22px; font-weight: 700; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .header-right { display: flex; align-items: center; gap: 8px; }
  .streak-badge { display: flex; align-items: center; gap: 5px; background: var(--surface); padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; color: var(--accent4); border: 1px solid rgba(255,217,61,0.2); cursor: pointer; transition: all 0.2s; }
  .streak-badge:hover { border-color: rgba(255,217,61,0.5); }

  /* XP Bar */
  .xp-bar-wrap { padding: 0 20px 10px; }
  .xp-bar-info { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
  .xp-bar-outer { height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .xp-bar-inner { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.5s ease; }

  /* Bottom Nav */
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(15,25,35,0.95); backdrop-filter: blur(20px); border-top: 1px solid var(--surface2); display: flex; justify-content: space-around; padding: 4px 0 max(4px, env(safe-area-inset-bottom)); z-index: 100; }
  .nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 4px; border-radius: 10px; cursor: pointer; transition: all 0.2s; border: none; background: none; color: var(--text3); font-family: var(--font); font-size: 9px; font-weight: 500; }
  .nav-item.active { color: var(--accent); }
  .nav-item.active svg { stroke: var(--accent); }

  /* Sections */
  .section-wrap { padding: 0 20px 20px; }
  .section-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  .section-sub { color: var(--text2); font-size: 14px; margin-bottom: 20px; }

  .card { background: var(--surface); border-radius: var(--radius); padding: 18px; margin-bottom: 14px; border: 1px solid transparent; transition: all 0.3s; }
  .card:hover { border-color: var(--surface2); }
  .card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 8px; }

  /* Dialogue */
  .dialogue-line { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; animation: fadeInUp 0.3s ease both; }
  .speaker-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .speaker-avatar.barista, .speaker-avatar.staff, .speaker-avatar.assistant, .speaker-avatar.support { background: linear-gradient(135deg, var(--accent2), #9b7cfc); color: white; }
  .speaker-avatar.you { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); }
  .speaker-avatar.interviewer, .speaker-avatar.doctor { background: linear-gradient(135deg, #ff8c42, #ff6b6b); color: white; }
  .speaker-avatar.friend, .speaker-avatar.local { background: linear-gradient(135deg, var(--accent4), #ffaa00); color: var(--bg); }
  .dialogue-bubble { background: var(--surface2); border-radius: 14px 14px 14px 4px; padding: 10px 14px; font-size: 14px; line-height: 1.5; flex: 1; cursor: pointer; transition: all 0.2s; }
  .dialogue-bubble:hover { background: #2a4055; }
  .dialogue-bubble .speaker-name { font-size: 11px; font-weight: 600; color: var(--accent); margin-bottom: 2px; }
  .dialogue-bubble.playing { border: 1px solid var(--accent); box-shadow: 0 0 20px rgba(0,212,170,0.15); }

  /* Vocab */
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

  /* Buttons */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 12px; font-family: var(--font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
  .btn-primary { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,212,170,0.3); }
  .btn-secondary { background: var(--surface2); color: var(--text); }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn-full { width: 100%; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Pronunciation */
  .pronun-card { background: var(--surface); border-radius: var(--radius); padding: 24px; text-align: center; margin-bottom: 16px; }
  .pronun-sentence { font-family: var(--font-display); font-size: 20px; line-height: 1.5; margin-bottom: 8px; }
  .pronun-tip { font-size: 13px; color: var(--accent4); background: rgba(255,217,61,0.08); padding: 8px 14px; border-radius: 8px; margin-bottom: 20px; }
  .mic-btn { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent3), #ff8888); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; transition: all 0.3s; box-shadow: 0 4px 30px rgba(255,107,107,0.3); }
  .mic-btn.recording { animation: pulse 1.2s infinite; }
  @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,107,107,0.6)} 70%{box-shadow:0 0 0 20px rgba(255,107,107,0)} 100%{box-shadow:0 0 0 0 rgba(255,107,107,0)} }

  .result-box { background: var(--surface2); border-radius: var(--radius-sm); padding: 16px; margin-top: 12px; text-align: left; }
  .result-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .score-display { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 16px; }
  .score-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
  .score-good { background: rgba(0,212,170,0.15); color: var(--accent); border: 2px solid var(--accent); }
  .score-ok { background: rgba(255,217,61,0.15); color: var(--accent4); border: 2px solid var(--accent4); }
  .score-bad { background: rgba(255,107,107,0.15); color: var(--accent3); border: 2px solid var(--accent3); }

  /* Flashcards */
  .flashcard { background: var(--surface); border-radius: 20px; padding: 32px 24px; min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; cursor: pointer; transition: all 0.4s; border: 1px solid var(--surface2); }
  .flashcard:hover { border-color: var(--accent); }
  .flashcard-word { font-family: var(--font-display); font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  .flashcard-phonetic { font-size: 16px; color: var(--text2); margin-bottom: 16px; }
  .flashcard-hint { font-size: 13px; color: var(--text3); margin-top: auto; }
  .flashcard-back .flashcard-meaning { font-size: 20px; color: var(--accent); margin-bottom: 12px; }
  .flashcard-back .flashcard-sentence { font-size: 14px; color: var(--text2); font-style: italic; line-height: 1.5; }
  .flashcard-progress { display: flex; justify-content: center; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
  .progress-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--surface2); }
  .progress-dot.done { background: var(--accent); }
  .progress-dot.current { background: var(--accent4); box-shadow: 0 0 8px rgba(255,217,61,0.5); }
  .rating-btns { display: flex; gap: 10px; margin-top: 20px; }
  .rating-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .rating-btn:hover { transform: translateY(-2px); }
  .rating-hard { background: rgba(255,107,107,0.15); color: var(--accent3); }
  .rating-ok { background: rgba(255,217,61,0.15); color: var(--accent4); }
  .rating-easy { background: rgba(0,212,170,0.15); color: var(--accent); }

  /* Chat */
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

  /* Lesson/Exercise tabs */
  .lesson-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
  .lesson-tabs::-webkit-scrollbar { display: none; }
  .lesson-tab { flex-shrink: 0; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--surface2); background: var(--surface); color: var(--text2); transition: all 0.2s; font-family: var(--font); }
  .lesson-tab.active { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); border-color: transparent; }
  .lesson-tab.completed { border-color: rgba(0,212,170,0.4); }
  .sub-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--surface); padding: 4px; border-radius: 12px; overflow-x: auto; scrollbar-width: none; }
  .sub-tabs::-webkit-scrollbar { display: none; }
  .sub-tab { flex: 1; min-width: 0; padding: 7px 4px; text-align: center; font-size: 10px; font-weight: 600; border-radius: 10px; cursor: pointer; color: var(--text2); border: none; background: none; font-family: var(--font); transition: all 0.2s; white-space: nowrap; }
  .sub-tab.active { background: var(--surface2); color: var(--text); }
  .play-all-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.3); border-radius: 10px; color: var(--accent); font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 16px; transition: all 0.2s; }
  .play-all-btn:hover { background: rgba(0,212,170,0.2); }

  .loading-dots { display: flex; gap: 4px; padding: 8px 0; }
  .loading-dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--text3); animation: dotBounce 1.4s infinite ease-in-out both; }
  .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
  .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
  @keyframes dotBounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

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
  .exercise-mode-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
  .exercise-mode-tab { flex: 1; padding: 10px; border-radius: 12px; font-family: var(--font); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--surface2); background: var(--surface); color: var(--text2); transition: all 0.2s; text-align: center; }
  .exercise-mode-tab.active { background: linear-gradient(135deg, var(--accent2), #9b7cfc); color: white; border-color: transparent; }

  /* Dictation */
  .dictation-input { width: 100%; background: var(--surface2); border: 2px solid var(--surface2); border-radius: 12px; padding: 14px 16px; color: var(--text); font-family: var(--font); font-size: 15px; outline: none; transition: border-color 0.2s; margin-top: 12px; }
  .dictation-input:focus { border-color: var(--accent2); }
  .dictation-input.correct { border-color: var(--accent); }
  .dictation-input.wrong { border-color: var(--accent3); }

  /* Calendar */
  .calendar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeInUp 0.3s ease; }
  .calendar-modal { background: var(--surface); border-radius: var(--radius); padding: 24px; width: 100%; max-width: 380px; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 12px; }
  .calendar-day-header { text-align: center; font-size: 11px; font-weight: 600; color: var(--text3); padding: 4px; }
  .calendar-day { text-align: center; padding: 8px 4px; border-radius: 8px; font-size: 13px; color: var(--text2); }
  .calendar-day.active { background: rgba(0,212,170,0.15); color: var(--accent); font-weight: 700; }
  .calendar-day.today { border: 1px solid var(--accent4); color: var(--accent4); font-weight: 700; }
  .calendar-day.empty { visibility: hidden; }

  /* Dashboard */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .stat-card { background: var(--surface); border-radius: var(--radius-sm); padding: 16px; text-align: center; }
  .stat-num { font-family: var(--font-display); font-size: 28px; font-weight: 700; }
  .stat-label { font-size: 11px; color: var(--text2); margin-top: 4px; }
  .achievement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
  .achievement-item { background: var(--surface); border-radius: var(--radius-sm); padding: 14px 8px; text-align: center; opacity: 0.35; transition: all 0.3s; }
  .achievement-item.unlocked { opacity: 1; border: 1px solid rgba(0,212,170,0.3); }
  .achievement-icon { font-size: 28px; margin-bottom: 6px; }
  .achievement-name { font-size: 11px; font-weight: 600; }
  .achievement-desc { font-size: 9px; color: var(--text2); margin-top: 2px; }
  .mini-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 12px; }
  .mini-day { width: 100%; aspect-ratio: 1; border-radius: 4px; background: var(--surface2); }
  .mini-day.active { background: var(--accent); }
  .mini-day.today { border: 1px solid var(--accent4); }
  .mastery-bar { height: 10px; background: var(--surface2); border-radius: 5px; overflow: hidden; margin-top: 8px; }
  .mastery-fill { height: 100%; background: linear-gradient(90deg, var(--accent2), var(--accent)); border-radius: 5px; transition: width 0.5s; }

  /* Onboarding */
  .onboarding { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 40px 30px; text-align: center; }
  .onboarding-title { font-family: var(--font-display); font-size: 36px; font-weight: 700; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
  .onboarding-sub { color: var(--text2); font-size: 16px; margin-bottom: 40px; line-height: 1.5; }
  .onboarding input { width: 100%; max-width: 300px; background: var(--surface); border: 2px solid var(--surface2); border-radius: 14px; padding: 16px 20px; color: var(--text); font-family: var(--font); font-size: 18px; text-align: center; outline: none; margin-bottom: 24px; transition: border-color 0.2s; }
  .onboarding input:focus { border-color: var(--accent); }

  /* Toast */
  .toast-container { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 300; display: flex; flex-direction: column; gap: 8px; width: 90%; max-width: 400px; pointer-events: none; }
  .toast { padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 600; animation: toastIn 0.4s ease, toastOut 0.4s ease 2.6s forwards; pointer-events: none; text-align: center; }
  .toast-xp { background: linear-gradient(135deg, rgba(0,212,170,0.95), rgba(0,240,192,0.95)); color: var(--bg); }
  .toast-achievement { background: linear-gradient(135deg, rgba(124,92,252,0.95), rgba(155,124,252,0.95)); color: white; }
  @keyframes toastIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(-10px)} }

  /* Word Order Exercise */
  .word-bank { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .word-chip { padding: 8px 14px; border-radius: 8px; background: var(--surface2); color: var(--text); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid var(--surface2); font-family: var(--font); }
  .word-chip:hover { border-color: var(--accent); }
  .word-chip.used { opacity: 0.3; pointer-events: none; }
  .sentence-build { min-height: 48px; padding: 12px; border-radius: 10px; border: 2px dashed var(--surface2); display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .sentence-build .word-chip { background: rgba(0,212,170,0.15); border-color: rgba(0,212,170,0.3); cursor: pointer; }
  .translate-input { width: 100%; background: var(--surface2); border: 2px solid var(--surface2); border-radius: 12px; padding: 14px 16px; color: var(--text); font-family: var(--font); font-size: 15px; outline: none; transition: border-color 0.2s; }
  .translate-input:focus { border-color: var(--accent2); }
  .translate-input.correct { border-color: var(--accent); }
  .translate-input.wrong { border-color: var(--accent3); }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════════

const I = {
  Lesson: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Mic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Cards: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/></svg>,
  Chat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Exercise: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Volume: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  MicLg: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
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
    const v = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
    return u;
  }
  return null;
}

function normalize(s) { return s.toLowerCase().replace(/[^\w\s']/g, '').replace(/\s+/g, ' ').trim(); }

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'achievement' ? 'toast-achievement' : 'toast-xp'}`}>
          {t.type === 'achievement' ? `${t.icon} ¡Logro: ${t.message}!` : `⚡ ${t.message}`}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════════════════════

function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  return (
    <div className="onboarding">
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗣️</div>
      <div className="onboarding-title">SpeakFlow</div>
      <div className="onboarding-sub">Tu compañero para dominar el inglés.<br />Lecciones, ejercicios, pronunciación, flashcards y tutor IA.</div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre..." onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onComplete(name.trim()); }} autoFocus />
      <button className="btn btn-primary btn-full" style={{ maxWidth: 300 }} onClick={() => name.trim() && onComplete(name.trim())} disabled={!name.trim()}>Comenzar mi viaje 🚀</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function CalendarModal({ practiceDays, onClose }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const today = getToday();
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const firstDow = (new Date(month.year, month.month, 1).getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const mn = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mp = practiceDays.filter(d => d.startsWith(`${month.year}-${String(month.month+1).padStart(2,'0')}`));

  return (
    <div className="calendar-overlay" onClick={onClose}>
      <div className="calendar-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => setMonth(m => m.month === 0 ? { year: m.year-1, month: 11 } : { ...m, month: m.month-1 })}>←</button>
          <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600 }}>{mn[month.month]} {month.year}</div>
          <button className="btn btn-sm btn-secondary" onClick={() => setMonth(m => m.month === 11 ? { year: m.year+1, month: 0 } : { ...m, month: m.month+1 })}>→</button>
        </div>
        <div className="calendar-grid">
          {["L","M","X","J","V","S","D"].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="calendar-day empty" />;
            const ds = `${month.year}-${String(month.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            return <div key={i} className={`calendar-day ${practiceDays.includes(ds)?'active':''} ${ds===today?'today':''}`}>{d}</div>;
          })}
        </div>
        <div style={{ display:'flex', justifyContent:'space-around', marginTop:16, paddingTop:16, borderTop:'1px solid var(--surface2)' }}>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:24, fontWeight:700, fontFamily:'var(--font-display)', color:'var(--accent)' }}>{mp.length}</div><div style={{ fontSize:11, color:'var(--text2)' }}>Este mes</div></div>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:24, fontWeight:700, fontFamily:'var(--font-display)', color:'var(--accent4)' }}>{practiceDays.length}</div><div style={{ fontSize:11, color:'var(--text2)' }}>Total días</div></div>
        </div>
        <button className="btn btn-secondary btn-full" onClick={onClose} style={{ marginTop:16 }}>Cerrar</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardPage({ state }) {
  const streak = calculateStreak(state.practiceDays);
  const masteredCards = Object.values(state.flashcardSM2).filter(c => c.repetition >= 3).length;
  const totalCards = FLASHCARD_BANK.length;

  const last35 = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    last35.push(d.toISOString().split('T')[0]);
  }
  const today = getToday();

  const avgPronun = (() => {
    const scores = Object.values(state.pronunciationBest);
    return scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
  })();

  return (
    <div className="section-wrap">
      <div className="section-title">Dashboard</div>
      <div className="section-sub">Tu progreso en SpeakFlow</div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-num" style={{ color:'var(--accent4)' }}>🔥 {streak}</div><div className="stat-label">Racha de días</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'var(--accent)' }}>{state.completedLessons.length}/8</div><div className="stat-label">Lecciones completas</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color:'var(--accent2)' }}>{masteredCards}</div><div className="stat-label">Palabras dominadas</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: avgPronun >= 70 ? 'var(--accent)' : 'var(--accent3)' }}>{avgPronun}%</div><div className="stat-label">Media pronunciación</div></div>
      </div>

      <div className="card">
        <div className="card-label">Actividad · Últimos 35 días</div>
        <div className="mini-calendar">
          {last35.map(d => <div key={d} className={`mini-day ${state.practiceDays.includes(d)?'active':''} ${d===today?'today':''}`} title={d} />)}
        </div>
      </div>

      <div className="card">
        <div className="card-label">Vocabulario dominado</div>
        <div style={{ fontSize:13, color:'var(--text2)' }}>{masteredCards} de {totalCards} palabras (3+ repasos correctos)</div>
        <div className="mastery-bar"><div className="mastery-fill" style={{ width: `${(masteredCards/totalCards)*100}%` }} /></div>
      </div>

      <div className="card">
        <div className="card-label">Logros ({state.achievements.length}/{ACHIEVEMENTS.length})</div>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map(a => (
            <div key={a.id} className={`achievement-item ${state.achievements.includes(a.id)?'unlocked':''}`}>
              <div className="achievement-icon">{a.icon}</div>
              <div className="achievement-name">{a.name}</div>
              <div className="achievement-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON EXERCISES (per-lesson)
// ═══════════════════════════════════════════════════════════════════════════════

function LessonExercises({ exercises, lessonId, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [builtWords, setBuiltWords] = useState([]);
  const [shuffled] = useState(() => exercises.map(e => e.type === 'order' ? { ...e, shuffledWords: [...e.words].sort(() => Math.random() - 0.5) } : e));
  const [transInput, setTransInput] = useState("");
  const [transResult, setTransResult] = useState(null);

  const ex = shuffled[idx];

  const handleCloze = (optIdx) => {
    if (answered) return;
    setSelectedOpt(optIdx); setAnswered(true);
    if (optIdx === ex.correct) setCorrect(c => c + 1);
  };

  const handleOrderCheck = () => {
    setAnswered(true);
    const built = normalize(builtWords.join(' '));
    const expected = normalize(ex.answer);
    if (built === expected) setCorrect(c => c + 1);
  };

  const handleTranslate = () => {
    setAnswered(true);
    const input = normalize(transInput);
    const match = ex.answers.some(a => {
      const n = normalize(a);
      if (input === n) return true;
      const nWords = n.split(' ');
      const iWords = input.split(' ');
      let hits = 0;
      nWords.forEach(w => { if (iWords.includes(w)) hits++; });
      return hits / nWords.length >= 0.75;
    });
    setTransResult(match);
    if (match) setCorrect(c => c + 1);
  };

  const next = () => {
    if (idx + 1 >= shuffled.length) {
      setDone(true);
      onComplete(correct + (answered ? 0 : 0), shuffled.length);
      return;
    }
    setIdx(idx + 1); setAnswered(false); setSelectedOpt(null); setBuiltWords([]); setTransInput(""); setTransResult(null);
  };

  if (done) {
    const pct = Math.round((correct / shuffled.length) * 100);
    return (
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:10 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, marginBottom:8 }}>{correct}/{shuffled.length} correctas</div>
        <div style={{ fontSize:14, color:'var(--text2)', marginBottom:16 }}>{pct >= 80 ? '¡Excelente!' : pct >= 50 ? '¡Buen trabajo!' : 'Sigue practicando'}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="exercise-score-bar">
        <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>{correct}/{shuffled.length}</span>
        <div style={{ flex:1, height:8, background:'var(--surface2)', borderRadius:4 }}><div className="exercise-score-fill" style={{ width:`${(idx/shuffled.length)*100}%` }} /></div>
        <span style={{ fontSize:12, color:'var(--text3)' }}>{idx+1}/{shuffled.length}</span>
      </div>

      <div className="exercise-card">
        {ex.type === 'cloze' && (<>
          <div style={{ fontSize:11, color:'var(--accent2)', fontWeight:600, marginBottom:8 }}>RELLENA EL HUECO</div>
          <div className="exercise-sentence">{ex.sentence}</div>
          <div className="exercise-options">
            {ex.options.map((o, i) => (
              <button key={i} className={`exercise-option ${!answered ? '' : i === ex.correct ? 'correct' : i === selectedOpt ? 'wrong' : 'disabled'}`} onClick={() => handleCloze(i)}>{o}</button>
            ))}
          </div>
          {answered && <div className="exercise-explanation">{selectedOpt === ex.correct ? '✅ ' : '❌ '}{ex.explanation}</div>}
        </>)}

        {ex.type === 'order' && (<>
          <div style={{ fontSize:11, color:'var(--accent2)', fontWeight:600, marginBottom:8 }}>ORDENA LAS PALABRAS</div>
          <div className="sentence-build">
            {builtWords.map((w, i) => <span key={i} className="word-chip" onClick={() => { if (!answered) setBuiltWords(builtWords.filter((_, j) => j !== i)); }}>{w}</span>)}
            {builtWords.length === 0 && <span style={{ color:'var(--text3)', fontSize:13 }}>Toca las palabras en orden...</span>}
          </div>
          <div className="word-bank">
            {ex.shuffledWords.map((w, i) => <span key={i} className={`word-chip ${builtWords.includes(w) && builtWords.filter(x => x === w).length >= ex.shuffledWords.slice(0, i+1).filter(x => x === w).length ? 'used' : ''}`} onClick={() => { if (!answered) setBuiltWords([...builtWords, w]); }}>{w}</span>)}
          </div>
          {!answered && builtWords.length > 0 && <button className="btn btn-primary btn-full" onClick={handleOrderCheck}>Comprobar</button>}
          {answered && (
            <div className="exercise-explanation">
              {normalize(builtWords.join(' ')) === normalize(ex.answer) ? '✅ ¡Correcto!' : `❌ Respuesta: ${ex.answer}`}
            </div>
          )}
        </>)}

        {ex.type === 'translate' && (<>
          <div style={{ fontSize:11, color:'var(--accent2)', fontWeight:600, marginBottom:8 }}>TRADUCE AL INGLÉS</div>
          <div style={{ fontSize:16, color:'var(--accent4)', marginBottom:12, padding:'10px 14px', background:'rgba(255,217,61,0.08)', borderRadius:10 }}>🇪🇸 {ex.spanish}</div>
          <input className={`translate-input ${!answered ? '' : transResult ? 'correct' : 'wrong'}`} value={transInput} onChange={e => setTransInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !answered && transInput.trim()) handleTranslate(); }} placeholder="Write in English..." disabled={answered} />
          {!answered && transInput.trim() && <button className="btn btn-primary btn-full" style={{ marginTop:10 }} onClick={handleTranslate}>Comprobar</button>}
          {answered && (
            <div className="exercise-explanation">
              {transResult ? '✅ ¡Correcto!' : `❌ Respuestas válidas: ${ex.answers.join(' / ')}`}
            </div>
          )}
        </>)}
      </div>

      {answered && <button className="btn btn-primary btn-full" onClick={next}>{idx + 1 >= shuffled.length ? 'Ver resultados' : 'Siguiente →'}</button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LESSON PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function LessonPage({ state, addXP, updateState, unlock }) {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [subTab, setSubTab] = useState("dialogue");
  const [playingIdx, setPlayingIdx] = useState(-1);
  const lesson = LESSONS[lessonIdx];

  const playLine = (text, idx) => { setPlayingIdx(idx); const u = speak(text); if (u) u.onend = () => setPlayingIdx(-1); else setTimeout(() => setPlayingIdx(-1), 2000); };
  const playAll = () => { let delay = 0; lesson.dialogue.forEach((line, i) => { setTimeout(() => playLine(line.text, i), delay); delay += line.text.length * 65 + 800; }); };

  const getAvatar = (speaker) => {
    const s = speaker.toLowerCase();
    if (s === 'you') return <div className="speaker-avatar you">TÚ</div>;
    const cls = s === 'barista' ? 'barista' : s === 'interviewer' ? 'interviewer' : s === 'friend' ? 'friend' : s === 'doctor' ? 'doctor' : s === 'local' ? 'local' : s === 'support' ? 'support' : s === 'staff' || s === 'assistant' ? 'staff' : 'barista';
    return <div className={`speaker-avatar ${cls}`}>{speaker[0]}</div>;
  };

  const onExComplete = (correct, total) => {
    addXP(correct * XP_VALUES.exercise, `${correct} ejercicios`);
    if (!state.completedLessons.includes(lesson.id)) {
      const cl = [...state.completedLessons, lesson.id];
      updateState({ completedLessons: cl, lessonExScores: { ...state.lessonExScores, [lesson.id]: Math.round((correct/total)*100) } });
      addXP(XP_VALUES.lesson, `Lección ${lesson.day}`);
      if (cl.length === 1) unlock('first_steps');
      if (cl.length >= 8) unlock('bookworm');
    }
  };

  return (
    <div className="section-wrap">
      <div className="section-title">Lecciones</div>
      <div className="section-sub">Nivel {lesson.level} · {lesson.topic}</div>
      <div className="lesson-tabs">
        {LESSONS.map((l, i) => <button key={l.id} className={`lesson-tab ${i === lessonIdx ? 'active' : ''} ${state.completedLessons.includes(l.id) ? 'completed' : ''}`} onClick={() => { setLessonIdx(i); setSubTab("dialogue"); }}>{l.day} {state.completedLessons.includes(l.id) ? '✓' : ''}</button>)}
      </div>
      <div className="sub-tabs">
        {["dialogue","vocabulary","expressions","grammar","exercises"].map(t => (
          <button key={t} className={`sub-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'dialogue' ? '💬 Diálogo' : t === 'vocabulary' ? '📖 Vocab' : t === 'expressions' ? '💡 Expr.' : t === 'grammar' ? '📐 Gram.' : '✍️ Ejerc.'}
          </button>
        ))}
      </div>

      {subTab === "dialogue" && (<div>
        <button className="play-all-btn" onClick={playAll}><I.Play /> Reproducir diálogo completo</button>
        {lesson.dialogue.map((line, i) => (
          <div className="dialogue-line" key={i} style={{ '--i': i }}>
            {getAvatar(line.speaker)}
            <div className={`dialogue-bubble ${playingIdx === i ? 'playing' : ''}`} onClick={() => playLine(line.text, i)}>
              <div className="speaker-name">{line.speaker}</div>{line.text}
            </div>
          </div>
        ))}
        <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', marginTop:12 }}>Toca cualquier línea para escuchar</div>
      </div>)}

      {subTab === "vocabulary" && (<div>
        {lesson.vocabulary.map((v, i) => (
          <div className="vocab-item" key={i} onClick={() => speak(v.word)}>
            <span className="vocab-word">{v.word}</span><span className="vocab-phonetic">{v.phonetic}</span>
            <span style={{ marginLeft:8, cursor:'pointer' }} onClick={e => { e.stopPropagation(); speak(v.example); }}><I.Volume /></span>
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
          <div style={{ marginTop:12 }}>
            {lesson.grammar.examples.map((ex, i) => <div className="grammar-example" key={i} onClick={() => speak(ex.replace(/[✓✗]/g, ''))}>• {ex}</div>)}
          </div>
        </div>
      )}

      {subTab === "exercises" && (
        <LessonExercises exercises={lesson.exercises} lessonId={lesson.id} onComplete={onExComplete} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRONUNCIATION PAGE
// ═══════════════════════════════════════════════════════════════════════════════

function PronunciationPage({ state, addXP, updateState, unlock }) {
  const [sentIdx, setSentIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState("");
  const recognitionRef = useRef(null);
  const current = PRONUNCIATION_SENTENCES[sentIdx];

  const calcScore = (orig, spoken) => {
    const ow = orig.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    const sw = spoken.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    let m = 0;
    ow.forEach((w, i) => { if (sw[i] === w) m++; else if (sw.includes(w)) m += 0.5; });
    return Math.min(100, Math.round((m / ow.length) * 100));
  };

  const genFeedback = (orig, spoken, pct) => {
    if (pct >= 90) return "¡Excelente pronunciación! Suenas muy natural. 🎯";
    if (pct >= 70) {
      const ow = orig.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
      const sw = spoken.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
      const missed = ow.filter(w => !sw.includes(w));
      return missed.length ? `Bien, pero revisa: "${missed.slice(0,3).join('", "')}".` : "¡Casi perfecto! Enlaza más las palabras.";
    }
    if (pct >= 40) return "Vas por buen camino. Escucha despacio y repite.";
    return "No te preocupes — toca 🔊 para escuchar e intenta de nuevo.";
  };

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setFeedback("Tu navegador no soporta reconocimiento de voz. Prueba con Chrome."); return; }
    const rec = new SR();
    rec.lang = 'en-GB'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const pct = calcScore(current.text, text);
      setScore(pct);
      setFeedback(genFeedback(current.text, text, pct));
      setRecording(false);
      const best = state.pronunciationBest[sentIdx] || 0;
      if (pct > best) updateState({ pronunciationBest: { ...state.pronunciationBest, [sentIdx]: pct } });
      if (pct >= 70) addXP(XP_VALUES.pronunciation, `Pronunciación ${pct}%`);
      if (pct >= 90) unlock('perfect_accent');
    };
    rec.onerror = () => { setRecording(false); setFeedback("Error con el micrófono."); };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    setTranscript(""); setScore(null); setFeedback(""); setRecording(true); rec.start();
  };

  return (
    <div className="section-wrap">
      <div className="section-title">Pronunciación</div>
      <div className="section-sub">Frase {sentIdx + 1} de {PRONUNCIATION_SENTENCES.length}</div>
      <div className="pronun-card">
        <div className="pronun-sentence">{current.text}</div>
        <button className="btn btn-sm btn-secondary" onClick={() => speak(current.text, 0.75)} style={{ marginBottom:12 }}>🔊 Escuchar despacio</button>
        <div className="pronun-tip">💡 {current.tip}</div>
        <button className={`mic-btn ${recording ? 'recording' : ''}`} onClick={recording ? () => { recognitionRef.current?.stop(); setRecording(false); } : startRec}><I.MicLg /></button>
        <div style={{ fontSize:13, color:'var(--text2)' }}>{recording ? "Escuchando..." : "Pulsa para grabar"}</div>
      </div>
      {transcript && <div className="result-box"><div className="result-label" style={{ color:'var(--text3)' }}>Lo que dijiste:</div><div style={{ fontSize:15, lineHeight:1.5 }}>{transcript}</div></div>}
      {score !== null && (
        <div style={{ textAlign:'center' }}>
          <div className="score-display">
            <div className={`score-circle ${score >= 80 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad'}`}>{score}%</div>
            <div style={{ textAlign:'left' }}><div style={{ fontWeight:600, fontSize:15 }}>{score >= 80 ? '¡Genial!' : score >= 50 ? 'Casi' : 'Sigue practicando'}</div><div style={{ fontSize:12, color:'var(--text2)' }}>Precisión</div></div>
          </div>
          <div style={{ marginTop:12, fontSize:14, color:'var(--text2)', lineHeight:1.5 }}>{feedback}</div>
        </div>
      )}
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button className="btn btn-secondary btn-full" onClick={() => { setTranscript(""); setScore(null); setFeedback(""); }}>🔄 Repetir</button>
        <button className="btn btn-primary btn-full" onClick={() => { setSentIdx((sentIdx+1)%PRONUNCIATION_SENTENCES.length); setTranscript(""); setScore(null); setFeedback(""); }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLASHCARDS PAGE (SM-2)
// ═══════════════════════════════════════════════════════════════════════════════

function FlashcardsPage({ state, addXP, updateState, unlock }) {
  const today = getToday();
  const dueCards = FLASHCARD_BANK.filter(c => {
    const sm = state.flashcardSM2[c.id];
    if (!sm) return true;
    return sm.nextReview <= today;
  });

  const [cards] = useState(() => dueCards.length > 0 ? [...dueCards].sort(() => Math.random() - 0.5).slice(0, 10) : []);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="section-wrap">
        <div className="section-title">Flashcards</div>
        <div className="card" style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, marginBottom:8 }}>¡No hay tarjetas pendientes!</div>
          <div style={{ fontSize:14, color:'var(--text2)' }}>Vuelve mañana para repasar.</div>
        </div>
      </div>
    );
  }

  const currentCard = cards[cardIdx];

  const rate = (quality) => {
    const label = quality === 5 ? 'easy' : quality === 3 ? 'ok' : 'hard';
    const newSM = sm2(state.flashcardSM2[currentCard.id], quality);
    const updated = { ...state.flashcardSM2, [currentCard.id]: newSM };
    updateState({ flashcardSM2: updated });
    if (quality >= 3) addXP(XP_VALUES.flashcard, `Flashcard: ${currentCard.en}`);

    const newResults = [...results, { card: currentCard, rating: label }];
    setResults(newResults);
    setFlipped(false);

    const masteredCount = Object.values(updated).filter(c => c.repetition >= 3).length;
    if (masteredCount >= 30) unlock('walking_dict');
    if (masteredCount >= 40) unlock('polyglot');

    if (cardIdx + 1 >= cards.length) setFinished(true);
    else setCardIdx(cardIdx + 1);
  };

  const restart = () => { setCardIdx(0); setFlipped(false); setResults([]); setFinished(false); };

  if (finished) {
    const easy = results.filter(r => r.rating === 'easy').length;
    const ok = results.filter(r => r.rating === 'ok').length;
    const hard = results.filter(r => r.rating === 'hard').length;
    return (
      <div className="section-wrap">
        <div className="section-title">Sesión completa</div>
        <div className="card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🎉</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, marginBottom:16 }}>¡Bien hecho!</div>
          <div style={{ display:'flex', justifyContent:'center', gap:20, marginBottom:20 }}>
            <div><div style={{ fontSize:28, fontWeight:700, color:'var(--accent)' }}>{easy}</div><div style={{ fontSize:12, color:'var(--text2)' }}>Fácil</div></div>
            <div><div style={{ fontSize:28, fontWeight:700, color:'var(--accent4)' }}>{ok}</div><div style={{ fontSize:12, color:'var(--text2)' }}>Regular</div></div>
            <div><div style={{ fontSize:28, fontWeight:700, color:'var(--accent3)' }}>{hard}</div><div style={{ fontSize:12, color:'var(--text2)' }}>Difícil</div></div>
          </div>
          {hard > 0 && <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>Repasar: {results.filter(r => r.rating === 'hard').map(r => r.card.en).join(', ')}</div>}
          <button className="btn btn-primary btn-full" onClick={restart}>Nueva ronda</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-wrap">
      <div className="section-title">Flashcards</div>
      <div className="section-sub">Vocabulario B1-B2 · {cardIdx + 1}/{cards.length} · {dueCards.length} pendientes hoy</div>
      <div className="flashcard-progress">{cards.map((_, i) => <div key={i} className={`progress-dot ${i < cardIdx ? 'done' : i === cardIdx ? 'current' : ''}`} />)}</div>
      <div className="flashcard" onClick={() => { setFlipped(!flipped); speak(currentCard.en); }}>
        {!flipped ? (<><div className="flashcard-word">{currentCard.en}</div><div className="flashcard-phonetic">{currentCard.phonetic}</div><div className="flashcard-hint">Toca para ver la traducción</div></>) : (
          <div className="flashcard-back"><div className="flashcard-word" style={{ fontSize:22 }}>{currentCard.en}</div><div className="flashcard-meaning">{currentCard.es}</div><div className="flashcard-sentence">"{currentCard.sentence}"</div></div>
        )}
      </div>
      {flipped && (<div className="rating-btns">
        <button className="rating-btn rating-hard" onClick={() => rate(0)}>😤 Difícil</button>
        <button className="rating-btn rating-ok" onClick={() => rate(3)}>🤔 Regular</button>
        <button className="rating-btn rating-easy" onClick={() => rate(5)}>😎 Fácil</button>
      </div>)}
      <div style={{ textAlign:'center', marginTop:16 }}><button className="btn btn-sm btn-secondary" onClick={() => speak(currentCard.sentence)}>🔊 Ejemplo</button></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXERCISES PAGE (general)
// ═══════════════════════════════════════════════════════════════════════════════

function ExercisesPage({ addXP, unlock, state, updateState }) {
  const [mode, setMode] = useState("fill");
  return (
    <div className="section-wrap">
      <div className="section-title">Ejercicios</div>
      <div className="section-sub">Pon a prueba lo que has aprendido</div>
      <div className="exercise-mode-tabs">
        <button className={`exercise-mode-tab ${mode === 'fill' ? 'active' : ''}`} onClick={() => setMode('fill')}>✍️ Rellenar huecos</button>
        <button className={`exercise-mode-tab ${mode === 'dictation' ? 'active' : ''}`} onClick={() => setMode('dictation')}>🎧 Dictado</button>
      </div>
      {mode === "fill" ? <FillInExercises addXP={addXP} unlock={unlock} state={state} updateState={updateState} /> : <DictationExercises addXP={addXP} state={state} updateState={updateState} />}
    </div>
  );
}

function FillInExercises({ addXP, unlock, state, updateState }) {
  const [exercises] = useState(() => [...FILL_IN_EXERCISES].sort(() => Math.random() - 0.5).slice(0, 10));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const exercise = exercises[current];

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === exercise.correct) {
      setCorrectCount(c => c + 1);
      addXP(XP_VALUES.exercise, "Ejercicio correcto");
    }
  };

  const next = () => {
    if (current + 1 >= exercises.length) {
      setFinished(true);
      const pct = Math.round(((correctCount + (selected === exercise?.correct ? 0 : 0)) / exercises.length) * 100);
      const tec = state.totalExCorrect + correctCount;
      const ted = state.totalExDone + exercises.length;
      updateState({ totalExCorrect: tec, totalExDone: ted });
      if (pct >= 80) unlock('scholar');
      return;
    }
    setCurrent(current + 1); setSelected(null);
  };

  if (finished) {
    const pct = Math.round((correctCount / exercises.length) * 100);
    return (
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:10 }}>{pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '📚'}</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, marginBottom:8 }}>{correctCount}/{exercises.length}</div>
        <div style={{ fontSize:14, color:'var(--text2)', marginBottom:16 }}>{pct >= 80 ? '¡Excelente!' : pct >= 50 ? '¡Buen trabajo!' : 'Sigue practicando.'}</div>
        <button className="btn btn-primary btn-full" onClick={() => { setCurrent(0); setSelected(null); setCorrectCount(0); setFinished(false); }}>Intentar de nuevo</button>
      </div>
    );
  }

  return (
    <div>
      <div className="exercise-score-bar">
        <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)' }}>{correctCount}/{exercises.length}</span>
        <div style={{ flex:1, height:8, background:'var(--surface2)', borderRadius:4 }}><div className="exercise-score-fill" style={{ width:`${(current/exercises.length)*100}%` }} /></div>
        <span style={{ fontSize:12, color:'var(--text3)' }}>{current + 1}/{exercises.length}</span>
      </div>
      <div className="exercise-card">
        <div className="exercise-sentence">{exercise.sentence}</div>
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

function DictationExercises({ addXP, state, updateState }) {
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
    const ow = sentence.text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    const uw = userInput.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
    let m = 0; ow.forEach((w, i) => { if (uw[i] === w) m++; });
    const pct = Math.round((m / ow.length) * 100);
    setScore(pct); setChecked(true);
    if (pct >= 80) { setCorrectCount(c => c + 1); addXP(XP_VALUES.exercise, "Dictado correcto"); }
  };

  const next = () => {
    if (current + 1 >= sentences.length) {
      setFinished(true);
      updateState({ totalExCorrect: state.totalExCorrect + correctCount, totalExDone: state.totalExDone + sentences.length });
      return;
    }
    setCurrent(current + 1); setUserInput(""); setChecked(false); setScore(null); setShowHint(false);
  };

  if (finished) {
    return (
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:10 }}>{correctCount >= 4 ? '🎧' : '📝'}</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, marginBottom:8 }}>{correctCount}/{sentences.length}</div>
        <button className="btn btn-primary btn-full" onClick={() => { setCurrent(0); setUserInput(""); setChecked(false); setScore(null); setCorrectCount(0); setFinished(false); setShowHint(false); }} style={{ marginTop:16 }}>Intentar de nuevo</button>
      </div>
    );
  }

  return (
    <div>
      <div className="exercise-score-bar">
        <span style={{ fontSize:13, fontWeight:600, color:'var(--accent2)' }}>{correctCount}/{sentences.length}</span>
        <div style={{ flex:1, height:8, background:'var(--surface2)', borderRadius:4 }}><div className="exercise-score-fill" style={{ width:`${(current/sentences.length)*100}%`, background:'linear-gradient(90deg,var(--accent2),#9b7cfc)' }} /></div>
        <span style={{ fontSize:12, color:'var(--text3)' }}>{current + 1}/{sentences.length}</span>
      </div>
      <div className="exercise-card">
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:8 }}>Nivel {sentence.level}</div>
          <button className="btn btn-primary" onClick={() => speak(sentence.text, 0.85)} style={{ marginRight:8 }}>🔊 Escuchar</button>
          <button className="btn btn-sm btn-secondary" onClick={() => speak(sentence.text, 0.6)}>🐢 Lento</button>
        </div>
        <input className={`dictation-input ${checked ? (score >= 80 ? 'correct' : 'wrong') : ''}`} value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !checked) checkAnswer(); }} placeholder="Escribe lo que escuches..." disabled={checked} />
        {!checked && <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12 }}>
          <span onClick={() => setShowHint(true)} style={{ cursor:'pointer', color:'var(--accent4)' }}>💡 {showHint ? sentence.hint : 'Ver pista'}</span>
        </div>}
        {checked && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:13, color:'var(--text3)' }}>Respuesta correcta:</div>
            <div style={{ fontSize:15, color:'var(--accent)', fontWeight:600 }}>{sentence.text}</div>
            <div className={`score-circle ${score >= 80 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad'}`} style={{ width:50, height:50, fontSize:16, margin:'8px auto' }}>{score}%</div>
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:10, marginTop:12 }}>
        {!checked && <button className="btn btn-primary btn-full" onClick={checkAnswer} disabled={!userInput.trim()}>Comprobar</button>}
        {checked && <button className="btn btn-primary btn-full" onClick={next}>{current + 1 >= sentences.length ? 'Ver resultados' : 'Siguiente →'}</button>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TUTOR CHAT
// ═══════════════════════════════════════════════════════════════════════════════

function TutorPage({ state, addXP, updateState, unlock }) {
  const [messages, setMessages] = useState(() => state.tutorMessages.length > 0 ? state.tutorMessages : [{ role: 'system', content: `👋 Hi${state.userName ? ' ' + state.userName : ''}! I'm your English tutor. Write me anything in English and I'll help you improve. ¡Escríbeme en inglés y te ayudo!` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKeySetup, setShowKeySetup] = useState(false);
  const chatRef = useRef(null);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const saveApiKey = (key) => { updateState({ apiKey: key }); setShowKeySetup(false); };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput("");
    const newMsgs = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMsgs); setLoading(true);

    const totalMsgs = state.totalTutorMsgs + 1;
    updateState({ totalTutorMsgs: totalMsgs });
    addXP(XP_VALUES.tutorMsg, "Mensaje al tutor");
    if (totalMsgs >= 20) unlock('chatterbox');

    const history = newMsgs.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    try {
      let reply = null;
      try {
        const fn = await fetch('/.netlify/functions/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, userName: state.userName }) });
        if (fn.ok) { const d = await fn.json(); reply = d.reply; }
      } catch {}
      if (!reply && state.apiKey) {
        const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": state.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: `You are a friendly English tutor helping ${state.userName || 'a student'} (B1-B2 Spanish speaker) improve their English. Rules: 1. Respond in English, include Spanish translations in parentheses for corrections. 2. Correct errors gently: "✏️ Small fix: [corrected]". 3. If correct: "✅ Perfect sentence!" 4. Continue naturally. 5. Introduce expressions: "💡 New expression: ..." 6. Be concise (2-4 sentences). 7. Be encouraging.`, messages: history }) });
        const d = await r.json(); reply = d.content?.map(c => c.text || '').join('');
      }
      if (!reply) reply = getLocalTutorReply(userMsg);
      const finalMsgs = [...newMsgs, { role: 'assistant', content: reply }];
      setMessages(finalMsgs);
      updateState({ tutorMessages: finalMsgs.slice(-40) });
    } catch { const fallbackMsgs = [...newMsgs, { role: 'assistant', content: getLocalTutorReply(userMsg) }]; setMessages(fallbackMsgs); updateState({ tutorMessages: fallbackMsgs.slice(-40) }); }
    setLoading(false);
  };

  const quickPrompts = ["Let's talk about my weekend plans", "Help me practice job interviews", "Teach me phrasal verbs with 'get'", "Describe my daily routine"];

  return (
    <div className="section-wrap">
      <div className="section-title">English Tutor</div>
      <div className="section-sub">Practica conversación con correcciones</div>
      {!state.apiKey && (<div style={{ marginBottom:12 }}>
        <button className="btn btn-sm btn-secondary" onClick={() => setShowKeySetup(!showKeySetup)} style={{ fontSize:11, width:'100%' }}>⚙️ {showKeySetup ? 'Ocultar' : 'Configurar API Key (opcional)'}</button>
        {showKeySetup && <div className="api-key-setup"><p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>Para IA avanzada, introduce tu API key de Anthropic.</p><input type="password" placeholder="sk-ant-..." onKeyDown={e => { if (e.key === 'Enter') saveApiKey(e.target.value); }} /><button className="btn btn-sm btn-primary" onClick={e => { const i = e.target.parentNode.querySelector('input'); if (i.value.trim()) saveApiKey(i.value.trim()); }}>Guardar</button></div>}
      </div>)}
      <div className="chat-container">
        <div className="chat-messages" ref={chatRef}>
          {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>)}
          {loading && <div className="chat-msg assistant"><div className="loading-dots"><span/><span/><span/></div></div>}
          {messages.length <= 1 && <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>{quickPrompts.map((p, i) => <button key={i} className="btn btn-sm btn-secondary" onClick={() => setInput(p)} style={{ fontSize:12 }}>{p}</button>)}</div>}
        </div>
        <div className="chat-input-row">
          <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Write in English..." disabled={loading} />
          <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}><I.Send /></button>
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
  let r = corrections.length > 0 ? corrections.join('\n') + '\n\n' : userMsg.length > 10 ? '✅ Good sentence!\n\n' : '';
  if (/weekend|saturday|sunday/i.test(lower)) r += "What do you usually enjoy doing on weekends?\n\n💡 \"to have a lie-in\" = quedarse en la cama";
  else if (/interview|job|work/i.test(lower)) r += "Tell me about your current role!\n\n💡 \"to wear many hats\" = tener muchos roles";
  else if (/food|eat|restaurant|cook/i.test(lower)) r += "What's your favourite dish?\n\n💡 \"to grab a bite\" = comer algo rápido";
  else if (/travel|holiday|trip/i.test(lower)) r += "Where was the last place you visited?\n\n💡 \"off the beaten track\" = fuera de rutas turísticas";
  else if (/hello|hi|hey/i.test(lower)) r += "Hello! What would you like to talk about?\n\n💡 \"How's it going?\" = ¿Qué tal?";
  else if (/phrasal|verb|get|take|put/i.test(lower)) r += "Phrasal verbs are key!\n• get along with — llevarse bien\n• get over — superar\n• get by — arreglárselas\nMake a sentence with one!";
  else { const f = ["Can you tell me more?", "Give me an example!", "Try using 'I think that...'", "Rephrase that differently?"]; r += f[Math.floor(Math.random() * f.length)]; }
  return r;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function EnglishLearningApp() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("dashboard");
  const [showCalendar, setShowCalendar] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => { if ('speechSynthesis' in window) window.speechSynthesis.getVoices(); }, []);

  // Mark practice day on mount
  useEffect(() => {
    if (state.onboarded) {
      const today = getToday();
      if (!state.practiceDays.includes(today)) {
        const pd = [...state.practiceDays, today];
        const next = { ...state, practiceDays: pd };
        setState(next); saveState(next);
      }
    }
  }, [state.onboarded]);

  // Remove toasts after 3s
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts(ts => ts.slice(1)), 3000);
    return () => clearTimeout(t);
  }, [toasts]);

  const updateState = useCallback((updates) => {
    setState(prev => { const next = { ...prev, ...updates }; saveState(next); return next; });
  }, []);

  const addXP = useCallback((amount, reason) => {
    setState(prev => {
      const next = { ...prev, xp: prev.xp + amount };
      saveState(next);
      return next;
    });
    setToasts(ts => [...ts, { id: Date.now(), message: `+${amount} XP · ${reason}`, type: 'xp' }]);
  }, []);

  const unlock = useCallback((id) => {
    setState(prev => {
      if (prev.achievements.includes(id)) return prev;
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      const next = { ...prev, achievements: [...prev.achievements, id] };
      saveState(next);
      if (ach) setToasts(ts => [...ts, { id: Date.now() + 1, message: ach.name, type: 'achievement', icon: ach.icon }]);
      return next;
    });
  }, []);

  // Check XP-based achievements
  useEffect(() => {
    if (state.xp >= 500) unlock('rising_star');
    if (state.xp >= 2000) unlock('diamond');
  }, [state.xp, unlock]);

  // Check streak achievements
  useEffect(() => {
    const s = calculateStreak(state.practiceDays);
    if (s >= 3) unlock('on_fire');
    if (s >= 7) unlock('unstoppable');
  }, [state.practiceDays, unlock]);

  // Onboarding
  if (!state.onboarded) {
    return (
      <>
        <style>{appStyles}</style>
        <Onboarding onComplete={(name) => {
          const next = { ...state, userName: name, onboarded: true, practiceDays: [...state.practiceDays, getToday()] };
          setState(next); saveState(next);
          unlock('liftoff');
        }} />
      </>
    );
  }

  const streak = calculateStreak(state.practiceDays);
  const level = getLevel(state.xp);
  const nextLvl = getNextLevel(state.xp);
  const xpProgress = nextLvl ? ((state.xp - level.min) / (nextLvl.min - level.min)) * 100 : 100;

  return (
    <div className="app-container">
      <style>{appStyles}</style>
      <ToastContainer toasts={toasts} />

      <div className="app-header">
        <div className="app-logo">SpeakFlow</div>
        <div className="header-right">
          <div className="streak-badge" onClick={() => setShowCalendar(true)}>🔥 {streak} {streak === 1 ? 'día' : 'días'}</div>
        </div>
      </div>

      <div className="xp-bar-wrap">
        <div className="xp-bar-info">
          <span style={{ color:'var(--accent)' }}>{level.icon} {level.name}</span>
          <span style={{ color:'var(--text2)' }}>{state.xp} XP {nextLvl ? `· ${nextLvl.min - state.xp} para ${nextLvl.name}` : '· ¡Nivel máximo!'}</span>
        </div>
        <div className="xp-bar-outer"><div className="xp-bar-inner" style={{ width: `${xpProgress}%` }} /></div>
      </div>

      {tab === "dashboard" && <DashboardPage state={state} />}
      {tab === "lessons" && <LessonPage state={state} addXP={addXP} updateState={updateState} unlock={unlock} />}
      {tab === "exercises" && <ExercisesPage addXP={addXP} unlock={unlock} state={state} updateState={updateState} />}
      {tab === "pronunciation" && <PronunciationPage state={state} addXP={addXP} updateState={updateState} unlock={unlock} />}
      {tab === "flashcards" && <FlashcardsPage state={state} addXP={addXP} updateState={updateState} unlock={unlock} />}
      {tab === "tutor" && <TutorPage state={state} addXP={addXP} updateState={updateState} unlock={unlock} />}

      {showCalendar && <CalendarModal practiceDays={state.practiceDays} onClose={() => setShowCalendar(false)} />}

      <div className="bottom-nav">
        <button className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}><I.Dashboard />Home</button>
        <button className={`nav-item ${tab === 'lessons' ? 'active' : ''}`} onClick={() => setTab('lessons')}><I.Lesson />Lecciones</button>
        <button className={`nav-item ${tab === 'exercises' ? 'active' : ''}`} onClick={() => setTab('exercises')}><I.Exercise />Ejercicios</button>
        <button className={`nav-item ${tab === 'pronunciation' ? 'active' : ''}`} onClick={() => setTab('pronunciation')}><I.Mic />Habla</button>
        <button className={`nav-item ${tab === 'flashcards' ? 'active' : ''}`} onClick={() => setTab('flashcards')}><I.Cards />Cards</button>
        <button className={`nav-item ${tab === 'tutor' ? 'active' : ''}`} onClick={() => setTab('tutor')}><I.Chat />Tutor</button>
      </div>
    </div>
  );
}
