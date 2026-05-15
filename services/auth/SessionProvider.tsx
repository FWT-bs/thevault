import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  activateDevMegaSession as persistDevMega,
  DEV_MEGA_API_USER_ID,
  hydrateDevMegaFromStorage,
  isDevMegaActive,
  subscribeDevMega,
} from "./devMega";

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: { has_onboarded?: boolean } & Record<string, unknown>;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  user: SessionUser;
};

const DEV_MEGA_SESSION: Session = {
  access_token: "__dev_mega__",
  refresh_token: "__dev_mega__",
  token_type: "bearer",
  expires_in: 60 * 60 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  user: {
    id: DEV_MEGA_API_USER_ID,
    email: "dev-mega@localhost",
    phone: "+10000000000",
    user_metadata: { has_onboarded: true },
  },
};

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  isReady: boolean;
  isAuthConfigured: boolean;
  hasOnboarded: boolean;
  /** __DEV__ only: bypass OTP for mega phone + code 000000 */
  activateDevMega: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  isLoading: true,
  isReady: false,
  isAuthConfigured: false,
  hasOnboarded: false,
  activateDevMega: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [mega, setMega] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const activateDevMega = useCallback(async () => {
    if (typeof __DEV__ === "undefined" || !__DEV__) return;
    await persistDevMega();
    setMega(isDevMegaActive());
  }, []);

  useEffect(() => {
    if (typeof __DEV__ === "undefined" || !__DEV__) return undefined;
    return subscribeDevMega(() => setMega(isDevMegaActive()));
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        await hydrateDevMegaFromStorage();
        if (mounted) setMega(isDevMegaActive());
      }
      if (mounted) setIsLoading(false);
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const session = typeof __DEV__ !== "undefined" && __DEV__ && mega ? DEV_MEGA_SESSION : null;

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isLoading,
      isReady: !isLoading,
      // Auth backend is gone; surface false so screens can branch on it.
      isAuthConfigured: false,
      hasOnboarded: Boolean(session?.user?.user_metadata?.has_onboarded),
      activateDevMega,
    }),
    [session, isLoading, activateDevMega],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
