
import { GroqModel } from '@/@types/GroqModel';
import Groq from 'groq-sdk';
import { ModelListResponse } from 'groq-sdk/resources/models.mjs';
import { NextRequest, NextResponse } from 'next/server';

// Define the Groq API model type to match what's actually returned


// Define type for grouped models
interface GroupedModels {
    [key: string]: GroqModel[];
}

export async function GET(request: NextRequest) {
    try {
        // Get API key from the request header
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }
        const groq = new Groq({ apiKey: apiKey.trim() });
        const models: ModelListResponse = await groq.models.list();

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
        return NextResponse.json({
            ...models,
            groupedByOwner: groupedModels
        });
    } catch (error: unknown) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch models' },
            { status: 500 }
        );
    }
}