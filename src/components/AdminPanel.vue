<template>
  <div class="admin-panel">
    <!-- Mobile Header -->
    <div class="lg:hidden flex items-center justify-between p-4 bg-white border-b">
      <h1 class="text-xl font-bold text-gray-800">Admin Panel</h1>
      <Button
        @click="sidebarOpen = true"
        icon="pi pi-bars"
        text
        rounded
      />
    </div>

    <div class="flex h-screen lg:h-[calc(100vh-64px)]">
      <!-- Sidebar -->
      <AdminSidebar
        v-model:isOpen="sidebarOpen"
        :currentRoute="currentView"
        @navigate="handleNavigation"
        @back-to-app="$emit('back-to-app')"
      />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-800">{{ currentViewTitle }}</h1>
              <p class="text-gray-600 mt-1">{{ currentViewDescription }}</p>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center space-x-3">
              <div class="text-right text-sm text-gray-500">
                <p>{{ authStore.userName }}</p>
                <p>Administrator</p>
              </div>
              <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <i class="pi pi-shield text-white"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto bg-gray-50">
          <div class="p-6">
            <!-- Dashboard View -->
            <div v-if="currentView === 'dashboard'" class="space-y-6">
              <!-- Stats Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-2 bg-blue-100 rounded-lg">
                      <i class="pi pi-users text-blue-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Users</p>
                      <p class="text-2xl font-bold text-gray-900">{{ stats.totalUsers }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-2 bg-green-100 rounded-lg">
                      <i class="pi pi-folder text-green-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Decks</p>
                      <p class="text-2xl font-bold text-gray-900">{{ stats.totalDecks }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-2 bg-purple-100 rounded-lg">
                      <i class="pi pi-list text-purple-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Cards</p>
                      <p class="text-2xl font-bold text-gray-900">{{ stats.totalCards }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-2 bg-orange-100 rounded-lg">
                      <i class="pi pi-chart-line text-orange-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Active Today</p>
                      <p class="text-2xl font-bold text-gray-900">{{ stats.activeToday }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center space-x-4">
                      <div :class="[
                        'w-2 h-2 rounded-full',
                        activity.type === 'user' ? 'bg-blue-400' :
                        activity.type === 'deck' ? 'bg-green-400' : 'bg-purple-400'
                      ]"></div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-900">{{ activity.message }}</p>
                        <p class="text-xs text-gray-500">{{ formatDate(activity.timestamp) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Users Management View -->
            <div v-else-if="currentView === 'users'" class="space-y-6">
              <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Users Management</h3>
                    <div class="flex space-x-3">
                      <InputText
                        v-model="userSearchQuery"
                        placeholder="Search users..."
                        class="w-64"
                      />
                      <Button
                        @click="createNewUser"
                        icon="pi pi-plus"
                        label="Add User"
                        severity="success"
                      />
                      <Button
                        @click="loadUsers"
                        icon="pi pi-refresh"
                        severity="secondary"
                        outlined
                      />
                    </div>
                  </div>
                </div>

                <DataTable
                  :value="filteredUsers"
                  :loading="isLoadingUsers"
                  paginator
                  :rows="10"
                  responsiveLayout="scroll"
                >
                  <Column field="name" header="Name" sortable></Column>
                  <Column field="email" header="Email" sortable></Column>
                  <Column field="role" header="Role" sortable>
                    <template #body="{ data }">
                      <Tag
                        :value="data.role"
                        :severity="data.role === 'admin' ? 'danger' : 'info'"
                      />
                    </template>
                  </Column>
                  <Column field="selectedDeckIds" header="Selected Decks">
                    <template #body="{ data }">
                      {{ data.selectedDeckIds.length }} decks
                    </template>
                  </Column>
                  <Column field="createdAt" header="Created" sortable>
                    <template #body="{ data }">
                      {{ formatDate(data.createdAt) }}
                    </template>
                  </Column>
                  <Column header="Actions">
                    <template #body="{ data }">
                      <div class="flex space-x-2">
                        <Button
                          @click="editUser(data)"
                          icon="pi pi-pencil"
                          size="small"
                          severity="info"
                          outlined
                        />
                        <Button
                          @click="confirmDeleteUser(data)"
                          :disabled="data.role === 'admin'"
                          icon="pi pi-trash"
                          size="small"
                          severity="danger"
                          outlined
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>

            <!-- Deck Management View -->
            <div v-else-if="currentView === 'decks'" class="space-y-6">
              <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium text-gray-900">Deck Management</h3>
                    <div class="flex space-x-3">
                      <InputText
                        v-model="deckSearchQuery"
                        placeholder="Search decks..."
                        class="w-64"
                      />
                      <Button
                        @click="createNewDeck"
                        icon="pi pi-plus"
                        label="Create Deck"
                        severity="success"
                      />
                    </div>
                  </div>
                </div>

                <DataTable
                  :value="filteredDecks"
                  :loading="isLoadingDecks"
                  paginator
                  :rows="10"
                  responsiveLayout="scroll"
                >
                  <Column field="name" header="Name" sortable></Column>
                  <Column field="description" header="Description"></Column>
                  <Column field="cards" header="Cards">
                    <template #body="{ data }">
                      {{ data.cards.length }} cards
                    </template>
                  </Column>
                  <Column field="difficulty" header="Difficulty" sortable>
                    <template #body="{ data }">
                      <Tag
                        :value="data.difficulty"
                        :severity="
                          data.difficulty === 'beginner' ? 'success' :
                          data.difficulty === 'intermediate' ? 'warning' : 'danger'
                        "
                      />
                    </template>
                  </Column>
                  <Column field="createdAt" header="Created" sortable>
                    <template #body="{ data }">
                      {{ formatDate(data.createdAt) }}
                    </template>
                  </Column>
                  <Column header="Actions">
                    <template #body="{ data }">
                      <div class="flex space-x-2">
                        <Button
                          @click="editDeck(data)"
                          icon="pi pi-pencil"
                          size="small"
                          severity="info"
                          outlined
                        />
                        <Button
                          @click="manageDeckCards(data)"
                          icon="pi pi-list"
                          size="small"
                          severity="secondary"
                          outlined
                        />
                        <Button
                          @click="confirmDeleteDeck(data)"
                          icon="pi pi-trash"
                          size="small"
                          severity="danger"
                          outlined
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>

            <!-- Analytics View -->
            <div v-else-if="currentView === 'analytics'" class="space-y-6">
              <div class="bg-white rounded-lg shadow p-6 text-center">
                <i class="pi pi-chart-bar text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                <p class="text-gray-600">Advanced analytics features coming soon...</p>
              </div>
            </div>

            <!-- Settings View -->
            <div v-else-if="currentView === 'settings'" class="space-y-6">
              <div class="bg-white rounded-lg shadow p-6 text-center">
                <i class="pi pi-cog text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
                <p class="text-gray-600">System configuration options coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog />

    <!-- User Edit Dialog -->
    <UserEditDialog
      v-model:visible="showUserDialog"
      :user="selectedUser"
      @user-saved="handleUserSaved"
    />

    <!-- Deck Edit Dialog -->
    <DeckEditDialog
      v-model:visible="showDeckDialog"
      :deck="selectedDeck"
      @deck-saved="handleDeckSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import { useAuthStore } from '@/stores/auth'
import { useAnkiStore } from '@/stores/anki'
import { authService } from '@/services/AuthService'
import AdminSidebar from './AdminSidebar.vue'
import UserEditDialog from './UserEditDialog.vue'
import DeckEditDialog from './DeckEditDialog.vue'
import type { User, Deck } from '@/types'

defineEmits<{
  'back-to-app': []
}>()

const confirm = useConfirm()
const authStore = useAuthStore()
const ankiStore = useAnkiStore()

// State
const sidebarOpen = ref(true)
const currentView = ref('dashboard')
const isLoadingUsers = ref(false)
const isLoadingDecks = ref(false)
const userSearchQuery = ref('')
const deckSearchQuery = ref('')
const allUsers = ref<Omit<User, 'passwordHash'>[]>([])
const showUserDialog = ref(false)
const showDeckDialog = ref(false)
const selectedUser = ref<Omit<User, 'passwordHash'> | null>(null)
const selectedDeck = ref<Deck | null>(null)

// Computed
const currentViewTitle = computed(() => {
  const titles = {
    dashboard: 'Dashboard',
    users: 'User Management',
    decks: 'Deck Management',
    analytics: 'Analytics',
    settings: 'System Settings'
  }
  return titles[currentView.value as keyof typeof titles] || 'Admin Panel'
})

const currentViewDescription = computed(() => {
  const descriptions = {
    dashboard: 'Overview of system activity and statistics',
    users: 'Manage user accounts and permissions',
    decks: 'Create and manage study decks',
    analytics: 'View detailed system analytics',
    settings: 'Configure system settings'
  }
  return descriptions[currentView.value as keyof typeof descriptions] || ''
})

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return allUsers.value
  return allUsers.value.filter(user =>
    user.name.toLowerCase().includes(userSearchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.value.toLowerCase())
  )
})

const filteredDecks = computed(() => {
  if (!deckSearchQuery.value) return ankiStore.decks
  return ankiStore.decks.filter(deck =>
    deck.name.toLowerCase().includes(deckSearchQuery.value.toLowerCase()) ||
    (deck.description && deck.description.toLowerCase().includes(deckSearchQuery.value.toLowerCase()))
  )
})

const stats = computed(() => ({
  totalUsers: allUsers.value.length,
  totalDecks: ankiStore.decks.length,
  totalCards: ankiStore.decks.reduce((sum, deck) => sum + deck.cards.length, 0),
  activeToday: Math.floor(allUsers.value.length * 0.3) // Placeholder
}))

const recentActivity = computed(() => [
  { id: 1, type: 'user', message: 'New user registered', timestamp: new Date() },
  { id: 2, type: 'deck', message: 'Deck "Business English" created', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: 3, type: 'card', message: '5 new cards added to Spanish Verbs', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
])

// Methods
function handleNavigation(route: string) {
  currentView.value = route
}

function loadUsers() {
  try {
    isLoadingUsers.value = true
    allUsers.value = authService.getAllUsers()
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    isLoadingUsers.value = false
  }
}

function createNewUser() {
  selectedUser.value = null
  showUserDialog.value = true
}

function editUser(user: Omit<User, 'passwordHash'>) {
  selectedUser.value = user
  showUserDialog.value = true
}

function handleUserSaved(user: Omit<User, 'passwordHash'>) {
  loadUsers() // Reload users to reflect changes
  console.log('User saved:', user.name)
}

function confirmDeleteUser(user: Omit<User, 'passwordHash'>) {
  confirm.require({
    message: `¿Estás seguro de que quieres eliminar al usuario "${user.name}"?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      try {
        authService.deleteUser(user.id)
        loadUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  })
}

function createNewDeck() {
  selectedDeck.value = null
  showDeckDialog.value = true
}

function editDeck(deck: Deck) {
  selectedDeck.value = deck
  showDeckDialog.value = true
}

function handleDeckSaved(deck: Deck) {
  console.log('Deck saved:', deck.name)
  // The store will automatically update the reactive data
}

function manageDeckCards(deck: Deck) {
  // For now, just edit the deck (the dialog includes card management)
  editDeck(deck)
}

function confirmDeleteDeck(deck: Deck) {
  confirm.require({
    message: `¿Estás seguro de que quieres eliminar el deck "${deck.name}" con ${deck.cards.length} cartas?`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      ankiStore.deleteDeck(deck.id)
    }
  })
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-panel {
  @apply min-h-screen bg-gray-100;
}
</style>
