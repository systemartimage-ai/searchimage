import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@/domains/pwa/installEvent'
import { registerServiceWorker } from '@/domains/pwa/registerServiceWorker'
import { requestPersistentStorage } from '@/domains/pwa/persistStorage'

registerServiceWorker()
void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
