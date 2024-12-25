import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Get the job details from runpod_jobs table
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('runpod_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create a new community post
    const { data: postData, error: postError } = await supabaseAdmin
      .from('community_posts')
      .insert([
        {
          user_id: auth.userId,
          job_id: jobId,
          input_image_url: jobData.input_image_url,
          output_image_url: jobData.output_url,
          hairstyle_settings: jobData.settings || { hairstyle_type: 'unknown' },
          likes_count: 0,
          posted_at: new Date().toISOString(),
          week_number: getWeekNumber(new Date())
        }
      ])
      .select()
      .single();

    if (postError) {
      console.error('Error creating community post:', postError);
      return res.status(500).json({ error: 'Failed to create community post' });
    }

    return res.status(200).json(postData);
  } catch (error) {
    console.error('Error in community post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to get the week number for contest tracking
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}
