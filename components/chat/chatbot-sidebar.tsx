"use client"

import * as React from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatbot, type ChatMessage } from "@/hooks/use-chatbot"

export interface ChatbotSidebarProps {
  apiKey?: string
}

export function ChatbotSidebar({ apiKey }: ChatbotSidebarProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    scrollAreaRef,
  } = useChatbot({ apiKey })

  return (
    <SidebarProvider>
      <Sidebar side="right" className="border-l">
        <SidebarHeader className="border-b px-4 py-2">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <div className="flex h-[calc(100vh-8rem)] flex-col">
            <ScrollArea
              className="flex-1 p-4"
              ref={scrollAreaRef as React.RefObject<HTMLDivElement>}
            >
              <div className="flex flex-col space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      Ask me anything...
                    </p>
                  </div>
                ) : (
                  messages.map((message: ChatMessage) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex w-max max-w-[80%] flex-col rounded-lg px-4 py-2 text-sm",
                        message.role === "user"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex w-max max-w-[80%] flex-col rounded-lg bg-muted px-4 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}