import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

type AuthErrorType = 'auth_required' | 'user_not_registered' | 'unknown' | string;

type AuthError = {
  type: AuthErrorType;
  message: string;
};

type CurrentUser = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
};

type AppPublicSettings = {
  id?: string;
  public_settings?: Record<string, unknown>;
  [key: string]: unknown;
} | null;

type AuthContextValue = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthError | null;
  appPublicSettings: AppPublicSettings;
  logout: (shouldRedirect?: boolean) => void;
  navigateToLogin: () => void;
  checkAppState: () => Promise<void>;
};

type FetchError = Error & {
  status?: number;
  data?: { extra_data?: { reason?: string } } & Record<string, unknown>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const fetchAppPublicSettings = async (): Promise<AppPublicSettings> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (appParams.appId) headers['X-App-Id'] = appParams.appId as string;
  if (appParams.token) headers['Authorization'] = `Bearer ${appParams.token}`;

  const response = await fetch(
    `/api/apps/public/prod/public-settings/by-id/${appParams.appId}`,
    { headers },
  );

  if (!response.ok) {
    let data: FetchError['data'];
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    const error: FetchError = new Error(`Public settings fetch failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return (await response.json()) as AppPublicSettings;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [appPublicSettings, setAppPublicSettings] = useState<AppPublicSettings>(null);

  useEffect(() => {
    checkAppState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAppState = async (): Promise<void> => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      try {
        const publicSettings = await fetchAppPublicSettings();
        setAppPublicSettings(publicSettings);

        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (rawError) {
        const appError = rawError as FetchError;
        console.error('App state check failed:', appError);

        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app',
            });
          } else {
            setAuthError({ type: reason, message: appError.message });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app',
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (rawError) {
      const error = rawError as Error;
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred',
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async (): Promise<void> => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (rawError) {
      const error = rawError as FetchError;
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    }
  };

  const logout = (shouldRedirect = true): void => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = (): void => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
