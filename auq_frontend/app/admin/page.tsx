"use client"
export const dynamic = "force-dynamic";
import { Suspense } from "react"
import { MapProvider } from "@/contexts/map-context"
import { Header } from "@/components/header"
import { AdminView } from "@/components/admin-view"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

function AdminContent() {
  const { isAuthenticated, isLoading } = useAuth()

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
            <AdminView />
          ) : (
            <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
                <p className="text-muted-foreground mb-4">You need to be logged in to access the admin dashboard.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </MapProvider>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <AdminContent />
    </Suspense>
  )
}
