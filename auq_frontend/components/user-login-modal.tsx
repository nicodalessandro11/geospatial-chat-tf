"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

type UserLoginModalProps = {
    isOpen: boolean
    onClose: () => void
    error?: string | null
    isLoading?: boolean
    email?: string
    password?: string
    setEmail?: (v: string) => void
    setPassword?: (v: string) => void
    onSubmit?: (e: React.FormEvent) => void
}

export function UserLoginModal({ isOpen, onClose, error, isLoading, email, password, setEmail, setPassword, onSubmit }: UserLoginModalProps) {
    const { login, isLoading: ctxLoading } = useAuth()
    const [internalEmail, setInternalEmail] = useState("")
    const [internalPassword, setInternalPassword] = useState("")
    const [internalError, setInternalError] = useState<string | null>(null)
    const [internalLoading, setInternalLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        if (onSubmit) return onSubmit(e)
        e.preventDefault()
        setInternalError(null)
        setInternalLoading(true)
        if (!internalEmail || !internalPassword) {
            setInternalError("Please enter both email and password")
            setInternalLoading(false)
            return
        }
        try {
            const result = await login(internalEmail, internalPassword)
            if (!result.success) {
                setInternalError(result.error || "Login failed")
                setInternalLoading(false)
                return
            }
            setInternalEmail("")
            setInternalPassword("")
            setInternalError(null)
            setInternalLoading(false)
            onClose()
        } catch (err: any) {
            setInternalError(err.message || "An unexpected error occurred")
            setInternalLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] fixed z-[9999]">
                <DialogHeader>
                    <img src="/mascot-blue.svg" alt="Queryous" className="w-20 h-20 mx-auto mb-4 bg-blue-600 p-2 rounded-full" />
                    <DialogTitle className="text-center text-2xl">Welcome Back!</DialogTitle>
                    <DialogDescription className="text-center">
                        Sign in to continue your query journey
                    </DialogDescription>
                </DialogHeader>

                {(error || internalError) && (
                    <Alert variant="destructive" className="my-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || internalError}
                            {(error || internalError)?.includes("confirm your email") && (
                                <div className="mt-2">
                                    <p>If you haven't received the confirmation email:</p>
                                    <ol className="list-decimal list-inside mt-1">
                                        <li>Check your spam folder</li>
                                        <li>Make sure you used the correct email address</li>
                                        <li>You can <Link href="/signup" className="underline">sign up again</Link> if needed</li>
                                    </ol>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email ?? internalEmail}
                            onChange={(e) => (setEmail ? setEmail(e.target.value) : setInternalEmail(e.target.value))}
                            disabled={isLoading ?? internalLoading ?? ctxLoading}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password ?? internalPassword}
                            onChange={(e) => (setPassword ? setPassword(e.target.value) : setInternalPassword(e.target.value))}
                            disabled={isLoading ?? internalLoading ?? ctxLoading}
                            className="w-full"
                        />
                    </div>

                    <div className="flex flex-col space-y-4 pt-2">
                        <Button type="submit" disabled={isLoading ?? internalLoading ?? ctxLoading} className="w-full">
                            {(isLoading ?? internalLoading ?? ctxLoading) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
} 