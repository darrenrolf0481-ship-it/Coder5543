import React, { useState, useCallback, useEffect } from 'react';
import { StorageFile } from '../types';

export const useStorage = () => {
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8001/api/uploads/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter out models for TermuxTab if needed, or just show all in Storage
          setStorageFiles(data.map((f: any, i: number) => ({
            id: i,
            name: f.name,
            size: f.size,
            type: f.type,
            date: f.date
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
    const interval = setInterval(fetchUploads, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchUploads]);

  const handleStorageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('http://localhost:8001/api/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          console.log(`Uploaded ${file.name}`);
        }
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
    setIsUploading(false);
    fetchUploads();
  }, [fetchUploads]);

  return {
    storageFiles,
    setStorageFiles,
    handleStorageUpload,
    isUploading,
    refreshUploads: fetchUploads
  };
};
