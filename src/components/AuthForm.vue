<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-graduation-cap text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">English Learning</h1>
        <p class="text-white/80">Master English with spaced repetition</p>
      </div>

      <!-- Auth Form -->
      <Card class="glassmorphism">
        <template #content>
          <div class="p-6">
            <!-- Toggle between Login/Register -->
            <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                @click="isRegisterMode = false"
                :class="[
                  'flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200',
                  !isRegisterMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                ]"
              >
                Login
              </button>
              <button
                @click="isRegisterMode = true"
                :class="[
                  'flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200',
                  isRegisterMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                ]"
              >
                Register
              </button>
            </div>

            <!-- Error Message -->
            <Message
              v-if="authStore.error"
              severity="error"
              :closable="true"
              @close="authStore.clearError()"
              class="mb-4"
            >
              {{ authStore.error }}
            </Message>

            <!-- Register Form -->
            <form v-if="isRegisterMode" @submit.prevent="handleRegister">
              <div class="mb-4">
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <InputText
                  id="name"
                  v-model="registerForm.name"
                  placeholder="Enter your full name"
                  class="w-full"
                  :invalid="!registerForm.name && formTouched"
                  required
                />
              </div>

              <div class="mb-4">
                <label for="register-email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <InputText
                  id="register-email"
                  v-model="registerForm.email"
                  type="email"
                  placeholder="Enter your email"
                  class="w-full"
                  :invalid="!registerForm.email && formTouched"
                  required
                />
              </div>

              <div class="mb-6">
                <label for="register-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Password
                  id="register-password"
                  v-model="registerForm.password"
                  placeholder="Create a password"
                  :feedback="true"
                  toggle-mask
                  class="w-full"
                  :invalid="!registerForm.password && formTouched"
                  required
                />
              </div>

              <Button
                type="submit"
                :loading="authStore.isLoading"
                label="Create Account"
                icon="pi pi-user-plus"
                class="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 py-3 font-semibold"
              />
            </form>

            <!-- Login Form -->
            <form v-else @submit.prevent="handleLogin">
              <div class="mb-4">
                <label for="login-email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <InputText
                  id="login-email"
                  v-model="loginForm.email"
                  type="email"
                  placeholder="Enter your email"
                  class="w-full"
                  :invalid="!loginForm.email && formTouched"
                  required
                />
              </div>

              <div class="mb-6">
                <label for="login-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Password
                  id="login-password"
                  v-model="loginForm.password"
                  placeholder="Enter your password"
                  :feedback="false"
                  toggle-mask
                  class="w-full"
                  :invalid="!loginForm.password && formTouched"
                  required
                />
              </div>

              <Button
                type="submit"
                :loading="authStore.isLoading"
                label="Sign In"
                icon="pi pi-sign-in"
                class="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 py-3 font-semibold"
              />
            </form>
          </div>
        </template>
      </Card>

      <!-- Footer -->
      <div class="text-center mt-6 text-white/70 text-sm">
        <p>Secure authentication with JWT encryption</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'
import type { UserRegistration, UserLogin } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const isRegisterMode = ref(false)
const formTouched = ref(false)

const registerForm = reactive<UserRegistration>({
  name: '',
  email: '',
  password: ''
})

const loginForm = reactive<UserLogin>({
  email: '',
  password: ''
})

// Handle registration
async function handleRegister() {
  formTouched.value = true

  if (!registerForm.name || !registerForm.email || !registerForm.password) {
    return
  }

  try {
    await authStore.register(registerForm)
    // Redirect to dashboard on successful registration
    router.push('/')
  } catch (error) {
    // Error is handled by the store
  }
}

// Handle login
async function handleLogin() {
  formTouched.value = true

  if (!loginForm.email || !loginForm.password) {
    return
  }

  try {
    await authStore.login(loginForm)
    // Redirect to dashboard on successful login
    router.push('/')
  } catch (error) {
    // Error is handled by the store
  }
}
</script>

<style scoped>
.glassmorphism {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
</style>
