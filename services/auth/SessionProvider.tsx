import type { Session } from "@supabase/supabase-js";
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
import { isSupabaseClientConfigured, supabase } from "../supabase/client";

const DEV_MEGA_SESSION = {
  access_token: "__dev_mega__",
  refresh_token: "__dev_mega__",
  expires_in: 60 * 60 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  token_type: "bearer",
  user: {
    id: DEV_MEGA_API_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "dev-mega@localhost",
    phone: "+10000000000",
    app_metadata: {},
    user_metadata: { has_onboarded: true },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
} as unknown as Session;

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
  const [supaSession, setSupaSession] = useState<Session | null>(null);
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
      const tasks: Promise<unknown>[] = [];

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        tasks.push(
          hydrateDevMegaFromStorage().then(() => {
            if (mounted) setMega(isDevMegaActive());
          }),
        );
      }

      if (supabase) {
        tasks.push(
          supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSupaSession(data.session ?? null);
          }),
        );
      }

      await Promise.all(tasks);
      if (mounted) setIsLoading(false);
    };

    void run();

    if (!supabase) {
      return () => {
        mounted = false;
      };
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSupaSession(next ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const session = typeof __DEV__ !== "undefined" && __DEV__ && mega ? DEV_MEGA_SESSION : supaSession;

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isLoading,
      isReady: !isLoading,
      isAuthConfigured: isSupabaseClientConfigured,
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
