<template>
  <div class="admin-view">
    <AdminPanel @back-to-app="handleBackToApp" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminPanel from '@/components/AdminPanel.vue'

const router = useRouter()

function handleBackToApp() {
  router.push('/')
}
</script>

<style scoped>
.admin-view {
  min-height: 100vh;
}
</style>
