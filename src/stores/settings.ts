import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { ConfigService } from '@/services/ConfigService'
import type { GlobalSettings } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  // Estado reactivo
  const globalSettings = ref<GlobalSettings | null>(null)
  const theme = ref<'light' | 'dark' | 'auto'>('auto')
  const language = ref<'en' | 'es' | 'auto'>('auto')
  const isLoading = ref(false)

  // Computed para tema resuelto
  const resolvedTheme = computed(() => {
    if (theme.value === 'auto') {
      // Detectar preferencia del sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value
  })

  // Computed para idioma resuelto
  const resolvedLanguage = computed(() => {
    if (language.value === 'auto') {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split('-')[0]
      return browserLang === 'es' ? 'es' : 'en'
    }
    return language.value
  })

  // Colores del tema
  const colors = computed(() => {
    const isDark = resolvedTheme.value === 'dark'
    
    return {
      // Colores principales
      primary: isDark ? '#3B82F6' : '#2563EB',
      primaryHover: isDark ? '#2563EB' : '#1D4ED8',
      secondary: isDark ? '#6366F1' : '#4F46E5',
      accent: isDark ? '#8B5CF6' : '#7C3AED',

      // Colores de fondo
      background: isDark ? '#0F172A' : '#FFFFFF',
      backgroundSecondary: isDark ? '#1E293B' : '#F8FAFC',
      backgroundTertiary: isDark ? '#334155' : '#F1F5F9',

      // Colores de superficie
      surface: isDark ? '#1E293B' : '#FFFFFF',
      surfaceHover: isDark ? '#334155' : '#F8FAFC',
      
      // Colores de texto
      textPrimary: isDark ? '#F8FAFC' : '#1E293B',
      textSecondary: isDark ? '#CBD5E1' : '#64748B',
      textTertiary: isDark ? '#94A3B8' : '#94A3B8',

      // Colores de borde
      border: isDark ? '#334155' : '#E2E8F0',
      borderHover: isDark ? '#475569' : '#CBD5E1',

      // Estados
      success: isDark ? '#22C55E' : '#16A34A',
      warning: isDark ? '#F59E0B' : '#D97706',
      error: isDark ? '#EF4444' : '#DC2626',
      info: isDark ? '#3B82F6' : '#2563EB',

      // Glass morphism
      glass: isDark 
        ? 'rgba(30, 41, 59, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)',
      glassHover: isDark 
        ? 'rgba(51, 65, 85, 0.9)' 
        : 'rgba(255, 255, 255, 0.95)',
    }
  })

  // Traducciones
  const translations = computed(() => {
    const lang = resolvedLanguage.value
    
    const es = {
      // Navegación
      dashboard: 'Panel Principal',
      decks: 'Mazos',
      study: 'Estudiar',
      settings: 'Configuración',
      profile: 'Perfil',
      logout: 'Cerrar Sesión',
      welcome: 'Bienvenido de nuevo',
      
      // Acciones comunes
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      add: 'Agregar',
      remove: 'Quitar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      continue: 'Continuar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      
      // Configuración
      theme: 'Tema',
      language: 'Idioma',
      light: 'Claro',
      dark: 'Oscuro',
      auto: 'Automático',
      spanish: 'Español',
      english: 'Inglés',
      
      // Mazos
      deckName: 'Nombre del Mazo',
      deckDescription: 'Descripción',
      createDeck: 'Crear Mazo',
      editDeck: 'Editar Mazo',
      deleteDeck: 'Eliminar Mazo',
      cardsCount: 'Tarjetas',
      
      // Tarjetas
      frontSide: 'Lado Frontal',
      backSide: 'Lado Trasero',
      addCard: 'Agregar Tarjeta',
      editCard: 'Editar Tarjeta',
      deleteCard: 'Eliminar Tarjeta',
      
      // Estudio
      startStudy: 'Comenzar Estudio',
      showAnswer: 'Mostrar Respuesta',
      nextCard: 'Siguiente Tarjeta',
      again: 'Otra vez',
      hard: 'Difícil',
      good: 'Bien',
      easy: 'Fácil',
      
      // Estadísticas
      studied: 'Estudiadas',
      new: 'Nuevas',
      learning: 'Aprendiendo',
      review: 'Repaso',
      
      // Mensajes
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      noData: 'No hay datos',
      confirmDelete: '¿Estás seguro de que quieres eliminar esto?',
    }

    const en = {
      // Navigation
      dashboard: 'Dashboard',
      decks: 'Decks',
      study: 'Study',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      welcome: 'Welcome back',
      
      // Common actions
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      add: 'Add',
      remove: 'Remove',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      continue: 'Continue',
      confirm: 'Confirm',
      close: 'Close',
      
      // Settings
      theme: 'Theme',
      language: 'Language',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      spanish: 'Spanish',
      english: 'English',
      
      // Decks
      deckName: 'Deck Name',
      deckDescription: 'Description',
      createDeck: 'Create Deck',
      editDeck: 'Edit Deck',
      deleteDeck: 'Delete Deck',
      cardsCount: 'Cards',
      
      // Cards
      frontSide: 'Front Side',
      backSide: 'Back Side',
      addCard: 'Add Card',
      editCard: 'Edit Card',
      deleteCard: 'Delete Card',
      
      // Study
      startStudy: 'Start Study',
      showAnswer: 'Show Answer',
      nextCard: 'Next Card',
      again: 'Again',
      hard: 'Hard',
      good: 'Good',
      easy: 'Easy',
      
      // Statistics
      studied: 'Studied',
      new: 'New',
      learning: 'Learning',
      review: 'Review',
      
      // Messages
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      noData: 'No data',
      confirmDelete: 'Are you sure you want to delete this?',
    }

    return lang === 'es' ? es : en
  })

  // Función para traducir texto
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations.value
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }
    
    return value || key
  }

  // Cargar configuración inicial
  const loadSettings = async () => {
    isLoading.value = true
    try {
      const settings = await ConfigService.getGlobalSettings()
      if (settings) {
        globalSettings.value = settings
        theme.value = settings.defaultDeckSettings?.theme || 'auto'
        language.value = settings.language || 'auto'
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Cambiar tema
  const setTheme = async (newTheme: 'light' | 'dark' | 'auto') => {
    theme.value = newTheme
    await saveSettings()
    applyTheme()
  }

  // Cambiar idioma
  const setLanguage = async (newLanguage: 'en' | 'es' | 'auto') => {
    language.value = newLanguage
    await saveSettings()
  }

  // Aplicar tema al DOM
  const applyTheme = () => {
    const root = document.documentElement
    const isDark = resolvedTheme.value === 'dark'
    
    // Aplicar clase de tema
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
    
    // Aplicar variables CSS customizadas
    const currentColors = colors.value
    Object.entries(currentColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
    
    // Aplicar meta theme-color para dispositivos móviles
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', currentColors.background)
    }
  }

  // Guardar configuración
  const saveSettings = async () => {
    if (!globalSettings.value) return
    
    try {
      const updates = {
        language: language.value,
        defaultDeckSettings: {
          ...globalSettings.value.defaultDeckSettings,
          theme: theme.value,
        }
      }
      
      await ConfigService.updateGlobalSettings(globalSettings.value.id, updates)
      
      // Actualizar el estado local
      globalSettings.value = {
        ...globalSettings.value,
        ...updates
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Escuchar cambios en las preferencias del sistema
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }

  // Watchers
  watch([resolvedTheme], () => {
    applyTheme()
  }, { immediate: true })

  // Inicialización
  const init = async () => {
    await loadSettings()
    setupSystemThemeListener()
    applyTheme()
  }

  return {
    // Estado
    globalSettings,
    theme,
    language,
    isLoading,
    
    // Computed
    resolvedTheme,
    resolvedLanguage,
    colors,
    translations,
    
    // Métodos
    t,
    setTheme,
    setLanguage,
    loadSettings,
    saveSettings,
    applyTheme,
    init
  }
})