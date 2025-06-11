"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { UserLoginModal } from "@/components/user-login-modal"
import { User } from "@supabase/supabase-js"

export function Header() {
    const { user, logout } = useAuth()
    const [showLoginModal, setShowLoginModal] = useState(false)

    return (
        <header className="border-b">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/mascot-blue.svg" alt="Queryous" className="h-8 w-8" />
                        <span className="text-xl font-bold">Are-u-Query-ous</span>
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                Welcome, {(user as User & { user_metadata: { display_name: string } }).user_metadata.display_name}
                            </span>
                            <Button variant="outline" onClick={logout}>
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={() => setShowLoginModal(true)}>Sign In</Button>
                    )}
                </div>
            </div>
            <UserLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </header>
    )
} 