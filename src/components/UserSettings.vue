<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :style="{ width: '90vw', maxWidth: '1000px' }"
    :dismissableMask="true"
    :closable="true"
    :header="tr('userSettings.title')"
    class="user-settings-dialog"
    :pt="{
      root: { class: isDarkMode ? 'bg-gray-800 rounded-xl shadow-2xl' : 'bg-white rounded-xl shadow-2xl' },
      header: { class: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl px-6 py-4' },
      content: { class: isDarkMode ? 'bg-gray-800 rounded-b-xl p-6' : 'bg-white rounded-b-xl p-6' },
      mask: { class: 'bg-black bg-opacity-50 backdrop-blur-sm' }
    }"
  >
    <div class="user-settings-content">
      <!-- User Profile Section -->
      <div class="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 shadow-sm">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <i class="pi pi-user text-2xl text-white"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800">{{ authStore.userName }}</h3>
            <p class="text-gray-600">{{ authStore.userEmail }}</p>
            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Member since {{ formatDate(authStore.currentUser?.createdAt) }}</span>
              <span>•</span>
              <span class="text-blue-600 font-medium">{{ authStore.selectedDeckIds.length }} decks selected</span>
            </div>
          </div>
          <Button
            @click="handleLogout"
            icon="pi pi-sign-out"
            :label="tr('nav.logout')"
            severity="secondary"
            outlined
            class="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
          />
        </div>
      </div>

      <!-- Tabs -->
      <TabView>
        <!-- Deck Selection Tab -->
        <TabPanel :header="tr('userSettings.tabs.deckSelection')" leftIcon="pi pi-list" value="0">
          <DeckSelectionConfig @selection-saved="handleSelectionSaved" />
        </TabPanel>

        <!-- Study Preferences Tab -->
        <TabPanel :header="tr('userSettings.tabs.studyPreferences')" leftIcon="pi pi-cog" value="1">
          <div class="space-y-8">
            <!-- Daily Goal -->
            <div class="p-6 rounded-xl border shadow-sm" :class="cardClasses">
              <label class="block text-lg font-semibold mb-3" :class="textClasses">
                <i class="pi pi-target mr-2 text-blue-600"></i>
                {{ tr('userSettings.studyPreferences.dailyGoal') }}
              </label>
              <div class="flex items-center space-x-4">
                <Slider
                  v-model="preferences.dailyGoal"
                  :min="5"
                  :max="100"
                  :step="5"
                  class="flex-1"
                />
                <div class="w-24 text-right">
                  <span class="text-2xl font-bold text-blue-600">{{ preferences.dailyGoal }}</span>
                  <span class="text-sm block" :class="secondaryTextClasses">{{ tr('dashboard.cards') }}</span>
                </div>
              </div>
              <small class="mt-2 block" :class="secondaryTextClasses">
                {{ tr('userSettings.studyPreferences.dailyGoalDescription') }}</small>
            </div>

            <!-- Study Reminders -->
            <div class="p-6 rounded-xl border shadow-sm" :class="cardClasses">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="block text-lg font-semibold" :class="textClasses">
                      <i class="pi pi-bell mr-2 text-orange-600"></i>
                      {{ tr('userSettings.studyPreferences.studyReminders') }}
                    </label>
                    <small class="mt-1 block" :class="secondaryTextClasses">
                      {{ tr('userSettings.studyPreferences.studyRemindersDescription') }}
                    </small>
                  </div>
                  <ToggleButton
                    v-model="preferences.studyReminder"
                    onLabel="ON"
                    offLabel="OFF"
                    class="w-20"
                  />
                </div>

                <!-- Time Selector (shown when reminders are enabled) -->
                <div v-if="preferences.studyReminder" class="mt-4 pt-4 border-t" :class="isDarkMode ? 'border-gray-600' : 'border-gray-200'">
                  <label class="block text-sm font-medium mb-2" :class="textClasses">
                    <i class="pi pi-clock mr-2 text-blue-600"></i>
                    {{ tr('userSettings.studyPreferences.reminderTime') }}
                  </label>
                  <small class="block mb-3" :class="secondaryTextClasses">
                    {{ tr('userSettings.studyPreferences.reminderTimeDescription') }}
                  </small>
                  <div class="flex items-center space-x-3">
                    <input
                      v-model="preferences.reminderTime"
                      type="time"
                      class="px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      :class="isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'"
                    />
                    <span class="text-sm" :class="secondaryTextClasses">
                      ({{ formatTimeDisplay(preferences.reminderTime) }})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Theme Selection -->
            <div class="p-6 rounded-xl border shadow-sm" :class="cardClasses">
              <label class="block text-lg font-semibold mb-4" :class="textClasses">
                <i class="pi pi-palette mr-2 text-purple-600"></i>
                Theme Preference
              </label>
              <SelectButton
                v-model="preferences.theme"
                :options="themeOptions"
                optionLabel="label"
                optionValue="value"
                class="flex space-x-2"
              />
            </div>

            <!-- Save Preferences -->
            <div class="flex justify-end pt-4">
              <Button
                @click="savePreferences"
                :loading="isSavingPreferences"
                icon="pi pi-save"
                label="Save Preferences"
                class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              />
            </div>
          </div>
        </TabPanel>

        <!-- Account Tab -->
        <TabPanel header="Account" leftIcon="pi pi-user" value="2">
          <div class="space-y-6">
            <!-- Account Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium mb-2" :class="textClasses">
                  Full Name
                </label>
                <InputText
                  :value="authStore.userName"
                  disabled
                  class="w-full"
                  :class="isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100'"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2" :class="textClasses">
                  Email Address
                </label>
                <InputText
                  :value="authStore.userEmail"
                  disabled
                  class="w-full"
                  :class="isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100'"
                />
              </div>
            </div>

            <!-- Study Statistics -->
            <div class="p-6 rounded-xl border shadow-sm" :class="[cardClasses, 'bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700']">
              <h4 class="font-bold mb-6 text-lg" :class="textClasses">
                <i class="pi pi-chart-line mr-2 text-blue-600"></i>
                Study Statistics
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-4 rounded-lg shadow-sm" :class="cardClasses">
                  <div class="text-3xl font-bold text-blue-600 mb-1">{{ totalCards }}</div>
                  <div class="text-sm" :class="secondaryTextClasses">Total Cards</div>
                </div>
                <div class="text-center p-4 rounded-lg shadow-sm" :class="cardClasses">
                  <div class="text-3xl font-bold text-green-600 mb-1">{{ reviewedToday }}</div>
                  <div class="text-sm" :class="secondaryTextClasses">Reviewed Today</div>
                </div>
                <div class="text-center p-4 rounded-lg shadow-sm" :class="cardClasses">
                  <div class="text-3xl font-bold text-orange-600 mb-1">{{ dueCards }}</div>
                  <div class="text-sm" :class="secondaryTextClasses">Cards Due</div>
                </div>
                <div class="text-center p-4 rounded-lg shadow-sm" :class="cardClasses">
                  <div class="text-3xl font-bold text-purple-600 mb-1">{{ studyStreak }}</div>
                  <div class="text-sm" :class="secondaryTextClasses">Day Streak</div>
                </div>
              </div>
            </div>

            <!-- Danger Zone -->
            <div class="border rounded-lg p-4" :class="isDarkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'">
              <h4 class="font-semibold mb-2" :class="isDarkMode ? 'text-red-400' : 'text-red-800'">Danger Zone</h4>
              <p class="text-sm mb-4" :class="isDarkMode ? 'text-red-300' : 'text-red-600'">
                These actions cannot be undone. Please be careful.
              </p>
              <Button
                @click="confirmDeleteAccount"
                icon="pi pi-trash"
                label="Delete Account"
                severity="danger"
                outlined
              />
            </div>
          </div>
        </TabPanel>

        <!-- Language Tab -->
        <TabPanel :header="tr('userSettings.tabs.language')" leftIcon="pi pi-globe" value="3">
          <div class="space-y-6">
            <!-- Language Selection -->
            <div class="p-6 rounded-xl border shadow-sm" :class="cardClasses">
              <h4 class="font-bold mb-4 text-lg" :class="textClasses">
                <i class="pi pi-globe mr-2 text-indigo-600"></i>
                {{ tr('userSettings.language.title') }}
              </h4>
              <p class="mb-6" :class="secondaryTextClasses">
                {{ tr('userSettings.language.description') }}
              </p>

              <!-- Current Language -->
              <div class="mb-6">
                <label class="block text-sm font-medium mb-2" :class="textClasses">
                  {{ tr('userSettings.language.current') }}
                </label>
                <div class="flex items-center space-x-3 p-3 rounded-lg" :class="cardClasses">
                  <i class="pi pi-flag text-indigo-600"></i>
                  <span :class="textClasses">{{ getCurrentLanguageName }}</span>
                </div>
              </div>

              <!-- Available Languages -->
              <div class="mb-6">
                <label class="block text-sm font-medium mb-3" :class="textClasses">
                  {{ tr('userSettings.language.available') }}
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    v-for="lang in availableLanguages" 
                    :key="lang.code"
                    @click="selectLanguage(lang.code)"
                    class="p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:border-indigo-500"
                    :class="[
                      cardClasses,
                      selectedLanguage === lang.code 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'hover:shadow-md'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="font-medium" :class="textClasses">{{ lang.nativeName }}</div>
                        <div class="text-sm" :class="secondaryTextClasses">{{ lang.name }}</div>
                      </div>
                      <i 
                        v-if="selectedLanguage === lang.code"
                        class="pi pi-check text-indigo-600"
                      ></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Save Language -->
              <div class="flex justify-end">
                <Button
                  @click="saveLanguage"
                  :loading="isSavingLanguage"
                  icon="pi pi-save"
                  :label="tr('userSettings.language.saveLanguage')"
                  class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog />
    
    <!-- Toast Notifications -->
    <Toast />
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Slider from 'primevue/slider'
import ToggleButton from 'primevue/togglebutton'
import SelectButton from 'primevue/selectbutton'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { useAnkiStore } from '@/stores/anki'
import { setLanguage, availableLanguages, t, getCurrentLanguage, useI18n } from '@/locales'
import DeckSelectionConfig from './DeckSelectionConfig.vue'
import type { User } from '@/types'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const authStore = useAuthStore()
const ankiStore = useAnkiStore()

// Reactive i18n system
const { currentLanguage: reactiveCurrentLanguage } = useI18n()

// Simple reactive translation function
const tr = (key: string) => {
  // This will be reactive because t() uses reactive currentLanguage
  return t(key)
}

// State
const isSavingPreferences = ref(false)
const isSavingLanguage = ref(false)

// Preferences (reactive copy of user preferences)
const preferences = reactive<User['preferences']>({
  studyReminder: authStore.currentUser?.preferences.studyReminder ?? true,
  reminderTime: authStore.currentUser?.preferences.reminderTime ?? '18:00',
  dailyGoal: authStore.currentUser?.preferences.dailyGoal ?? 20,
  theme: authStore.currentUser?.preferences.theme ?? 'auto',
  language: authStore.currentUser?.preferences.language ?? 'en'
})

// Language selection
const selectedLanguage = ref(preferences.language)

// Theme options
const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Auto', value: 'auto' }
]

// Stats from selected decks
const selectedDecks = computed(() => {
  return ankiStore.decks.filter(deck => authStore.selectedDeckIds.includes(deck.id))
})

const totalCards = computed(() => {
  return selectedDecks.value.reduce((sum, deck) => sum + deck.cards.length, 0)
})

const reviewedToday = computed(() => {
  const today = new Date().toDateString()
  return selectedDecks.value.reduce((sum, deck) => {
    return sum + deck.cards.filter(card =>
      card.updatedAt && new Date(card.updatedAt).toDateString() === today
    ).length
  }, 0)
})

const dueCards = computed(() => {
  const now = new Date()
  return selectedDecks.value.reduce((sum, deck) => {
    return sum + deck.cards.filter(card => {
      try {
        const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0)
        return !isNaN(reviewDate.getTime()) && reviewDate <= now
      } catch {
        return true
      }
    }).length
  }, 0)
})

const studyStreak = computed(() => {
  // Placeholder - implement real streak calculation
  return 7
})

// Dynamic theme classes
const isDarkMode = computed(() => {
  if (preferences.theme === 'dark') return true
  if (preferences.theme === 'light') return false
  // Auto theme - check system preference
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
})

const cardClasses = computed(() => {
  return isDarkMode.value 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200'
})

const textClasses = computed(() => {
  return isDarkMode.value 
    ? 'text-gray-100' 
    : 'text-gray-800'
})

const secondaryTextClasses = computed(() => {
  return isDarkMode.value 
    ? 'text-gray-400' 
    : 'text-gray-500'
})

// Watch for theme changes and apply immediately
watch(() => preferences.theme, (newTheme) => {
  applyTheme(newTheme)
})

// Apply theme on component mount
onMounted(() => {
  if (authStore.currentUser?.preferences.theme) {
    applyTheme(authStore.currentUser.preferences.theme)
  }
})

// Format date
function formatDate(date?: Date): string {
  if (!date) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

// Format time display (convert 24h to 12h format)
function formatTimeDisplay(time: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  } catch {
    return time
  }
}

// Handle logout
async function handleLogout(): Promise<void> {
  try {
    authStore.logout()
    emit('update:visible', false)
    router.push('/auth')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

// Save preferences
async function savePreferences(): Promise<void> {
  try {
    isSavingPreferences.value = true
    
    // Update preferences in store
    authStore.updateUserPreferences(preferences)
    
    // Apply theme immediately
    applyTheme(preferences.theme)
    
    // Show success notification
    toast.add({
      severity: 'success',
      summary: tr('userSettings.studyPreferences.saveSuccess'),
      detail: tr('userSettings.studyPreferences.saved'),
      life: 3000
    })
    
    console.log('✅ Preferences saved successfully')
  } catch (error) {
    console.error('❌ Error saving preferences:', error)
    
    // Show error notification
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: tr('userSettings.studyPreferences.saveError'),
      life: 5000
    })
  } finally {
    isSavingPreferences.value = false
  }
}

// Apply theme to document
function applyTheme(theme: string): void {
  const body = document.body
  
  // Remove existing theme classes
  body.classList.remove('light-theme', 'dark-theme')
  
  if (theme === 'dark') {
    body.classList.add('dark-theme')
  } else if (theme === 'light') {
    body.classList.add('light-theme')
  } else {
    // Auto theme - check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    body.classList.add(prefersDark ? 'dark-theme' : 'light-theme')
  }
}

// Handle selection saved
function handleSelectionSaved(): void {
  console.log('Deck selection saved from settings')
}

// Language functions
const getCurrentLanguageName = computed(() => {
  const currentLang = availableLanguages.find(lang => lang.code === reactiveCurrentLanguage.value)
  return currentLang ? currentLang.nativeName : 'English'
})

function selectLanguage(langCode: string): void {
  selectedLanguage.value = langCode as 'en' | 'es'
}

async function saveLanguage(): Promise<void> {
  try {
    isSavingLanguage.value = true
    
    // Update preferences with new language
    preferences.language = selectedLanguage.value
    
    // Save to store
    authStore.updateUserPreferences({ language: selectedLanguage.value })
    
    // Apply language immediately
    setLanguage(selectedLanguage.value)
    
    // Show success notification
    toast.add({
      severity: 'success',
      summary: tr('userSettings.language.languageSaved'),
      detail: `${tr('common.language')}: ${availableLanguages.find(l => l.code === selectedLanguage.value)?.nativeName}`,
      life: 3000
    })
    
    console.log('✅ Language saved successfully:', selectedLanguage.value)
  } catch (error) {
    console.error('❌ Error saving language:', error)
    
    // Show error notification
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: tr('userSettings.language.languageError'),
      life: 5000
    })
  } finally {
    isSavingLanguage.value = false
  }
}

// Confirm delete account
function confirmDeleteAccount(): void {
  confirm.require({
    message: 'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.',
    header: 'Delete Account',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Delete Account',
    rejectLabel: 'Cancel',
    accept: () => {
      // TODO: Implement account deletion
      console.log('Account deletion not implemented yet')
    }
  })
}
</script>

<style scoped>
.user-settings-content {
  min-height: 500px;
  border-radius: 12px;
  padding: 1rem;
}

/* Light theme (default) */
.user-settings-content {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  .user-settings-content {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  }
}

/* Custom dialog styles */
:deep(.user-settings-dialog .p-dialog) {
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Light theme dialog */
:deep(.user-settings-dialog .p-dialog) {
  background: white;
}

/* Dark theme dialog */
@media (prefers-color-scheme: dark) {
  :deep(.user-settings-dialog .p-dialog) {
    background: #1f2937;
  }
}

:deep(.user-settings-dialog .p-dialog-header) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  padding: 1.5rem 2rem;
  border-bottom: none;
}

:deep(.user-settings-dialog .p-dialog-title) {
  font-size: 1.5rem;
  font-weight: 700;
}

:deep(.user-settings-dialog .p-dialog-header-icon) {
  color: white;
}

:deep(.user-settings-dialog .p-dialog-content) {
  padding: 0;
  border-radius: 0 0 16px 16px;
}

/* Tab styles */
:deep(.p-tabview-header) {
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Light theme tabs */
:deep(.p-tabview-header) {
  background: white;
}

/* Dark theme tabs */
@media (prefers-color-scheme: dark) {
  :deep(.p-tabview-header) {
    background: #374151;
  }
}

:deep(.p-tabview-nav-link) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.p-tabview-nav-link:focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* Custom button styles */
:deep(.p-button) {
  transition: all 0.2s ease;
}

:deep(.p-slider .p-slider-handle) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: 2px solid white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.p-togglebutton.p-highlight) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
}
</style>
