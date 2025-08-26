# Firebase Configuration Guide

## What we've implemented:

### 1. Firebase Service (src/services/FirebaseService.ts)
- Complete CRUD operations for decks and cards
- Real-time synchronization with Firestore
- Migration from localStorage to Firebase
- Batch operations for data consistency

### 2. Store Integration (src/stores/anki.ts)
- Added Firebase toggle functionality
- Firebase load/save methods
- Migration capabilities
- Error handling with localStorage fallback

### 3. Storage Settings Component (src/components/StorageSettings.vue)
- User interface to choose between localStorage and Firebase
- Migration wizard
- Real-time status updates

## To complete Firebase setup:

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Firestore Database in test mode

### Step 2: Get Firebase Config
1. In your Firebase project, go to Project Settings
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register your app
5. Copy the firebase config object

### Step 3: Update Firebase Config
Replace the placeholder values in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
}
```

### Step 4: Test Firebase Integration
1. Make sure your app is running (`npm run dev`)
2. Click the "Settings" button in the dashboard
3. Select "Firebase Cloud Storage"
4. Your data should migrate automatically

## Current Status:
✅ Firebase SDK installed
✅ Service layer implemented
✅ Store integration ready
✅ UI components created
⏳ Firebase config needs real credentials
⏳ Testing required

## Benefits after setup:
- 🌐 Cross-device synchronization
- 📱 Access from any device
- 🔄 Real-time updates
- 💾 Cloud backup
- 📊 Future analytics capabilities

## Fallback:
If Firebase is not configured or fails, the app automatically falls back to localStorage, so existing functionality is preserved.
