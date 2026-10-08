
import { Language, LanguageConfig, InterfaceLanguage, ManualContent } from './types';

// Penko SVG
export const PENKO_SVG_PATH = "M6 2C4 2 3 3 3 5V19C3 21 4 22 6 22H18C20 22 21 21 21 19V5C21 3 20 2 18 2H6M8 6H10V8H8V6M14 6H16V8H14V6M11 10H13V12H11V10M6 14H18V18H6V14Z";

// --- FINGER MAPPING ---
// 0-4: Left Hand (Pinky -> Thumb)
// 5-9: Right Hand (Thumb -> Pinky)
export const KEY_TO_FINGER: Record<string, number> = {
  // Left Pinky (0)
  'KeyQ': 0, 'KeyA': 0, 'KeyZ': 0, 'Digit1': 0, 'ShiftLeft': 0, 'Tab': 0, 'CapsLock': 0,
  // Left Ring (1)
  'KeyW': 1, 'KeyS': 1, 'KeyX': 1, 'Digit2': 1,
  // Left Middle (2)
  'KeyE': 2, 'KeyD': 2, 'KeyC': 2, 'Digit3': 2,
  // Left Index (3)
  'KeyR': 3, 'KeyF': 3, 'KeyV': 3, 'Digit4': 3,
  'KeyT': 3, 'KeyG': 3, 'KeyB': 3, 'Digit5': 3,
  // Left Thumb (4) - Space (Shared)

  // Right Thumb (5) - Space (Shared)
  'Space': 5,
  // Right Index (6)
  'KeyY': 6, 'KeyH': 6, 'KeyN': 6, 'Digit6': 6,
  'KeyU': 6, 'KeyJ': 6, 'KeyM': 6, 'Digit7': 6,
  // Right Middle (7)
  'KeyI': 7, 'KeyK': 7, 'Comma': 7, 'Digit8': 7,
  // Right Ring (8)
  'KeyO': 8, 'KeyL': 8, 'Period': 8, 'Digit9': 8,
  // Right Pinky (9)
  'KeyP': 9, 'Semicolon': 9, 'Slash': 9, 'Digit0': 9,
  'Quote': 9, 'BracketLeft': 9, 'BracketRight': 9, 'Minus': 9, 'Equal': 9, 'ShiftRight': 9, 'Enter': 9, 'Backslash': 9
};

// --- HANGUL UTILS ---
const HANGUL_START = 44032;
const HANGUL_END = 55203;
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const JUNGSUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];
const JONGSUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Compound jamo have no key of their own on the 2-set layout; they are typed as two keys
const COMPOUND_JAMO: Record<string, string> = {
  'ㅘ': 'ㅗㅏ', 'ㅙ': 'ㅗㅐ', 'ㅚ': 'ㅗㅣ', 'ㅝ': 'ㅜㅓ', 'ㅞ': 'ㅜㅔ', 'ㅟ': 'ㅜㅣ', 'ㅢ': 'ㅡㅣ',
  'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ',
  'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ'
};

const splitJamo = (jamo: string) => COMPOUND_JAMO[jamo] ?? jamo;

export const decomposeHangul = (text: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      const offset = code - HANGUL_START;
      const initial = Math.floor(offset / 588);
      const medial = Math.floor((offset % 588) / 28);
      const final = offset % 28;

      result += CHOSUNG[initial] + splitJamo(JUNGSUNG[medial]);
      if (final > 0) result += splitJamo(JONGSUNG[final]);
    } else {
      result += splitJamo(text[i]);
    }
  }
  return result;
};

// Kana with (han)dakuten are typed as the base kana followed by the ゛/゜ key
const decomposeKana = (text: string): string =>
  text.normalize('NFD').replace(/\u3099/g, '゛').replace(/\u309A/g, '゜');

// ABNT2 accents are dead keys: the accent key is pressed first, then the letter
const PORTUGUESE_DEAD_KEYS: Record<string, string> = {
  'á': '´a', 'é': '´e', 'í': '´i', 'ó': '´o', 'ú': '´u',
  'ã': '~a', 'õ': '~o',
  'â': '^a', 'ê': '^e', 'ô': '^o',
  'à': '`a'
};

/** Converts a display word into the exact sequence of characters produced by key presses. */
export const toKeystrokes = (languageId: Language, text: string): string => {
  switch (languageId) {
    case Language.KOREAN:
      return decomposeHangul(text);
    case Language.JAPANESE_KANA:
      return decomposeKana(text);
    case Language.PORTUGUESE:
      return [...text].map(c => PORTUGUESE_DEAD_KEYS[c] ?? c).join('');
    default:
      return text;
  }
};

// --- KEYBOARD GEOMETRY ---

export const NUMBER_ROW = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];

export const KEYBOARD_ROWS = [
  NUMBER_ROW,
  ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight']
];

/** Every key code that produces a character; anything else (Backspace, Tab, arrows...) is ignored by the game. */
export const TYPING_CODES = new Set([...KEYBOARD_ROWS.flat(), 'Space'].filter(c => !c.startsWith('Shift')));

// --- LAYOUT HELPERS ---

const createQwerty = (overrides: Partial<Record<string, {char?: string, shiftChar?: string, label?: string}>> = {}) => {
  const defaults = [
    { code: 'KeyQ', char: 'q', shiftChar: 'Q', label: 'Q' },
    { code: 'KeyW', char: 'w', shiftChar: 'W', label: 'W' },
    { code: 'KeyE', char: 'e', shiftChar: 'E', label: 'E' },
    { code: 'KeyR', char: 'r', shiftChar: 'R', label: 'R' },
    { code: 'KeyT', char: 't', shiftChar: 'T', label: 'T' },
    { code: 'KeyY', char: 'y', shiftChar: 'Y', label: 'Y' },
    { code: 'KeyU', char: 'u', shiftChar: 'U', label: 'U' },
    { code: 'KeyI', char: 'i', shiftChar: 'I', label: 'I' },
    { code: 'KeyO', char: 'o', shiftChar: 'O', label: 'O' },
    { code: 'KeyP', char: 'p', shiftChar: 'P', label: 'P' },
    { code: 'KeyA', char: 'a', shiftChar: 'A', label: 'A' },
    { code: 'KeyS', char: 's', shiftChar: 'S', label: 'S' },
    { code: 'KeyD', char: 'd', shiftChar: 'D', label: 'D' },
    { code: 'KeyF', char: 'f', shiftChar: 'F', label: 'F' },
    { code: 'KeyG', char: 'g', shiftChar: 'G', label: 'G' },
    { code: 'KeyH', char: 'h', shiftChar: 'H', label: 'H' },
    { code: 'KeyJ', char: 'j', shiftChar: 'J', label: 'J' },
    { code: 'KeyK', char: 'k', shiftChar: 'K', label: 'K' },
    { code: 'KeyL', char: 'l', shiftChar: 'L', label: 'L' },
    { code: 'KeyZ', char: 'z', shiftChar: 'Z', label: 'Z' },
    { code: 'KeyX', char: 'x', shiftChar: 'X', label: 'X' },
    { code: 'KeyC', char: 'c', shiftChar: 'C', label: 'C' },
    { code: 'KeyV', char: 'v', shiftChar: 'V', label: 'V' },
    { code: 'KeyB', char: 'b', shiftChar: 'B', label: 'B' },
    { code: 'KeyN', char: 'n', shiftChar: 'N', label: 'N' },
    { code: 'KeyM', char: 'm', shiftChar: 'M', label: 'M' },
    { code: 'Semicolon', char: ';', shiftChar: ':', label: ';' },
    { code: 'Quote', char: "'", shiftChar: '"', label: "'" },
    { code: 'Comma', char: ',', shiftChar: '<', label: ',' },
    { code: 'Period', char: '.', shiftChar: '>', label: '.' },
    { code: 'Slash', char: '/', shiftChar: '?', label: '/' },
    { code: 'BracketLeft', char: '[', shiftChar: '{', label: '[' },
    { code: 'BracketRight', char: ']', shiftChar: '}', label: ']' },
    { code: 'Backslash', char: '\\', shiftChar: '|', label: '\\' },
    { code: 'Minus', char: '-', shiftChar: '_', label: '-' },
    { code: 'Equal', char: '=', shiftChar: '+', label: '=' },
    { code: 'Digit1', char: '1', shiftChar: '!', label: '1' },
    { code: 'Digit2', char: '2', shiftChar: '@', label: '2' },
    { code: 'Digit3', char: '3', shiftChar: '#', label: '3' },
    { code: 'Digit4', char: '4', shiftChar: '$', label: '4' },
    { code: 'Digit5', char: '5', shiftChar: '%', label: '5' },
    { code: 'Digit6', char: '6', shiftChar: '^', label: '6' },
    { code: 'Digit7', char: '7', shiftChar: '&', label: '7' },
    { code: 'Digit8', char: '8', shiftChar: '*', label: '8' },
    { code: 'Digit9', char: '9', shiftChar: '(', label: '9' },
    { code: 'Digit0', char: '0', shiftChar: ')', label: '0' },
  ];

  return defaults.map(k => {
    const ov = overrides[k.code];
    return ov ? { ...k, ...ov } : k;
  });
};

/** Physical key caps (US QWERTY), used as the small label on keys a layout does not map. */
export const QWERTY_LABELS: Record<string, string> = Object.fromEntries(
  createQwerty().map(k => [k.code, k.label])
);

// --- DATA ---

const englishMap: LanguageConfig = {
  id: Language.ENGLISH,
  name: "English (US)",
  description: "Standard US QWERTY layout.",
  sampleWords: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "penguin", "keyboard", "typing", "retro", "game", "ocean", "ice", "snow", "winter", "code", "learn", "speed", "focus", "music", "world",
    "ask", "ash", "alas", "salad", "glass", "flask", "dash", "flash", "glad", "fad", "dad", "sad", "lag", "hag", "fall", "shall", "add", "sash",
    "slag", "jags", "alfalfa", "hall", "gash", "gall", "jalk", "ads", "asks", "dads", "sads", "galls", "falls", "flask", "salads", "slags",
    "about", "would", "their", "write", "about", "could", "people", "number", "water", "sound", "place", "years", "think", "great", "every",
    "find", "house", "light", "right", "large", "could", "sound", "water", "place", "little", "after", "round", "simple", "stable", "audio"
  ],
  mappings: createQwerty()
};

const spanishMap: LanguageConfig = {
  id: Language.SPANISH,
  name: "Spanish (Español)",
  description: "QWERTY with Ñ. Punctuation differs.",
  // Cleaned to avoid dead keys for now
  sampleWords: [
    "hola", "mundo", "gracias", "favor", "buenos", "amigo", "casa", "tiempo", "ahora", "vida", "feliz",
    "gato", "perro", "agua", "fuego", "tierra", "aire", "libro", "escuela", "ayer", "hoy", "siempre", "nunca", "todo", "nada",
    "hombre", "mujer", "comer", "beber", "dormir", "correr", "jugar", "niño", "niña", "pañuelo", "araña",
    "ala", "alas", "asa", "asas", "lada", "losa", "losas", "sola", "solas", "salada", "saladas", "daño", "daños", "falo", "falos",
    "hilo", "hilos", "gala", "galas", "saga", "sagas", "gasa", "gasas", "hada", "hadas", "dama", "damas", "lama", "lamas",
    "bueno", "gente", "parte", "hacer", "nuevo", "lugar", "punto", "forma", "cuerpo", "fuerza", "tarde", "carta", "libro", "mano"
  ],
  mappings: createQwerty({
    'Semicolon': { char: 'ñ', shiftChar: 'Ñ', label: 'Ñ' },
    'Quote': { char: '{', shiftChar: '[', label: '{' },
    'BracketLeft': { char: '`', shiftChar: '^', label: '`' },
    'BracketRight': { char: '+', shiftChar: '*', label: '+' },
    'Slash': { char: '-', shiftChar: '_', label: '-' },
    'Minus': { char: "'", shiftChar: '?', label: "'" },
    'Equal': { char: '¡', shiftChar: '¿', label: '¡' },
    'Backslash': { char: 'ç', shiftChar: '}', label: 'ç' }
  })
};

const frenchMap: LanguageConfig = {
  id: Language.FRENCH,
  name: "French (Français)",
  description: "AZERTY layout. Accents on number keys.",
  sampleWords: [
    "bonjour", "merci", "oui", "non", "amour", "vie", "temps", "homme", "femme", "enfant", "chat", "chien",
    "maison", "ecole", "travail", "argent", "monde", "pays", "ville", "rue", "voiture", "train", "avion", "bateau", "manger", "boire", "dormir",
    "petit", "grand", "beau", "belle", "bon", "bonne", "rouge", "bleu", "vert", "jaune", "ça", "été", "père", "mère"
  ],
  mappings: createQwerty({
    // Letters
    'KeyQ': { char: 'a', shiftChar: 'A', label: 'A' },
    'KeyW': { char: 'z', shiftChar: 'Z', label: 'Z' },
    'KeyA': { char: 'q', shiftChar: 'Q', label: 'Q' },
    'KeyZ': { char: 'w', shiftChar: 'W', label: 'W' },
    'Semicolon': { char: 'm', shiftChar: 'M', label: 'M' },
    'KeyM': { char: ',', shiftChar: '?', label: ',' },
    // Punctuation
    'Comma': { char: ';', shiftChar: '.', label: ';' },
    'Period': { char: ':', shiftChar: '/', label: ':' },
    'Slash': { char: '!', shiftChar: '§', label: '!' },
    // Number Row (Accents are unshifted, Numbers are shifted)
    'Digit1': { char: '&', shiftChar: '1', label: '&' },
    'Digit2': { char: 'é', shiftChar: '2', label: 'é' },
    'Digit3': { char: '"', shiftChar: '3', label: '"' },
    'Digit4': { char: "'", shiftChar: '4', label: "'" },
    'Digit5': { char: '(', shiftChar: '5', label: '(' },
    'Digit6': { char: '-', shiftChar: '6', label: '-' },
    'Digit7': { char: 'è', shiftChar: '7', label: 'è' },
    'Digit8': { char: '_', shiftChar: '8', label: '_' },
    'Digit9': { char: 'ç', shiftChar: '9', label: 'ç' },
    'Digit0': { char: 'à', shiftChar: '0', label: 'à' },
    'Minus':  { char: ')', shiftChar: '°', label: ')' },
    'Equal':  { char: '=', shiftChar: '+', label: '=' },
  })
};

const germanMap: LanguageConfig = {
  id: Language.GERMAN,
  name: "German (Deutsch)",
  description: "QWERTZ layout. Y/Z swapped.",
  sampleWords: [
    "hallo", "danke", "bitte", "ja", "nein", "und", "oder", "aber", "vielleicht", "morgen", "heute", "gestern", "zeit", "jahr", "tag",
    "nacht", "mann", "frau", "kind", "haus", "auto", "schule", "arbeit", "geld", "freund", "wasser", "brot", "bier", "kaffee", "milch",
    "gut", "schlecht", "groß", "klein", "alt", "neu", "schön", "hässlich", "kalt", "warm"
  ],
  mappings: createQwerty({
    'KeyY': { char: 'z', shiftChar: 'Z', label: 'Z' },
    'KeyZ': { char: 'y', shiftChar: 'Y', label: 'Y' },
    'Semicolon': { char: 'ö', shiftChar: 'Ö', label: 'Ö' },
    'Quote': { char: 'ä', shiftChar: 'Ä', label: 'Ä' },
    'BracketLeft': { char: 'ü', shiftChar: 'Ü', label: 'Ü' },
    'BracketRight': { char: '+', shiftChar: '*', label: '+' },
    'Minus': { char: 'ß', shiftChar: '?', label: 'ß' },
    'Equal': { char: '´', shiftChar: '`', label: '´' },
    'Slash': { char: '-', shiftChar: '_', label: '-' },
    'Backslash': { char: '#', shiftChar: "'", label: '#' }
  })
};

const italianMap: LanguageConfig = {
  id: Language.ITALIAN,
  name: "Italian (Italiano)",
  description: "QWERTY style. Accents on right side.",
  sampleWords: [
    "ciao", "grazie", "prego", "scusa", "per", "favore", "buongiorno", "buonasera", "notte", "amore", "vita", "cuore", "sole", "luna", "mare",
    "terra", "fuoco", "aria", "acqua", "cibo", "vino", "pizza", "pasta", "pane", "formaggio", "uomo", "donna", "bambino", "amico", "famiglia",
    "tempo", "ora", "giorno", "anno", "settimana", "lunedì", "domenica", "felice", "triste", "bello", "città", "caffè", "perché", "più"
  ],
  mappings: createQwerty({
    'Semicolon': { char: 'ò', shiftChar: 'ç', label: 'ò' },
    'Quote': { char: 'à', shiftChar: '°', label: 'à' },
    'BracketLeft': { char: 'è', shiftChar: 'é', label: 'è' },
    'BracketRight': { char: '+', shiftChar: '*', label: '+' },
    'Slash': { char: 'ù', shiftChar: '§', label: 'ù' },
    'Minus': { char: "'", shiftChar: '?', label: "'" },
    'Equal': { char: 'ì', shiftChar: '^', label: 'ì' },
    'Backslash': { char: 'ù', shiftChar: '§', label: 'ù' } // Sometimes shared
  })
};

const portugueseMap: LanguageConfig = {
  id: Language.PORTUGUESE,
  name: "Portuguese (Brasil)",
  description: "ABNT2 Style. Ç on Semicolon.",
  sampleWords: [
    "olá", "obrigado", "por", "favor", "sim", "não", "bom", "dia", "noite", "amor", "vida", "coração", "sol", "lua", "mar",
    "terra", "fogo", "ar", "água", "comida", "café", "pão", "queijo", "homem", "mulher", "criança", "amigo", "família",
    "tempo", "agora", "hoje", "amanhã", "ontem", "sempre", "nunca", "tudo", "nada", "feliz", "triste", "belo",
    "coração", "ação", "maçã", "braço", "cabeça", "moça", "taça", "paçoca"
  ],
  mappings: createQwerty({
    'Semicolon': { char: 'ç', shiftChar: 'Ç', label: 'Ç' },
    'Quote': { char: '~', shiftChar: '^', label: '~' }, // Dead keys technically, but simplified for game
    'BracketLeft': { char: '´', shiftChar: '`', label: '´' },
    'BracketRight': { char: '[', shiftChar: '{', label: '[' },
    'Slash': { char: ';', shiftChar: ':', label: ';' },
    'Backslash': { char: ']', shiftChar: '}', label: ']' },
    'Minus': { char: '-', shiftChar: '_', label: '-' },
    'Equal': { char: '=', shiftChar: '+', label: '=' },
  })
};

const turkishMap: LanguageConfig = {
  id: Language.TURKISH,
  name: "Turkish (Türkçe Q)",
  description: "Q-Layout. I/ı and Ş/Ç positions differ.",
  sampleWords: [
    "merhaba", "teşekkürler", "lütfen", "evet", "hayır", "günaydın", "iyi", "geceler", "aşk", "hayat", "kalp", "güneş", "ay", "deniz",
    "toprak", "ateş", "hava", "su", "yemek", "ekmek", "peynir", "adam", "kadın", "çocuk", "arkadaş", "aile",
    "zaman", "şimdi", "bugün", "yarın", "dün", "her", "zaman", "asla", "her", "şey", "hiç", "mutlu", "üzgün", "güzel",
    "ağaç", "çiçek", "yağmur", "rüzgar", "kar", "dağ", "nehir", "göl", "orman", "kuş"
  ],
  mappings: createQwerty({
    'KeyI': { char: 'ı', shiftChar: 'I', label: 'ı' },
    'Quote': { char: 'i', shiftChar: 'İ', label: 'i' },
    'Semicolon': { char: 'ş', shiftChar: 'Ş', label: 'Ş' },
    'Comma': { char: 'ö', shiftChar: 'Ö', label: 'Ö' },
    'Period': { char: 'ç', shiftChar: 'Ç', label: 'Ç' },
    'Slash': { char: '.', shiftChar: ':', label: '.' },
    'BracketLeft': { char: 'ğ', shiftChar: 'Ğ', label: 'Ğ' },
    'BracketRight': { char: 'ü', shiftChar: 'Ü', label: 'Ü' },
    'Backslash': { char: ',', shiftChar: ';', label: ',' },
  })
};


const koreanMap: LanguageConfig = {
  id: Language.KOREAN,
  name: "Korean (Hangul 2-Set)",
  description: "Standard Layout. Consonants Left, Vowels Right.",
  sampleWords: [
    "안녕하세요", "감사합니다", "사랑해요", "죄송합니다", "반갑습니다", "어떻게", "무엇을", "누구", "언제", "어디서",
    "학교", "병원", "경찰서", "도서관", "식당", "카페", "시장", "가게", "집", "회사",
    "컴퓨터", "핸드폰", "텔레비전", "냉장고", "자동차", "버스", "지하철", "비행기", "자전거", "기차",
    "봄", "여름", "가을", "겨울", "하늘", "바다", "산", "강", "나무", "꽃"
  ],
  mappings: [
    { code: 'KeyQ', label: 'Q', char: 'ㅂ', shiftChar: 'ㅃ' },
    { code: 'KeyW', label: 'W', char: 'ㅈ', shiftChar: 'ㅉ' },
    { code: 'KeyE', label: 'E', char: 'ㄷ', shiftChar: 'ㄸ' },
    { code: 'KeyR', label: 'R', char: 'ㄱ', shiftChar: 'ㄲ' },
    { code: 'KeyT', label: 'T', char: 'ㅅ', shiftChar: 'ㅆ' },
    { code: 'KeyY', label: 'Y', char: 'ㅛ' },
    { code: 'KeyU', label: 'U', char: 'ㅕ' },
    { code: 'KeyI', label: 'I', char: 'ㅑ' },
    { code: 'KeyO', label: 'O', char: 'ㅐ', shiftChar: 'ㅒ' },
    { code: 'KeyP', label: 'P', char: 'ㅔ', shiftChar: 'ㅖ' },
    { code: 'KeyA', label: 'A', char: 'ㅁ' },
    { code: 'KeyS', label: 'S', char: 'ㄴ' },
    { code: 'KeyD', label: 'D', char: 'ㅇ' },
    { code: 'KeyF', label: 'F', char: 'ㄹ' },
    { code: 'KeyG', label: 'G', char: 'ㅎ' },
    { code: 'KeyH', label: 'H', char: 'ㅗ' },
    { code: 'KeyJ', label: 'J', char: 'ㅓ' },
    { code: 'KeyK', label: 'K', char: 'ㅏ' },
    { code: 'KeyL', label: 'L', char: 'ㅣ' },
    { code: 'KeyZ', label: 'Z', char: 'ㅋ' },
    { code: 'KeyX', label: 'X', char: 'ㅌ' },
    { code: 'KeyC', label: 'C', char: 'ㅊ' },
    { code: 'KeyV', label: 'V', char: 'ㅍ' },
    { code: 'KeyB', label: 'B', char: 'ㅠ' },
    { code: 'KeyN', label: 'N', char: 'ㅜ' },
    { code: 'KeyM', label: 'M', char: 'ㅡ' },
  ]
};

const russianMap: LanguageConfig = {
  id: Language.RUSSIAN,
  name: "Russian (JCUKEN)",
  description: "Standard Cyrillic layout.",
  sampleWords: [
    "привет", "пока", "спасибо", "пожалуйста", "хорошо", "плохо", "да", "нет", "может", "быть",
    "человек", "мужчина", "женщина", "ребенок", "друг", "семья", "работа", "деньги", "время", "жизнь",
    "город", "страна", "мир", "улица", "дом", "квартира", "комната", "дверь", "окно", "стол",
    "кошка", "собака", "птица", "рыба", "дерево", "лес", "река", "море", "солнце", "луна"
  ],
  mappings: [
    { code: 'KeyQ', label: 'Q', char: 'й' },
    { code: 'KeyW', label: 'W', char: 'ц' },
    { code: 'KeyE', label: 'E', char: 'у' },
    { code: 'KeyR', label: 'R', char: 'к' },
    { code: 'KeyT', label: 'T', char: 'е' },
    { code: 'KeyY', label: 'Y', char: 'н' },
    { code: 'KeyU', label: 'U', char: 'г' },
    { code: 'KeyI', label: 'I', char: 'ш' },
    { code: 'KeyO', label: 'O', char: 'щ' },
    { code: 'KeyP', label: 'P', char: 'з' },
    { code: 'BracketLeft', label: '[', char: 'х' },
    { code: 'BracketRight', label: ']', char: 'ъ' },
    { code: 'KeyA', label: 'A', char: 'ф' },
    { code: 'KeyS', label: 'S', char: 'ы' },
    { code: 'KeyD', label: 'D', char: 'в' },
    { code: 'KeyF', label: 'F', char: 'а' },
    { code: 'KeyG', label: 'G', char: 'п' },
    { code: 'KeyH', label: 'H', char: 'р' },
    { code: 'KeyJ', label: 'J', char: 'о' },
    { code: 'KeyK', label: 'K', char: 'л' },
    { code: 'KeyL', label: 'L', char: 'д' },
    { code: 'Semicolon', label: ';', char: 'ж' },
    { code: 'Quote', label: "'", char: 'э' },
    { code: 'Backslash', label: '\\', char: '\\' },
    { code: 'KeyZ', label: 'Z', char: 'я' },
    { code: 'KeyX', label: 'X', char: 'ч' },
    { code: 'KeyC', label: 'C', char: 'с' },
    { code: 'KeyV', label: 'V', char: 'м' },
    { code: 'KeyB', label: 'B', char: 'и' },
    { code: 'KeyN', label: 'N', char: 'т' },
    { code: 'KeyM', label: 'M', char: 'ь' },
    { code: 'Comma', label: ',', char: 'б' },
    { code: 'Period', label: '.', char: 'ю' },
  ]
};

const ukrainianMap: LanguageConfig = {
  id: Language.UKRAINIAN,
  name: "Ukrainian",
  description: "Standard layout (Cyrillic). Includes і, ї, є, ґ.",
  sampleWords: [
    "привіт", "дякую", "будь", "ласка", "так", "ні", "добре", "погано", "хто", "що",
    "людина", "чоловік", "жінка", "дитина", "друг", "родина", "робота", "гроші", "час", "життя",
    "місто", "країна", "світ", "вулиця", "будинок", "квартира", "кімната", "двері", "вікно", "стіл",
    "кіт", "собака", "птах", "риба", "дерево", "ліс", "річка", "море", "сонце", "місяць"
  ],
  mappings: [
    { code: 'KeyQ', label: 'Q', char: 'й' },
    { code: 'KeyW', label: 'W', char: 'ц' },
    { code: 'KeyE', label: 'E', char: 'у' },
    { code: 'KeyR', label: 'R', char: 'к' },
    { code: 'KeyT', label: 'T', char: 'е' },
    { code: 'KeyY', label: 'Y', char: 'н' },
    { code: 'KeyU', label: 'U', char: 'г', shiftChar: 'ґ' },
    { code: 'KeyI', label: 'I', char: 'ш' },
    { code: 'KeyO', label: 'O', char: 'щ' },
    { code: 'KeyP', label: 'P', char: 'з' },
    { code: 'BracketLeft', label: '[', char: 'х' },
    { code: 'BracketRight', label: ']', char: 'ї' },
    { code: 'KeyA', label: 'A', char: 'ф' },
    { code: 'KeyS', label: 'S', char: 'і' },
    { code: 'KeyD', label: 'D', char: 'в' },
    { code: 'KeyF', label: 'F', char: 'а' },
    { code: 'KeyG', label: 'G', char: 'п' },
    { code: 'KeyH', label: 'H', char: 'р' },
    { code: 'KeyJ', label: 'J', char: 'о' },
    { code: 'KeyK', label: 'K', char: 'л' },
    { code: 'KeyL', label: 'L', char: 'д' },
    { code: 'Semicolon', label: ';', char: 'ж' },
    { code: 'Quote', label: "'", char: 'є' },
    { code: 'Backslash', label: '\\', char: 'ґ' },
    { code: 'KeyZ', label: 'Z', char: 'я' },
    { code: 'KeyX', label: 'X', char: 'ч' },
    { code: 'KeyC', label: 'C', char: 'с' },
    { code: 'KeyV', label: 'V', char: 'м' },
    { code: 'KeyB', label: 'B', char: 'и' },
    { code: 'KeyN', label: 'N', char: 'т' },
    { code: 'KeyM', label: 'M', char: 'ь' },
    { code: 'Comma', label: ',', char: 'б' },
    { code: 'Period', label: '.', char: 'ю' },
  ]
};

const japaneseMap: LanguageConfig = {
  id: Language.JAPANESE_KANA,
  name: "Japanese (Kana Input)",
  description: "Direct Kana input mapping (JIS).",
  sampleWords: [
    "こんにちは", "ありがとう", "さようなら", "すみません", "はい", "いいえ", "わたし", "あなた", "これ", "それ",
    "ねこ", "いぬ", "とり", "さかな", "うま", "うし", "むし", "はな", "き", "やま",
    "かわ", "うみ", "そら", "ほし", "つき", "ひ", "みず", "つち", "かぜ", "あめ",
    "あか", "あお", "くち", "みどり", "あし", "め", "おおきい", "ちいさい", "たかい", "ひくい"
  ],
  mappings: [
    { code: 'Digit1', label: '1', char: 'ぬ' },
    { code: 'Digit2', label: '2', char: 'ふ' },
    { code: 'Digit3', label: '3', char: 'あ', shiftChar: 'ぁ' },
    { code: 'Digit4', label: '4', char: 'う', shiftChar: 'ぅ' },
    { code: 'Digit5', label: '5', char: 'え', shiftChar: 'ぇ' },
    { code: 'Digit6', label: '6', char: 'お', shiftChar: 'ぉ' },
    { code: 'Digit7', label: '7', char: 'や', shiftChar: 'ゃ' },
    { code: 'Digit8', label: '8', char: 'ゆ', shiftChar: 'ゅ' },
    { code: 'Digit9', label: '9', char: 'よ', shiftChar: 'ょ' },
    { code: 'Digit0', label: '0', char: 'わ', shiftChar: 'を' },
    { code: 'Minus', label: '-', char: 'ほ' },
    { code: 'Equal', label: '=', char: 'へ' },
    { code: 'KeyQ', label: 'Q', char: 'た' },
    { code: 'KeyW', label: 'W', char: 'て' },
    { code: 'KeyE', label: 'E', char: 'い', shiftChar: 'ぃ' },
    { code: 'KeyR', label: 'R', char: 'す' },
    { code: 'KeyT', label: 'T', char: 'か' },
    { code: 'KeyY', label: 'Y', char: 'ん' },
    { code: 'KeyU', label: 'U', char: 'な' },
    { code: 'KeyI', label: 'I', char: 'に' },
    { code: 'KeyO', label: 'O', char: 'ら' },
    { code: 'KeyP', label: 'P', char: 'せ' },
    { code: 'BracketLeft', label: '[', char: '゛' },
    { code: 'BracketRight', label: ']', char: '゜' },
    { code: 'KeyA', label: 'A', char: 'ち' },
    { code: 'KeyS', label: 'S', char: 'と' },
    { code: 'KeyD', label: 'D', char: 'し' },
    { code: 'KeyF', label: 'F', char: 'は' },
    { code: 'KeyG', label: 'G', char: 'き' },
    { code: 'KeyH', label: 'H', char: 'く' },
    { code: 'KeyJ', label: 'J', char: 'ま' },
    { code: 'KeyK', label: 'K', char: 'の' },
    { code: 'KeyL', label: 'L', char: 'り' },
    { code: 'Semicolon', label: ';', char: 'れ' },
    { code: 'Quote', label: "'", char: 'け' },
    { code: 'Backslash', label: '\\', char: 'む' },
    { code: 'KeyZ', label: 'Z', char: 'つ', shiftChar: 'っ' },
    { code: 'KeyX', label: 'X', char: 'さ' },
    { code: 'KeyC', label: 'C', char: 'そ' },
    { code: 'KeyV', label: 'V', char: 'ひ' },
    { code: 'KeyB', label: 'B', char: 'こ' },
    { code: 'KeyN', label: 'N', char: 'み' },
    { code: 'KeyM', label: 'M', char: 'も' },
    { code: 'Comma', label: ',', char: 'ね' },
    { code: 'Period', label: '.', char: 'る' },
    { code: 'Slash', label: '/', char: 'め' },
  ]
};

const chineseMap: LanguageConfig = {
  id: Language.CHINESE_BOPOMOFO,
  name: "Chinese (Bopomofo)",
  description: "Traditional phonetic layout.",
  sampleWords: [
    "ㄋㄧˇㄏㄠˇ", "ㄒㄧㄝˋㄒㄧㄝ˙", "ㄅㄨˋㄎㄜˋㄑㄧˋ", "ㄉㄨㄟˋㄅㄨˋㄑㄧˇ", "ㄗㄞˋㄐㄧㄢˋ",
    "ㄗㄠˇㄢ", "ㄨㄢˇㄢ", "ㄨㄛˇ", "ㄋㄧˇ", "ㄊㄚ", "ㄕㄟˊ", "ㄕㄣˊㄇㄜ˙", "ㄋㄚˇㄌㄧˇ",
    "ㄅㄚˋㄅㄚ˙", "ㄇㄚㄇㄚ˙", "ㄍㄜㄍㄜ˙", "ㄐㄧㄝˇㄐㄧㄝ˙", "ㄉㄧˋㄉㄧ˙", "ㄇㄟˋㄇㄟ˙",
    "ㄔ", "ㄏㄜ", "ㄕㄨㄟˋ", "ㄒㄧㄝˇ", "ㄉㄨˊ", "ㄊㄧㄥ", "ㄕㄨㄛ", "ㄗㄡˇ", "ㄆㄠˇ"
  ],
  mappings: [
    { code: 'Digit1', label: '1', char: 'ㄅ' },
    { code: 'Digit2', label: '2', char: 'ㄉ' },
    { code: 'Digit3', label: '3', char: 'ˇ' },
    { code: 'Digit4', label: '4', char: 'ˋ' },
    { code: 'Digit5', label: '5', char: 'ㄓ' },
    { code: 'Digit6', label: '6', char: 'ˊ' },
    { code: 'Digit7', label: '7', char: '˙' },
    { code: 'Digit8', label: '8', char: 'ㄚ' },
    { code: 'Digit9', label: '9', char: 'ㄞ' },
    { code: 'Digit0', label: '0', char: 'ㄢ' },
    { code: 'Minus', label: '-', char: 'ㄦ' },
    { code: 'KeyQ', label: 'Q', char: 'ㄆ' },
    { code: 'KeyW', label: 'W', char: 'ㄊ' },
    { code: 'KeyE', label: 'E', char: 'ㄍ' },
    { code: 'KeyR', label: 'R', char: 'ㄐ' },
    { code: 'KeyT', label: 'T', char: 'ㄔ' },
    { code: 'KeyY', label: 'Y', char: 'ㄗ' },
    { code: 'KeyU', label: 'U', char: 'ㄧ' },
    { code: 'KeyI', label: 'I', char: 'ㄛ' },
    { code: 'KeyO', label: 'O', char: 'ㄟ' },
    { code: 'KeyP', label: 'P', char: 'ㄣ' },
    { code: 'KeyA', label: 'A', char: 'ㄇ' },
    { code: 'KeyS', label: 'S', char: 'ㄋ' },
    { code: 'KeyD', label: 'D', char: 'ㄎ' },
    { code: 'KeyF', label: 'F', char: 'ㄑ' },
    { code: 'KeyG', label: 'G', char: 'ㄕ' },
    { code: 'KeyH', label: 'H', char: 'ㄘ' },
    { code: 'KeyJ', label: 'J', char: 'ㄨ' },
    { code: 'KeyK', label: 'K', char: 'ㄜ' },
    { code: 'KeyL', label: 'L', char: 'ㄠ' },
    { code: 'Semicolon', label: ';', char: 'ㄤ' },
    { code: 'KeyZ', label: 'Z', char: 'ㄈ' },
    { code: 'KeyX', label: 'X', char: 'ㄌ' },
    { code: 'KeyC', label: 'C', char: 'ㄏ' },
    { code: 'KeyV', label: 'V', char: 'ㄒ' },
    { code: 'KeyB', label: 'B', char: 'ㄖ' },
    { code: 'KeyN', label: 'N', char: 'ㄙ' },
    { code: 'KeyM', label: 'M', char: 'ㄩ' },
    { code: 'Comma', label: ',', char: 'ㄝ' },
    { code: 'Period', label: '.', char: 'ㄡ' },
    { code: 'Slash', label: '/', char: 'ㄥ' },
    { code: 'Backslash', label: '\\', char: '?' },
  ]
};

const arabicMap: LanguageConfig = {
  id: Language.ARABIC,
  name: "Arabic (العربية)",
  description: "Standard 101/102 layout. Right-to-Left script.",
  isRTL: true,
  sampleWords: [
    "مرحبا", "شكرا", "نعم", "لا", "من", "الى", "على", "في", "مع", "هذا",
    "انا", "انت", "هو", "هي", "نحن", "هم", "كتاب", "قلم", "مدرسة", "بيت",
    "سيارة", "طريق", "مدينة", "بلد", "عالم", "سماء", "ارض", "شمس", "قمر", "نجم",
    "ماء", "نار", "هواء", "حب", "سلام", "حرب", "صديق", "عدو", "يوم", "ليل"
  ],
  mappings: [
    { code: 'KeyQ', label: 'Q', char: 'ض' },
    { code: 'KeyW', label: 'W', char: 'ص' },
    { code: 'KeyE', label: 'E', char: 'ث' },
    { code: 'KeyR', label: 'R', char: 'ق' },
    { code: 'KeyT', label: 'T', char: 'ف' },
    { code: 'KeyY', label: 'Y', char: 'غ' },
    { code: 'KeyU', label: 'U', char: 'ع' },
    { code: 'KeyI', label: 'I', char: 'ه' },
    { code: 'KeyO', label: 'O', char: 'خ' },
    { code: 'KeyP', label: 'P', char: 'ح' },
    { code: 'BracketLeft', label: '[', char: 'ج' },
    { code: 'BracketRight', label: ']', char: 'د' },
    { code: 'Backslash', label: '\\', char: 'ذ' },
    { code: 'KeyA', label: 'A', char: 'ش' },
    { code: 'KeyS', label: 'S', char: 'س' },
    { code: 'KeyD', label: 'D', char: 'ي' },
    { code: 'KeyF', label: 'F', char: 'ب' },
    { code: 'KeyG', label: 'G', char: 'ل' },
    { code: 'KeyH', label: 'H', char: 'ا' },
    { code: 'KeyJ', label: 'J', char: 'ت' },
    { code: 'KeyK', label: 'K', char: 'ن' },
    { code: 'KeyL', label: 'L', char: 'م' },
    { code: 'Semicolon', label: ';', char: 'ك' },
    { code: 'Quote', label: "'", char: 'ط' },
    { code: 'KeyZ', label: 'Z', char: 'ئ' },
    { code: 'KeyX', label: 'X', char: 'ء' },
    { code: 'KeyC', label: 'C', char: 'ؤ' },
    { code: 'KeyV', label: 'V', char: 'ر' },
    { code: 'KeyB', label: 'B', char: 'لا' },
    { code: 'KeyN', label: 'N', char: 'ى' },
    { code: 'KeyM', label: 'M', char: 'ة' },
    { code: 'Comma', label: ',', char: 'و' },
    { code: 'Period', label: '.', char: 'ز' },
    { code: 'Slash', label: '/', char: 'ظ' },
  ]
};

const hebrewMap: LanguageConfig = {
  id: Language.HEBREW,
  name: "Hebrew (עברית)",
  description: "Standard Hebrew layout. Right-to-Left script.",
  isRTL: true,
  sampleWords: [
    "שלום", "תודה", "בבקשה", "כן", "לא", "בוקר", "לילה", "טוב", "רע", "מי",
    "מה", "איפה", "מתי", "אני", "אתה", "הוא", "היא", "אנחנו", "הם", "ספר",
    "בית", "מכונית", "עבודה", "כסף", "זמן", "אהבה", "חיים", "משפחה", "חבר", "כלב",
    "חתול", "אוכל", "מים", "לחם", "חלב", "שמש", "ירח", "ארץ", "עולם", "אלוהים"
  ],
  mappings: [
    { code: 'KeyQ', label: 'Q', char: '/' },
    { code: 'KeyW', label: 'W', char: "'" },
    { code: 'KeyE', label: 'E', char: 'ק' },
    { code: 'KeyR', label: 'R', char: 'ר' },
    { code: 'KeyT', label: 'T', char: 'א' },
    { code: 'KeyY', label: 'Y', char: 'ט' },
    { code: 'KeyU', label: 'U', char: 'ו' },
    { code: 'KeyI', label: 'I', char: 'ן' },
    { code: 'KeyO', label: 'O', char: 'ם' },
    { code: 'KeyP', label: 'P', char: 'פ' },
    { code: 'KeyA', label: 'A', char: 'ש' },
    { code: 'KeyS', label: 'S', char: 'ד' },
    { code: 'KeyD', label: 'D', char: 'ג' },
    { code: 'KeyF', label: 'F', char: 'כ' },
    { code: 'KeyG', label: 'G', char: 'ע' },
    { code: 'KeyH', label: 'H', char: 'י' },
    { code: 'KeyJ', label: 'J', char: 'ח' },
    { code: 'KeyK', label: 'K', char: 'ל' },
    { code: 'KeyL', label: 'L', char: 'ך' },
    { code: 'Semicolon', label: ';', char: 'ף' },
    { code: 'Comma', label: ',', char: 'ת' },
    { code: 'KeyZ', label: 'Z', char: 'ז' },
    { code: 'KeyX', label: 'X', char: 'ס' },
    { code: 'KeyC', label: 'C', char: 'ב' },
    { code: 'KeyV', label: 'V', char: 'ה' },
    { code: 'KeyB', label: 'B', char: 'נ' },
    { code: 'KeyN', label: 'N', char: 'מ' },
    { code: 'KeyM', label: 'M', char: 'צ' },
    { code: 'Period', label: '.', char: 'ץ' },
  ]
};

export const LANGUAGES: Record<Language, LanguageConfig> = {
  [Language.ENGLISH]: englishMap,
  [Language.SPANISH]: spanishMap,
  [Language.FRENCH]: frenchMap,
  [Language.GERMAN]: germanMap,
  [Language.ITALIAN]: italianMap,
  [Language.PORTUGUESE]: portugueseMap,
  [Language.TURKISH]: turkishMap,
  [Language.RUSSIAN]: russianMap,
  [Language.UKRAINIAN]: ukrainianMap,
  [Language.ARABIC]: arabicMap,
  [Language.HEBREW]: hebrewMap,
  [Language.KOREAN]: koreanMap,
  [Language.JAPANESE_KANA]: japaneseMap,
  [Language.CHINESE_BOPOMOFO]: chineseMap,
};

// Sorted by commonality/region
export const SORTED_LANGUAGES = [
    Language.ENGLISH,
    Language.SPANISH,
    Language.FRENCH,
    Language.GERMAN,
    Language.ITALIAN,
    Language.PORTUGUESE,
    Language.TURKISH,
    Language.RUSSIAN,
    Language.UKRAINIAN,
    Language.ARABIC,
    Language.HEBREW,
    Language.KOREAN,
    Language.JAPANESE_KANA,
    Language.CHINESE_BOPOMOFO
];

const UI_STRINGS_BASE = {
    leaderboard: "LEADERBOARD",
    manual: "MANUAL",
    selectLang: "SELECT KEYBOARD LAYOUT",
    showHands: "SHOW HAND GUIDES",
    quit: "QUIT",
    score: "SCORE",
    wpm: "WPM",
    sessionComplete: "SESSION COMPLETE",
    enterInitials: "ENTER INITIALS",
    save: "SAVE",
    skip: "SKIP",
    backToMenu: "BACK TO MENU",
    manualTitle: "INSTRUCTION MANUAL",
    manualClose: "CLOSE MANUAL",
    subtitle: "MASTER FOREIGN KEYBOARDS",
    offlineCapable: "OFFLINE CAPABLE",
    difficultyBeginner: "BEGINNER",
    difficultyIntermediate: "INTERMEDIATE",
    difficultyAdvanced: "ADVANCED",
    typeHint: "TYPE",
    space: "SPACE",
    you: "YOU",
    liveRacers: "LIVE RACERS",
    highScores: "HIGH SCORES",
    noRecords: "NO RECORDS YET",
    beFirst: "Be the first to set a high score!",
    rank: "RANK",
    name: "NAME",
    multiplayer: "MULTIPLAYER DUEL"
};

export type UIStrings = typeof UI_STRINGS_BASE & { start: string };

const UI_STRINGS_BY_LANG: Record<InterfaceLanguage, Partial<UIStrings>> = {
  [InterfaceLanguage.ENGLISH]: { start: "START" },
  [InterfaceLanguage.SPANISH]: {
    start: "COMENZAR",
    leaderboard: "CLASIFICACIÓN",
    manual: "MANUAL",
    selectLang: "SELECCIONAR TECLADO",
    showHands: "MOSTRAR MANOS",
    quit: "SALIR",
    score: "PUNTOS",
    wpm: "PPM",
    sessionComplete: "SESIÓN COMPLETA",
    enterInitials: "TUS INICIALES",
    save: "GUARDAR",
    skip: "SALTAR",
    backToMenu: "VOLVER AL MENÚ",
    manualTitle: "MANUAL DE JUEGO",
    manualClose: "CERRAR",
    subtitle: "DOMINA TECLADOS EXTRANJEROS",
    offlineCapable: "SIN CONEXIÓN",
    difficultyBeginner: "PRINCIPIANTE",
    difficultyIntermediate: "INTERMEDIO",
    difficultyAdvanced: "AVANZADO",
    typeHint: "ESCRIBE",
    space: "ESPACIO",
    you: "TÚ",
    liveRacers: "CORREDORES",
    highScores: "RÉCORDS",
    noRecords: "SIN RÉCORDS",
    beFirst: "¡Sé el primero en marcar un récord!",
    rank: "PUESTO",
    name: "NOMBRE",
    multiplayer: "DUELO MULTIJUGADOR"
  },
  [InterfaceLanguage.FRENCH]: {
    start: "DÉMARRER",
    leaderboard: "CLASSEMENT",
    manual: "MANUEL",
    selectLang: "CHOISIR CLAVIER",
    showHands: "GUIDE DES MAINS",
    quit: "QUITTER",
    score: "SCORE",
    wpm: "MPM",
    sessionComplete: "FIN DE SESSION",
    enterInitials: "VOS INITIALES",
    save: "SAUVER",
    skip: "PASSER",
    backToMenu: "RETOUR AU MENU",
    manualTitle: "MANUEL D'INSTRUCTIONS",
    manualClose: "FERMER",
    subtitle: "MAÎTRISEZ LES CLAVIERS",
    offlineCapable: "HORS LIGNE",
    difficultyBeginner: "DÉBUTANT",
    difficultyIntermediate: "INTERMÉDIAIRE",
    difficultyAdvanced: "AVANCÉ",
    typeHint: "TAPEZ",
    space: "ESPACE",
    you: "VOUS",
    liveRacers: "COUREURS",
    highScores: "MEILLEURS SCORES",
    noRecords: "AUCUN SCORE",
    beFirst: "Soyez le premier à établir un record !",
    rank: "RANG",
    name: "NOM",
    multiplayer: "DUEL MULTIJOUEUR"
  },
  [InterfaceLanguage.GERMAN]: {
    start: "STARTEN",
    leaderboard: "BESTENLISTE",
    manual: "ANLEITUNG",
    selectLang: "TASTATUR WÄHLEN",
    showHands: "HÄNDE ZEIGEN",
    quit: "BEENDEN",
    score: "PUNKTE",
    wpm: "WPM",
    sessionComplete: "SITZUNG BEENDET",
    enterInitials: "INITIALEN EINGEBEN",
    save: "SPEICHERN",
    skip: "ÜBERSPRINGEN",
    backToMenu: "ZURÜCK ZUM MENÜ",
    manualTitle: "SPIELANLEITUNG",
    manualClose: "SCHLIESSEN",
    subtitle: "FREMDE TASTATUREN LERNEN",
    offlineCapable: "OFFLINE MÖGLICH",
    difficultyBeginner: "ANFÄNGER",
    difficultyIntermediate: "FORTGESCHRITTEN",
    difficultyAdvanced: "EXPERTE",
    typeHint: "TIPPE",
    space: "LEERTASTE",
    you: "DU",
    liveRacers: "SPIELER LIVE",
    highScores: "BESTENLISTE",
    noRecords: "NOCH KEINE EINTRÄGE",
    beFirst: "Stell den ersten Rekord auf!",
    rank: "RANG",
    name: "NAME",
    multiplayer: "MEHRSPIELER-DUELL"
  },
  [InterfaceLanguage.ITALIAN]: {
    start: "AVVIA",
    leaderboard: "CLASSIFICA",
    manual: "MANUALE",
    selectLang: "SELEZIONA TASTIERA",
    showHands: "MOSTRA MANI",
    quit: "ESCI",
    score: "PUNTI",
    wpm: "PPM",
    sessionComplete: "SESSIONE COMPLETA",
    enterInitials: "INSERISCI INIZIALI",
    save: "SALVA",
    skip: "SALTA",
    backToMenu: "TORNA AL MENU",
    manualTitle: "MANUALE DI ISTRUZIONI",
    manualClose: "CHIUDI",
    subtitle: "IMPARA TASTIERE STRANIERE",
    offlineCapable: "OFFLINE CAPACE",
    difficultyBeginner: "PRINCIPIANTE",
    difficultyIntermediate: "INTERMEDIO",
    difficultyAdvanced: "AVANZATO",
    typeHint: "DIGITA",
    space: "SPAZIO",
    you: "TU",
    liveRacers: "GIOCATORI",
    highScores: "PUNTEGGI MIGLIORI",
    noRecords: "NESSUN RECORD",
    beFirst: "Sii il primo a stabilire un record!",
    rank: "POS",
    name: "NOME",
    multiplayer: "DUELLO MULTIGIOCATORE"
  },
  [InterfaceLanguage.PORTUGUESE]: {
    start: "INICIAR",
    leaderboard: "CLASSIFICAÇÃO",
    manual: "MANUAL",
    selectLang: "SELECIONAR TECLADO",
    showHands: "MOSTRAR MÃOS",
    quit: "SAIR",
    score: "PONTOS",
    wpm: "PPM",
    sessionComplete: "SESSÃO CONCLUÍDA",
    enterInitials: "INSIRA SUAS INICIAIS",
    save: "SALVAR",
    skip: "PULAR",
    backToMenu: "VOLTAR AO MENU",
    manualTitle: "MANUAL DE INSTRUÇÕES",
    manualClose: "FECHAR",
    subtitle: "DOMINE TECLADOS ESTRANGEIROS",
    offlineCapable: "MODO OFFLINE",
    difficultyBeginner: "INICIANTE",
    difficultyIntermediate: "INTERMEDIÁRIO",
    difficultyAdvanced: "AVANÇADO",
    typeHint: "DIGITE",
    space: "ESPAÇO",
    you: "VOCÊ",
    liveRacers: "JOGADORES",
    highScores: "RECORDES",
    noRecords: "SEM RECORDES",
    beFirst: "Seja o primeiro a marcar um recorde!",
    rank: "POS",
    name: "NOME",
    multiplayer: "DUELO MULTIJOGADOR"
  },
  [InterfaceLanguage.RUSSIAN]: {
    start: "СТАРТ",
    leaderboard: "РЕЙТИНГ",
    manual: "РУКОВОДСТВО",
    selectLang: "ВЫБОР РАСКЛАДКИ",
    showHands: "ПОКАЗАТЬ РУКИ",
    quit: "ВЫХОД",
    score: "СЧЕТ",
    wpm: "СЛ/МИН",
    sessionComplete: "СЕССИЯ ЗАВЕРШЕНА",
    enterInitials: "ВВЕДИТЕ ИНИЦИАЛЫ",
    save: "СОХРАНИТЬ",
    skip: "ПРОПУСТИТЬ",
    backToMenu: "В МЕНЮ",
    manualTitle: "ИНСТРУКЦИЯ",
    manualClose: "ЗАКРЫТЬ",
    subtitle: "ИЗУЧАЙТЕ ИНОСТРАННЫЕ КЛАВИАТУРЫ",
    offlineCapable: "РАБОТАЕТ ОФЛАЙН",
    difficultyBeginner: "НАЧИНАЮЩИЙ",
    difficultyIntermediate: "СРЕДНИЙ",
    difficultyAdvanced: "ПРОДВИНУТЫЙ",
    typeHint: "ВВОД",
    space: "ПРОБЕЛ",
    you: "ВЫ",
    liveRacers: "ГОНЩИКИ",
    highScores: "РЕКОРДЫ",
    noRecords: "РЕКОРДОВ НЕТ",
    beFirst: "Установите первый рекорд!",
    rank: "МЕСТО",
    name: "ИМЯ",
    multiplayer: "СЕТЕВАЯ ДУЭЛЬ"
  },
  [InterfaceLanguage.KOREAN]: {
    start: "시작",
    leaderboard: "순위표",
    manual: "설명서",
    selectLang: "키보드 선택",
    showHands: "손 가이드 보기",
    quit: "종료",
    score: "점수",
    wpm: "타수",
    sessionComplete: "세션 완료",
    enterInitials: "이니셜 입력",
    save: "저장",
    skip: "건너뛰기",
    backToMenu: "메뉴로",
    manualTitle: "게임 설명서",
    manualClose: "닫기",
    subtitle: "외국어 키보드 마스터하기",
    offlineCapable: "오프라인 가능",
    difficultyBeginner: "초급",
    difficultyIntermediate: "중급",
    difficultyAdvanced: "고급",
    typeHint: "입력",
    space: "스페이스",
    you: "나",
    liveRacers: "참가자",
    highScores: "최고 기록",
    noRecords: "기록 없음",
    beFirst: "첫 번째 기록을 세워 보세요!",
    rank: "순위",
    name: "이름",
    multiplayer: "멀티플레이 대결"
  },
  [InterfaceLanguage.JAPANESE]: {
    start: "スタート",
    leaderboard: "ランキング",
    manual: "マニュアル",
    selectLang: "キーボード選択",
    showHands: "手のガイドを表示",
    quit: "終了",
    score: "スコア",
    wpm: "WPM",
    sessionComplete: "セッション完了",
    enterInitials: "イニシャル入力",
    save: "保存",
    skip: "スキップ",
    backToMenu: "メニューへ",
    manualTitle: "取扱説明書",
    manualClose: "閉じる",
    subtitle: "外国語キーボードをマスター",
    offlineCapable: "オフライン対応",
    difficultyBeginner: "初級",
    difficultyIntermediate: "中級",
    difficultyAdvanced: "上級",
    typeHint: "入力",
    space: "スペース",
    you: "あなた",
    liveRacers: "レーサー",
    highScores: "ハイスコア",
    noRecords: "記録なし",
    beFirst: "最初の記録を作ろう！",
    rank: "順位",
    name: "名前",
    multiplayer: "対戦モード"
  },
  [InterfaceLanguage.CHINESE]: {
    start: "開始",
    leaderboard: "排行榜",
    manual: "說明書",
    selectLang: "選擇鍵盤",
    showHands: "顯示手勢",
    quit: "退出",
    score: "分數",
    wpm: "字/分",
    sessionComplete: "課程完成",
    enterInitials: "輸入姓名縮寫",
    save: "保存",
    skip: "跳過",
    backToMenu: "返回菜單",
    manualTitle: "遊戲說明",
    manualClose: "關閉",
    subtitle: "掌握外語鍵盤",
    offlineCapable: "離線可用",
    difficultyBeginner: "初級",
    difficultyIntermediate: "中級",
    difficultyAdvanced: "高級",
    typeHint: "输入",
    space: "空格",
    you: "你",
    liveRacers: "选手",
    highScores: "最高分",
    noRecords: "暂无记录",
    beFirst: "来创造第一个纪录吧！",
    rank: "排名",
    name: "名字",
    multiplayer: "多人对战"
  },
  [InterfaceLanguage.ARABIC]: {
    start: "بدء",
    leaderboard: "لوحة المتصدرين",
    manual: "دليل",
    selectLang: "اختر لوحة المفاتيح",
    showHands: "إظهار اليدين",
    quit: "خروج",
    score: "نقاط",
    wpm: "كلمة/دقيقة",
    sessionComplete: "اكتملت الجلسة",
    enterInitials: "أدخل الأحرف الأولى",
    save: "حفظ",
    skip: "تخطى",
    backToMenu: "عودة للقائمة",
    manualTitle: "دليل التعليمات",
    manualClose: "إغلاق",
    subtitle: "تعلم لوحات المفاتيح الأجنبية",
    offlineCapable: "يعمل دون اتصال",
    difficultyBeginner: "مبتدئ",
    difficultyIntermediate: "متوسط",
    difficultyAdvanced: "متقدم",
    typeHint: "اكتب",
    space: "مسافة",
    you: "أنت",
    liveRacers: "المتسابقون",
    highScores: "أعلى النتائج",
    noRecords: "لا توجد سجلات",
    beFirst: "كن أول من يسجل نتيجة!",
    rank: "المرتبة",
    name: "الاسم",
    multiplayer: "مبارزة جماعية"
  },
  [InterfaceLanguage.HEBREW]: {
    start: "התחל",
    leaderboard: "לוח תוצאות",
    manual: "מדריך",
    selectLang: "בחר מקלדת",
    showHands: "הצג ידיים",
    quit: "יציאה",
    score: "ניקוד",
    wpm: "מילים/דקה",
    sessionComplete: "הסשן הסתיים",
    enterInitials: "הכנס ראשי תיבות",
    save: "שמור",
    skip: "דלג",
    backToMenu: "חזרה לתפריט",
    manualTitle: "מדריך הוראות",
    manualClose: "סגור",
    subtitle: "למד מקלדות זרות",
    offlineCapable: "עובד אופליין",
    difficultyBeginner: "מתחיל",
    difficultyIntermediate: "בינוני",
    difficultyAdvanced: "מתקדם",
    typeHint: "הקלד",
    space: "רווח",
    you: "אתה",
    liveRacers: "מתחרים",
    highScores: "שיאים",
    noRecords: "אין שיאים עדיין",
    beFirst: "היה הראשון לקבוע שיא!",
    rank: "דירוג",
    name: "שם",
    multiplayer: "דו-קרב מרובה משתתפים"
  }
};

// Every language falls back to English for any string it does not translate
export const UI_STRINGS = Object.fromEntries(
  Object.entries(UI_STRINGS_BY_LANG).map(([lang, strings]) => [lang, { ...UI_STRINGS_BASE, start: "START", ...strings }])
) as Record<InterfaceLanguage, UIStrings>;

const MANUAL_BASE: ManualContent = {
    welcomeTitle: "Welcome to Typing Game",
    welcomeText: "Typing Game helps you build muscle memory for foreign keyboard layouts without needing physical stickers or a new keyboard.",
    howToPlayTitle: "How to Play",
    howToPlaySteps: [
        "Select a Language Layout from the main menu.",
        "Keep your physical hands on your standard keyboard (Home Row: ASDF JKL;).",
        "Look at the Screen, not your hands. The virtual keyboard highlights the key you need to press.",
        "The Ghost Hands will show you exactly which finger to use.",
        "Type the letters to clear the Ice Blocks and keep moving!"
    ],
    tipsTitle: "Tips",
    tipsSteps: [
        "Don't look down! Trust the screen guide.",
        "Orange Key = Target Key.",
        "Blue Key = Key you just pressed.",
        "Use the SHIFT key when indicated to access upper symbols or alternate characters."
    ],
    footerInfo: "VER 1.0 • OFFLINE CAPABLE"
};

export const MANUAL_CONTENT: Record<InterfaceLanguage, ManualContent> = {
    [InterfaceLanguage.ENGLISH]: MANUAL_BASE,
    [InterfaceLanguage.SPANISH]: {
        welcomeTitle: "Bienvenido a Typing Game",
        welcomeText: "Typing Game es una herramienta diseñada para ayudarte a desarrollar memoria muscular para teclados extranjeros sin necesitar pegatinas físicas.",
        howToPlayTitle: "Cómo Jugar",
        howToPlaySteps: [
            "Selecciona un idioma en el menú principal.",
            "Mantén tus manos en tu teclado físico (Fila base: ASDF JKL;).",
            "Mira la pantalla, no tus manos. El teclado virtual resalta la tecla que debes presionar.",
            "Las manos fantasma te mostrarán exactamente qué dedo usar.",
            "¡Escribe las letras para romper los bloques de hielo y mover al personaje!"
        ],
        tipsTitle: "Consejos",
        tipsSteps: [
            "¡No mires abajo! Confía en la guía de pantalla.",
            "Tecla Naranja = Tecla Objetivo.",
            "Tecla Azul = Tecla que acabas de presionar.",
            "Usa la tecla SHIFT cuando se indique para símbolos superiores."
        ],
        footerInfo: "VER 1.0 • MODO OFFLINE"
    },
    [InterfaceLanguage.FRENCH]: {
        welcomeTitle: "Bienvenue sur Typing Game",
        welcomeText: "Un outil conçu pour développer votre mémoire musculaire pour les claviers étrangers sans autocollants physiques.",
        howToPlayTitle: "Comment Jouer",
        howToPlaySteps: [
            "Sélectionnez une disposition de clavier dans le menu.",
            "Gardez vos mains sur votre clavier standard (Position de base).",
            "Regardez l'écran, pas vos mains. Le clavier virtuel illumine la touche à presser.",
            "Les mains fantômes vous montrent quel doigt utiliser.",
            "Tapez les lettres pour briser la glace !"
        ],
        tipsTitle: "Astuces",
        tipsSteps: [
            "Ne regardez pas en bas !",
            "Touche Orange = Cible.",
            "Touche Bleue = Pressée.",
            "Utilisez SHIFT pour les majuscules et symboles."
        ],
        footerInfo: "VER 1.0 • MODE HORS LIGNE"
    },
    [InterfaceLanguage.GERMAN]: {
        welcomeTitle: "Willkommen bei Typing Game",
        welcomeText: "Ein Werkzeug zum Aufbau des Muskelgedächtnisses für fremde Tastaturlayouts ohne physische Aufkleber.",
        howToPlayTitle: "Spielanleitung",
        howToPlaySteps: [
            "Wähle ein Tastaturlayout im Hauptmenü.",
            "Lass deine Hände auf der Grundstellung (ASDF JKL;).",
            "Schau auf den Bildschirm, nicht auf die Hände.",
            "Die Geisterhände zeigen dir den richtigen Finger.",
            "Tippe die Buchstaben, um das Eis zu brechen!"
        ],
        tipsTitle: "Tipps",
        tipsSteps: [
            "Nicht nach unten schauen!",
            "Orange Taste = Ziel.",
            "Blaue Taste = Gedrückt.",
            "Nutze SHIFT für Großbuchstaben."
        ],
        footerInfo: "VER 1.0 • OFFLINE MÖGLICH"
    },
    [InterfaceLanguage.ITALIAN]: {
        welcomeTitle: "Benvenuto in Typing Game",
        welcomeText: "Uno strumento per sviluppare la memoria muscolare per tastiere straniere senza adesivi fisici.",
        howToPlayTitle: "Come Giocare",
        howToPlaySteps: [
            "Seleziona un layout nel menu principale.",
            "Tieni le mani sulla tastiera standard.",
            "Guarda lo schermo, la tastiera virtuale ti guida.",
            "Le mani fantasma mostrano quale dito usare.",
            "Digita le lettere per rompere il ghiaccio!"
        ],
        tipsTitle: "Consigli",
        tipsSteps: [
            "Non guardare in basso!",
            "Tasto Arancione = Obiettivo.",
            "Tasto Blu = Premuto.",
            "Usa SHIFT per i simboli superiori."
        ],
        footerInfo: "VER 1.0 • OFFLINE CAPACE"
    },
    [InterfaceLanguage.PORTUGUESE]: {
        welcomeTitle: "Bem-vindo ao Typing Game",
        welcomeText: "Ferramenta para desenvolver memória muscular para teclados estrangeiros sem adesivos.",
        howToPlayTitle: "Como Jogar",
        howToPlaySteps: [
            "Selecione um layout no menu.",
            "Mantenha as mãos na posição base (ASDF JKL;).",
            "Olhe para a tela. O teclado virtual ilumina a tecla correta.",
            "As mãos fantasmas mostram qual dedo usar.",
            "Digite para quebrar o gelo!"
        ],
        tipsTitle: "Dicas",
        tipsSteps: [
            "Não olhe para baixo!",
            "Tecla Laranja = Alvo.",
            "Tecla Azul = Pressionada.",
            "Use SHIFT para caracteres superiores."
        ],
        footerInfo: "VER 1.0 • MODO OFFLINE"
    },
    [InterfaceLanguage.RUSSIAN]: {
        welcomeTitle: "Добро пожаловать в Typing Game",
        welcomeText: "Инструмент для развития мышечной памяти для иностранных клавиатур без наклеек.",
        howToPlayTitle: "Как играть",
        howToPlaySteps: [
            "Выберите раскладку в меню.",
            "Держите руки в основной позиции (ФЫВА ОЛДЖ).",
            "Смотрите на экран. Виртуальная клавиатура подсвечивает нужную клавишу.",
            "Призрачные руки покажут, какой палец использовать.",
            "Печатайте буквы, чтобы разбить лед!"
        ],
        tipsTitle: "Советы",
        tipsSteps: [
            "Не смотрите на клавиатуру!",
            "Оранжевая клавиша = Цель.",
            "Синяя клавиша = Нажата.",
            "Используйте SHIFT для верхнего регистра."
        ],
        footerInfo: "ВЕР 1.0 • ОФЛАЙН РЕЖИМ"
    },
    [InterfaceLanguage.KOREAN]: {
        welcomeTitle: "Typing Game에 오신 것을 환영합니다",
        welcomeText: "스티커 없이 외국어 키보드 레이아웃의 근육 기억을 기르도록 돕는 도구입니다.",
        howToPlayTitle: "게임 방법",
        howToPlaySteps: [
            "메인 메뉴에서 언어 레이아웃을 선택하세요.",
            "손을 기본 위치(ASDF JKL;)에 두세요.",
            "손이 아닌 화면을 보세요. 가상 키보드가 누를 키를 알려줍니다.",
            "손 가이드가 어떤 손가락을 사용할지 보여줍니다.",
            "글자를 입력해 얼음을 깨세요!"
        ],
        tipsTitle: "팁",
        tipsSteps: [
            "키보드를 보지 마세요!",
            "주황색 키 = 목표 키.",
            "파란색 키 = 방금 누른 키.",
            "위쪽 문자를 입력하려면 SHIFT를 사용하세요."
        ],
        footerInfo: "VER 1.0 • 오프라인 지원"
    },
    [InterfaceLanguage.JAPANESE]: {
        welcomeTitle: "Typing Gameへようこそ",
        welcomeText: "ステッカーなしで外国語キーボードの筋肉の記憶を構築するためのツールです。",
        howToPlayTitle: "遊び方",
        howToPlaySteps: [
            "メニューから言語レイアウトを選択します。",
            "手をホームポジション(ASDF JKL;)に置きます。",
            "手元ではなく画面を見てください。",
            "ゴーストハンドが使うべき指を教えてくれます。",
            "文字を入力して氷を砕きましょう！"
        ],
        tipsTitle: "ヒント",
        tipsSteps: [
            "下を見ないで！",
            "オレンジ色のキー = 目標。",
            "青色のキー = 押したキー。",
            "必要に応じてSHIFTキーを使用してください。"
        ],
        footerInfo: "VER 1.0 • オフライン対応"
    },
    [InterfaceLanguage.CHINESE]: {
        welcomeTitle: "歡迎來到 Typing Game",
        welcomeText: "這是一個無需鍵盤貼紙即可幫助您建立外語鍵盤肌肉記憶的工具。",
        howToPlayTitle: "如何遊玩",
        howToPlaySteps: [
            "在主菜單選擇語言佈局。",
            "將手放在標準位置 (ASDF JKL;)。",
            "看著螢幕，不要看手。虛擬鍵盤會亮起提示。",
            "虛擬手勢會顯示該用哪根手指。",
            "輸入字母打破冰塊！"
        ],
        tipsTitle: "提示",
        tipsSteps: [
            "不要低頭看鍵盤！",
            "橘色鍵 = 目標。",
            "藍色鍵 = 已按下。",
            "使用 SHIFT 鍵輸入上檔字符。"
        ],
        footerInfo: "VER 1.0 • 離線可用"
    },
    [InterfaceLanguage.ARABIC]: {
        welcomeTitle: "مرحبًا بك في Typing Game",
        welcomeText: "أداة مصممة لمساعدتك على بناء الذاكرة العضلية للوحات المفاتيح الأجنبية دون الحاجة إلى ملصقات.",
        howToPlayTitle: "كيف تلعب",
        howToPlaySteps: [
            "اختر تخطيط اللغة من القائمة الرئيسية.",
            "ابق يديك على لوحة المفاتيح القياسية.",
            "انظر إلى الشاشة، وليس يديك.",
            "ستظهر الأيدي الشبحية الإصبع الذي يجب استخدامه.",
            "اطبع الحروف لكسر الجليد!"
        ],
        tipsTitle: "نصائح",
        tipsSteps: [
            "لا تنظر للأسفل!",
            "المفتاح البرتقالي = الهدف.",
            "المفتاح الأزرق = تم الضغط عليه.",
            "استخدم SHIFT للرموز العلوية."
        ],
        footerInfo: "الإصدار 1.0 • يعمل دون اتصال"
    },
    [InterfaceLanguage.HEBREW]: {
        welcomeTitle: "ברוכים הבאים ל-Typing Game",
        welcomeText: "כלי שנועד לעזור לכם לבנות זיכרון שריר למקלדות זרות ללא צורך במדבקות.",
        howToPlayTitle: "איך לשחק",
        howToPlaySteps: [
            "בחרו פריסת שפה מהתפריט הראשי.",
            "הניחו את הידיים על המקלדת בעמדת המוצא.",
            "הסתכלו על המסך, לא על הידיים.",
            "הידיים הווירטואליות יראו לכם באיזו אצבע להשתמש.",
            "הקלידו את האותיות כדי לשבור את הקרח!"
        ],
        tipsTitle: "טיפים",
        tipsSteps: [
            "אל תסתכלו למטה!",
            "מקש כתום = המטרה.",
            "מקש כחול = נלחץ.",
            "השתמשו ב-SHIFT לתווים עליונים."
        ],
        footerInfo: "גרסה 1.0 • עובד אופליין"
    }
};
