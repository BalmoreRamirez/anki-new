import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

/**
 * Composable para usar la configuración global de la aplicación
 * Proporciona acceso reactivo al tema, idioma, traducciones y colores
 */
export function useSettings() {
  const settingsStore = useSettingsStore()
  
  // Referencias reactivas del store
  const {
    theme,
    language,
    resolvedTheme,
    resolvedLanguage,
    colors,
    translations,
    isLoading,
    globalSettings
  } = storeToRefs(settingsStore)
  
  // Métodos del store
  const {
    t,
    setTheme,
    setLanguage,
    loadSettings,
    saveSettings,
    applyTheme,
    init
  } = settingsStore
  
  return {
    // Estado reactivo
    theme,
    language,
    resolvedTheme,
    resolvedLanguage,
    colors,
    translations,
    isLoading,
    globalSettings,
    
    // Métodos
    t,
    setTheme,
    setLanguage,
    loadSettings,
    saveSettings,
    applyTheme,
    init
  }
}

/**
 * Hook para obtener solo las traducciones
 * Útil cuando solo necesitas la función de traducción
 */
export function useTranslations() {
  const { t } = useSettings()
  return { t }
}

/**
 * Hook para obtener solo los colores del tema
 * Útil para componentes que necesitan aplicar estilos dinámicos
 */
export function useThemeColors() {
  const { colors, resolvedTheme } = useSettings()
  return { colors, resolvedTheme }
}