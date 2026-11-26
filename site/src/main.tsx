import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { storageManager } from '@utils/storageManager';
import '@/index.css';
import App from '@/App';

const SESSION_KEY = 'wrapped-session-active';

// Clear the cache when the tab has no session flag.
// sessionStorage lasts for the life of the tab, so this happens once per new tab.
// It runs before the first render, so no component loads the old cache first.
try {
  if (!sessionStorage.getItem(SESSION_KEY)) {
    storageManager.clear();
    sessionStorage.setItem(SESSION_KEY, 'true');
  }
} catch {
  // sessionStorage is not available. Keep the cache.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
