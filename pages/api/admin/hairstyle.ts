import { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const imageFile = files.image?.[0];
    const title = fields.title?.[0];
    const description = fields.description?.[0];

    if (!imageFile || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure hairstyles directory exists
    const publicPath = join(process.cwd(), 'public');
    const hairstylesPath = join(publicPath, 'hairstyles');
    try {
      await fs.access(hairstylesPath);
    } catch {
      await mkdir(hairstylesPath, { recursive: true });
    }

    // Save the image file
    const imageFileName = `${Date.now()}-${imageFile.originalFilename}`;
    const imagePath = join(hairstylesPath, imageFileName);
    
    await writeFile(imagePath, await fs.readFile(imageFile.filepath));

    // Update images.json with the correct path including 'hairstyles' directory
    const imagesJsonPath = join(process.cwd(), 'constants', 'images.json');
    const imagesData = JSON.parse(await fs.readFile(imagesJsonPath, 'utf-8'));
    
    imagesData.images.push([`hairstyles/${imageFileName}`, title, description]);
    
    await fs.writeFile(imagesJsonPath, JSON.stringify(imagesData, null, 2));

    res.status(200).json({ message: 'Hairstyle added successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
