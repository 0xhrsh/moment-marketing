// app/api/generate-prompt/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type, imageUrl, event, story } = await request.json();

    let description = '';
    let generatedStory = '';
    let prompts: string[] = [];

    if (type === 'character') {
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'Image URL is required for character description.' },
          { status: 400 }
        );
      }

      const basePrompt = `
        Create a detailed character description based on the following image URL: ${imageUrl}.
        Include the character's appearance, personality, and background.
      `;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a creative and descriptive assistant.' },
            { role: 'user', content: basePrompt },
          ],
          max_tokens: 300,
        }),
      });

      const openaiData = await openaiResponse.json();

      if (openaiData.choices && openaiData.choices.length > 0) {
        description = openaiData.choices[0].message.content.trim();
        return NextResponse.json({ description });
      } else {
        return NextResponse.json(
          { error: 'No description returned from OpenAI.' },
          { status: 500 }
        );
      }
    } else if (type === 'story') {
      if (!event) {
        return NextResponse.json(
          { error: 'Event description is required to generate a story.' },
          { status: 400 }
        );
      }

      const basePrompt = `
        Write a short story based on the following event: "${event}".
        The story should be engaging, coherent, and suitable for a general audience.
      `;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a creative and narrative-focused assistant.' },
            { role: 'user', content: basePrompt },
          ],
          max_tokens: 500,
        }),
      });

      const openaiData = await openaiResponse.json();
      console.log("openaiData",openaiData);

      if (openaiData.choices && openaiData.choices.length > 0) {
        generatedStory = openaiData.choices[0].message.content.trim();
        return NextResponse.json({ story: generatedStory });
      } else {
        return NextResponse.json(
          { error: 'No story returned from OpenAI.' },
          { status: 500 }
        );
      }
    } else if (type === 'image-prompts') {
      if (!story) {
        return NextResponse.json(
          { error: 'Story is required to generate image prompts.' },
          { status: 400 }
        );
      }

      const basePrompt = `
      Generate 6 highly detailed prompts for image creation based on the following story:
    
      "${story}"
    
      Each prompt should include:
      - A comprehensive character description.
      - A specific scene or moment from the story.
      - Thought bubbles showing conversation with exact words.
      - The phrase "in TOK style" at the end.
    
      Structure each prompt as a numbered list item, for example:
    
      1. Create a cartoon scene of...
    
      Ensure that the prompts are diverse, covering different parts of the story, including the beginning, middle, and end. The last prompt should conclude the story with a happy and educational ending.
      
      **Example Prompt:**
      
      1. Create a cartoon scene of a young man with medium-length, slightly wavy black hair falling around his forehead, wearing a zip-up jacket with a soft texture matching his jolly nature. He is standing in a peaceful park, facing a girl with long brown hair in a yellow dress. They are looking directly at each other, having a calm conversation amidst their serene surroundings. Tall trees, blooming flowers, and a clear blue sky create a tranquil backdrop. The young man is speaking with a relaxed expression, gesturing gently with his hands as he says the exact words, "I feel at peace here." These words are shown in a thought bubble over the head of the boy. The girl, smiling softly, responds with the exact words in the thought bubble that appears over her head, "Me too." The sunlight streams through the trees, casting gentle shadows on the ground, and birds are flying overhead, adding to the peaceful atmosphere of the park. The moment is calm and serene, reflecting their quiet conversation in TOK style.
    `;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an assistant that generates detailed image prompts based on a story.' },
            { role: 'user', content: basePrompt },
          ],
          max_tokens: 800,
        }),
      });

      const openaiData = await openaiResponse.json();

      if (openaiData.choices && openaiData.choices.length > 0) {
        const promptsText = openaiData.choices[0].message.content.trim();
        // Extract prompts from the response
        // Assuming GPT-4 formats prompts as a numbered list
        prompts = promptsText
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.match(/^\d+\.\s+/))
          .map((line: string) => line.replace(/^\d+\.\s+/, '')); // Remove numbering
          console.log(prompts);

        return NextResponse.json({ prompts });
      } else {
        return NextResponse.json(
          { error: 'No prompts returned from OpenAI.' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request type.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in generate-prompt:", error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
