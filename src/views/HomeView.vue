<template>
  <main class="home-view">
    <!-- Modo Dashboard -->
    <Dashboard 
      v-if="currentMode === 'dashboard'"
      :decks="ankiStore.decks"
      @study-deck="handleStudyDeck"
      @create-deck="currentMode = 'decks'"
      @edit-deck="editDeck"
      @delete-deck="deleteDeck"
      @manage-cards="manageCards"
    />

    <!-- Modo Gestión de Barajas -->
        <!-- Modo Gestión de Barajas -->
    <DeckManager 
      v-else-if="currentMode === 'decks'"
      :decks="ankiStore.decks"
      :editing-deck="selectedDeck"
      @create-deck="createDeck"
      @update-deck="updateDeck"
      @delete-deck="deleteDeck"
      @manage-cards="manageCards"
      @back="currentMode = 'dashboard'"
    />

    <!-- Modo Gestión de Tarjetas -->
    <CardManager 
      v-else-if="currentMode === 'cards'"
      :deck="selectedDeck"
      @back="currentMode = 'decks'"
      @add-card="addCard"
      @update-card="updateCard"
      @delete-card="deleteCard"
    />

    <!-- Modo Estudio -->
    <div v-else-if="currentMode === 'study'" class="study-mode">
      <div class="study-header mb-4">
        <div class="flex justify-content-between align-items-center">
          <h2>Studying: {{ selectedDeck?.name }}</h2>
          <Button 
            label="End Session" 
            icon="pi pi-times" 
            severity="secondary"
            @click="endStudySession"
          />
        </div>
        <ProgressBar 
          :value="studyProgress" 
          class="mt-2"
        />
        <p class="text-sm text-500 mt-1">
          {{ ankiStore.currentSession?.completedCards || 0 }} completed ({{ ankiStore.currentSession?.cardsToReview.length || 0 }} remaining)
        </p>
      </div>

      <FlashCard 
        v-if="currentCard && selectedDeck"
        :card="currentCard"
        :deck-name="selectedDeck.name"
        :current-card-index="ankiStore.currentSession?.currentCardIndex || 0"
        :total-cards="ankiStore.currentSession?.cardsToReview.length || 0"
        :remaining-cards="ankiStore.currentSession?.cardsToReview.length || 0"
        :completed-cards="ankiStore.currentSession?.completedCards || 0"
        :original-total="ankiStore.currentSession?.totalCards || 0"
        @review="handleReview"
        @exit="endStudySession"
      />

      <div v-else class="study-complete text-center py-6">
        <i class="pi pi-check-circle text-6xl text-green-500 mb-3 block"></i>
        <h3 class="text-2xl mb-2">Study Session Complete!</h3>
        <p class="text-500 mb-4">Great job! You've reviewed all cards.</p>
        <div class="flex justify-content-center gap-2">
          <Button 
            label="Back to Dashboard" 
            icon="pi pi-home" 
            @click="currentMode = 'dashboard'"
          />
          <Button 
            label="Study Another Deck" 
            icon="pi pi-refresh" 
            severity="secondary"
            @click="currentMode = 'decks'"
          />
        </div>
      </div>
    </div>

    <!-- Navegación inferior -->
    <div class="bottom-nav" v-if="currentMode !== 'study'">
      <Button 
        :class="{ 'active': currentMode === 'dashboard' }"
        icon="pi pi-home" 
        text
        @click="currentMode = 'dashboard'"
      />
      <Button 
        :class="{ 'active': currentMode === 'decks' }"
        icon="pi pi-folder" 
        text
        @click="currentMode = 'decks'"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnkiStore } from '../stores/anki'
import Dashboard from '../components/Dashboard.vue'
import DeckManager from '../components/DeckManager.vue'
import CardManager from '../components/CardManager.vue'
import FlashCard from '../components/FlashCard.vue'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import type { ReviewResponse, Deck } from '../types'

const ankiStore = useAnkiStore()

const currentMode = ref<'dashboard' | 'decks' | 'cards' | 'study'>('dashboard')
const selectedDeckId = ref<string | null>(null)

const selectedDeck = computed(() => {
  if (!selectedDeckId.value) return null
  return ankiStore.getDeckById(selectedDeckId.value) || null
})

const currentCard = computed(() => {
  if (!ankiStore.currentSession) return null
  const session = ankiStore.currentSession
  return session.cardsToReview[session.currentCardIndex]
})

const studyProgress = computed(() => {
  if (!ankiStore.currentSession) return 0
  const session = ankiStore.currentSession
  return (session.completedCards / session.totalCards) * 100
})

onMounted(() => {
  ankiStore.loadFromLocalStorage()
  ankiStore.initializeDefaultData()
  console.log('Decks loaded:', ankiStore.decks.length)
  ankiStore.decks.forEach(deck => {
    console.log('Deck:', deck.name, 'Cards:', deck.cards.length)
  })
})

function startStudySession(deckId: string) {
  const success = ankiStore.startReviewSession(deckId)
  if (success) {
    selectedDeckId.value = deckId
    currentMode.value = 'study'
  } else {
    // No hay tarjetas para revisar
    console.log('No cards to review')
  }
}

function handleStudyDeck(deck: Deck) {
  startStudySession(deck.id)
}

function editDeck(deck: Deck) {
  // Navegar a modo deck manager con deck seleccionado para editar
  selectedDeckId.value = deck.id
  currentMode.value = 'decks'
}

function endStudySession() {
  ankiStore.endReviewSession()
  currentMode.value = 'dashboard'
}

function manageCards(deck: Deck) {
  selectedDeckId.value = deck.id
  currentMode.value = 'cards'
}

function handleReview(cardId: string, rating: number) {
  // Convertir rating numérico a ReviewResponse
  let response: ReviewResponse
  switch (rating) {
    case 1:
      response = 'again'
      break
    case 2:
      response = 'hard'
      break
    case 3:
      response = 'good'
      break
    case 4:
      response = 'easy'
      break
    default:
      response = 'good'
  }
  
  ankiStore.reviewCard(response)
  
  // Si la sesión terminó, volver al dashboard
  if (!ankiStore.currentSession) {
    currentMode.value = 'dashboard'
  }
}

function createDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) {
  ankiStore.createDeck(deck.name, deck.description)
  currentMode.value = 'dashboard'
}

function updateDeck(deck: { id: string; name: string; description?: string }) {
  ankiStore.updateDeck(deck.id, deck.name, deck.description)
  selectedDeckId.value = null
  currentMode.value = 'dashboard'
}

function deleteDeck(id: string) {
  ankiStore.deleteDeck(id)
}

function addCard(spanish: string, english: string, pronunciation?: string, examples?: string[]) {
  if (selectedDeckId.value) {
    ankiStore.addCard(selectedDeckId.value, spanish, english, pronunciation, examples)
  }
}

function updateCard(cardId: string, spanish: string, english: string, pronunciation?: string, examples?: string[]) {
  // Implementar en el store
  console.log('Update card:', cardId, spanish, english, pronunciation, examples)
}

function deleteCard(cardId: string) {
  ankiStore.deleteCard(cardId)
}

function startRandomStudy() {
  // Implementar estudio aleatorio
  console.log('Random study not implemented yet')
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  padding: 1rem;
  padding-bottom: 100px; /* Espacio para navegación inferior */
}

.study-mode {
  max-width: 800px;
  margin: 0 auto;
}

.study-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.study-header h2 {
  margin: 0;
  color: #1f2937;
  font-weight: 600;
  font-size: 1.5rem;
}

.study-header .p-progressbar {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  overflow: hidden;
}

.study-header .p-progressbar .p-progressbar-value {
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
}

.study-complete {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.study-complete i {
  color: #10b981;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.3));
}

.study-complete h3 {
  color: #1f2937;
  font-weight: 700;
  margin-bottom: 1rem;
}

.study-complete p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.study-complete .flex {
  justify-content: center;
  flex-wrap: wrap;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(229, 231, 235, 0.8);
  padding: 1rem;
  display: flex;
  justify-content: center;
  gap: 3rem;
  z-index: 1000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.bottom-nav .p-button {
  border-radius: 50%;
  width: 3.5rem;
  height: 3.5rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  color: #6b7280;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav .p-button:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bottom-nav .p-button.active {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.bottom-nav .p-button i {
  font-size: 1.25rem;
}

/* Responsividad mejorada */
@media (max-width: 768px) {
  .home-view {
    padding: 0.5rem;
    padding-bottom: 90px;
  }
  
  .study-header {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .study-header h2 {
    font-size: 1.25rem;
  }
  
  .study-header .flex {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .study-complete {
    padding: 2rem 1rem;
  }
  
  .study-complete h3 {
    font-size: 1.5rem;
  }
  
  .study-complete p {
    font-size: 1rem;
  }
  
  .study-complete .flex {
    flex-direction: column;
    gap: 1rem;
  }
  
  .bottom-nav {
    padding: 0.75rem;
    gap: 2rem;
  }
  
  .bottom-nav .p-button {
    width: 3rem;
    height: 3rem;
  }
  
  .bottom-nav .p-button i {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .study-complete {
    padding: 1.5rem 0.75rem;
  }
  
  .study-complete i {
    font-size: 4rem;
  }
  
  .study-complete h3 {
    font-size: 1.25rem;
  }
  
  .bottom-nav {
    gap: 1.5rem;
  }
  
  .bottom-nav .p-button {
    width: 2.75rem;
    height: 2.75rem;
  }
  
  .bottom-nav .p-button i {
    font-size: 1rem;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.study-header,
.study-complete {
  animation: fadeInUp 0.4s ease-out;
}

.bottom-nav {
  animation: fadeInUp 0.6s ease-out;
}
</style>
