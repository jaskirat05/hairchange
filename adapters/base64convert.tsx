export const convertToBase64 = async (file: File | string): Promise<string> => {
    // Check if the string has a MIME type and strip it off
    if (typeof file === 'string') {
        if (file.startsWith('data:image/')) {
            // Remove the MIME type part (data:image/...;base64,)
            return file.replace(/^data:image\/\w+;base64,/, '');
        } else {
            // It's already in the expected base64 format without MIME
            return file;
        }
    }
  
    // Convert the file to base64 string if it's a File
    return new Promise((resolve, reject) => {
      if (file instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // Remove the data URL prefix (data:image/...;base64,)
          const base64String = (reader.result as string).replace(/^data:image\/\w+;base64,/, '');
          resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
      } else {
        reject('Invalid file type');
      }
    });
};
