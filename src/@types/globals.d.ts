declare global {
  interface TextSession {
    prompt: (prompt: string) => Promise<string>;
    promptStreaming: (prompt: string) => Promise<string>;
    destroy: () => void;
  }

  interface Window {
    ai: {
      createTextSession: () => Promise<TextSession>; 
      canCreateTextSession: () => Promise<string>;
    }
  }
}

export {};