<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    header="Storage Settings" 
    :style="{ width: '500px' }"
    class="storage-settings-dialog"
  >
    <div class="space-y-6 p-4">
      <!-- Estado actual -->
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 class="text-lg font-semibold text-blue-800 mb-2 flex items-center">
          <i class="pi pi-info-circle mr-2"></i>
          Current Storage
        </h3>
        <p class="text-blue-700">
          <strong>{{ ankiStore.useFirebase ? 'Firebase Cloud Storage' : 'Local Browser Storage' }}</strong>
        </p>
        <p class="text-sm text-blue-600 mt-1">
          {{ ankiStore.useFirebase ? 'Your data is stored in the cloud and syncs across devices.' : 'Your data is stored locally in this browser only.' }}
        </p>
      </div>

      <!-- Opciones de almacenamiento -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Choose Storage Method</h3>
        
        <!-- Opción Local Storage -->
        <div class="border rounded-lg p-4" :class="!ankiStore.useFirebase ? 'border-green-500 bg-green-50' : 'border-gray-200'">
          <div class="flex items-start space-x-3">
            <RadioButton 
              v-model="selectedStorage" 
              value="local" 
              inputId="local-storage"
              :disabled="ankiStore.isLoading"
            />
            <div class="flex-1">
              <label for="local-storage" class="text-sm font-medium text-gray-900 cursor-pointer">
                Local Browser Storage
              </label>
              <p class="text-sm text-gray-600 mt-1">
                Fast and works offline. Data stays on this device only.
              </p>
              <div class="flex items-center mt-2 text-xs text-gray-500">
                <i class="pi pi-check-circle text-green-500 mr-1"></i>
                <span>Free</span>
                <i class="pi pi-desktop ml-3 mr-1"></i>
                <span>Single device</span>
                <i class="pi pi-wifi-off ml-3 mr-1"></i>
                <span>Works offline</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Opción Firebase -->
        <div class="border rounded-lg p-4" :class="ankiStore.useFirebase ? 'border-green-500 bg-green-50' : 'border-gray-200'">
          <div class="flex items-start space-x-3">
            <RadioButton 
              v-model="selectedStorage" 
              value="firebase" 
              inputId="firebase-storage"
              :disabled="ankiStore.isLoading"
            />
            <div class="flex-1">
              <label for="firebase-storage" class="text-sm font-medium text-gray-900 cursor-pointer">
                Firebase Cloud Storage
              </label>
              <p class="text-sm text-gray-600 mt-1">
                Sync across all your devices. Access your decks anywhere.
              </p>
              <div class="flex items-center mt-2 text-xs text-gray-500">
                <i class="pi pi-cloud text-blue-500 mr-1"></i>
                <span>Cloud sync</span>
                <i class="pi pi-mobile ml-3 mr-1"></i>
                <span>All devices</span>
                <i class="pi pi-refresh ml-3 mr-1"></i>
                <span>Real-time updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Firebase Configuration (solo mostrar si Firebase está seleccionado) -->
      <div v-if="selectedStorage === 'firebase'" class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 class="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          Firebase Setup Required
        </h4>
        <p class="text-sm text-yellow-700 mb-3">
          To use Firebase, you need to configure your Firebase project credentials in 
          <code class="bg-yellow-200 px-1 rounded">src/config/firebase.ts</code>
        </p>
        <div class="text-xs text-yellow-600">
          <p>1. Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" class="underline">console.firebase.google.com</a></p>
          <p>2. Enable Firestore Database</p>
          <p>3. Copy your config to firebase.ts</p>
        </div>
      </div>

      <!-- Status de carga -->
      <div v-if="ankiStore.isLoading" class="flex items-center justify-center p-4">
        <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
        <span class="ml-3 text-gray-600">{{ loadingMessage }}</span>
      </div>

      <!-- Error -->
      <div v-if="ankiStore.error" class="bg-red-50 p-4 rounded-lg border border-red-200">
        <p class="text-sm text-red-700 flex items-center">
          <i class="pi pi-exclamation-circle mr-2"></i>
          {{ ankiStore.error }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <Button 
          label="Cancel" 
          severity="secondary" 
          @click="close"
          :disabled="ankiStore.isLoading"
        />
        <Button 
          label="Apply" 
          @click="applyChanges"
          :disabled="ankiStore.isLoading || selectedStorage === currentStorage"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import ProgressSpinner from 'primevue/progressspinner'
import { useAnkiStore } from '@/stores/anki'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const ankiStore = useAnkiStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedStorage = ref<'local' | 'firebase'>('local')
const loadingMessage = ref('')

const currentStorage = computed(() => 
  ankiStore.useFirebase ? 'firebase' : 'local'
)

// Inicializar selectedStorage con el valor actual
watch(visible, (isVisible) => {
  if (isVisible) {
    selectedStorage.value = currentStorage.value
  }
})

async function applyChanges() {
  if (selectedStorage.value === currentStorage.value) return

  try {
    const enableFirebase = selectedStorage.value === 'firebase'
    
    if (enableFirebase) {
      loadingMessage.value = 'Migrating data to Firebase...'
    } else {
      loadingMessage.value = 'Switching to local storage...'
    }

    await ankiStore.toggleFirebase(enableFirebase)
    
    if (!ankiStore.error) {
      close()
    }
  } catch (error) {
    console.error('Error applying storage changes:', error)
  }
}

function close() {
  visible.value = false
  selectedStorage.value = currentStorage.value
}
</script>

<style scoped>
.storage-settings-dialog :deep(.p-dialog-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.storage-settings-dialog :deep(.p-dialog-header .p-dialog-title) {
  color: white;
  font-weight: 600;
}

.storage-settings-dialog :deep(.p-dialog-header .p-dialog-header-icon) {
  color: white;
}

code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875em;
}
</style>
