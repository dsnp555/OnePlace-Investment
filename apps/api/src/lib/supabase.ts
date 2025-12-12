/**
 * Supabase Client Configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Public client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create authenticated Supabase client for user requests
 * @param accessToken - JWT from Supabase auth
 */
export function createAuthClient(accessToken: string): SupabaseClient {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

/**
 * Database types (matching Supabase schema)
 */
export interface Profile {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    dob: string | null;
    income_monthly: number | null;
    expenses_monthly: number | null;
    existing_investments: number | null;
    risk_profile: 'conservative' | 'balanced' | 'aggressive' | null;
    risk_score: number | null;
    currency: string;
    created_at: string;
    updated_at: string;
}

export interface Strategy {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    mode: 'lumpsum' | 'sip' | 'goal' | 'withdrawal';
    amount: number;
    currency: string;
    duration_years: number;
    compounding: 'daily' | 'monthly' | 'quarterly' | 'annually';
    normalize_mode: boolean;
    inflation_rate: number;
    is_template: boolean;
    is_public: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Allocation {
    id: string;
    strategy_id: string;
    category: string;
    percent: number;
    percent_normalized: number | null;
    amount: number | null;
    expected_annual_return: number;
    created_at: string;
}

export interface Projection {
    id: string;
    strategy_id: string;
    snapshot: object;
    aggregate_fv: number | null;
    aggregate_cagr: number | null;
    generated_at: string;
}

export interface MarketCache {
    id: string;
    symbol: string;
    name: string;
    category: string | null;
    price: number | null;
    change_percent: number | null;
    extra_data: object;
    fetched_at: string;
}
