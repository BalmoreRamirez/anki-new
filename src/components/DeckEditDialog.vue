<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="isEditing ? 'Edit Deck' : 'Create New Deck'"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-2xl"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Deck Name *
        </label>
         if (isEditing.value) {
      await ankiStore.updateCompleteDeck(deckData)
    } else {
      await ankiStore.createCompleteDeck(deckData)
    }nputText
          id="name"
          v-model="formData.name"
          :class="{ 'p-invalid': errors.name }"
          placeholder="Enter deck name"
          class="w-full"
          required
        />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Textarea
          id="description"
          v-model="formData.description"
          placeholder="Enter deck description"
          class="w-full"
          :rows="3"
        />
      </div>

      <!-- Category -->
      <div>
        <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <Dropdown
          id="category"
          v-model="formData.category"
          :options="categoryOptions"
          placeholder="Select category"
          class="w-full"
          editable
        />
      </div>

      <!-- Difficulty -->
      <div>
        <label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">
          Difficulty Level *
        </label>
        <Dropdown
          id="difficulty"
          v-model="formData.difficulty"
          :options="difficultyOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select difficulty"
          class="w-full"
        />
      </div>

      <!-- Tags -->
      <div>
        <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <Chips
          id="tags"
          v-model="formData.tags"
          placeholder="Add tags (press Enter)"
          class="w-full"
        />
        <small class="text-gray-500">Press Enter to add each tag</small>
      </div>

      <!-- Estimated Time -->
      <div>
        <label for="estimatedTime" class="block text-sm font-medium text-gray-700 mb-1">
          Estimated Study Time (minutes)
        </label>
        <InputNumber
          id="estimatedTime"
          v-model="formData.estimatedTime"
          :min="5"
          :max="300"
          placeholder="30"
          class="w-full"
        />
      </div>

      <!-- Public/Private -->
      <div class="flex items-center space-x-2">
        <Checkbox
          id="isPublic"
          v-model="formData.isPublic"
          binary
        />
        <label for="isPublic" class="text-sm font-medium text-gray-700">
          Make this deck public (visible to all users)
        </label>
      </div>

      <!-- Cards Section (for editing existing deck) -->
      <div v-if="isEditing && formData.cards.length > 0" class="space-y-4">
        <div class="border-t border-gray-200 pt-4">
          <h4 class="text-lg font-medium text-gray-900 mb-3">Cards ({{ formData.cards.length }})</h4>
          
          <div class="max-h-60 overflow-y-auto space-y-2">
            <div
              v-for="card in formData.cards"
              :key="card.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ card.spanish }}</p>
                <p class="text-sm text-gray-600">{{ card.english }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <Tag
                  :value="card.difficulty"
                  :severity="
                    card.difficulty === 'easy' ? 'success' :
                    card.difficulty === 'medium' ? 'warning' : 'danger'
                  "
                />
                <Button
                  @click="removeCard(card.id)"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  rounded
                />
              </div>
            </div>
          </div>

          <div class="mt-3">
            <Button
              @click="showAddCardDialog = true"
              icon="pi pi-plus"
              label="Add Card"
              size="small"
              severity="success"
              outlined
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          @click="handleCancel"
          label="Cancel"
          severity="secondary"
          outlined
        />
        <Button
          type="submit"
          :loading="isLoading"
          :label="isEditing ? 'Update Deck' : 'Create Deck'"
          severity="primary"
        />
      </div>
    </form>

    <!-- Add Card Dialog -->
    <Dialog
      v-model:visible="showAddCardDialog"
      header="Add New Card"
      :modal="true"
      :closable="true"
      class="w-full max-w-md"
    >
      <form @submit.prevent="addCard" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Spanish *
          </label>
          <InputText
            v-model="newCard.spanish"
            placeholder="Enter Spanish word/phrase"
            class="w-full"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            English *
          </label>
          <InputText
            v-model="newCard.english"
            placeholder="Enter English translation"
            class="w-full"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Pronunciation
          </label>
          <InputText
            v-model="newCard.pronunciation"
            placeholder="Enter pronunciation (optional)"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <Dropdown
            v-model="newCard.difficulty"
            :options="cardDifficultyOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select difficulty"
            class="w-full"
          />
        </div>

        <div class="flex justify-end space-x-3">
          <Button
            type="button"
            @click="showAddCardDialog = false"
            label="Cancel"
            severity="secondary"
            outlined
          />
          <Button
            type="submit"
            label="Add Card"
            severity="primary"
          />
        </div>
      </form>
    </Dialog>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Chips from 'primevue/chips'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useAnkiStore } from '@/stores/anki'
import type { Deck, Flashcard } from '@/types'

interface Props {
  visible: boolean
  deck?: Deck | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'deck-saved': [deck: Deck]
}>()

const ankiStore = useAnkiStore()

// State
const isLoading = ref(false)
const showAddCardDialog = ref(false)
const errors = ref<Record<string, string>>({})

const formData = reactive({
  name: '',
  description: '',
  category: '',
  difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  tags: [] as string[],
  estimatedTime: 30,
  isPublic: false,
  cards: [] as Flashcard[]
})

const newCard = reactive({
  spanish: '',
  english: '',
  pronunciation: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard'
})

const categoryOptions = [
  'Language Learning',
  'Business',
  'Academic',
  'Travel',
  'Technology',
  'Medicine',
  'Science',
  'History',
  'Literature',
  'Other'
]

const difficultyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' }
]

const cardDifficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' }
]

// Computed
const isEditing = computed(() => !!props.deck)

// Methods
function resetForm() {
  formData.name = ''
  formData.description = ''
  formData.category = ''
  formData.difficulty = 'beginner'
  formData.tags = []
  formData.estimatedTime = 30
  formData.isPublic = false
  formData.cards = []
  errors.value = {}
}

function populateForm(deck: Deck) {
  formData.name = deck.name
  formData.description = deck.description || ''
  formData.category = deck.category
  formData.difficulty = deck.difficulty
  formData.tags = [...deck.tags]
  formData.estimatedTime = deck.estimatedTime
  formData.isPublic = deck.isPublic
  formData.cards = [...deck.cards]
}

function validateForm(): boolean {
  errors.value = {}

  if (!formData.name.trim()) {
    errors.value.name = 'Deck name is required'
  }

  if (!formData.category.trim()) {
    errors.value.category = 'Category is required'
  }

  return Object.keys(errors.value).length === 0
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function addCard() {
  if (!newCard.spanish.trim() || !newCard.english.trim()) return

  const card: Flashcard = {
    id: generateId(),
    spanish: newCard.spanish.trim(),
    english: newCard.english.trim(),
    pronunciation: newCard.pronunciation.trim() || undefined,
    deckId: props.deck?.id || '',
    difficulty: newCard.difficulty,
    nextReviewDate: new Date(),
    reviewCount: 0,
    easeFactor: 2.5,
    interval: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  formData.cards.push(card)

  // Reset new card form
  newCard.spanish = ''
  newCard.english = ''
  newCard.pronunciation = ''
  newCard.difficulty = 'medium'

  showAddCardDialog.value = false
}

function removeCard(cardId: string) {
  const index = formData.cards.findIndex(card => card.id === cardId)
  if (index !== -1) {
    formData.cards.splice(index, 1)
  }
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    isLoading.value = true

    const deckData: Deck = {
      id: props.deck?.id || generateId(),
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      difficulty: formData.difficulty,
      tags: formData.tags,
      estimatedTime: formData.estimatedTime,
      isPublic: formData.isPublic,
      cards: formData.cards.map(card => ({
        ...card,
        deckId: props.deck?.id || generateId()
      })),
      createdAt: props.deck?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (isEditing.value) {
      // Para edición, usar updateDeck básico por ahora
      await ankiStore.updateDeck(deckData.id, deckData.name, deckData.description)
    } else {
      await ankiStore.createCompleteDeck(deckData)
    }

    emit('deck-saved', deckData)
    emit('update:visible', false)
  } catch (error) {
    console.error('Error saving deck:', error)
    if (error instanceof Error) {
      errors.value.general = error.message
    }
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}

// Watchers
watch(() => props.visible, (newValue) => {
  if (newValue) {
    if (props.deck) {
      populateForm(props.deck)
    } else {
      resetForm()
    }
  }
})
</script>
