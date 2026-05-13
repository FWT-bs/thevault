import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseClientConfigured = Boolean(supabaseUrl && supabaseKey);

// Use AsyncStorage for native session persistence. On web, supabase-js falls
// back to localStorage automatically when storage is undefined.
const storage = Platform.OS === "web" ? undefined : AsyncStorage;

export const supabase = isSupabaseClientConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        // RN doesn't have URL-based session detection. The auth redirect from
        // OAuth is handled manually by exchanging the returned tokens with
        // signInWithIdToken / setSession.
        detectSessionInUrl: false,
      },
    })
  : null;
