import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { VeriProvider } from './lib/veri'
import { SecimProvider } from './lib/secim'
import { TooltipProvider } from './components/ui/tooltip'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* VeriProvider: tarih aralığına göre tüm sahte veriyi üretir (tek kaynak).
            SecimProvider: numara bulucu — sadece geliştirme aşamasında. */}
        <VeriProvider>
          <SecimProvider>
            <TooltipProvider delayDuration={120}>
              <App />
            </TooltipProvider>
          </SecimProvider>
        </VeriProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
