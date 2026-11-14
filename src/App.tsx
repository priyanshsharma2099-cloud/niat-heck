import React from 'react';
import { StoreProvider } from './lib/storeContext';
import { AuthProvider } from './context/authContext';
import { AppShell } from './components/layout/AppShell';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  'your-google-client-id.apps.googleusercontent.com';

export function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
