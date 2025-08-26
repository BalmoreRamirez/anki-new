import './assets/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import Tooltip from 'primevue/tooltip'
import ConfirmationService from 'primevue/confirmationservice'

import App from './App.vue'
import router from './router'

// Import auth store to initialize authentication listener
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())

// Initialize auth listener after Pinia is set up
const authStore = useAuthStore()
authStore.initAuthListener()

app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            cssLayer: false
        }
    }
})
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.mount('#app')
