import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userEvent } = await request.json();

        // The base prompt style remains the same, only the event (userEvent) changes
        const basePrompt = `TOK: Create a cartoon character of a young man with medium-length, slightly wavy black hair falling around his forehead, wearing a zip-up jacket. The scene should describe the character ${userEvent}. A thought bubble floats above his head with the exact words that reflect his mood in the situation. Please ensure the description is detailed, includes the character's expression, and captures the environment. Limit the description to 200 tokens.`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Using GPT-4 for higher quality
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: basePrompt }
                ],
                max_tokens: 200,
            }),
        });

        const openaiData = await openaiResponse.json();

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
