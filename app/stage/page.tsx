"use client"
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Result() {
  const searchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams!.get('image')) return;
    setImageUrl(searchParams!.get('image'));
  }, [searchParams]);

  const downloadImage = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hairstyle.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  if (error) {
    setError("Some error happened");  
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (!imageUrl) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div>
      <div className='h-[70vh] rounded-xl w-screen flex justify-center p-5'>
        <div className='bg-black w-[95vw] h-full rounded-3xl'>
          {/* Using img instead of Image component because the image URL is from an external source */}
          <img 
            src={imageUrl} 
            alt="Generated Hairstyle" 
            className="w-full h-full object-cover rounded-3xl"
          />
        </div>
      </div>
      <div className='flex flex-col w-full space-y-5 items-center'>
        <Button 
          variant="default" 
          onClick={downloadImage} 
          size="lg" 
          className='px-7 bg-gradient-to-tl from-yellow-500 to-yellow-200 to-95%'
        >
          Download Image
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className='bg-gradient-to-tl from-orange-600 to-orange-200 to-95%' 
          asChild
        >
          <Link href="/start">Try Another Hairstyle</Link>
        </Button>
      </div>
    </div>
  );
}