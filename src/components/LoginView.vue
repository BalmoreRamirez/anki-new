<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-graduation-cap text-3xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold text-white mb-2">English Learning</h1>
        <p class="text-white/80">Master English with spaced repetition</p>
      </div>

      <!-- Login Card -->
      <Card class="glassmorphism">
        <template #content>
          <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-800 text-center mb-6">Welcome Back</h2>
            
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-8">
              <ProgressSpinner size="50" strokeWidth="4" />
              <p class="text-gray-600 mt-4">Signing you in...</p>
            </div>
            
            <!-- Error Message -->
            <Message 
              v-if="error" 
              severity="error" 
              :closable="false"
              class="mb-4"
            >
              {{ error }}
            </Message>
            
            <!-- Login Options -->
            <div v-if="!isLoading" class="space-y-4">
              <!-- Google Sign In -->
              <Button 
                @click="signInWithGoogle"
                icon="pi pi-google"
                label="Continue with Google"
                class="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                :disabled="isLoading"
              />
              
              <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <!-- Email/Password Form -->
              <form @submit.prevent="signInWithEmail" class="space-y-4">
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <InputText
                    id="email"
                    v-model="loginForm.email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    class="w-full"
                    :disabled="isLoading"
                  />
                </div>
                
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Password
                    id="password"
                    v-model="loginForm.password"
                    placeholder="Enter your password"
                    required
                    class="w-full"
                    :disabled="isLoading"
                    :feedback="false"
                    toggleMask
                  />
                </div>

                <Button 
                  type="submit"
                  label="Sign In"
                  icon="pi pi-sign-in"
                  class="w-full bg-blue-500 hover:bg-blue-600 border-blue-500 text-white py-3 px-4 rounded-lg transition-all duration-200"
                  :disabled="isLoading || !loginForm.email || !loginForm.password"
                />
              </form>

              <div class="text-center mt-6">
                <p class="text-sm text-gray-600">
                  Don't have an account? 
                  <button 
                    @click="toggleMode"
                    class="text-blue-600 hover:text-blue-700 font-medium"
                    type="button"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Sign Up Form (Toggle) -->
      <Card v-if="showSignUp" class="glassmorphism mt-4">
        <template #content>
          <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-800 text-center mb-6">Create Account</h2>
            
            <form @submit.prevent="signUpWithEmail" class="space-y-4">
              <div>
                <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <InputText
                  id="signup-email"
                  v-model="signupForm.email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  class="w-full"
                  :disabled="isLoading"
                />
              </div>
              
              <div>
                <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Password
                  id="signup-password"
                  v-model="signupForm.password"
                  placeholder="Create a password"
                  required
                  class="w-full"
                  :disabled="isLoading"
                  :feedback="true"
                  toggleMask
                />
              </div>

              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Password
                  id="confirm-password"
                  v-model="signupForm.confirmPassword"
                  placeholder="Confirm your password"
                  required
                  class="w-full"
                  :disabled="isLoading"
                  :feedback="false"
                  toggleMask
                />
              </div>

              <Button 
                type="submit"
                label="Create Account"
                icon="pi pi-user-plus"
                class="w-full bg-green-500 hover:bg-green-600 border-green-500 text-white py-3 px-4 rounded-lg transition-all duration-200"
                :disabled="isLoading || !signupForm.email || !signupForm.password || signupForm.password !== signupForm.confirmPassword"
              />
            </form>

            <div class="text-center mt-6">
              <p class="text-sm text-gray-600">
                Already have an account? 
                <button 
                  @click="toggleMode"
                  class="text-blue-600 hover:text-blue-700 font-medium"
                  type="button"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-white/60 text-sm">
          Secure authentication powered by Firebase
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth'
import type { UserCredential } from 'firebase/auth'
import { auth } from '../config/firebase'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

// Emits
const emit = defineEmits<{
  'login-success': [user: any]
}>()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSignUp = ref(false)

// Check for redirect result on component mount
onMounted(async () => {
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      console.log('✅ Google sign-in successful via redirect:', result.user.email)
      emit('login-success', result.user)
    }
  } catch (err: any) {
    console.error('❌ Error processing redirect result:', err)
    if (err.code === 'auth/unauthorized-domain') {
      error.value = 'Error de configuración: Este dominio no está autorizado. Verifica la configuración de Firebase.'
    } else if (err.message && err.message.includes('redirect_uri_mismatch')) {
      error.value = 'Error de configuración: URL no autorizada. Consulta FIREBASE_SETUP_INSTRUCTIONS.md para solucionarlo.'
    } else {
      error.value = 'Error al procesar el inicio de sesión. Intenta de nuevo.'
    }
  }
})

// Forms
const loginForm = reactive({
  email: '',
  password: ''
})

const signupForm = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

// Methods
function toggleMode() {
  showSignUp.value = !showSignUp.value
  error.value = null
  
  // Reset forms
  loginForm.email = ''
  loginForm.password = ''
  signupForm.email = ''
  signupForm.password = ''
  signupForm.confirmPassword = ''
}

async function signInWithGoogle() {
  try {
    isLoading.value = true
    error.value = null
    
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    try {
      // First try popup method
      const result: UserCredential = await signInWithPopup(auth, provider)
      console.log('✅ Google sign-in successful via popup:', result.user.email)
      emit('login-success', result.user)
    } catch (popupError: any) {
      console.warn('⚠️ Popup failed, trying redirect:', popupError.code)
      
      // If popup fails due to Cross-Origin-Opener-Policy or popup blocking, use redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.message.includes('Cross-Origin-Opener-Policy')) {
        
        console.log('🔄 Using redirect method instead...')
        await signInWithRedirect(auth, provider)
        // The result will be handled in onMounted via getRedirectResult
        return
      } else {
        // Re-throw other errors to be handled by outer catch
        throw popupError
      }
    }
    
  } catch (err: any) {
    console.error('❌ Google sign-in error:', err)
    
    if (err.code === 'auth/popup-closed-by-user') {
      error.value = 'Inicio de sesión cancelado'
    } else if (err.code === 'auth/popup-blocked') {
      error.value = 'Las ventanas emergentes están bloqueadas. Redirigiendo...'
    } else if (err.code === 'auth/unauthorized-domain') {
      error.value = 'Error de configuración: Este dominio no está autorizado. Verifica la configuración de Firebase.'
    } else if (err.code === 'auth/cancelled-popup-request') {
      error.value = 'Solo se puede abrir una ventana de Google a la vez.'
    } else if (err.message && err.message.includes('redirect_uri_mismatch')) {
      error.value = 'Error de configuración: URL no autorizada. Consulta FIREBASE_SETUP_INSTRUCTIONS.md para solucionarlo.'
    } else if (err.message && err.message.includes('400')) {
      error.value = 'Error de configuración de Google OAuth. Verifica que localhost:5173 esté autorizado en Firebase Console.'
    } else {
      error.value = `Error al iniciar sesión con Google: ${err.message || 'Intenta de nuevo.'}`
    }
  } finally {
    isLoading.value = false
  }
}

async function signInWithEmail() {
  try {
    isLoading.value = true
    error.value = null
    
    const result: UserCredential = await signInWithEmailAndPassword(
      auth, 
      loginForm.email, 
      loginForm.password
    )
    
    console.log('✅ Email sign-in successful:', result.user.email)
    emit('login-success', result.user)
    
  } catch (err: any) {
    console.error('❌ Email sign-in error:', err)
    
    switch (err.code) {
      case 'auth/user-not-found':
        error.value = 'No account found with this email address.'
        break
      case 'auth/wrong-password':
        error.value = 'Incorrect password.'
        break
      case 'auth/invalid-email':
        error.value = 'Invalid email address.'
        break
      case 'auth/too-many-requests':
        error.value = 'Too many failed attempts. Please try again later.'
        break
      default:
        error.value = 'Failed to sign in. Please check your credentials.'
    }
  } finally {
    isLoading.value = false
  }
}

async function signUpWithEmail() {
  try {
    if (signupForm.password !== signupForm.confirmPassword) {
      error.value = 'Passwords do not match.'
      return
    }

    if (signupForm.password.length < 6) {
      error.value = 'Password must be at least 6 characters long.'
      return
    }

    isLoading.value = true
    error.value = null
    
    const result: UserCredential = await createUserWithEmailAndPassword(
      auth, 
      signupForm.email, 
      signupForm.password
    )
    
    console.log('✅ Email sign-up successful:', result.user.email)
    emit('login-success', result.user)
    
  } catch (err: any) {
    console.error('❌ Email sign-up error:', err)
    
    switch (err.code) {
      case 'auth/email-already-in-use':
        error.value = 'An account with this email already exists.'
        break
      case 'auth/invalid-email':
        error.value = 'Invalid email address.'
        break
      case 'auth/weak-password':
        error.value = 'Password is too weak. Please use at least 6 characters.'
        break
      default:
        error.value = 'Failed to create account. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.glassmorphism {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* Estilos para el botón de Google */
:deep(.p-button .pi-google) {
  color: #4285f4;
}

/* Estilos para Password component */
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password input) {
  width: 100%;
}
</style>
