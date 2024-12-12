"use client"
import React, { useState ,useEffect} from 'react'
import { MoveLeft, SquareArrowRightIcon} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { UploadButton } from '@/components/ui/upload'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useRouter,redirect } from 'next/navigation'

import { HairDrawer } from '@/components/hairDrawer'
import Link from 'next/link'
import { Router } from 'next/router'
import { Progress } from '@/components/ui/progress'

const page = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hairImageSrc,setHairImage]=useState<string|null>(null);
  const [loading,setLoading]=useState<boolean>(false);
  const [progress,setProgress]=useState(15);
  const [haircutInput, setHaircutInput] = useState<string>("");
  const [selectedHairstyleDesc, setSelectedHairstyleDesc] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast()
  const generateImage=async ()=>
  { 
    if (!hairImageSrc) {
      toast({
        title: "Select Hairstyle",
        description: "Please select a hairstyle first"
      });
      return;
    }
    setLoading(true);
    setProgress(5);
    const person=imageSrc
    const hairStyle=await convertToBase64(hairImageSrc!);
    setProgress(10);
    console.log(hairStyle);
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image1Path: hairStyle,
        image2Path: person,
        haircutType: `${selectedHairstyleDesc}${haircutInput ? ', ' + haircutInput : ''}`
      }),
    });
    setProgress(80);
    const data=await response.json();
    if (response.status==500){
      setLoading(false);
      toast({
        title:"Server Busy",
        description:"The Server is starting or busy at the moment. Please try again"
      });
      
    }
    else if(response.status==200){
      setLoading(false);
      toast({
        title:"Success",
        description:"Your new hairstyle is ready"
      });
      setProgress(100);
      console.log(data.url);
      router.push(`/stage?image=${data.url}`);

      
  
    }
    //localStorage.clear();
   
    
    
    //console.log(response);
   //router.push("/stage");
  };
  const convertToBase64 = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imageSrc;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const base64Image = canvas.toDataURL('image/png'); // Change the format if needed
          resolve(base64Image);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image: ' + error));
      };
    });
  };

  const hairImage = (image: string, description: string): void => {
    setHairImage(image);
    setSelectedHairstyleDesc(description);
    console.log(hairImageSrc);
  };
  useEffect(() => {
    // On component mount, load the image from localStorage if available
    const storedImage = localStorage.getItem('uploadedImage');
    if (storedImage) {
      setImageSrc(storedImage);
    }
  }, []);
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setImageSrc(base64Image); // Update the state to show the new image
        localStorage.setItem('uploadedImage', base64Image); // Save image to localStorage
      };
      reader.readAsDataURL(file); // Convert the image to base64 string
    }
  };
  return (
  <>
  {loading &&<div className='absolute z-10 bg-black/80 top-0 left-0 w-full h-[110vh] flex items-center justify-center'>
  <div className='flex flex-col items-center space-y-4'>
    <Progress value={progress} className='w-60'/>
    <p className='font-bold text-lg text-white'>{progress}%</p>
    </div>
    
  </div>}
   <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden" // Hide the actual input element
      />
    <div className='h-[70vh] rounded-xl w-screen flex justify-center p-5'>
      <div className='bg-black w-[95vw] h-full rounded-3xl'>
      {imageSrc ? (
          <img src={imageSrc} alt="Uploaded" className="w-full h-full object-cover rounded-3xl" />
        ) : (
          <p className="text-gray-500">No image uploaded</p>
        )}

      </div>
    </div>
    <div className='flex flex-col items-center mt-5 space-y-5 h-[25vh]'>
    <HairDrawer imageSelector={hairImage} />
    <Separator className='w-[50%]'/>
    <Input 
      type="text" 
      placeholder="Dark Afro Haircut" 
      className='w-[80%]' 
      value={haircutInput}
      onChange={(e) => setHaircutInput(e.target.value)}
    />
    <div className='flex flex-row justify-between w-full px-5 items-center h-full'>
      
     <Link href="/"><MoveLeft/></Link>
     <label htmlFor='file-upload'>

      <UploadButton/>

     </label>
     <div 
      onClick={generateImage} 
  
    >

      <SquareArrowRightIcon/>
    </div>
      
      
    </div>
    </div>
    </>
  )
}

export default page