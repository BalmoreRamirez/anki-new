import './assets/tailwind.css'
import './assets/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import Tooltip from 'primevue/tooltip'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'
import { useSettingsStore } from './stores/settings'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
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
app.use(ToastService)
app.directive('tooltip', Tooltip)

// Inicializar configuración global
const settingsStore = useSettingsStore()
settingsStore.init()

app.mount('#app')
