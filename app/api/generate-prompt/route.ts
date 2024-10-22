import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userEvent } = await request.json();
        const situationWords= "Hi my Name is Hardik";

        // The base prompt style remains the same, only the event (userEvent) changes
        const basePrompt = `
        TOK: Create a cartoon scene featuring a young man with medium-length, slightly wavy black hair falling around his forehead, wearing a zip-up jacket with a soft texture. The scene should describe the character ${userEvent}. 
        A thought bubble appears over the boy's head with the exact words "${situationWords}" reflecting his mood in the situation. Ensure the environment matches the mood and is described in detail.
        Every prompt should include a peaceful or dynamic setting, depending on the event, and the dialogue in thought bubbles must use the exact words prefix. 
        Maintain a consistent character design across all scenes. The scene is described in TOK style.`


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
                max_tokens: 300,
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
