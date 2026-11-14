import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/authContext';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  label?: string;
  onSuccess?: () => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Continue with Google',
  onSuccess,
  className = '',
}) => {
  const { loginWithGoogle, isLoading } = useAuth();
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasRealGsiLoaded, setHasRealGsiLoaded] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isRealClientConfigured = Boolean(
    clientId &&
    !clientId.includes('your-google-client-id') &&
    clientId.endsWith('.apps.googleusercontent.com')
  );

  useEffect(() => {
    // If real Google Client ID is configured and window.google is available
    if (typeof window !== 'undefined' && (window as any).google && isRealClientConfigured) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response && response.credential) {
              const ok = await loginWithGoogle(response.credential);
              if (ok && onSuccess) onSuccess();
            }
          },
        });

        if (googleButtonContainerRef.current) {
          (window as any).google.accounts.id.renderButton(
            googleButtonContainerRef.current,
            {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'continue_with',
              width: '100%',
              logo_alignment: 'left',
            }
          );
          setHasRealGsiLoaded(true);
        }
      } catch (err) {
        console.warn('Google GSI initialization notice:', err);
      }
    }
  }, [clientId, isRealClientConfigured]);

  // Click handler for custom button or local testing
  const handleCustomClick = async () => {
    if (isLoading) return;

    if (isRealClientConfigured && (window as any).google) {
      // Trigger Google One Tap / prompt
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google Prompt error:', err);
      }
    }

    // Interactive simulated demo credential for testing and verification
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: 'google-usr-' + Math.floor(Math.random() * 9000 + 1000),
        email: 'alex.merchant@feedbackhub.io',
        name: 'Alex Merchant',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        email_verified: true,
      })
    );
    const signature = 'demo_signature';
    const mockGoogleJwt = `${header}.${payload}.${signature}`;

    const ok = await loginWithGoogle(mockGoogleJwt);
    if (ok && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      {/* Official GSI rendered target container when client configured */}
      <div
        ref={googleButtonContainerRef}
        className={hasRealGsiLoaded ? 'w-full flex justify-center' : 'hidden'}
      />

      {/* Styled Native Button */}
      {!hasRealGsiLoaded && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/80 active:bg-slate-100 shadow-xs transition-all text-xs font-semibold text-slate-700 disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.87c2.26-2.09 3.67-5.17 3.67-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.26 21.3 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.38l4-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.27 6.62l4 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
          )}
          <span>{isLoading ? 'Verifying with Google...' : label}</span>
        </button>
      )}
    </div>
  );
};
