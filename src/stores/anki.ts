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
      const irregularVerbsDeckId = createDeck('Irregular Verbs (1-15)', 'Essential irregular verbs in English with past and past participle forms - Part 1')
      
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

    // Crear deck de verbos irregulares adicionales si no existe
    const moreVerbsExists = decks.value.some(deck => deck.name === 'Irregular Verbs (16-30)')
    if (!moreVerbsExists) {
      const moreVerbsDeckId = createDeck('Irregular Verbs (16-30)', 'Additional essential irregular verbs with past and past participle forms - Part 2')
      
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
