import React, { createContext, useContext, useState } from 'react';

// This is a placeholder for the massive state object in index.tsx
export const AppStateContext = createContext<any>(null);

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
  // State will be migrated here incrementally
  const [state, setState] = useState({});
  return (
    <AppStateContext.Provider value={{ state, setState }}>
      {children}
    </AppStateContext.Provider>
  );
};
