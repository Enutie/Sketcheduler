// src/composables/useAuth.ts
import { ref, computed, onMounted, readonly } from 'vue';
import { supabase } from '@/services/supabaseClient'; // Your Supabase client instance
import type { AuthError, Session, User } from '@supabase/supabase-js';

// --- State ---
// Use ref for reactive state that can be shared
const user = ref<User | null>(null);
const session = ref<Session | null>(null);
const loading = ref<boolean>(false); // Loading state for auth operations
const error = ref<AuthError | null>(null); // Store potential auth errors
const isInitialized = ref<boolean>(false); // Track if initial session check is done

// --- Computed Properties ---
const isLoggedIn = computed<boolean>(() => !!user.value);

// --- Core Auth Logic ---

// Function to handle sign-up
const signUp = async (credentials: { email?: string, password?: string, options?: any }) => {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: signUpError } = await supabase.auth.signUp(credentials);
    if (signUpError) throw signUpError;
    // Session might be null if email confirmation is required
    session.value = data.session;
    user.value = data.user;
    // Important: Check Supabase settings (Authentication -> Settings)
    // If "Confirm email" is ON, user needs to verify before logging in fully.
    // You might want to return data.user here to inform the UI about confirmation status.
    return { user: data.user, session: data.session };
  } catch (err: any) {
    console.error('Sign Up Error:', err);
    error.value = err as AuthError;
    return { error: err };
  } finally {
    loading.value = false;
  }
};

// Function to handle sign-in
const signIn = async (credentials: { email?: string, password?: string }) => {
  loading.value = true;
  error.value = null;
  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
    if (signInError) throw signInError;
    session.value = data.session;
    user.value = data.user;
    return { user: data.user, session: data.session };
  } catch (err: any) {
    console.error('Sign In Error:', err);
    error.value = err as AuthError;
     return { error: err };
  } finally {
    loading.value = false;
  }
};

// Function to handle sign-out
const signOut = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    // State will be cleared by onAuthStateChange listener below
  } catch (err: any) {
    console.error('Sign Out Error:', err);
    error.value = err as AuthError;
  } finally {
    // Ensure loading is reset even if listener clears state first
    loading.value = false;
  }
};

// --- Initialization and Listener ---

// Function to fetch the initial session
const initializeAuth = async () => {
  try {
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    session.value = currentSession;
    user.value = currentSession?.user ?? null;
  } catch (err: any) {
     console.error('Error fetching initial session:', err);
     // Handle potential errors during initial session fetch if necessary
     session.value = null;
     user.value = null;
  } finally {
    isInitialized.value = true; // Mark initialization as complete
  }
};

// Set up the listener ONCE. The composable pattern helps ensure this.
supabase.auth.onAuthStateChange((event, newSession) => {
  console.log('Supabase Auth Event:', event, newSession);
  session.value = newSession;
  user.value = newSession?.user ?? null;
  loading.value = false; // Reset loading on auth change events
});

// --- Exported Function ---

// This function will be called ONCE in App.vue to start everything
let isAuthSetup = false;
const setupAuth = () => {
    if (isAuthSetup) return; // Prevent multiple initializations
    isAuthSetup = true;
    initializeAuth(); // Fetch initial session when setup is called
}

// Export the state and methods
// Use readonly for state refs where appropriate if mutation should only happen via methods
export function useAuth() {
  return {
    // State (Readonly recommended for external use)
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    error: readonly(error),
    isLoggedIn,
    isInitialized: readonly(isInitialized), // Expose initialization status

    // Methods
    signUp,
    signIn,
    signOut,
    setupAuth, // Expose setup function
  };
}