import { createClient } from '@supabase/supabase-js';
import { storageAdapter } from '../storage/storage.adapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter, // ¡Magia! Funciona en Web y App
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});