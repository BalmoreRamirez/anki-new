<template>
  <div class="deck-selection-config">
    <div class="mb-6">
      <h3 class="text-xl font-bold text-gray-800 mb-2 flex items-center">
        <i class="pi pi-cog mr-3 text-blue-600"></i>
        Deck Selection
      </h3>
      <p class="text-gray-600">Choose which decks you want to study. You can change this at any time.</p>
    </div>

    <!-- Available Decks -->
    <div class="space-y-4">
      <div v-for="deck in availableDecks" :key="deck.id" class="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <Checkbox
              :id="`deck-${deck.id}`"
              v-model="selectedDecks"
              :value="deck.id"
              @change="updateSelection"
            />
            <div class="flex-1">
              <label :for="`deck-${deck.id}`" class="text-lg font-semibold text-gray-800 cursor-pointer">
                {{ deck.name }}
              </label>
              <p class="text-gray-600 text-sm mt-1">{{ deck.description }}</p>

              <!-- Deck stats -->
              <div class="flex items-center space-x-4 mt-2">
                <div class="flex items-center space-x-1 text-blue-600">
                  <i class="pi pi-list text-xs"></i>
                  <span class="text-sm">{{ deck.cards.length }} cards</span>
                </div>
                <div class="flex items-center space-x-1 text-green-600">
                  <i class="pi pi-clock text-xs"></i>
                  <span class="text-sm">{{ getDueCardsCount(deck) }} due</span>
                </div>
                <div class="flex items-center space-x-1 text-purple-600">
                  <i class="pi pi-star text-xs"></i>
                  <span class="text-sm capitalize">{{ deck.difficulty }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Deck preview -->
          <div class="text-right">
            <div class="text-sm text-gray-500">~{{ deck.estimatedTime }} min</div>
            <div v-if="deck.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="tag in deck.tags.slice(0, 2)"
                :key="tag"
                class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {{ tag }}
              </span>
              <span v-if="deck.tags.length > 2" class="text-xs text-gray-400">
                +{{ deck.tags.length - 2 }} more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="availableDecks.length === 0" class="text-center py-8">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="pi pi-folder-open text-2xl text-gray-400"></i>
      </div>
      <h4 class="text-lg font-semibold text-gray-600 mb-2">No decks available</h4>
      <p class="text-gray-500">Create some decks first to start studying.</p>
    </div>

    <!-- Selection summary -->
    <div v-if="selectedDecks.length > 0" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 class="font-semibold text-blue-800 mb-2">Study Plan Summary</h4>
      <div class="text-sm text-blue-700">
        <p><strong>{{ selectedDecks.length }}</strong> decks selected</p>
        <p><strong>{{ totalSelectedCards }}</strong> total cards</p>
        <p><strong>{{ totalDueCards }}</strong> cards due for review</p>
        <p>Estimated study time: <strong>~{{ estimatedStudyTime }} minutes</strong></p>
      </div>
    </div>

    <!-- Quick selection buttons -->
    <div class="flex flex-wrap gap-2 mt-6">
      <Button
        @click="selectAll"
        icon="pi pi-check-square"
        label="Select All"
        size="small"
        severity="secondary"
        outlined
      />
      <Button
        @click="selectNone"
        icon="pi pi-square"
        label="Select None"
        size="small"
        severity="secondary"
        outlined
      />
      <Button
        @click="selectByDifficulty('beginner')"
        icon="pi pi-star"
        label="Beginner Only"
        size="small"
        severity="success"
        outlined
      />
      <Button
        @click="selectByDifficulty('intermediate')"
        icon="pi pi-star-half"
        label="Intermediate Only"
        size="small"
        severity="warning"
        outlined
      />
      <Button
        @click="selectByDifficulty('advanced')"
        icon="pi pi-star-fill"
        label="Advanced Only"
        size="small"
        severity="danger"
        outlined
      />
    </div>

    <!-- Save button -->
    <div class="mt-8 flex justify-end">
      <Button
        @click="saveSelection"
        :loading="isSaving"
        icon="pi pi-save"
        label="Save Selection"
        class="bg-blue-600 hover:bg-blue-700 border-blue-600 px-6 py-3 font-semibold"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { useAnkiStore } from '@/stores/anki'
import type { Deck } from '@/types'

const emit = defineEmits<{
  'selection-saved': []
}>()

const authStore = useAuthStore()
const ankiStore = useAnkiStore()

// State
const selectedDecks = ref<string[]>([])
const isSaving = ref(false)

// Get available decks
const availableDecks = computed(() => ankiStore.decks)

// Calculate totals
const totalSelectedCards = computed(() => {
  return availableDecks.value
    .filter(deck => selectedDecks.value.includes(deck.id))
    .reduce((total, deck) => total + deck.cards.length, 0)
})

const totalDueCards = computed(() => {
  return availableDecks.value
    .filter(deck => selectedDecks.value.includes(deck.id))
    .reduce((total, deck) => total + getDueCardsCount(deck), 0)
})

const estimatedStudyTime = computed(() => {
  return availableDecks.value
    .filter(deck => selectedDecks.value.includes(deck.id))
    .reduce((total, deck) => total + deck.estimatedTime, 0)
})

// Get due cards count for a deck
function getDueCardsCount(deck: Deck): number {
  const now = new Date()
  return deck.cards.filter(card => {
    try {
      const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0)
      return !isNaN(reviewDate.getTime()) && reviewDate <= now
    } catch {
      return true
    }
  }).length
}

// Selection functions
function selectAll(): void {
  selectedDecks.value = availableDecks.value.map(deck => deck.id)
}

function selectNone(): void {
  selectedDecks.value = []
}

function selectByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): void {
  selectedDecks.value = availableDecks.value
    .filter(deck => deck.difficulty === difficulty)
    .map(deck => deck.id)
}

// Update selection
function updateSelection(): void {
  // This is called automatically by the checkbox v-model
  console.log('Selection updated:', selectedDecks.value.length, 'decks selected')
}

// Save selection
async function saveSelection(): Promise<void> {
  if (!authStore.isAuthenticated) return

  try {
    isSaving.value = true

    // Update user's selected decks
    authStore.updateSelectedDecks(selectedDecks.value)

    emit('selection-saved')

    console.log('✅ Deck selection saved successfully')
  } catch (error) {
    console.error('❌ Error saving deck selection:', error)
  } finally {
    isSaving.value = false
  }
}

// Load user's current selection
function loadCurrentSelection(): void {
  if (authStore.isAuthenticated) {
    selectedDecks.value = [...authStore.selectedDeckIds]
    console.log('Loaded current selection:', selectedDecks.value.length, 'decks')
  }
}

// Watch for auth changes
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    loadCurrentSelection()
  } else {
    selectedDecks.value = []
  }
}, { immediate: true })

// Load on mount
onMounted(() => {
  loadCurrentSelection()
})
</script>

<style scoped>
.deck-selection-config {
  max-width: 800px;
}
</style>
