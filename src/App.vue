<script setup lang="ts">
import { provide, readonly } from 'vue';
import { RouterView } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { AuthKey } from '@/injectionKeys'; // We'll define this next

// Initialize the auth composable ONCE at the root
const auth = useAuth();
auth.setupAuth(); // Start the initialization and listener setup

// Provide the auth state and methods to descendant components
// Using readonly() where mutation isn't expected from consumers is good practice
provide(AuthKey, {
  user: auth.user,
  session: auth.session,
  loading: auth.loading,
  error: auth.error,
  isLoggedIn: auth.isLoggedIn,
  isInitialized: auth.isInitialized, // Provide initialization status
  signUp: auth.signUp,
  signIn: auth.signIn,
  signOut: auth.signOut,
});

</script>

<template>
  <!-- Optional: Global Header/Nav -->
  <header>
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link v-if="!auth.isLoggedIn.value" to="/login">Login</router-link>
      <span v-if="auth.isLoggedIn.value">
         | Logged in as: {{ auth.user.value?.email }} |
        <router-link to="/create-lesson">Create Lesson</router-link> |
        <button @click="auth.signOut" :disabled="auth.loading.value">Logout</button>
      </span>
       <span v-else-if="!auth.isInitialized.value"> | Loading Auth...</span>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
/* Add some basic styling */
header {
  background-color: #f0f0f0;
  padding: 10px;
  margin-bottom: 20px;
}
nav a, nav span {
  margin-right: 10px;
}
nav button {
    margin-left: 10px;
    cursor: pointer;
}
nav button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}
main {
    padding: 10px;
}
</style>