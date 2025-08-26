import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC__Zm5ZZO-JZGafs5WNJkuIdWsCgQz00k",
  authDomain: "project-242275689766.firebaseapp.com",
  projectId: "project-242275689766",
  storageBucket: "project-242275689766.firebasestorage.app",
  messagingSenderId: "242275689766",
  appId: "1:242275689766:web:e98a6ffbdeca8599f38de7"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar Firestore
export const db = getFirestore(app)

// Inicializar Auth
export const auth = getAuth(app)

export default app
