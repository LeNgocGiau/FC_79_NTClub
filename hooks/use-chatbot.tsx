"use client"

import { useState, useRef, useCallback } from "react"
import { sendChatMessage } from "@/lib/chat-service"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  id: string
}

export interface UseChatbotProps {
  apiKey?: string
}

export function useChatbot({ apiKey }: UseChatbotProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      id: generateMessageId(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await sendChatMessage(input.trim(), apiKey)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.message?.content || "Sorry, I couldn't generate a response.",
        id: generateMessageId(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, there was an error processing your message. Please try again.",
        id: generateMessageId(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, apiKey])

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    scrollAreaRef,
  }
}
