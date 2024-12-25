import workflowData from '../../constants/workflow.json';
import cloudinary from 'cloudinary';
import type { NextApiRequest, NextApiResponse } from 'next'

import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing required Cloudinary environment variables');
}

if (!process.env.RUNPOD_API_KEY) {
  throw new Error('Missing required RunPod API key');
}

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
    maxDuration: 300, // Set maximum duration to 5 minutes
  },
};

const convertToBase64 = async (file: File | string): Promise<string> => {
  // Check if the string has a MIME type and strip it off
  if (typeof file === 'string') {
      if (file.startsWith('data:image/')) {
          // Remove the MIME type part (data:image/...;base64,)
          return file.replace(/^data:image\/\w+;base64,/, '');
      } else {
          // It's already in the expected base64 format without MIME
          return file;
      }
  }

  // Convert the file to base64 string if it's a File
  return new Promise((resolve, reject) => {
    if (file instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (data:image/...;base64,)
        const base64String = (reader.result as string).replace(/^data:image\/\w+;base64,/, '');
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    } else {
      reject('Invalid file type');
    }
  });
};

async function imageAdapter(imagePath: string, haircutType: string) {
  const jsonData = {...workflowData};
  jsonData.webhook= `${process.env.WEBHOOK_URL}/api/webhook` || "https://c222-110-235-233-132.ngrok-free.app/api/webhook"; 
  const image2Base64 = await convertToBase64(imagePath);
  
  jsonData.input.images[0].image = image2Base64;
  
  if (jsonData.input.workflow["12"] && jsonData.input.workflow["12"].inputs) {
      jsonData.input.workflow["12"].inputs.text = haircutType;
  }

  const workflowStr = JSON.stringify(jsonData);
  
  // Call RunPod
  const response = await fetch('https://api.runpod.ai/v2/ymgc00mec97o48/run', {
      method: 'POST',
      headers: {
          'Authorization': process.env.RUNPOD_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json'
      },
      body: workflowStr,
  });

  if (!response.ok) {
      throw new Error(`Failed to send data: ${response.statusText}`);
  }
  
  const runpodResponse = await response.json();
  console.log(runpodResponse);  
  return {
      runpodId: runpodResponse.id,
      inputImage2: image2Base64
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
      const { userId } = await getAuth(req);
      if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      const { imagePath, haircutType } = req.body;
      
      // Upload input image to Cloudinary
      const uploadResponse = await cloudinary.v2.uploader.upload(imagePath);

      // Call RunPod
      const result = await imageAdapter(imagePath, haircutType);

      // Create job in Supabase
      const { data, error } = await supabaseAdmin
        .from('runpod_jobs')
        .insert([
          {
            id: result.runpodId,
            status: 'PENDING',
            input_image_url: uploadResponse.secure_url,
            user_id: userId,
            settings: {
              hairstyle_type: haircutType,
              workflow: workflowData.input.workflow,
              created_at: new Date().toISOString()
            }
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create job: ${error.message}`);
      }

      // Return the job ID to the client
      res.status(200).json({ 
          jobId: result.runpodId,
          message: 'Job created successfully'
      });

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to process request' });
  }
}