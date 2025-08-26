import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC__Zm5ZZO-JZGafs5WNJkuIdWsCgQz00k",
  authDomain: "anki-new-f0289.firebaseapp.com",
  projectId: "anki-new-f0289",
  storageBucket: "anki-new-f0289.firebasestorage.app",
  messagingSenderId: "242275689766",
  appId: "1:242275689766:web:e98a6ffbdeca8599f38de7"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar Firestore
export const db = getFirestore(app)

// Inicializar Auth (para futuras funcionalidades de usuario)
export const auth = getAuth(app)

export default app
