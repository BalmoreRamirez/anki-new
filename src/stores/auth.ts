import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { auth } from "../config/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";

export const useAuthStore = defineStore("auth", () => {
  // Estado
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userEmail = computed(() => user.value?.email);

  // Acciones
  async function signInWithGoogle() {
    loading.value = true;
    error.value = null;
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      user.value = result.user;
      console.log('✅ Google sign-in successful:', result.user.email);
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Google sign-in error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function signInWithEmail(email: string, password: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      user.value = result.user;
      console.log('✅ Email sign-in successful:', result.user.email);
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Email sign-in error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function signUpWithEmail(email: string, password: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      user.value = result.user;
      console.log('✅ Email sign-up successful:', result.user.email);
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Email sign-up error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    error.value = null;
    
    try {
      await firebaseSignOut(auth);
      user.value = null;
      console.log('✅ Sign-out successful');
    } catch (err: any) {
      error.value = err.message;
      console.error('❌ Sign-out error:', err);
    } finally {
      loading.value = false;
    }
  }

  function initAuthListener() {
    return onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser;
      if (firebaseUser) {
        console.log('🔐 User authenticated:', firebaseUser.email);
      } else {
        console.log('🔓 User signed out');
      }
    });
  }

  function clearError() {
    error.value = null;
  }

  return {
    // Estado
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    userEmail,
    // Acciones
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    initAuthListener,
    clearError
  };
});
