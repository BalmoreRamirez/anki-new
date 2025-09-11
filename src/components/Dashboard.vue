<template>
  <div class="dashboard min-h-screen" :style="{ backgroundColor: colors.background }">
    <!-- Header -->
    <div class="shadow-sm border-b" :style="{ backgroundColor: colors.surface, borderColor: colors.border }">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div>
            <h1 class="text-2xl font-bold" :style="{ color: colors.textPrimary }">{{ t('dashboard') }} - Anki Learning</h1>
            <p class="text-sm mt-1" :style="{ color: colors.textSecondary }">
              <span v-if="authStore.isAuthenticated">
                {{ t('welcome') }}, {{ authStore.userName }} • 
                {{ authStore.selectedDeckIds.length }} {{ t('decks').toLowerCase() }} •
              </span>
              Firebase Cloud Storage
            </p>
          </div>
          <div class="flex-shrink-0 flex space-x-2">
            <Button
              v-if="authStore.isAuthenticated && authStore.isAdmin"
              @click="goToAdmin"
              icon="pi pi-shield"
              label="Admin Panel"
              severity="danger"
              outlined
            />
            <Button
              v-if="authStore.isAuthenticated"
              icon="pi pi-user"
              rounded
              text
              @click="showUserSettings = true"
              severity="secondary"
              v-tooltip.top="'User Settings'"
            />
            <Button
              icon="pi pi-cog"
              rounded
              text
              @click="showSettings = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Quick Actions -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900">Your Study Decks</h2>
          <div class="flex space-x-3">
            <Button
              @click="$emit('create-deck')"
              icon="pi pi-plus"
              label="Create Deck"
              severity="success"
            />
            <Button
              @click="resetCards"
              icon="pi pi-refresh"
              label="Reset All Cards"
              severity="warning"
              outlined
            />
          </div>
        </div>
      </div>

      <!-- Decks Grid -->
      <div v-if="filteredDecks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="deck in filteredDecks" 
          :key="deck.id" 
          class="deck-card group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden"
        >
          <!-- Difficulty Color Bar -->
          <div 
            class="absolute top-0 left-0 right-0 h-1"
            :class="{
              'bg-green-400': deck.difficulty === 'beginner',
              'bg-yellow-400': deck.difficulty === 'intermediate', 
              'bg-red-400': deck.difficulty === 'advanced'
            }"
          ></div>

          <!-- Card Content -->
          <div class="p-6 space-y-4">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-2">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :class="{
                      'bg-green-400': deck.difficulty === 'beginner',
                      'bg-yellow-400': deck.difficulty === 'intermediate',
                      'bg-red-400': deck.difficulty === 'advanced'
                    }"
                  ></div>
                  <span 
                    class="text-xs font-medium uppercase tracking-wide"
                    :class="{
                      'text-green-600': deck.difficulty === 'beginner',
                      'text-yellow-600': deck.difficulty === 'intermediate',
                      'text-red-600': deck.difficulty === 'advanced'
                    }"
                  >
                    {{ deck.difficulty }}
                  </span>
                </div>
                <h3 class="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {{ deck.name }}
                </h3>
                <p v-if="deck.description" class="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                  {{ deck.description }}
                </p>
              </div>
              
              <!-- Action Menu -->
              <div class="flex space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  @click="$emit('edit-deck', deck)"
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  class="!w-8 !h-8 hover:bg-blue-50 hover:text-blue-600"
                />
                <Button
                  @click="confirmDeleteDeck(deck)"
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  text
                  rounded
                  class="!w-8 !h-8 hover:bg-red-50"
                />
              </div>
            </div>

            <!-- Stats Section -->
            <div class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-1">
                  <i class="pi pi-book text-blue-500 text-sm"></i>
                  <span class="text-sm font-medium text-gray-700">{{ deck.cards.length }}</span>
                  <span class="text-xs text-gray-500">cards</span>
                </div>
                <div v-if="deck.estimatedTime" class="flex items-center space-x-1">
                  <i class="pi pi-clock text-green-500 text-sm"></i>
                  <span class="text-xs text-gray-500">{{ deck.estimatedTime }}min</span>
                </div>
              </div>
              
              <!-- Progress Indicator -->
              <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-1.5">
                  <div 
                    class="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                    :style="{ width: getProgressPercentage(deck) + '%' }"
                  ></div>
                </div>
                <span class="text-xs text-gray-500">{{ getProgressPercentage(deck) }}%</span>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="deck.tags && deck.tags.length > 0" class="flex flex-wrap gap-1">
              <span 
                v-for="tag in deck.tags.slice(0, 3)" 
                :key="tag"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {{ tag }}
              </span>
              <span 
                v-if="deck.tags.length > 3"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              >
                +{{ deck.tags.length - 3 }}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-2 pt-2">
              <Button
                @click="$emit('study-deck', deck)"
                label="Study Now"
                icon="pi pi-play"
                class="flex-1 !bg-gradient-to-r !from-blue-500 !to-blue-600 hover:!from-blue-600 hover:!to-blue-700 !border-0 !text-white !font-medium !py-2.5"
                size="small"
              />
              <Button
                @click="$emit('manage-cards', deck)"
                icon="pi pi-cog"
                outlined
                rounded
                class="!w-10 !h-10 hover:!bg-gray-50"
              />
            </div>

            <!-- Last Study Info -->
            <div v-if="deck.updatedAt" class="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
              Updated {{ formatDate(deck.updatedAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="max-w-md mx-auto">
          <div class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-folder text-2xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No decks available</h3>
          <p class="text-gray-600 mb-6">Get started by creating your first study deck.</p>
          <Button
            @click="$emit('create-deck')"
            icon="pi pi-plus"
            label="Create Your First Deck"
            severity="success"
          />
        </div>
      </div>
    </div>

    <!-- Settings Dialog -->
    <Dialog
      v-model:visible="showSettings"
      :header="t('settings')"
      :modal="true"
      :closable="true"
      class="w-full max-w-2xl"
    >
      <GlobalSettings />
      <div class="flex justify-end mt-6">
        <Button
          @click="showSettings = false"
          :label="t('close')"
          severity="secondary"
        />
      </div>
    </Dialog>

    <!-- User Settings Dialog -->
    <UserSettings 
      :visible="showUserSettings" 
      @update:visible="showUserSettings = $event" 
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useAnkiStore } from '../stores/anki'
import { useAuthStore } from '../stores/auth'
import { useSettings } from '@/composables/useSettings'
import UserSettings from './UserSettings.vue'
import GlobalSettings from './GlobalSettings.vue'
import type { Deck } from '../types/index'

interface Props {
  decks: Deck[]
}

const props = defineProps<Props>()

// Usar el sistema de configuración global
const { t, colors, resolvedTheme } = useSettings()

const emit = defineEmits<{
  'create-deck': []
  'edit-deck': [deck: Deck]
  'delete-deck': [id: string]
  'study-deck': [deck: Deck]
  'manage-cards': [deck: Deck]
}>()

const confirm = useConfirm()
const router = useRouter()
const ankiStore = useAnkiStore()
const authStore = useAuthStore()

// Settings dialog state
const showSettings = ref(false)
const showUserSettings = ref(false)

// Filter decks based on user selection
const filteredDecks = computed(() => {
  if (!authStore.isAuthenticated) {
    return props.decks
  }

  // If user has no deck selection, show all decks
  if (authStore.selectedDeckIds.length === 0) {
    return props.decks
  }

  // Show only selected decks
  return props.decks.filter(deck => authStore.selectedDeckIds.includes(deck.id))
})

// Navigate to admin panel
function goToAdmin() {
  router.push('/admin')
}

// Calculate progress percentage based on cards studied
function getProgressPercentage(deck: Deck): number {
  if (deck.cards.length === 0) return 0
  
  // Calculate based on cards that have been reviewed at least once
  const studiedCards = deck.cards.filter(card => card.reviewCount > 0)
  return Math.round((studiedCards.length / deck.cards.length) * 100)
}

// Format date for display
function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  
  return dateObj.toLocaleDateString()
}

// Reset all cards function
function resetCards() {
  confirm.require({
    message: 'This will make all cards available for review immediately. Are you sure?',
    header: 'Reset All Cards',
    icon: 'pi pi-refresh',
    acceptClass: 'p-button-warning',
    accept: () => {
      ankiStore.resetAllCardsDue()
    }
  })
}

// Confirm deck deletion
function confirmDeleteDeck(deck: Deck) {
  const cardCount = deck.cards.length
  const message = cardCount > 0 
    ? `Are you sure you want to delete "${deck.name}"? This action cannot be undone and will permanently delete all ${cardCount} cards in this deck.`
    : `Are you sure you want to delete the empty deck "${deck.name}"? This action cannot be undone.`
  
  confirm.require({
    message,
    header: 'Delete Deck',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    accept: () => {
      emit('delete-deck', deck.id)
    }
  })
}
</script>

<style scoped>
.deck-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.deck-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>