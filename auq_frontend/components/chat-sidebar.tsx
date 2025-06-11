"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Send, Bot, User, AlertCircle, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react"
import { useMapContext } from "@/contexts/map-context"
import { useNLPAgent } from "@/hooks/useNLPAgent"
import { ApiTest } from "./api-test"

type Message = {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  executionTime?: number
  success?: boolean
}

export function ChatSidebar() {
  const { selectedCity, selectedArea } = useMapContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'unknown'>('unknown')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialMessageSent = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use NLP Agent hook
  const { askQuestion, checkHealth, isLoading, error } = useNLPAgent()

  // Fix z-index for AlertDialog overlay to appear above Leaflet map
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      [data-radix-popper-content-wrapper] {
        z-index: 10000 !important;
      }
      .fixed.inset-0[data-state="open"] {
        z-index: 9999 !important;
      }
      [role="dialog"][data-state="open"] {
        z-index: 10000 !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Check API health on mount
  useEffect(() => {
    const initializeHealth = async () => {
      try {
        const health = await checkHealth()
        setHealthStatus(health.status as 'healthy' | 'unhealthy')
      } catch (err) {
        console.error('Failed to check NLP API health:', err)
        setHealthStatus('unhealthy')
      }
    }
    initializeHealth()
  }, [checkHealth])

  // Send initial welcome message
  useEffect(() => {
    if (!initialMessageSent.current) {
      const welcomeMessage = healthStatus === 'healthy'
        ? "Hello! I'm your intelligent geospatial assistant powered by AI. Ask me anything about Barcelona's urban data - population, demographics, districts, neighborhoods, and more!"
        : "Hello! I'm your geospatial assistant. I'm currently having trouble connecting to the AI service, but I'm here to help with basic information."

      setMessages([
        {
          id: "1",
          content: welcomeMessage,
          sender: "bot",
          timestamp: new Date(),
          success: healthStatus === 'healthy'
        },
      ])
      initialMessageSent.current = true
    }
  }, [healthStatus])

  // Send context message when city or area changes
  useEffect(() => {
    if (!initialMessageSent.current) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set a new timeout to send the message
    timeoutRef.current = setTimeout(() => {
      if (selectedCity && !selectedArea) {
        const cityMessage: Message = {
          id: Date.now().toString(),
          content: `You're now viewing ${selectedCity.name}. I can help you explore data about this city - just ask me about districts, neighborhoods, population, demographics, or any other urban indicators you're curious about!`,
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, cityMessage])
      } else if (selectedArea) {
        const areaType = 'district_id' in selectedArea ? "neighborhood" : "district"
        const areaMessage: Message = {
          id: Date.now().toString(),
          content: `You've selected the ${areaType} "${selectedArea.name}". I can provide detailed analysis about this area using AI. Try asking questions like:\n\n` +
            `• "What's the population of ${selectedArea.name}?"\n` +
            `• "How does ${selectedArea.name} compare to other areas?"\n` +
            `• "Tell me about the demographics in this area"\n` +
            `• "What are the key characteristics of ${selectedArea.name}?"\n\n` +
            `What would you like to know?`,
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, areaMessage])
      }
    }, 100)

    // Cleanup function to clear the timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [selectedCity?.id, selectedArea?.id])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    const originalQuestion = inputValue
    setInputValue("")

    // If API is unhealthy, provide fallback response
    if (healthStatus !== 'healthy') {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, the AI service is currently unavailable. Please try again later or check your internet connection.",
        sender: "bot",
        timestamp: new Date(),
        success: false
      }
      setMessages((prev) => [...prev, fallbackMessage])
      return
    }

    try {
      // Enhance question with context if available
      let contextualQuestion = originalQuestion
      if (selectedArea) {
        const areaType = 'district_id' in selectedArea ? "neighborhood" : "district"
        contextualQuestion = `In the context of the ${areaType} "${selectedArea.name}" in ${selectedCity?.name || 'Barcelona'}: ${originalQuestion}`
      } else if (selectedCity) {
        contextualQuestion = `In the context of ${selectedCity.name}: ${originalQuestion}`
      }

      // Build conversation history for context (last 6 messages)
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }))

      // Use NLP Agent with conversation context
      const response = await askQuestion({
        question: contextualQuestion,
        language: 'auto',
        conversation_history: conversationHistory
      })

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer || 'No response received from the AI assistant.',
        sender: "bot",
        timestamp: new Date(),
        executionTime: response.execution_time,
        success: response.success
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${err instanceof Error ? err.message : 'Failed to process your question'}. Please try again.`,
        sender: "bot",
        timestamp: new Date(),
        success: false
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(2)}s`
  }

  const clearChat = () => {
    setMessages([])
    initialMessageSent.current = false

    // Re-send welcome message
    setTimeout(() => {
      const welcomeMessage = healthStatus === 'healthy'
        ? "Hello! I'm your intelligent geospatial assistant powered by AI. Ask me anything about Barcelona's urban data - population, demographics, districts, neighborhoods, and more!"
        : "Hello! I'm your geospatial assistant. I'm currently having trouble connecting to the AI service, but I'm here to help with basic information."

      setMessages([
        {
          id: "welcome-" + Date.now(),
          content: welcomeMessage,
          sender: "bot",
          timestamp: new Date(),
          success: healthStatus === 'healthy'
        },
      ])
      initialMessageSent.current = true
    }, 100)
  }

  const handleClearChatClick = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      clearChat()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Urban Assistant
          </h2>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <>
                {/* Primary option: AlertDialog with high z-index */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Clear chat history">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="z-[10000]" style={{ zIndex: 10000 }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all your conversation messages. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearChat}>
                        Clear Chat
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Alternative: Simple button with browser confirm (uncomment if AlertDialog is not visible) */}
                {/* 
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  title="Clear chat history"
                  onClick={handleClearChatClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                */}
              </>
            )}
            <Badge variant={healthStatus === 'healthy' ? 'default' : 'destructive'} className="text-xs">
              {healthStatus === 'healthy' ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {healthStatus}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {healthStatus === 'healthy'
            ? "Powered by AI - Ask intelligent questions about urban data"
            : "AI service unavailable - Basic assistance only"
          }
        </p>

        {/* Temporary debug component */}
        {healthStatus !== 'healthy' && (
          <div className="mt-4">
            <ApiTest />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.success === false
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted border border-border"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.sender === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span className="text-xs font-medium">{message.sender === "user" ? "You" : "AI Assistant"}</span>
                  <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {message.executionTime && (
                      <>
                        <span>•</span>
                        <span>{formatTime(message.executionTime)}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        {error && (
          <div className="mb-2 p-2 bg-destructive/10 text-destructive rounded-md flex items-center gap-2 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder={
              healthStatus === 'healthy'
                ? "Ask about population, demographics, districts..."
                : "AI service unavailable..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isLoading || healthStatus !== 'healthy'}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={!inputValue.trim() || isLoading || healthStatus !== 'healthy'}
          >
            {isLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {healthStatus === 'healthy'
            ? "Press Enter to send, Shift+Enter for new line"
            : "AI service is currently unavailable. Please check connection."
          }
        </p>
      </div>
    </div>
  )
}
