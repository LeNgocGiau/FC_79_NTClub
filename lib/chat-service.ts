export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  apiKey?: string
}

export interface ChatResponse {
  message?: ChatMessage
  error?: string
}

export async function sendChatMessage(
  message: string,
  apiKey?: string
): Promise<ChatResponse> {
  try {
    // If a client-side API key is provided, use direct API call
    if (apiKey) {
      return await sendDirectToGemini(message, apiKey)
    }
    
    // Otherwise use the server-side API endpoint
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to get response from server")
    }

    return data
  } catch (error) {
    console.error("Error in chat service:", error)
    return {
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

// Function to call Gemini API directly (used when client provides their own API key)
async function sendDirectToGemini(
  message: string,
  apiKey: string
): Promise<ChatResponse> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get response from Gemini")
    }

    const assistantMessage =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response."

    return {
      message: {
        role: "assistant",
        content: assistantMessage,
      },
    }
  } catch (error) {
    console.error("Error calling Gemini API directly:", error)
    return {
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
} 