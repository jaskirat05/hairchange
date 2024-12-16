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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
      //const hairStyle = await convertToBase64(hairImageSrc!);
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
          imagePath: person,
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
      router.push(`/stage?jobId=${data.jobId}`);
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <Progress value={progress} className="w-[60vw] md:w-[40vw] lg:w-[30vw]" />
          </div>
        </div>
      )}
      <main className={`min-h-screen flex flex-col ${isDrawerOpen ? 'pointer-events-none' : ''}`}>
        <div className='flex-1 max-h-[75vh] w-full flex justify-center p-3 md:p-5'>
          <div className='bg-black w-full max-w-4xl aspect-square rounded-3xl relative pointer-events-none touch-none'>
            {imageSrc ? (
              <img 
                src={imageSrc} 
                alt="Uploaded" 
                className="w-full h-full object-cover rounded-3xl pointer-events-none" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">No image uploaded</p>
              </div>
            )}
          </div>
        </div>
        <div className='flex flex-col items-center mt-auto space-y-3 md:space-y-5 p-3 md:p-5'>
          <div className="pointer-events-auto">
            <HairDrawer imageSelector={handleImageSelect} onOpenChange={setIsDrawerOpen} />
          </div>
          <Separator className='w-[80%] md:w-[50%]'/>
          <Input 
            type="text" 
            placeholder="Dark Afro Haircut" 
            className='w-[90%] md:w-[80%] lg:w-[60%]' 
            value={haircutInput}
            onChange={(e) => setHaircutInput(e.target.value)}
            disabled={isDrawerOpen}
          />
          <div className='flex flex-row justify-between w-full px-5 items-center'>
            <div className={isDrawerOpen ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}>
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <MoveLeft className="w-6 h-6 md:w-8 md:h-8"/>
              </Link>
            </div>
            <div className={isDrawerOpen ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}>
              <label htmlFor='file-upload' className="hover:opacity-80 transition-opacity">
                <UploadButton/>
              </label>
            </div>
            <div 
              className={`hover:opacity-80 transition-opacity cursor-pointer ${isDrawerOpen ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}`}
              onClick={generateImage}
            >
              <SquareArrowRightIcon className="w-6 h-6 md:w-8 md:h-8"/>
            </div>
          </div>
        </div>
      </main>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </>
  );
}