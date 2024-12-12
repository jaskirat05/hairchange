import workflowData from '../../constants/workflow.json';
import cloudinary from 'cloudinary';
import type { NextApiRequest, NextApiResponse } from 'next'

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

async function imageAdapter(image1Path:string, image2Path:string, haircutType: string) {
  // Load the JSON file
  const jsonData = {...workflowData};

  // Convert the image paths to base64 strings
  const image1Base64 = await convertToBase64(image1Path);
  
  const image2Base64 = await convertToBase64(image2Path);

  // Modify the JSON with provided base64 image strings in the "images" section
  jsonData.input.images[0].image = image2Base64; // Replace base64 string for image1 (image3.png)
  jsonData.input.images[1].image = image1Base64; // Replace base64 string for image2 (image2.png)
  
  // Update the text in node 12 with the user's input
  if (jsonData.input.workflow["12"] && jsonData.input.workflow["12"].inputs) {
    jsonData.input.workflow["12"].inputs.text = haircutType;
  }

  console.log("This is the image ", image1Base64);
  console.log("This is the request", jsonData)
  // Update the workflow with the new haircut type
  const workflowStr = JSON.stringify(jsonData);
  //const updatedWorkflow = workflowStr.replace(/bantu knots/g, haircutType);
 // const updatedJsonData = JSON.parse(updatedWorkflow);

  console.log("This is the iamge ", image1Base64);
  console.log("This is the request", jsonData)  
  // Send a POST request with the modified JSON
  const response = await fetch('https://api.runpod.ai/v2/ymgc00mec97o48/runsync', {
    
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
  //console.log("hellooooooo-----------------",response.json)
  const newImage=await response.json();
  const mimeType="image/png";
  const base64Image=newImage.output.message
  const base64withMIME= `data:${mimeType};base64,${base64Image}`;
  const uploadResponse = await cloudinary.v2.uploader.upload(base64withMIME).then(result=>{
    return result.url;
  });
  return uploadResponse;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    const { image1Path, image2Path, haircutType } = req.body;

    try {
      // Set a longer timeout for the response
      res.setTimeout(300000); // 5 minutes

      // Start processing immediately
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'application/json');

      // Await imageAdapter and return the result as a response.
      const uploadResponse = await imageAdapter(image1Path, image2Path, haircutType);
      console.log(uploadResponse);

      // Return the response
      return res.status(200).json({ success: true, "url": uploadResponse });
    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Server is busy or starting up please wait",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}