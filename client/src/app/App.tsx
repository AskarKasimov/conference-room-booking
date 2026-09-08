import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './router';
import { RealtimeConnectionBanner } from './realtime';

export function App() {
  return (
    <AppProviders>
      {({ isDisconnected }) => (
        <BrowserRouter>
          <AppRoutes connectionBanner={<RealtimeConnectionBanner isVisible={isDisconnected} />} />
        </BrowserRouter>
      )}
    </AppProviders>
  );
}
