import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════
// STORAGE LAYER — localStorage persistence
// ═══════════════════════════════════════════
const STORAGE_KEY = "speakflow_v2";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function defaultUserState() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    activeDates: [],
    completedLessons: [],
    completedExercises: [],
    flashcardProgress: {},
    pronunciationScores: {},
    tutorHistory: [],
    totalWordsLearned: 0,
    totalSessions: 0,
    avgPronunciationScore: 0,
    pronScoresHistory: [],
    onboardingDone: false,
    userName: "",
    dailyXP: 0,
    dailyXPDate: null,
    generatedLessons: [],
    unlockedAchievements: [],
  };
}

// ═══════════════════════════════════════════
// XP & LEVEL SYSTEM
// ═══════════════════════════════════════════
const LEVEL_THRESHOLDS = [0,100,250,500,850,1300,1900,2600,3500,4600,6000,8000,10500,14000,18000];
const LEVEL_NAMES = ["Newbie","Starter","Explorer","Learner","Speaker","Talker","Conversant","Fluent-ish","Confident","Skilled","Proficient","Advanced","Expert","Master","Legend"];

function getLevel(xp) {
  let lvl = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1; else break;
  }
  return lvl;
}

function getLevelProgress(xp) {
  const lvl = getLevel(xp);
  if (lvl >= LEVEL_THRESHOLDS.length) return 100;
  const curr = LEVEL_THRESHOLDS[lvl - 1];
  const next = LEVEL_THRESHOLDS[lvl] || curr + 1000;
  return Math.round(((xp - curr) / (next - curr)) * 100);
}

// ═══════════════════════════════════════════
// STREAK CALCULATOR
// ═══════════════════════════════════════════
function calculateStreak(activeDates, today) {
  if (!activeDates.length) return 0;
  const sorted = [...new Set(activeDates)].sort().reverse();
  if (sorted[0] !== today) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (sorted[0] !== yesterday.toISOString().slice(0, 10)) return 0;
  }
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i + 1]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ═══════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════
const ACHIEVEMENTS = [
  { id: "first_lesson", icon: "📖", title: "First Steps", desc: "Completa tu primera lección", check: s => s.completedLessons.length >= 1 },
  { id: "streak_3", icon: "🔥", title: "On Fire", desc: "Racha de 3 días seguidos", check: s => s.streak >= 3 },
  { id: "streak_7", icon: "⚡", title: "Unstoppable", desc: "Racha de 7 días", check: s => s.streak >= 7 },
  { id: "streak_30", icon: "🏆", title: "Monthly Master", desc: "Racha de 30 días", check: s => s.streak >= 30 },
  { id: "words_25", icon: "📚", title: "Bookworm", desc: "Aprende 25 palabras", check: s => s.totalWordsLearned >= 25 },
  { id: "words_100", icon: "🧠", title: "Walking Dictionary", desc: "Aprende 100 palabras", check: s => s.totalWordsLearned >= 100 },
  { id: "xp_500", icon: "⭐", title: "Rising Star", desc: "Consigue 500 XP", check: s => s.xp >= 500 },
  { id: "xp_2000", icon: "💎", title: "Diamond", desc: "Consigue 2000 XP", check: s => s.xp >= 2000 },
  { id: "pron_90", icon: "🎯", title: "Perfect Accent", desc: "90%+ en pronunciación", check: s => s.avgPronunciationScore >= 90 },
  { id: "tutor_20", icon: "💬", title: "Chatterbox", desc: "20 mensajes al tutor", check: s => s.tutorHistory.length >= 20 },
  { id: "lessons_10", icon: "🎓", title: "Scholar", desc: "Completa 10 lecciones", check: s => s.completedLessons.length >= 10 },
  { id: "level_5", icon: "🚀", title: "Liftoff", desc: "Alcanza nivel 5", check: s => getLevel(s.xp) >= 5 },
];

// ═══════════════════════════════════════════
// LESSON DATABASE (expanded to 10+)
// ═══════════════════════════════════════════
const LESSONS_DB = [
  {
    id:1, day:"Day 1", title:"At the Coffee Shop", level:"B1", topic:"Ordering & Small Talk",
    dialogue:[
      {speaker:"Barista",text:"Hi there! What can I get for you today?"},
      {speaker:"You",text:"I'd like a flat white, please. Actually, make that a large one."},
      {speaker:"Barista",text:"Sure thing! Would you like anything to eat with that?"},
      {speaker:"You",text:"I'll grab a blueberry muffin as well, thanks."},
      {speaker:"Barista",text:"Great choice! That'll be six pounds fifty. Eating in or taking away?"},
      {speaker:"You",text:"I'll eat in. Could I also get the Wi-Fi password?"},
      {speaker:"Barista",text:"Of course! It's on the chalkboard by the door. Enjoy!"}
    ],
    vocabulary:[
      {word:"flat white",phonetic:"/flæt waɪt/",meaning:"café con leche suave australiano",example:"I switched from lattes to flat whites."},
      {word:"grab",phonetic:"/ɡræb/",meaning:"coger, pillar (informal)",example:"Let me grab a sandwich before we go."},
      {word:"sure thing",phonetic:"/ʃʊr θɪŋ/",meaning:"¡claro que sí!",example:"Can you help? — Sure thing!"},
      {word:"take away",phonetic:"/teɪk əˈweɪ/",meaning:"para llevar",example:"Is this for here or to take away?"},
      {word:"chalkboard",phonetic:"/ˈtʃɔːk.bɔːrd/",meaning:"pizarra de tiza",example:"The specials are on the chalkboard."}
    ],
    expressions:[
      {phrase:"Make that a...",meaning:"Cambiar el pedido",example:"I'll have tea. Actually, make that a coffee."},
      {phrase:"That'll be...",meaning:"El total es...",example:"That'll be twelve euros, please."},
      {phrase:"Eating in or taking away?",meaning:"¿Para aquí o para llevar?",example:"Your order — eating in or taking away?"}
    ],
    grammar:{title:"'I'd like' vs 'I want'",explanation:"'I'd like' es más educado en contextos de servicio. 'I want' suena demasiado directo.",examples:["I'd like a coffee, please. ✓","I want a coffee. ✗ (brusco)","Could I have a glass of water? ✓"]},
    exercises:[
      {type:"cloze",sentence:"I'd ___ a flat white, please.",answer:"like",options:["like","want","need","have"]},
      {type:"cloze",sentence:"Is this for here or to take ___?",answer:"away",options:["away","out","off","up"]},
      {type:"order",words:["please","I'd","coffee","like","a"],answer:"I'd like a coffee please"},
      {type:"translate",es:"¿Podría darme la contraseña del WiFi?",answer:"Could I get the Wi-Fi password?",accept:["Could I get the Wi-Fi password","Can I have the Wi-Fi password","Could I have the Wi-Fi password"]},
    ]
  },
  {
    id:2, day:"Day 2", title:"Job Interview", level:"B2", topic:"Professional Communication",
    dialogue:[
      {speaker:"Interviewer",text:"Tell me a bit about yourself and your background."},
      {speaker:"You",text:"I've been working in data analysis for about three years now."},
      {speaker:"Interviewer",text:"What would you say is your biggest strength?"},
      {speaker:"You",text:"I'd say I'm particularly good at breaking down complex problems."},
      {speaker:"Interviewer",text:"Where do you see yourself in five years?"},
      {speaker:"You",text:"I'd love to take on more leadership responsibilities."},
      {speaker:"Interviewer",text:"Excellent. Do you have any questions for us?"}
    ],
    vocabulary:[
      {word:"background",phonetic:"/ˈbæk.ɡraʊnd/",meaning:"formación, trayectoria",example:"She has a background in marketing."},
      {word:"strength",phonetic:"/streŋkθ/",meaning:"punto fuerte",example:"Communication is one of my strengths."},
      {word:"break down",phonetic:"/breɪk daʊn/",meaning:"descomponer, desglosar",example:"Let's break down the project into phases."},
      {word:"manageable",phonetic:"/ˈmæn.ɪ.dʒə.bəl/",meaning:"manejable",example:"The workload is challenging but manageable."},
      {word:"take on",phonetic:"/teɪk ɒn/",meaning:"asumir",example:"She took on extra duties last quarter."}
    ],
    expressions:[
      {phrase:"I'd say...",meaning:"Yo diría que...",example:"I'd say the project is about 80% done."},
      {phrase:"I'd love to...",meaning:"Me encantaría...",example:"I'd love to collaborate on that."},
      {phrase:"Tell me a bit about...",meaning:"Cuéntame un poco sobre...",example:"Tell me about your experience with Python."}
    ],
    grammar:{title:"Present Perfect for Experience",explanation:"Usamos have/has + past participle para experiencia acumulada hasta ahora.",examples:["I've been working here for three years. ✓","I've managed teams of up to 10. ✓","Have you ever led a project? ✓"]},
    exercises:[
      {type:"cloze",sentence:"I've ___ working here for three years.",answer:"been",options:["been","being","be","was"]},
      {type:"cloze",sentence:"She ___ on extra duties last quarter.",answer:"took",options:["took","takes","taking","take"]},
      {type:"order",words:["your","is","what","biggest","strength"],answer:"What is your biggest strength"},
      {type:"translate",es:"Me encantaría asumir más responsabilidades.",answer:"I'd love to take on more responsibilities.",accept:["I'd love to take on more responsibilities","I would love to take on more responsibilities"]},
    ]
  },
  {
    id:3, day:"Day 3", title:"Making Plans", level:"B1", topic:"Social Suggestions",
    dialogue:[
      {speaker:"Friend",text:"Hey! Fancy doing something this weekend?"},
      {speaker:"You",text:"Yeah, I'm up for it! What did you have in mind?"},
      {speaker:"Friend",text:"How about checking out that new Mexican place?"},
      {speaker:"You",text:"Sounds great! What time works for you?"},
      {speaker:"Friend",text:"Shall we say Saturday around eight?"},
      {speaker:"You",text:"Perfect. I'll book a table just in case."},
      {speaker:"Friend",text:"Legend! See you there then."}
    ],
    vocabulary:[
      {word:"fancy",phonetic:"/ˈfæn.si/",meaning:"apetecer (coloquial UK)",example:"Do you fancy a walk?"},
      {word:"up for it",phonetic:"/ʌp fɔːr ɪt/",meaning:"estar dispuesto",example:"I'm always up for trying new food."},
      {word:"check out",phonetic:"/tʃek aʊt/",meaning:"probar, echar un vistazo",example:"Check out that new series."},
      {word:"just in case",phonetic:"/dʒʌst ɪn keɪs/",meaning:"por si acaso",example:"Bring an umbrella just in case."},
      {word:"legend",phonetic:"/ˈledʒ.ənd/",meaning:"crack (elogio informal)",example:"Thanks — you're a legend!"}
    ],
    expressions:[
      {phrase:"What did you have in mind?",meaning:"¿Qué tenías pensado?",example:"We could go out. — What did you have in mind?"},
      {phrase:"How about...?",meaning:"¿Qué tal si...?",example:"How about meeting at the park?"},
      {phrase:"Shall we say...?",meaning:"¿Quedamos en...?",example:"Shall we say 7pm?"}
    ],
    grammar:{title:"Making Suggestions",explanation:"'How about + -ing' y 'Fancy + -ing' son informales. 'Shall we...' es más formal.",examples:["How about going to the beach? ✓","Fancy grabbing a coffee? ✓","Shall we meet at noon? ✓","Why don't we try that place? ✓"]},
    exercises:[
      {type:"cloze",sentence:"How about ___ out that new restaurant?",answer:"checking",options:["checking","check","checked","to check"]},
      {type:"cloze",sentence:"I'll book a table just ___ case.",answer:"in",options:["in","on","at","by"]},
      {type:"order",words:["say","we","Saturday","shall","around","eight"],answer:"Shall we say Saturday around eight"},
      {type:"translate",es:"¿Te apetece hacer algo este fin de semana?",answer:"Fancy doing something this weekend?",accept:["Fancy doing something this weekend","Do you fancy doing something this weekend"]},
    ]
  },
  {
    id:4, day:"Day 4", title:"At the Doctor's", level:"B1", topic:"Health & Symptoms",
    dialogue:[
      {speaker:"Doctor",text:"What seems to be the problem today?"},
      {speaker:"You",text:"I've had a terrible headache for the past three days."},
      {speaker:"Doctor",text:"Any other symptoms? Fever, nausea?"},
      {speaker:"You",text:"I've been feeling a bit dizzy, actually."},
      {speaker:"Doctor",text:"Let me check your blood pressure. Have you been under a lot of stress lately?"},
      {speaker:"You",text:"To be honest, work has been really hectic."},
      {speaker:"Doctor",text:"I'd recommend getting more rest and staying hydrated. I'll prescribe some painkillers."}
    ],
    vocabulary:[
      {word:"headache",phonetic:"/ˈhed.eɪk/",meaning:"dolor de cabeza",example:"I woke up with a splitting headache."},
      {word:"dizzy",phonetic:"/ˈdɪz.i/",meaning:"mareado",example:"I felt dizzy after standing up too fast."},
      {word:"blood pressure",phonetic:"/blʌd ˈpreʃ.ər/",meaning:"tensión arterial",example:"High blood pressure runs in my family."},
      {word:"hectic",phonetic:"/ˈhek.tɪk/",meaning:"frenético, agitado",example:"It's been a hectic week at the office."},
      {word:"prescribe",phonetic:"/prɪˈskraɪb/",meaning:"recetar",example:"The doctor prescribed antibiotics."}
    ],
    expressions:[
      {phrase:"What seems to be the problem?",meaning:"¿Qué le ocurre?",example:"Good morning. What seems to be the problem?"},
      {phrase:"To be honest...",meaning:"Siendo sincero...",example:"To be honest, I haven't been sleeping well."},
      {phrase:"I'd recommend...",meaning:"Le recomendaría...",example:"I'd recommend cutting down on caffeine."}
    ],
    grammar:{title:"Present Perfect Continuous for Duration",explanation:"Usamos 'have been + -ing' para acciones que empezaron en el pasado y continúan.",examples:["I've been feeling dizzy for two days. ✓","She's been working too hard lately. ✓","How long have you been having headaches? ✓"]},
    exercises:[
      {type:"cloze",sentence:"I've ___ feeling dizzy since Monday.",answer:"been",options:["been","being","was","had"]},
      {type:"cloze",sentence:"The doctor ___ some painkillers.",answer:"prescribed",options:["prescribed","prescribes","prescribing","prescribe"]},
      {type:"order",words:["been","stress","a","under","of","lot","you","have"],answer:"Have you been under a lot of stress"},
      {type:"translate",es:"Llevo tres días con dolor de cabeza terrible.",answer:"I've had a terrible headache for three days.",accept:["I've had a terrible headache for three days","I've had a terrible headache for the past three days"]},
    ]
  },
  {
    id:5, day:"Day 5", title:"Booking a Holiday", level:"B1", topic:"Travel & Accommodation",
    dialogue:[
      {speaker:"Agent",text:"How can I help you today?"},
      {speaker:"You",text:"I'm looking into flights to Lisbon for next month."},
      {speaker:"Agent",text:"Would you prefer a direct flight or are you flexible with layovers?"},
      {speaker:"You",text:"Direct if possible. I'd rather not spend hours in transit."},
      {speaker:"Agent",text:"We've got a good deal on a return flight with British Airways. 280 pounds."},
      {speaker:"You",text:"That sounds reasonable. Does it include checked luggage?"},
      {speaker:"Agent",text:"One checked bag is included. Shall I go ahead and book it?"}
    ],
    vocabulary:[
      {word:"look into",phonetic:"/lʊk ˈɪn.tuː/",meaning:"investigar, informarse",example:"I'm looking into online courses."},
      {word:"layover",phonetic:"/ˈleɪ.oʊ.vər/",meaning:"escala (avión)",example:"We had a 4-hour layover in Madrid."},
      {word:"I'd rather",phonetic:"/aɪd ˈrɑː.ðər/",meaning:"preferiría",example:"I'd rather stay home tonight."},
      {word:"deal",phonetic:"/diːl/",meaning:"oferta, chollo",example:"They've got a great deal on flights."},
      {word:"checked luggage",phonetic:"/tʃekt ˈlʌɡ.ɪdʒ/",meaning:"equipaje facturado",example:"Is checked luggage included in the fare?"}
    ],
    expressions:[
      {phrase:"I'm looking into...",meaning:"Estoy informándome sobre...",example:"I'm looking into moving abroad."},
      {phrase:"That sounds reasonable.",meaning:"Parece razonable.",example:"200 euros a night? That sounds reasonable."},
      {phrase:"Shall I go ahead and...?",meaning:"¿Procedo a...?",example:"Shall I go ahead and confirm?"}
    ],
    grammar:{title:"'I'd rather' + base verb",explanation:"'I'd rather' expresa preferencia. Va seguido del verbo en infinitivo sin 'to'.",examples:["I'd rather fly direct. ✓","I'd rather not wait. ✓","Would you rather take the train? ✓","I'd rather to fly ✗ (sin 'to')"]},
    exercises:[
      {type:"cloze",sentence:"I'd ___ not spend hours in transit.",answer:"rather",options:["rather","prefer","better","more"]},
      {type:"cloze",sentence:"I'm looking ___ flights to Lisbon.",answer:"into",options:["into","for","at","up"]},
      {type:"order",words:["go","and","ahead","I","book","shall","it"],answer:"Shall I go ahead and book it"},
      {type:"translate",es:"¿Incluye equipaje facturado?",answer:"Does it include checked luggage?",accept:["Does it include checked luggage","Is checked luggage included"]},
    ]
  },
  {
    id:6, day:"Day 6", title:"Complaining Politely", level:"B2", topic:"Assertive Communication",
    dialogue:[
      {speaker:"You",text:"Excuse me, I'm afraid there's an issue with my order."},
      {speaker:"Waiter",text:"Oh, I'm sorry to hear that. What's the matter?"},
      {speaker:"You",text:"I ordered the grilled salmon, but this appears to be chicken."},
      {speaker:"Waiter",text:"You're absolutely right. Let me sort that out for you straight away."},
      {speaker:"You",text:"Thank you. I appreciate you dealing with it so quickly."},
      {speaker:"Waiter",text:"Not at all. Can I get you anything while you wait?"},
      {speaker:"You",text:"A glass of water would be lovely, thanks."}
    ],
    vocabulary:[
      {word:"I'm afraid",phonetic:"/aɪm əˈfreɪd/",meaning:"me temo que (suavizador)",example:"I'm afraid we're fully booked."},
      {word:"sort out",phonetic:"/sɔːrt aʊt/",meaning:"solucionar, arreglar",example:"Don't worry, I'll sort it out."},
      {word:"straight away",phonetic:"/streɪt əˈweɪ/",meaning:"inmediatamente (UK)",example:"I'll get that for you straight away."},
      {word:"deal with",phonetic:"/diːl wɪð/",meaning:"ocuparse de, gestionar",example:"She's good at dealing with complaints."},
      {word:"lovely",phonetic:"/ˈlʌv.li/",meaning:"estupendo (uso informal UK)",example:"That would be lovely, thanks."}
    ],
    expressions:[
      {phrase:"I'm afraid there's an issue with...",meaning:"Me temo que hay un problema con...",example:"I'm afraid there's an issue with the bill."},
      {phrase:"Let me sort that out.",meaning:"Déjame solucionarlo.",example:"That's wrong — let me sort that out."},
      {phrase:"Not at all.",meaning:"De nada / en absoluto.",example:"Thanks for helping. — Not at all."}
    ],
    grammar:{title:"Polite complaints with softeners",explanation:"En inglés educado usamos 'I'm afraid', 'I think there might be', 'it seems like' para suavizar quejas.",examples:["I'm afraid this isn't what I ordered. ✓","It seems like there's been a mistake. ✓","I think there might be an error on the bill. ✓","This is wrong! ✗ (demasiado directo)"]},
    exercises:[
      {type:"cloze",sentence:"I'm ___ there's been a mistake with my order.",answer:"afraid",options:["afraid","scared","sorry","frightened"]},
      {type:"cloze",sentence:"Let me sort that ___ for you.",answer:"out",options:["out","up","off","away"]},
      {type:"order",words:["that","would","lovely","be","thanks"],answer:"That would be lovely thanks"},
      {type:"translate",es:"Gracias por ocuparte de esto tan rápido.",answer:"Thank you for dealing with this so quickly.",accept:["Thank you for dealing with this so quickly","Thanks for dealing with it so quickly"]},
    ]
  },
  {
    id:7, day:"Day 7", title:"Renting a Flat", level:"B2", topic:"Housing & Negotiations",
    dialogue:[
      {speaker:"Landlord",text:"So, what are your first impressions of the flat?"},
      {speaker:"You",text:"It's quite spacious. I really like the natural light."},
      {speaker:"Landlord",text:"The rent is 1,200 a month, bills not included."},
      {speaker:"You",text:"Would there be any flexibility on the price if I sign a longer lease?"},
      {speaker:"Landlord",text:"I could possibly do 1,100 for a 12-month contract."},
      {speaker:"You",text:"That works for me. When would I be able to move in?"},
      {speaker:"Landlord",text:"The flat's available from the first of next month."}
    ],
    vocabulary:[
      {word:"spacious",phonetic:"/ˈspeɪ.ʃəs/",meaning:"espacioso, amplio",example:"The living room is surprisingly spacious."},
      {word:"flexibility",phonetic:"/ˌflek.sɪˈbɪl.ə.ti/",meaning:"flexibilidad, margen",example:"Is there any flexibility on the deadline?"},
      {word:"lease",phonetic:"/liːs/",meaning:"contrato de alquiler",example:"We signed a two-year lease."},
      {word:"move in",phonetic:"/muːv ɪn/",meaning:"mudarse (a un sitio)",example:"When can we move in?"},
      {word:"available",phonetic:"/əˈveɪ.lə.bəl/",meaning:"disponible",example:"The room is available from July."}
    ],
    expressions:[
      {phrase:"Would there be any flexibility on...?",meaning:"¿Habría margen para negociar...?",example:"Would there be any flexibility on the salary?"},
      {phrase:"That works for me.",meaning:"Me viene bien / me parece bien.",example:"Tuesday at 3? — That works for me."},
      {phrase:"I could possibly do...",meaning:"Podría hacer... (oferta tentativa)",example:"I could possibly do a 10% discount."}
    ],
    grammar:{title:"Conditionals for negotiation",explanation:"En negociaciones usamos condicionales para sonar menos directos y más profesionales.",examples:["Would there be a discount? ✓ (vs Is there a discount?)","I could do 1,100. ✓ (vs I'll do 1,100.)","If I signed for 12 months, would you lower the price? ✓"]},
    exercises:[
      {type:"cloze",sentence:"Would there ___ any flexibility on the rent?",answer:"be",options:["be","is","have","being"]},
      {type:"cloze",sentence:"When would I be ___ to move in?",answer:"able",options:["able","allowed","possible","capable"]},
      {type:"order",words:["for","that","me","works"],answer:"That works for me"},
      {type:"translate",es:"¿Habría margen de negociación en el precio?",answer:"Would there be any flexibility on the price?",accept:["Would there be any flexibility on the price","Is there any flexibility on the price"]},
    ]
  },
  {
    id:8, day:"Day 8", title:"Tech Support Call", level:"B2", topic:"Describing Problems",
    dialogue:[
      {speaker:"Support",text:"Thank you for calling. How can I assist you today?"},
      {speaker:"You",text:"My broadband has been cutting out every few hours since yesterday."},
      {speaker:"Support",text:"I see. Have you tried restarting the router?"},
      {speaker:"You",text:"Yes, I've already tried that, but it didn't make any difference."},
      {speaker:"Support",text:"Let me run a diagnostic on your line. Could you bear with me for a moment?"},
      {speaker:"You",text:"Of course, take your time."},
      {speaker:"Support",text:"It looks like there's an issue at the exchange. I'll escalate this to our engineering team."}
    ],
    vocabulary:[
      {word:"broadband",phonetic:"/ˈbrɔːd.bænd/",meaning:"banda ancha, internet",example:"Our broadband speed is terrible."},
      {word:"cut out",phonetic:"/kʌt aʊt/",meaning:"cortarse, fallar",example:"The call keeps cutting out."},
      {word:"make a difference",phonetic:"/meɪk ə ˈdɪf.rəns/",meaning:"suponer un cambio",example:"Restarting didn't make a difference."},
      {word:"bear with me",phonetic:"/beər wɪð miː/",meaning:"tenga paciencia",example:"Bear with me while I look this up."},
      {word:"escalate",phonetic:"/ˈes.kə.leɪt/",meaning:"elevar, escalar (a otro nivel)",example:"I'll escalate this to management."}
    ],
    expressions:[
      {phrase:"Could you bear with me?",meaning:"¿Puede tener paciencia conmigo?",example:"Bear with me — I'm just pulling up your account."},
      {phrase:"It didn't make any difference.",meaning:"No sirvió de nada.",example:"I tried restarting but it didn't make any difference."},
      {phrase:"It looks like...",meaning:"Parece que...",example:"It looks like there's a fault on the line."}
    ],
    grammar:{title:"Already + Present Perfect for attempted solutions",explanation:"Usamos 'already + have/has + past participle' para indicar que ya intentamos algo.",examples:["I've already tried restarting. ✓","She's already contacted support. ✓","We've already checked the settings. ✓"]},
    exercises:[
      {type:"cloze",sentence:"My broadband has been cutting ___ since yesterday.",answer:"out",options:["out","off","down","up"]},
      {type:"cloze",sentence:"Could you ___ with me for a moment?",answer:"bear",options:["bear","hold","stay","wait"]},
      {type:"order",words:["already","that","I've","tried","but","didn't","it","help"],answer:"I've already tried that but it didn't help"},
      {type:"translate",es:"Parece que hay un problema en la línea.",answer:"It looks like there's an issue on the line.",accept:["It looks like there's an issue on the line","It looks like there's a problem on the line","It seems like there's an issue on the line"]},
    ]
  },
];

// ═══════════════════════════════════════════
// FLASHCARD BANK (expanded 50+)
// ═══════════════════════════════════════════
const FLASHCARD_BANK = [
  {id:1,en:"straightforward",es:"sencillo, directo",sentence:"The instructions are pretty straightforward.",phonetic:"/ˌstreɪtˈfɔːwəd/"},
  {id:2,en:"reliable",es:"fiable",sentence:"She's one of the most reliable people I know.",phonetic:"/rɪˈlaɪəbəl/"},
  {id:3,en:"come across",es:"encontrarse con",sentence:"I came across an interesting article.",phonetic:"/kʌm əˈkrɒs/"},
  {id:4,en:"figure out",es:"averiguar, resolver",sentence:"I can't figure out how to fix this.",phonetic:"/ˈfɪɡər aʊt/"},
  {id:5,en:"accountable",es:"responsable (rendir cuentas)",sentence:"Leaders should be held accountable.",phonetic:"/əˈkaʊntəbəl/"},
  {id:6,en:"get along with",es:"llevarse bien con",sentence:"I get along with most colleagues.",phonetic:"/ɡet əˈlɒŋ wɪð/"},
  {id:7,en:"thorough",es:"exhaustivo, minucioso",sentence:"The report was very thorough.",phonetic:"/ˈθʌrə/"},
  {id:8,en:"put off",es:"posponer / desanimar",sentence:"Don't put off what you can do today.",phonetic:"/pʊt ɒf/"},
  {id:9,en:"carry out",es:"llevar a cabo",sentence:"We need to carry out further research.",phonetic:"/ˈkæri aʊt/"},
  {id:10,en:"awkward",es:"incómodo, embarazoso",sentence:"There was an awkward silence.",phonetic:"/ˈɔːkwəd/"},
  {id:11,en:"bear in mind",es:"tener en cuenta",sentence:"Bear in mind that the deadline is Friday.",phonetic:"/beər ɪn maɪnd/"},
  {id:12,en:"willing",es:"dispuesto",sentence:"She's willing to help if you ask.",phonetic:"/ˈwɪlɪŋ/"},
  {id:13,en:"look forward to",es:"esperar con ilusión",sentence:"I look forward to hearing from you.",phonetic:"/lʊk ˈfɔːwəd tuː/"},
  {id:14,en:"breakthrough",es:"avance importante",sentence:"Scientists announced a breakthrough.",phonetic:"/ˈbreɪkθruː/"},
  {id:15,en:"give up",es:"rendirse",sentence:"Don't give up — you're almost there!",phonetic:"/ɡɪv ʌp/"},
  {id:16,en:"outcome",es:"resultado",sentence:"The outcome was unexpected.",phonetic:"/ˈaʊtkʌm/"},
  {id:17,en:"narrow down",es:"acotar, reducir opciones",sentence:"Let's narrow down the candidates.",phonetic:"/ˈnærəʊ daʊn/"},
  {id:18,en:"self-conscious",es:"cohibido",sentence:"He feels self-conscious about his accent.",phonetic:"/ˌself ˈkɒnʃəs/"},
  {id:19,en:"turn out",es:"resultar ser",sentence:"The party turned out to be fun.",phonetic:"/tɜːn aʊt/"},
  {id:20,en:"deadline",es:"fecha límite",sentence:"We must meet the deadline.",phonetic:"/ˈdedlaɪn/"},
  {id:21,en:"run out of",es:"quedarse sin",sentence:"We've run out of milk.",phonetic:"/rʌn aʊt ɒv/"},
  {id:22,en:"bring up",es:"sacar un tema / criar",sentence:"She brought up an interesting point.",phonetic:"/brɪŋ ʌp/"},
  {id:23,en:"stand out",es:"destacar",sentence:"Her CV really stood out.",phonetic:"/stænd aʊt/"},
  {id:24,en:"end up",es:"acabar, terminar",sentence:"We ended up staying till midnight.",phonetic:"/end ʌp/"},
  {id:25,en:"take for granted",es:"dar por sentado",sentence:"Don't take your health for granted.",phonetic:"/teɪk fər ˈɡrɑːntɪd/"},
  {id:26,en:"overwhelmed",es:"abrumado, desbordado",sentence:"I feel overwhelmed with work.",phonetic:"/ˌəʊvərˈwelmd/"},
  {id:27,en:"subtle",es:"sutil",sentence:"There's a subtle difference between them.",phonetic:"/ˈsʌtəl/"},
  {id:28,en:"resilient",es:"resiliente",sentence:"She's incredibly resilient.",phonetic:"/rɪˈzɪliənt/"},
  {id:29,en:"catch up",es:"ponerse al día",sentence:"Let's catch up over coffee.",phonetic:"/kætʃ ʌp/"},
  {id:30,en:"fall behind",es:"retrasarse, quedarse atrás",sentence:"Don't fall behind on your payments.",phonetic:"/fɔːl bɪˈhaɪnd/"},
  {id:31,en:"get rid of",es:"deshacerse de",sentence:"I need to get rid of these old files.",phonetic:"/ɡet rɪd ɒv/"},
  {id:32,en:"come up with",es:"idear, ocurrírsele",sentence:"She came up with a brilliant solution.",phonetic:"/kʌm ʌp wɪð/"},
  {id:33,en:"regardless",es:"independientemente",sentence:"We'll proceed regardless of the weather.",phonetic:"/rɪˈɡɑːdləs/"},
  {id:34,en:"take into account",es:"tener en cuenta",sentence:"Take his experience into account.",phonetic:"/teɪk ˈɪntə əˈkaʊnt/"},
  {id:35,en:"look up to",es:"admirar a alguien",sentence:"I've always looked up to my mother.",phonetic:"/lʊk ʌp tuː/"},
  {id:36,en:"hold on",es:"esperar / agarrarse",sentence:"Hold on — I'll be right back.",phonetic:"/həʊld ɒn/"},
  {id:37,en:"pick up",es:"recoger / aprender rápido",sentence:"She picked up Spanish really quickly.",phonetic:"/pɪk ʌp/"},
  {id:38,en:"set up",es:"montar, configurar",sentence:"I need to set up the new software.",phonetic:"/set ʌp/"},
  {id:39,en:"keen on",es:"entusiasta de",sentence:"I'm not very keen on horror films.",phonetic:"/kiːn ɒn/"},
  {id:40,en:"cope with",es:"lidiar con, sobrellevar",sentence:"How do you cope with the stress?",phonetic:"/kəʊp wɪð/"},
  {id:41,en:"go through",es:"pasar por / revisar",sentence:"Let's go through the report together.",phonetic:"/ɡəʊ θruː/"},
  {id:42,en:"let down",es:"decepcionar",sentence:"I promise I won't let you down.",phonetic:"/let daʊn/"},
  {id:43,en:"rule out",es:"descartar",sentence:"We can't rule out that possibility.",phonetic:"/ruːl aʊt/"},
  {id:44,en:"make up for",es:"compensar",sentence:"I'll make up for lost time.",phonetic:"/meɪk ʌp fɔːr/"},
  {id:45,en:"drop by",es:"pasarse por un sitio",sentence:"Drop by whenever you're free.",phonetic:"/drɒp baɪ/"},
  {id:46,en:"worthwhile",es:"que merece la pena",sentence:"The course was definitely worthwhile.",phonetic:"/ˌwɜːθˈwaɪl/"},
  {id:47,en:"commitment",es:"compromiso",sentence:"It requires a lot of time and commitment.",phonetic:"/kəˈmɪtmənt/"},
  {id:48,en:"keep up with",es:"seguir el ritmo de",sentence:"It's hard to keep up with the news.",phonetic:"/kiːp ʌp wɪð/"},
  {id:49,en:"point out",es:"señalar, indicar",sentence:"She pointed out a flaw in the plan.",phonetic:"/pɔɪnt aʊt/"},
  {id:50,en:"lay off",es:"despedir / dejar de",sentence:"The company laid off 200 workers.",phonetic:"/leɪ ɒf/"},
];

// ═══════════════════════════════════════════
// PRONUNCIATION SENTENCES (expanded 20)
// ═══════════════════════════════════════════
const PRONUNCIATION_SENTENCES = [
  {text:"I'd like a flat white, please.",tip:"'I'd' suena /aɪd/. La 'w' en 'white' se pronuncia."},
  {text:"Could I have the bill, please?",tip:"'Could' suena /kʊd/ — la 'l' casi no se oye."},
  {text:"I've been working here for three years.",tip:"'Three' con /θ/, no /t/. Practica poniendo la lengua entre los dientes."},
  {text:"She's one of the most reliable people I know.",tip:"'Reliable': acento en la segunda sílaba re-LY-able."},
  {text:"How about checking out that new place?",tip:"Enlaza 'about checking': suena fluido como una sola unidad."},
  {text:"What would you say is your biggest strength?",tip:"'Strength' tiene /ŋkθ/ — una combinación compleja."},
  {text:"I can't figure out how to fix this.",tip:"'Can't' en UK rima con 'aunt': /kɑːnt/."},
  {text:"Bear in mind that the deadline is Friday.",tip:"'Bear' suena como 'bare': /beər/."},
  {text:"The outcome turned out to be quite unexpected.",tip:"'Quite' /kwaɪt/ vs 'quiet' /ˈkwaɪ.ət/ — son distintas."},
  {text:"I'd love to take on more responsibilities.",tip:"'Responsibilities' tiene 6 sílabas: re-spon-si-BIL-i-ties."},
  {text:"I'm afraid there's been a misunderstanding.",tip:"'Misunderstanding' lleva acento en 'stand': mis-un-der-STAN-ding."},
  {text:"Would there be any flexibility on the price?",tip:"'Flexibility' con acento en 'bil': flex-i-BIL-i-ty."},
  {text:"I've already tried that but it didn't help.",tip:"'Already' con acento en 'red': al-RED-y."},
  {text:"She came up with a brilliant solution.",tip:"'Brilliant': 2 sílabas, BRIL-liant. La 'i' suena breve."},
  {text:"Let's catch up over coffee sometime.",tip:"'Catch' tiene el sonido /tʃ/. Practica: cat → catch."},
  {text:"That sounds reasonable. I'll take it.",tip:"'Reasonable': REA-son-able. 3 sílabas fluidas."},
  {text:"Could you bear with me for a moment?",tip:"'Bear with' suena /beər wɪð/. No confundir con 'beer'."},
  {text:"I ended up staying until midnight.",tip:"'Ended up' enlaza: ended-up suena como una palabra."},
  {text:"It's not worth getting upset about.",tip:"'Worth' con /wɜːθ/ — labios redondeados para la /w/."},
  {text:"We need to narrow down our options.",tip:"'Narrow' con /ˈnærəʊ/. La 'a' es corta: NAR-row."},
];

// ═══════════════════════════════════════════
// SM-2 ALGORITHM
// ═══════════════════════════════════════════
function sm2(card, quality) {
  // quality: 0-5 (0=blackout, 5=perfect)
  let {easeFactor=2.5, interval=1, repetitions=0} = card;
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }
  if (easeFactor < 1.3) easeFactor = 1.3;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { easeFactor, interval, repetitions, nextReview: nextReview.toISOString().slice(0,10), lastReview: getToday() };
}

// ═══════════════════════════════════════════
// TTS
// ═══════════════════════════════════════════
function speak(text, rate=0.9) {
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

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0c1117;--s1:#151d27;--s2:#1e2a38;--s3:#283848;
  --ac:#00e5b0;--ac2:#7c5cfc;--ac3:#ff5c5c;--ac4:#ffcf40;--ac5:#4da6ff;
  --tx:#e8ecf1;--tx2:#8899aa;--tx3:#556677;
  --r:14px;--rs:8px;
  --f:'Outfit',sans-serif;--fd:'Playfair Display',serif;
}
body{font-family:var(--f);background:var(--bg);color:var(--tx);max-width:480px;margin:0 auto;min-height:100vh;overflow-x:hidden;-webkit-tap-highlight-color:transparent}
.app{padding-bottom:80px;min-height:100vh}

/* Header */
.hdr{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:var(--fd);font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hdr-right{display:flex;gap:8px;align-items:center}
.streak-pill{display:flex;align-items:center;gap:5px;background:var(--s1);padding:5px 12px;border-radius:20px;font-size:13px;font-weight:600;color:var(--ac4);border:1px solid rgba(255,207,64,.15)}
.xp-pill{display:flex;align-items:center;gap:5px;background:var(--s1);padding:5px 12px;border-radius:20px;font-size:13px;font-weight:600;color:var(--ac2);border:1px solid rgba(124,92,252,.15)}
.lvl-bar{margin:0 20px 8px;height:4px;background:var(--s2);border-radius:2px;overflow:hidden}
.lvl-fill{height:100%;background:linear-gradient(90deg,var(--ac2),var(--ac));border-radius:2px;transition:width .6s}
.lvl-label{margin:0 20px 12px;font-size:11px;color:var(--tx3);display:flex;justify-content:space-between}

/* Bottom Nav */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(12,17,23,.96);backdrop-filter:blur(20px);border-top:1px solid var(--s2);display:flex;justify-content:space-around;padding:6px 0 max(6px,env(safe-area-inset-bottom));z-index:100}
.bnav-i{display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px 8px;cursor:pointer;border:none;background:none;color:var(--tx3);font-family:var(--f);font-size:9px;font-weight:500;transition:all .2s}
.bnav-i.on{color:var(--ac)}
.bnav-i.on svg{stroke:var(--ac)}
.bnav-i svg{width:20px;height:20px;transition:.2s}

/* Sections */
.sec{padding:0 20px 20px}
.sec-t{font-family:var(--fd);font-size:24px;font-weight:700;margin-bottom:3px}
.sec-s{color:var(--tx2);font-size:13px;margin-bottom:16px}

/* Cards */
.card{background:var(--s1);border-radius:var(--r);padding:16px;margin-bottom:12px;border:1px solid transparent;transition:.3s}
.card:hover{border-color:var(--s3)}
.card-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:var(--ac);margin-bottom:6px}
.card-t{font-family:var(--fd);font-size:18px;font-weight:600;margin-bottom:3px}

/* Dialogue */
.dia-line{display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;animation:fiu .3s ease both}
.dia-line:nth-child(2){animation-delay:.04s}.dia-line:nth-child(3){animation-delay:.08s}.dia-line:nth-child(4){animation-delay:.12s}.dia-line:nth-child(5){animation-delay:.16s}.dia-line:nth-child(6){animation-delay:.2s}.dia-line:nth-child(7){animation-delay:.24s}
.ava{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
.ava-y{background:linear-gradient(135deg,var(--ac),#00ffc8);color:var(--bg)}
.ava-o{background:linear-gradient(135deg,var(--ac2),#9b7cfc);color:#fff}
.bub{background:var(--s2);border-radius:12px 12px 12px 3px;padding:9px 12px;font-size:13px;line-height:1.5;flex:1;cursor:pointer;transition:.2s;position:relative}
.bub:hover{background:var(--s3)}
.bub.playing{border:1px solid var(--ac);box-shadow:0 0 16px rgba(0,229,176,.1)}
.spk-n{font-size:10px;font-weight:600;color:var(--ac);margin-bottom:1px}

/* Tabs */
.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}
.tab{flex-shrink:0;padding:7px 14px;border-radius:18px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--s2);background:var(--s1);color:var(--tx2);transition:.2s;font-family:var(--f)}
.tab.on{background:linear-gradient(135deg,var(--ac),#00ffc8);color:var(--bg);border-color:transparent}
.stabs{display:flex;gap:3px;margin-bottom:14px;background:var(--s1);padding:3px;border-radius:10px}
.stab{flex:1;padding:7px 4px;text-align:center;font-size:10px;font-weight:600;border-radius:8px;cursor:pointer;color:var(--tx2);border:none;background:none;font-family:var(--f);transition:.2s}
.stab.on{background:var(--s2);color:var(--tx)}

/* Vocab */
.vi{background:var(--s2);border-radius:var(--rs);padding:12px;margin-bottom:8px;cursor:pointer;transition:.2s}
.vi:hover{background:var(--s3)}
.vw{font-weight:700;font-size:15px;color:var(--ac)}
.vp{font-size:11px;color:var(--tx2);margin-left:6px}
.vm{font-size:12px;color:var(--tx);margin-top:3px}
.ve{font-size:11px;color:var(--tx2);margin-top:5px;font-style:italic;padding-left:8px;border-left:2px solid var(--ac)}

/* Expression */
.ei{background:linear-gradient(135deg,rgba(124,92,252,.08),rgba(0,229,176,.03));border:1px solid rgba(124,92,252,.15);border-radius:var(--rs);padding:12px;margin-bottom:8px;cursor:pointer}
.ep{font-weight:700;font-size:14px;color:var(--ac2)}

/* Grammar */
.gbox{background:linear-gradient(135deg,rgba(0,229,176,.06),rgba(0,229,176,.01));border:1px solid rgba(0,229,176,.15);border-radius:var(--r);padding:16px}
.gt{font-family:var(--fd);font-size:16px;font-weight:600;color:var(--ac);margin-bottom:6px}
.gtext{font-size:12px;line-height:1.6;color:var(--tx2)}
.gex{font-size:12px;padding:3px 0;color:var(--tx);cursor:pointer}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 20px;border-radius:10px;font-family:var(--f);font-size:13px;font-weight:600;cursor:pointer;transition:.2s;border:none}
.btn-p{background:linear-gradient(135deg,var(--ac),#00ffc8);color:var(--bg)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,229,176,.25)}
.btn-s{background:var(--s2);color:var(--tx)}
.btn-sm{padding:7px 14px;font-size:12px}
.btn-f{width:100%}
.btn:disabled{opacity:.35;cursor:not-allowed}

/* Play all */
.play-all{display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(0,229,176,.08);border:1px solid rgba(0,229,176,.2);border-radius:8px;color:var(--ac);font-family:var(--f);font-size:12px;font-weight:600;cursor:pointer;margin-bottom:12px;transition:.2s}
.play-all:hover{background:rgba(0,229,176,.15)}

/* Pronunciation */
.pcard{background:var(--s1);border-radius:var(--r);padding:20px;text-align:center;margin-bottom:14px}
.psent{font-family:var(--fd);font-size:19px;line-height:1.5;margin-bottom:6px}
.ptip{font-size:12px;color:var(--ac4);background:rgba(255,207,64,.06);padding:6px 12px;border-radius:6px;margin-bottom:16px}
.mic{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--ac3),#ff8888);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;transition:.3s;box-shadow:0 4px 24px rgba(255,92,92,.25)}
.mic.rec{animation:pulse 1.2s infinite}
.mic:hover{transform:scale(1.05)}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,92,92,.5)}70%{box-shadow:0 0 0 18px rgba(255,92,92,0)}100%{box-shadow:0 0 0 0 rgba(255,92,92,0)}}
.rbox{background:var(--s2);border-radius:var(--rs);padding:14px;margin-top:10px;text-align:left}
.rlbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--tx3);margin-bottom:4px}
.scircle{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700}
.sc-g{background:rgba(0,229,176,.12);color:var(--ac);border:2px solid var(--ac)}
.sc-y{background:rgba(255,207,64,.12);color:var(--ac4);border:2px solid var(--ac4)}
.sc-r{background:rgba(255,92,92,.12);color:var(--ac3);border:2px solid var(--ac3)}

/* Flashcards */
.fc{background:var(--s1);border-radius:18px;padding:28px 20px;min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:.4s;border:1px solid var(--s2)}
.fc:hover{border-color:var(--ac)}
.fc-w{font-family:var(--fd);font-size:26px;font-weight:700;margin-bottom:6px}
.fc-ph{font-size:15px;color:var(--tx2);margin-bottom:12px}
.fc-h{font-size:12px;color:var(--tx3);margin-top:auto}
.fc-m{font-size:18px;color:var(--ac);margin-bottom:10px}
.fc-s{font-size:13px;color:var(--tx2);font-style:italic;line-height:1.4}
.fc-prog{display:flex;justify-content:center;gap:5px;margin-bottom:14px}
.fc-dot{width:7px;height:7px;border-radius:50%;background:var(--s2)}
.fc-dot.done{background:var(--ac)}.fc-dot.cur{background:var(--ac4);box-shadow:0 0 6px rgba(255,207,64,.4)}
.rate-btns{display:flex;gap:8px;margin-top:16px}
.rate-btn{flex:1;padding:10px;border-radius:10px;border:none;font-family:var(--f);font-size:12px;font-weight:600;cursor:pointer;transition:.2s}
.rate-btn:hover{transform:translateY(-2px)}
.r-hard{background:rgba(255,92,92,.12);color:var(--ac3)}
.r-ok{background:rgba(255,207,64,.12);color:var(--ac4)}
.r-easy{background:rgba(0,229,176,.12);color:var(--ac)}
.fc-due{font-size:11px;color:var(--tx3);text-align:center;margin-top:8px}

/* Chat */
.chat-c{display:flex;flex-direction:column;height:calc(100vh - 160px)}
.chat-msgs{flex:1;overflow-y:auto;padding:0 0 12px;display:flex;flex-direction:column;gap:10px}
.cmsg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;animation:fiu .3s ease both}
.cmsg.u{background:linear-gradient(135deg,var(--ac),#00ffc8);color:var(--bg);align-self:flex-end;border-bottom-right-radius:3px}
.cmsg.a{background:var(--s2);color:var(--tx);align-self:flex-start;border-bottom-left-radius:3px}
.cmsg.sys{background:rgba(124,92,252,.08);border:1px solid rgba(124,92,252,.15);color:var(--tx2);align-self:center;text-align:center;font-size:12px;max-width:92%}
.chat-in{display:flex;gap:8px;padding-top:10px;border-top:1px solid var(--s2)}
.cinput{flex:1;background:var(--s1);border:1px solid var(--s2);border-radius:10px;padding:10px 14px;color:var(--tx);font-family:var(--f);font-size:13px;outline:none;transition:.2s}
.cinput:focus{border-color:var(--ac)}
.cinput::placeholder{color:var(--tx3)}
.sendbtn{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,var(--ac2),#9b7cfc);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;flex-shrink:0}
.sendbtn:hover{transform:scale(1.05)}.sendbtn:disabled{opacity:.35}

/* Exercises */
.ex-q{font-size:15px;line-height:1.5;margin-bottom:14px;font-weight:500}
.ex-opts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.ex-opt{padding:9px 16px;border-radius:10px;background:var(--s2);border:1px solid var(--s3);color:var(--tx);font-family:var(--f);font-size:13px;cursor:pointer;transition:.2s;font-weight:500}
.ex-opt:hover{border-color:var(--ac);background:var(--s3)}
.ex-opt.correct{background:rgba(0,229,176,.15);border-color:var(--ac);color:var(--ac)}
.ex-opt.wrong{background:rgba(255,92,92,.12);border-color:var(--ac3);color:var(--ac3)}
.ex-opt.selected{border-color:var(--ac5);background:rgba(77,166,255,.1)}
.word-bank{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;min-height:40px;padding:8px;border-radius:8px;border:1px dashed var(--s3)}
.word-chip{padding:6px 12px;border-radius:8px;background:var(--s2);border:1px solid var(--s3);cursor:pointer;font-size:12px;font-weight:500;transition:.2s}
.word-chip:hover{border-color:var(--ac5)}
.word-chip.used{opacity:.3;pointer-events:none}
.answer-area{display:flex;flex-wrap:wrap;gap:6px;min-height:40px;padding:8px;border-radius:8px;background:var(--s2);margin-bottom:10px}
.answer-chip{padding:6px 12px;border-radius:8px;background:var(--s3);border:1px solid var(--ac5);cursor:pointer;font-size:12px;font-weight:500}
.ex-input{width:100%;padding:10px 14px;background:var(--s1);border:1px solid var(--s2);border-radius:10px;color:var(--tx);font-family:var(--f);font-size:14px;margin-bottom:10px;outline:none}
.ex-input:focus{border-color:var(--ac)}
.ex-fb{padding:10px 14px;border-radius:8px;margin-top:8px;font-size:13px;line-height:1.5}
.ex-fb.ok{background:rgba(0,229,176,.08);border:1px solid rgba(0,229,176,.2);color:var(--ac)}
.ex-fb.no{background:rgba(255,92,92,.08);border:1px solid rgba(255,92,92,.2);color:var(--ac3)}

/* Dashboard */
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.stat-card{background:var(--s1);border-radius:var(--r);padding:16px;text-align:center}
.stat-num{font-family:var(--fd);font-size:28px;font-weight:700}
.stat-lbl{font-size:11px;color:var(--tx2);margin-top:2px}
.ach-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ach{background:var(--s1);border-radius:var(--rs);padding:12px;display:flex;gap:10px;align-items:center;opacity:.4;transition:.3s}
.ach.unlocked{opacity:1;border:1px solid rgba(0,229,176,.2)}
.ach-icon{font-size:24px}
.ach-t{font-size:12px;font-weight:600}
.ach-d{font-size:10px;color:var(--tx2)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:16px}
.cal-day{width:100%;aspect-ratio:1;border-radius:4px;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--tx3)}
.cal-day.active{background:rgba(0,229,176,.2);color:var(--ac);font-weight:600}
.cal-day.today{border:1px solid var(--ac)}

/* Onboarding */
.ob-wrap{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 30px;text-align:center}
.ob-emoji{font-size:64px;margin-bottom:16px}
.ob-title{font-family:var(--fd);font-size:28px;font-weight:700;margin-bottom:8px}
.ob-sub{color:var(--tx2);font-size:14px;margin-bottom:32px;line-height:1.5}
.ob-input{width:100%;max-width:300px;padding:12px 16px;background:var(--s1);border:1px solid var(--s2);border-radius:12px;color:var(--tx);font-family:var(--f);font-size:16px;text-align:center;outline:none;margin-bottom:20px}
.ob-input:focus{border-color:var(--ac)}

/* Animations */
@keyframes fiu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.dots{display:flex;gap:4px;padding:6px 0}
.dots span{width:7px;height:7px;border-radius:50%;background:var(--tx3);animation:db 1.4s infinite ease-in-out both}
.dots span:nth-child(1){animation-delay:-.32s}.dots span:nth-child(2){animation-delay:-.16s}
@keyframes db{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}

/* XP toast */
.xp-toast{position:fixed;top:60px;left:50%;transform:translateX(-50%);background:var(--s1);border:1px solid rgba(0,229,176,.3);padding:8px 20px;border-radius:20px;font-size:13px;font-weight:600;color:var(--ac);z-index:300;animation:toastIn .4s ease,toastOut .4s ease 1.6s forwards;box-shadow:0 4px 20px rgba(0,0,0,.3)}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes toastOut{to{opacity:0;transform:translateX(-50%) translateY(-20px)}}

.qp{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.qp-btn{padding:6px 12px;border-radius:8px;background:var(--s2);border:1px solid var(--s3);color:var(--tx2);font-family:var(--f);font-size:11px;cursor:pointer;transition:.2s}
.qp-btn:hover{border-color:var(--ac);color:var(--tx)}
`;

// ═══════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════
const I = {
  Book:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Mic:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Cards:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/></svg>,
  Chat:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Dash:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  Pen:()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Play:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Send:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  MicL:()=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Vol:()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
};

// ═══════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════
function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  return (
    <div className="ob-wrap">
      <div className="ob-emoji">🌍</div>
      <div className="ob-title">Welcome to SpeakFlow</div>
      <div className="ob-sub">Tu compañero diario para dominar el inglés.<br/>Lecciones, pronunciación, vocabulario y tutor IA.</div>
      <input className="ob-input" placeholder="Tu nombre..." value={name} onChange={e => setName(e.target.value)} autoFocus />
      <button className="btn btn-p btn-f" style={{maxWidth:300}} disabled={!name.trim()} onClick={() => onComplete(name.trim())}>
        Empezar a aprender
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// LESSONS PAGE
// ═══════════════════════════════════════════
function LessonsPage({ user, grantXP, markLessonComplete }) {
  const [li, setLi] = useState(0);
  const [sub, setSub] = useState("dialogue");
  const [pi, setPi] = useState(-1);
  const lesson = LESSONS_DB[li];

  const playLine = (t,i) => { setPi(i); const u=speak(t); if(u) u.onend=()=>setPi(-1); else setTimeout(()=>setPi(-1),2000); };
  const playAll = () => { let d=0; lesson.dialogue.forEach((l,i)=>{ setTimeout(()=>playLine(l.text,i),d); d+=l.text.length*60+700; }); };
  const ava = s => s==="You" ? <div className="ava ava-y">TÚ</div> : <div className="ava ava-o">{s[0]}</div>;
  const isComplete = user.completedLessons.includes(lesson.id);

  return (
    <div className="sec">
      <div className="sec-t">Lecciones</div>
      <div className="sec-s">{LESSONS_DB.length} lecciones · Nivel {lesson.level} · {lesson.topic}</div>
      <div className="tabs">
        {LESSONS_DB.map((l,i) => (
          <button key={l.id} className={`tab ${i===li?'on':''}`} onClick={()=>{setLi(i);setSub("dialogue")}}>
            {user.completedLessons.includes(l.id) ? '✅ ' : ''}{l.day}
          </button>
        ))}
      </div>
      <div className="stabs">
        {["dialogue","vocabulary","expressions","grammar","exercises"].map(t => (
          <button key={t} className={`stab ${sub===t?'on':''}`} onClick={()=>setSub(t)}>
            {t==='dialogue'?'💬':t==='vocabulary'?'📖':t==='expressions'?'💡':t==='grammar'?'📐':'✍️'} {t==='dialogue'?'Diálogo':t==='vocabulary'?'Vocab':t==='expressions'?'Expr.':t==='grammar'?'Gram.':'Ejerc.'}
          </button>
        ))}
      </div>

      {sub==="dialogue" && <div>
        <button className="play-all" onClick={playAll}><I.Play/> Reproducir diálogo</button>
        {lesson.dialogue.map((l,i) => (
          <div className="dia-line" key={i}>
            {ava(l.speaker)}
            <div className={`bub ${pi===i?'playing':''}`} onClick={()=>playLine(l.text,i)}>
              <div className="spk-n">{l.speaker}</div>{l.text}
            </div>
          </div>
        ))}
        <div style={{fontSize:11,color:'var(--tx3)',textAlign:'center',marginTop:8}}>Toca cualquier línea para escuchar</div>
        {!isComplete && <button className="btn btn-p btn-f" style={{marginTop:12}} onClick={()=>{markLessonComplete(lesson.id);grantXP(50,"lesson");}}>
          ✅ Marcar lección como completada (+50 XP)
        </button>}
        {isComplete && <div style={{textAlign:'center',marginTop:12,color:'var(--ac)',fontSize:13,fontWeight:600}}>✅ Lección completada</div>}
      </div>}

      {sub==="vocabulary" && <div>
        {lesson.vocabulary.map((v,i) => (
          <div className="vi" key={i} onClick={()=>speak(v.word)}>
            <span className="vw">{v.word}</span><span className="vp">{v.phonetic}</span>
            <span style={{marginLeft:6,cursor:'pointer'}} onClick={e=>{e.stopPropagation();speak(v.example)}}><I.Vol/></span>
            <div className="vm">{v.meaning}</div>
            <div className="ve">"{v.example}"</div>
          </div>
        ))}
      </div>}

      {sub==="expressions" && <div>
        {lesson.expressions.map((e,i) => (
          <div className="ei" key={i} onClick={()=>speak(e.phrase)}>
            <div className="ep">{e.phrase}</div>
            <div className="vm">{e.meaning}</div>
            <div className="ve">"{e.example}"</div>
          </div>
        ))}
      </div>}

      {sub==="grammar" && <div className="gbox">
        <div className="gt">{lesson.grammar.title}</div>
        <div className="gtext">{lesson.grammar.explanation}</div>
        <div style={{marginTop:10}}>
          {lesson.grammar.examples.map((ex,i) => <div className="gex" key={i} onClick={()=>speak(ex.replace(/[✓✗]/g,''))}>• {ex}</div>)}
        </div>
      </div>}

      {sub==="exercises" && <ExercisesSection exercises={lesson.exercises} grantXP={grantXP} lessonId={lesson.id} />}
    </div>
  );
}

// ═══════════════════════════════════════════
// EXERCISES
// ═══════════════════════════════════════════
function ExercisesSection({ exercises, grantXP, lessonId }) {
  const [ei, setEi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selected, setSelected] = useState(null);
  const [orderWords, setOrderWords] = useState([]);
  const [transInput, setTransInput] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const ex = exercises[ei];

  const checkCloze = (opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const correct = opt === ex.answer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const checkOrder = () => {
    if (answered) return;
    setAnswered(true);
    const attempt = orderWords.join(' ').toLowerCase().replace(/[^\w\s]/g,'');
    const target = ex.answer.toLowerCase().replace(/[^\w\s]/g,'');
    const correct = attempt === target;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const checkTranslate = () => {
    if (answered) return;
    setAnswered(true);
    const attempt = transInput.trim().toLowerCase().replace(/[?.!,]/g,'');
    const correct = ex.accept.some(a => {
      const t = a.toLowerCase().replace(/[?.!,]/g,'');
      return attempt === t || attempt.includes(t) || t.includes(attempt);
    });
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    if (ei + 1 >= exercises.length) {
      setDone(true);
      grantXP(score * 10, "exercises");
    } else {
      setEi(ei + 1);
      setAnswered(false);
      setSelected(null);
      setOrderWords([]);
      setTransInput("");
      setIsCorrect(false);
    }
  };

  if (done) return (
    <div className="card" style={{textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:8}}>🎉</div>
      <div className="card-t">Ejercicios completados</div>
      <div style={{fontSize:13,color:'var(--tx2)',marginTop:4}}>{score}/{exercises.length} correctas · +{score*10} XP</div>
      <button className="btn btn-p btn-f" style={{marginTop:14}} onClick={()=>{setEi(0);setScore(0);setDone(false);setAnswered(false);setSelected(null);setOrderWords([]);setTransInput("")}}>
        Repetir ejercicios
      </button>
    </div>
  );

  return (
    <div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10}}>Ejercicio {ei+1} de {exercises.length}</div>

      {ex.type === "cloze" && <div>
        <div className="ex-q">Completa: <span style={{color:'var(--ac4)'}}>{ex.sentence.replace('___','______')}</span></div>
        <div className="ex-opts">
          {ex.options.map(o => (
            <button key={o} className={`ex-opt ${answered && o===ex.answer ? 'correct' : ''} ${answered && o===selected && o!==ex.answer ? 'wrong' : ''} ${!answered && o===selected ? 'selected' : ''}`}
              onClick={() => checkCloze(o)}>{o}</button>
          ))}
        </div>
      </div>}

      {ex.type === "order" && <div>
        <div className="ex-q">Ordena las palabras para formar una frase:</div>
        <div className="answer-area" style={{minHeight:40}}>
          {orderWords.map((w,i) => <span key={i} className="answer-chip" onClick={() => setOrderWords(orderWords.filter((_,j)=>j!==i))}>{w}</span>)}
        </div>
        <div className="word-bank">
          {ex.words.map((w,i) => <span key={i} className={`word-chip ${orderWords.includes(w)?'used':''}`} onClick={() => !orderWords.includes(w) && setOrderWords([...orderWords,w])}>{w}</span>)}
        </div>
        {!answered && <button className="btn btn-p btn-sm" onClick={checkOrder} disabled={orderWords.length===0}>Comprobar</button>}
      </div>}

      {ex.type === "translate" && <div>
        <div className="ex-q">Traduce al inglés: <span style={{color:'var(--ac4)'}}>{ex.es}</span></div>
        <input className="ex-input" value={transInput} onChange={e=>setTransInput(e.target.value)} placeholder="Type your translation..." onKeyDown={e=>e.key==='Enter'&&checkTranslate()} />
        {!answered && <button className="btn btn-p btn-sm" onClick={checkTranslate} disabled={!transInput.trim()}>Comprobar</button>}
      </div>}

      {answered && <div className={`ex-fb ${isCorrect?'ok':'no'}`}>
        {isCorrect ? '✅ ¡Correcto!' : `❌ La respuesta correcta es: "${ex.answer}"`}
      </div>}

      {answered && <button className="btn btn-s btn-f" style={{marginTop:10}} onClick={next}>
        {ei+1 >= exercises.length ? 'Ver resultados' : 'Siguiente →'}
      </button>}
    </div>
  );
}

// ═══════════════════════════════════════════
// PRONUNCIATION PAGE
// ═══════════════════════════════════════════
function PronunciationPage({ grantXP, updatePronScore }) {
  const [si, setSi] = useState(0);
  const [rec, setRec] = useState(false);
  const [trans, setTrans] = useState("");
  const [score, setScore] = useState(null);
  const [fb, setFb] = useState("");
  const ref = useRef(null);
  const cur = PRONUNCIATION_SENTENCES[si];

  const calcScore = (o, s) => {
    const ow = o.toLowerCase().replace(/[^\w\s']/g,'').split(/\s+/);
    const sw = s.toLowerCase().replace(/[^\w\s']/g,'').split(/\s+/);
    let m = 0;
    ow.forEach((w,i) => { if(sw[i]===w) m++; else if(sw.includes(w)) m+=0.5; });
    return Math.min(100, Math.round((m/ow.length)*100));
  };

  const genFb = (o,s,p) => {
    if (p>=90) return "¡Excelente pronunciación! Suenas muy natural. 🎯";
    if (p>=70) { const ow=o.toLowerCase().replace(/[^\w\s']/g,'').split(/\s+/); const sw=s.toLowerCase().replace(/[^\w\s']/g,'').split(/\s+/); const missed=ow.filter(w=>!sw.includes(w)); return missed.length ? `Bien, pero revisa: "${missed.slice(0,3).join('", "')}".` : "¡Casi! Intenta enlazar más las palabras."; }
    if (p>=40) return "Vas bien. Escucha despacio e imita cada parte.";
    return "Sin prisa — pulsa 🔊 para escuchar despacio y repite por partes.";
  };

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setFb("Tu navegador no soporta reconocimiento de voz. Usa Chrome."); return; }
    const r = new SR(); r.lang='en-GB'; r.continuous=false; r.interimResults=false;
    r.onresult = e => { const t=e.results[0][0].transcript; setTrans(t); const p=calcScore(cur.text,t); setScore(p); setFb(genFb(cur.text,t,p)); updatePronScore(p); setRec(false); if(p>=70) grantXP(20,"pronunciation"); };
    r.onerror = () => { setRec(false); setFb("No detecté audio. Habla claro y cerca del micro."); };
    r.onend = () => setRec(false);
    ref.current = r; setTrans(""); setScore(null); setFb(""); setRec(true); r.start();
  };

  const stopRec = () => { if(ref.current) ref.current.stop(); setRec(false); };
  const next = () => { setSi((si+1)%PRONUNCIATION_SENTENCES.length); setTrans(""); setScore(null); setFb(""); };
  const sc = score>=80?'sc-g':score>=50?'sc-y':'sc-r';

  return (
    <div className="sec">
      <div className="sec-t">Pronunciación</div>
      <div className="sec-s">Frase {si+1} de {PRONUNCIATION_SENTENCES.length}</div>
      <div className="pcard">
        <div className="psent">{cur.text}</div>
        <button className="btn btn-sm btn-s" onClick={()=>speak(cur.text,0.7)} style={{marginBottom:10}}>🔊 Escuchar despacio</button>
        <div className="ptip">💡 {cur.tip}</div>
        <button className={`mic ${rec?'rec':''}`} onClick={rec?stopRec:startRec}><I.MicL/></button>
        <div style={{fontSize:12,color:'var(--tx2)'}}>{rec?"Escuchando... habla ahora":"Pulsa para grabar"}</div>
      </div>
      {trans && <div className="rbox"><div className="rlbl">Lo que dijiste:</div><div style={{fontSize:14}}>{trans}</div></div>}
      {score!==null && <div style={{textAlign:'center',marginTop:10}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <div className={`scircle ${sc}`}>{score}%</div>
          <div style={{textAlign:'left'}}><div style={{fontWeight:600,fontSize:14}}>{score>=80?'¡Genial!':score>=50?'Casi':'Sigue practicando'}</div><div style={{fontSize:11,color:'var(--tx2)'}}>Precisión</div></div>
        </div>
        <div style={{marginTop:8,fontSize:13,color:'var(--tx2)',lineHeight:1.5}}>{fb}</div>
      </div>}
      <div style={{display:'flex',gap:8,marginTop:16}}>
        <button className="btn btn-s btn-f" onClick={()=>{setTrans("");setScore(null);setFb("")}}>🔄 Repetir</button>
        <button className="btn btn-p btn-f" onClick={next}>Siguiente →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// FLASHCARDS PAGE (SM-2)
// ═══════════════════════════════════════════
function FlashcardsPage({ user, setUser, grantXP }) {
  const today = getToday();
  const dueCards = useMemo(() => {
    return FLASHCARD_BANK.filter(c => {
      const prog = user.flashcardProgress[c.id];
      if (!prog) return true;
      return prog.nextReview <= today;
    }).slice(0, 10);
  }, [user.flashcardProgress, today]);

  const [cards] = useState(() => dueCards.length ? dueCards : FLASHCARD_BANK.sort(() => Math.random() - 0.5).slice(0, 10));
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const card = cards[ci];

  const rate = (q) => {
    const quality = q === 'easy' ? 5 : q === 'ok' ? 3 : 1;
    const prev = user.flashcardProgress[card.id] || {};
    const updated = sm2(prev, quality);
    const newProgress = { ...user.flashcardProgress, [card.id]: updated };
    setUser(u => ({ ...u, flashcardProgress: newProgress }));
    setResults([...results, { card, quality: q }]);
    setFlipped(false);
    if (ci + 1 >= cards.length) {
      const wordsLearned = results.filter(r => r.quality !== 'hard').length + (q !== 'hard' ? 1 : 0);
      grantXP(wordsLearned * 5, "flashcards");
      setDone(true);
    } else { setCi(ci + 1); }
  };

  const restart = () => { setCi(0); setFlipped(false); setResults([]); setDone(false); };

  if (done) {
    const easy = results.filter(r => r.quality==='easy').length;
    const ok = results.filter(r => r.quality==='ok').length;
    const hard = results.filter(r => r.quality==='hard').length;
    return (
      <div className="sec">
        <div className="sec-t">Sesión completa</div>
        <div className="sec-s">{cards.length} tarjetas revisadas</div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:8}}>🎉</div>
          <div className="card-t">¡Bien hecho!</div>
          <div style={{display:'flex',justifyContent:'center',gap:20,margin:'14px 0'}}>
            <div><div style={{fontSize:24,fontWeight:700,color:'var(--ac)'}}>{easy}</div><div style={{fontSize:11,color:'var(--tx2)'}}>Fácil</div></div>
            <div><div style={{fontSize:24,fontWeight:700,color:'var(--ac4)'}}>{ok}</div><div style={{fontSize:11,color:'var(--tx2)'}}>Regular</div></div>
            <div><div style={{fontSize:24,fontWeight:700,color:'var(--ac3)'}}>{hard}</div><div style={{fontSize:11,color:'var(--tx2)'}}>Difícil</div></div>
          </div>
          {hard > 0 && <div style={{fontSize:12,color:'var(--tx2)',marginBottom:12}}>Repasar: {results.filter(r=>r.quality==='hard').map(r=>r.card.en).join(', ')}</div>}
          <button className="btn btn-p btn-f" onClick={restart}>Nueva ronda</button>
        </div>
      </div>
    );
  }

  if (!card) return <div className="sec"><div className="sec-t">Flashcards</div><div style={{textAlign:'center',padding:40,color:'var(--tx2)'}}>No hay tarjetas pendientes hoy. ¡Vuelve mañana!</div></div>;

  const prog = user.flashcardProgress[card.id];
  const interval = prog ? `Próximo repaso: ${prog.interval} día(s)` : 'Primera vez';

  return (
    <div className="sec">
      <div className="sec-t">Flashcards</div>
      <div className="sec-s">Vocabulario B1-B2 · Repetición espaciada SM-2</div>
      <div className="fc-prog">
        {cards.map((_,i) => <div key={i} className={`fc-dot ${i<ci?'done':i===ci?'cur':''}`}/>)}
      </div>
      <div className="fc" onClick={()=>{setFlipped(!flipped);speak(card.en)}}>
        {!flipped ? <>
          <div className="fc-w">{card.en}</div>
          <div className="fc-ph">{card.phonetic}</div>
          <div className="fc-h">Toca para ver la traducción</div>
        </> : <>
          <div className="fc-w" style={{fontSize:20}}>{card.en}</div>
          <div className="fc-m">{card.es}</div>
          <div className="fc-s">"{card.sentence}"</div>
        </>}
      </div>
      {flipped && <div className="rate-btns">
        <button className="rate-btn r-hard" onClick={()=>rate('hard')}>😤 Difícil</button>
        <button className="rate-btn r-ok" onClick={()=>rate('ok')}>🤔 Regular</button>
        <button className="rate-btn r-easy" onClick={()=>rate('easy')}>😎 Fácil</button>
      </div>}
      <div className="fc-due">{interval}</div>
      <div style={{textAlign:'center',marginTop:8}}>
        <button className="btn btn-sm btn-s" onClick={()=>speak(card.sentence)}>🔊 Escuchar ejemplo</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TUTOR PAGE
// ═══════════════════════════════════════════
function TutorPage({ user, setUser, grantXP }) {
  const [msgs, setMsgs] = useState([
    {role:'system',content:"👋 Hi! I'm your English tutor. Write anything in English and I'll help you improve — I'll correct mistakes and suggest better expressions. ¡Escríbeme en inglés!"}
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  useEffect(() => { if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(p => [...p, {role:'user',content:userMsg}]);
    setLoading(true);
    grantXP(5, "tutor");
    try {
      const apiMsgs = msgs.filter(m=>m.role!=='system').concat([{role:'user',content:userMsg}]).map(m=>({role:m.role==='user'?'user':'assistant',content:m.content}));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`You are a warm, encouraging English tutor for a B1-B2 Spanish speaker named ${user.userName||'the student'}. Rules:
1. Respond primarily in English. Include Spanish translations in parentheses for corrections.
2. If errors: start with "✏️ Small fix: [correction]" and explain briefly.
3. If correct: "✅ Perfect sentence!"
4. Continue conversation naturally, ask follow-ups.
5. Occasionally: "💡 New expression: ..." relevant to the topic.
6. Keep responses concise (2-4 sentences for conversation part).
7. Be encouraging. Never make them feel bad about mistakes.
8. If they write in Spanish, gently encourage English and help translate.`,
          messages: apiMsgs
        })
      });
      const data = await res.json();
      const reply = data.content?.map(c=>c.text||'').join('') || "Sorry, try again!";
      setMsgs(p => [...p, {role:'assistant',content:reply}]);
      setUser(u => ({...u, tutorHistory: [...u.tutorHistory, {date:getToday(),msg:userMsg}]}));
    } catch {
      setMsgs(p => [...p, {role:'assistant',content:"Connection issue — please try again! 🙏"}]);
    }
    setLoading(false);
  };

  const quickPrompts = ["Let's talk about my weekend","Help me with job interview practice","Teach me phrasal verbs","Describe my daily routine in English"];

  return (
    <div className="sec">
      <div className="sec-t">English Tutor</div>
      <div className="sec-s">Practica conversación con correcciones en tiempo real</div>
      <div className="chat-c">
        <div className="chat-msgs" ref={chatRef}>
          {msgs.map((m,i) => <div key={i} className={`cmsg ${m.role==='user'?'u':m.role==='system'?'sys':'a'}`}>{m.content}</div>)}
          {loading && <div className="cmsg a"><div className="dots"><span/><span/><span/></div></div>}
          {msgs.length===1 && <div className="qp">{quickPrompts.map((p,i) => <button key={i} className="qp-btn" onClick={()=>setInput(p)}>{p}</button>)}</div>}
        </div>
        <div className="chat-in">
          <input className="cinput" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())} placeholder="Write in English..." disabled={loading}/>
          <button className="sendbtn" onClick={send} disabled={!input.trim()||loading}><I.Send/></button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════
function DashboardPage({ user }) {
  const today = getToday();
  const level = getLevel(user.xp);
  const wordsInProgress = Object.keys(user.flashcardProgress).length;
  const masteredWords = Object.values(user.flashcardProgress).filter(p => p.repetitions >= 3).length;

  // Calendar (last 35 days)
  const calDays = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    calDays.push({ date: ds, active: user.activeDates.includes(ds), isToday: ds === today, day: d.getDate() });
  }

  return (
    <div className="sec">
      <div className="sec-t">Tu progreso</div>
      <div className="sec-s">Nivel {level}: {LEVEL_NAMES[level-1]} · {user.xp} XP total</div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num" style={{color:'var(--ac4)'}}>{user.streak}</div><div className="stat-lbl">Racha (días)</div></div>
        <div className="stat-card"><div className="stat-num" style={{color:'var(--ac)'}}>{user.completedLessons.length}</div><div className="stat-lbl">Lecciones completadas</div></div>
        <div className="stat-card"><div className="stat-num" style={{color:'var(--ac2)'}}>{wordsInProgress}</div><div className="stat-lbl">Palabras en progreso</div></div>
        <div className="stat-card"><div className="stat-num" style={{color:'var(--ac5)'}}>{Math.round(user.avgPronunciationScore)||0}%</div><div className="stat-lbl">Media pronunciación</div></div>
      </div>

      <div className="card">
        <div className="card-lbl">Calendario de actividad</div>
        <div className="cal-grid">
          {calDays.map((d,i) => (
            <div key={i} className={`cal-day ${d.active?'active':''} ${d.isToday?'today':''}`}>{d.day}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-lbl">Logros</div>
        <div className="ach-grid">
          {ACHIEVEMENTS.map(a => {
            const unlocked = user.unlockedAchievements.includes(a.id);
            return (
              <div key={a.id} className={`ach ${unlocked?'unlocked':''}`}>
                <div className="ach-icon">{a.icon}</div>
                <div><div className="ach-t">{a.title}</div><div className="ach-d">{a.desc}</div></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-lbl">Vocabulario dominado</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1,height:8,background:'var(--s2)',borderRadius:4,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.min(100,(masteredWords/50)*100)}%`,background:'linear-gradient(90deg,var(--ac),var(--ac2))',borderRadius:4,transition:'width .6s'}}/>
          </div>
          <span style={{fontSize:13,fontWeight:600,color:'var(--ac)'}}>{masteredWords}/50</span>
        </div>
        <div style={{fontSize:11,color:'var(--tx3)',marginTop:4}}>Palabras con 3+ repasos exitosos</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(() => loadState() || defaultUserState());
  const [tab, setTab] = useState("lessons");
  const [toast, setToast] = useState(null);

  // Save state on every change
  useEffect(() => { saveState(user); }, [user]);

  // Init voices
  useEffect(() => { if('speechSynthesis' in window) window.speechSynthesis.getVoices(); }, []);

  // Update streak on load
  useEffect(() => {
    if (!user.onboardingDone) return;
    const today = getToday();
    let updates = {};
    if (!user.activeDates.includes(today)) {
      updates.activeDates = [...user.activeDates, today];
      updates.totalSessions = user.totalSessions + 1;
    }
    const dates = updates.activeDates || user.activeDates;
    updates.streak = calculateStreak(dates, today);
    if (user.dailyXPDate !== today) {
      updates.dailyXP = 0;
      updates.dailyXPDate = today;
    }
    updates.lastActiveDate = today;
    updates.level = getLevel(user.xp);
    setUser(u => ({ ...u, ...updates }));
  }, [user.onboardingDone]);

  // Check achievements
  useEffect(() => {
    if (!user.onboardingDone) return;
    const newAch = ACHIEVEMENTS.filter(a => a.check(user) && !user.unlockedAchievements.includes(a.id));
    if (newAch.length) {
      setUser(u => ({ ...u, unlockedAchievements: [...u.unlockedAchievements, ...newAch.map(a => a.id)] }));
      newAch.forEach(a => showToast(`${a.icon} ¡Logro desbloqueado: ${a.title}!`));
    }
  }, [user.xp, user.streak, user.completedLessons.length, user.totalWordsLearned, user.avgPronunciationScore, user.tutorHistory.length]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const grantXP = (amount, source) => {
    setUser(u => {
      const newXP = u.xp + amount;
      const newDaily = u.dailyXP + amount;
      return { ...u, xp: newXP, dailyXP: newDaily, level: getLevel(newXP) };
    });
    showToast(`+${amount} XP`);
  };

  const markLessonComplete = (id) => {
    setUser(u => {
      if (u.completedLessons.includes(id)) return u;
      const lesson = LESSONS_DB.find(l => l.id === id);
      const newWords = lesson ? lesson.vocabulary.length : 0;
      return { ...u, completedLessons: [...u.completedLessons, id], totalWordsLearned: u.totalWordsLearned + newWords };
    });
  };

  const updatePronScore = (score) => {
    setUser(u => {
      const history = [...u.pronScoresHistory, score];
      const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
      return { ...u, pronScoresHistory: history, avgPronunciationScore: avg };
    });
  };

  const completeOnboarding = (name) => {
    setUser(u => ({ ...u, onboardingDone: true, userName: name, activeDates: [getToday()], lastActiveDate: getToday(), streak: 1, dailyXPDate: getToday() }));
  };

  if (!user.onboardingDone) return <><style>{CSS}</style><Onboarding onComplete={completeOnboarding} /></>;

  const level = getLevel(user.xp);
  const lvlProg = getLevelProgress(user.xp);

  return (
    <div className="app">
      <style>{CSS}</style>
      {toast && <div className="xp-toast">{toast}</div>}

      <div className="hdr">
        <div className="logo">SpeakFlow</div>
        <div className="hdr-right">
          <div className="streak-pill">🔥 {user.streak}</div>
          <div className="xp-pill">⚡ {user.xp}</div>
        </div>
      </div>
      <div className="lvl-bar"><div className="lvl-fill" style={{width:`${lvlProg}%`}}/></div>
      <div className="lvl-label"><span>Nivel {level}: {LEVEL_NAMES[level-1]}</span><span>{lvlProg}%</span></div>

      {tab==="lessons" && <LessonsPage user={user} grantXP={grantXP} markLessonComplete={markLessonComplete} />}
      {tab==="pronunciation" && <PronunciationPage grantXP={grantXP} updatePronScore={updatePronScore} />}
      {tab==="flashcards" && <FlashcardsPage user={user} setUser={setUser} grantXP={grantXP} />}
      {tab==="tutor" && <TutorPage user={user} setUser={setUser} grantXP={grantXP} />}
      {tab==="dashboard" && <DashboardPage user={user} />}

      <div className="bnav">
        <button className={`bnav-i ${tab==='lessons'?'on':''}`} onClick={()=>setTab('lessons')}><I.Book/>Lecciones</button>
        <button className={`bnav-i ${tab==='pronunciation'?'on':''}`} onClick={()=>setTab('pronunciation')}><I.Mic/>Pronun.</button>
        <button className={`bnav-i ${tab==='flashcards'?'on':''}`} onClick={()=>setTab('flashcards')}><I.Cards/>Flashcards</button>
        <button className={`bnav-i ${tab==='tutor'?'on':''}`} onClick={()=>setTab('tutor')}><I.Chat/>Tutor</button>
        <button className={`bnav-i ${tab==='dashboard'?'on':''}`} onClick={()=>setTab('dashboard')}><I.Dash/>Progreso</button>
      </div>
    </div>
  );
}
