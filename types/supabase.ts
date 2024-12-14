export type RunPodJob = {
    id: string;
    created_at: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    user_id: string;
    output_url?: string;
    input_image_url?: string;
}

export type Image = {
    id: string;
    created_at: string;
    user_id: string;
    cloudinary_url: string;
    runpod_job_id?: string;
    image_type: 'input' | 'output';
}