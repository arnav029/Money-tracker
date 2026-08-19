import { createClient } from '@supabase/supabase-js'
import { auth, isFirebaseConfigured } from './firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once the app has real project credentials — cloud sign-in/sync only activates then. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && isFirebaseConfigured)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      accessToken: async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null)
    })
  : null
