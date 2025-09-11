import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/components/AuthForm.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ],
})

// Navigation guard para proteger rutas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Rutas que requieren autenticación
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth')
    return
  }

  // Rutas que requieren permisos de administrador
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/') // Redirigir a home si no es admin
    return
  }

  // Rutas solo para invitados (login/register)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router
