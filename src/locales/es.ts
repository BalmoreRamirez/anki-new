export default {
  // Navigation and General
  nav: {
    dashboard: 'Panel Principal',
    adminPanel: 'Panel de Administración',
    userSettings: 'Configuración de Usuario',
    globalSettings: 'Configuración Global',
    logout: 'Cerrar Sesión'
  },

  // Dashboard
  dashboard: {
    title: 'Panel de Aprendizaje Anki',
    welcome: 'Bienvenido de nuevo',
    decksSelected: 'mazos seleccionados',
    cloudStorage: 'Almacenamiento en la Nube Firebase',
    studyDecks: 'Tus Mazos de Estudio',
    noDecks: 'No hay mazos disponibles',
    createFirstDeck: 'Crea tu primer mazo para comenzar a estudiar',
    cards: 'tarjetas',
    difficulty: {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil'
    },
    lastUpdated: 'Última actualización',
    studyNow: 'Estudiar Ahora',
    progress: 'Progreso'
  },

  // User Settings
  userSettings: {
    title: 'Configuración de Usuario',
    profile: {
      memberSince: 'Miembro desde',
      logout: 'Cerrar Sesión'
    },
    tabs: {
      deckSelection: 'Selección de Mazos',
      studyPreferences: 'Preferencias de Estudio',
      account: 'Cuenta',
      language: 'Idioma'
    },
    deckSelection: {
      title: 'Selección de Mazos',
      description: 'Elige qué mazos quieres estudiar. Puedes cambiar esto en cualquier momento.',
      noDecks: 'No hay mazos disponibles',
      selectAll: 'Seleccionar Todo',
      selectNone: 'No Seleccionar Nada',
      estimatedTime: 'min',
      saveSelection: 'Guardar Selección',
      saved: '¡Selección guardada exitosamente!'
    },
    studyPreferences: {
      dailyGoal: 'Meta Diaria de Estudio',
      dailyGoalDescription: 'Establece tu meta diaria de estudio (5-100 tarjetas por día)',
      studyReminders: 'Recordatorios de Estudio',
      studyRemindersDescription: 'Recibe notificaciones cuando sea hora de estudiar',
      reminderTime: 'Hora del Recordatorio',
      reminderTimeDescription: 'Elige a qué hora quieres recibir recordatorios de estudio',
      theme: 'Preferencia de Tema',
      themeOptions: {
        light: 'Claro',
        dark: 'Oscuro',
        auto: 'Automático'
      },
      savePreferences: 'Guardar Preferencias',
      saved: '¡Preferencias guardadas exitosamente!',
      saveSuccess: '¡Configuraciones guardadas exitosamente!',
      saveError: 'Error al guardar configuraciones. Por favor, inténtalo de nuevo.'
    },
    account: {
      fullName: 'Nombre Completo',
      emailAddress: 'Dirección de Email',
      statistics: 'Estadísticas de Estudio',
      totalCards: 'Tarjetas Totales',
      reviewedToday: 'Revisadas Hoy',
      cardsDue: 'Tarjetas Pendientes',
      dayStreak: 'Racha de Días',
      dangerZone: 'Zona de Peligro',
      dangerZoneDescription: 'Estas acciones no se pueden deshacer. Por favor, ten cuidado.',
      deleteAccount: 'Eliminar Cuenta'
    },
    language: {
      title: 'Configuración de Idioma',
      description: 'Elige tu idioma preferido para la interfaz',
      current: 'Idioma Actual',
      available: 'Idiomas Disponibles',
      english: 'English',
      spanish: 'Español',
      saveLanguage: 'Guardar Idioma',
      languageSaved: '¡Idioma cambiado exitosamente!',
      languageError: 'Error al cambiar idioma. Por favor, inténtalo de nuevo.'
    }
  },

  // Admin Panel
  admin: {
    title: 'Panel de Administración',
    userManagement: 'Gestión de Usuarios',
    deckManagement: 'Gestión de Mazos',
    users: {
      title: 'Usuarios',
      name: 'Nombre',
      email: 'Email',
      role: 'Rol',
      createdAt: 'Creado el',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      addUser: 'Agregar Usuario'
    },
    decks: {
      title: 'Mazos',
      name: 'Nombre',
      description: 'Descripción',
      difficulty: 'Dificultad',
      cards: 'Tarjetas',
      createdAt: 'Creado el',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      addDeck: 'Agregar Mazo'
    }
  },

  // Common
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    close: 'Cerrar',
    confirm: 'Confirmar',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
    yes: 'Sí',
    no: 'No',
    on: 'ACTIVADO',
    off: 'DESACTIVADO',
    language: 'Idioma'
  },

  // Messages
  messages: {
    confirmDelete: '¿Estás seguro de que quieres eliminar este elemento?',
    cannotUndo: 'Esta acción no se puede deshacer.',
    loginSuccess: 'Inicio de sesión exitoso',
    logoutSuccess: 'Cierre de sesión exitoso',
    saveSuccess: 'Cambios guardados exitosamente',
    deleteSuccess: 'Elemento eliminado exitosamente',
    error: 'Ocurrió un error',
    networkError: 'Error de red. Por favor, inténtalo de nuevo.'
  }
}
