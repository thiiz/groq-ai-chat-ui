import { Message } from "@/@types/message";
import { getActiveApiKey } from "@/lib/profile";
import { useCallback, useEffect, useState } from "react";

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

interface ChatConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    systemMessage: string;
}

interface UseChatReturn {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    chatId: string;
    isGenerating: boolean;
    setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    isSearching: boolean;
    setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
    showShortcuts: boolean;
    setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
    handleNewChat: () => void;
    loadChat: (id: string) => void;
    exportChat: () => void;
    filteredMessages: Message[];
    handleSendMessage: (content: string) => Promise<void>;
}

export const useChat = (config: ChatConfig): UseChatReturn => {
    const { model, temperature, maxTokens, topP, systemMessage } = config;

    // Estado inicial: array vazio para evitar problemas de hidratação
    const [messages, setMessages] = useState<Message[]>([]);

    // Inicializa chatId a partir do localStorage, se disponível
    const [chatId, setChatId] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const savedMessages = localStorage.getItem("chatMessages");
            if (savedMessages) {
                const savedChats = localStorage.getItem("chatHistory");
                if (savedChats) {
                    const chatHistory = JSON.parse(savedChats) as { id: string; messages: Message[] }[];
                    const parsedMessages = JSON.parse(savedMessages) as Message[];
                    if (parsedMessages.length > 0) {
                        const matchingChat = chatHistory.find(
                            (chat) =>
                                JSON.stringify(chat.messages) === JSON.stringify(parsedMessages)
                        );
                        if (matchingChat) {
                            return matchingChat.id;
                        }
                    }
                }
            }
        }
        return Date.now().toString();
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Atualiza o chatId no componente pai via evento customizado
    useEffect(() => {
        if (typeof window !== "undefined") {
            const event = new CustomEvent("chatIdChanged", { detail: chatId });
            window.dispatchEvent(event);
        }
    }, [chatId]);

    // Carrega mensagens do localStorage ao montar o componente
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("chatMessages");
            if (saved) {
                setMessages(JSON.parse(saved));
            }
        }
    }, []);

    // Salva as mensagens atuais e atualiza o histórico de chats
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("chatMessages", JSON.stringify(messages));

            if (messages.length > 0) {
                const savedChats = localStorage.getItem("chatHistory");
                const chatHistory = savedChats ? JSON.parse(savedChats) : [];
                const existingIndex = chatHistory.findIndex(
                    (chat: { id: string }) => chat.id === chatId
                );
                if (existingIndex >= 0) {
                    chatHistory[existingIndex] = { id: chatId, messages };
                } else {
                    chatHistory.push({ id: chatId, messages });
                }
                localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
            }
        }
    }, [messages, chatId]);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        if (typeof window !== "undefined") {
            localStorage.removeItem("chatMessages");
        }
        setChatId(Date.now().toString());
    }, []);

    // Função para carregar um chat específico
    const loadChat = useCallback((id: string) => {
        if (typeof window !== "undefined") {
            const savedChats = localStorage.getItem("chatHistory");
            if (savedChats) {
                const chatHistory = JSON.parse(savedChats) as { id: string; messages: Message[] }[];
                const chat = chatHistory.find((c) => c.id === id);
                if (chat) {
                    setMessages(chat.messages);
                    setChatId(id);
                    localStorage.setItem("chatMessages", JSON.stringify(chat.messages));
                }
            }
        }
    }, []);

    // Exporta o chat atual como JSON
    const exportChat = () => {
        if (messages.length === 0) return;
        const exportData = {
            id: chatId,
            model,
            messages,
            exportDate: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredMessages =
        searchQuery.trim() === ""
            ? messages
            : messages.filter((msg) =>
                msg.content.toLowerCase().includes(searchQuery.toLowerCase())
            );

    // Function to send a message and get AI response
    const handleSendMessage = async (content: string) => {
        if (!content.trim() || isGenerating) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content,
            role: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);

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

        setIsGenerating(true);
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
                            content
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
            setIsGenerating(false);
        }
    };

    return {
        messages,
        setMessages,
        chatId,
        isGenerating,
        setIsGenerating,
        searchQuery,
        setSearchQuery,
        isSearching,
        setIsSearching,
        showShortcuts,
        setShowShortcuts,
        handleNewChat,
        loadChat,
        exportChat,
        filteredMessages,
        handleSendMessage
    };
};