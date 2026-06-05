import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

// No StrictMode: the sandboxes drive intervals/animations off refs, and
// dev-only double-invocation of effects would double-fire those timers.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
