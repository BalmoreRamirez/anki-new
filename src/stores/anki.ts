import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Deck, Flashcard, ReviewSession, StudyStats, ReviewResponse, GlobalSettings, DeckSettings } from '@/types'
import FirebaseService from '@/services/FirebaseService'
import { ConfigService } from '@/services/ConfigService'
import { auth } from '@/config/firebase'

export const useAnkiStore = defineStore('anki', () => {
  // State
  const decks = ref<Deck[]>([])
  const currentSession = ref<ReviewSession | null>(null)
  const showAnswer = ref(false)
  const useFirebase = ref(true) // Siempre usar Firebase por defecto
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Configuration state
  const globalSettings = ref<GlobalSettings | null>(null)
  const deckSettings = ref<Map<string, DeckSettings>>(new Map())

  // Configurar Firebase como predeterminado
  localStorage.setItem('anki-use-firebase', 'true')

  // Getters
  const getDeckById = computed(() => {
    return (id: string) => decks.value.find(deck => deck.id === id)
  })

  const getCardsForReview = computed(() => {
    return (deckId: string) => {
      const deck = getDeckById.value(deckId)
      if (!deck) return []
      
      const now = new Date()
      const availableCards = deck.cards.filter(card => {
        // Manejar fechas inválidas de manera segura
        try {
          const reviewDate = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(0)
          
          // Si la fecha es inválida, considerar la tarjeta como disponible
          if (isNaN(reviewDate.getTime())) {
            console.warn(`Card "${card.spanish}" has invalid review date, making it available`)
            return true
          }
          
          const isAvailable = reviewDate <= now
          
          // Debug log para ver qué está pasando
          if (!isAvailable) {
            console.log(`Card "${card.spanish}" not available:`, {
              reviewDate: reviewDate.toISOString(),
              now: now.toISOString(),
              diff: reviewDate.getTime() - now.getTime()
            })
          }
          
          return isAvailable
        } catch (error) {
          console.warn(`Error processing card "${card.spanish}":`, error)
          return true // En caso de error, hacer la tarjeta disponible
        }
      })
      
      console.log(`Deck "${deck.name}": ${availableCards.length}/${deck.cards.length} cards available`)
      return availableCards
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

  // Firebase Actions
  async function loadFromFirebase() {
    if (!useFirebase.value) return
    
    try {
      isLoading.value = true
      error.value = null
      
      const firebaseDecks = await FirebaseService.getDecks()
      decks.value = firebaseDecks
      
      // Aplicar limpieza y verificaciones después de cargar
      ensureUniqueIds()
      cleanupDecksWithSingleCard()

      console.log('Loaded', decks.value.length, 'decks from Firebase (after cleanup)')
    } catch (err) {
      error.value = 'Error loading data from Firebase'
      console.error('Firebase load error:', err)
      
      // Fallback a localStorage si Firebase falla
      console.log('Falling back to localStorage...')
      loadFromLocalStorage()
    } finally {
      isLoading.value = false
    }
  }

  async function migrateToFirebase() {
    try {
      isLoading.value = true
      error.value = null
      
      // Migrar datos locales a Firebase
      await FirebaseService.migrateLocalData(decks.value)
      
      // Cambiar a modo Firebase
      useFirebase.value = true
      localStorage.setItem('anki-use-firebase', 'true')
      
      console.log('Migration to Firebase completed')
    } catch (err) {
      error.value = 'Error migrating to Firebase'
      console.error('Migration error:', err)
    } finally {
      isLoading.value = false
    }
  }

  function subscribeToFirebaseChanges() {
    if (!useFirebase.value) return
    
    return FirebaseService.subscribeToDecks((firebaseDecks) => {
      decks.value = firebaseDecks
      console.log('Real-time update: received', firebaseDecks.length, 'decks')
    })
  }

  // Actions
  async function createDeck(name: string, description?: string): Promise<string> {
    if (useFirebase.value) {
      try {
        const deckData = {
          name,
          description,
          cards: [],
          tags: [],
          category: 'General',
          isPublic: false,
          difficulty: 'intermediate' as const,
          estimatedTime: 30
        }
        const id = await FirebaseService.createDeck(deckData)
        
        // No agregamos localmente aquí porque la suscripción en tiempo real
        // se encargará de actualizar el estado local automáticamente
        
        console.log('✅ Deck created in Firebase:', id)
        return id
      } catch (err) {
        console.error('❌ Error creating deck in Firebase:', err)
        // Fallback a localStorage solo si Firebase falla
        return createDeckLocal(name, description)
      }
    } else {
      return createDeckLocal(name, description)
    }
  }

  function createDeckLocal(name: string, description?: string): string {
    const id = generateId()
    const newDeck: Deck = {
      id,
      name,
      description,
      cards: [],
      tags: [],
      category: 'General',
      isPublic: false,
      difficulty: 'intermediate',
      estimatedTime: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    decks.value.push(newDeck)
    saveToLocalStorage()
    return id
  }

  async function deleteDeck(deckId: string) {
    if (useFirebase.value) {
      try {
        // Eliminar de Firebase primero
        await FirebaseService.deleteDeck(deckId)
        
        // No eliminar localmente aquí porque la suscripción en tiempo real
        // se encargará de actualizar el estado local automáticamente
        
        console.log('✅ Deck deleted from Firebase:', deckId)
      } catch (err) {
        console.error('❌ Error deleting deck from Firebase:', err)
        // Fallback a localStorage solo si Firebase falla
        deleteDeckLocal(deckId)
      }
    } else {
      deleteDeckLocal(deckId)
    }
  }

  function deleteDeckLocal(deckId: string) {
    const index = decks.value.findIndex(deck => deck.id === deckId)
    if (index !== -1) {
      decks.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  async function updateDeck(deckId: string, name: string, description?: string) {
    if (useFirebase.value) {
      try {
        // Actualizar en Firebase primero
        await FirebaseService.updateDeck(deckId, { 
          name, 
          description
        })
        
        // No actualizar localmente aquí porque la suscripción en tiempo real
        // se encargará de actualizar el estado local automáticamente
        
        console.log('✅ Deck updated in Firebase:', deckId)
      } catch (err) {
        console.error('❌ Error updating deck in Firebase:', err)
        // Fallback a localStorage solo si Firebase falla
        updateDeckLocal(deckId, name, description)
      }
    } else {
      updateDeckLocal(deckId, name, description)
    }
  }

  function updateDeckLocal(deckId: string, name: string, description?: string) {
    const deck = getDeckById.value(deckId)
    if (deck) {
      deck.name = name
      deck.description = description
      deck.updatedAt = new Date()
      saveToLocalStorage()
    }
  }

  async function addCard(deckId: string, spanish: string, english: string, pronunciation?: string, examples?: string[]) {
    if (useFirebase.value) {
      try {
        // Crear fecha en el pasado para que esté disponible inmediatamente
        const availableNow = new Date()
        availableNow.setTime(availableNow.getTime() - 60 * 60 * 1000) // 1 hora en el pasado

        const cardData = {
          spanish,
          english,
          front: spanish,
          back: english,
          lastReviewed: availableNow,
          nextReview: availableNow,
          pronunciation,
          examples,
          difficulty: 'medium' as const,
          nextReviewDate: availableNow,
          reviewCount: 0,
          easeFactor: 2.5,
          interval: 1
        }

        // Agregar tarjeta a Firebase
        try {
          await FirebaseService.addCardToDeck(deckId, cardData)
          console.log('✅ Card added to Firebase deck:', deckId)
        } catch (firebaseError) {
          console.warn('⚠️ Firebase card add failed, using localStorage:', firebaseError)
          // Si Firebase falla, usar localStorage como respaldo
          addCardLocal(deckId, spanish, english, pronunciation, examples)
        }
        
        // No actualizar localmente aquí porque la suscripción en tiempo real
        // se encargará de actualizar el estado local automáticamente (si Firebase funciona)
      } catch (err) {
        console.error('❌ Error adding card to Firebase:', err)
        // Fallback a localStorage
        addCardLocal(deckId, spanish, english, pronunciation, examples)
      }
    } else {
      addCardLocal(deckId, spanish, english, pronunciation, examples)
    }
  }

  function addCardLocal(deckId: string, spanish: string, english: string, pronunciation?: string, examples?: string[]) {
    const deck = getDeckById.value(deckId)
    if (!deck) return

    // Crear fecha en el pasado para que esté disponible inmediatamente
    const availableNow = new Date()
    availableNow.setTime(availableNow.getTime() - 60 * 60 * 1000) // 1 hora en el pasado

    const newCard: Flashcard = {
      id: generateId(),
      spanish,
      english,
      front: spanish,
      back: english,
      pronunciation,
      examples,
      deckId,
      difficulty: 'medium',
      nextReviewDate: availableNow, // Fecha válida en el pasado
      nextReview: availableNow,
      lastReviewed: new Date(),
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

  async function deleteCard(cardId: string) {
    if (useFirebase.value) {
      try {
        // Encontrar el deck que contiene la tarjeta
        let deckId = ''
        for (const deck of decks.value) {
          if (deck.cards.find(card => card.id === cardId)) {
            deckId = deck.id
            break
          }
        }

        if (deckId) {
          // Eliminar tarjeta de Firebase
          await FirebaseService.deleteCardFromDeck(deckId, cardId)
          
          // No eliminar localmente aquí porque la suscripción en tiempo real
          // se encargará de actualizar el estado local automáticamente
          
          console.log('✅ Card deleted from Firebase:', cardId)
        }
      } catch (err) {
        console.error('❌ Error deleting card from Firebase:', err)
        // Fallback a localStorage
        deleteCardLocal(cardId)
      }
    } else {
      deleteCardLocal(cardId)
    }
  }

  function deleteCardLocal(cardId: string) {
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

        // Aplicar limpieza y verificaciones después de cargar
        ensureUniqueIds()
        cleanupDecksWithSingleCard()

        console.log('Loaded', decks.value.length, 'decks from localStorage (after cleanup)')
      } catch (error) {
        console.error('Error loading data from localStorage:', error)
      }
    }
  }

  function generateId(): string {
    // Generar un ID más único combinando timestamp, random y un contador global
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)

    // Usar una variable externa para el contador
    if (!window.ankiIdCounter) {
      window.ankiIdCounter = 0
    }
    const counter = (++window.ankiIdCounter).toString(36)

    // Verificar que el ID no exista ya en los decks
    let newId = `${timestamp}-${random}-${counter}`
    let attempts = 0

    while (decks.value.some(deck => deck.id === newId) && attempts < 10) {
      const extraRandom = Math.random().toString(36).substr(2, 5)
      newId = `${timestamp}-${random}-${counter}-${extraRandom}`
      attempts++
    }

    return newId
  }

  // Función para limpiar decks con solo una carta
  function cleanupDecksWithSingleCard() {
    const decksToRemove = decks.value.filter(deck => deck.cards.length <= 1)

    if (decksToRemove.length > 0) {
      console.log(`Removing ${decksToRemove.length} decks with only one card:`,
        decksToRemove.map(d => `"${d.name}" (${d.cards.length} cards)`))

      // Eliminar decks localmente
      decks.value = decks.value.filter(deck => deck.cards.length > 1)

      // Si usamos Firebase, eliminar también de allí
      if (useFirebase.value) {
        decksToRemove.forEach(async (deck) => {
          try {
            await FirebaseService.deleteDeck(deck.id)
            console.log(`✅ Removed deck "${deck.name}" from Firebase`)
          } catch (err) {
            console.error(`❌ Error removing deck "${deck.name}" from Firebase:`, err)
          }
        })
      }

      saveToLocalStorage()
    }
  }

  // Función para garantizar IDs únicos en todos los decks existentes
  function ensureUniqueIds() {
    const usedIds = new Set<string>()
    let changesNeeded = false

    decks.value.forEach(deck => {
      // Verificar ID del deck
      if (!deck.id || usedIds.has(deck.id)) {
        deck.id = generateId()
        changesNeeded = true
        console.log(`Assigned new ID to deck "${deck.name}": ${deck.id}`)
      }
      usedIds.add(deck.id)

      // Verificar IDs de las cartas
      const cardIds = new Set<string>()
      deck.cards.forEach(card => {
        if (!card.id || cardIds.has(card.id)) {
          card.id = generateId()
          changesNeeded = true
          console.log(`Assigned new ID to card "${card.spanish}" in deck "${deck.name}"`)
        }
        cardIds.add(card.id)

        // Asegurar que el deckId de la carta coincida con el deck
        if (card.deckId !== deck.id) {
          card.deckId = deck.id
          changesNeeded = true
        }
      })
    })

    if (changesNeeded) {
      console.log('✅ All IDs have been updated to ensure uniqueness')
      saveToLocalStorage()
    }
  }

  // Inicializar datos de ejemplo si no hay datos guardados
  async function initializeDefaultData() {
    // Migrar nombres de decks antiguos a nuevos nombres organizados
    const oldIrregularVerbs = decks.value.find(deck => deck.name === 'Irregular Verbs')
    if (oldIrregularVerbs) {
      oldIrregularVerbs.name = 'Irregular Verbs (1-15)'
      oldIrregularVerbs.description = 'Essential irregular verbs in English with past and past participle forms - Part 1'
      console.log('Migrated "Irregular Verbs" to "Irregular Verbs (1-15)"')
    }
    
    const oldMoreIrregularVerbs = decks.value.find(deck => deck.name === 'More Irregular Verbs')
    if (oldMoreIrregularVerbs) {
      oldMoreIrregularVerbs.name = 'Irregular Verbs (16-30)'
      oldMoreIrregularVerbs.description = 'Additional essential irregular verbs with past and past participle forms - Part 2'
      console.log('Migrated "More Irregular Verbs" to "Irregular Verbs (16-30)"')
    }
    
    // Verificar si el deck de verbos irregulares existe
    const irregularVerbsExists = decks.value.some(deck => deck.name === 'Irregular Verbs (1-15)')
    const verbTensesExists = decks.value.some(deck => deck.name === 'Verb Tenses')
    const businessExists = decks.value.some(deck => deck.name === 'Business English')
    
    // Crear deck de verbos irregulares si no existe
    if (!irregularVerbsExists) {
      const irregularVerbsDeckId = await createDeck('Irregular Verbs (1-15)', 'Essential irregular verbs in English with past and past participle forms - Part 1')
      
      // Lista de verbos irregulares
      const irregularVerbs = [
        { spanish: 'surgir, levantarse', base: 'arise', past: 'arose', pastParticiple: 'arisen', pronunciation: 'ə-raɪz / ə-roʊz / ə-rɪz-ən', example: 'A problem arose during the meeting.' },
        { spanish: 'despertar(se)', base: 'awake', past: 'awoke', pastParticiple: 'awoken', pronunciation: 'ə-weɪk / ə-woʊk / ə-woʊ-kən', example: 'I awoke early this morning.' },
        { spanish: 'ser, estar', base: 'be', past: 'was/were', pastParticiple: 'been', pronunciation: 'bi / wʌz-wər / bɪn', example: 'She has been here all day.' },
        { spanish: 'soportar, dar a luz', base: 'bear', past: 'bore', pastParticiple: 'borne/born', pronunciation: 'ber / bor / born', example: 'She bore the pain bravely.' },
        { spanish: 'golpear, vencer', base: 'beat', past: 'beat', pastParticiple: 'beaten', pronunciation: 'bit / bit / bit-ən', example: 'Our team beat theirs 3-1.' },
        { spanish: 'llegar a ser, convertirse', base: 'become', past: 'became', pastParticiple: 'become', pronunciation: 'bɪ-kʌm / bɪ-keɪm / bɪ-kʌm', example: 'He became a doctor last year.' },
        { spanish: 'empezar, comenzar', base: 'begin', past: 'began', pastParticiple: 'begun', pronunciation: 'bɪ-gɪn / bɪ-gæn / bɪ-gʌn', example: 'The meeting began at 9 AM.' },
        { spanish: 'doblar, curvar', base: 'bend', past: 'bent', pastParticiple: 'bent', pronunciation: 'bend / bent / bent', example: 'He bent down to pick up the coin.' },
        { spanish: 'apostar', base: 'bet', past: 'bet', pastParticiple: 'bet', pronunciation: 'bet / bet / bet', example: 'I bet you can\'t solve this puzzle.' },
        { spanish: 'atar, encuadernar', base: 'bind', past: 'bound', pastParticiple: 'bound', pronunciation: 'baɪnd / baʊnd / baʊnd', example: 'The prisoner was bound with ropes.' },
        { spanish: 'ofertar, pujar', base: 'bid', past: 'bid', pastParticiple: 'bid', pronunciation: 'bɪd / bɪd / bɪd', example: 'She bid farewell to her friends.' },
        { spanish: 'morder', base: 'bite', past: 'bit', pastParticiple: 'bitten', pronunciation: 'baɪt / bɪt / bɪt-ən', example: 'The dog bit the mailman.' },
        { spanish: 'sangrar', base: 'bleed', past: 'bled', pastParticiple: 'bled', pronunciation: 'blid / bled / bled', example: 'His wound bled for hours.' },
        { spanish: 'soplar', base: 'blow', past: 'blew', pastParticiple: 'blown', pronunciation: 'bloʊ / blu / bloʊn', example: 'The wind blew all night.' },
        { spanish: 'romper, quebrar', base: 'break', past: 'broke', pastParticiple: 'broken', pronunciation: 'breɪk / broʊk / broʊ-kən', example: 'She broke her phone yesterday.' }
      ]

      irregularVerbs.forEach(verb => {
        const englishText = `${verb.base} - ${verb.past} - ${verb.pastParticiple}`
        addCard(irregularVerbsDeckId, verb.spanish, englishText, verb.pronunciation, [verb.example])
      })
    } else {
      // Si el deck ya existe, verificar si necesita actualizarse
      const existingDeck = decks.value.find(deck => deck.name === 'Irregular Verbs (1-15)')
      if (existingDeck && existingDeck.cards.length !== 15) {
        console.log('Updating Irregular Verbs (1-15) deck with new content...')
        
        // Limpiar cartas existentes
        existingDeck.cards = []
        
        // Lista actualizada de verbos irregulares
        const irregularVerbs = [
          { spanish: 'surgir, levantarse', base: 'arise', past: 'arose', pastParticiple: 'arisen', pronunciation: 'ə-raɪz / ə-roʊz / ə-rɪz-ən', example: 'A problem arose during the meeting.' },
          { spanish: 'despertar(se)', base: 'awake', past: 'awoke', pastParticiple: 'awoken', pronunciation: 'ə-weɪk / ə-woʊk / ə-woʊ-kən', example: 'I awoke early this morning.' },
          { spanish: 'ser, estar', base: 'be', past: 'was/were', pastParticiple: 'been', pronunciation: 'bi / wʌz-wər / bɪn', example: 'She has been here all day.' },
          { spanish: 'soportar, dar a luz', base: 'bear', past: 'bore', pastParticiple: 'borne/born', pronunciation: 'ber / bor / born', example: 'She bore the pain bravely.' },
          { spanish: 'golpear, vencer', base: 'beat', past: 'beat', pastParticiple: 'beaten', pronunciation: 'bit / bit / bit-ən', example: 'Our team beat theirs 3-1.' },
          { spanish: 'llegar a ser, convertirse', base: 'become', past: 'became', pastParticiple: 'become', pronunciation: 'bɪ-kʌm / bɪ-keɪm / bɪ-kʌm', example: 'He became a doctor last year.' },
          { spanish: 'empezar, comenzar', base: 'begin', past: 'began', pastParticiple: 'begun', pronunciation: 'bɪ-gɪn / bɪ-gæn / bɪ-gʌn', example: 'The meeting began at 9 AM.' },
          { spanish: 'doblar, curvar', base: 'bend', past: 'bent', pastParticiple: 'bent', pronunciation: 'bend / bent / bent', example: 'He bent down to pick up the coin.' },
          { spanish: 'apostar', base: 'bet', past: 'bet', pastParticiple: 'bet', pronunciation: 'bet / bet / bet', example: 'I bet you can\'t solve this puzzle.' },
          { spanish: 'atar, encuadernar', base: 'bind', past: 'bound', pastParticiple: 'bound', pronunciation: 'baɪnd / baʊnd / baʊnd', example: 'The prisoner was bound with ropes.' },
          { spanish: 'ofertar, pujar', base: 'bid', past: 'bid', pastParticiple: 'bid', pronunciation: 'bɪd / bɪd / bɪd', example: 'She bid farewell to her friends.' },
          { spanish: 'morder', base: 'bite', past: 'bit', pastParticiple: 'bitten', pronunciation: 'baɪt / bɪt / bɪt-ən', example: 'The dog bit the mailman.' },
          { spanish: 'sangrar', base: 'bleed', past: 'bled', pastParticiple: 'bled', pronunciation: 'blid / bled / bled', example: 'His wound bled for hours.' },
          { spanish: 'soplar', base: 'blow', past: 'blew', pastParticiple: 'blown', pronunciation: 'bloʊ / blu / bloʊn', example: 'The wind blew all night.' },
          { spanish: 'romper, quebrar', base: 'break', past: 'broke', pastParticiple: 'broken', pronunciation: 'breɪk / broʊk / broʊ-kən', example: 'She broke her phone yesterday.' }
        ]

        irregularVerbs.forEach(verb => {
          const englishText = `${verb.base} - ${verb.past} - ${verb.pastParticiple}`
          addCard(existingDeck.id, verb.spanish, englishText, verb.pronunciation, [verb.example])
        })
        
        existingDeck.updatedAt = new Date()
        saveToLocalStorage()
      }
    }

    // Crear deck de tiempos verbales si no existe
    if (!verbTensesExists) {
      const verbTensesDeckId = await createDeck('Verb Tenses', 'Common English verb tenses')
      addCard(verbTensesDeckId, 'Yo camino', 'I walk', 'ai wok', ['I walk to school every day.'])
      addCard(verbTensesDeckId, 'Él corrió', 'He ran', 'hi ran', ['He ran very fast.'])
      addCard(verbTensesDeckId, 'Nosotros hemos comido', 'We have eaten', 'wi hav iten', ['We have eaten lunch already.'])
    }

    // Crear deck de inglés de negocios si no existe
    if (!businessExists) {
      const businessDeckId = await createDeck('Business English', 'Essential business vocabulary')
      addCard(businessDeckId, 'Reunión', 'Meeting', 'miting', ['We have a meeting at 3 PM.'])
      addCard(businessDeckId, 'Informe', 'Report', 'riport', ['Please send me the report by Friday.'])
      addCard(businessDeckId, 'Presupuesto', 'Budget', 'bachet', ['The project is within budget.'])
    }

    // Crear deck de verbos irregulares adicionales si no existe
    const moreVerbsExists = decks.value.some(deck => deck.name === 'Irregular Verbs (16-30)')
    if (!moreVerbsExists) {
      const moreVerbsDeckId = await createDeck('Irregular Verbs (16-30)', 'Additional essential irregular verbs with past and past participle forms - Part 2')
      
      // Lista de verbos irregulares adicionales
      const moreIrregularVerbs = [
        { spanish: 'criar', base: 'breed', past: 'bred', pastParticiple: 'bred', pronunciation: 'brid / bred / bred', example: 'He bred dogs for many years.' },
        { spanish: 'traer, llevar', base: 'bring', past: 'brought', pastParticiple: 'brought', pronunciation: 'bring / brot / brot', example: 'She brought wine to the party.' },
        { spanish: 'transmitir, radiar', base: 'broadcast', past: 'broadcast', pastParticiple: 'broadcast', pronunciation: 'brod-cast / brod-cast / brod-cast', example: 'They broadcast the news live.' },
        { spanish: 'construir, edificar', base: 'build', past: 'built', pastParticiple: 'built', pronunciation: 'bild / bilt / bilt', example: 'We built a sandcastle.' },
        { spanish: 'quemar', base: 'burn', past: 'burnt/burned', pastParticiple: 'burnt/burned', pronunciation: 'bern / bernt or bernd / bernt or bernd', example: 'I burnt the cookies by accident.' },
        { spanish: 'estallar, reventar', base: 'burst', past: 'burst', pastParticiple: 'burst', pronunciation: 'burst / burst / burst', example: 'The balloon burst loudly.' },
        { spanish: 'comprar', base: 'buy', past: 'bought', pastParticiple: 'bought', pronunciation: 'bai / bot / bot', example: 'He bought a new car.' },
        { spanish: 'lanzar, arrojar', base: 'cast', past: 'cast', pastParticiple: 'cast', pronunciation: 'cast / cast / cast', example: 'The fisherman cast his net into the sea.' },
        { spanish: 'atrapar, coger', base: 'catch', past: 'caught', pastParticiple: 'caught', pronunciation: 'cach / cot / cot', example: 'She caught a cold last week.' },
        { spanish: 'venir', base: 'come', past: 'came', pastParticiple: 'come', pronunciation: 'com / keim / com', example: 'They came to visit us.' },
        { spanish: 'costar', base: 'cost', past: 'cost', pastParticiple: 'cost', pronunciation: 'cost / cost / cost', example: 'This jacket cost a lot of money.' },
        { spanish: 'cortar', base: 'cut', past: 'cut', pastParticiple: 'cut', pronunciation: 'cut / cut / cut', example: 'I cut my finger while cooking.' },
        { spanish: 'elegir', base: 'choose', past: 'chose', pastParticiple: 'chosen', pronunciation: 'chus / chous / chousen', example: 'You chose the perfect gift.' },
        { spanish: 'agarrarse, aferrarse', base: 'cling', past: 'clung', pastParticiple: 'clung', pronunciation: 'kling / klung / klung', example: 'The child clung to his mother\'s leg.' },
        { spanish: 'arrastrarse, moverse sigilosamente', base: 'creep', past: 'crept', pastParticiple: 'crept', pronunciation: 'krip / krept / krept', example: 'The cat crept towards the bird.' }
      ]

      moreIrregularVerbs.forEach(verb => {
        const englishText = `${verb.base} - ${verb.past} - ${verb.pastParticiple}`
        addCard(moreVerbsDeckId, verb.spanish, englishText, verb.pronunciation, [verb.example])
      })
    } else {
      // Si el deck ya existe, verificar si necesita actualizarse (por ejemplo, si tiene menos de 15 cartas)
      const existingDeck = decks.value.find(deck => deck.name === 'Irregular Verbs (16-30)')
      if (existingDeck && existingDeck.cards.length !== 15) {
        console.log('Updating Irregular Verbs (16-30) deck with new content...')
        
        // Limpiar cartas existentes
        existingDeck.cards = []
        
        // Lista actualizada de verbos irregulares
        const moreIrregularVerbs = [
          { spanish: 'criar', base: 'breed', past: 'bred', pastParticiple: 'bred', pronunciation: 'brid / bred / bred', example: 'He bred dogs for many years.' },
          { spanish: 'traer, llevar', base: 'bring', past: 'brought', pastParticiple: 'brought', pronunciation: 'bring / brot / brot', example: 'She brought wine to the party.' },
          { spanish: 'transmitir, radiar', base: 'broadcast', past: 'broadcast', pastParticiple: 'broadcast', pronunciation: 'brod-cast / brod-cast / brod-cast', example: 'They broadcast the news live.' },
          { spanish: 'construir, edificar', base: 'build', past: 'built', pastParticiple: 'built', pronunciation: 'bild / bilt / bilt', example: 'We built a sandcastle.' },
          { spanish: 'quemar', base: 'burn', past: 'burnt/burned', pastParticiple: 'burnt/burned', pronunciation: 'bern / bernt or bernd / bernt or bernd', example: 'I burnt the cookies by accident.' },
          { spanish: 'estallar, reventar', base: 'burst', past: 'burst', pastParticiple: 'burst', pronunciation: 'burst / burst / burst', example: 'The balloon burst loudly.' },
          { spanish: 'comprar', base: 'buy', past: 'bought', pastParticiple: 'bought', pronunciation: 'bai / bot / bot', example: 'He bought a new car.' },
          { spanish: 'lanzar, arrojar', base: 'cast', past: 'cast', pastParticiple: 'cast', pronunciation: 'cast / cast / cast', example: 'The fisherman cast his net into the sea.' },
          { spanish: 'atrapar, coger', base: 'catch', past: 'caught', pastParticiple: 'caught', pronunciation: 'cach / cot / cot', example: 'She caught a cold last week.' },
          { spanish: 'venir', base: 'come', past: 'came', pastParticiple: 'come', pronunciation: 'com / keim / com', example: 'They came to visit us.' },
          { spanish: 'costar', base: 'cost', past: 'cost', pastParticiple: 'cost', pronunciation: 'cost / cost / cost', example: 'This jacket cost a lot of money.' },
          { spanish: 'cortar', base: 'cut', past: 'cut', pastParticiple: 'cut', pronunciation: 'cut / cut / cut', example: 'I cut my finger while cooking.' },
          { spanish: 'elegir', base: 'choose', past: 'chose', pastParticiple: 'chosen', pronunciation: 'chus / chous / chousen', example: 'You chose the perfect gift.' },
          { spanish: 'agarrarse, aferrarse', base: 'cling', past: 'clung', pastParticiple: 'clung', pronunciation: 'kling / klung / klung', example: 'The child clung to his mother\'s leg.' },
          { spanish: 'arrastrarse, moverse sigilosamente', base: 'creep', past: 'crept', pastParticiple: 'crept', pronunciation: 'krip / krept / krept', example: 'The cat crept towards the bird.' }
        ]

        moreIrregularVerbs.forEach(verb => {
          const englishText = `${verb.base} - ${verb.past} - ${verb.pastParticiple}`
          addCard(existingDeck.id, verb.spanish, englishText, verb.pronunciation, [verb.example])
        })
        
        existingDeck.updatedAt = new Date()
        saveToLocalStorage()
      }
    }
  }

  // Función para alternar entre Firebase y localStorage
  async function toggleFirebase(enableFirebase: boolean) {
    try {
      if (enableFirebase && !useFirebase.value) {
        // Migrar a Firebase
        await migrateToFirebase()
      } else if (!enableFirebase && useFirebase.value) {
        // Cambiar a localStorage
        useFirebase.value = false
        localStorage.setItem('anki-use-firebase', 'false')
        saveToLocalStorage()
      }
    } catch (err) {
      error.value = 'Error switching storage method'
      console.error('Toggle Firebase error:', err)
    }
  }

  // Función para resetear fechas de revisión (hacer todas las tarjetas disponibles)
  function resetAllCardsDue() {
    const now = new Date()
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 horas en el pasado
    
    let totalCardsReset = 0
    
    decks.value.forEach(deck => {
      console.log(`🔄 Resetting ${deck.cards.length} cards in deck "${deck.name}"`)
      
      deck.cards.forEach(card => {
        // Manejar fechas inválidas de manera segura
        let oldDateStr = 'invalid'
        try {
          const oldDate = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date()
          oldDateStr = isNaN(oldDate.getTime()) ? 'invalid' : oldDate.toISOString()
        } catch (e) {
          oldDateStr = 'error'
        }
        
        // Establecer nueva fecha válida
        card.nextReviewDate = new Date(pastDate)
        card.reviewCount = 0
        card.interval = 1
        card.easeFactor = 2.5
        card.difficulty = 'medium'
        card.updatedAt = new Date()
        
        console.log(`  Card "${card.spanish}": ${oldDateStr} -> ${card.nextReviewDate.toISOString()}`)
        totalCardsReset++
      })
      deck.updatedAt = new Date()
    })
    
    if (useFirebase.value) {
      // Si usa Firebase, guardar cambios
      console.log('💾 Saving reset cards to Firebase...')
      decks.value.forEach(async (deck) => {
        try {
          await FirebaseService.saveDeck(deck)
          console.log(`✅ Deck "${deck.name}" saved to Firebase`)
        } catch (error) {
          console.error('❌ Error saving deck after reset:', error)
        }
      })
    } else {
      saveToLocalStorage()
      console.log('💾 Saved reset cards to localStorage')
    }
    
    console.log(`🎉 ${totalCardsReset} cards reset to be available for review`)
    
    // Forzar recálculo de las estadísticas
    setTimeout(() => {
      console.log('🔄 Recalculating stats...')
      decks.value = [...decks.value] // Trigger reactivity
    }, 100)
  }

  // ====== CONFIGURATION MANAGEMENT ======

  // Load global settings
  async function loadGlobalSettings(): Promise<GlobalSettings | null> {
    try {
      // Skip if Firebase auth is not ready
      if (!auth.currentUser) {
        console.log('⚠️ Auth not ready, skipping global settings load')
        return null
      }

      if (!globalSettings.value) {
        const settings = await ConfigService.getGlobalSettings()
        if (settings) {
          globalSettings.value = settings
        } else {
          // Create default if none exists
          const user = auth.currentUser
          if (user) {
            globalSettings.value = await ConfigService.createDefaultGlobalSettings(user.uid)
          }
        }
      }
      return globalSettings.value
    } catch (error) {
      console.error('Error loading global settings:', error)
      return null
    }
  }

  // Update global settings
  async function updateGlobalSettings(updates: Partial<GlobalSettings>): Promise<void> {
    try {
      if (!globalSettings.value) {
        await loadGlobalSettings()
      }
      
      if (globalSettings.value) {
        await ConfigService.updateGlobalSettings(globalSettings.value.id, updates)
        // Reload settings to get updated values
        const updatedSettings = await ConfigService.getGlobalSettings()
        if (updatedSettings) {
          globalSettings.value = updatedSettings
        }
      }
    } catch (error) {
      console.error('Error updating global settings:', error)
      throw error
    }
  }

  // Load deck-specific settings
  async function loadDeckSettings(deckId: string): Promise<DeckSettings | null> {
    try {
      // Skip if Firebase auth is not ready
      if (!auth.currentUser) {
        console.log('⚠️ Auth not ready, skipping deck settings load for:', deckId)
        return null
      }

      if (!deckSettings.value.has(deckId)) {
        const settings = await ConfigService.getDeckSettings(deckId)
        if (settings) {
          deckSettings.value.set(deckId, settings)
        } else {
          // Create default settings
          await ConfigService.createDeckSettings(deckId)
          const defaultSettings = await ConfigService.getDeckSettings(deckId)
          if (defaultSettings) {
            deckSettings.value.set(deckId, defaultSettings)
          }
        }
      }
      return deckSettings.value.get(deckId) || null
    } catch (error) {
      console.error('Error loading deck settings for', deckId, ':', error)
      return null
    }
  }

  // Update deck-specific settings
  async function updateDeckSettings(deckId: string, updates: Partial<DeckSettings>): Promise<void> {
    try {
      const currentSettings = deckSettings.value.get(deckId)
      if (!currentSettings) {
        await loadDeckSettings(deckId)
      }
      
      const settings = deckSettings.value.get(deckId)
      if (settings) {
        await ConfigService.updateDeckSettings(settings.id, updates)
        // Reload settings to get updated values
        const updatedSettings = await ConfigService.getDeckSettings(deckId)
        if (updatedSettings) {
          deckSettings.value.set(deckId, updatedSettings)
        }
      }
    } catch (error) {
      console.error('Error updating deck settings:', error)
      throw error
    }
  }

  // Delete deck settings
  async function deleteDeckSettings(deckId: string): Promise<void> {
    try {
      await ConfigService.deleteDeckSettings(deckId)
      deckSettings.value.delete(deckId)
    } catch (error) {
      console.error('Error deleting deck settings:', error)
      throw error
    }
  }

  // Subscribe to configuration changes
  function subscribeToConfigChanges() {
    let unsubscribeGlobal: (() => void) | null = null

    // Subscribe to global settings changes if user is authenticated
    if (auth.currentUser) {
      unsubscribeGlobal = ConfigService.subscribeToGlobalSettings(
        auth.currentUser.uid, 
        (settings: GlobalSettings | null) => {
          globalSettings.value = settings
        }
      )
    }

    // Note: For now, we'll handle deck settings updates through manual refresh
    // The ConfigService subscribeToDeckSettings method expects a specific deckId
    // We could enhance this later to subscribe to multiple decks

    // Return cleanup function
    return () => {
      if (unsubscribeGlobal) unsubscribeGlobal()
    }
  }

  // Initialize configuration on app start
  async function initializeConfiguration(): Promise<void> {
    try {
      // Wait a bit for auth to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Load global settings
      await loadGlobalSettings()
      
      // Load settings for all existing decks
      const promises = decks.value.map(deck => loadDeckSettings(deck.id))
      await Promise.allSettled(promises) // Use allSettled to prevent one failure from breaking all
      
      console.log('✅ Configuration initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing configuration:', error)
    }
  }

  // Admin functions for complete deck management
  async function createCompleteDeck(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const deckId = generateId()
    const newDeck: Deck = {
      ...deck,
      id: deckId,
      cards: deck.cards.map(card => ({
        ...card,
        id: card.id || generateId(),
        deckId: deckId,
        createdAt: card.createdAt || new Date(),
        updatedAt: card.updatedAt || new Date()
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (useFirebase.value) {
      try {
        // Crear el deck completo con todas sus cartas de una vez
        await FirebaseService.createDeck(newDeck)
        console.log('✅ Complete deck created in Firebase:', deckId)
        
        // No agregar al estado local aquí, la suscripción en tiempo real
        // se encargará de actualizar el estado automáticamente
      } catch (err) {
        console.error('❌ Error creating complete deck in Firebase:', err)
        // Fallback a localStorage
        decks.value.push(newDeck)
        saveToLocalStorage()
      }
    } else {
      decks.value.push(newDeck)
      saveToLocalStorage()
    }

    return deckId
  }

  return {
    // State
    decks,
    currentSession,
    showAnswer,
    useFirebase,
    isLoading,
    error,
    globalSettings,
    deckSettings,
    
    // Getters
    getDeckById,
    getCardsForReview,
    studyStats,
    
    // Firebase Actions
    loadFromFirebase,
    migrateToFirebase,
    subscribeToFirebaseChanges,
    toggleFirebase,
    
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
    resetAllCardsDue,
    saveToLocalStorage,
    loadFromLocalStorage,
    initializeDefaultData,

    // ID Management and Cleanup
    ensureUniqueIds,
    cleanupDecksWithSingleCard,

    // Configuration Management
    loadGlobalSettings,
    updateGlobalSettings,
    loadDeckSettings,
    updateDeckSettings,
    deleteDeckSettings,
    subscribeToConfigChanges,
    initializeConfiguration,

    // Admin Functions
    createCompleteDeck
  }
})
