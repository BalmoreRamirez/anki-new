<template>
  <div class="min-h-screen p-4 md:p-6">
    <!-- Header mejorado con Flexbox -->
    <div class="mb-8 p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
      <div class="flex items-center space-x-4">
        <div class="flex-shrink-0 w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
          <i class="pi pi-graduation-cap text-2xl text-white"></i>
        </div>
        <div class="flex-1">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">English Learning</h1>
          <p class="text-white/80 text-lg">Master English with spaced repetition</p>
        </div>
      </div>
    </div>

    <!-- Estadísticas con Flexbox responsivo -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
        <i class="pi pi-chart-line mr-3"></i>
        Your Progress
      </h2>
      <div class="flex flex-wrap gap-4 md:gap-6">
        <!-- Total Cards -->
        <div class="flex-1 min-w-[280px]">
          <Card class="h-full glassmorphism hover:scale-105 transition-transform duration-300">
            <template #content>
              <div class="flex items-center p-6">
                <div class="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <i class="pi pi-list text-white text-xl"></i>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold text-gray-800 mb-1">{{ stats.totalCards }}</div>
                  <div class="text-gray-600 font-medium">Total Cards</div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Reviewed Today -->
        <div class="flex-1 min-w-[280px]">
          <Card class="h-full glassmorphism hover:scale-105 transition-transform duration-300">
            <template #content>
              <div class="flex items-center p-6">
                <div class="flex-shrink-0 w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <i class="pi pi-calendar-check text-white text-xl"></i>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold text-gray-800 mb-1">{{ stats.reviewedToday }}</div>
                  <div class="text-gray-600 font-medium">Reviewed Today</div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Due for Review -->
        <div class="flex-1 min-w-[280px]">
          <Card class="h-full glassmorphism hover:scale-105 transition-transform duration-300">
            <template #content>
              <div class="flex items-center p-6">
                <div class="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                  <i class="pi pi-clock text-white text-xl"></i>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold text-gray-800 mb-1">{{ stats.dueForReview }}</div>
                  <div class="text-gray-600 font-medium">Due for Review</div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Study Streak -->
        <div class="flex-1 min-w-[280px]">
          <Card class="h-full glassmorphism hover:scale-105 transition-transform duration-300">
            <template #content>
              <div class="flex items-center p-6">
                <div class="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <i class="pi pi-star text-white text-xl"></i>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold text-gray-800 mb-1">{{ stats.studyStreak }}</div>
                  <div class="text-gray-600 font-medium">Day Streak</div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Decks con Flexbox responsivo -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 class="text-2xl font-bold text-white mb-4 sm:mb-0 flex items-center">
          <i class="pi pi-folder mr-3"></i>
          Your Decks
        </h2>
        <Button 
          @click="$emit('create-deck')" 
          icon="pi pi-plus" 
          label="Create Deck"
          class="bg-green-500 hover:bg-green-600 border-green-500 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 hover:-translate-y-1"
        />
      </div>

      <div class="flex flex-wrap gap-6">
        <div v-for="deck in decks" :key="deck.id" class="flex-1 min-w-[320px] max-w-md">
          <Card class="h-full glassmorphism hover:scale-105 transition-all duration-300 cursor-pointer">
            <template #header>
              <div class="p-6 pb-0">
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-800">{{ deck.name }}</h3>
                  <div class="flex space-x-2">
                    <Button 
                      icon="pi pi-pencil" 
                      @click.stop="$emit('edit-deck', deck)"
                      class="p-button-text p-button-sm text-blue-600 hover:bg-blue-50"
                      v-tooltip="'Edit Deck'"
                    />
                    <Button 
                      icon="pi pi-trash" 
                      @click.stop="$emit('delete-deck', deck.id)"
                      class="p-button-text p-button-sm text-red-600 hover:bg-red-50"
                      v-tooltip="'Delete Deck'"
                    />
                  </div>
                </div>
              </div>
            </template>
            <template #content>
              <div class="px-6">
                <p class="text-gray-600 mb-4 h-12 overflow-hidden">{{ deck.description }}</p>
                
                <div class="flex flex-wrap gap-3 mb-6">
                  <div class="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                    <i class="pi pi-list text-blue-600"></i>
                    <span class="text-sm font-medium text-blue-800">{{ deck.cards.length }} cards</span>
                  </div>
                  <div class="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg">
                    <i class="pi pi-clock text-green-600"></i>
                    <span class="text-sm font-medium text-green-800">{{ getDueCards(deck).length }} due</span>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                  <Button 
                    @click="$emit('study-deck', deck)"
                    :disabled="getDueCards(deck).length === 0"
                    :label="getDueCards(deck).length > 0 ? 'Study Now' : 'No cards due'"
                    icon="pi pi-play"
                    class="flex-1 bg-blue-500 hover:bg-blue-600 border-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button 
                    @click="$emit('manage-cards', deck)"
                    icon="pi pi-cog"
                    label="Manage"
                    class="flex-1 bg-gray-500 hover:bg-gray-600 border-gray-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:-translate-y-1"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Empty state cuando no hay decks -->
        <div v-if="decks.length === 0" class="w-full flex flex-col items-center justify-center py-12">
          <div class="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
            <i class="pi pi-folder-open text-4xl text-white/60"></i>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">No decks yet</h3>
          <p class="text-white/70 text-center mb-6 max-w-md">
            Create your first deck to start learning English with spaced repetition
          </p>
          <Button 
            @click="$emit('create-deck')" 
            icon="pi pi-plus" 
            label="Create Your First Deck"
            class="bg-green-500 hover:bg-green-600 border-green-500 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 hover:-translate-y-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import type { Deck } from '@/types'

interface Props {
  decks: Deck[]
}

const props = defineProps<Props>()

defineEmits<{
  'create-deck': []
  'edit-deck': [deck: Deck]
  'delete-deck': [id: string]
  'study-deck': [deck: Deck]
  'manage-cards': [deck: Deck]
}>()

const stats = computed(() => {
  const totalCards = props.decks.reduce((sum, deck) => sum + deck.cards.length, 0)
  const dueForReview = props.decks.reduce((sum, deck) => sum + getDueCards(deck).length, 0)
  const reviewedToday = props.decks.reduce((sum, deck) => {
    return sum + deck.cards.filter(card => {
      const today = new Date().toDateString()
      return card.lastReviewed && new Date(card.lastReviewed).toDateString() === today
    }).length
  }, 0)

  return {
    totalCards,
    dueForReview,
    reviewedToday,
    studyStreak: 7 // Placeholder - implementar lógica real
  }
})

function getDueCards(deck: Deck) {
  const now = new Date()
  return deck.cards.filter(card => !card.nextReview || new Date(card.nextReview) <= now)
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
