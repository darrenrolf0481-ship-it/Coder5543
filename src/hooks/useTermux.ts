import React, { useState, useCallback, useEffect } from 'react';
import { Vitals } from '../types';

export const useTermux = () => {
  const [termuxStatus, setTermuxStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [vitals, setVitals] = useState<Vitals & { nucleoid?: boolean }>({ mem_load: 0, thermals: 0, battery: 0, nucleoid: false });
  const [sensorData, setSensorData] = useState<any>(null);
  const [termuxFiles, setTermuxFiles] = useState<{ name: string, size: string, category: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchVitals = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8001/api/vitals');
      if (res.ok) {
        const data = await res.json();
        setVitals(data);
        setTermuxStatus('connected');
      }
    } catch (err) {
      setTermuxStatus('disconnected');
    }
  }, []);

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8001/api/uploads/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // In Termux tab, we might want to filter for specific extensions like .gguf or .bin
          setTermuxFiles(data.map((f: any) => ({
            name: f.name,
            size: f.size,
            category: (f.name.endsWith('.gguf') || f.name.endsWith('.bin')) ? 'model' : 'file'
          })));
        }
      }
    } catch (err) {}
  }, []);

  const fetchSensors = useCallback(async () => {
    if (termuxStatus !== 'connected') return;
    try {
      const res = await fetch('http://localhost:8001/api/sensors');
      if (res.ok) {
        const data = await res.json();
        setSensorData(data);
      }
    } catch (err) {}
  }, [termuxStatus]);

  useEffect(() => {
    fetchVitals();
    fetchUploads();
    const interval = setInterval(() => {
      fetchVitals();
      fetchSensors();
      fetchUploads();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchVitals, fetchSensors, fetchUploads]);

  const handleTermuxFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    termuxStatus,
    setTermuxStatus,
    vitals,
    sensorData,
    termuxFiles,
    setTermuxFiles,
    handleTermuxFileUpload,
    isUploading
  };
};
