"use client";

import { Message } from "@/@types/message";
import { Profile } from "@/@types/profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { addProfile, decryptApiKey, getProfiles, removeProfile, setActiveProfile } from "@/lib/profile";
import { Check, ChevronRight, MessageSquareIcon, Moon, Plus, Settings, SlidersHorizontal, Sun, Trash, User, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface ChatSidebarProps {
    defaultOpen?: boolean;
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

interface GroupModels {
    id: string;
    context_window: number;
    owned_by?: string;
}

export function ChatSidebar({
    defaultOpen = true,
    onNewChat,
    setModel,
    model,
    setTemperature,
    temperature,
    setMaxTokens,
    maxTokens,
    setTopP,
    topP,
    setSystemMessage,
    systemMessage,
    onLoadChat,
    currentChatId,
}: ChatSidebarProps) {
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
    const [groupedModels, setGroupedModels] = useState<{ [key: string]: Array<GroupModels> }>({});
    const [chatHistory, setChatHistory] = useState<Array<{ id: string; messages: Message[] }>>([]);
    const [showSettings, setShowSettings] = useState(false);
    const selectedModel = models.find(m => m.id === model);
    const contextWindow = selectedModel?.context_window || 8192; // Default para 8192 se não houver modelo

    // Load chat history from localStorage after component is mounted
    useEffect(() => {
        if (mounted) {
            const savedChats = localStorage.getItem('chatHistory');
            if (savedChats) {
                setChatHistory(JSON.parse(savedChats));
            }
        }
    }, [mounted]);

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

                const { data, groupedByOwner } = await response.json();
                // Add the owned_by property to each model for display purposes
                const modelsWithOwner = data ? data.map((model: GroupModels) => ({
                    ...model,
                    owned_by: model.owned_by || 'Unknown'
                })) : [];
                setModels(modelsWithOwner || []);
                setGroupedModels(groupedByOwner || {});
            } catch (error) {
                console.error('Error fetching models:', error);
            }
        };

        fetchModels();
    }, [profiles]);

    // After mounting, we can safely show the UI and access localStorage
    useEffect(() => {
        setMounted(true);

        // Load saved values from localStorage after component is mounted
        const savedTemp = localStorage.getItem('temperature');
        if (savedTemp) setTemperature(parseFloat(savedTemp));

        const savedTokens = localStorage.getItem('maxTokens');
        if (savedTokens) setMaxTokens(parseInt(savedTokens));

        const savedTopP = localStorage.getItem('topP');
        if (savedTopP) setTopP(parseFloat(savedTopP));

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
        localStorage.setItem('temperature', value.toString());
        setTemperature(value);
    };
    const handleMaxTokensChange = (value: number) => {
        setMaxTokens(value);
        localStorage.setItem('maxTokens', value.toString());
    };
    const handleTopPChange = (value: number) => {
        setTopP(value);
        localStorage.setItem('topP', value.toString());
    };
    const handleModelChange = (value: string) => {
        // Reset settings to defaults when model changes
        const defaultTemperature = 0.7;
        const defaultTopP = 0.9;

        // Update temperature and topP to defaults
        setTemperature(defaultTemperature);
        setTopP(defaultTopP);
        localStorage.setItem('temperature', defaultTemperature.toString());
        localStorage.setItem('topP', defaultTopP.toString());

        // Adjust maxTokens if needed based on the new model's context window
        const selectedModel = models.find(m => m.id === value);
        if (selectedModel) {
            const newContextWindow = selectedModel.context_window;
            if (maxTokens > newContextWindow) {
                setMaxTokens(newContextWindow);
                localStorage.setItem('maxTokens', newContextWindow.toString());
            }
        }

        // Update the model
        setModel(value);

        // Update the active profile's last used model
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
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MessageSquareIcon className="h-5 w-5 text-primary" />
                            Chat
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Settings"
                            >
                                <Settings className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Toggle theme"
                            >
                                {mounted && (
                                    theme === 'dark' ? (
                                        <Sun className="h-5 w-5" />
                                    ) : (
                                        <Moon className="h-5 w-5" />
                                    )
                                )}
                            </button>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    {/* Profiles Section */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div className="space-y-2">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <SidebarGroupLabel>
                                            <User className="mr-2 h-4 w-4" />
                                            Profiles
                                        </SidebarGroupLabel>
                                        <button
                                            onClick={() => setShowAddProfile(true)}
                                            className="text-xs p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-accent-foreground transition-all duration-200 shadow-sm"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {profiles.length === 0 ? (
                                        <div className="text-sm text-muted-foreground p-2 text-center">
                                            No profiles added yet
                                        </div>
                                    ) : (
                                        profiles.map((profile) => (
                                            <div key={profile.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-all duration-200">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`p-1 rounded-full ${profile.isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                                                        title={profile.isActive ? 'Active profile' : 'Inactive profile'}
                                                    >
                                                        <User className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-sm font-medium">{profile.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleSetActiveProfile(profile.id)}
                                                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm"
                                                        disabled={profile.isActive}
                                                        title="Set as active profile"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveProfile(profile.id)}
                                                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-all duration-200"
                                                        title="Remove profile"
                                                        aria-label="Remove profile"
                                                    >
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {showAddProfile ? (
                                        <div className="p-2 space-y-3 border rounded-md bg-card">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-medium">Add Profile</h3>
                                                <button
                                                    onClick={() => setShowAddProfile(false)}
                                                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Profile Name"
                                                value={newProfileName}
                                                onChange={(e) => setNewProfileName(e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none transition-all"
                                            />
                                            <input
                                                type="password"
                                                placeholder="API Key"
                                                value={newProfileApiKey}
                                                onChange={(e) => setNewProfileApiKey(e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-input bg-background focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none transition-all"
                                            />
                                            <button
                                                onClick={handleAddProfile}
                                                disabled={!newProfileName || !newProfileApiKey}
                                                className="w-full py-2 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                            >
                                                Add Profile
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowAddProfile(true)}
                                            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md border border-input hover:bg-muted/50 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <Separator className="my-4" />

                    {/* Model Selection */}
                    {profiles.some(p => p.isActive) && (
                        <SidebarGroup>
                            <SidebarGroupLabel>
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Model Settings
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Model</label>
                                        <Select value={model} onValueChange={handleModelChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(groupedModels).map(([provider, providerModels]) => (
                                                    <div key={provider}>
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                            {provider}
                                                        </div>
                                                        {providerModels.map((m) => (
                                                            <SelectItem key={m.id} value={m.id}>
                                                                <div className="flex items-center justify-between w-full">
                                                                    <span>{m.id}</span>
                                                                    <span className="text-xs text-muted-foreground">{m.context_window.toLocaleString()} tokens</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Temperature: {temperature.toFixed(1)}</label>
                                        </div>
                                        <Slider
                                            value={[temperature]}
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            onValueChange={(value) => handleTemperatureChange(value[0])}
                                            className="py-2"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Precise</span>
                                            <span>Creative</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Top P: {topP.toFixed(1)}</label>
                                        </div>
                                        <Slider
                                            value={[topP]}
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            onValueChange={(value) => handleTopPChange(value[0])}
                                            className="py-2"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Max Tokens: {maxTokens}</label>
                                        </div>
                                        <Slider
                                            value={[maxTokens]}
                                            min={256}
                                            max={contextWindow}
                                            step={256}
                                            onValueChange={(value) => handleMaxTokensChange(value[0])}
                                            className="py-2"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Short</span>
                                            <span>Long ({contextWindow} max)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">System Message</label>
                                        <textarea
                                            value={systemMessage}
                                            onChange={(e) => setSystemMessage(e.target.value)}
                                            placeholder="Enter system message..."
                                            className="w-full h-24 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none"
                                        />
                                    </div>
                                </div>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )}

                    <Separator className="my-4" />

                    {/* Chat History */}
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            <MessageSquareIcon className="mr-2 h-4 w-4" />
                            Chat History
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <div className="space-y-2">
                                <button
                                    onClick={onNewChat}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Chat
                                </button>

                                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-1.5">
                                    {chatHistory.length === 0 ? (
                                        <div className="text-sm text-muted-foreground p-2 text-center">
                                            No chat history
                                        </div>
                                    ) : (
                                        chatHistory.map((chat) => {
                                            // Get the first user message as the title, or use a default
                                            const firstUserMessage = chat.messages.find(m => m.role === 'user');
                                            const title = firstUserMessage ?
                                                (firstUserMessage.content.length > 30 ?
                                                    firstUserMessage.content.substring(0, 30) + '...' :
                                                    firstUserMessage.content) :
                                                'Chat ' + new Date(parseInt(chat.id)).toLocaleDateString();

                                            const isActive = chat.id === currentChatId;

                                            return (
                                                <div
                                                    key={chat.id}
                                                    className={`flex items-center justify-between p-2 rounded-md transition-all duration-200 ${isActive ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-accent/30'}`}
                                                >
                                                    <div
                                                        className="flex items-center gap-2 truncate flex-grow cursor-pointer"
                                                        onClick={() => onLoadChat?.(chat.id)}
                                                    >
                                                        <div className={`p-1 rounded-full ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                                                            <MessageSquareIcon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                                        </div>
                                                        <span className="text-sm truncate font-medium">{title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm('Are you sure you want to delete this chat?')) {
                                                                    const savedChats = localStorage.getItem('chatHistory');
                                                                    if (savedChats) {
                                                                        const chatHistory = JSON.parse(savedChats);
                                                                        const updatedHistory = chatHistory.filter((c: { id: string }) => c.id !== chat.id);
                                                                        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
                                                                        setChatHistory(updatedHistory);

                                                                        // If the deleted chat is the current one, create a new chat
                                                                        if (currentChatId === chat.id && onNewChat) {
                                                                            onNewChat();
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                            className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                                                            title="Delete chat"
                                                        >
                                                            <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                                                        </button>
                                                        <ChevronRight className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <div className="text-xs text-center text-muted-foreground">
                        <p>© {new Date().getFullYear()} ZIHT AI Chat</p>
                    </div>
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider>
    );
}