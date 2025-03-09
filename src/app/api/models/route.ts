
import { createGroqService } from '@/services/groq-service';
import { NextRequest, NextResponse } from 'next/server';

// Using the service layer for better separation of concerns

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

        // Use the GroqService to handle model fetching and grouping
        const groqService = createGroqService(apiKey);
        const modelsResponse = await groqService.getModels();

        return NextResponse.json(modelsResponse);
    } catch (error: unknown) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch models' },
            { status: 500 }
        );
    }
}