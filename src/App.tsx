import { RouterProvider } from 'react-router-dom'
import { InstallPrompt } from '@/components/InstallPrompt'
import { router } from './routes/router'
import { AuthProvider } from '@/domains/auth/AuthContext'
import { SearchSessionProvider } from '@/domains/search/SearchSessionProvider'
import { BulkUploadProvider } from '@/domains/admin/bulkUpload/BulkUploadProvider'

function App() {
  return (
    <AuthProvider>
      <SearchSessionProvider>
        <BulkUploadProvider>
          <InstallPrompt />
          <RouterProvider router={router} />
        </BulkUploadProvider>
      </SearchSessionProvider>
    </AuthProvider>
  )
}

export default App
