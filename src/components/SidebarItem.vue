<template>
  <button
    @click="$emit('click')"
    :class="buttonClasses"
    :title="collapsed ? label : ''"
  >
    <i :class="iconClasses"></i>
    <span v-if="!collapsed" class="ml-3 font-medium">{{ label }}</span>

    <!-- Active indicator -->
    <div v-if="active && !collapsed" class="ml-auto">
      <div class="w-2 h-2 bg-current rounded-full opacity-60"></div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  label: string
  active?: boolean
  collapsed?: boolean
  variant?: 'default' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  collapsed: false,
  variant: 'default'
})

defineEmits<{
  'click': []
}>()

const buttonClasses = computed(() => [
  'flex items-center w-full p-3 text-left rounded-lg transition-all duration-200',
  'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
  props.collapsed ? 'justify-center' : '',
  props.active ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700',
  props.variant === 'danger' ? 'hover:bg-red-50 hover:text-red-600' : ''
])

const iconClasses = computed(() => [
  'pi',
  props.icon,
  'text-lg',
  props.active ? 'text-blue-600' : ''
])
</script>
