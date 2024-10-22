// app/api/generate-image/route.ts
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const POLLING_INTERVAL = 1000; // 1 second polling interval
const MAX_ATTEMPTS = 120; // 2 minutes total polling time

export interface GenerateImageResponse {
  success: boolean;
  images?: string[]; // Array of image URLs
  error?: string;
  status: 'processing' | 'succeeded' | 'failed';
}

interface InputSchema {
  prompt: string;
  num_outputs?: number;
  width?: number;
  height?: number;
  output_format?: 'webp' | 'jpg' | 'png';
}

// Polling function to check the status of the prediction until it finishes
async function pollPrediction(replicate: Replicate, predictionId: string): Promise<string[]> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prediction = await replicate.predictions.get(predictionId);
    console.log(`Polling attempt ${attempt + 1}/${MAX_ATTEMPTS}, status: ${prediction.status}`);

    switch (prediction.status) {
      case 'succeeded':
        return prediction.output;
      case 'failed':
        throw new Error(`Prediction failed: ${prediction.error}`);
      case 'canceled':
        throw new Error('Prediction was canceled');
      case 'processing':
      case 'starting':
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        break;
      default:
        throw new Error(`Unknown prediction status: ${prediction.status}`);
    }
  }
  throw new Error('Polling timed out');
}

export async function POST(request: Request) {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY!, // Ensure you have the Replicate API key set in your environment
  });

  try {
    const input: InputSchema = await request.json();

    if (!input.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Call the Replicate API to create a prediction
    const prediction = await replicate.predictions.create({
      version: "cc3beea6ddc39416cf121390b476b1a8802ca47db03fb97306ef6c25f38f60a2", // Use the model version you provided
      input: {
        prompt: input.prompt,
        num_outputs: input.num_outputs || 1, // Default to 1 output
        width: input.width || 1024, // Default width
        height: input.height || 1024, // Default height
        output_format: input.output_format || 'webp', // Default format
      }
    });

    // Ensure that the prediction object contains an ID
    if (!prediction.id) {
      throw new Error('Prediction ID not returned from Replicate API');
    }

    console.log('Prediction created with ID:', prediction.id);

    // Poll until the prediction is complete
    const outputUrls = await pollPrediction(replicate, prediction.id);

    return NextResponse.json({
      success: true,
      images: outputUrls,
      predictionId: prediction.id,
      status: 'succeeded',
    });
  } catch (error: any) {
    console.error('Error in generate-image:', error.message);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate image',
        details: error.message,
        status: 'failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
