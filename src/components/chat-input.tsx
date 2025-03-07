"use client"
import { Message } from "@/@types/message";
import { getActiveApiKey } from "@/lib/profile";
import { Dispatch, FC, FormEvent, SetStateAction, useState } from "react";

// Function to estimate tokens in a string (rough approximation)
const estimateTokens = (text: string): number => {
    // GPT models typically use ~4 characters per token on average
    return Math.ceil(text.length / 4);
};

// Function to trim message history to fit context window
const trimMessageHistory = (messages: Message[], maxTokens: number): Message[] => {
    let totalTokens = 0;
    const trimmedMessages: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        const msgTokens = estimateTokens(msg.content) + 4; // 4 for metadata

        if (totalTokens + msgTokens <= maxTokens) {
            trimmedMessages.unshift(msg);
            totalTokens += msgTokens;
        } else {
            break;
        }
    }

    return trimmedMessages;
};


interface ChatInputProps {
    setMessages: Dispatch<SetStateAction<Message[]>>;
    messages: Message[];
    model: string;
    temperature?: number;
    maxTokens: number;
    systemMessage: string;
    topP?: number;
    setIsGenerating?: Dispatch<SetStateAction<boolean>>;
}

export const ChatInput: FC<ChatInputProps> = ({
    setMessages,
    model = "llama-3.3-70b-versatile",
    temperature = 0.7,
    maxTokens = 2048,
    systemMessage,
    messages,
    topP = 0.9,
    setIsGenerating
}) => {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content: input,
            role: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput("");

        const apiKey = getActiveApiKey();
        if (!apiKey) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Please add and select a profile with a valid Groq API key first.",
                role: "assistant",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            return;
        }

        setIsLoading(true);
        setIsGenerating?.(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    maxTokens,
                    temperature,
                    topP,
                    apiKey,
                    messages: [
                        {
                            role: "system",
                            content: systemMessage
                        },
                        ...trimMessageHistory(messages, maxTokens - estimateTokens(systemMessage) - 100),
                        {
                            role: "user",
                            content: input
                        }
                    ]
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            // Handle streaming response
            const reader = response?.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";
            const assistantMessageId = (Date.now() + 1).toString();

            setMessages((prev) => [
                ...prev,
                {
                    id: assistantMessageId,
                    content: "",
                    role: "assistant",
                    timestamp: new Date(),
                    model: model, // Add the model name to the message
                },
            ]);

            while (true) {
                const { done, value } = await reader?.read() ?? { done: true, value: undefined };
                if (done) break;
                const chunk = decoder.decode(value);
                assistantContent += chunk;

                // Update the assistant message incrementally
                setMessages((prev) => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.id === assistantMessageId) {
                        return [
                            ...prev.slice(0, -1),
                            { ...lastMessage, content: assistantContent, model: model },
                        ];
                    }
                    return prev;
                });
            }

        } catch (error) {
            console.error("Failed to get AI response:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Sorry, there was an error getting a response from the AI. Please try again.",
                role: "assistant",
                timestamp: new Date(),
                model: model, // Add model name to error message too
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsGenerating?.(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Send"}
                </button>
            </div>
        </form>
    )
}