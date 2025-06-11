"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type SupabaseClient, type User as SupabaseUser } from "@supabase/supabase-js"
import { supabase, getUserProfile } from "@/lib/supabase-client"
import { analyticsLogger } from "@/lib/analytics/logger"

// Extended user type
export type User = {
  id: string
  email: string
  display_name?: string
  is_admin?: boolean
  role?: string
  email_confirmed?: boolean
}

/**
 * Auth context type
 */
type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  supabase: SupabaseClient | null
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state and listen for changes
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!supabase) return;
      if (session?.user) {
        const profile = await getUserProfile(session.user.id)
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          display_name: profile?.display_name,
          is_admin: profile?.is_admin,
          email_confirmed: session.user.email_confirmed_at !== null
        })
      } else {
        setUser(null)
      }
    })

    // Check for existing session on mount
    const checkSession = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }
      const { data } = await supabase.auth.getSession()
      if (data.session && data.session.user) {
        const profile = await getUserProfile(data.session.user.id)
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || "",
          display_name: profile?.display_name,
          is_admin: profile?.is_admin,
          email_confirmed: data.session.user.email_confirmed_at !== null
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }
    checkSession()
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    if (!supabase) return { success: false, error: "Supabase not initialized" }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setIsLoading(false)
        // Log error SOLO si hay usuario autenticado
        // (no loguear eventos de login fallido para usuarios anónimos)
        return { success: false, error: error.message }
      }
      if (data.user) {
        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          setIsLoading(false)
          return {
            success: false,
            error: "Please confirm your email before logging in. Check your inbox for the confirmation link."
          }
        }

        const profile = await getUserProfile(data.user.id)
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          display_name: profile?.display_name,
          is_admin: profile?.is_admin,
          email_confirmed: true
        })
        // Log successful login
        await analyticsLogger.logEvent({
          user_id: data.user.id,
          event_type: 'auth.login',
          event_details: {
            method: 'email',
            success: true
          }
        })
        setIsLoading(false)
        return { success: true }
      }
      setIsLoading(false)
      return { success: false, error: "Authentication failed" }
    } catch (error: any) {
      setIsLoading(false)
      // Log error SOLO si hay usuario autenticado
      // (no loguear eventos de error para usuarios anónimos)
      return { success: false, error: error.message || "An unexpected error occurred" }
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    setIsLoading(true)
    if (supabase && user) {
      // Log logout
      await analyticsLogger.logEvent({
        user_id: user.id,
        event_type: 'auth.logout',
        event_details: {}
      })
      await supabase.auth.signOut()
      setUser(null)
    }
    setIsLoading(false)
  }

  /**
   * Refresh the user profile and update context
   */
  const refreshUser = async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    if (data.session && data.session.user) {
      const profile = await getUserProfile(data.session.user.id)
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || "",
        display_name: profile?.display_name,
        is_admin: profile?.is_admin,
        email_confirmed: data.session.user.email_confirmed_at !== null
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        supabase,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
