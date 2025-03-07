"use client";

import { Message } from "@/@types/message";
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

export const Chat = React.forwardRef<{ handleNewChat: () => void, loadChat: (id: string) => void }, ChatProps>((
    {
        model,
        topP,
        systemMessage,
        temperature,
        maxTokens,
    }: ChatProps,
    ref
) => {
    // Initialize with empty array to avoid hydration mismatch
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [chatId, setChatId] = React.useState<string>(() => Date.now().toString());
    const [isGenerating, setIsGenerating] = React.useState(false);

    // Load messages from localStorage after component mounts on client
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('chatMessages');
            if (saved) {
                setMessages(JSON.parse(saved));
            }
        }
    }, []);

    // Save current chat messages to localStorage
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatMessages', JSON.stringify(messages));

            // Only save to chat history if there are messages
            if (messages.length > 0) {
                // Get existing chat history or initialize empty array
                const savedChats = localStorage.getItem('chatHistory');
                const chatHistory = savedChats ? JSON.parse(savedChats) : [];

                // Find if current chat already exists in history
                const existingChatIndex = chatHistory.findIndex((chat: { id: string }) => chat.id === chatId);

                // Update or add the current chat
                if (existingChatIndex >= 0) {
                    chatHistory[existingChatIndex] = { id: chatId, messages };
                } else {
                    chatHistory.push({ id: chatId, messages });
                }

                // Save updated chat history
                localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            }
        }
    }, [messages, chatId]);

    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleNewChat = () => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('chatMessages');
        }
        setChatId(Date.now().toString());
    };

    // Function to load a specific chat
    const loadChat = (id: string) => {
        if (typeof window !== 'undefined') {
            const savedChats = localStorage.getItem('chatHistory');
            if (savedChats) {
                const chatHistory = JSON.parse(savedChats);
                const chat = chatHistory.find((c: { id: string, messages: Message[] }) => c.id === id);
                if (chat) {
                    setMessages(chat.messages);
                    setChatId(id);
                    localStorage.setItem('chatMessages', JSON.stringify(chat.messages));
                }
            }
        }
    };

    React.useImperativeHandle(ref, () => ({
        handleNewChat,
        loadChat
    }));

    return (
        <div className="flex flex-col h-full max-h-screen w-full" data-chat-ref>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg p-4 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        >
                            {message.role === "assistant" ? (
                                <MessageContent
                                    content={message.content}
                                    isThinking={isGenerating && message.id === messages[messages.length - 1]?.id}
                                    model={message.model}
                                />
                            ) : (
                                <div className="whitespace-pre-wrap">{message.content}</div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

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
});

Chat.displayName = "Chat";