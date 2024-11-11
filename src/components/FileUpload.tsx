import React, { useState } from 'react';
import { uploadFile } from '../firebase/storageFB';

interface FileUploadProps {
  onUploadComplete?: (url: string) => void;
  folder?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadComplete, 
  folder = 'uploads' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileName = `${folder}/${Date.now()}-${file.name}`;
      const downloadURL = await uploadFile(file, fileName);
      onUploadComplete?.(downloadURL);
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label 
        htmlFor="file-upload"
        className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </label>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default FileUpload; 