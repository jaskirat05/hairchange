"use client"
import React, { useState ,useEffect} from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
const result = () => {
  const searchParams=useSearchParams()
  const image=searchParams?.get('image');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  function downloadImage() {
    const imageUrl = imageSrc!; 
    const fileName = 'downloaded-image.png'; // The file name for the download

    // Create an anchor element and set the download attribute
    const link = document.createElement('a');
    link.href = imageUrl;
    link.setAttribute('download', fileName);

    // Append the anchor to the body temporarily and trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link element
    document.body.removeChild(link);
}
  useEffect(() => {
    if (image) {
      setImageSrc(image);
    }
  }, [image]); // Runs whenever "image" changes
  return (<>
    <div className='h-[70vh] rounded-xl w-screen flex justify-center p-5'>
      <div className='bg-black w-[95vw] h-full rounded-3xl'>
      {imageSrc ? (
          <img src={imageSrc} alt="Uploaded" className="w-full h-full object-cover rounded-3xl" />
        ) : (
          <p className="text-gray-500"></p>
        )}

      </div>
    </div>
    <div className='flex flex-col w-full space-y-5 items-center'>
      <Button variant="default" onClick={downloadImage} size="lg" className='px-7 bg-gradient-to-tl from-yellow-500 to-yellow-200 to-95%'> Download Image</Button>
      <Button variant="outline" size="lg" className='bg-gradient-to-tl from-orange-600 to-orange-200 to-95%' asChild><Link href="/start">Try Another Hairstyle</Link></Button>
    </div>
    </>
  )
}

export default result