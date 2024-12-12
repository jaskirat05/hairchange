"use client"
import React, { useState, useEffect } from 'react'
import { MoveLeft, SquareArrowRightIcon } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { UploadButton } from '@/components/ui/upload'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { HairDrawer } from '@/components/hairDrawer'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

export default function StartPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hairImageSrc, setHairImage] = useState<string|null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState(15);
  const [haircutInput, setHaircutInput] = useState<string>("");
  const [selectedHairstyleDesc, setSelectedHairstyleDesc] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const generateImage = async () => { 
    if (!hairImageSrc) {
      toast({
        title: "Select Hairstyle",
        description: "Please select a hairstyle first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(5);
    
    try {
      const person = imageSrc;
      const hairStyle = await convertToBase64(hairImageSrc!);
      setProgress(10);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      const response = await fetch('/api/upload', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1Path: hairStyle,
          image2Path: person,
          haircutType: `${selectedHairstyleDesc}${haircutInput ? ', ' + haircutInput : ''}`
        }),
      });

      clearTimeout(timeoutId);
      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const data = await response.json();
      setLoading(false);
      toast({
        title: "Success",
        description: "Your new hairstyle is ready"
      });
      setProgress(100);
      router.push(`/stage?image=${data.url}`);
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast({
            title: "Request Timeout",
            description: "The request took too long. Please try again with a smaller image or try again later.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to process image. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const convertToBase64 = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.height = img.height;
        canvas.width = img.width;
        ctx?.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      };
      img.onerror = error => {
        reject(error);
      };
      img.src = imageSrc;
    });
  };

  const handleImageSelect = (imageSrc: string, description: string) => {
    setHairImage(imageSrc);
    setSelectedHairstyleDesc(description);
    console.log(hairImageSrc);
  };

  useEffect(() => {
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
        setImageSrc(base64Image);
        localStorage.setItem('uploadedImage', base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {loading && (
        <div className='absolute z-10 bg-black/80 top-0 left-0 w-full h-[110vh] flex items-center justify-center'>
          <div className='flex flex-col items-center space-y-4'>
            <Progress value={progress} className='w-60'/>
            <p className='font-bold text-lg text-white'>{progress}%</p>
          </div>
        </div>
      )}
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
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
        <HairDrawer imageSelector={handleImageSelect} />
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
          <div onClick={generateImage}>
            <SquareArrowRightIcon/>
          </div>
        </div>
      </div>
    </>
  );
}