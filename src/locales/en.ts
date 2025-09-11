export default {
  // Navigation and General
  nav: {
    dashboard: 'Dashboard',
    adminPanel: 'Admin Panel',
    userSettings: 'User Settings',
    globalSettings: 'Global Settings',
    logout: 'Logout'
  },

  // Dashboard
  dashboard: {
    title: 'Anki Learning Dashboard',
    welcome: 'Welcome back',
    decksSelected: 'decks selected',
    cloudStorage: 'Firebase Cloud Storage',
    studyDecks: 'Your Study Decks',
    noDecks: 'No decks available',
    createFirstDeck: 'Create your first deck to start studying',
    cards: 'cards',
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard'
    },
    lastUpdated: 'Last updated',
    studyNow: 'Study Now',
    progress: 'Progress'
  },

  // User Settings
  userSettings: {
    title: 'User Settings',
    profile: {
      memberSince: 'Member since',
      logout: 'Logout'
    },
    tabs: {
      deckSelection: 'Deck Selection',
      studyPreferences: 'Study Preferences',
      account: 'Account',
      language: 'Language'
    },
    deckSelection: {
      title: 'Deck Selection',
      description: 'Choose which decks you want to study. You can change this at any time.',
      noDecks: 'No decks available',
      selectAll: 'Select All',
      selectNone: 'Select None',
      estimatedTime: 'min',
      saveSelection: 'Save Selection',
      saved: 'Selection saved successfully!'
    },
    studyPreferences: {
      dailyGoal: 'Daily Study Goal',
      dailyGoalDescription: 'Set your daily study goal (5-100 cards per day)',
      studyReminders: 'Study Reminders',
      studyRemindersDescription: 'Get notified when it\'s time to study',
      reminderTime: 'Reminder Time',
      reminderTimeDescription: 'Choose what time you want to receive study reminders',
      theme: 'Theme Preference',
      themeOptions: {
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto'
      },
      savePreferences: 'Save Preferences',
      saved: 'Preferences saved successfully!',
      saveSuccess: 'Settings saved successfully!',
      saveError: 'Error saving settings. Please try again.'
    },
    account: {
      fullName: 'Full Name',
      emailAddress: 'Email Address',
      statistics: 'Study Statistics',
      totalCards: 'Total Cards',
      reviewedToday: 'Reviewed Today',
      cardsDue: 'Cards Due',
      dayStreak: 'Day Streak',
      dangerZone: 'Danger Zone',
      dangerZoneDescription: 'These actions cannot be undone. Please be careful.',
      deleteAccount: 'Delete Account'
    },
    language: {
      title: 'Language Settings',
      description: 'Choose your preferred language for the interface',
      current: 'Current Language',
      available: 'Available Languages',
      english: 'English',
      spanish: 'Español',
      saveLanguage: 'Save Language',
      languageSaved: 'Language changed successfully!',
      languageError: 'Error changing language. Please try again.'
    }
  },

  // Admin Panel
  admin: {
    title: 'Administration Panel',
    userManagement: 'User Management',
    deckManagement: 'Deck Management',
    users: {
      title: 'Users',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      createdAt: 'Created At',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      addUser: 'Add User'
    },
    decks: {
      title: 'Decks',
      name: 'Name',
      description: 'Description',
      difficulty: 'Difficulty',
      cards: 'Cards',
      createdAt: 'Created At',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      addDeck: 'Add Deck'
    }
  },

  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    yes: 'Yes',
    no: 'No',
    on: 'ON',
    off: 'OFF',
    language: 'Language'
  },

  // Messages
  messages: {
    confirmDelete: 'Are you sure you want to delete this item?',
    cannotUndo: 'This action cannot be undone.',
    loginSuccess: 'Login successful',
    logoutSuccess: 'Logout successful',
    saveSuccess: 'Changes saved successfully',
    deleteSuccess: 'Item deleted successfully',
    error: 'An error occurred',
    networkError: 'Network error. Please try again.'
  }
}
