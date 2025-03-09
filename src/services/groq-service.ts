import { GroqModel } from '@/@types/GroqModel';
import Groq from 'groq-sdk';
import { ModelListResponse } from 'groq-sdk/resources/models.mjs';

// Define type for grouped models
export interface GroupedModels {
    [key: string]: GroqModel[];
}

// Define the response type for the getModels function
export interface ModelsResponse {
    data?: GroqModel[];
    object?: string;
    groupedByOwner: GroupedModels;
}

/**
 * Service class for interacting with the Groq API
 */
export class GroqService {
    private groq: Groq;

    constructor(apiKey: string) {
        this.groq = new Groq({ apiKey: apiKey.trim() });
    }

    /**
     * Fetches models from the Groq API and groups them by owner
     * @returns Promise with models data and grouped models
     */
    async getModels(): Promise<ModelsResponse> {
        const models: ModelListResponse = await this.groq.models.list();
        
        // Group models by owner
        const groupedModels: GroupedModels = {};

        if (models.data && Array.isArray(models.data)) {
            models.data.forEach((model: GroqModel) => {
                const typedModel = {
                    id: model.id || '',
                    object: model.object || '',
                    created: model.created || 0,
                    owned_by: model.owned_by || '',
                    active: model.active ?? false,
                    context_window: model.context_window || 0,
                    public_apps: null
                };
                const owner = typedModel.owned_by || 'Unknown';
                if (!groupedModels[owner]) {
                    groupedModels[owner] = [];
                }
                groupedModels[owner].push(typedModel);
            });
        }

        // Return both the original models list and the grouped models
        return {
            ...models,
            groupedByOwner: groupedModels
        };
    }
}

/**
 * Factory function to create a GroqService instance
 * @param apiKey Groq API key
 * @returns GroqService instance
 */
export const createGroqService = (apiKey: string): GroqService => {
    return new GroqService(apiKey);
};