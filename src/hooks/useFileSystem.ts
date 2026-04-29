import { useContext } from 'react';
import { FileSystemContext } from '../context/FileSystemContext';

export function useFileSystem() {
  return useContext(FileSystemContext);
}
