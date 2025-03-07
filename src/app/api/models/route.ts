import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

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
        const models = await groq.models.list();
        return NextResponse.json(models);
    } catch (error: unknown) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch models' },
            { status: 500 }
        );
    }
}