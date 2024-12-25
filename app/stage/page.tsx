"use client"
import { useSearchParams, useRouter } from "next/navigation";
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
import { Heart } from "@/components/icons/heart";
import { useAuth } from "@clerk/nextjs";

export default function Result() {
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [showTransition, setShowTransition] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

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

  const tryTransformation = async (settings: any) => {
    try {
      if (!originalImageUrl) {
        setError("Please upload an image first");
        return;
      }

      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: originalImageUrl,
          haircutType: settings.hairstyle_type,
          workflow: settings.workflow
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start transformation');
      }

      const data = await response.json();
      router.push(`/stage?jobId=${data.jobId}`);
    } catch (err) {
      console.error('Error starting transformation:', err);
      setError("Failed to start transformation");
    }
  };

  // Fetch community posts
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        // Fetch trending posts (by likes)
        const { data: trendingData, error: trendingError } = await supabase
          .from('community_posts')
          .select(`
            id,
            input_image_url,
            output_image_url,
            hairstyle_settings,
            likes_count,
            posted_at,
            user_id,
            community_likes (user_id)
          `)
          .order('likes_count', { ascending: false })
          .limit(4);

        if (trendingError) throw trendingError;

        // Fetch recent posts
        const { data: recentData, error: recentError } = await supabase
          .from('community_posts')
          .select(`
            id,
            input_image_url,
            output_image_url,
            hairstyle_settings,
            likes_count,
            posted_at,
            user_id,
            community_likes (user_id)
          `)
          .order('posted_at', { ascending: false })
          .limit(10);

        if (recentError) throw recentError;

        // Get the current user's liked posts
        const allPosts = [...(trendingData || []), ...(recentData || [])];
        const userLikes = new Set(
          allPosts
            ?.filter(post => 
              post.community_likes?.some((like: any) => like.user_id === userId)
            )
            .map(post => post.id)
        );
        
        setLikedPosts(userLikes);
        setTrendingPosts(trendingData || []);
        setRecentPosts(recentData || []);
      } catch (err) {
        console.error('Error fetching community posts:', err);
      }
    };

    if (userId) {
      fetchCommunityPosts();
    }
  }, [userId]);

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch('/api/community/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) throw new Error('Failed to like post');

      const updatedPost = await response.json();
      
      // Update local state
      setTrendingPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: updatedPost.likes_count }
            : post
        )
      );

      setRecentPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: updatedPost.likes_count }
            : post
        )
      );

      // Toggle like in local state
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });
    } catch (err) {
      console.error('Error liking post:', err);
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

      {/* Trending Transformations */}
      <section className="mt-16 w-full">
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg border border-purple-100/50">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Trending Transformations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
            {trendingPosts.map((post) => (
              <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden w-full transform transition-transform hover:scale-[1.02]">
                <div className="relative aspect-square w-full">
                  <div className="absolute inset-0 flex">
                    {/* Before Image */}
                    <div className="w-1/2 relative overflow-hidden">
                      <img
                        src={post.input_image_url}
                        alt="Before"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    {/* After Image */}
                    <div className="w-1/2 relative overflow-hidden">
                      <img
                        src={post.output_image_url}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    {/* Center Line */}
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white transform -translate-x-1/2 z-10" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-b from-white/80 to-purple-50/80">
                  <div className="flex justify-between items-center gap-4">
                    <Button
                      onClick={() => tryTransformation(post.hairstyle_settings)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!originalImageUrl || status !== "COMPLETED"}
                    >
                      {!originalImageUrl 
                        ? "Upload an image first" 
                        : status !== "COMPLETED"
                        ? "Wait for current transformation"
                        : "Try this transformation"}
                    </Button>
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 ${
                        likedPosts.has(post.id) 
                          ? 'text-red-500' 
                          : 'text-gray-500 hover:text-red-500'
                      } transition-colors`}
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          likedPosts.has(post.id) ? 'fill-current' : ''
                        }`}
                      />
                      <span className="font-medium">{post.likes_count || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Transformations */}
      <section className="mt-16 w-full">
        <h2 className="text-2xl font-bold mb-6">Recent Transformations</h2>
        <div className="space-y-6 w-full max-w-4xl mx-auto">
          {recentPosts.map((post) => (
            <div key={post.id} className="bg-black/10 rounded-lg shadow-md overflow-hidden w-full">
              <div className="relative aspect-[2/1] w-full">
                <div className="absolute inset-0 flex">
                  {/* Before Image */}
                  <div className="w-1/2 relative overflow-hidden">
                    <img
                      src={post.input_image_url}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {/* After Image */}
                  <div className="w-1/2 relative overflow-hidden">
                    <img
                      src={post.output_image_url}
                      alt="After"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {/* Center Line */}
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white transform -translate-x-1/2 z-10" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center gap-4">
                  <Button
                    onClick={() => tryTransformation(post.hairstyle_settings)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!originalImageUrl || status !== "COMPLETED"}
                  >
                    {!originalImageUrl 
                      ? "Upload an image first" 
                      : status !== "COMPLETED"
                      ? "Wait for current transformation"
                      : "Try this transformation"}
                  </Button>
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 ${
                      likedPosts.has(post.id) 
                        ? 'text-red-500' 
                        : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        likedPosts.has(post.id) ? 'fill-current' : ''
                      }`}
                    />
                    <span className="text-lg font-medium">{post.likes_count || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}