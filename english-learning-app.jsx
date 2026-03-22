import { useState, useEffect, useRef, useCallback } from "react";

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
  { id: 20, en: "deadline", es: "fecha límite, plazo", sentence: "We need to meet the deadline no matter what.", phonetic: "/ˈded.laɪn/", difficulty: 1 }
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
  { text: "I'd love to take on more responsibilities.", tip: "'Responsibilities' tiene 6 sílabas. Acento en '-bil-': re-spon-si-BIL-i-ties." }
];

// --- App styles ---
const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; }

  :root {
    --bg: #0f1923;
    --surface: #1a2733;
    --surface2: #223344;
    --accent: #00d4aa;
    --accent2: #7c5cfc;
    --accent3: #ff6b6b;
    --accent4: #ffd93d;
    --text: #e8ecf1;
    --text2: #8899aa;
    --text3: #556677;
    --radius: 16px;
    --radius-sm: 10px;
    --font: 'DM Sans', sans-serif;
    --font-display: 'Fraunces', serif;
  }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app-container {
    padding-bottom: 80px;
    min-height: 100vh;
  }

  /* Header */
  .app-header {
    padding: 20px 20px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .app-logo {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .streak-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent4);
    border: 1px solid rgba(255,217,61,0.2);
  }

  /* Bottom Nav */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: rgba(15,25,35,0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid var(--surface2);
    display: flex;
    justify-content: space-around;
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
    z-index: 100;
  }
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: none;
    color: var(--text3);
    font-family: var(--font);
    font-size: 10px;
    font-weight: 500;
  }
  .nav-item.active {
    color: var(--accent);
  }
  .nav-item.active svg { stroke: var(--accent); }
  .nav-item svg { transition: all 0.2s; }

  /* Sections */
  .section-wrap {
    padding: 0 20px 20px;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .section-sub {
    color: var(--text2);
    font-size: 14px;
    margin-bottom: 20px;
  }

  /* Cards */
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 18px;
    margin-bottom: 14px;
    border: 1px solid transparent;
    transition: all 0.3s;
  }
  .card:hover { border-color: var(--surface2); }
  .card-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--accent);
    margin-bottom: 8px;
  }
  .card-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  /* Dialogue */
  .dialogue-line {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-start;
    animation: fadeInUp 0.3s ease both;
  }
  .dialogue-line:nth-child(1) { animation-delay: 0s; }
  .dialogue-line:nth-child(2) { animation-delay: 0.05s; }
  .dialogue-line:nth-child(3) { animation-delay: 0.1s; }
  .dialogue-line:nth-child(4) { animation-delay: 0.15s; }
  .dialogue-line:nth-child(5) { animation-delay: 0.2s; }
  .dialogue-line:nth-child(6) { animation-delay: 0.25s; }
  .dialogue-line:nth-child(7) { animation-delay: 0.3s; }

  .speaker-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .speaker-avatar.barista { background: linear-gradient(135deg, var(--accent2), #9b7cfc); color: white; }
  .speaker-avatar.you { background: linear-gradient(135deg, var(--accent), #00f0c0); color: var(--bg); }
  .speaker-avatar.interviewer { background: linear-gradient(135deg, #ff8c42, #ff6b6b); color: white; }
  .speaker-avatar.friend { background: linear-gradient(135deg, var(--accent4), #ffaa00); color: var(--bg); }

  .dialogue-bubble {
    background: var(--surface2);
    border-radius: 14px 14px 14px 4px;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.5;
    flex: 1;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  .dialogue-bubble:hover { background: #2a4055; }
  .dialogue-bubble .speaker-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 2px;
  }
  .dialogue-bubble.playing {
    border: 1px solid var(--accent);
    box-shadow: 0 0 20px rgba(0,212,170,0.15);
  }

  /* Vocab items */
  .vocab-item {
    background: var(--surface2);
    border-radius: var(--radius-sm);
    padding: 14px;
    margin-bottom: 10px;
  }
  .vocab-word {
    font-weight: 700;
    font-size: 16px;
    color: var(--accent);
  }
  .vocab-phonetic {
    font-size: 12px;
    color: var(--text2);
    margin-left: 8px;
  }
  .vocab-meaning {
    font-size: 13px;
    color: var(--text);
    margin-top: 4px;
  }
  .vocab-example {
    font-size: 12px;
    color: var(--text2);
    margin-top: 6px;
    font-style: italic;
    padding-left: 10px;
    border-left: 2px solid var(--accent);
  }

  /* Expression items */
  .expression-item {
    background: linear-gradient(135deg, rgba(124,92,252,0.1), rgba(0,212,170,0.05));
    border: 1px solid rgba(124,92,252,0.2);
    border-radius: var(--radius-sm);
    padding: 14px;
    margin-bottom: 10px;
  }
  .expression-phrase {
    font-weight: 700;
    font-size: 15px;
    color: var(--accent2);
  }

  /* Grammar box */
  .grammar-box {
    background: linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,212,170,0.02));
    border: 1px solid rgba(0,212,170,0.2);
    border-radius: var(--radius);
    padding: 18px;
    margin-top: 10px;
  }
  .grammar-title {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 8px;
  }
  .grammar-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text2);
  }
  .grammar-example {
    font-size: 13px;
    padding: 4px 0;
    color: var(--text);
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    font-family: var(--font);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), #00f0c0);
    color: var(--bg);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,212,170,0.3); }
  .btn-secondary {
    background: var(--surface2);
    color: var(--text);
  }
  .btn-danger {
    background: rgba(255,107,107,0.15);
    color: var(--accent3);
    border: 1px solid rgba(255,107,107,0.3);
  }
  .btn-sm { padding: 8px 16px; font-size: 13px; }
  .btn-full { width: 100%; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Pronunciation */
  .pronun-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 24px;
    text-align: center;
    margin-bottom: 16px;
  }
  .pronun-sentence {
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  .pronun-tip {
    font-size: 13px;
    color: var(--accent4);
    background: rgba(255,217,61,0.08);
    padding: 8px 14px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  .mic-btn {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent3), #ff8888);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    transition: all 0.3s;
    box-shadow: 0 4px 30px rgba(255,107,107,0.3);
  }
  .mic-btn.recording {
    animation: pulse 1.2s infinite;
    box-shadow: 0 0 0 0 rgba(255,107,107,0.7);
  }
  .mic-btn:hover { transform: scale(1.05); }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255,107,107,0.6); }
    70% { box-shadow: 0 0 0 20px rgba(255,107,107,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,107,107,0); }
  }

  .result-box {
    background: var(--surface2);
    border-radius: var(--radius-sm);
    padding: 16px;
    margin-top: 12px;
    text-align: left;
  }
  .result-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .result-text { font-size: 15px; line-height: 1.5; }
  .result-match { color: var(--accent); }
  .result-mismatch { color: var(--accent3); text-decoration: underline wavy var(--accent3); }
  .score-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 16px;
  }
  .score-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
  }
  .score-good { background: rgba(0,212,170,0.15); color: var(--accent); border: 2px solid var(--accent); }
  .score-ok { background: rgba(255,217,61,0.15); color: var(--accent4); border: 2px solid var(--accent4); }
  .score-bad { background: rgba(255,107,107,0.15); color: var(--accent3); border: 2px solid var(--accent3); }

  /* Flashcards */
  .flashcard {
    background: var(--surface);
    border-radius: 20px;
    padding: 32px 24px;
    min-height: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: all 0.4s;
    position: relative;
    border: 1px solid var(--surface2);
  }
  .flashcard:hover { border-color: var(--accent); }
  .flashcard-word {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .flashcard-phonetic {
    font-size: 16px;
    color: var(--text2);
    margin-bottom: 16px;
  }
  .flashcard-hint {
    font-size: 13px;
    color: var(--text3);
    margin-top: auto;
  }
  .flashcard-back .flashcard-meaning {
    font-size: 20px;
    color: var(--accent);
    margin-bottom: 12px;
  }
  .flashcard-back .flashcard-sentence {
    font-size: 14px;
    color: var(--text2);
    font-style: italic;
    line-height: 1.5;
  }
  .flashcard-progress {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 16px;
  }
  .progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--surface2);
  }
  .progress-dot.done { background: var(--accent); }
  .progress-dot.current { background: var(--accent4); box-shadow: 0 0 8px rgba(255,217,61,0.5); }

  .rating-btns {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  .rating-btn {
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    border: none;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .rating-btn:hover { transform: translateY(-2px); }
  .rating-hard { background: rgba(255,107,107,0.15); color: var(--accent3); }
  .rating-ok { background: rgba(255,217,61,0.15); color: var(--accent4); }
  .rating-easy { background: rgba(0,212,170,0.15); color: var(--accent); }

  /* Chat / Tutor */
  .chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 150px);
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 0 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .chat-msg {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    animation: fadeInUp 0.3s ease both;
  }
  .chat-msg.user {
    background: linear-gradient(135deg, var(--accent), #00f0c0);
    color: var(--bg);
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  .chat-msg.assistant {
    background: var(--surface2);
    color: var(--text);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  .chat-msg.system {
    background: rgba(124,92,252,0.1);
    border: 1px solid rgba(124,92,252,0.2);
    color: var(--text2);
    align-self: center;
    text-align: center;
    font-size: 13px;
    max-width: 95%;
  }
  .chat-input-row {
    display: flex;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--surface2);
  }
  .chat-input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--surface2);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text);
    font-family: var(--font);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: var(--accent); }
  .chat-input::placeholder { color: var(--text3); }

  .send-btn {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent2), #9b7cfc);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .send-btn:hover { transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; }

  /* Lesson selector */
  .lesson-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 12px;
    scrollbar-width: none;
  }
  .lesson-tabs::-webkit-scrollbar { display: none; }
  .lesson-tab {
    flex-shrink: 0;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--surface2);
    background: var(--surface);
    color: var(--text2);
    transition: all 0.2s;
    font-family: var(--font);
  }
  .lesson-tab.active {
    background: linear-gradient(135deg, var(--accent), #00f0c0);
    color: var(--bg);
    border-color: transparent;
  }

  /* Subsection tabs within lesson */
  .sub-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: var(--surface);
    padding: 4px;
    border-radius: 12px;
  }
  .sub-tab {
    flex: 1;
    padding: 8px 6px;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    color: var(--text2);
    border: none;
    background: none;
    font-family: var(--font);
    transition: all 0.2s;
  }
  .sub-tab.active {
    background: var(--surface2);
    color: var(--text);
  }

  .play-all-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(0,212,170,0.1);
    border: 1px solid rgba(0,212,170,0.3);
    border-radius: 10px;
    color: var(--accent);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 16px;
    transition: all 0.2s;
  }
  .play-all-btn:hover { background: rgba(0,212,170,0.2); }

  .loading-dots {
    display: flex;
    gap: 4px;
    padding: 8px 0;
  }
  .loading-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text3);
    animation: dotBounce 1.4s infinite ease-in-out both;
  }
  .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
  .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes dotBounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text2);
  }
  .empty-state-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .correction-block {
    margin-top: 10px;
    background: rgba(0,212,170,0.05);
    border-left: 3px solid var(--accent);
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    font-size: 13px;
  }
  .correction-block strong { color: var(--accent); }
`;

// --- Icons ---
const Icons = {
  Lesson: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Mic: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Cards: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/></svg>,
  Chat: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Play: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Volume: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  Fire: () => <span style={{fontSize:'16px'}}>🔥</span>,
  MicLarge: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
};

// --- Speak function ---
function speak(text, rate = 0.9) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = rate;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) u.voice = enVoice;
    window.speechSynthesis.speak(u);
    return u;
  }
  return null;
}

// --- Lesson Page ---
function LessonPage() {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [subTab, setSubTab] = useState("dialogue");
  const [playingIdx, setPlayingIdx] = useState(-1);

  const lesson = LESSONS[lessonIdx];

  const playLine = (text, idx) => {
    setPlayingIdx(idx);
    const u = speak(text);
    if (u) u.onend = () => setPlayingIdx(-1);
    else setTimeout(() => setPlayingIdx(-1), 2000);
  };

  const playAll = () => {
    let delay = 0;
    lesson.dialogue.forEach((line, i) => {
      setTimeout(() => {
        playLine(line.text, i);
      }, delay);
      delay += line.text.length * 65 + 800;
    });
  };

  const getAvatar = (speaker) => {
    const s = speaker.toLowerCase();
    if (s === 'you') return <div className="speaker-avatar you">TÚ</div>;
    if (s === 'barista') return <div className="speaker-avatar barista">B</div>;
    if (s === 'interviewer') return <div className="speaker-avatar interviewer">E</div>;
    if (s === 'friend') return <div className="speaker-avatar friend">A</div>;
    return <div className="speaker-avatar barista">{speaker[0]}</div>;
  };

  return (
    <div className="section-wrap">
      <div className="section-title">Lección del día</div>
      <div className="section-sub">Nivel {lesson.level} · {lesson.topic}</div>

      <div className="lesson-tabs">
        {LESSONS.map((l, i) => (
          <button key={l.id} className={`lesson-tab ${i === lessonIdx ? 'active' : ''}`} onClick={() => { setLessonIdx(i); setSubTab("dialogue"); }}>
            {l.day}: {l.title}
          </button>
        ))}
      </div>

      <div className="sub-tabs">
        {["dialogue","vocabulary","expressions","grammar"].map(t => (
          <button key={t} className={`sub-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'dialogue' ? '💬 Diálogo' : t === 'vocabulary' ? '📖 Vocab' : t === 'expressions' ? '💡 Expresiones' : '📐 Gramática'}
          </button>
        ))}
      </div>

      {subTab === "dialogue" && (
        <div>
          <button className="play-all-btn" onClick={playAll}>
            <Icons.Play /> Reproducir diálogo completo
          </button>
          {lesson.dialogue.map((line, i) => (
            <div className="dialogue-line" key={i}>
              {getAvatar(line.speaker)}
              <div className={`dialogue-bubble ${playingIdx === i ? 'playing' : ''}`} onClick={() => playLine(line.text, i)}>
                <div className="speaker-name">{line.speaker}</div>
                {line.text}
              </div>
            </div>
          ))}
          <div style={{fontSize:'12px', color:'var(--text3)', textAlign:'center', marginTop:'12px'}}>
            Toca cualquier línea para escuchar su pronunciación
          </div>
        </div>
      )}

      {subTab === "vocabulary" && (
        <div>
          {lesson.vocabulary.map((v, i) => (
            <div className="vocab-item" key={i} onClick={() => speak(v.word)} style={{cursor:'pointer'}}>
              <span className="vocab-word">{v.word}</span>
              <span className="vocab-phonetic">{v.phonetic}</span>
              <span style={{marginLeft:'8px', cursor:'pointer'}} onClick={(e) => { e.stopPropagation(); speak(v.example); }}>
                <Icons.Volume />
              </span>
              <div className="vocab-meaning">{v.meaning}</div>
              <div className="vocab-example">"{v.example}"</div>
            </div>
          ))}
        </div>
      )}

      {subTab === "expressions" && (
        <div>
          {lesson.expressions.map((e, i) => (
            <div className="expression-item" key={i} onClick={() => speak(e.phrase)} style={{cursor:'pointer'}}>
              <div className="expression-phrase">{e.phrase}</div>
              <div className="vocab-meaning">{e.meaning}</div>
              <div className="vocab-example">"{e.example}"</div>
            </div>
          ))}
        </div>
      )}

      {subTab === "grammar" && (
        <div className="grammar-box">
          <div className="grammar-title">{lesson.grammar.title}</div>
          <div className="grammar-text">{lesson.grammar.explanation}</div>
          <div style={{marginTop:'12px'}}>
            {lesson.grammar.examples.map((ex, i) => (
              <div className="grammar-example" key={i} onClick={() => speak(ex.replace(/[✓✗]/g, ''))} style={{cursor:'pointer'}}>
                • {ex}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Pronunciation Page ---
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
    origWords.forEach((w, i) => {
      if (spokenWords[i] === w) matches++;
      else if (spokenWords.includes(w)) matches += 0.5;
    });
    return Math.min(100, Math.round((matches / origWords.length) * 100));
  };

  const generateFeedback = (original, spoken, pct) => {
    if (pct >= 90) return "¡Excelente pronunciación! Suenas muy natural. 🎯";
    if (pct >= 70) {
      const origWords = original.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
      const spokenWords = spoken.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
      const missed = origWords.filter(w => !spokenWords.includes(w));
      if (missed.length > 0) return `Bien, pero revisa estas palabras: "${missed.slice(0,3).join('", "')}". Escucha de nuevo e intenta imitarla.`;
      return "¡Casi perfecto! Intenta hablar un poco más fluido, enlazando las palabras.";
    }
    if (pct >= 40) return "Vas por buen camino. Escucha la frase despacio, repite cada parte y luego intenta la frase completa.";
    return "No te preocupes — es práctica. Toca el botón 🔊 para escuchar la frase despacio, e intenta repetirla por partes.";
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setFeedback("Tu navegador no soporta reconocimiento de voz. Prueba con Chrome.");
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const pct = calculateScore(current.text, text);
      setScore(pct);
      setFeedback(generateFeedback(current.text, text, pct));
      setRecording(false);
    };
    recognition.onerror = (e) => {
      setRecording(false);
      if (e.error === 'no-speech') setFeedback("No detecté audio. Asegúrate de hablar claro y cerca del micrófono.");
      else setFeedback("Error con el micrófono. Revisa los permisos del navegador.");
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    setTranscript("");
    setScore(null);
    setFeedback("");
    setRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setRecording(false);
  };

  const nextSentence = () => {
    setSentIdx((sentIdx + 1) % PRONUNCIATION_SENTENCES.length);
    setTranscript("");
    setScore(null);
    setFeedback("");
  };

  const scoreClass = score >= 80 ? 'score-good' : score >= 50 ? 'score-ok' : 'score-bad';

  return (
    <div className="section-wrap">
      <div className="section-title">Pronunciación</div>
      <div className="section-sub">Escucha, repite y mejora tu acento</div>

      <div style={{textAlign:'center', marginBottom:'12px', color:'var(--text3)', fontSize:'13px'}}>
        Frase {sentIdx + 1} de {PRONUNCIATION_SENTENCES.length}
      </div>

      <div className="pronun-card">
        <div className="pronun-sentence">{current.text}</div>
        <button className="btn btn-sm btn-secondary" onClick={() => speak(current.text, 0.75)} style={{marginBottom:'12px'}}>
          🔊 Escuchar despacio
        </button>
        <div className="pronun-tip">💡 {current.tip}</div>

        <button className={`mic-btn ${recording ? 'recording' : ''}`} onClick={recording ? stopRecording : startRecording}>
          <Icons.MicLarge />
        </button>
        <div style={{fontSize:'13px', color:'var(--text2)'}}>
          {recording ? "Escuchando... habla ahora" : "Pulsa para grabar"}
        </div>
      </div>

      {transcript && (
        <div className="result-box">
          <div className="result-label" style={{color:'var(--text3)'}}>Lo que dijiste:</div>
          <div className="result-text">{transcript}</div>
        </div>
      )}

      {score !== null && (
        <div style={{textAlign:'center'}}>
          <div className="score-display">
            <div className={`score-circle ${scoreClass}`}>{score}%</div>
            <div style={{textAlign:'left'}}>
              <div style={{fontWeight:'600', fontSize:'15px'}}>{score >= 80 ? '¡Genial!' : score >= 50 ? 'Casi' : 'Sigue practicando'}</div>
              <div style={{fontSize:'12px', color:'var(--text2)'}}>Precisión de pronunciación</div>
            </div>
          </div>
          <div style={{marginTop:'12px', fontSize:'14px', color:'var(--text2)', lineHeight:'1.5', padding:'0 10px'}}>
            {feedback}
          </div>
        </div>
      )}

      <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
        <button className="btn btn-secondary btn-full" onClick={() => { setTranscript(""); setScore(null); setFeedback(""); }}>
          🔄 Repetir
        </button>
        <button className="btn btn-primary btn-full" onClick={nextSentence}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// --- Flashcards Page ---
function FlashcardsPage() {
  const [cards] = useState(() => {
    const shuffled = [...FLASHCARD_BANK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  });
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  const currentCard = cards[cardIdx];

  const rate = (difficulty) => {
    setResults([...results, { card: currentCard, difficulty }]);
    setFlipped(false);
    if (cardIdx + 1 >= cards.length) {
      setFinished(true);
    } else {
      setCardIdx(cardIdx + 1);
    }
  };

  const restart = () => {
    setCardIdx(0);
    setFlipped(false);
    setResults([]);
    setFinished(false);
  };

  if (finished) {
    const easy = results.filter(r => r.difficulty === 'easy').length;
    const ok = results.filter(r => r.difficulty === 'ok').length;
    const hard = results.filter(r => r.difficulty === 'hard').length;
    return (
      <div className="section-wrap">
        <div className="section-title">Sesión completa</div>
        <div className="section-sub">{cards.length} tarjetas revisadas</div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:'48px', marginBottom:'10px'}}>🎉</div>
          <div style={{fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:'600', marginBottom:'16px'}}>¡Bien hecho!</div>
          <div style={{display:'flex', justifyContent:'center', gap:'20px', marginBottom:'20px'}}>
            <div>
              <div style={{fontSize:'28px', fontWeight:'700', color:'var(--accent)'}}>{easy}</div>
              <div style={{fontSize:'12px', color:'var(--text2)'}}>Fácil</div>
            </div>
            <div>
              <div style={{fontSize:'28px', fontWeight:'700', color:'var(--accent4)'}}>{ok}</div>
              <div style={{fontSize:'12px', color:'var(--text2)'}}>Regular</div>
            </div>
            <div>
              <div style={{fontSize:'28px', fontWeight:'700', color:'var(--accent3)'}}>{hard}</div>
              <div style={{fontSize:'12px', color:'var(--text2)'}}>Difícil</div>
            </div>
          </div>
          {hard > 0 && (
            <div style={{fontSize:'13px', color:'var(--text2)', marginBottom:'16px'}}>
              Palabras para repasar: {results.filter(r => r.difficulty === 'hard').map(r => r.card.en).join(', ')}
            </div>
          )}
          <button className="btn btn-primary btn-full" onClick={restart}>
            Nueva ronda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-wrap">
      <div className="section-title">Flashcards</div>
      <div className="section-sub">Vocabulario B1-B2 · Repetición espaciada</div>

      <div className="flashcard-progress">
        {cards.map((_, i) => (
          <div key={i} className={`progress-dot ${i < cardIdx ? 'done' : i === cardIdx ? 'current' : ''}`} />
        ))}
      </div>

      <div className="flashcard" onClick={() => { setFlipped(!flipped); speak(currentCard.en); }}>
        {!flipped ? (
          <>
            <div className="flashcard-word">{currentCard.en}</div>
            <div className="flashcard-phonetic">{currentCard.phonetic}</div>
            <div className="flashcard-hint">Toca para ver la traducción</div>
          </>
        ) : (
          <div className="flashcard-back">
            <div className="flashcard-word" style={{fontSize:'22px'}}>{currentCard.en}</div>
            <div className="flashcard-meaning">{currentCard.es}</div>
            <div className="flashcard-sentence">"{currentCard.sentence}"</div>
          </div>
        )}
      </div>

      {flipped && (
        <div className="rating-btns">
          <button className="rating-btn rating-hard" onClick={() => rate('hard')}>
            😤 Difícil
          </button>
          <button className="rating-btn rating-ok" onClick={() => rate('ok')}>
            🤔 Regular
          </button>
          <button className="rating-btn rating-easy" onClick={() => rate('easy')}>
            😎 Fácil
          </button>
        </div>
      )}

      <div style={{textAlign:'center', marginTop:'16px'}}>
        <button className="btn btn-sm btn-secondary" onClick={() => speak(currentCard.sentence)}>
          🔊 Escuchar ejemplo
        </button>
      </div>
    </div>
  );
}

// --- Tutor Chat Page ---
function TutorPage() {
  const [messages, setMessages] = useState([
    { role: 'system', content: "👋 Hi! I'm your English tutor. Write me anything in English and I'll help you improve. I'll correct your mistakes and suggest better ways to express yourself. ¡Escríbeme en inglés y te ayudo!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const scrollToBottom = () => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a friendly English tutor helping a B1-B2 Spanish speaker improve their English. Your rules:
1. ALWAYS respond in English primarily, but include Spanish translations in parentheses for key corrections.
2. If the user makes grammar, vocabulary, or phrasing errors, GENTLY correct them at the start of your response using this format: "✏️ Small fix: [corrected version]" then explain briefly why.
3. If the sentence is correct, acknowledge it: "✅ Perfect sentence!"
4. Then continue the conversation naturally, asking follow-up questions to keep them talking.
5. Occasionally introduce a new useful word or expression relevant to the topic, marked with "💡 New expression: ..."
6. Keep responses concise (2-4 sentences max for the conversational part).
7. Be encouraging and warm. Never make the user feel bad about mistakes.
8. If the user writes in Spanish, gently encourage them to try in English and help them translate.`,
          messages: messages.filter(m => m.role !== 'system').concat([{role: 'user', content: userMsg}]).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      const data = await response.json();
      const reply = data.content?.map(c => c.text || '').join('') || "Sorry, I couldn't process that. Try again!";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Hmm, I'm having trouble connecting right now. Please try again in a moment! 🙏" }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "Let's talk about my weekend plans",
    "Help me practice job interview questions",
    "Teach me phrasal verbs with 'get'",
    "I want to describe my daily routine"
  ];

  return (
    <div className="section-wrap">
      <div className="section-title">English Tutor</div>
      <div className="section-sub">Practica conversación con correcciones en tiempo real</div>

      <div className="chat-container">
        <div className="chat-messages" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <div className="loading-dots"><span/><span/><span/></div>
            </div>
          )}
          {messages.length === 1 && (
            <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px'}}>
              {quickPrompts.map((p, i) => (
                <button key={i} className="btn btn-sm btn-secondary" onClick={() => { setInput(p); }} style={{fontSize:'12px'}}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write in English..."
            disabled={loading}
          />
          <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
            <Icons.Send />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---
export default function EnglishLearningApp() {
  const [tab, setTab] = useState("lessons");
  const [streak] = useState(1);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className="app-container">
      <style>{appStyles}</style>

      <div className="app-header">
        <div className="app-logo">SpeakFlow</div>
        <div className="streak-badge">
          <Icons.Fire /> {streak} día
        </div>
      </div>

      {tab === "lessons" && <LessonPage />}
      {tab === "pronunciation" && <PronunciationPage />}
      {tab === "flashcards" && <FlashcardsPage />}
      {tab === "tutor" && <TutorPage />}

      <div className="bottom-nav">
        <button className={`nav-item ${tab === 'lessons' ? 'active' : ''}`} onClick={() => setTab('lessons')}>
          <Icons.Lesson />
          Lecciones
        </button>
        <button className={`nav-item ${tab === 'pronunciation' ? 'active' : ''}`} onClick={() => setTab('pronunciation')}>
          <Icons.Mic />
          Pronunciación
        </button>
        <button className={`nav-item ${tab === 'flashcards' ? 'active' : ''}`} onClick={() => setTab('flashcards')}>
          <Icons.Cards />
          Flashcards
        </button>
        <button className={`nav-item ${tab === 'tutor' ? 'active' : ''}`} onClick={() => setTab('tutor')}>
          <Icons.Chat />
          Tutor IA
        </button>
      </div>
    </div>
  );
}
