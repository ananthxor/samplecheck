import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router'
import { toast } from 'sonner'
import { Shield, KeyRound, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import '../styles/verify-2fa.css'

export default function Verify2FAPage() {
  const { user, isLoading, mfaRequired, verifyMfa, signOut } = useAuth()
  const [code, setCode] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Already verified MFA (or MFA not required)
  if (!mfaRequired) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return

    setError('')
    setIsVerifying(true)

    const { error: verifyError } = await verifyMfa(code, rememberDevice)

    if (verifyError) {
      setError(verifyError.message)
      setCode('')
      setIsVerifying(false)
      inputRef.current?.focus()
    } else {
      toast.success('Signed in successfully')
    }
  }

  function handleCodeChange(value: string) {
    // Only allow digits, max 6
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setCode(cleaned)
    setError('')
  }

  async function handleBackToLogin() {
    await signOut()
  }

  return (
    <div className="verify-2fa-page">
      <div className="verify-2fa-card">
        {/* Header */}
        <div className="verify-2fa-header">
          <div className="verify-2fa-icon">
            <Shield size={28} />
          </div>
          <h1 className="verify-2fa-title">Two-Factor Authentication</h1>
          <p className="verify-2fa-desc">
            Enter the 6-digit code from your authenticator app to complete sign in.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="verify-2fa-form">
          <div className="verify-2fa-input-wrap">
            <KeyRound size={18} className="verify-2fa-input-icon" />
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="verify-2fa-input"
              disabled={isVerifying}
              maxLength={6}
            />
          </div>

          {error && <p className="verify-2fa-error">{error}</p>}

          <label className="verify-2fa-remember">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="verify-2fa-remember-checkbox"
            />
            <span>Remember this device for 7 days</span>
          </label>

          <button
            type="submit"
            disabled={code.length !== 6 || isVerifying}
            className="verify-2fa-submit"
          >
            {isVerifying ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <Shield size={18} />
                Verify & Sign In
              </>
            )}
          </button>
        </form>

        {/* Back to login */}
        <button
          type="button"
          onClick={() => void handleBackToLogin()}
          className="verify-2fa-back"
        >
          <ArrowLeft size={14} />
          Back to login
        </button>
      </div>
    </div>
  )
}
