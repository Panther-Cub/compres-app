import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import OverlayApp from './OverlayApp';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(rootElement);

// Check if this is the overlay window based on URL hash
const isOverlay = window.location.hash === '#overlay';

root.render(
  <React.StrictMode>
    {isOverlay ? <OverlayApp /> : <App />}
  </React.StrictMode>
); 