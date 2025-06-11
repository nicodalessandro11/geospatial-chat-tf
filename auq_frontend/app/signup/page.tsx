"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
    const [mounted, setMounted] = useState(false)
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const isFormValid = username && email && password && confirmPassword && password === confirmPassword

    async function handleSubmit(e: React.FormEvent) {
        console.log("[SignUp] Starting signup process");
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // Dynamic import to avoid SSR issues
            const { supabase } = await import("@/lib/supabase-client")
            if (!supabase) throw new Error("Supabase client not available")
            console.log("[SignUp] Supabase client initialized");

            // 0. Check if username is unique
            console.log("[SignUp] Checking if username is unique:", username);
            const { data: existing, error: checkError } = await supabase
                .from("profiles")
                .select("user_id")
                .eq("display_name", username)
                .maybeSingle()
            console.log("[SignUp] Username check result:", { existing, checkError });
            
            if (checkError) {
                console.error("[SignUp] Error checking username:", checkError);
                throw checkError;
            }
            if (existing) {
                console.log("[SignUp] Username already taken");
                setError("Username is already taken. Please choose another.")
                setLoading(false)
                return
            }

            // 1. Sign up user with metadata
            console.log("[SignUp] Attempting to sign up user with email:", email);
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: username
                    }
                }
            });
            console.log('[SignUp] Supabase signUp response:', { 
                data: {
                    user: data?.user ? {
                        id: data.user.id,
                        email: data.user.email,
                        identities: data.user.identities?.length || 0
                    } : null,
                    session: data?.session ? 'Session created' : 'No session'
                },
                error: signUpError ? {
                    message: signUpError.message,
                    status: signUpError.status,
                    name: signUpError.name
                } : null
            });

            if (signUpError) {
                console.error("[SignUp] Signup error details:", {
                    message: signUpError.message,
                    status: signUpError.status,
                    name: signUpError.name
                });
                
                if (signUpError.status === 429) {
                    setError("Too many sign-up attempts. Please wait a few minutes before trying again.");
                } else if (signUpError.message && signUpError.message.toLowerCase().includes("user already registered")) {
                    setError("This email is already registered. Please log in or confirm your email.");
                } else if (signUpError.message && signUpError.message.toLowerCase().includes("email")) {
                    setError("There is already an account with this email. Try logging in or confirming your email.");
                } else {
                    setError(signUpError.message)
                }
                setLoading(false)
                return
            }

            if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                console.log("[SignUp] User exists but has no identities");
                setError("This email is already registered. Please log in or use the password recovery option.");
                setLoading(false);
                return;
            }

            console.log("[SignUp] Signup successful");
            setSuccess(true)
        } catch (err: any) {
            console.error("[SignUp] Unexpected error:", {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            setError(err.message || "An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return null // or a loading spinner
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md bg-card text-card-foreground rounded-xl shadow-lg p-8">
                <img src="/mascot-blue.svg" alt="Queryous" className="w-20 h-20 mx-auto mb-4 bg-primary p-2 rounded-full" />
                <h1 className="text-2xl font-bold mb-2 text-center text-primary">Are u query-ous?</h1>
                <h2 className="text-base font-medium mb-6 text-center text-muted-foreground">Your query journey starts here. Join us!</h2>
                {success ? (
                    <div className="space-y-4">
                        <div className="text-green-600 text-center mb-4">
                            <p className="font-semibold">Account created successfully!</p>
                            <p className="mt-2">Please check your email to confirm your account.</p>
                        </div>
                        <div className="bg-accent p-4 rounded-md text-accent-foreground">
                            <h3 className="font-semibold mb-2">What's next?</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                <li>Check your email inbox (and spam folder)</li>
                                <li>Click the confirmation link in the email</li>
                                <li>Once confirmed, you can log in to your account</li>
                            </ol>
                        </div>
                        <div className="text-center mt-4">
                            <Link href="/" className="text-primary hover:underline">
                                Return to home page
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full"
                                placeholder="your@email.com"
                                required
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                You'll need to confirm this email to activate your account
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full"
                                placeholder="Repeat your password"
                                required
                            />
                        </div>
                        {error && <div className="text-red-600 text-center text-sm">{error}</div>}
                        <div className="flex flex-col space-y-4 pt-2">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={!isFormValid || loading}
                            >
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
} 