"use client"
export const dynamic = "force-dynamic";
import { useState, Suspense } from "react"
import { MapProvider } from "@/contexts/map-context"
import { Header } from "@/components/header"
import { ConfigView } from "@/components/config-view"
import { LoginModal } from "@/components/login-modal"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

function ConfigContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <MapProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {isAuthenticated ? (
            <ConfigView />
          ) : (
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Login Required</h1>
                <p className="text-muted-foreground mb-4">Please log in to access your configuration settings.</p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </main>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    </MapProvider>
  )
}

export default function ConfigPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <ConfigContent />
    </Suspense>
  )
}
