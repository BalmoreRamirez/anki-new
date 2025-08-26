# 🔧 Instrucciones para Configurar Firebase Authentication

## ❌ Error Actual: `redirect_uri_mismatch`

Este error ocurre porque las URLs de desarrollo no están autorizadas en Firebase Console.

## ✅ Solución: Configurar Dominios Autorizados

### **Paso 1: Abrir Firebase Console**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **project-242275689766**

### **Paso 2: Configurar Authentication**
1. En el menú lateral, haz clic en **"Authentication"**
2. Ve a la pestaña **"Sign-in method"**
3. Busca **"Google"** en la lista de proveedores
4. Haz clic en **"Google"** para editarlo

### **Paso 3: Agregar Dominios Autorizados**
En la sección **"Authorized domains"**, agrega las siguientes URLs:

```
localhost
http://localhost:5173
http://localhost:3000
http://localhost:4173
http://localhost:8080
127.0.0.1:5173
127.0.0.1:3000
```

### **Paso 4: Configurar OAuth Consent Screen (Google Cloud Console)**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto **project-242275689766**
3. Ve a **"APIs & Services" > "OAuth consent screen"**
4. En **"Authorized domains"**, agrega:
   ```
   localhost
   firebaseapp.com
   ```

### **Paso 5: Configurar OAuth 2.0 Client IDs**
1. En Google Cloud Console, ve a **"APIs & Services" > "Credentials"**
2. Busca tu **OAuth 2.0 client ID** (debería estar listado)
3. Haz clic para editarlo
4. En **"Authorized JavaScript origins"**, agrega:
   ```
   http://localhost:5173
   http://localhost:3000
   http://localhost:4173
   http://localhost:8080
   ```
5. En **"Authorized redirect URIs"**, agrega:
   ```
   http://localhost:5173/__/auth/handler
   http://localhost:3000/__/auth/handler
   ```

### **Paso 6: Verificar Configuración**
Después de guardar los cambios:
1. Espera 5-10 minutos para que se propaguen los cambios
2. Recarga tu aplicación en `http://localhost:5173`
3. Intenta iniciar sesión con Google nuevamente

## 🔍 URLs Específicas para tu Proyecto

**Auth Domain:** `project-242275689766.firebaseapp.com`
**Proyecto ID:** `project-242275689766`
**URL de Desarrollo:** `http://localhost:5173`

## 📝 Notas Importantes

- Los cambios pueden tardar hasta 10 minutos en propagarse
- Asegúrate de estar usando exactamente `http://localhost:5173` (sin HTTPS en desarrollo)
- Si cambias el puerto, necesitarás agregarlo a la configuración

## 🚨 Verificación Rápida

Si sigues teniendo problemas, verifica que:
1. ✅ Firebase Authentication está habilitado
2. ✅ Google provider está habilitado
3. ✅ Dominios autorizados incluyen localhost:5173
4. ✅ OAuth consent screen está configurado correctamente
