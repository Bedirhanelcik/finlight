/**
 * Hand-written mirror of supabase/migrations/0001_init.sql. If the schema
 * changes, update both files together. (Normally generated via
 * `supabase gen types typescript`, kept here so the client has full type
 * safety without requiring a live project during development.)
 */
export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          currency: string;
          theme: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          currency?: string;
          theme?: string;
          onboarding_completed?: boolean;
        };
        Update: {
          currency?: string;
          theme?: string;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount: number;
          date: string;
          category_id: string;
          description: string;
          merchant: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount: number;
          date: string;
          category_id: string;
          description: string;
          merchant?: string | null;
          notes?: string | null;
        };
        Update: {
          type?: string;
          amount?: number;
          date?: string;
          category_id?: string;
          description?: string;
          merchant?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          period: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          amount: number;
          period?: string;
        };
        Update: {
          category_id?: string;
          amount?: number;
          period?: string;
        };
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          merchant: string;
          amount: number;
          frequency: string;
          category_id: string;
          start_date: string;
          next_date: string;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant: string;
          amount: number;
          frequency: string;
          category_id: string;
          start_date: string;
          next_date: string;
          notes?: string | null;
          active?: boolean;
        };
        Update: {
          merchant?: string;
          amount?: number;
          frequency?: string;
          category_id?: string;
          start_date?: string;
          next_date?: string;
          notes?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
