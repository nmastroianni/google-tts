// lib/tts-config.ts

// This is the official list of supported language codes for the TTS hint
export const geminiAccents = [
  { name: 'English (US)', code: 'en-US' },
  { name: 'English (India)', code: 'en-IN' },
  { name: 'Spanish (US)', code: 'es-US' },
  { name: 'French (France)', code: 'fr-FR' },
  { name: 'German (Germany)', code: 'de-DE' },
  { name: 'Hindi (India)', code: 'hi-IN' },
  { name: 'Japanese (Japan)', code: 'ja-JP' },
  { name: 'Korean (South Korea)', code: 'ko-KR' },
  { name: 'Portuguese (Brazil)', code: 'pt-BR' },
  { name: 'Russian (Russia)', code: 'ru-RU' },
]

// Voices sorted by type, then alphabetized by name
export const geminiVoices = [
  // Breathy
  { name: 'Enceladus (Breathy)', id: 'Enceladus' },
  // Breezy
  { name: 'Aoede (Breezy)', id: 'Aoede' },
  // Bright
  { name: 'Autonoe (Bright)', id: 'Autonoe' },
  { name: 'Zephyr (Bright)', id: 'Zephyr' },
  // Casual
  { name: 'Zubenelgenubi (Casual)', id: 'Zubenelgenubi' },
  // Clear
  { name: 'Erinome (Clear)', id: 'Erinome' },
  { name: 'Iapetus (Clear)', id: 'Iapetus' },
  // Easy-going
  { name: 'Callirrhoe (Easy-going)', id: 'Callirrhoe' },
  { name: 'Umbriel (Easy-going)', id: 'Umbriel' },
  // Even
  { name: 'Schedar (Even)', id: 'Schedar' },
  // Excitable
  { name: 'Fenrir (Excitable)', id: 'Fenrir' },
  // Firm
  { name: 'Alnilam (Firm)', id: 'Alnilam' },
  { name: 'Kore (Firm)', id: 'Kore' },
  { name: 'Orus (Firm)', id: 'Orus' },
  // Forward
  { name: 'Pulcherrima (Forward)', id: 'Pulcherrima' },
  // Friendly
  { name: 'Achird (Friendly)', id: 'Achird' },
  // Gentle
  { name: 'Vindemiatrix (Gentle)', id: 'Vindemiatrix' },
  // Gravelly
  { name: 'Algenib (Gravelly)', id: 'Algenib' },
  // Informative
  { name: 'Charon (Informative)', id: 'Charon' },
  { name: 'Rasalgethi (Informative)', id: 'Rasalgethi' },
  // Knowledgeable
  { name: 'Sadaltager (Knowledgeable)', id: 'Sadaltager' },
  // Lively
  { name: 'Sadachbia (Lively)', id: 'Sadachbia' },
  // Mature
  { name: 'Gacrux (Mature)', id: 'Gacrux' },
  // Smooth
  { name: 'Algieba (Smooth)', id: 'Algieba' },
  { name: 'Despina (Smooth)', id: 'Despina' },
  // Soft
  { name: 'Achernar (Soft)', id: 'Achernar' },
  // Upbeat
  { name: 'Laomedeia (Upbeat)', id: 'Laomedeia' },
  { name: 'Puck (Upbeat)', id: 'Puck' },
  // Warm
  { name: 'Sulafat (Warm)', id: 'Sulafat' },
  // Youthful
  { name: 'Leda (Youthful)', id: 'Leda' },
]

// --- Engine 2: Cloud TTS (New) ---
// A curated list of high-quality WaveNet voices
// We can add more from https://cloud.google.com/text-to-speech/docs/voices
export const cloudTtsLanguages = [
  { name: 'English (US)', code: 'en-US' },
  { name: 'English (UK)', code: 'en-GB' },
  { name: 'Spanish (Spain)', code: 'es-ES' },
  { name: 'Spanish (Mexico)', code: 'es-MX' },
  { name: 'French (France)', code: 'fr-FR' },
  { name: 'German (Germany)', code: 'de-DE' },
  { name: 'Italian (Italy)', code: 'it-IT' },
  { name: 'Japanese (Japan)', code: 'ja-JP' },
  { name: 'Korean (South Korea)', code: 'ko-KR' },
  { name: 'Portuguese (Brazil)', code: 'pt-BR' },
]

// We can add more voices (A, B, C, D, etc.) for each language
export const cloudTtsVoices = [
  // English (US)
  { name: 'WaveNet (A) - Female', code: 'en-US-Wavenet-A', lang: 'en-US' },
  { name: 'WaveNet (B) - Male', code: 'en-US-Wavenet-B', lang: 'en-US' },
  { name: 'WaveNet (C) - Female', code: 'en-US-Wavenet-C', lang: 'en-US' },
  { name: 'WaveNet (D) - Male', code: 'en-US-Wavenet-D', lang: 'en-US' },
  // English (UK)
  { name: 'WaveNet (A) - Female', code: 'en-GB-Wavenet-A', lang: 'en-GB' },
  { name: 'WaveNet (B) - Male', code: 'en-GB-Wavenet-B', lang: 'en-GB' },
  // Spanish (Spain)
  { name: 'WaveNet (A) - Female', code: 'es-ES-Wavenet-A', lang: 'es-ES' },
  { name: 'WaveNet (B) - Male', code: 'es-ES-Wavenet-B', lang: 'es-ES' },
  // Spanish (Mexico)
  { name: 'WaveNet (A) - Female', code: 'es-MX-Wavenet-A', lang: 'es-MX' },
  { name: 'WaveNet (B) - Male', code: 'es-MX-Wavenet-B', lang: 'es-MX' },
  // French (France)
  { name: 'WaveNet (A) - Female', code: 'fr-FR-Wavenet-A', lang: 'fr-FR' },
  { name: 'WaveNet (B) - Male', code: 'fr-FR-Wavenet-B', lang: 'fr-FR' },
  // German (Germany)
  { name: 'WaveNet (A) - Female', code: 'de-DE-Wavenet-A', lang: 'de-DE' },
  { name: 'WaveNet (B) - Male', code: 'de-DE-Wavenet-B', lang: 'de-DE' },
  // ... (you can add more from the docs)
]
