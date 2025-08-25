<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<style>
/* Solo estilos específicos que no se pueden hacer con Tailwind */
</style>
