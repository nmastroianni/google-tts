// app/page.tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

import { generateSpeech } from './actions'
import { accents, voices } from '@/lib/tts-config'

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
import { Spinner } from '@/components/ui/spinner' // Corrected import

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Form state
  const [text, setText] = useState('')
  const [accent, setAccent] = useState('en-US')
  const [voice, setVoice] = useState('Puck')
  const [error, setError] = useState<string | null>(null)

  // useTransition allows us to show a loading state
  const [isPending, startTransition] = useTransition()

  // --- Auth Gate ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </main>
    )
  }
  // --- End Auth Gate ---

  const handleSignOut = async () => {
    await signOut(auth)
    // AuthProvider will detect change and redirect
  }

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await generateSpeech({ text, accent, voice })

      if ('error' in result) {
        setError(result.error)
      } else {
        // --- Trigger MP3 Download ---
        downloadMp3(result.pcmData, result.sampleRate, result.fileName)
      }
    })
  }

  // --- MP3 Download Helper ---
  const downloadMp3 = (
    base64Pcm: string,
    sampleRate: number,
    fileName: string
  ) => {
    try {
      // --- This is the fix ---
      // Check if the script has loaded and created the global variable
      if (typeof lamejs === 'undefined') {
        setError('MP3 encoder library has not loaded yet. Please try again.')
        return
      }

      // 1. Decode base64 PCM data
      const byteCharacters = atob(base64Pcm)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)

      // 2. Convert to 16-bit PCM
      const pcm16 = new Int16Array(byteArray.buffer)

      // 3. Initialize MP3 encoder from the global variable
      const encoder = new lamejs.Mp3Encoder(1, sampleRate, 128) // 1 channel, 24000 Hz, 128 kbps

      // 4. Encode the PCM data
      const mp3Data = encoder.encodeBuffer(pcm16)

      // 5. Finalize the MP3
      const mp3DataEnd = encoder.flush()

      // 6. Create a Blob
      const mp3Blob = new Blob([mp3Data, mp3DataEnd], { type: 'audio/mp3' })

      // 7. Trigger download
      const url = URL.createObjectURL(mp3Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('MP3 encoding failed:', err)
      // Check if it's the specific error we keep seeing
      if (err instanceof ReferenceError && err.message.includes('MPEGMode')) {
        setError(
          'MP3 library failed to load correctly. Please refresh the page.'
        )
      } else {
        setError('Failed to encode MP3 on the client.')
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-10 sm:p-24">
      <Card className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Text-to-Speech Generator</CardTitle>
            <CardDescription>
              Enter text and select an accent and voice to generate audio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="accent">Accent / Language</Label>
                <Select value={accent} onValueChange={setAccent}>
                  <SelectTrigger id="accent">
                    <SelectValue placeholder="Select accent" />
                  </SelectTrigger>
                  <SelectContent>
                    {accents.map((acc) => (
                      <SelectItem key={acc.code} value={acc.code}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="voice">Voice Character</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
