<template>
  <div class="min-h-screen p-4 md:p-6">
    <!-- Header con información de progreso -->
    <div class="mb-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">{{ deckName }}</h1>
          <p class="text-white/80">Card {{ currentCardIndex + 1 }} of {{ totalCards }} • {{ remainingCards }} remaining</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="bg-white/30 px-4 py-2 rounded-lg">
            <span class="text-white font-medium">{{ remainingCards }} remaining</span>
          </div>
          <Button 
            @click="$emit('exit')"
            icon="pi pi-times"
            class="bg-red-500 hover:bg-red-600 border-red-500 text-white p-3 rounded-lg transition-all duration-200 hover:-translate-y-1"
            v-tooltip="'Exit Study Session'"
          />
        </div>
      </div>
      <!-- Progress bar -->
      <div class="mt-4">
        <ProgressBar 
          :value="progressPercentage" 
          class="h-2"
        />
      </div>
    </div>

    <!-- Flashcard -->
    <div class="flex justify-center items-center mb-8" style="min-height: 400px;">
      <div class="w-full max-w-2xl">
        <Card 
          class="flashcard glassmorphism-strong cursor-pointer transform transition-all duration-300 hover:scale-105"
          :class="{ 'flipped': isFlipped }"
          @click="flipCard"
        >
          <template #content>
            <div class="min-h-[300px] flex flex-col justify-center items-center p-8">
              <!-- Front side - English question -->
              <div v-if="!isFlipped" class="text-center w-full">
                <div class="mb-6">
                  <h3 class="text-xl text-gray-600 mb-2 uppercase tracking-wide">What does this mean in Spanish?</h3>
                  <h2 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    {{ card.english }}
                  </h2>
                  <div v-if="card.pronunciation" class="flex justify-center items-center space-x-3 mb-4">
                    <span class="text-lg text-gray-600 font-mono">{{ card.pronunciation }}</span>
                    <Button 
                      @click.stop="playPronunciation"
                      icon="pi pi-volume-up"
                      class="p-button-text p-button-sm text-blue-600 hover:bg-blue-50 rounded-lg p-2"
                      v-tooltip="'Play pronunciation'"
                    />
                  </div>
                </div>
                <div class="text-center">
                  <p class="text-gray-500 text-lg mb-4">Click to reveal answer</p>
                  <i class="pi pi-arrow-down text-gray-400 text-2xl animate-bounce"></i>
                </div>
              </div>

              <!-- Back side - Spanish answer -->
              <div v-else class="text-center w-full">
                <div class="mb-6">
                  <h3 class="text-xl text-gray-600 mb-2 uppercase tracking-wide">Significado en Español</h3>
                  <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    {{ card.spanish }}
                  </h2>
                </div>

                <!-- Examples -->
                <div v-if="card.examples && card.examples.length > 0" class="mb-6">
                  <h4 class="text-lg font-semibold text-gray-700 mb-3">Examples:</h4>
                  <div class="space-y-3">
                    <div 
                      v-for="(example, index) in card.examples" 
                      :key="index"
                      class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400"
                    >
                      <p class="text-gray-800 italic">{{ example }}</p>
                    </div>
                  </div>
                </div>

                <!-- Difficulty indicator -->
                <div class="mb-6">
                  <div class="flex items-center justify-center space-x-2 bg-gray-100 p-3 rounded-lg">
                    <i class="pi pi-star text-yellow-500"></i>
                    <span class="text-gray-700 font-medium">
                      Difficulty: {{ getDifficultyText(card.difficulty) }}
                    </span>
                  </div>
                </div>

                <p class="text-gray-500 text-sm">How well did you know this?</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Review buttons -->
    <div v-if="isFlipped" class="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
      <Button 
        @click="reviewCard(1)"
        icon="pi pi-times"
        label="Again"
        class="w-full sm:w-auto bg-red-500 hover:bg-red-600 border-red-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1 shadow-lg"
      />
      <Button 
        @click="reviewCard(2)"
        icon="pi pi-minus"
        label="Hard"
        class="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 border-orange-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1 shadow-lg"
      />
      <Button 
        @click="reviewCard(3)"
        icon="pi pi-check"
        label="Good"
        class="w-full sm:w-auto bg-green-500 hover:bg-green-600 border-green-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1 shadow-lg"
      />
      <Button 
        @click="reviewCard(4)"
        icon="pi pi-star"
        label="Easy"
        class="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 border-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:-translate-y-1 shadow-lg"
      />
    </div>

    <!-- Study statistics -->
    <div class="max-w-4xl mx-auto">
      <Card class="glassmorphism">
        <template #content>
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">Session Statistics</h3>
            <div class="flex flex-wrap justify-center gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ sessionStats.correct }}</div>
                <div class="text-sm text-gray-600">Correct</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ sessionStats.incorrect }}</div>
                <div class="text-sm text-gray-600">Incorrect</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ sessionStats.total }}</div>
                <div class="text-sm text-gray-600">Total Reviewed</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">
                  {{ sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0 }}%
                </div>
                <div class="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import type { Flashcard } from '@/types'

interface Props {
  card: Flashcard
  deckName: string
  currentCardIndex: number
  totalCards: number
  remainingCards: number
  completedCards: number
  originalTotal: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'review': [cardId: string, rating: number]
  'exit': []
}>()

const isFlipped = ref(false)
const sessionStats = ref({
  correct: 0,
  incorrect: 0,
  total: 0
})

const progressPercentage = computed(() => {
  if (props.originalTotal === 0) return 0
  return Math.round((props.completedCards / props.originalTotal) * 100)
})

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function reviewCard(rating: number) {
  // Actualizar estadísticas de sesión
  sessionStats.value.total++
  if (rating >= 3) {
    sessionStats.value.correct++
  } else {
    sessionStats.value.incorrect++
  }

  // Emitir evento de revisión
  emit('review', props.card.id, rating)
  
  // Reset para la siguiente carta
  isFlipped.value = false
}

function playPronunciation() {
  if (!props.card.english || !('speechSynthesis' in window)) return
  
  // Función para reproducir cuando las voces estén listas
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(props.card.english)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 0.9
    
    // Buscar la mejor voz disponible en inglés
    const voices = speechSynthesis.getVoices()
    const preferredVoices = [
      // Voces de alta calidad preferidas
      'Google US English',
      'Microsoft Zira - English (United States)',
      'Microsoft David - English (United States)', 
      'Karen',
      'Daniel',
      'Alex',
      'Samantha'
    ]
    
    let selectedVoice = null
    
    // Buscar voces preferidas
    for (const preferredName of preferredVoices) {
      selectedVoice = voices.find(voice => 
        voice.name.includes(preferredName) && voice.lang.startsWith('en-')
      )
      if (selectedVoice) break
    }
    
    // Si no encontró una voz preferida, usar cualquier voz en inglés
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en-') && 
        (voice.lang === 'en-US' || voice.lang === 'en-GB')
      )
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
      console.log('Using voice:', selectedVoice.name, selectedVoice.lang)
    }
    
    speechSynthesis.speak(utterance)
  }
  
  // Si las voces no están cargadas, esperar a que se carguen
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', speak, { once: true })
  } else {
    speak()
  }
}

function getDifficultyText(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    'easy': 'Easy',
    'medium': 'Medium',
    'hard': 'Hard'
  }
  return difficultyMap[difficulty] || 'Unknown'
}

// Reset flip state when card changes
onMounted(() => {
  isFlipped.value = false
})
</script>

<style scoped>
.flashcard {
  min-height: 350px;
  transition: all 0.3s ease;
}

.flashcard.flipped {
  /* Removed the rotateY transformation that was causing inverted text */
  background: rgba(255, 255, 255, 0.99);
}

.glassmorphism-strong {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.glassmorphism {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .flashcard {
    min-height: 300px;
  }
}
</style>
