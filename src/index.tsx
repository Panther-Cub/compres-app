import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import OverlayApp from './OverlayApp';
import SettingsWindow from './components/SettingsWindow';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(rootElement);

// Check which window this is based on URL hash
const isOverlay = window.location.hash === '#overlay';
const isSettings = window.location.hash === '#settings';

// Determine which component to render
let ComponentToRender;
if (isOverlay) {
  ComponentToRender = OverlayApp;
} else if (isSettings) {
  ComponentToRender = () => <SettingsWindow onClose={() => window.close()} />;
} else {
  ComponentToRender = App;
}

root.render(
  <React.StrictMode>
    <ComponentToRender />
  </React.StrictMode>
); 