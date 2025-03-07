"use client";

import { Message } from "@/@types/message";
import * as React from "react";
import { ChatInput } from "./chat-input";

interface ChatProps {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    top_p?: number;
    systemMessage: string;
}

export const Chat = React.forwardRef<{ handleNewChat: () => void }, ChatProps>((
    {
        model,
        systemMessage,
        temperature,
        maxTokens,
    }: ChatProps,
    ref
) => {
    // Initialize with empty array to avoid hydration mismatch
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [chatId, setChatId] = React.useState<string>(() => Date.now().toString());

    // Load messages from localStorage after component mounts on client
    React.useEffect(() => {
        const saved = localStorage.getItem('chatMessages');
        if (saved) {
            setMessages(JSON.parse(saved));
        }
    }, []);

    // Save current chat messages to localStorage
    React.useEffect(() => {
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
        localStorage.removeItem('chatMessages');
        setChatId(Date.now().toString());
    };

    // Function to load a specific chat
    const loadChat = (id: string) => {
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
    };

    React.useImperativeHandle(ref, () => ({
        handleNewChat,
        loadChat
    }));

    return (
        <div className="flex flex-col h-full max-h-screen w-full" data-chat-ref>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput
                systemMessage={systemMessage}
                setMessages={setMessages}
                model={model}
                temperature={temperature}
                maxTokens={maxTokens}
            />
        </div>
    );
});

Chat.displayName = "Chat";