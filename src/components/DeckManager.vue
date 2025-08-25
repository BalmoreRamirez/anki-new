<template>
  <div class="min-h-screen p-4 md:p-6">
    <!-- Header -->
    <div class="mb-8 p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">Deck Manager</h1>
          <p class="text-white/80">Create and manage your learning decks</p>
        </div>
        <Button 
          @click="$emit('back')"
          icon="pi pi-arrow-left"
          label="Back to Dashboard"
          class="bg-blue-500 hover:bg-blue-600 border-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1"
        />
      </div>
    </div>

    <!-- Create New Deck Form -->
    <div class="mb-8">
      <Card class="glassmorphism">
        <template #header>
          <div class="p-6 pb-0">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
              <i class="pi mr-3 text-blue-600" :class="isEditing ? 'pi-pencil' : 'pi-plus-circle'"></i>
              {{ isEditing ? 'Edit Deck' : 'Create New Deck' }}
            </h2>
          </div>
        </template>
        <template #content>
          <div class="p-6 pt-0">
            <form @submit.prevent="saveDeck" class="space-y-6">
              <div class="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
                <!-- Deck Name -->
                <div class="flex-1">
                  <label for="deckName" class="block text-sm font-medium text-gray-700 mb-2">
                    Deck Name *
                  </label>
                  <InputText
                    id="deckName"
                    v-model="deckForm.name"
                    placeholder="Enter deck name"
                    required
                    class="w-full"
                  />
                </div>

                <!-- Deck Category -->
                <div class="flex-1">
                  <label for="deckCategory" class="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Dropdown
                    id="deckCategory"
                    v-model="deckForm.category"
                    :options="categories"
                    placeholder="Select category"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Deck Description -->
              <div>
                <label for="deckDescription" class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  id="deckDescription"
                  v-model="deckForm.description"
                  placeholder="Enter deck description"
                  rows="3"
                  class="w-full"
                />
              </div>

              <!-- Form Actions -->
              <div class="flex justify-end">
                <Button 
                  type="submit"
                  :icon="isEditing ? 'pi pi-check' : 'pi pi-plus'"
                  :label="isEditing ? 'Update Deck' : 'Create Deck'"
                  :disabled="!deckForm.name.trim()"
                  class="bg-green-500 hover:bg-green-600 border-green-500 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </form>
          </div>
        </template>
      </Card>
    </div>

    <!-- Existing Decks -->
    <div v-if="decks.length > 0">
      <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
        <i class="pi pi-folder mr-3"></i>
        Your Decks ({{ decks.length }})
      </h2>

      <div class="space-y-4">
        <Card 
          v-for="deck in decks" 
          :key="deck.id" 
          class="glassmorphism hover:scale-[1.02] transition-all duration-300"
        >
          <template #content>
            <div class="p-6">
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <!-- Deck Info -->
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-gray-800 mb-2">{{ deck.name }}</h3>
                  <p class="text-gray-600 mb-3 max-w-2xl">{{ deck.description || 'No description' }}</p>
                  
                  <!-- Deck Stats -->
                  <div class="flex flex-wrap gap-3">
                    <div class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                      <i class="pi pi-list text-blue-600"></i>
                      <span class="text-sm font-medium text-blue-800">{{ deck.cards.length }} cards</span>
                    </div>
                    <div class="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-lg">
                      <i class="pi pi-calendar text-purple-600"></i>
                      <span class="text-sm font-medium text-purple-800">
                        Created {{ formatDate(deck.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:ml-4">
                  <Button 
                    @click="$emit('manage-cards', deck)"
                    icon="pi pi-cog"
                    label="Manage Cards"
                    class="bg-purple-500 hover:bg-purple-600 border-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1"
                  />
                  <Button 
                    @click="confirmDeleteDeck(deck)"
                    icon="pi pi-trash"
                    label="Delete"
                    class="bg-red-500 hover:bg-red-600 border-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1"
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
        <i class="pi pi-folder-open text-4xl text-white/60"></i>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">No decks created yet</h3>
      <p class="text-white/70 mb-6 max-w-md mx-auto">
        Create your first deck using the form above to start organizing your flashcards
      </p>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="deleteDialogVisible" 
      modal 
      header="Confirm Deletion"
      :style="{ width: '450px' }"
    >
      <template #header>
        <div class="flex items-center space-x-3">
          <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
          <span class="font-semibold text-gray-800">Confirm Deletion</span>
        </div>
      </template>
      
      <div class="py-4">
        <p class="text-gray-700 mb-4">
          Are you sure you want to delete the deck <strong>"{{ deckToDelete?.name }}"</strong>?
        </p>
        <p class="text-sm text-red-600">
          This action cannot be undone. All cards in this deck will be permanently deleted.
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button 
            @click="deleteDialogVisible = false"
            label="Cancel"
            icon="pi pi-times"
            class="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
          />
          <Button 
            @click="deleteDeck"
            label="Delete"
            icon="pi pi-trash"
            class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import type { Deck } from '@/types'

interface Props {
  decks: Deck[]
  editingDeck?: Deck | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'create-deck': [deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>]
  'update-deck': [deck: { id: string; name: string; description?: string }]
  'delete-deck': [id: string]
  'manage-cards': [deck: Deck]
  'back': []
}>()

const categories = [
  'English Grammar',
  'Vocabulary',
  'Pronunciation',
  'Business English',
  'Academic English',
  'Conversation',
  'Phrasal Verbs',
  'Idioms',
  'Other'
]

const deckForm = reactive({
  name: '',
  description: '',
  category: ''
})

const deleteDialogVisible = ref(false)
const deckToDelete = ref<Deck | null>(null)

const isEditing = computed(() => !!props.editingDeck)

// Watch for editing deck changes to populate form
watch(() => props.editingDeck, (editingDeck) => {
  if (editingDeck) {
    deckForm.name = editingDeck.name
    deckForm.description = editingDeck.description || ''
    deckForm.category = 'Other' // Default category since it's not stored in deck
  } else {
    // Reset form when not editing
    deckForm.name = ''
    deckForm.description = ''
    deckForm.category = ''
  }
}, { immediate: true })

function saveDeck() {
  if (!deckForm.name.trim()) return

  if (isEditing.value && props.editingDeck) {
    // Editing existing deck
    const updatedDeck = {
      id: props.editingDeck.id,
      name: deckForm.name.trim(),
      description: deckForm.description.trim() || undefined
    }
    
    emit('update-deck', updatedDeck)
  } else {
    // Creating new deck
    const newDeck = {
      name: deckForm.name.trim(),
      description: deckForm.description.trim() || undefined,
      cards: []
    }
    
    emit('create-deck', newDeck)
  }

  // Reset form
  deckForm.name = ''
  deckForm.description = ''
  deckForm.category = ''
}

function confirmDeleteDeck(deck: Deck) {
  deckToDelete.value = deck
  deleteDialogVisible.value = true
}

function deleteDeck() {
  if (deckToDelete.value) {
    emit('delete-deck', deckToDelete.value.id)
    deleteDialogVisible.value = false
    deckToDelete.value = null
  }
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