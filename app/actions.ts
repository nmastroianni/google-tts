// app/actions.ts
'use server'

// Define the shape of the form data
interface GenerateSpeechData {
  text: string
  engine: 'gemini' | 'cloud-tts'
  geminiAccent: string
  geminiVoice: string
  cloudLanguage: string
  cloudVoice: string
}

interface SpeechResponse {
  audioData: string // This will be base64-encoded (PCM for Gemini, MP3 for Cloud TTS)
  audioType: 'pcm' | 'mp3'
  sampleRate: number // Only for PCM
  fileName: string
}

interface ErrorResponse {
  error: string
}

// Helper to create the timestamp
function getTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

export async function generateSpeech(
  formData: GenerateSpeechData
): Promise<SpeechResponse | ErrorResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { error: 'API key is not configured.' }
  }

  // --- BRANCH 1: GEMINI API ---
  if (formData.engine === 'gemini') {
    try {
      const { text, geminiAccent, geminiVoice } = formData
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`

      const payload = {
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: geminiAccent,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: geminiVoice },
            },
          },
        },
        model: 'gemini-2.5-flash-preview-tts',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        return { error: `Gemini API error: ${errorBody.error.message}` }
      }

      const result = await response.json()
      const part = result?.candidates?.[0]?.content?.parts?.[0]
      const audioData = part?.inlineData?.data
      const mimeType = part?.inlineData?.mimeType

      if (!audioData || !mimeType || !mimeType.startsWith('audio/L16')) {
        return { error: 'Invalid audio data from Gemini API.' }
      }

      const sampleRateMatch = mimeType.match(/rate=(\d+)/)
      const sampleRate = sampleRateMatch
        ? parseInt(sampleRateMatch[1], 10)
        : 24000
      const timestamp = getTimestamp()

      return {
        audioData: audioData,
        audioType: 'pcm',
        sampleRate: sampleRate,
        fileName: `speech_gemini_${geminiVoice}_${timestamp}.mp3`,
      }
    } catch (err) {
      console.error('Gemini Action Error:', err)
      return { error: 'An unexpected error occurred with the Gemini API.' }
    }
  }

  // --- BRANCH 2: CLOUD TTS API ---
  if (formData.engine === 'cloud-tts') {
    try {
      const { text, cloudLanguage, cloudVoice } = formData
      // This API uses a different endpoint
      const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`

      const payload = {
        input: {
          text: text,
        },
        voice: {
          languageCode: cloudLanguage,
          name: cloudVoice, // e.g., "en-US-Wavenet-A"
        },
        audioConfig: {
          audioEncoding: 'MP3', // Ask for an MP3 directly!
        },
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        return { error: `Cloud TTS API error: ${errorBody.error.message}` }
      }

      const result = await response.json()
      const audioData = result.audioContent // This is a base64 MP3 string

      if (!audioData) {
        return { error: 'Invalid audio data from Cloud TTS API.' }
      }

      const timestamp = getTimestamp()

      return {
        audioData: audioData,
        audioType: 'mp3',
        sampleRate: 0, // Not needed for MP3
        fileName: `speech_cloud_${cloudVoice}_${timestamp}.mp3`,
      }
    } catch (err) {
      console.error('Cloud TTS Action Error:', err)
      return { error: 'An unexpected error occurred with the Cloud TTS API.' }
    }
  }

  return { error: 'No valid engine selected.' }
}
