"use client"
import { Message } from "@/@types/message";
import { getActiveApiKey } from "@/lib/profile";
import { Send, Smile } from "lucide-react";
import { Dispatch, FC, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";

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
    inputValue?: string;
    setInputValue?: Dispatch<SetStateAction<string>>;
}

export const ChatInput: FC<ChatInputProps> = ({
    setMessages,
    model = "llama-3.3-70b-versatile",
    temperature = 0.7,
    maxTokens = 2048,
    systemMessage,
    messages,
    topP = 0.9,
    setIsGenerating,
    inputValue = "",
    setInputValue
}) => {
    const [input, setInput] = useState(inputValue);
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setInput(inputValue);
        setInputValue?.("");
    }, [inputValue, setInputValue]);

    // Auto-resize textarea as content grows
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [input]);

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 sm:p-5 border-t bg-background/95 backdrop-blur sticky bottom-0">
            {isLoading && (
                <div className="mb-2 text-sm text-muted-foreground flex items-center justify-center">
                    <div className="h-3 w-3 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Generating response...
                </div>
            )}
            <div className="relative flex items-end rounded-xl border bg-background shadow-md focus-within:ring-2 focus-within:ring-primary/50 transition-all duration-200 hover:border-primary/30 hover:shadow-lg">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 min-w-0 resize-none border-0 bg-transparent px-5 py-4 text-sm focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground/70 font-medium flex items-center leading-relaxed"
                    style={{ display: "flex", alignItems: "center" }}
                    disabled={isLoading}
                />

                <div className="flex items-center px-3 sm:px-4 py-3 gap-2 sm:gap-3">
                    <button
                        type="button"
                        className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                        title="Add emoji"
                        disabled={isLoading}
                    >
                        <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 shadow-sm hover:shadow-md"
                        disabled={isLoading || !input.trim()}
                        aria-label="Send message"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground text-center hidden sm:flex justify-center items-center gap-1">
                <span>Press</span> <kbd className="px-1.5 py-0.5 bg-muted/50 border border-border/30 rounded-md text-xs font-mono shadow-sm">Enter</kbd> <span>to send,</span> <kbd className="px-1.5 py-0.5 bg-muted/50 border border-border/30 rounded-md text-xs font-mono shadow-sm">Shift+Enter</kbd> <span>for new line</span>
            </div>
        </form>
    )
}