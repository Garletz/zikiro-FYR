import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppLayout from './shared/components/layout/AppLayout'
import NotificationContainer from './shared/components/ui/NotificationContainer'
import { AppProvider } from './shared/contexts/AppContext'
import { ErrorProvider } from './shared/contexts/ErrorContext'
import { TabStateProvider } from './shared/contexts/TabStateManager'
import { UserSettingsProvider } from './shared/contexts/UserSettingsContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <TabStateProvider>
          <UserSettingsProvider>
            <AppProvider>
              <AppLayout />
              <NotificationContainer />
            </AppProvider>
          </UserSettingsProvider>
        </TabStateProvider>
      </ErrorProvider>
    </QueryClientProvider>
  )
}

export default App

