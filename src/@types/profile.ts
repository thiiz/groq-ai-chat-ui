export interface Profile {
    id: string;
    name: string;
    apiKey: string;
    isActive: boolean;
    createdAt: Date;
    lastUsed: Date;
    lastUsedModel?: string;
}

export type Profiles = Profile[];