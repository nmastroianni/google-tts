// src/app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const router = useRouter()
  // We get `loading` and rename it to `authLoading`
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ADD THIS
  useEffect(() => {
    // Wait until auth is checked, then redirect if the user is already logged in
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Handle standard email/password sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // On success, the AuthProvider will detect the user
      // and the home page will stop redirecting.
      router.push('/')
    } catch (err) {
      console.error(err)
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  // Handle "Forgot Password"
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email to reset your password.')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess('Password reset link sent! Check your inbox.')
    } catch (err) {
      console.error(err)
      setError('Failed to send reset link. Is the email correct?')
    }
    setLoading(false)
  }
  if (authLoading || user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <Spinner className="h-12 w-12" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the application.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm font-medium text-emerald-600">{success}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={handlePasswordReset}
              disabled={loading}
            >
              Forgot Password?
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
