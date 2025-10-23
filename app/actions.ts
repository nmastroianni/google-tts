// app/actions.ts
'use server'

// We don't need wav-helpers anymore!

// Define the shape of the form data
interface GenerateSpeechData {
  text: string
  accent: string
  voice: string
}

// This is what we'll send to the client
interface SpeechResponse {
  pcmData: string // The raw base64 audio
  sampleRate: number
  fileName: string
}

interface ErrorResponse {
  error: string
}

export async function generateSpeech(
  formData: GenerateSpeechData
): Promise<SpeechResponse | ErrorResponse> {
  const { text, accent, voice } = formData
  const promptedText = `(language: ${accent}) ${text}`

  try {
    const apiKey = process.env.GEMINI_API_KEY // Canvas will inject this
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`

    const payload = {
      // ... (payload is the same as before)
      contents: [
        {
          parts: [{ text: promptedText }],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
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
      console.error('API Error:', errorBody)
      return { error: `API request failed: ${errorBody.error.message}` }
    }

    const result = await response.json()
    const part = result?.candidates?.[0]?.content?.parts?.[0]
    const audioData = part?.inlineData?.data
    const mimeType = part?.inlineData?.mimeType

    if (!audioData || !mimeType || !mimeType.startsWith('audio/L16')) {
      return { error: 'Invalid audio data received from API.' }
    }

    // Extract sample rate
    const sampleRateMatch = mimeType.match(/rate=(\d+)/)
    const sampleRate = sampleRateMatch
      ? parseInt(sampleRateMatch[1], 10)
      : 24000
    // --- Create a safe timestamp ---
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0') // JS months are 0-indexed
    const day = now.getDate().toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')

    // Format: YYYYMMDD_HHMMSS (e.g., 20251023_081530)
    const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`
    // -------------------------------
    // Just return the raw data and sample rate
    return {
      pcmData: audioData,
      sampleRate: sampleRate,
      fileName: `speech_${voice}_${accent}_${timestamp}.mp3`, // Note the new .mp3 extension
    }
  } catch (err) {
    console.error('Server Action Error:', err)
    return { error: 'An unexpected error occurred on the server.' }
  }
}
