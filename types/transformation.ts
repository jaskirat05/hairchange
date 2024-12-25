export type TransformationStatus = 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'CANCELLED';

export interface UserTransformation {
  id: string;
  user_id: string;
  input_image_url: string;
  output_url: string | null;
  status: TransformationStatus;
  created_at: string;
  updated_at: string;
  error?: string;
  metadata?: {
    [key: string]: any;
  };
}
