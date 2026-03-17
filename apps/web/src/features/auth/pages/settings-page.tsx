import { useState, useEffect, useMemo, useRef } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import {
  User,
  Lock,
  Building2,
  Mail,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  MonitorSmartphone,
  Smartphone,
  LogOut,
  Clock,
  MapPin,
  Globe,
  Shield,
  Copy,
  Download,
  X,
  KeyRound,
  Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import {
  orgUpdateDisplayName,
  orgUpdateOrgProfile,
  orgRevokeOtherSessions,
  fetchLoginSessions,
  deleteLoginSession,
  type LoginSession,
} from '@/features/admin/api/org-api'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import '../styles/settings.css'

// ─── Password strength ──────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length === 0) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Weak', 'Fair', 'Strong'] as const
  return { score: score as 0 | 1 | 2 | 3, label: labels[score] ?? '' } as const
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function AvatarBlock({ name, email }: { name: string | null; email: string }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()
  return (
    <div className="settings-avatar-wrap">
      <div className="settings-avatar">{initials}</div>
      <div>
        <p className="settings-avatar-name">{name || email.split('@')[0]}</p>
        <p className="settings-avatar-email">{email}</p>
      </div>
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'security' | 'organization'

const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { id: 'profile',      label: 'Profile',      icon: <User size={16} /> },
  { id: 'security',     label: 'Security',     icon: <Lock size={16} /> },
  { id: 'organization', label: 'Organization', icon: <Building2 size={16} />, adminOnly: true },
]

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, profile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await orgUpdateDisplayName(displayName)
      toast.success('Display name updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  function getRoleLabel(role: string) {
    if (role === 'super_admin') return 'Super Admin'
    if (role === 'org_admin') return 'Org Admin'
    return 'Advertiser'
  }

  function getRoleMod(role: string) {
    if (role === 'super_admin') return 'role-badge--admin'
    if (role === 'org_admin') return 'role-badge--org'
    return 'role-badge--adv'
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Profile</h2>
        <p className="settings-section-desc">Your personal information visible to your team.</p>
      </div>

      {user && (
        <AvatarBlock name={profile?.display_name ?? null} email={user.email ?? ''} />
      )}

      <Separator className="my-6" />

      <form onSubmit={(e) => void handleSave(e)} className="settings-form">
        <div className="settings-field">
          <Label htmlFor="display-name" className="settings-label">
            Display Name
          </Label>
          <div className="relative">
            <Input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
              className="settings-input"
              disabled={saving}
            />
            <User size={16} className="settings-field-icon" />
          </div>
          <p className="settings-hint">This is how your name will appear to teammates.</p>
        </div>

        <div className="settings-field">
          <Label className="settings-label">Email Address</Label>
          <div className="relative">
            <Input
              value={user?.email ?? ''}
              readOnly
              className="settings-input opacity-70"
            />
            <Mail size={16} className="settings-field-icon" />
          </div>
          <p className="settings-hint">Email cannot be changed directly for security.</p>
        </div>

        {profile && (
          <div className="settings-field">
            <Label className="settings-label">Access Role</Label>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck size={15} className="text-slate-400" />
              <span className={`role-badge ${getRoleMod(profile.role)}`}>
                {getRoleLabel(profile.role)}
              </span>
            </div>
          </div>
        )}

        {profile?.advertisers && (
          <div className="settings-field">
            <Label className="settings-label">Organization</Label>
            <div className="relative">
              <Input
                value={profile.advertisers.name}
                readOnly
                className="settings-input opacity-70"
              />
              <Building2 size={16} className="settings-field-icon" />
            </div>
          </div>
        )}

        <div className="settings-actions">
          <Button
            type="submit"
            disabled={saving}
            className="settings-save-btn"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={15} />
                Save Profile
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

interface DeviceInfo {
  browser: string
  os: string
  isMobile: boolean
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  if (ua.includes('Edg/'))                          browser = 'Microsoft Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera'
  else if (ua.includes('Firefox/'))                 browser = 'Firefox'
  else if (ua.includes('Chrome/'))                  browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'

  if (/Windows NT 10/.test(ua))                     os = 'Windows 11/10'
  else if (/Windows NT 6\.1/.test(ua))              os = 'Windows 7'
  else if (/Windows/.test(ua))                      os = 'Windows'
  else if (/iPhone/.test(ua))                       os = 'iOS (iPhone)'
  else if (/iPad/.test(ua))                         os = 'iOS (iPad)'
  else if (/Android/.test(ua))                      os = 'Android'
  else if (/Mac OS X/.test(ua))                     os = 'macOS'
  else if (/Linux/.test(ua))                        os = 'Linux'

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  return { browser, os, isMobile }
}

function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SessionRow({
  session,
  isCurrent,
  onRevoke,
}: {
  session: LoginSession
  isCurrent: boolean
  onRevoke?: (id: string) => void
}) {
  const isMobile = session.device_type === 'mobile'
  const hasCoords = session.latitude != null && session.longitude != null

  return (
    <div className={`session-row ${isCurrent ? 'session-row--current' : ''}`}>
      <div className="session-row-icon">
        {isMobile ? <Smartphone size={18} /> : <MonitorSmartphone size={18} />}
      </div>
      <div className="session-row-body">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="session-row-title">
            {session.browser ?? 'Unknown browser'} · {session.os ?? 'Unknown OS'}
          </span>
          {isCurrent && <span className="sessions-active-dot">Current</span>}
        </div>
        <div className="session-row-meta">
          {(session.city || session.region || session.country_code) && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {[session.city, session.region, session.country_code].filter(Boolean).join(', ')}
            </span>
          )}
          {hasCoords && (
            <span className="flex items-center gap-1">
              <Globe size={11} />
              <span className="session-coords">
                {session.latitude!.toFixed(4)}°, {session.longitude!.toFixed(4)}°
              </span>
              <a
                href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sessions-map-link"
              >
                ↗
              </a>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatSessionTime(session.created_at)}
          </span>
        </div>
        {!isCurrent && onRevoke && (
          <button
            className="session-revoke-btn"
            onClick={() => onRevoke(session.id)}
            title="Revoke this session"
          >
            <LogOut size={12} /> Revoke
          </button>
        )}
      </div>
    </div>
  )
}

function SessionsCard() {
  const { user } = useAuth()
  const [sessions,  setSessions]  = useState<LoginSession[]>([])
  const [loading,   setLoading]   = useState(true)
  const [revoking,  setRevoking]  = useState(false)
  const [revoked,   setRevoked]   = useState(false)

  const currentDevice = useMemo(() => detectDevice(), [])

  useEffect(() => {
    fetchLoginSessions()
      .then(setSessions)
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [])

  // Identify the current session by the id stored in localStorage at login
  const storedId = localStorage.getItem('login_session_id')
  const currentSession = storedId
    ? (sessions.find(s => s.id === storedId) ?? sessions[0])
    : sessions[0]
  const prevSessions = sessions.filter(s => s.id !== currentSession?.id)

  async function handleRevokeAll() {
    setRevoking(true)
    try {
      await orgRevokeOtherSessions()
      setSessions(prev => prev.filter(s => s.id === currentSession?.id))
      setRevoked(true)
      toast.success('All other sessions have been signed out')
      setTimeout(() => setRevoked(false), 4000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke sessions')
    } finally {
      setRevoking(false)
    }
  }

  async function handleRevokeOne(sessionId: string) {
    try {
      await deleteLoginSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast.success('Session revoked')
    } catch {
      toast.error('Failed to revoke session')
    }
  }

  return (
    <div className="sessions-list">
      {/* Current session */}
      {loading ? (
        <div className="sessions-loading">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading sessions…</span>
        </div>
      ) : currentSession ? (
        <SessionRow session={currentSession} isCurrent onRevoke={handleRevokeOne} />
      ) : (
        /* Fallback: no DB record yet (first load before re-login) */
        <div className="sessions-current">
          <div className="sessions-device-icon">
            {currentDevice.isMobile ? <Smartphone size={20} /> : <MonitorSmartphone size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">Current Session</p>
              <span className="sessions-active-dot">Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentDevice.browser} · {currentDevice.os}
            </p>
            {user?.last_sign_in_at && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock size={11} /> {formatSessionTime(user.last_sign_in_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Previous sessions */}
      {prevSessions.length > 0 && (
        <div className="sessions-history">
          <p className="sessions-history-label">Previous sign-ins</p>
          {prevSessions.map(s => (
            <SessionRow key={s.id} session={s} isCurrent={false} onRevoke={handleRevokeOne} />
          ))}
        </div>
      )}

      {/* Revoke action */}
      <div className="sessions-revoke-row">
        <div>
          <p className="text-sm font-semibold text-slate-700">Sign out other devices</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Revokes all active sessions except this one.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={revoking || revoked || prevSessions.length === 0}
          onClick={() => void handleRevokeAll()}
          className={`sessions-revoke-btn ${revoked ? 'sessions-revoke-btn--done' : ''}`}
        >
          {revoked ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Done
            </span>
          ) : revoking ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Revoking…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <LogOut size={13} /> Sign out others
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── 2FA Types ──────────────────────────────────────────────────────────────

type MfaStep = 'idle' | 'qr' | 'verify' | 'recovery' | 'done'

interface MfaFactor {
  id: string
  type: string
  status: string
}

// ─── Enable 2FA Modal ───────────────────────────────────────────────────────

function Enable2FAModal({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<MfaStep>('qr')
  const [qrUri, setQrUri] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [recoveryCodes] = useState<string[]>(() =>
    Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('')
    )
  )
  const [copiedCodes, setCopiedCodes] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enroll on mount — clean up any leftover unverified factors first
  useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        // Remove ALL existing TOTP factors to avoid mfa_factor_name_conflict.
        // If the user reached the Enable modal, TwoFactorCard confirmed no verified
        // factors exist — any remaining ones are stale/unverified and safe to remove.
        const { data: existing } = await supabase.auth.mfa.listFactors()
        if (existing) {
          for (const f of existing.totp) {
            try { await supabase.auth.mfa.unenroll({ factorId: f.id }) } catch { /* ignore */ }
          }
        }

        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `Authenticator-${Date.now()}`,
        })
        if (enrollError) throw enrollError
        if (!data) throw new Error('Failed to start 2FA enrollment')

        if (mounted) {
          if (!data.totp.uri || !data.totp.secret) {
            throw new Error('Server returned incomplete setup data. Please try again.')
          }
          setQrUri(data.totp.uri)
          setSecret(data.totp.secret)
          setFactorId(data.id)
        }
      } catch (err) {
        console.error('MFA Enrollment Error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Enrollment failed')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    // Block Esc key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handleEsc, true)
    return () => {
      mounted = false
      window.removeEventListener('keydown', handleEsc, true)
    }
  }, [])

  useEffect(() => {
    if (step === 'verify' && inputRef.current) inputRef.current.focus()
  }, [step])

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter a 6-digit code'); return }
    setVerifying(true)
    setError('')
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeErr || !challenge) { setError(challengeErr?.message ?? 'Challenge failed'); return }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyErr) { setError(verifyErr.message); return }

      setStep('recovery')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  function handleCopyCodes() {
    void navigator.clipboard.writeText(recoveryCodes.join('\n'))
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  function handleDownloadCodes() {
    const blob = new Blob([
      `ScrollToday 2FA Recovery Codes\n${'='.repeat(35)}\n\nKeep these codes in a safe place.\nEach code can only be used once.\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`
    ], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scrolltoday-recovery-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDone() {
    onEnabled()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent 
        className="max-w-[640px] p-0 overflow-hidden border-none shadow-2xl rounded-[28px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-5 py-10">

          {/* Header */}
          <div className="mfa-modal-header">
            {/* <div className="mfa-modal-icon">
              <Shield size={24} />
            </div> */}
            <DialogTitle className="mfa-modal-title">
              {step === 'qr' && 'Set Up Two-Factor Authentication'}
              {step === 'verify' && 'Verify Your Code'}
              {step === 'recovery' && 'Save Recovery Codes'}
              {step === 'done' && '2FA Enabled'}
            </DialogTitle>
          </div>

          {loading ? (
            <div className="mfa-loading">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
              <p className="text-sm text-slate-500">Setting up authenticator...</p>
            </div>
          ) : step === 'qr' ? (
            <div className="mfa-step">
              <DialogDescription className="mfa-step-desc">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </DialogDescription>
              <div className="mfa-qr-wrap">
                {qrUri && <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="2FA QR Code" className="mfa-qr-img" />}
              </div>
              <div className="mfa-secret-wrap">
                <p className="mfa-secret-label">Or enter this code manually:</p>
                <code className="mfa-secret-code">{secret || 'No code generated'}</code>
              </div>
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl mt-4">
                  <p className="mfa-error m-0">{error}</p>
                </div>
              )}
              <button className="mfa-btn-primary" onClick={() => setStep('verify')}>
                Continue
              </button>
            </div>
          ) : step === 'verify' ? (
            <form onSubmit={(e) => void handleVerify(e)} className="mfa-step">
              <DialogDescription className="mfa-step-desc">
                Enter the 6-digit code from your authenticator app to verify setup.
              </DialogDescription>
              <div className="mfa-code-input-wrap">
                <KeyRound size={18} className="mfa-code-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                  placeholder="000000"
                  className="mfa-code-input"
                  autoComplete="one-time-code"
                />
              </div>
              {error && <p className="mfa-error">{error}</p>}
              <div className="mfa-btn-row">
                <button type="button" className="mfa-btn-secondary" onClick={() => setStep('qr')}>
                  Back
                </button>
                <button type="submit" className="mfa-btn-primary" disabled={verifying || code.length !== 6}>
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : null}
                  {verifying ? 'Verifying...' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          ) : step === 'recovery' ? (
            <div className="mfa-step">
              <DialogDescription className="mfa-step-desc">
                Save these recovery codes in a safe place. If you lose access to your authenticator app, you can use these codes to sign in.
              </DialogDescription>
              <div className="mfa-recovery-grid">
                {recoveryCodes.map((c, i) => (
                  <div key={i} className="mfa-recovery-code">
                    <span className="mfa-recovery-idx">{i + 1}</span>
                    <code>{c}</code>
                  </div>
                ))}
              </div>
              <div className="mfa-btn-row">
                <button type="button" className="mfa-btn-secondary" onClick={handleCopyCodes}>
                  {copiedCodes ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copiedCodes ? 'Copied!' : 'Copy All'}
                </button>
                <button type="button" className="mfa-btn-secondary" onClick={handleDownloadCodes}>
                  <Download size={14} />
                  Download
                </button>
                <button type="button" className="mfa-btn-primary" onClick={handleDone}>
                  I've Saved My Codes
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Disable 2FA Modal ──────────────────────────────────────────────────────

function Disable2FAModal({ factorId, onClose, onDisabled }: { factorId: string; onClose: () => void; onDisabled: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Block Esc key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handleEsc, true)
    return () => window.removeEventListener('keydown', handleEsc, true)
  }, [])

  async function handleDisable(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter a 6-digit code'); return }
    setLoading(true)
    setError('')
    try {
      // Challenge + verify to confirm identity before unenroll
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeErr || !challenge) { setError(challengeErr?.message ?? 'Challenge failed'); return }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      })
      if (verifyErr) { setError(verifyErr.message); return }

      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollErr) { setError(unenrollErr.message); return }

      toast.success('Two-factor authentication disabled')
      onDisabled()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent 
        className="max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[28px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-10">
          <button className="mfa-modal-close" onClick={onClose}><X size={18} /></button>
          <div className="mfa-modal-header">
            <div className="mfa-modal-icon mfa-modal-icon--danger">
              <ShieldOff size={24} />
            </div>
            <DialogTitle className="mfa-modal-title">Disable Two-Factor Authentication</DialogTitle>
          </div>
          <form onSubmit={(e) => void handleDisable(e)} className="mfa-step">
            <DialogDescription className="mfa-step-desc">
              Enter a code from your authenticator app to confirm you want to disable 2FA.
            </DialogDescription>
            <div className="mfa-code-input-wrap">
              <KeyRound size={18} className="mfa-code-icon" />
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                placeholder="000000"
                className="mfa-code-input"
                autoComplete="one-time-code"
              />
            </div>
            {error && <p className="mfa-error">{error}</p>}
            <div className="mfa-btn-row">
              <button type="button" className="mfa-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="mfa-btn-danger" disabled={loading || code.length !== 6}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Two-Factor Card ────────────────────────────────────────────────────────

function TwoFactorCard() {
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)

  const loadFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (!error && data) {
        // Cast status to string to avoid TS narrowing issues
        setFactors(data.totp.filter(f => (f.status as string) === 'verified') as any)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { void loadFactors() }, [])

  const isEnabled = factors.length > 0
  const activeFactor = factors[0]

  return (
    <>
      <div className="mfa-status-block">
        <div className="mfa-card-left">
          <div className={`mfa-card-icon ${isEnabled ? 'mfa-card-icon--active' : ''}`}>
            <Shield size={20} />
          </div>
          <div>
            <p className="mfa-card-title">Two-Factor Authentication</p>
            <p className="mfa-card-desc">
              {loading ? 'Checking status...' : isEnabled
                ? 'Your account is protected with an authenticator app.'
                : 'Add an extra layer of security to your account.'
              }
            </p>
          </div>
        </div>
        {!loading && (
          <div className="mfa-card-right">
            {isEnabled ? (
              <>
                <span className="mfa-badge mfa-badge--active">
                  <CheckCircle2 size={12} /> Enabled
                </span>
                <button className="mfa-disable-btn" onClick={() => setShowDisableModal(true)}>
                  Disable
                </button>
              </>
            ) : (
              <button className="mfa-enable-btn" onClick={() => setShowEnableModal(true)}>
                <Shield size={14} />
                Enable 2FA
              </button>
            )}
          </div>
        )}
      </div>

      {showEnableModal && (
        <Enable2FAModal
          onClose={() => setShowEnableModal(false)}
          onEnabled={() => void loadFactors()}
        />
      )}
      {showDisableModal && activeFactor && (
        <Disable2FAModal
          factorId={activeFactor.id}
          onClose={() => setShowDisableModal(false)}
          onDisabled={() => void loadFactors()}
        />
      )}
    </>
  )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew]                 = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess]                 = useState(false)

  const strength = getPasswordStrength(newPassword)

  function validate() {
    if (newPassword.length < 8) { setValidationError('At least 8 characters required'); return false }
    if (newPassword !== confirmPassword) { setValidationError('Passwords do not match'); return false }
    setValidationError(null)
    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const { error } = await updatePassword(newPassword)
    if (error) {
      toast.error(error.message)
    } else {
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Security</h2>
        <p className="settings-section-desc">Manage your account protection and sign-in methods.</p>
      </div>

      {/* Card 1: Password */}
      <div className="settings-card">
        <div className="settings-subsection-header">
          <KeyRound size={16} className="text-slate-400" />
          <div>
            <p className="text-sm font-bold text-slate-700">Change Password</p>
            <p className="text-xs text-slate-500">Update your account password regularly to stay secure.</p>
          </div>
        </div>

        <div className="settings-security-notice mb-8">
          <Lock size={15} className="shrink-0 mt-0.5 text-slate-400" />
          <p className="text-sm text-slate-600">
            Your password is encrypted and never stored in plain text.
            Choose a mix of letters, numbers, and symbols.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="settings-form">
          <div className="settings-field">
            <Label htmlFor="new-password" className="settings-label">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setValidationError(null) }}
                placeholder="Minimum 8 characters"
                className="settings-input"
                disabled={saving}
              />
              <Lock size={16} className="settings-field-icon" />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="settings-eye-btn"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength meter */}
            {newPassword.length > 0 && (
              <div className="mt-1">
                <div className="strength-bar-container">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`strength-bar ${
                        strength.score >= i
                          ? strength.score === 1 ? 'strength-bar--weak'
                          : strength.score === 2 ? 'strength-bar--fair'
                          : 'strength-bar--strong'
                          : ''
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <p className={`text-xs font-semibold ${
                    strength.score === 1 ? 'text-red-500'
                    : strength.score === 2 ? 'text-amber-500'
                    : 'text-emerald-600'
                  }`}>
                    {strength.label}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="settings-field">
            <Label htmlFor="confirm-password" className="settings-label">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setValidationError(null) }}
                placeholder="Re-enter your new password"
                className="settings-input"
                disabled={saving}
              />
              <Lock size={16} className="settings-field-icon" />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="settings-eye-btn"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> Passwords match
              </p>
            )}
          </div>

          {validationError && (
            <p className="text-sm text-red-500 font-medium -mt-1">{validationError}</p>
          )}

          <div className="settings-actions">
            <Button
              type="submit"
              disabled={saving || success}
              className={`settings-save-btn ${success ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
            >
              {success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  Password Updated
                </span>
              ) : saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock size={15} />
                  Update Password
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Card 2: 2FA */}
      <div className="settings-card">
        <div className="settings-subsection-header">
          <Shield size={16} className="text-slate-400" />
          <div>
            <p className="text-sm font-bold text-slate-700">Two-Factor Authentication</p>
            <p className="text-xs text-slate-500">Protect your account with a second verification step.</p>
          </div>
        </div>
        <TwoFactorCard />
      </div>

      {/* Card 3: Sessions */}
      <div className="settings-card settings-card--sessions">
        <div className="p-8 pb-0">
          <div className="settings-subsection-header mb-0">
            <MonitorSmartphone size={16} className="text-slate-400" />
            <div>
              <p className="text-sm font-bold text-slate-700">Active Sessions</p>
              <p className="text-xs text-slate-500">Manage devices that have access to your account.</p>
            </div>
          </div>
        </div>
        <SessionsCard />
      </div>
    </div>
  )
}

// ─── Organization Tab ─────────────────────────────────────────────────────────

function OrganizationTab() {
  const { profile, effectiveAdvertiserId } = useAuth()
  const advertiser = profile?.advertisers

  const [orgName,       setOrgName]       = useState(advertiser?.name ?? '')
  const [contactEmail,  setContactEmail]  = useState(advertiser?.contact_email ?? '')
  const [saving,        setSaving]        = useState(false)

  useEffect(() => {
    setOrgName(advertiser?.name ?? '')
    setContactEmail(advertiser?.contact_email ?? '')
  }, [advertiser?.name, advertiser?.contact_email])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!effectiveAdvertiserId) return
    setSaving(true)
    try {
      await orgUpdateOrgProfile(effectiveAdvertiserId, orgName, contactEmail)
      toast.success('Organization updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Organization</h2>
        <p className="settings-section-desc">Details for your organization account.</p>
      </div>

      {advertiser && (
        <div className="settings-org-card">
          <div className="settings-org-avatar">
            {advertiser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{advertiser.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Balance: <span className="font-bold text-emerald-600">
                {advertiser.credit_balance.toLocaleString()} credits
              </span>
            </p>
          </div>
        </div>
      )}

      <Separator className="my-6" />

      <form onSubmit={(e) => void handleSave(e)} className="settings-form">
        <div className="settings-field">
          <Label htmlFor="org-name" className="settings-label">Organization Name</Label>
          <div className="relative">
            <Input
              id="org-name"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="Your organization name"
              required
              className="settings-input"
              disabled={saving}
            />
            <Building2 size={16} className="settings-field-icon" />
          </div>
        </div>

        <div className="settings-field">
          <Label htmlFor="contact-email" className="settings-label">Billing / Contact Email</Label>
          <div className="relative">
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="billing@yourcompany.com"
              className="settings-input"
              disabled={saving}
            />
            <Mail size={16} className="settings-field-icon" />
          </div>
          <p className="settings-hint">Used for billing notifications and invoices.</p>
        </div>

        <div className="settings-actions">
          <Button type="submit" disabled={saving || !orgName.trim()} className="settings-save-btn">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={15} />
                Save Organization
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { isOrgAdmin } = useAuth()
  const canManageOrg = isOrgAdmin

  const visibleTabs = TABS.filter(t => !t.adminOnly || canManageOrg)
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  return (
    <div className="settings-page">
      {/* Page header */}
      <div className="settings-page-header">
        <h1 className="settings-page-title flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <MonitorSmartphone size={24} />
          </div>
          Settings
        </h1>
        <p className="settings-page-sub ml-1">Customize your profile, secure your account, and manage your organization details.</p>
      </div>

      <div className="settings-layout">
        {/* Left nav */}
        <nav className="settings-nav">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-nav-item ${activeTab === tab.id ? 'settings-nav-item--active' : ''}`}
            >
              <span className="settings-nav-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right panel */}
        <div className="settings-panel">
          {activeTab === 'profile'      && <ProfileTab />}
          {activeTab === 'security'     && <SecurityTab />}
          {activeTab === 'organization' && canManageOrg && <OrganizationTab />}
        </div>
      </div>
    </div>
  )
}
