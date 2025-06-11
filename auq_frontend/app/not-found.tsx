"use client"
export const dynamic = "force-dynamic";
import { Suspense } from "react"

function NotFoundContent() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
            <a href="/" className="text-blue-600 underline">Go to Home</a>
        </div>
    )
}

export default function NotFound() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <NotFoundContent />
        </Suspense>
    )
} 