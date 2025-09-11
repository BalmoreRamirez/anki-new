import { ref, computed } from 'vue'
import en from './en'
import es from './es'

// Safe localStorage access
function getSavedLanguage(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('anki-language') || 'en'
  }
  return 'en'
}

// Reactive language system
const currentLanguage = ref<string>(getSavedLanguage())

const messages = {
  en,
  es
}

// Helper function to get translated text
export function t(key: string): string {
  const keys = key.split('.')
  let value: any = messages[currentLanguage.value as keyof typeof messages]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  return value || key
}

// Helper function to change language
export function setLanguage(locale: string) {
  currentLanguage.value = locale
  
  // Safe localStorage access
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('anki-language', locale)
  }
  
  // Safe document access
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  
  // Safe window access for events
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: locale }))
  }
}

// Get current language
export function getCurrentLanguage(): string {
  return currentLanguage.value
}

// Reactive composable for components
export function useI18n() {
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = messages[currentLanguage.value as keyof typeof messages]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  return {
    t: computed(() => t),
    currentLanguage: computed(() => currentLanguage.value),
    setLanguage,
    availableLanguages
  }
}

// Available languages
export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' }
]
