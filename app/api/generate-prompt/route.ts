import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userEvent } = await request.json();

        const basePrompt = `Describe the cartoon style mascot of the company in every single detail, including physical attributes, personality, and the event of ${userEvent}. Please ensure the description fits the character reference provided. limit to 200 tokens.`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',  // Updated to GPT-4o
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: basePrompt }
                ],
                max_tokens: 200,
            }),
        });

        const openaiData = await openaiResponse.json();
        console.log("OpenAI Response:", openaiData);  // Log OpenAI response for debugging

        // Check if choices exist and are not empty
        if (openaiData.choices && openaiData.choices.length > 0) {
            const generatedPrompt = openaiData.choices[0].message.content.trim();
            return NextResponse.json({ prompt: generatedPrompt });
        } else {
            return NextResponse.json({ error: 'No choices returned from OpenAI' }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in generate-prompt:", error);
        return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
    }
}
