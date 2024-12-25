import workflowData from '../../constants/workflow.json';
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

if (!process.env.RUNPOD_API_KEY) {
  throw new Error('Missing required RunPod API key');
}

async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

async function imageAdapter(imageUrl: string, haircutType: string) {
  const jsonData = {...workflowData};
  jsonData.webhook = "https://c222-110-235-233-132.ngrok-free.app/api/webhook";
  
  // Convert image URL to base64
  const image2Base64 = await imageUrlToBase64(imageUrl);
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
  return {
    runpodId: runpodResponse.id,
    inputImage2: image2Base64
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { imageUrl, haircutType, workflow } = req.body;

    if (!imageUrl || !haircutType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call RunPod with the existing image URL
    const result = await imageAdapter(imageUrl, haircutType);

    // Create job in Supabase
    const { data, error } = await supabaseAdmin
      .from('runpod_jobs')
      .insert([
        {
          id: result.runpodId,
          status: 'PENDING',
          input_image_url: imageUrl, // Use the existing image URL
          user_id: auth.userId,
          settings: {
            hairstyle_type: haircutType,
            workflow: workflow
          }
        }
      ]);
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return res.status(200).json({
      jobId: result.runpodId,
      message: 'Job created successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
