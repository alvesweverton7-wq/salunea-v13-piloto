import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AuthTenantProvider } from './auth/AuthTenantProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AuthTenantProvider><App /></AuthTenantProvider></React.StrictMode>,
);
