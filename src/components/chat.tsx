"use client";

import { Message } from "@/@types/message";
import { formatDistanceToNow } from "date-fns";
import { Bot, Download, Keyboard, Search, Trash2, User, X as XIcon } from "lucide-react";
import * as React from "react";
import { ChatInput } from "./chat-input";
import { MessageContent } from "./message-content";

interface ChatProps {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    systemMessage: string;
}

export const Chat = React.forwardRef<
    { handleNewChat: () => void; loadChat: (id: string) => void },
    ChatProps
>(
    (
        { model, topP, systemMessage, temperature, maxTokens }: ChatProps,
        ref
    ) => {
        // Estado inicial: array vazio para evitar problemas de hidratação
        const [messages, setMessages] = React.useState<Message[]>([]);
        // Inicializa chatId a partir do localStorage, se disponível
        const [chatId, setChatId] = React.useState<string>(() => {
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

        const [isGenerating, setIsGenerating] = React.useState(false);
        const [searchQuery, setSearchQuery] = React.useState("");
        const [isSearching, setIsSearching] = React.useState(false);
        const [showShortcuts, setShowShortcuts] = React.useState(false);

        // Atualiza o chatId no componente pai via evento customizado
        React.useEffect(() => {
            if (typeof window !== "undefined") {
                const event = new CustomEvent("chatIdChanged", { detail: chatId });
                window.dispatchEvent(event);
            }
        }, [chatId]);

        // Carrega mensagens do localStorage ao montar o componente
        React.useEffect(() => {
            if (typeof window !== "undefined") {
                const saved = localStorage.getItem("chatMessages");
                if (saved) {
                    setMessages(JSON.parse(saved));
                }
            }
        }, []);

        // Salva as mensagens atuais e atualiza o histórico de chats
        React.useEffect(() => {
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

        const messagesEndRef = React.useRef<HTMLDivElement>(null);
        const scrollToBottom = React.useCallback(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, []);

        React.useEffect(() => {
            scrollToBottom();
        }, [messages, scrollToBottom]);

        const handleNewChat = React.useCallback(() => {
            setMessages([]);
            if (typeof window !== "undefined") {
                localStorage.removeItem("chatMessages");
            }
            setChatId(Date.now().toString());
        }, []);

        // Função para carregar um chat específico
        const loadChat = React.useCallback((id: string) => {
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

        // Atalhos de teclado
        React.useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "/") {
                    e.preventDefault();
                    setShowShortcuts((prev) => !prev);
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
                    e.preventDefault();
                    setIsSearching((prev) => !prev);
                    if (!isSearching) {
                        setTimeout(() => document.getElementById("message-search")?.focus(), 100);
                    }
                }
                if (e.key === "Escape") {
                    if (isSearching) {
                        setIsSearching(false);
                        setSearchQuery("");
                    }
                    if (showShortcuts) {
                        setShowShortcuts(false);
                    }
                }
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
                    e.preventDefault();
                    handleNewChat();
                }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [isSearching, showShortcuts, handleNewChat]);

        React.useImperativeHandle(ref, () => ({
            handleNewChat,
            loadChat,
        }));

        return (
            <div className="flex flex-col h-full max-h-screen w-full relative" data-chat-ref>
                {/* Cabeçalho do chat */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <h2 className="text-sm sm:text-base font-medium">Chat Session</h2>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => setIsSearching((prev) => !prev)}
                            className="p-1.5 sm:p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                            title="Search messages (Ctrl+F)"
                        >
                            <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                            onClick={exportChat}
                            className="p-1.5 sm:p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                            title="Export chat"
                            disabled={messages.length === 0}
                        >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                            onClick={handleNewChat}
                            className="p-1.5 sm:p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                            title="New chat (Ctrl+N)"
                        >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                            onClick={() => setShowShortcuts((prev) => !prev)}
                            className="p-1.5 sm:p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                            title="Keyboard shortcuts (Ctrl+/)"
                        >
                            <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                    </div>
                </div>

                {/* Barra de busca */}
                {isSearching && (
                    <div className="p-3 border-b animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary">
                                <Search className="h-4 w-4" />
                            </div>
                            <input
                                id="message-search"
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-primary/20 bg-background/80 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shadow-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Lista de mensagens */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background to-background/95">
                    {filteredMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                            <Bot className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-4 opacity-20" />
                            <p className="text-base sm:text-lg font-medium">No messages yet</p>
                            <p className="text-xs sm:text-sm">Start a conversation by typing a message below</p>
                        </div>
                    )}
                    {filteredMessages.map((message) => {
                        const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();
                        const timeAgo = formatDistanceToNow(messageDate, { addSuffix: true });

                        return (
                            <div
                                key={message.id}
                                className={`message ${message.role === "user" ? "user" : "assistant"} mb-8 animate-in fade-in-50 duration-300`}
                            >
                                <div className={`flex items-start ${message.role === "user" ? "flex-row-reverse" : ""} gap-4`}>
                                    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-muted shadow-sm border border-border/40">
                                        {message.role === "user" ? (
                                            <User className="h-5 w-5 text-foreground" />
                                        ) : (
                                            <Bot className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <div className={`flex-1 space-y-2 ${message.role === "user" ? "text-right" : ""}`}>
                                        <MessageContent
                                            content={message.content}
                                            isThinking={isGenerating && message.id === messages[messages.length - 1]?.id}
                                            model={message.model}
                                            isUserMessage={message.role === "user"}
                                        />
                                        <div className="text-xs text-muted-foreground">
                                            {timeAgo}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Modal de atalhos de teclado */}
                {showShortcuts && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                        <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-4 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base sm:text-lg font-semibold">Keyboard Shortcuts</h3>
                                <button
                                    onClick={() => setShowShortcuts(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">New Chat</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+N</kbd>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Search Messages</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+F</kbd>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Show Shortcuts</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Close Dialogs</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <ChatInput
                    messages={messages}
                    systemMessage={systemMessage}
                    setMessages={setMessages}
                    model={model}
                    topP={topP}
                    temperature={temperature}
                    maxTokens={maxTokens}
                    setIsGenerating={setIsGenerating}
                />
            </div>
        );
    }
);

Chat.displayName = "Chat";