// app/page.tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

import { generateSpeech } from './actions'
import {
  geminiAccents,
  geminiVoices,
  cloudTtsLanguages,
  cloudTtsVoices,
} from '@/lib/tts-config'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

type SpeechEngine = 'gemini' | 'cloud-tts'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- Form State ---
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Engine selection
  const [engine, setEngine] = useState<SpeechEngine>('gemini')

  // Gemini state
  const [geminiAccent, setGeminiAccent] = useState('en-US')
  const [geminiVoice, setGeminiVoice] = useState('Puck')

  // Cloud TTS state
  const [cloudLanguage, setCloudLanguage] = useState('en-US')
  const [cloudVoice, setCloudVoice] = useState('en-US-Wavenet-A')

  // --- Auth Gate ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Filter voices based on selected Cloud TTS language
  const availableCloudVoices = cloudTtsVoices.filter(
    (v) => v.lang === cloudLanguage
  )

  // Update cloud voice when language changes
  const handleCloudLanguageChange = (newLangCode: string) => {
    // 1. Update the language
    setCloudLanguage(newLangCode)

    // 2. Find the first voice for this new language
    const firstVoice = cloudTtsVoices.find((v) => v.lang === newLangCode)

    // 3. Set the voice state to that first voice
    if (firstVoice) {
      setCloudVoice(firstVoice.code)
    }
  }

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </main>
    )
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await generateSpeech({
        text,
        engine,
        geminiAccent,
        geminiVoice,
        cloudLanguage,
        cloudVoice,
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        // This is now much simpler!
        if (result.audioType === 'mp3') {
          // Cloud TTS provided a direct MP3
          downloadAudio(result.audioData, result.fileName, 'audio/mp3')
        } else {
          // Gemini provided PCM, we still need to encode
          // We check for the global 'lamejs' loaded from layout.tsx
          if (typeof lamejs === 'undefined') {
            setError(
              'MP3 encoder library has not loaded yet. Please try again.'
            )
            return
          }
          const mp3Blob = encodePcmToMp3(result.audioData, result.sampleRate)
          if (mp3Blob) {
            downloadBlob(mp3Blob, result.fileName)
          }
        }
      }
    })
  }

  // --- Download Helper 1: For Base64 strings (MP3 from Cloud TTS) ---
  const downloadAudio = (
    base64Data: string,
    fileName: string,
    mimeType: string
  ) => {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    downloadBlob(blob, fileName)
  }

  // --- Download Helper 2: For Blobs (MP3 from lamejs) ---
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // --- MP3 Encoding Helper (for Gemini PCM) ---
  const encodePcmToMp3 = (
    base64Pcm: string,
    sampleRate: number
  ): Blob | null => {
    try {
      const byteCharacters = atob(base64Pcm)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const pcm16 = new Int16Array(byteArray.buffer)

      const encoder = new lamejs.Mp3Encoder(1, sampleRate, 128)
      const mp3Data = encoder.encodeBuffer(pcm16)
      const mp3DataEnd = encoder.flush()
      return new Blob([mp3Data, mp3DataEnd], { type: 'audio/mp3' })
    } catch (err) {
      console.error('MP3 encoding failed:', err)
      setError('Failed to encode MP3 on the client.')
      return null
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-10 sm:p-24">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Text-to-Speech Generator</CardTitle>
            <CardDescription>
              Select an engine and options to generate audio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {/* --- Engine Selector --- */}
            <div className="grid gap-2">
              <Label>TTS Engine</Label>
              <RadioGroup
                defaultValue="gemini"
                value={engine}
                onValueChange={(val: string) => setEngine(val as SpeechEngine)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gemini" id="r-gemini" />
                  <Label htmlFor="r-gemini" className="font-normal">
                    Gemini (Best Quality)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cloud-tts" id="r-cloud" />
                  <Label htmlFor="r-cloud" className="font-normal">
                    Cloud TTS (Free Tier)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* --- Text Area --- */}
            <div className="grid gap-2">
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                placeholder="Type your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={5}
              />
            </div>

            {/* --- CONDITIONAL: Gemini Options --- */}
            {engine === 'gemini' && (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                key="gemini-options"
              >
                <div className="grid gap-2">
                  <Label htmlFor="gemini-accent">Accent / Language</Label>
                  <Select value={geminiAccent} onValueChange={setGeminiAccent}>
                    <SelectTrigger id="gemini-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {geminiAccents.map((acc) => (
                        <SelectItem key={acc.code} value={acc.code}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gemini-voice">Voice Character</Label>
                  <Select value={geminiVoice} onValueChange={setGeminiVoice}>
                    <SelectTrigger id="gemini-voice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {geminiVoices.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* --- CONDITIONAL: Cloud TTS Options --- */}
            {engine === 'cloud-tts' && (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                key="cloud-options"
              >
                <div className="grid gap-2">
                  <Label htmlFor="cloud-lang">Language</Label>
                  <Select
                    value={cloudLanguage}
                    onValueChange={handleCloudLanguageChange}
                  >
                    <SelectTrigger id="cloud-lang">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cloudTtsLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cloud-voice">Voice</Label>
                  <Select value={cloudVoice} onValueChange={setCloudVoice}>
                    <SelectTrigger id="cloud-voice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCloudVoices.map((v) => (
                        <SelectItem key={v.code} value={v.code}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
            <Button type="submit" disabled={isPending || !text}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Generating...
                </>
              ) : (
                'Generate Audio'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Logged in as {user.email}
      </p>
    </main>
  )
}
