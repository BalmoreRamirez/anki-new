<template>
  <div class="admin-sidebar">
    <!-- Sidebar Overlay (mobile) -->
    <div
      v-if="isOpen && isMobile"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <div :class="sidebarClasses">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <i class="pi pi-shield text-white text-lg"></i>
          </div>
          <div v-if="!isCollapsed">
            <h2 class="font-bold text-gray-800">Admin Panel</h2>
            <p class="text-sm text-gray-600">{{ authStore.userName }}</p>
          </div>
        </div>

        <!-- Toggle Button -->
        <Button
          @click="toggleCollapse"
          icon="pi pi-angle-left"
          :class="{ 'rotate-180': isCollapsed }"
          text
          rounded
          size="small"
          class="hidden lg:flex transition-transform duration-200"
        />

        <!-- Close Button (mobile) -->
        <Button
          @click="closeSidebar"
          icon="pi pi-times"
          text
          rounded
          size="small"
          class="lg:hidden"
        />
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 p-4 space-y-2">
        <!-- Dashboard -->
        <SidebarItem
          icon="pi-th-large"
          label="Dashboard"
          :active="currentRoute === 'dashboard'"
          :collapsed="isCollapsed"
          @click="navigateTo('dashboard')"
        />

        <!-- Deck Management -->
        <SidebarItem
          icon="pi-folder"
          label="Manage Decks"
          :active="currentRoute === 'decks'"
          :collapsed="isCollapsed"
          @click="navigateTo('decks')"
        />

        <!-- User Management -->
        <SidebarItem
          icon="pi-users"
          label="Manage Users"
          :active="currentRoute === 'users'"
          :collapsed="isCollapsed"
          @click="navigateTo('users')"
        />

        <!-- Analytics -->
        <SidebarItem
          icon="pi-chart-bar"
          label="Analytics"
          :active="currentRoute === 'analytics'"
          :collapsed="isCollapsed"
          @click="navigateTo('analytics')"
        />

        <!-- Settings -->
        <SidebarItem
          icon="pi-cog"
          label="System Settings"
          :active="currentRoute === 'settings'"
          :collapsed="isCollapsed"
          @click="navigateTo('settings')"
        />

        <div class="border-t border-gray-200 my-4"></div>

        <!-- Back to App -->
        <SidebarItem
          icon="pi-arrow-left"
          label="Back to App"
          :collapsed="isCollapsed"
          @click="backToApp"
        />

        <!-- Logout -->
        <SidebarItem
          icon="pi-sign-out"
          label="Logout"
          :collapsed="isCollapsed"
          variant="danger"
          @click="logout"
        />
      </nav>

      <!-- Footer -->
      <div v-if="!isCollapsed" class="p-4 border-t border-gray-200">
        <div class="text-xs text-gray-500 text-center">
          <p>Anki Admin v1.0</p>
          <p>{{ new Date().getFullYear() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import SidebarItem from './SidebarItem.vue'

interface Props {
  isOpen: boolean
  currentRoute: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'navigate': [route: string]
  'back-to-app': []
}>()

const router = useRouter()
const authStore = useAuthStore()

// State
const isCollapsed = ref(false)
const isMobile = ref(false)

// Computed
const sidebarClasses = computed(() => [
  'fixed lg:relative top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 z-50 flex flex-col',
  isCollapsed.value ? 'w-16' : 'w-64',
  props.isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
])

// Methods
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function closeSidebar() {
  emit('update:isOpen', false)
}

function navigateTo(route: string) {
  emit('navigate', route)
  if (isMobile.value) {
    closeSidebar()
  }
}

function backToApp() {
  emit('back-to-app')
  if (isMobile.value) {
    closeSidebar()
  }
}

function logout() {
  authStore.logout()
  router.push('/auth')
}

function handleResize() {
  isMobile.value = window.innerWidth < 1024
  if (!isMobile.value) {
    emit('update:isOpen', true)
  }
}

// Lifecycle
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-sidebar {
  @apply h-full;
}
</style>
