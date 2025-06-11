"use client"
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"

export default function AuthCallback() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)
    const [isRedirecting, setIsRedirecting] = useState(false)

    useEffect(() => {
        if (!searchParams || !supabase) {
            setError("Authentication system not properly initialized")
            return
        }

        // Get error info from query params
        let urlError = searchParams.get("error")
        let errorCode = searchParams.get("error_code")
        let errorDescription = searchParams.get("error_description")

        // If not in query params, try to get from hash fragment
        if (!urlError) {
            const hash = window.location.hash.substring(1)
            const hashParams = new URLSearchParams(hash)
            urlError = urlError || hashParams.get("error")
            errorCode = errorCode || hashParams.get("error_code")
            errorDescription = errorDescription || hashParams.get("error_description")
        }

        if (urlError === "access_denied" && errorCode === "otp_expired") {
            setError("The confirmation link is invalid or has expired. Please sign up again or request a new confirmation email.")
            return
        }

        // Get tokens from query params
        let access_token = searchParams.get("access_token")
        let refresh_token = searchParams.get("refresh_token")

        // If not in query params, try to get from hash fragment
        if (!access_token || !refresh_token) {
            const hash = window.location.hash.substring(1)
            const hashParams = new URLSearchParams(hash)
            access_token = access_token || hashParams.get("access_token")
            refresh_token = refresh_token || hashParams.get("refresh_token")
        }

        console.log("Auth callback - Tokens:", { access_token: !!access_token, refresh_token: !!refresh_token })

        if (access_token && refresh_token) {
            console.log("Setting session with tokens...")
            setIsRedirecting(true)

            // Set a timeout for the entire operation
            const timeoutId = setTimeout(() => {
                console.log("Timeout reached, forcing navigation...")
                window.location.replace("/")
            }, 5000) // 5 seconds timeout

            supabase.auth.setSession({ access_token, refresh_token })
                .then(async ({ error }) => {
                    if (error) {
                        clearTimeout(timeoutId)
                        console.error("Error setting session:", error)
                        setError("Error confirming your email. Please try logging in.")
                        setIsRedirecting(false)
                    } else {
                        console.log("Session set successfully, redirecting to home...")
                        try {
                            // Try multiple redirection methods
                            try {
                                router.push("/")
                            } catch (e) {
                                console.log("Router push failed, trying replace...")
                                router.replace("/")
                            }

                            // Fallback to window.location after a short delay
                            setTimeout(() => {
                                console.log("Using window.location fallback...")
                                window.location.replace("/")
                            }, 1000)
                        } catch (err) {
                            console.error("Error during navigation:", err)
                            setError("Error redirecting to home. Please try logging in manually.")
                            setIsRedirecting(false)
                        }
                    }
                })
                .catch(err => {
                    clearTimeout(timeoutId)
                    console.error("Unexpected error setting session:", err)
                    setError("An unexpected error occurred. Please try logging in.")
                    setIsRedirecting(false)
                })
        } else if (urlError) {
            console.error("Auth error:", { urlError, errorCode, errorDescription })
            setError(errorDescription || "Authentication error: " + urlError.replace(/_/g, " "))
        } else {
            console.error("No tokens or error found in URL")
            setError("Invalid or missing confirmation tokens.")
        }
    }, [searchParams, router])

    if (error) {
        return (
            <div className="text-center mt-8">
                <div className="text-red-600 mb-4">{error}</div>
                <a href="/signup" className="text-blue-600 underline">Sign up again</a>
            </div>
        )
    }
    return (
        <div className="text-center mt-8">
            {isRedirecting ? (
                <>
                    <div className="mb-4">Email confirmed successfully!</div>
                    <div>Redirecting to home page...</div>
                    <div className="mt-4">
                        <a href="/" className="text-blue-600 underline">
                            Click here if you are not redirected automatically
                        </a>
                    </div>
                </>
            ) : (
                "Confirming your email, please wait..."
            )}
        </div>
    )
} 