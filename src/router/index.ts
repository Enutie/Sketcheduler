// src/router/index.ts
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import AuthView from '../views/AuthView.vue'; // Import the new Auth view
import LessonCreator from '../components/LessonCreator.vue'; // Your component that needs auth
import { AuthKey } from '@/injectionKeys'; // Import the key

// --- Helper to check auth status AFTER initialization ---
// We need this because the initial session check is async
const checkAuthStatus = async (authContext: any): Promise<boolean> => {
    // If already initialized, return current status
    if (authContext.isInitialized.value) {
        return authContext.isLoggedIn.value;
    }
    // If not initialized, wait for it
    return new Promise((resolve) => {
        const stopWatch = watch(authContext.isInitialized, (newValue) => {
            if (newValue) {
                stopWatch(); // Stop watching once initialized
                resolve(authContext.isLoggedIn.value);
            }
        }, { immediate: false }); // Don't run immediately, wait for change
    });
};


const router = createRouter({
  // Use Hash history for GitHub Pages compatibility if not using custom domain routing properly
  // history: createWebHashHistory(import.meta.env.BASE_URL),
  // Use Web history for cleaner URLs if server is configured or using custom domain
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login', // Route for your login/signup view
      name: 'login',
      component: AuthView,
      meta: { requiresGuest: true } // Prevent logged-in users from seeing login page
    },
    {
      path: '/create-lesson', // Your protected route
      name: 'create-lesson',
      component: LessonCreator,
      meta: { requiresAuth: true }, // Mark this route as requiring authentication
    },
    // Add other routes here
  ],
});

// --- Navigation Guard ---
router.beforeEach(async (to, from, next) => {
  // Inject auth state within the guard - needs app context, tricky!
  // It's often easier to get the state directly from the composable IF it's truly singleton.
  // Let's try importing directly (assuming singleton nature holds due to App.vue setup)
  const { isLoggedIn, isInitialized } = useAuth(); // Get reactive refs

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  // --- Wait for Auth Initialization ---
  // This is crucial. Don't make decisions until the initial session check is done.
  if (!isInitialized.value) {
    await new Promise<void>((resolve) => {
        const stopWatch = watch(isInitialized, (newValue) => {
            if (newValue) {
                stopWatch();
                resolve();
            }
        }, { immediate: false });
    });
  }

  const isAuthenticated = isLoggedIn.value; // Check status AFTER initialization

  console.log(`Nav Guard: To=${to.path}, RequiresAuth=${requiresAuth}, RequiresGuest=${requiresGuest}, IsAuthenticated=${isAuthenticated}, IsInitialized=${isInitialized.value}`);


  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if authentication is required but user is not logged in
    console.log('Redirecting to login...');
    next({ name: 'login', query: { redirect: to.fullPath } }); // Optional: pass redirect query
  } else if (requiresGuest && isAuthenticated) {
     // Redirect to home if guest access is required but user IS logged in
    console.log('Redirecting to home (already logged in)...');
    next({ name: 'home' });
  } else {
    // Allow navigation
    console.log('Allowing navigation.');
    next();
  }
});

export default router;