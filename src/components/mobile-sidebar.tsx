"use client";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { ChatSidebar } from "./chat-sidebar";

interface MobileSidebarProps {
    setModel: Dispatch<SetStateAction<string>>;
    model: string;
    setTemperature: Dispatch<SetStateAction<number>>;
    temperature: number;
    setMaxTokens: Dispatch<SetStateAction<number>>;
    maxTokens: number;
    setTopP: Dispatch<SetStateAction<number>>;
    topP: number;
    onNewChat?: () => void;
    onLoadChat?: (chatId: string) => void;
    setSystemMessage: Dispatch<SetStateAction<string>>;
    systemMessage?: string;
    currentChatId?: string;
}

export function MobileSidebar({
    setModel,
    model,
    setTemperature,
    temperature,
    setMaxTokens,
    maxTokens,
    setTopP,
    topP,
    onNewChat,
    onLoadChat,
    setSystemMessage,
    systemMessage,
    currentChatId,
}: MobileSidebarProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200">
                    <Menu className="h-5 w-5" />
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl border-t border-primary/20 shadow-lg">
                <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                <ChatSidebar
                    defaultOpen={true}
                    setModel={setModel}
                    model={model}
                    setTemperature={setTemperature}
                    temperature={temperature}
                    setMaxTokens={setMaxTokens}
                    maxTokens={maxTokens}
                    onNewChat={onNewChat}
                    onLoadChat={onLoadChat}
                    setSystemMessage={setSystemMessage}
                    systemMessage={systemMessage}
                    setTopP={setTopP}
                    topP={topP}
                    currentChatId={currentChatId}
                />
            </SheetContent>
        </Sheet>
    );
}