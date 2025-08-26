<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2 class="text-2xl font-bold mb-6 text-center">⚙️ Configuración Global</h2>
    </div>
    
    <div v-if="isLoading" class="loading">
      <ProgressBar mode="indeterminate" />
      <p class="text-center mt-4">Cargando configuración...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <Message severity="error" :closable="false">
        {{ error }}
      </Message>
    </div>
    
    <div v-else-if="settings" class="settings-form">
      <!-- Language Settings -->
      <Card class="mb-6">
        <template #title>🌐 Idioma y Región</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label for="language" class="block text-sm font-medium mb-2">Idioma</label>
              <Dropdown
                id="language"
                v-model="settings.language"
                :options="languageOptions"
                option-label="label"
                option-value="value"
                placeholder="Seleccionar idioma"
                @change="updateSettings"
              />
            </div>
            
            <div class="field">
              <label for="timezone" class="block text-sm font-medium mb-2">Zona Horaria</label>
              <InputText
                id="timezone"
                v-model="settings.timezone"
                placeholder="Zona horaria"
                @change="updateSettings"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- TTS Settings -->
      <Card class="mb-6">
        <template #title>🔊 Text-to-Speech</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="field">
              <div class="flex items-center">
                <Checkbox
                  id="enableTTS"
                  v-model="settings.enableTTS"
                  :binary="true"
                  @change="updateSettings"
                />
                <label for="enableTTS" class="ml-2">Habilitar TTS</label>
              </div>
            </div>
            
            <div class="field">
              <label for="ttsVoice" class="block text-sm font-medium mb-2">Voz</label>
              <InputText
                id="ttsVoice"
                v-model="settings.ttsVoice"
                placeholder="Voz TTS"
                :disabled="!settings.enableTTS"
                @change="updateSettings"
              />
            </div>
            
            <div class="field">
              <label for="ttsSpeed" class="block text-sm font-medium mb-2">Velocidad: {{ settings.ttsSpeed }}</label>
              <Slider
                id="ttsSpeed"
                v-model="settings.ttsSpeed"
                :min="0.5"
                :max="2.0"
                :step="0.1"
                :disabled="!settings.enableTTS"
                @change="updateSettings"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Sync & Backup Settings -->
      <Card class="mb-6">
        <template #title>☁️ Sincronización y Respaldo</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="field">
              <div class="flex items-center">
                <Checkbox
                  id="autoSync"
                  v-model="settings.autoSync"
                  :binary="true"
                  @change="updateSettings"
                />
                <label for="autoSync" class="ml-2">Auto-sincronización</label>
              </div>
            </div>
            
            <div class="field">
              <div class="flex items-center">
                <Checkbox
                  id="autoBackup"
                  v-model="settings.autoBackup"
                  :binary="true"
                  @change="updateSettings"
                />
                <label for="autoBackup" class="ml-2">Respaldo automático</label>
              </div>
            </div>
            
            <div class="field">
              <label for="backupFrequency" class="block text-sm font-medium mb-2">Frecuencia</label>
              <Dropdown
                id="backupFrequency"
                v-model="settings.backupFrequency"
                :options="backupFrequencyOptions"
                option-label="label"
                option-value="value"
                :disabled="!settings.autoBackup"
                @change="updateSettings"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Study Preferences -->
      <Card class="mb-6">
        <template #title>📚 Preferencias de Estudio</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="field">
              <label for="preferredStudyTime" class="block text-sm font-medium mb-2">Horarios Preferidos</label>
              <MultiSelect
                id="preferredStudyTime"
                v-model="settings.preferredStudyTime"
                :options="studyTimeOptions"
                option-label="label"
                option-value="value"
                placeholder="Seleccionar horarios"
                @change="updateSettings"
              />
            </div>
            
            <div class="field">
              <div class="flex items-center">
                <Checkbox
                  id="offlineMode"
                  v-model="settings.offlineMode"
                  :binary="true"
                  @change="updateSettings"
                />
                <label for="offlineMode" class="ml-2">Modo sin conexión</label>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Study Stats -->
      <Card>
        <template #title>📊 Estadísticas</template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="stat-item">
              <label class="block text-sm font-medium mb-2">Racha de Estudio</label>
              <InputNumber
                v-model="settings.studyStreak"
                mode="decimal"
                :min="0"
                :disabled="true"
              />
              <small class="text-gray-500">días consecutivos</small>
            </div>
            
            <div class="stat-item">
              <label class="block text-sm font-medium mb-2">Tiempo Total</label>
              <InputNumber
                v-model="settings.totalStudyTime"
                mode="decimal"
                :min="0"
                :disabled="true"
              />
              <small class="text-gray-500">minutos</small>
            </div>
            
            <div class="stat-item">
              <Button 
                label="Resetear Estadísticas"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                @click="resetStats"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div class="mt-6 flex justify-center">
      <Button 
        label="Cerrar"
        icon="pi pi-times"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAnkiStore } from '../stores/anki'
import type { GlobalSettings } from '../types'

// PrimeVue Components
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import Slider from 'primevue/slider'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'

// Emits
defineEmits<{
  close: []
}>()

// Store
const ankiStore = useAnkiStore()

// State
const settings = ref<GlobalSettings | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Options
const languageOptions = [
  { label: 'Automático', value: 'auto' },
  { label: 'Español', value: 'es' },
  { label: 'English', value: 'en' }
]

const backupFrequencyOptions = [
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' }
]

const studyTimeOptions = [
  { label: 'Mañana', value: 'morning' },
  { label: 'Tarde', value: 'afternoon' },
  { label: 'Noche', value: 'evening' }
]

// Methods
async function loadSettings() {
  try {
    isLoading.value = true
    error.value = null
    
    const globalSettings = await ankiStore.loadGlobalSettings()
    if (globalSettings) {
      settings.value = { ...globalSettings }
    } else {
      error.value = 'No se pudieron cargar las configuraciones'
    }
  } catch (err) {
    console.error('Error loading settings:', err)
    error.value = 'Error al cargar la configuración'
  } finally {
    isLoading.value = false
  }
}

async function updateSettings() {
  if (!settings.value) return
  
  try {
    await ankiStore.updateGlobalSettings(settings.value)
    console.log('✅ Settings updated successfully')
  } catch (err) {
    console.error('Error updating settings:', err)
    error.value = 'Error al actualizar la configuración'
  }
}

async function resetStats() {
  if (!settings.value) return
  
  try {
    const updates = {
      studyStreak: 0,
      totalStudyTime: 0
    }
    
    await ankiStore.updateGlobalSettings(updates)
    settings.value.studyStreak = 0
    settings.value.totalStudyTime = 0
    
    console.log('✅ Stats reset successfully')
  } catch (err) {
    console.error('Error resetting stats:', err)
    error.value = 'Error al resetear las estadísticas'
  }
}

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-form .field {
  margin-bottom: 1rem;
}

.stat-item {
  text-align: center;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.error-message {
  margin-bottom: 1rem;
}
</style>
