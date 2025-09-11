export interface Flashcard {
  id: string
  spanish: string
  english: string
  pronunciation?: string
  examples?: string[]
  deckId: string
  difficulty: 'easy' | 'medium' | 'hard'
  nextReviewDate: Date
  reviewCount: number
  easeFactor: number
  interval: number
  createdAt: Date
  updatedAt: Date
  // Aliases for easier access in components
  front?: string
  back?: string
  lastReviewed?: Date
  nextReview?: Date
}

// Helper type for creating new cards
export type NewFlashcard = Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt' | 'front' | 'back' | 'lastReviewed' | 'nextReview'>

// Factory function to create flashcard with computed properties
export function createFlashcard(data: NewFlashcard & { id: string; createdAt: Date; updatedAt: Date }): Flashcard {
  return {
    ...data,
    front: data.spanish,
    back: data.english,
    lastReviewed: data.updatedAt,
    nextReview: data.nextReviewDate
  }
}

export interface DeckSettings {
  id: string
  deckId: string
  // Configuración de algoritmo SM2
  easeFactor: {
    initial: number
    minimum: number
    maximum: number
  }
  intervals: {
    learning: number[]
    graduating: number
    easy: number
  }
  // Configuración de estudio
  newCardsPerDay: number
  reviewsPerDay: number
  showAnswer: boolean
  autoPlayAudio: boolean
  // Configuración visual
  cardLayout: 'standard' | 'compact' | 'detailed'
  fontSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'auto'
  // Configuración de notificaciones
  studyReminders: boolean
  reminderTime: string
  createdAt: Date
  updatedAt: Date
}

export interface GlobalSettings {
  id: string
  userId: string
  // Configuración general
  language: 'en' | 'es' | 'auto'
  timezone: string
  // Configuración de estudio por defecto
  defaultDeckSettings: Omit<DeckSettings, 'id' | 'deckId' | 'createdAt' | 'updatedAt'>
  // Configuración de la aplicación
  enableTTS: boolean
  ttsVoice: string
  ttsSpeed: number
  // Configuración de Firebase
  autoSync: boolean
  offlineMode: boolean
  // Configuración de backup
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  // Estadísticas globales
  studyStreak: number
  totalStudyTime: number
  preferredStudyTime: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Deck {
  id: string
  name: string
  description?: string
  cards: Flashcard[]
  settings?: DeckSettings
  tags: string[]
  category: string
  isPublic: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // minutos para completar
  createdAt: Date
  updatedAt: Date
}

export interface ReviewSession {
  deckId: string
  cardsToReview: Flashcard[]
  currentCardIndex: number
  totalCards: number
  completedCards: number
}

export interface StudyStats {
  totalCards: number
  reviewedToday: number
  cardsLearning: number
  cardsMature: number
}

export type ReviewResponse = 'again' | 'hard' | 'good' | 'easy'

// Declaración global para el contador de IDs
declare global {
  interface Window {
    ankiIdCounter?: number
  }
}

// Auth interfaces
export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: 'user' | 'admin' // Agregar rol de usuario
  selectedDeckIds: string[]
  preferences: {
    studyReminder: boolean
    reminderTime: string // Formato "HH:mm"
    dailyGoal: number
    theme: 'light' | 'dark' | 'auto'
    language: 'en' | 'es'
  }
  createdAt: Date
  updatedAt: Date
}

export interface UserRegistration {
  name: string
  email: string
  password: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>
  token: string
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}
