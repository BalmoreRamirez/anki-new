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
}

export interface Deck {
  id: string
  name: string
  description?: string
  cards: Flashcard[]
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
