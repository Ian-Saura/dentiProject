import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppMode = 'analytical' | 'operational';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load mode from localStorage or default to operational
  const [mode, setModeState] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem('appMode');
    return (savedMode === 'analytical' || savedMode === 'operational') ? savedMode : 'operational';
  });

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('appMode', mode);
  }, [mode]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'analytical' ? 'operational' : 'analytical');
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};









