import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/AuthService'
import type { User, UserRegistration, UserLogin, AuthResponse } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<Omit<User, 'passwordHash'> | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!currentUser.value && !!token.value)
  const userName = computed(() => currentUser.value?.name || '')
  const userEmail = computed(() => currentUser.value?.email || '')
  const userRole = computed(() => currentUser.value?.role || 'user')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const selectedDeckIds = computed(() => currentUser.value?.selectedDeckIds || [])

  // Actions
  async function register(userData: UserRegistration): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const response: AuthResponse = await authService.register(userData)

      // Guardar datos de autenticación
      currentUser.value = response.user
      token.value = response.token

      // Persistir token
      localStorage.setItem('anki-auth-token', response.token)

      console.log('✅ Usuario registrado exitosamente:', response.user.name)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error en el registro'
      console.error('❌ Error en registro:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(credentials: UserLogin): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const response: AuthResponse = await authService.login(credentials)

      // Guardar datos de autenticación
      currentUser.value = response.user
      token.value = response.token

      // Persistir token
      localStorage.setItem('anki-auth-token', response.token)

      console.log('✅ Usuario autenticado exitosamente:', response.user.name)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error en el login'
      console.error('❌ Error en login:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function logout(): void {
    try {
      // Limpiar estado local
      currentUser.value = null
      token.value = null
      error.value = null

      // Limpiar storage
      authService.logout()

      console.log('✅ Sesión cerrada exitosamente')
    } catch (err) {
      console.error('❌ Error al cerrar sesión:', err)
    }
  }

  function initializeAuth(): void {
    try {
      // Intentar recuperar usuario autenticado
      const user = authService.getCurrentUser()
      const storedToken = localStorage.getItem('anki-auth-token')

      if (user && storedToken) {
        currentUser.value = user
        token.value = storedToken
        console.log('✅ Sesión restaurada para:', user.name)
      } else {
        // Limpiar datos inconsistentes
        logout()
      }
    } catch (err) {
      console.error('❌ Error al inicializar autenticación:', err)
      logout()
    }
  }

  function updateSelectedDecks(deckIds: string[]): void {
    if (!currentUser.value) return

    try {
      // Actualizar en el servicio
      authService.updateUserSelectedDecks(currentUser.value.id, deckIds)

      // Actualizar estado local
      currentUser.value.selectedDeckIds = deckIds
      currentUser.value.updatedAt = new Date()

      console.log('✅ Decks seleccionados actualizados:', deckIds.length)
    } catch (err) {
      console.error('❌ Error al actualizar decks seleccionados:', err)
    }
  }

  function updateUserPreferences(preferences: Partial<User['preferences']>): void {
    if (!currentUser.value) return

    try {
      // Actualizar en el servicio
      authService.updateUserPreferences(currentUser.value.id, preferences)

      // Actualizar estado local
      currentUser.value.preferences = { ...currentUser.value.preferences, ...preferences }
      currentUser.value.updatedAt = new Date()

      console.log('✅ Preferencias actualizadas:', preferences)
    } catch (err) {
      console.error('❌ Error al actualizar preferencias:', err)
    }
  }

  function clearError(): void {
    error.value = null
  }

  // Inicializar al crear el store
  initializeAuth()

  return {
    // State
    currentUser,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    userName,
    userEmail,
    userRole,
    isAdmin,
    selectedDeckIds,

    // Actions
    register,
    login,
    logout,
    initializeAuth,
    updateSelectedDecks,
    updateUserPreferences,
    clearError
  }
})
