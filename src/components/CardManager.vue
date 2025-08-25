<template>
  <div class="min-h-screen p-4 md:p-6">
    <!-- Header -->
    <div class="mb-8 p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">{{ deck.name }}</h1>
          <p class="text-white/80">Manage cards in this deck</p>
        </div>
        <Button 
          @click="$emit('back')"
          icon="pi pi-arrow-left"
          label="Back to Decks"
          class="bg-blue-500 hover:bg-blue-600 border-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1"
        />
      </div>
    </div>

    <!-- Add/Edit Card Form -->
    <div class="mb-8">
      <Card class="glassmorphism">
        <template #header>
          <div class="p-6 pb-0">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
              <i class="pi pi-plus-circle mr-3 text-blue-600"></i>
              {{ editingCard ? 'Edit Card' : 'Add New Card' }}
            </h2>
          </div>
        </template>
        <template #content>
          <div class="p-6 pt-0">
            <form @submit.prevent="saveCard" class="space-y-6">
              <div class="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
                <!-- Front side -->
                <div class="flex-1">
                  <label for="cardFront" class="block text-sm font-medium text-gray-700 mb-2">
                    Front (Question) *
                  </label>
                  <InputText
                    id="cardFront"
                    v-model="cardForm.front"
                    placeholder="Enter the question or word"
                    required
                    class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>

                <!-- Back side -->
                <div class="flex-1">
                  <label for="cardBack" class="block text-sm font-medium text-gray-700 mb-2">
                    Back (Answer) *
                  </label>
                  <InputText
                    id="cardBack"
                    v-model="cardForm.back"
                    placeholder="Enter the answer or translation"
                    required
                    class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <!-- Pronunciation -->
              <div>
                <label for="cardPronunciation" class="block text-sm font-medium text-gray-700 mb-2">
                  Pronunciation (Optional)
                </label>
                <InputText
                  id="cardPronunciation"
                  v-model="cardForm.pronunciation"
                  placeholder="e.g., /ˈɪrɪɡjʊlər/"
                  class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <!-- Examples -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Examples (Optional)
                </label>
                <div class="space-y-3">
                  <div 
                    v-for="(example, index) in cardForm.examples" 
                    :key="index"
                    class="flex space-x-3"
                  >
                    <InputText
                      v-model="cardForm.examples[index]"
                      placeholder="Enter an example sentence"
                      class="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />
                    <Button 
                      @click="removeExample(index)"
                      icon="pi pi-trash"
                      class="bg-red-500 hover:bg-red-600 border-red-500 text-white p-3 rounded-lg transition-all duration-200"
                      v-tooltip="'Remove example'"
                    />
                  </div>
                  <Button 
                    @click="addExample"
                    icon="pi pi-plus"
                    label="Add Example"
                    class="bg-gray-500 hover:bg-gray-600 border-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  />
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <Button 
                  v-if="editingCard"
                  @click="cancelEdit"
                  type="button"
                  icon="pi pi-times"
                  label="Cancel"
                  class="bg-gray-500 hover:bg-gray-600 border-gray-500 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1"
                />
                <Button 
                  type="submit"
                  :icon="editingCard ? 'pi pi-save' : 'pi pi-plus'"
                  :label="editingCard ? 'Update Card' : 'Add Card'"
                  :disabled="!cardForm.front.trim() || !cardForm.back.trim()"
                  class="bg-green-500 hover:bg-green-600 border-green-500 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </form>
          </div>
        </template>
      </Card>
    </div>

    <!-- Cards List -->
    <div v-if="deck.cards.length > 0">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-2xl font-bold text-white mb-4 sm:mb-0 flex items-center">
          <i class="pi pi-list mr-3"></i>
          Cards in Deck ({{ deck.cards.length }})
        </h2>
        
        <!-- Search and Filter -->
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <InputText
            v-model="searchQuery"
            placeholder="Search cards..."
            class="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
          <Dropdown
            v-model="filterOption"
            :options="filterOptions"
            placeholder="Filter by status"
            class="min-w-[150px]"
          />
        </div>
      </div>

      <div class="space-y-4">
        <Card 
          v-for="card in filteredCards" 
          :key="card.id" 
          class="glassmorphism hover:scale-[1.01] transition-all duration-300"
        >
          <template #content>
            <div class="p-6">
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <!-- Card Content -->
                <div class="flex-1">
                  <div class="flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
                    <!-- Front -->
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Front</h4>
                      <p class="text-lg font-semibold text-gray-800">{{ card.front }}</p>
                      <p v-if="card.pronunciation" class="text-sm text-gray-600 font-mono mt-1">
                        {{ card.pronunciation }}
                      </p>
                    </div>
                    
                    <!-- Back -->
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Back</h4>
                      <p class="text-lg font-semibold text-gray-800">{{ card.back }}</p>
                    </div>
                  </div>

                  <!-- Examples -->
                  <div v-if="card.examples && card.examples.length > 0" class="mt-4">
                    <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Examples</h4>
                    <div class="space-y-1">
                      <p 
                        v-for="(example, index) in card.examples" 
                        :key="index"
                        class="text-sm text-gray-700 italic"
                      >
                        {{ example }}
                      </p>
                    </div>
                  </div>

                  <!-- Card Stats -->
                  <div class="mt-4 flex flex-wrap gap-2">
                    <div class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                      <i class="pi pi-star text-blue-600"></i>
                      <span class="text-sm font-medium text-blue-800">
                        Ease: {{ card.easeFactor.toFixed(2) }}
                      </span>
                    </div>
                    <div class="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg">
                      <i class="pi pi-refresh text-green-600"></i>
                      <span class="text-sm font-medium text-green-800">
                        Reviews: {{ card.reviewCount }}
                      </span>
                    </div>
                    <div v-if="card.lastReviewed" class="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-lg">
                      <i class="pi pi-calendar text-purple-600"></i>
                      <span class="text-sm font-medium text-purple-800">
                        Last: {{ formatDate(card.lastReviewed) }}
                      </span>
                    </div>
                    <div v-if="card.nextReview" class="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-lg">
                      <i class="pi pi-clock text-orange-600"></i>
                      <span class="text-sm font-medium text-orange-800">
                        Next: {{ formatDate(card.nextReview) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-6">
                  <Button 
                    @click="editCard(card)"
                    icon="pi pi-pencil"
                    label="Edit"
                    class="bg-blue-500 hover:bg-blue-600 border-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1"
                    v-tooltip="'Edit card'"
                  />
                  <Button 
                    @click="resetCardProgress(card)"
                    icon="pi pi-refresh"
                    label="Reset"
                    class="bg-yellow-500 hover:bg-yellow-600 border-yellow-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1"
                    v-tooltip="'Reset learning progress'"
                  />
                  <Button 
                    @click="confirmDeleteCard(card)"
                    icon="pi pi-trash"
                    label="Delete"
                    class="bg-red-500 hover:bg-red-600 border-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1"
                    v-tooltip="'Delete card'"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="pi pi-file-o text-4xl text-white/60"></i>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">No cards in this deck</h3>
      <p class="text-white/70 mb-6 max-w-md mx-auto">
        Add your first card using the form above to start creating flashcards
      </p>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="deleteDialogVisible" 
      modal 
      header="Confirm Deletion"
      :style="{ width: '450px' }"
      class="glassmorphism"
    >
      <template #header>
        <div class="flex items-center space-x-3">
          <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
          <span class="font-semibold text-gray-800">Confirm Deletion</span>
        </div>
      </template>
      
      <div class="py-4">
        <p class="text-gray-700 mb-4">
          Are you sure you want to delete this card?
        </p>
        <div v-if="cardToDelete" class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-400">
          <p class="font-medium text-gray-800">{{ cardToDelete.front }}</p>
          <p class="text-gray-600">{{ cardToDelete.back }}</p>
        </div>
        <p class="text-sm text-red-600 mt-4">
          This action cannot be undone.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button 
            @click="deleteDialogVisible = false"
            label="Cancel"
            icon="pi pi-times"
            class="bg-gray-500 hover:bg-gray-600 border-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          />
          <Button 
            @click="deleteCard"
            label="Delete"
            icon="pi pi-trash"
            class="bg-red-500 hover:bg-red-600 border-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import type { Deck, Flashcard } from '@/types'

interface Props {
  deck: Deck
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-card': [card: Omit<Flashcard, 'id' | 'createdAt'>]
  'update-card': [card: Flashcard]
  'delete-card': [cardId: string]
  'reset-card': [cardId: string]
  'back': []
}>()

const cardForm = reactive({
  front: '',
  back: '',
  pronunciation: '',
  examples: ['']
})

const editingCard = ref<Flashcard | null>(null)
const deleteDialogVisible = ref(false)
const cardToDelete = ref<Flashcard | null>(null)
const searchQuery = ref('')
const filterOption = ref('all')

const filterOptions = [
  { label: 'All Cards', value: 'all' },
  { label: 'New Cards', value: 'new' },
  { label: 'Learning', value: 'learning' },
  { label: 'Mature', value: 'mature' },
  { label: 'Due for Review', value: 'due' }
]

const filteredCards = computed(() => {
  let filtered = props.deck.cards

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(card => 
      card.front.toLowerCase().includes(query) ||
      card.back.toLowerCase().includes(query) ||
      (card.examples && card.examples.some(ex => ex.toLowerCase().includes(query)))
    )
  }

  // Apply status filter
  if (filterOption.value !== 'all') {
    const now = new Date()
    filtered = filtered.filter(card => {
      switch (filterOption.value) {
        case 'new':
          return card.reviewCount === 0
        case 'learning':
          return card.reviewCount > 0 && card.easeFactor < 2.5
        case 'mature':
          return card.reviewCount > 0 && card.easeFactor >= 2.5
        case 'due':
          return !card.nextReview || new Date(card.nextReview) <= now
        default:
          return true
      }
    })
  }

  return filtered
})

function saveCard() {
  if (!cardForm.front.trim() || !cardForm.back.trim()) return

  // Clean up examples
  const cleanExamples = cardForm.examples.filter(ex => ex.trim())

  if (editingCard.value) {
    // Update existing card
    const updatedCard: Flashcard = {
      ...editingCard.value,
      english: cardForm.front.trim(),  // front = english
      spanish: cardForm.back.trim(),   // back = spanish
      pronunciation: cardForm.pronunciation.trim() || undefined,
      examples: cleanExamples.length > 0 ? cleanExamples : undefined,
      updatedAt: new Date()
    }
    emit('update-card', updatedCard)
    editingCard.value = null
  } else {
    // Create new card
    const newCard = {
      english: cardForm.front.trim(),  // front = english
      spanish: cardForm.back.trim(),   // back = spanish
      pronunciation: cardForm.pronunciation.trim() || undefined,
      examples: cleanExamples.length > 0 ? cleanExamples : undefined
    }
    emit('add-card', newCard)
  }

  // Reset form
  resetForm()
}

function editCard(card: Flashcard) {
  editingCard.value = card
  cardForm.front = card.english // English goes to front (what user sees first)
  cardForm.back = card.spanish  // Spanish goes to back (the translation)
  cardForm.pronunciation = card.pronunciation || ''
  cardForm.examples = card.examples ? [...card.examples] : ['']
}

function cancelEdit() {
  editingCard.value = null
  resetForm()
}

function resetForm() {
  cardForm.front = ''
  cardForm.back = ''
  cardForm.pronunciation = ''
  cardForm.examples = ['']
}

function addExample() {
  cardForm.examples.push('')
}

function removeExample(index: number) {
  if (cardForm.examples.length > 1) {
    cardForm.examples.splice(index, 1)
  }
}

function confirmDeleteCard(card: Flashcard) {
  cardToDelete.value = card
  deleteDialogVisible.value = true
}

function deleteCard() {
  if (cardToDelete.value) {
    emit('delete-card', cardToDelete.value.id)
    deleteDialogVisible.value = false
    cardToDelete.value = null
  }
}

function resetCardProgress(card: Flashcard) {
  emit('reset-card', card.id)
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
.glassmorphism {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glassmorphism:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
</style>
