# EventOS

PWA para gestión de agenda y órdenes de alquiler de mobiliario para eventos — sillas, mesas, carpas y tarimas.

---

## Características

- **Órdenes** — crear, editar, eliminar y cambiar estado (pendiente / confirmado / entregado)
- **Fotos por orden** — subida de imagen via Firebase Storage
- **Exportación** — descarga en Excel (.xlsx) y PDF
- **Clientes** — listado consolidado a partir de las órdenes registradas
- **Actividad** — auditoría completa: quién creó o modificó cada orden y cuándo
- **Autenticación** — login con email/contraseña via Firebase Auth
- **PWA instalable** — funciona como app nativa en Android e iOS con soporte offline (Workbox)
- **Modo mock** — bandera de desarrollo para trabajar completamente offline, sin Firebase

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript |
| Bundler | Vite 8 |
| Routing | React Router v7 |
| Backend | Firebase v12 — Auth, Firestore, Storage |
| PWA | vite-plugin-pwa + Workbox |
| Estilos | CSS Modules + CSS custom properties |
| Exportación | @react-pdf/renderer, xlsx |
| Iconos | lucide-react |

---

## Estructura del proyecto

```
src/
├── components/       # BottomNav, OrdenCard, FilterChips, CollapseSection, HeroImage, ItemRow
├── contexts/         # AuthContext — estado de autenticación global
├── data/             # seed.ts — datos mock y flag USE_MOCK_DATA
├── hooks/            # useOrdenes, useOrden
├── pages/            # Home, Ordenes, DetalleOrden, NuevaOrden, Clientes, Actividad, Login
├── services/         # firebase.ts, exportExcel.ts, exportPdf.tsx
├── styles/           # global.css, variables.css
└── types.ts          # Tipos TypeScript — Orden, ItemOrden, EstadoOrden, AuditInfo
```

---

## Inicio rápido — modo mock (sin Firebase)

Si solo quieres explorar la app sin configurar Firebase:

```bash
git clone https://github.com/tu-usuario/eventoS.git
cd eventoS
npm install
npm run dev
```

Asegúrate de que en `src/data/seed.ts` esté:

```ts
export const USE_MOCK_DATA = true;
```

Abre `http://localhost:5173`. La app carga 5 órdenes de ejemplo en memoria, sin necesitar credenciales.

---

## Configuración con Firebase (producción)

### 1. Variables de entorno

Crea un archivo `.env.local` en la raíz (usa `.env.example` como plantilla):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Obtén estos valores en **Firebase Console → Configuración del proyecto → Tus aplicaciones → Web**.

### 2. Habilitar servicios en Firebase Console

**Authentication** — habilita el proveedor **Email/Password**.

**Firestore Database** — crea la base de datos y configura las reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ordenes/{ordenId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage** — habilita Firebase Storage para la subida de imágenes.

### 3. Activar Firebase en el código

En `src/data/seed.ts`, cambia el flag:

```ts
export const USE_MOCK_DATA = false;
```

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (TypeScript + Vite) |
| `npm run preview` | Previsualización del build local |
| `npm run lint` | Análisis estático con ESLint |

---

## Despliegue

El build genera una carpeta `dist/` lista para cualquier hosting estático.

### Vercel (recomendado)

1. Push del repositorio a GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com) — Vite se detecta automáticamente
3. Agrega las variables de entorno en la configuración del proyecto
4. Despliega

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # directorio público: dist | SPA: sí
npm run build
firebase deploy
```

---

## Instalar la PWA en el celular

1. Abre la URL de tu app en Chrome (Android) o Safari (iOS)
2. **Android:** Menú ⋮ → **Agregar a pantalla de inicio**
3. **iOS:** Compartir → **Agregar a pantalla de inicio**

La app se instala sin Play Store ni App Store.

---

## Licencia

MIT
