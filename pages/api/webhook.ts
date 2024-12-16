import type { NextApiRequest, NextApiResponse } from 'next';
//import cloudinary from 'cloudinary';
import { supabaseAdmin } from '../../lib/supabase';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb' // Increase the size limit
        }
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { id, status, output } = req.body;
        console.log('Webhook received:', { id, status }); // Add logging

        if (status === 'COMPLETED' && output?.message) {
            //console.log('Output message:', output.message);
           

            // Update job in Supabase
            const { error: updateError } = await supabaseAdmin
                .from('runpod_jobs')
                .update({ 
                    status: status,
                    output_url: output.message
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating job:', updateError);
                return res.status(500).json({ error: 'Failed to update job status' });
            }
        } else {
            // Update status only
            const { error: updateError } = await supabaseAdmin
                .from('runpod_jobs')
                .update({ status: status })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating job:', updateError);
                return res.status(500).json({ error: 'Failed to update job status' });
            }
        }

        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Internal server error processing webhook'
        });
    }
}