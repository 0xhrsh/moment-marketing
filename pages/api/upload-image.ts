// pages/api/upload-image.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '../../lib/cloudinary';
import { IncomingForm, Fields, Files, File } from 'formidable';
import fs from 'fs';

// Disable Next.js default body parser to handle file uploads with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormidableFiles {
  image?: File | File[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const form = new IncomingForm();

  try {
    const { fields, files }: { fields: Fields; files: FormidableFiles } =
      await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    let file: File | null = null;

    if (files.image) {
      if (Array.isArray(files.image)) {
        file = files.image[0];
      } else {
        file = files.image;
      }
    }

    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Optionally, validate file type and size here
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    // Upload the image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
      folder: 'cartoon_generator', // Optional: specify a folder in Cloudinary
      // You can add more options here if needed
    });

    return res.status(200).json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Error in upload-image:', error);
    return res.status(500).json({ error: 'Error uploading the image.' });
  }
};

export default handler;
