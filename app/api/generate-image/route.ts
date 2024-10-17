import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const POLLING_INTERVAL = 1000; // 1 second
const MAX_ATTEMPTS = 120; // 2 minutes total polling time

interface InputSchema {
  seed?: number;
  prompt: string;
  subject?: string;
  output_format?: 'webp' | 'jpg' | 'png';
  output_quality?: number;
  negative_prompt?: string;
  randomise_poses?: boolean;
  number_of_outputs?: number;
  disable_safety_checker?: boolean;
  number_of_images_per_pose?: number;
}

async function pollPrediction(replicate: Replicate, predictionId: string): Promise<string[]> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prediction = await replicate.predictions.get(predictionId);
    console.log(`Polling attempt ${attempt + 1}/${MAX_ATTEMPTS}, status: ${prediction.status}`);

    switch (prediction.status) {
      case 'succeeded':
        console.log('Output URLs:', prediction.output);
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
    auth: 'r8_S7o1Tm3HGwEe2QWcua2vRCetNAHAUgW1yNaDY',
  });

  try {
    const input: InputSchema = await request.json();

    if (!input.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const subjectUrl = "https://replicate.delivery/pbxt/L0gy7uyLE5UP0uz12cndDdSOIgw5R3rV5N6G2pbt7kEK9dCr/0_3.webp";
    //@typescript-eslint/no-explicit-any
    const prediction = await replicate.predictions.create({
      version: "e90b0b680b1dca1bab496f163fdfc7cff174f7cd18d094bf57664f1891f2e857",
      input: {
        prompt: input.prompt,
        subject: subjectUrl,
        seed: input.seed,
        output_format: input.output_format || 'webp',
        output_quality: input.output_quality || 80,
        negative_prompt: input.negative_prompt || '',
        randomise_poses: input.randomise_poses ?? true,
        number_of_outputs: input.number_of_outputs || 1,
        disable_safety_checker: input.disable_safety_checker || false,
        number_of_images_per_pose: input.number_of_images_per_pose || 1,
      },
    });

    console.log('Prediction created:', prediction.id);

    const outputUrls = await pollPrediction(replicate, prediction.id);

    console.log('Final output URLs:', outputUrls);

    return NextResponse.json({
      success: true,
      images: outputUrls,
      predictionId: prediction.id,
    });

  } catch (error: any) {
    console.error('Error in image generation:', error);

    return NextResponse.json({
      error: 'Failed to generate image',
      details: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export type GenerateImageResponse = {
  success: boolean;
  images?: string[];
  predictionId?: string;
  error?: string;
  details?: string;
  timestamp?: string;
};