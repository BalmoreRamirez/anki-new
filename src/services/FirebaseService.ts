import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '@/config/firebase'
import type { Deck, Flashcard } from '@/types'

// Colección principal de decks
const DECKS_COLLECTION = 'decks'

export class FirebaseService {
  private static isAuthenticated = false
  private static authPromise: Promise<void> | null = null

  private static async initAuth(): Promise<void> {
    if (this.authPromise) return this.authPromise

    this.authPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.isAuthenticated = true
          console.log('✅ Firebase authenticated:', user.uid)
          resolve()
        } else {
          try {
            await signInAnonymously(auth)
            console.log('🔐 Firebase anonymous authentication successful')
          } catch (error) {
            console.error('❌ Firebase authentication failed:', error)
            resolve() // Continue anyway, but operations may fail
          }
        }
      })
    })

    return this.authPromise
  }

  private static async ensureAuth(): Promise<boolean> {
    await this.initAuth()
    return this.isAuthenticated
  }

  // ====== OPERACIONES CRUD PARA DECKS ======

  // Obtener todos los decks
  static async getDecks(): Promise<Deck[]> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        console.warn('⚠️ Not authenticated, returning empty decks array')
        return []
      }

      const q = query(collection(db, DECKS_COLLECTION), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const decks: Deck[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        decks.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          cards: data.cards || [],
          tags: data.tags || [],
          category: data.category || 'General',
          isPublic: data.isPublic || false,
          difficulty: data.difficulty || 'intermediate',
          estimatedTime: data.estimatedTime || 30,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        })
      })
      
      return decks
    } catch (error) {
      console.error('Error getting decks:', error)
      throw error
    }
  }

  // Obtener un deck específico por ID
  static async getDeckById(deckId: string): Promise<Deck | null> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      const deckRef = doc(db, DECKS_COLLECTION, deckId)
      const docSnap = await getDocs(query(collection(db, DECKS_COLLECTION), where('__name__', '==', deckId)))
      
      if (docSnap.empty) {
        return null
      }

      const data = docSnap.docs[0].data()
      return {
        id: docSnap.docs[0].id,
        name: data.name,
        description: data.description,
        cards: data.cards || [],
        tags: data.tags || [],
        category: data.category || 'General',
        isPublic: data.isPublic || false,
        difficulty: data.difficulty || 'intermediate',
        estimatedTime: data.estimatedTime || 30,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      }
    } catch (error) {
      console.error('Error getting deck by ID:', error)
      return null
    }
  }

  // Crear un nuevo deck
  static async createDeck(deckData: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      const now = Timestamp.now()
      const completeData = {
        name: deckData.name,
        description: deckData.description || '',
        cards: deckData.cards || [],
        tags: deckData.tags || [],
        category: deckData.category || 'General',
        isPublic: deckData.isPublic || false,
        difficulty: deckData.difficulty || 'intermediate',
        estimatedTime: deckData.estimatedTime || 30,
        createdAt: now,
        updatedAt: now
      }

      const docRef = await addDoc(collection(db, DECKS_COLLECTION), completeData)
      
      console.log('Deck created with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error creating deck:', error)
      throw error
    }
  }

  // Actualizar un deck
  static async updateDeck(deckId: string, updates: Partial<Omit<Deck, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      const deckRef = doc(db, DECKS_COLLECTION, deckId)
      
      // Verificar si el documento existe antes de actualizarlo
      const deckSnapshot = await getDoc(deckRef)
      if (!deckSnapshot.exists()) {
        console.warn(`Deck ${deckId} does not exist in Firebase, skipping update`)
        return
      }
      
      await updateDoc(deckRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      
      console.log('Deck updated:', deckId)
    } catch (error) {
      console.error('Error updating deck:', error)
      throw error
    }
  }

  // Eliminar un deck
  static async deleteDeck(deckId: string): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      const deckRef = doc(db, DECKS_COLLECTION, deckId)
      await deleteDoc(deckRef)
      
      console.log('Deck deleted:', deckId)
    } catch (error) {
      console.error('Error deleting deck:', error)
      throw error
    }
  }

  // ====== OPERACIONES CRUD PARA CARDS ======

  // Agregar tarjeta a un deck
  static async addCardToDeck(deckId: string, cardData: Omit<Flashcard, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      // Obtener el deck actual
      const deck = await this.getDeckById(deckId)
      if (!deck) {
        throw new Error('Deck not found')
      }

      // Crear nueva tarjeta
      const newCard: Flashcard = {
        id: this.generateId(),
        ...cardData,
        deckId,
        nextReviewDate: new Date(Date.now() - 60 * 60 * 1000), // Disponible inmediatamente
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Agregar tarjeta al array
      const updatedCards = [...deck.cards, newCard]

      // Actualizar deck
      await this.updateDeck(deckId, { cards: updatedCards })
      
      console.log('Card added to deck:', deckId)
    } catch (error) {
      console.error('Error adding card to deck:', error)
      throw error
    }
  }

  // Actualizar tarjeta en un deck
  static async updateCardInDeck(deckId: string, cardId: string, updates: Partial<Omit<Flashcard, 'id' | 'deckId' | 'createdAt'>>): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      // Obtener el deck actual
      const deck = await this.getDeckById(deckId)
      if (!deck) {
        throw new Error('Deck not found')
      }

      // Encontrar y actualizar la tarjeta
      const updatedCards = deck.cards.map(card => 
        card.id === cardId 
          ? { ...card, ...updates, updatedAt: new Date() }
          : card
      )

      // Actualizar deck
      await this.updateDeck(deckId, { cards: updatedCards })
      
      console.log('Card updated in deck:', deckId, cardId)
    } catch (error) {
      console.error('Error updating card in deck:', error)
      throw error
    }
  }

  // Eliminar tarjeta de un deck
  static async deleteCardFromDeck(deckId: string, cardId: string): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      // Obtener el deck actual
      const deck = await this.getDeckById(deckId)
      if (!deck) {
        throw new Error('Deck not found')
      }

      // Filtrar la tarjeta a eliminar
      const updatedCards = deck.cards.filter(card => card.id !== cardId)

      // Actualizar deck
      await this.updateDeck(deckId, { cards: updatedCards })
      
      console.log('Card deleted from deck:', deckId, cardId)
    } catch (error) {
      console.error('Error deleting card from deck:', error)
      throw error
    }
  }

  // ====== OPERACIONES DE BÚSQUEDA Y FILTRADO ======

  // Buscar decks por texto
  static async searchDecks(searchTerm: string): Promise<Deck[]> {
    try {
      const allDecks = await this.getDecks()
      
      return allDecks.filter(deck => 
        deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    } catch (error) {
      console.error('Error searching decks:', error)
      return []
    }
  }

  // Filtrar decks por categoría
  static async getDecksByCategory(category: string): Promise<Deck[]> {
    try {
      const q = query(
        collection(db, DECKS_COLLECTION), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const decks: Deck[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        decks.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          cards: data.cards || [],
          tags: data.tags || [],
          category: data.category,
          isPublic: data.isPublic || false,
          difficulty: data.difficulty || 'intermediate',
          estimatedTime: data.estimatedTime || 30,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        })
      })
      
      return decks
    } catch (error) {
      console.error('Error getting decks by category:', error)
      return []
    }
  }

  // Filtrar decks por dificultad
  static async getDecksByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<Deck[]> {
    try {
      const q = query(
        collection(db, DECKS_COLLECTION), 
        where('difficulty', '==', difficulty),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const decks: Deck[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        decks.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          cards: data.cards || [],
          tags: data.tags || [],
          category: data.category || 'General',
          isPublic: data.isPublic || false,
          difficulty: data.difficulty,
          estimatedTime: data.estimatedTime || 30,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        })
      })
      
      return decks
    } catch (error) {
      console.error('Error getting decks by difficulty:', error)
      return []
    }
  }

  // ====== OPERACIONES DE MIGRACIÓN Y BACKUP ======

  // Guardar un deck completo (para migración)
  static async saveDeck(deck: Deck): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      const deckRef = doc(db, DECKS_COLLECTION, deck.id)
      await setDoc(deckRef, {
        name: deck.name,
        description: deck.description,
        cards: deck.cards,
        tags: deck.tags || [],
        category: deck.category || 'General',
        isPublic: deck.isPublic || false,
        difficulty: deck.difficulty || 'intermediate',
        estimatedTime: deck.estimatedTime || 30,
        createdAt: Timestamp.fromDate(deck.createdAt),
        updatedAt: Timestamp.now()
      })
      
      console.log('Deck saved:', deck.id)
    } catch (error) {
      console.error('Error saving deck:', error)
      throw error
    }
  }

  // Migrar datos desde localStorage
  static async migrateLocalData(decks: Deck[]): Promise<void> {
    try {
      const isAuth = await this.ensureAuth()
      if (!isAuth) {
        throw new Error('Not authenticated')
      }

      console.log('🔄 Starting migration of', decks.length, 'decks to Firebase...')
      
      const batch = writeBatch(db)
      
      decks.forEach((deck) => {
        const deckRef = doc(collection(db, DECKS_COLLECTION))
        batch.set(deckRef, {
          name: deck.name,
          description: deck.description,
          cards: deck.cards,
          tags: deck.tags || [],
          category: deck.category || 'General',
          isPublic: deck.isPublic || false,
          difficulty: deck.difficulty || 'intermediate',
          estimatedTime: deck.estimatedTime || 30,
          createdAt: Timestamp.fromDate(deck.createdAt),
          updatedAt: Timestamp.now()
        })
      })
      
      await batch.commit()
      console.log('✅ Migration completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  // ====== ESCUCHA EN TIEMPO REAL ======

  // Escuchar cambios en tiempo real
  static subscribeToDecks(callback: (decks: Deck[]) => void): () => void {
    const q = query(collection(db, DECKS_COLLECTION), orderBy('createdAt', 'desc'))
    
    return onSnapshot(q, (snapshot) => {
      const decks: Deck[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        decks.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          cards: data.cards || [],
          tags: data.tags || [],
          category: data.category || 'General',
          isPublic: data.isPublic || false,
          difficulty: data.difficulty || 'intermediate',
          estimatedTime: data.estimatedTime || 30,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        })
      })
      
      callback(decks)
    }, (error) => {
      console.error('Error listening to decks:', error)
      // En caso de error, seguir funcionando sin tiempo real
    })
  }

  // ====== UTILIDADES ======

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export default FirebaseService