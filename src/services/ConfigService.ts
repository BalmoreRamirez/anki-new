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
import { db, auth } from '@/config/firebase'
import type { GlobalSettings, DeckSettings } from '@/types'

// Colecciones de Firebase
const GLOBAL_SETTINGS_COLLECTION = 'globalSettings'
const DECK_SETTINGS_COLLECTION = 'deckSettings'

export class ConfigService {
  // ====== CONFIGURACIÓN GLOBAL ======

  // Obtener configuración global del usuario
  static async getGlobalSettings(): Promise<GlobalSettings | null> {
    try {
      if (!auth.currentUser) return null

      const userId = auth.currentUser.uid
      const q = query(
        collection(db, GLOBAL_SETTINGS_COLLECTION), 
        where('userId', '==', userId)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        // Crear configuración por defecto si no existe
        return await this.createDefaultGlobalSettings(userId)
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      
      return {
        id: doc.id,
        userId: data.userId,
        language: data.language || 'auto',
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        defaultDeckSettings: data.defaultDeckSettings || this.getDefaultDeckSettings(),
        enableTTS: data.enableTTS ?? true,
        ttsVoice: data.ttsVoice || 'default',
        ttsSpeed: data.ttsSpeed || 1.0,
        autoSync: data.autoSync ?? true,
        offlineMode: data.offlineMode ?? false,
        autoBackup: data.autoBackup ?? true,
        backupFrequency: data.backupFrequency || 'weekly',
        studyStreak: data.studyStreak || 0,
        totalStudyTime: data.totalStudyTime || 0,
        preferredStudyTime: data.preferredStudyTime || ['morning'],
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      }
    } catch (error) {
      console.error('Error getting global settings:', error)
      return null
    }
  }

  // Crear configuración global por defecto
  static async createDefaultGlobalSettings(userId: string): Promise<GlobalSettings> {
    const defaultSettings = {
      userId,
      language: 'auto' as const,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultDeckSettings: this.getDefaultDeckSettings(),
      enableTTS: true,
      ttsVoice: 'default',
      ttsSpeed: 1.0,
      autoSync: true,
      offlineMode: false,
      autoBackup: true,
      backupFrequency: 'weekly' as const,
      studyStreak: 0,
      totalStudyTime: 0,
      preferredStudyTime: ['morning'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const docRef = await addDoc(collection(db, GLOBAL_SETTINGS_COLLECTION), defaultSettings)
    
    return {
      id: docRef.id,
      ...defaultSettings,
      createdAt: defaultSettings.createdAt.toDate(),
      updatedAt: defaultSettings.updatedAt.toDate()
    }
  }

  // Actualizar configuración global
  static async updateGlobalSettings(
    settingsId: string, 
    updates: Partial<Omit<GlobalSettings, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const settingsRef = doc(db, GLOBAL_SETTINGS_COLLECTION, settingsId)
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      
      console.log('Global settings updated:', settingsId)
    } catch (error) {
      console.error('Error updating global settings:', error)
      throw error
    }
  }

  // ====== CONFIGURACIÓN POR DECK ======

  // Obtener configuración de un deck específico
  static async getDeckSettings(deckId: string): Promise<DeckSettings | null> {
    try {
      const q = query(
        collection(db, DECK_SETTINGS_COLLECTION), 
        where('deckId', '==', deckId)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      
      return {
        id: doc.id,
        deckId: data.deckId,
        easeFactor: data.easeFactor || { initial: 2.5, minimum: 1.3, maximum: 2.5 },
        intervals: data.intervals || { learning: [1, 10], graduating: 1, easy: 4 },
        newCardsPerDay: data.newCardsPerDay || 20,
        reviewsPerDay: data.reviewsPerDay || 100,
        showAnswer: data.showAnswer ?? false,
        autoPlayAudio: data.autoPlayAudio ?? true,
        cardLayout: data.cardLayout || 'standard',
        fontSize: data.fontSize || 'medium',
        theme: data.theme || 'auto',
        studyReminders: data.studyReminders ?? true,
        reminderTime: data.reminderTime || '09:00',
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      }
    } catch (error) {
      console.error('Error getting deck settings:', error)
      return null
    }
  }

  // Crear configuración para un deck
  static async createDeckSettings(deckId: string, settings?: Partial<DeckSettings>): Promise<string> {
    try {
      const defaultSettings = this.getDefaultDeckSettings()
      const deckSettings = {
        deckId,
        ...defaultSettings,
        ...settings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, DECK_SETTINGS_COLLECTION), deckSettings)
      
      console.log('Deck settings created:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('Error creating deck settings:', error)
      throw error
    }
  }

  // Actualizar configuración de deck
  static async updateDeckSettings(
    settingsId: string, 
    updates: Partial<Omit<DeckSettings, 'id' | 'deckId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const settingsRef = doc(db, DECK_SETTINGS_COLLECTION, settingsId)
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
      
      console.log('Deck settings updated:', settingsId)
    } catch (error) {
      console.error('Error updating deck settings:', error)
      throw error
    }
  }

  // Eliminar configuración de deck
  static async deleteDeckSettings(deckId: string): Promise<void> {
    try {
      const q = query(
        collection(db, DECK_SETTINGS_COLLECTION), 
        where('deckId', '==', deckId)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const batch = writeBatch(db)
        querySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })
        await batch.commit()
        
        console.log('Deck settings deleted for deck:', deckId)
      }
    } catch (error) {
      console.error('Error deleting deck settings:', error)
      throw error
    }
  }

  // Obtener todas las configuraciones de decks del usuario
  static async getAllDeckSettings(): Promise<DeckSettings[]> {
    try {
      const q = query(
        collection(db, DECK_SETTINGS_COLLECTION), 
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const settings: DeckSettings[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        settings.push({
          id: doc.id,
          deckId: data.deckId,
          easeFactor: data.easeFactor,
          intervals: data.intervals,
          newCardsPerDay: data.newCardsPerDay,
          reviewsPerDay: data.reviewsPerDay,
          showAnswer: data.showAnswer,
          autoPlayAudio: data.autoPlayAudio,
          cardLayout: data.cardLayout,
          fontSize: data.fontSize,
          theme: data.theme,
          studyReminders: data.studyReminders,
          reminderTime: data.reminderTime,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        })
      })
      
      return settings
    } catch (error) {
      console.error('Error getting all deck settings:', error)
      return []
    }
  }

  // ====== CONFIGURACIÓN POR DEFECTO ======

  static getDefaultDeckSettings() {
    return {
      easeFactor: {
        initial: 2.5,
        minimum: 1.3,
        maximum: 2.5
      },
      intervals: {
        learning: [1, 10], // minutos
        graduating: 1, // días
        easy: 4 // días
      },
      newCardsPerDay: 20,
      reviewsPerDay: 100,
      showAnswer: false,
      autoPlayAudio: true,
      cardLayout: 'standard' as const,
      fontSize: 'medium' as const,
      theme: 'auto' as const,
      studyReminders: true,
      reminderTime: '09:00'
    }
  }

  // ====== ESCUCHA EN TIEMPO REAL ======

  // Escuchar cambios en configuración global
  static subscribeToGlobalSettings(userId: string, callback: (settings: GlobalSettings | null) => void): () => void {
    const q = query(
      collection(db, GLOBAL_SETTINGS_COLLECTION), 
      where('userId', '==', userId)
    )
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null)
        return
      }

      const doc = snapshot.docs[0]
      const data = doc.data()
      
      const settings: GlobalSettings = {
        id: doc.id,
        userId: data.userId,
        language: data.language,
        timezone: data.timezone,
        defaultDeckSettings: data.defaultDeckSettings,
        enableTTS: data.enableTTS,
        ttsVoice: data.ttsVoice,
        ttsSpeed: data.ttsSpeed,
        autoSync: data.autoSync,
        offlineMode: data.offlineMode,
        autoBackup: data.autoBackup,
        backupFrequency: data.backupFrequency,
        studyStreak: data.studyStreak,
        totalStudyTime: data.totalStudyTime,
        preferredStudyTime: data.preferredStudyTime,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      }
      
      callback(settings)
    }, (error) => {
      console.error('Error listening to global settings:', error)
      callback(null)
    })
  }

  // Escuchar cambios en configuración de deck
  static subscribeToDeckSettings(deckId: string, callback: (settings: DeckSettings | null) => void): () => void {
    const q = query(
      collection(db, DECK_SETTINGS_COLLECTION), 
      where('deckId', '==', deckId)
    )
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null)
        return
      }

      const doc = snapshot.docs[0]
      const data = doc.data()
      
      const settings: DeckSettings = {
        id: doc.id,
        deckId: data.deckId,
        easeFactor: data.easeFactor,
        intervals: data.intervals,
        newCardsPerDay: data.newCardsPerDay,
        reviewsPerDay: data.reviewsPerDay,
        showAnswer: data.showAnswer,
        autoPlayAudio: data.autoPlayAudio,
        cardLayout: data.cardLayout,
        fontSize: data.fontSize,
        theme: data.theme,
        studyReminders: data.studyReminders,
        reminderTime: data.reminderTime,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      }
      
      callback(settings)
    }, (error) => {
      console.error('Error listening to deck settings:', error)
      callback(null)
    })
  }
}

export default ConfigService
