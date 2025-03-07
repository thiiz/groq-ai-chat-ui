"use client";

import { Message } from "@/@types/message";
import { Profile } from "@/@types/profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { addProfile, decryptApiKey, getProfiles, removeProfile, setActiveProfile } from "@/lib/profile";
import { LogOut, MessageSquareIcon, Moon, SlidersHorizontal, Sun, User, UserPlus } from "lucide-react";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface ChatSidebarProps {
    defaultOpen?: boolean;
    setModel: Dispatch<SetStateAction<string>>;
    model: string;
    onTemperatureChange?: (temperature: number) => void;
    onMaxTokensChange?: (maxTokens: number) => void;
    onNewChat?: () => void;
    onLoadChat?: (chatId: string) => void;
    onSystemMessageChange?: Dispatch<SetStateAction<string>>;
}

export function ChatSidebar({
    defaultOpen = true,
    onNewChat,
    setModel,
    model,
    onTemperatureChange,
    onMaxTokensChange,
    onLoadChat,
    onSystemMessageChange
}: ChatSidebarProps) {
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2048);
    const [systemMessage, setSystemMessage] = useState("");
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [showAddProfile, setShowAddProfile] = useState(false);
    const [newProfileName, setNewProfileName] = useState("");
    const [newProfileApiKey, setNewProfileApiKey] = useState("");
    const [models, setModels] = useState<Array<{
        id: string;
        provider?: string;
        context_window: number;
    }>>([]);
    const [chatHistory, setChatHistory] = useState<Array<{ id: string; messages: Message[] }>>([]);
    const selectedModel = models.find(m => m.id === model);
    const contextWindow = selectedModel?.context_window || 8192; // Default para 8192 se não houver modelo

    // Load chat history from localStorage
    useEffect(() => {
        const loadChatHistory = () => {
            const savedChats = localStorage.getItem('chatHistory');
            if (savedChats) {
                setChatHistory(JSON.parse(savedChats));
            }
        };
        loadChatHistory();
    }, []);

    // Fetch models when a profile is active
    useEffect(() => {
        const fetchModels = async () => {
            const activeProfile = profiles.find(p => p.isActive);
            if (!activeProfile) return;

            try {
                const response = await fetch('/api/models', {
                    headers: {
                        'x-api-key': decryptApiKey(activeProfile.apiKey)
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch models');

                const { data } = await response.json();
                setModels(data || []);
            } catch (error) {
                console.error('Error fetching models:', error);
            }
        };

        fetchModels();
    }, [profiles]);

    // After mounting, we can safely show the UI
    useEffect(() => {
        setMounted(true);
        const profiles = getProfiles();
        setProfiles(profiles);
        const activeProfile = profiles.find(p => p.isActive);
        if (activeProfile?.lastUsedModel) {
            setModel(activeProfile?.lastUsedModel);
        }
    }, [setModel]);

    const handleAddProfile = () => {
        try {
            addProfile(newProfileName, newProfileApiKey);
            setProfiles(getProfiles());
            setShowAddProfile(false);
            setNewProfileName("");
            setNewProfileApiKey("");
        } catch (error) {
            console.error("Failed to add profile:", error);
            // TODO: Show error message to user
        }
    };

    const handleSetActiveProfile = (id: string) => {
        try {
            setActiveProfile(id);
            setProfiles(getProfiles());
        } catch (error) {
            console.error("Failed to set active profile:", error);
            // TODO: Show error message to user
        }
    };

    const handleRemoveProfile = (id: string) => {
        try {
            removeProfile(id);
            setProfiles(getProfiles());
        } catch (error) {
            console.error("Failed to remove profile:", error);
            // TODO: Show error message to user
        }
    };

    const handleTemperatureChange = (value: number) => {
        setTemperature(value);
        onTemperatureChange?.(value);
    };
    const handleMaxTokensChange = (value: number) => {
        setMaxTokens(value);
        onMaxTokensChange?.(value);
    };
    const handleModelChange = (value: string) => {
        const selectedModel = models.find(m => m.id === value);
        if (selectedModel) {
            const newContextWindow = selectedModel.context_window;
            if (maxTokens > newContextWindow) {
                setMaxTokens(newContextWindow);
                onMaxTokensChange?.(newContextWindow);
            }
        }
        setModel(value);
        const activeProfile = profiles.find(p => p.isActive);
        if (activeProfile) {
            setActiveProfile(activeProfile.id, value);
            setProfiles(getProfiles());
        }
    };

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Chat</h2>
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {mounted && (
                                theme === 'dark' ? (
                                    <Sun className="h-5 w-5 lucide lucide-sun" />
                                ) : (
                                    <Moon className="h-5 w-5 lucide lucide-moon" />
                                )
                            )}
                        </button>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            <MessageSquareIcon className="mr-2" />
                            Chat History
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={onNewChat}>New Chat</SidebarMenuButton>
                                </SidebarMenuItem>
                                <div className="overflow-y-auto max-h-[200px] space-y-1">
                                    {chatHistory.map((chat) => (
                                        <SidebarMenuItem key={chat.id}>
                                            <div className="flex items-center justify-between w-full">
                                                <SidebarMenuButton
                                                    className="flex-1 text-left truncate"
                                                    onClick={() => {
                                                        if (onLoadChat) {
                                                            onLoadChat(chat.id);
                                                        }
                                                    }}
                                                >
                                                    {chat.messages[0]?.content.substring(0, 30) || 'Empty chat'}
                                                </SidebarMenuButton>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const updatedHistory = chatHistory.filter(c => c.id !== chat.id);
                                                        setChatHistory(updatedHistory);
                                                        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
                                                        if (onNewChat) onNewChat(); // Reset to new chat if the current chat is deleted
                                                    }}
                                                    className="p-1 hover:bg-destructive/20 rounded ml-2"
                                                >
                                                    <LogOut className="h-4 w-4 text-destructive" />
                                                </button>
                                            </div>
                                        </SidebarMenuItem>
                                    ))}
                                </div>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <Separator className="my-4" />

                    <SidebarGroup>
                        <SidebarGroupLabel>
                            <SlidersHorizontal className="mr-2" />
                            AI Options
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <div className="space-y-4 p-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">AI Model</label>
                                    <Select value={model} onValueChange={handleModelChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {models.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.id}
                                                    {model.provider && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {model.provider}
                                                        </span>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {models.find(m => m.id === model)?.context_window && (
                                        <p className="text-xs text-muted-foreground">
                                            Context Window: {models.find(m => m.id === model)?.context_window} tokens
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">System Message</label>
                                    <textarea
                                        placeholder="Set custom AI behavior..."
                                        className="w-full px-3 py-2 text-sm rounded-md border min-h-[80px] resize-y bg-background"
                                        value={systemMessage}
                                        onChange={(e) => {
                                            setSystemMessage(e.target.value);
                                            onSystemMessageChange?.(e.target.value);
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Temperature: {temperature}</label>
                                    <Slider
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={[temperature]}
                                        onValueChange={(value) => handleTemperatureChange(value[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Higher values produce more random outputs
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Top P</label>
                                    <Slider
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={[0.9]}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Controls diversity via nucleus sampling
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Max Tokens: {maxTokens}</label>
                                    <Slider
                                        min={256}
                                        max={contextWindow}
                                        step={256}
                                        value={[maxTokens]}
                                        onValueChange={(value) => handleMaxTokensChange(value[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Número máximo de tokens a gerar (até {contextWindow})
                                    </p>
                                </div>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <div className="p-4 space-y-4">
                        {showAddProfile ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Profile Name"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-md border"
                                />
                                <input
                                    type="password"
                                    placeholder="Groq API Key"
                                    value={newProfileApiKey}
                                    onChange={(e) => setNewProfileApiKey(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-md border"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddProfile}
                                        className="flex-1 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        Add Profile
                                    </button>
                                    <button
                                        onClick={() => setShowAddProfile(false)}
                                        className="flex-1 px-3 py-2 text-sm rounded-md border hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowAddProfile(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-muted"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add Profile
                            </button>
                        )}

                        {profiles.map((profile) => (
                            <div key={profile.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                <button
                                    onClick={() => handleSetActiveProfile(profile.id)}
                                    className="flex items-center gap-2 flex-1"
                                >
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">{profile.name}</span>
                                    {profile.isActive && (
                                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                            Active
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleRemoveProfile(profile.id)}
                                    className="p-1 hover:bg-destructive/20 rounded"
                                >
                                    <LogOut className="h-4 w-4 text-destructive" />
                                </button>
                            </div>
                        ))}

                        <div className="text-xs text-gray-500 text-center pt-4 border-t">
                            AI Chat v0.1.0
                        </div>
                    </div>
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider>
    );
}