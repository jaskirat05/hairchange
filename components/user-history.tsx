"use client"

import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { History } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { UserTransformation } from "@/types/transformation";

export function UserHistory() {
  const { userId } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userTransformations, setUserTransformations] = useState<UserTransformation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserTransformations = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('runpod_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUserTransformations(data || []);
    } catch (err) {
      console.error('Error fetching user transformations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl p-0 transition-all z-50 border-2 border-white"
        onClick={() => {
          setIsOpen(true);
          fetchUserTransformations();
        }}
      >
        <History className="h-6 w-6 text-white" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[640px] bg-gradient-to-br from-gray-50 to-white/80 border-2 border-purple-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent pb-2 border-b border-purple-100">
            Your Transformations
          </DialogTitle>
          <div className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-gray-100 to-white rounded-lg p-4 animate-pulse shadow-sm">
                    <div className="h-40 bg-gray-200 rounded-md mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : userTransformations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <History className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-600 font-medium">No transformations yet</p>
                <p className="text-gray-500 text-sm mt-1">Your transformation history will appear here</p>
              </div>
            ) : (
              userTransformations.map((transform: UserTransformation) => (
                <div key={transform.id} 
                  className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg overflow-hidden shadow-md border border-purple-100/50 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    router.push(`/stage?jobId=${transform.id}`);
                    setIsOpen(false);
                  }}
                >
                  <div className="relative aspect-[2/1] w-full">
                    <div className="absolute inset-0 flex">
                      {/* Before Image */}
                      <div className="w-1/2 relative overflow-hidden">
                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                          Before
                        </div>
                        <img
                          src={transform.input_image_url}
                          alt="Before"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {/* After Image */}
                      <div className="w-1/2 relative overflow-hidden">
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                          After
                        </div>
                        <img
                          src={transform.output_url!}
                          alt="After"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {/* Center Line */}
                      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80 backdrop-blur-sm transform -translate-x-1/2 z-10 shadow-sm" />
                    </div>
                    {/* View overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        View Details
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50/80 to-blue-50/80 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 font-medium">
                        {new Date(transform.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full shadow-sm ${
                        transform.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : transform.status === 'FAILED'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {transform.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
}
