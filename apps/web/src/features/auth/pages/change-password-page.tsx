import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'

export default function ChangePasswordPage() {
  const { updatePassword, mustChangePassword } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  function validate(): boolean {
    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return false
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match')
      return false
    }
    setValidationError(null)
    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    const { error } = await updatePassword(newPassword)

    if (error) {
      toast.error(error.message)
      setIsSubmitting(false)
    } else {
      toast.success('Password changed successfully')
      void navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Change Password
        </h1>

        {mustChangePassword && (
          <p className="text-sm text-amber-600 text-center mb-6">
            You must change your password before continuing.
          </p>
        )}

        {!mustChangePassword && (
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter a new password for your account.
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setValidationError(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Minimum 8 characters"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setValidationError(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Re-enter your new password"
              disabled={isSubmitting}
            />
          </div>

          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Changing password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
