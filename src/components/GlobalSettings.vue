<template>
  <div class="settings-container">
    <h2 class="text-2xl font-bold mb-6">Global Settings</h2>
    
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4">Theme</h3>
      <div class="flex gap-3">
        <button 
          @click="setTheme('light')" 
          class="px-4 py-2 border rounded-lg"
          :class="theme === 'light' ? 'bg-blue-500 text-white' : 'bg-white'"
        >
          Light
        </button>
        <button 
          @click="setTheme('dark')" 
          class="px-4 py-2 border rounded-lg"
          :class="theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-white'"
        >
          Dark
        </button>
        <button 
          @click="setTheme('auto')" 
          class="px-4 py-2 border rounded-lg"
          :class="theme === 'auto' ? 'bg-blue-500 text-white' : 'bg-white'"
        >
          Auto
        </button>
      </div>
    </div>

    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-4">Language</h3>
      <div class="flex gap-3">
        <button 
          @click="setLanguage('en')" 
          class="px-4 py-2 border rounded-lg"
          :class="language === 'en' ? 'bg-blue-500 text-white' : 'bg-white'"
        >
          English
        </button>
        <button 
          @click="setLanguage('es')" 
          class="px-4 py-2 border rounded-lg"
          :class="language === 'es' ? 'bg-blue-500 text-white' : 'bg-white'"
        >
          Spanish
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const store = useSettingsStore()
const theme = computed(() => store.theme)
const language = computed(() => store.language)

const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
  store.setTheme(newTheme)
}

const setLanguage = (newLang: 'en' | 'es') => {
  store.setLanguage(newLang)
}
</script>

<style scoped>
.settings-container {
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}
</style>
