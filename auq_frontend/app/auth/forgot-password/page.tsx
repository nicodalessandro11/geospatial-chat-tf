"use client"
export const dynamic = "force-dynamic";
import { useState, Suspense } from "react"
import { supabase } from "@/lib/supabase-client"

function ForgotPasswordContent() {
    const [email, setEmail] = useState("")
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)
        if (!supabase) {
            setError("Supabase client not available")
            return
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
        })
        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold mb-4">Forgot your password?</h2>
                {success ? (
                    <div className="text-green-600 mb-4">
                        Check your email for a password reset link.
                    </div>
                ) : (
                    <>
                        <input
                            type="email"
                            className="w-full border rounded px-3 py-2 mb-4"
                            placeholder="Your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        {error && <div className="text-red-600 mb-2">{error}</div>}
                        <button
                            type="submit"
                            className="w-full bg-primary text-white py-2 rounded"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send reset link"}
                        </button>
                    </>
                )}
            </form>
        </div>
    )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordContent />
        </Suspense>
    )
}