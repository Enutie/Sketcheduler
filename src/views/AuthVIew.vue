<script setup lang="ts">
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { AuthKey, type AuthContext } from '@/injectionKeys'; // Use the key and type

const router = useRouter();

// Inject the authentication methods and state
const auth = inject(AuthKey);
if (!auth) {
  throw new Error("Auth context not provided!"); // Should not happen if setup correctly
}

const email = ref('');
const password = ref('');
const isSigningUp = ref(false); // Toggle between Login and Sign Up modes
const componentError = ref<string | null>(null); // Local error display

const handleSubmit = async () => {
  componentError.value = null; // Clear previous local error
  auth.error.value = null; // Clear previous global auth error (optional)

  if (!email.value || !password.value) {
    componentError.value = "Email and password are required.";
    return;
  }

  let result;
  if (isSigningUp.value) {
    // Sign Up
    result = await auth.signUp({ email: email.value, password: password.value });
    if (result?.error) {
      componentError.value = `Sign Up failed: ${result.error.message}`;
    } else if (result?.user?.identities?.length === 0) {
        // This condition might indicate email confirmation is needed
         componentError.value = "Sign up successful! Please check your email to confirm your account.";
         // Optionally clear form or redirect differently
         email.value = '';
         password.value = '';
    } else {
       // Successful sign up and logged in (if email confirmation is off)
       router.push('/'); // Redirect to home or dashboard
    }
  } else {
    // Sign In
    result = await auth.signIn({ email: email.value, password: password.value });
    if (result?.error) {
      componentError.value = `Sign In failed: ${result.error.message}`;
    } else {
      // Successful sign in
      router.push('/'); // Redirect to home or dashboard
    }
  }
};
</script>

<template>
  <div>
    <h2>{{ isSigningUp ? 'Sign Up' : 'Login' }}</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email:</label>
        <input id="email" type="email" v-model="email" required :disabled="auth.loading.value" />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input id="password" type="password" v-model="password" required :disabled="auth.loading.value" />
      </div>

      <div v-if="componentError || auth.error.value" class="error-message">
        {{ componentError || auth.error.value?.message }}
      </div>
      <div v-if="auth.loading.value" class="loading-message">
        Processing...
      </div>

      <button type="submit" :disabled="auth.loading.value">
        {{ isSigningUp ? 'Sign Up' : 'Login' }}
      </button>
    </form>

    <p>
      {{ isSigningUp ? 'Already have an account?' : "Don't have an account?" }}
      <button @click="isSigningUp = !isSigningUp" :disabled="auth.loading.value" type="button">
        {{ isSigningUp ? 'Login' : 'Sign Up' }}
      </button>
    </p>
  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  margin-top: 10px;
  padding: 10px 15px;
  cursor: pointer;
}
button[type="submit"] {
    margin-right: 10px;
}
button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
}
p button {
    background: none;
    border: none;
    color: blue;
    text-decoration: underline;
    padding: 0;
    margin: 0;
}
.error-message {
  color: red;
  margin: 10px 0;
}
.loading-message {
    color: grey;
    margin: 10px 0;
}
</style>