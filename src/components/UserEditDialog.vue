<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="isEditing ? 'Edit User' : 'Create User'"
    :modal="true"
    :closable="true"
    :draggable="false"
    class="w-full max-w-md"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <InputText
          id="name"
          v-model="formData.name"
          :class="{ 'p-invalid': errors.name }"
          placeholder="Enter user name"
          class="w-full"
          required
        />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <InputText
          id="email"
          v-model="formData.email"
          :class="{ 'p-invalid': errors.email }"
          placeholder="Enter email address"
          type="email"
          class="w-full"
          required
        />
        <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
      </div>

      <!-- Password (only for new users) -->
      <div v-if="!isEditing">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <Password
          id="password"
          v-model="formData.password"
          :class="{ 'p-invalid': errors.password }"
          placeholder="Enter password"
          class="w-full"
          toggleMask
          required
        />
        <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
      </div>

      <!-- Role -->
      <div>
        <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <Dropdown
          id="role"
          v-model="formData.role"
          :options="roleOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select user role"
          class="w-full"
        />
      </div>

      <!-- Daily Goal -->
      <div>
        <label for="dailyGoal" class="block text-sm font-medium text-gray-700 mb-1">
          Daily Goal
        </label>
        <InputNumber
          id="dailyGoal"
          v-model="formData.preferences.dailyGoal"
          :min="1"
          :max="100"
          placeholder="Daily study goal"
          class="w-full"
        />
      </div>

      <!-- Study Reminder -->
      <div class="flex items-center space-x-2">
        <Checkbox
          id="studyReminder"
          v-model="formData.preferences.studyReminder"
          binary
        />
        <label for="studyReminder" class="text-sm font-medium text-gray-700">
          Enable study reminders
        </label>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          @click="handleCancel"
          label="Cancel"
          severity="secondary"
          outlined
        />
        <Button
          type="submit"
          :loading="isLoading"
          :label="isEditing ? 'Update User' : 'Create User'"
          severity="primary"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { authService } from '@/services/AuthService'
import type { User, UserRegistration } from '@/types'

interface Props {
  visible: boolean
  user?: Omit<User, 'passwordHash'> | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'user-saved': [user: Omit<User, 'passwordHash'>]
}>()

// State
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})

const formData = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as 'user' | 'admin',
  preferences: {
    studyReminder: true,
    dailyGoal: 20,
    theme: 'auto' as 'light' | 'dark' | 'auto'
  }
})

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Administrator', value: 'admin' }
]

// Computed
const isEditing = computed(() => !!props.user)

// Methods
function resetForm() {
  formData.name = ''
  formData.email = ''
  formData.password = ''
  formData.role = 'user'
  formData.preferences = {
    studyReminder: true,
    dailyGoal: 20,
    theme: 'auto'
  }
  errors.value = {}
}

function populateForm(user: Omit<User, 'passwordHash'>) {
  formData.name = user.name
  formData.email = user.email
  formData.role = user.role
  formData.preferences = { ...user.preferences }
}

function validateForm(): boolean {
  errors.value = {}

  if (!formData.name.trim()) {
    errors.value.name = 'Name is required'
  }

  if (!formData.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.value.email = 'Please enter a valid email address'
  }

  if (!isEditing.value && !formData.password.trim()) {
    errors.value.password = 'Password is required'
  } else if (!isEditing.value && formData.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    isLoading.value = true

    if (isEditing.value && props.user) {
      // Update existing user
      const success = authService.changeUserRole(props.user.id, formData.role)
      if (success) {
        // Update other user data if needed
        authService.updateUserPreferences(props.user.id, formData.preferences)
        
        const updatedUser = authService.getUserById(props.user.id)
        if (updatedUser) {
          emit('user-saved', updatedUser)
        }
      }
    } else {
      // Create new user
      const userData: UserRegistration = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      }

      const response = await authService.register(userData)
      
      // Update role if admin
      if (formData.role === 'admin') {
        authService.changeUserRole(response.user.id, 'admin')
      }
      
      // Update preferences
      authService.updateUserPreferences(response.user.id, formData.preferences)
      
      const finalUser = authService.getUserById(response.user.id)
      if (finalUser) {
        emit('user-saved', finalUser)
      }
    }

    emit('update:visible', false)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('email')) {
        errors.value.email = error.message
      } else {
        errors.value.general = error.message
      }
    }
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}

// Watchers
watch(() => props.visible, (newValue) => {
  if (newValue) {
    if (props.user) {
      populateForm(props.user)
    } else {
      resetForm()
    }
  }
})
</script>
