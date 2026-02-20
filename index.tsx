
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global variable to store the install prompt event
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Notify the app that it can show the install button
  window.dispatchEvent(new CustomEvent('can-install'));
});

// Helper to trigger install
(window as any).triggerInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    deferredPrompt = null;
  }
};

// Suppress "The user aborted a request" errors globally
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || 
      event.reason?.message?.includes('aborted') || 
      event.reason?.code === 'cancelled') {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (event.error?.name === 'AbortError' || 
      event.error?.message?.includes('aborted') || 
      event.error?.code === 'cancelled') {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
