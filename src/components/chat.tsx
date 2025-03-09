"use client";

import { useChat } from "@/hooks/use-chat";
import { X as XIcon } from "lucide-react";
import * as React from "react";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ChatSearch } from "./chat-search";

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
    ({ model, topP, systemMessage, temperature, maxTokens }: ChatProps, ref) => {
        // Use our custom hook to manage chat state and logic
        const {
            messages,
            setMessages,
            setIsGenerating,
            isGenerating,
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
        } = useChat({
            model,
            temperature,
            maxTokens,
            topP,
            systemMessage
        });

        // Keyboard shortcuts
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
        }, [isSearching, showShortcuts, handleNewChat, setIsSearching, setSearchQuery, setShowShortcuts]);

        // Expose methods to parent components
        React.useImperativeHandle(ref, () => ({
            handleNewChat,
            loadChat,
        }));

        return (
            <div className="flex flex-col h-full max-h-screen w-full relative" data-chat-ref>
                {/* Header Component */}
                <ChatHeader
                    isSearching={isSearching}
                    setIsSearching={setIsSearching}
                    showShortcuts={showShortcuts}
                    setShowShortcuts={setShowShortcuts}
                    handleNewChat={handleNewChat}
                    exportChat={exportChat}
                    messagesExist={messages.length > 0}
                />

                {/* Search Component */}
                {isSearching && (
                    <ChatSearch
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                )}

                {/* Messages Component */}
                <ChatMessages
                    messages={filteredMessages}
                    isGenerating={isGenerating}
                />

                {/* Input Component */}
                <ChatInput
                    setMessages={setMessages}
                    messages={messages}
                    model={model}
                    temperature={temperature}
                    maxTokens={maxTokens}
                    systemMessage={systemMessage}
                    topP={topP}
                    setIsGenerating={setIsGenerating}
                />

                {/* Keyboard Shortcuts Modal */}
                {showShortcuts && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
                        <div className="bg-background border rounded-lg shadow-lg max-w-md w-full p-4 sm:p-6 relative">
                            <button
                                onClick={() => setShowShortcuts(false)}
                                className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted"
                                aria-label="Close shortcuts"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                            <h3 className="text-lg font-medium mb-4">Keyboard Shortcuts</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">New chat</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+N</kbd>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Search messages</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+F</kbd>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Show shortcuts</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+/</kbd>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Close dialogs</span>
                                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

Chat.displayName = "Chat";