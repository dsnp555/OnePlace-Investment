'use client';

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// In production, these should come from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcvhwtahxssbwpxmbqts.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjdmh3dGFoeHNzYndweG1icXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjIyOTksImV4cCI6MjA4MTA5ODI5OX0.zfrGDWUs0jM_NdeuB1f5DFEwKMJ3bvNsJxh97AdB1rY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    });

    return { data, error };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    return { data, error };
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
    });

    return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

/**
 * Get session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
}
