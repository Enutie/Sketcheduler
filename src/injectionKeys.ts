// src/injectionKeys.ts
import type { InjectionKey, Ref, ComputedRef } from 'vue';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { useAuth } from '@/composables/useAuth'; // Import the return type

// Define the type for the provided auth object
// Match the structure returned by useAuth() and provided in App.vue
export interface AuthContext {
  user: Readonly<Ref<User | null>>;
  session: Readonly<Ref<Session | null>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<AuthError | null>>;
  isLoggedIn: ComputedRef<boolean>;
  isInitialized: Readonly<Ref<boolean>>;
  signUp: ReturnType<typeof useAuth>['signUp'];
  signIn: ReturnType<typeof useAuth>['signIn'];
  signOut: ReturnType<typeof useAuth>['signOut'];
}

// Create the InjectionKey
export const AuthKey: InjectionKey<AuthContext> = Symbol('Auth');