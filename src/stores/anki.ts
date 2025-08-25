import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Deck, Flashcard, ReviewSession, StudyStats, ReviewResponse } from '@/types'

export const useAnkiStore = defineStore('anki', () => {
  // State
  const decks = ref<Deck[]>([])
  const currentSession = ref<ReviewSession | null>(null)
  const showAnswer = ref(false)

  // Getters
  const getDeckById = computed(() => {
    return (id: string) => decks.value.find(deck => deck.id === id)
  })

  const getCardsForReview = computed(() => {
    return (deckId: string) => {
      const deck = getDeckById.value(deckId)
      if (!deck) return []
      
      const now = new Date()
      return deck.cards.filter(card => card.nextReviewDate <= now)
    }
  })

  const studyStats = computed((): StudyStats => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let totalCards = 0
    let reviewedToday = 0
    let cardsLearning = 0
    let cardsMature = 0

    decks.value.forEach(deck => {
      totalCards += deck.cards.length
      
      deck.cards.forEach(card => {
        if (card.updatedAt >= today) {
          reviewedToday++
        }
        
        if (card.interval < 21) {
          cardsLearning++
        } else {
          cardsMature++
        }
      })
    })

    return {
      totalCards,
      reviewedToday,
      cardsLearning,
      cardsMature
    }
  })

  // Actions
  function createDeck(name: string, description?: string): string {
    const id = generateId()
    const newDeck: Deck = {
      id,
      name,
      description,
      cards: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    decks.value.push(newDeck)
    saveToLocalStorage()
    return id
  }

  function deleteDeck(deckId: string) {
    const index = decks.value.findIndex(deck => deck.id === deckId)
    if (index !== -1) {
      decks.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  function updateDeck(deckId: string, name: string, description?: string) {
    const deck = getDeckById.value(deckId)
    if (deck) {
      deck.name = name
      deck.description = description
      deck.updatedAt = new Date()
      saveToLocalStorage()
    }
  }

  function addCard(deckId: string, spanish: string, english: string, pronunciation?: string, examples?: string[]) {
    const deck = getDeckById.value(deckId)
    if (!deck) return

    const newCard: Flashcard = {
      id: generateId(),
      spanish,
      english,
      pronunciation,
      examples,
      deckId,
      difficulty: 'medium',
      nextReviewDate: new Date(),
      reviewCount: 0,
      easeFactor: 2.5,
      interval: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    deck.cards.push(newCard)
    deck.updatedAt = new Date()
    saveToLocalStorage()
  }

  function deleteCard(cardId: string) {
    for (const deck of decks.value) {
      const cardIndex = deck.cards.findIndex(card => card.id === cardId)
      if (cardIndex !== -1) {
        deck.cards.splice(cardIndex, 1)
        deck.updatedAt = new Date()
        saveToLocalStorage()
        break
      }
    }
  }

  function startReviewSession(deckId: string) {
    const cardsToReview = getCardsForReview.value(deckId)
    
    if (cardsToReview.length === 0) {
      currentSession.value = null
      return false
    }

    currentSession.value = {
      deckId,
      cardsToReview: [...cardsToReview],
      currentCardIndex: 0,
      totalCards: cardsToReview.length,
      completedCards: 0
    }

    showAnswer.value = false
    return true
  }

  function endReviewSession() {
    currentSession.value = null
    showAnswer.value = false
  }

  function toggleAnswer() {
    showAnswer.value = !showAnswer.value
  }

  function reviewCard(response: ReviewResponse) {
    if (!currentSession.value) return

    const session = currentSession.value
    const card = session.cardsToReview[session.currentCardIndex]
    
    // Aplicar algoritmo de sesión intensiva
    updateCardForIntensiveSession(card, response)

    // Lógica de reordenamiento para sesión intensiva
    if (response === 'easy') {
      // Tarjeta completada - remover de la sesión
      session.cardsToReview.splice(session.currentCardIndex, 1)
      session.completedCards++
      
      // Ajustar índice si es necesario
      if (session.currentCardIndex >= session.cardsToReview.length && session.cardsToReview.length > 0) {
        session.currentCardIndex = 0
      }
    } else {
      // Tarjeta necesita más práctica - mover al final de la cola
      const currentCard = session.cardsToReview.splice(session.currentCardIndex, 1)[0]
      
      // Determinar posición según dificultad
      let insertPosition: number
      switch (response) {
        case 'again':
          // Volver a aparecer pronto (después de 1-2 tarjetas)
          insertPosition = Math.min(session.currentCardIndex + 1 + Math.floor(Math.random() * 2), session.cardsToReview.length)
          break
        case 'hard':
          // Aparecer después de algunas tarjetas
          insertPosition = Math.min(session.currentCardIndex + 2 + Math.floor(Math.random() * 3), session.cardsToReview.length)
          break
        case 'good':
          // Aparecer más tarde en la cola
          insertPosition = Math.min(session.currentCardIndex + 4 + Math.floor(Math.random() * 4), session.cardsToReview.length)
          break
        default:
          insertPosition = session.cardsToReview.length
      }
      
      session.cardsToReview.splice(insertPosition, 0, currentCard)
      
      // Ajustar índice si es necesario
      if (session.currentCardIndex >= session.cardsToReview.length) {
        session.currentCardIndex = 0
      }
    }

    // Verificar si la sesión está completada
    if (session.cardsToReview.length === 0) {
      // ¡Todas las tarjetas fueron marcadas como "Easy"!
      endReviewSession()
    } else {
      showAnswer.value = false
    }

    saveToLocalStorage()
  }

  function updateCardForIntensiveSession(card: Flashcard, response: ReviewResponse) {
    const now = new Date()
    card.updatedAt = now
    card.reviewCount++

    // En sesión intensiva, solo aplicamos cambios mínimos hasta que sea "Easy"
    switch (response) {
      case 'again':
        // No cambiar mucho, solo marcar que necesita más práctica
        card.difficulty = 'hard'
        break
      
      case 'hard':
        // Ligera mejora
        card.difficulty = 'hard'
        break
      
      case 'good':
        // Progreso normal
        card.difficulty = 'medium'
        break
      
      case 'easy':
        // Solo cuando es "Easy" aplicamos el algoritmo SM2 completo
        card.easeFactor = Math.min(2.5, card.easeFactor + 0.15)
        card.interval = Math.max(1, Math.ceil(card.interval * card.easeFactor))
        card.difficulty = 'easy'
        
        // Programar siguiente revisión (para futuras sesiones)
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + card.interval)
        card.nextReviewDate = nextReview
        break
    }
  }

  function saveToLocalStorage() {
    localStorage.setItem('anki-decks', JSON.stringify(decks.value))
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('anki-decks')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convertir fechas string a objetos Date
        decks.value = parsed.map((deck: any) => ({
          ...deck,
          createdAt: new Date(deck.createdAt),
          updatedAt: new Date(deck.updatedAt),
          cards: deck.cards.map((card: any) => ({
            ...card,
            nextReviewDate: new Date(card.nextReviewDate),
            createdAt: new Date(card.createdAt),
            updatedAt: new Date(card.updatedAt)
          }))
        }))
      } catch (error) {
        console.error('Error loading data from localStorage:', error)
      }
    }
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Inicializar datos de ejemplo si no hay datos guardados
  function initializeDefaultData() {
    // Verificar si el deck de verbos irregulares existe
    const irregularVerbsExists = decks.value.some(deck => deck.name === 'Irregular Verbs')
    const verbTensesExists = decks.value.some(deck => deck.name === 'Verb Tenses')
    const businessExists = decks.value.some(deck => deck.name === 'Business English')
    
    // Crear deck de verbos irregulares si no existe
    if (!irregularVerbsExists) {
      const irregularVerbsDeckId = createDeck('Irregular Verbs', 'Essential irregular verbs in English with past and past participle forms')
      
      // Lista de verbos irregulares
      const irregularVerbs = [
        { spanish: 'quemar', base: 'burn', past: 'burnt', pastParticiple: 'burnt', pronunciation: 'bern / bernt / bernt', example: 'He burnt the old letters yesterday.' },
        { spanish: 'construir', base: 'build', past: 'built', pastParticiple: 'built', pronunciation: 'bild / bilt / bilt', example: 'They built a treehouse for their kids.' },
        { spanish: 'atrapar', base: 'catch', past: 'caught', pastParticiple: 'caught', pronunciation: 'cach / cot / cot', example: 'The police caught the thief quickly.' },
        { spanish: 'elegir', base: 'choose', past: 'chose', pastParticiple: 'chosen', pronunciation: 'chus / chous / chousen', example: 'We chose the best candidate for the job.' },
        { spanish: 'alimentar', base: 'feed', past: 'fed', pastParticiple: 'fed', pronunciation: 'fid / fed / fed', example: 'She fed the cat an hour ago.' },
        { spanish: 'soñar', base: 'dream', past: 'dreamt', pastParticiple: 'dreamt', pronunciation: 'drim / dremt / dremt', example: 'I dreamt about flying last night.' },
        { spanish: 'dibujar', base: 'draw', past: 'drew', pastParticiple: 'drawn', pronunciation: 'dro / dru / dron', example: 'The artist drew a stunning portrait.' },
        { spanish: 'sentir', base: 'feel', past: 'felt', pastParticiple: 'felt', pronunciation: 'fil / felt / felt', example: 'I felt a sudden pain in my back.' },
        { spanish: 'encontrar', base: 'find', past: 'found', pastParticiple: 'found', pronunciation: 'faind / faund / faund', example: 'He found a wallet on the street.' },
        { spanish: 'congelar', base: 'freeze', past: 'froze', pastParticiple: 'frozen', pronunciation: 'fris / frous / frousen', example: 'The water in the pipe froze overnight.' },
        { spanish: 'huir', base: 'flee', past: 'fled', pastParticiple: 'fled', pronunciation: 'fli / fled / fled', example: 'People fled from the burning building.' },
        { spanish: 'perdonar', base: 'forgive', past: 'forgave', pastParticiple: 'forgiven', pronunciation: 'for-guiv / for-geiv / for-given', example: 'She finally forgave him for his mistake.' },
        { spanish: 'esconder', base: 'hide', past: 'hid', pastParticiple: 'hidden', pronunciation: 'jaid / jid / jiden', example: 'The children hid behind the curtain.' },
        { spanish: 'mostrar', base: 'show', past: 'showed', pastParticiple: 'shown', pronunciation: 'shou / shoud / shoun', example: 'They showed us their wedding photos.' },
        { spanish: 'disparar', base: 'shoot', past: 'shot', pastParticiple: 'shot', pronunciation: 'shut / shot / shot', example: 'The soldier shot at the target.' }
      ]

      irregularVerbs.forEach(verb => {
        const englishText = `${verb.base} - ${verb.past} - ${verb.pastParticiple}`
        addCard(irregularVerbsDeckId, verb.spanish, englishText, verb.pronunciation, [verb.example])
      })
    }

    // Crear deck de tiempos verbales si no existe
    if (!verbTensesExists) {
      const verbTensesDeckId = createDeck('Verb Tenses', 'Common English verb tenses')
      addCard(verbTensesDeckId, 'Yo camino', 'I walk', 'ai wok', ['I walk to school every day.'])
      addCard(verbTensesDeckId, 'Él corrió', 'He ran', 'hi ran', ['He ran very fast.'])
      addCard(verbTensesDeckId, 'Nosotros hemos comido', 'We have eaten', 'wi hav iten', ['We have eaten lunch already.'])
    }

    // Crear deck de inglés de negocios si no existe
    if (!businessExists) {
      const businessDeckId = createDeck('Business English', 'Essential business vocabulary')
      addCard(businessDeckId, 'Reunión', 'Meeting', 'miting', ['We have a meeting at 3 PM.'])
      addCard(businessDeckId, 'Informe', 'Report', 'riport', ['Please send me the report by Friday.'])
      addCard(businessDeckId, 'Presupuesto', 'Budget', 'bachet', ['The project is within budget.'])
    }
  }

  return {
    // State
    decks,
    currentSession,
    showAnswer,
    
    // Getters
    getDeckById,
    getCardsForReview,
    studyStats,
    
    // Actions
    createDeck,
    updateDeck,
    deleteDeck,
    addCard,
    deleteCard,
    startReviewSession,
    endReviewSession,
    toggleAnswer,
    reviewCard,
    saveToLocalStorage,
    loadFromLocalStorage,
    initializeDefaultData
  }
})
