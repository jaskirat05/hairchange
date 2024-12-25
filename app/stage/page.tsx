"use client"
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { supabase } from "@/lib/supabase-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const trendingHairstyles = [
  {
    id: 1,
    name: "Modern Pixie",
    imageUrl: "/trending/pixie.jpg"
  },
  {
    id: 2,
    name: "Beach Waves",
    imageUrl: "/trending/waves.jpg"
  },
  {
    id: 3,
    name: "Sleek Bob",
    imageUrl: "/trending/bob.jpg"
  },
  {
    id: 4,
    name: "Layered Long",
    imageUrl: "/trending/layered.jpg"
  }
];

const communityTransformations = [
  {
    id: 1,
    beforeUrl: "/community/before1.jpg",
    afterUrl: "/community/after1.jpg",
    userName: "Sarah M.",
    likes: 234,
    style: "Wavy Bob"
  },
  {
    id: 2,
    beforeUrl: "/community/before2.jpg",
    afterUrl: "/community/after2.jpg",
    userName: "Emily K.",
    likes: 189,
    style: "Long Layers"
  },
  {
    id: 3,
    beforeUrl: "/community/before3.jpg",
    afterUrl: "/community/after3.jpg",
    userName: "Jessica R.",
    likes: 156,
    style: "Pixie Cut"
  }
];

export default function Result() {
  const searchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [showTransition, setShowTransition] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const jobId = searchParams!.get('jobId');
    if (!jobId) {
      setError("No job ID provided");
      return;
    }

    const checkJobStatus = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('runpod_jobs')
          .select('status, output_url, input_image_url')
          .eq('id', jobId)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setStatus(data.status);
          if (!originalImageUrl && data.input_image_url) {
            setOriginalImageUrl(data.input_image_url);
          }
          if (data.status === 'COMPLETED' && data.output_url) {
            setImageUrl(data.output_url);
            // Start transition after a short delay
            setTimeout(() => setShowTransition(true), 500);
          } else if (data.status === 'FAILED') {
            setError("Job processing failed");
          }
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError("Failed to fetch job status");
      }
    };

    // Check immediately
    checkJobStatus();

    // Then check every 5 seconds if not completed
    const interval = setInterval(() => {
      if (status !== 'COMPLETED' && status !== 'FAILED') {
        checkJobStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [searchParams, status, originalImageUrl]);

  const downloadImage = async () => {
    if (!imageUrl) {
      console.error('No image URL available');
      return;
    }

    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = `/api/download?url=${encodeURIComponent(imageUrl)}`;
      link.download = 'hairstyle.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image:', err);
      setError("Failed to download image");
    }
  };

  const handlePostToCommunity = async () => {
    const jobId = searchParams!.get('jobId');
    if (!jobId) {
      setError("No job ID available");
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch('/api/community/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        throw new Error('Failed to post to community');
      }

      // Close the modal and show success message
      setShowPostModal(false);
      // You might want to add a toast or notification here
    } catch (err) {
      console.error('Failed to post to community:', err);
      setError("Failed to post to community");
    } finally {
      setIsPosting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="text-center p-4 text-red-500">Error: {error}</div>
        <Button 
          variant="outline" 
          size="lg" 
          className='bg-gradient-to-tl from-orange-600 to-orange-200 to-95%' 
          asChild
        >
          <Link href="/start">Try Again</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Image Section */}
      <div className='h-[70vh] w-full flex justify-center p-5'>
        <div className='bg-black w-[95vw] h-full rounded-3xl overflow-hidden relative'>
          {!originalImageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="space-y-4 w-full">
                <Skeleton className="h-full w-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white">Processing your image... ({status})</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Original Image */}
              <img 
                src={originalImageUrl} 
                alt="Original Image" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Generated Image with Transition */}
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt="Generated Hairstyle" 
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-all duration-1000",
                    showTransition 
                      ? "opacity-100 scale-100" 
                      : "opacity-0 scale-95"
                  )}
                  style={{ transformOrigin: 'center' }}
                />
              )}

              {/* Status Overlay */}
              {status !== 'COMPLETED' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="text-white">Transforming your image... ({status})</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex flex-col w-full space-y-5 items-center mt-6'>
        <Button 
          variant="default" 
          onClick={downloadImage} 
          size="lg" 
          className='px-7 bg-gradient-to-tl from-yellow-500 to-yellow-200 to-95%'
          disabled={!imageUrl}
        >
          Download Image
        </Button>
        
        <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              size="lg" 
              className='px-7 bg-gradient-to-tl from-blue-500 to-blue-200 to-95%'
              disabled={!imageUrl}
            >
              Post to Community
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-border">
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-foreground">Share with the Community</DialogTitle>
              <DialogDescription className="pt-4 space-y-4 text-muted-foreground">
                <p>
                  By sharing your transformation, your image will be publicly visible in our community section.
                </p>
                <p className="font-medium text-primary">
                  🏆 Weekly Contest: Get a chance to win $50 if your transformation receives the most likes this week!
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPostModal(false)}
                className="border-border text-foreground hover:bg-accent"
                disabled={isPosting}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePostToCommunity}
                className="bg-primary text-primary-foreground hover:opacity-90"
                disabled={isPosting}
              >
                {isPosting ? (
                  <>
                    <span className="animate-spin mr-2">⭮</span>
                    Sharing...
                  </>
                ) : (
                  'Share My Transformation'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          size="lg" 
          className='bg-gradient-to-tl from-orange-600 to-orange-200 to-95%' 
          asChild
        >
          <Link href="/start">Try Another Hairstyle</Link>
        </Button>
      </div>

      {/* Trending Hairstyles Section */}
      <div className="mt-16 px-5">
        <h2 className="text-2xl font-bold text-center mb-8">Try Trending Hairstyles</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingHairstyles.map((style) => (
            <div key={style.id} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-200">
                <img
                  src={style.imageUrl}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-xl">
                <Button 
                  variant="default"
                  size="sm"
                  asChild
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Link href={`/start?style=${style.id}`}>Try This Style</Link>
                </Button>
              </div>
              <p className="mt-2 text-center font-medium">{style.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Community Transformations Section */}
      <div className="mt-20 px-5 pb-20 bg-white py-16">
        <h2 className="text-2xl font-bold text-center mb-2">By the Community</h2>
        <p className="text-center text-gray-600 mb-12">Real transformations from our users</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {communityTransformations.map((transform) => (
            <div key={transform.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-48 md:h-64">
                <div className="w-1/2 relative">
                  <img
                    src={transform.beforeUrl}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Before
                  </div>
                </div>
                <div className="w-1/2 relative">
                  <img
                    src={transform.afterUrl}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    After
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{transform.userName}</span>
                  <div className="flex items-center text-gray-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    {transform.likes}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{transform.style}</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  asChild
                >
                  <Link href={`/start?style=${transform.style}`}>Try This Look</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}