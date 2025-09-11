import bcrypt from 'bcryptjs'
import type {
  User,
  UserRegistration,
  UserLogin,
  AuthResponse
} from '@/types'

// Interface para sesión de usuario
interface UserSession {
  userId: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  expiresAt: Date
}

// Clave para almacenar la sesión
const SESSION_KEY = 'anki-user-session'
const SESSION_DURATION_DAYS = 7

export class AuthService {
  private users: User[] = []

  constructor() {
    this.loadUsersFromStorage()
    this.createDefaultAdminUser()
  }

  // Registrar nuevo usuario
  async register(userData: UserRegistration): Promise<AuthResponse> {
    // Verificar si el email ya existe
    if (this.users.find(user => user.email === userData.email)) {
      throw new Error('El email ya está registrado')
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(userData.password, salt)

    // Crear el usuario
    const user: User = {
      id: this.generateId(),
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: 'user',
      selectedDeckIds: [],
      preferences: {
        studyReminder: true,
        reminderTime: '18:00',
        dailyGoal: 20,
        theme: 'auto',
        language: 'en'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Guardar el usuario
    this.users.push(user)
    this.saveUsersToStorage()

    // Crear sesión
    const session = this.createUserSession(user)

    // Retornar respuesta sin el hash de la contraseña
    return {
      user: this.sanitizeUser(user),
      token: session.userId // Usamos el ID como token simple
    }
  }

  // Iniciar sesión
  async login(credentials: UserLogin): Promise<AuthResponse> {
    // Buscar usuario por email
    const user = this.users.find(u => u.email === credentials.email)
    if (!user) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('Email o contraseña incorrectos')
    }

    // Crear sesión
    const session = this.createUserSession(user)

    return {
      user: this.sanitizeUser(user),
      token: session.userId
    }
  }

  // Crear sesión de usuario
  private createUserSession(user: User): UserSession {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000))

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: now,
      expiresAt
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  }

  // Verificar sesión válida
  private verifySession(): UserSession | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY)
      if (!sessionData) return null

      const session: UserSession = JSON.parse(sessionData)
      
      // Verificar si la sesión ha expirado
      if (new Date() > new Date(session.expiresAt)) {
        this.logout()
        return null
      }

      return session
    } catch (error) {
      // Sesión corrupta, limpiar
      this.logout()
      return null
    }
  }

  // Obtener usuario actual desde localStorage
  getCurrentUser(): Omit<User, 'passwordHash'> | null {
    const session = this.verifySession()
    if (!session) return null

    const user = this.getUserById(session.userId)
    return user ? this.sanitizeUser(user) : null
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem(SESSION_KEY)
  }

  // Crear usuario administrador por defecto
  private async createDefaultAdminUser(): Promise<void> {
    const adminExists = this.users.find(user => user.role === 'admin')

    if (!adminExists) {
      const adminUser: User = {
        id: this.generateId(),
        name: 'Administrator',
        email: 'admin@anki.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        selectedDeckIds: [],
        preferences: {
          studyReminder: true,
          reminderTime: '18:00',
          dailyGoal: 50,
          theme: 'auto',
          language: 'en'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.users.push(adminUser)
      this.saveUsersToStorage()
      console.log('✅ Default admin user created: admin@anki.com / admin123')
    }
  }

  // Obtener usuario por ID
  getUserById(userId: string): User | null {
    return this.users.find(u => u.id === userId) || null
  }

  // Actualizar preferencias del usuario
  updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): void {
    const user = this.users.find(u => u.id === userId)
    if (user) {
      user.preferences = { ...user.preferences, ...preferences }
      user.updatedAt = new Date()
      this.saveUsersToStorage()
    }
  }

  // Actualizar decks seleccionados del usuario
  updateUserSelectedDecks(userId: string, deckIds: string[]): void {
    const user = this.users.find(u => u.id === userId)
    if (user) {
      user.selectedDeckIds = deckIds
      user.updatedAt = new Date()
      this.saveUsersToStorage()
    }
  }

  // Obtener todos los usuarios (solo para administradores)
  getAllUsers(): Omit<User, 'passwordHash'>[] {
    return this.users.map(user => this.sanitizeUser(user))
  }

  // Eliminar usuario (solo para administradores)
  deleteUser(userId: string): boolean {
    const userIndex = this.users.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      // No permitir eliminar al administrador
      if (this.users[userIndex].role === 'admin') {
        throw new Error('No se puede eliminar al administrador')
      }

      this.users.splice(userIndex, 1)
      this.saveUsersToStorage()
      return true
    }
    return false
  }

  // Cambiar rol de usuario (solo para administradores)
  changeUserRole(userId: string, newRole: 'user' | 'admin'): boolean {
    const user = this.users.find(u => u.id === userId)
    if (user) {
      user.role = newRole
      user.updatedAt = new Date()
      this.saveUsersToStorage()
      return true
    }
    return false
  }

  // Sanitizar usuario (remover hash de contraseña)
  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user
    return sanitizedUser
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  // Cargar usuarios desde localStorage
  private loadUsersFromStorage(): void {
    try {
      const stored = localStorage.getItem('anki-users')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.users = parsed.map((user: any) => ({
          ...user,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }))
      }
    } catch (error) {
      console.error('Error loading users from storage:', error)
      this.users = []
    }
  }

  // Guardar usuarios en localStorage
  private saveUsersToStorage(): void {
    try {
      localStorage.setItem('anki-users', JSON.stringify(this.users))
    } catch (error) {
      console.error('Error saving users to storage:', error)
    }
  }
}

// Instancia singleton
export const authService = new AuthService()
