import React, { createContext } from 'react';

interface FileSystemContextType {
  deleteItem: (id: string) => void;
}

export const FileSystemContext = createContext<FileSystemContextType>({
  deleteItem: () => {},
});
