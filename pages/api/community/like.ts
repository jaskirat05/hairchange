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

    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    // Check if the user already liked this post
    const { data: existingLike, error: likeError } = await supabaseAdmin
      .from('community_likes')
      .select()
      .eq('user_id', auth.userId)
      .eq('post_id', postId)
      .single();

    if (likeError && likeError.code !== 'PGRST116') throw likeError;

    if (existingLike) {
      // Unlike: Remove the like and decrement count
      const { error: deleteError } = await supabaseAdmin
        .from('community_likes')
        .delete()
        .eq('user_id', auth.userId)
        .eq('post_id', postId);

      if (deleteError) throw deleteError;

      const { data: decrementResult, error: rpcError } = await supabaseAdmin.rpc('decrement_likes', { post_id: postId });
      if (rpcError) throw rpcError;

      const { data: updatedPost, error: updateError } = await supabaseAdmin
        .from('community_posts')
        .update({ likes_count: decrementResult })
        .eq('id', postId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({ ...updatedPost, liked: false });
    } else {
      // Like: Add the like and increment count
      const { error: insertError } = await supabaseAdmin
        .from('community_likes')
        .insert([{ user_id: auth.userId, post_id: postId }]);

      if (insertError) throw insertError;

      const { data: incrementResult, error: rpcError } = await supabaseAdmin.rpc('increment_likes', { post: postId });
      if (rpcError) throw rpcError;

      const { data: updatedPost, error: updateError } = await supabaseAdmin
        .from('community_posts')
        .update({ likes_count: incrementResult })
        .eq('id', postId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({ ...updatedPost, liked: true });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
