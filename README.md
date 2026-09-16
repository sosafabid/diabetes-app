# Acompañante de gestión de diabetes (MVP)

> Nombre provisional. Acompañante personal para la gestión diaria de la
> diabetes: alimentación → insulina → glucosa → ejercicio → estrés/recuperación
> → seguimiento → patrones → comunicación con profesionales de salud.

## Descripción

Esta aplicación ayuda a personas que usan insulina a registrar y comprender
su día a día. **No diagnostica, no decide dosis nuevas por sí sola, no
modifica la prescripción, y no inventa ningún parámetro clínico** (relación
insulina/carbohidratos, factor de corrección, objetivo de glucosa, etc.).
Todo eso lo introduce el paciente según indicación de su profesional de
salud. Funciona perfectamente sin CGM — el CGM es una fuente opcional más.

## Funcionalidades

### ✅ Implementadas y conectadas a base de datos real

- Registro de cuenta, inicio de sesión, cierre de sesión (cookies de sesión
  firmadas con JWT, contraseñas con bcrypt).
- **Mi tratamiento**: registrar insulinas (basal / comidas / corrección) con
  sus parámetros clínicos. Versionado: nunca se sobrescribe un parámetro
  anterior.
- **Glucosa**: registro con fuente obligatoria (🩸 sangre / 📡 CGM), tendencia
  de CGM, contexto. Genera una alerta automática si la glucosa está baja.
- **Comidas**: registro por carbohidratos directos (gramos).
- **Insulina**: registro manual de dosis aplicadas, por insulina y propósito.
- **Actividad física**: tipo, duración, intensidad.
- **Mi día**: timeline cronológico armado en tiempo real a partir de la base
  de datos (no hardcodeado).
- **Hoy**: dashboard con última glucosa, última insulina, alertas activas y
  accesos rápidos.
- `SafetyEngine` y `DoseCalculationEngine`: motor determinista y auditable,
  con 12 tests automatizados (ver `src/domain/SafetyEngine.test.ts`) —
  **implementado pero todavía no conectado a ninguna pantalla** (ver
  pendientes abajo).

### 🚧 Explícitamente NO implementado en esta fase (no simulado, no oculto)

- Construir comida a partir de alimentos (Método B) y análisis de foto
  (Método C) — la UI de Comidas muestra "función próximamente disponible",
  no un botón que finja funcionar.
- Cálculo asistido de dosis en la pantalla de Insulina (el `DoseCalculationEngine`
  existe y está probado, pero el formulario de registro de insulina hoy es
  100% manual — no llama al motor todavía).
- `InsulinActivityEngine` (insulina activa / IOB) — sigue siendo un stub que
  lanza error a propósito, como estaba documentado desde el inicio: requiere
  validación clínica de parámetros farmacocinéticos.
- `PatternEngine` — tiene lógica mínima implementada (detección de comidas
  repetidas con glucosa alta) pero **no tiene pantalla en la UI** todavía.
- Sección "Mis patrones" — no existe como pantalla.
- Informe para el equipo de salud — no existe.
- Exportación PDF / CSV / JSON — no existe.
- Recordatorios/notificaciones reales (el `NotificationEngine` existe como
  lógica pero no hay sistema de notificaciones push/programadas conectado).
- Estrés y sueño — el modelo de datos (`ContextEvent`) existe y ya aparece en
  el timeline de "Mi día" si hay datos, pero no hay formulario de registro en
  la UI todavía.
- Datos de demostración marcados como tal.
- Internacionalización (i18n) — la app está en español fijo, sin arquitectura
  de idiomas todavía.

## Arquitectura

```
UI (Next.js App Router, Server + Client Components)
        │
        ├── app/login, app/registro          → páginas públicas
        ├── app/(main)/...                   → páginas protegidas por middleware.ts
        └── app/api/...                      → route handlers (API)
        │
        ↓
DOMAIN LAYER (src/domain/) — sin dependencias de UI ni de Prisma
        │
        ├── SafetyEngine            (implementado + probado)
        ├── DoseCalculationEngine   (implementado + probado)
        ├── MealEngine              (implementado)
        ├── NotificationEngine      (implementado)
        ├── PatternEngine           (mínimo + TODOs)
        └── InsulinActivityEngine   (stub — requiere validación clínica)
        │
        ↓
DATA LAYER
        │
        ├── prisma/schema.prisma    → modelo de datos completo (Postgres/Neon)
        └── src/lib/prisma.ts       → cliente Prisma singleton
        │
AUTH LAYER
        │
        ├── src/lib/session.ts      → firmar/verificar JWT, cookie httpOnly
        ├── src/lib/auth-guard.ts   → requireSession() para Server Components/API
        └── middleware.ts           → protege todas las rutas salvo /login, /registro, /api/auth/*, /api/health
```

La UI nunca contiene lógica clínica: todo cálculo pasa por la capa de
dominio, que no sabe nada de Next.js/HTTP/Prisma — esto permite testear
`SafetyEngine`/`DoseCalculationEngine` de forma aislada y, más adelante,
someterlos a validación clínica sin tocar el resto del sistema.

## Tecnologías

- **Next.js 14** (App Router) + React + TypeScript
- **Prisma ORM** + **PostgreSQL (Neon)**
- **bcryptjs** (hash de contraseñas) + **jose** (JWT de sesión)
- **Vitest** (tests del dominio)

## Base de datos

Motor: PostgreSQL en Neon. Ver `prisma/schema.prisma` para el modelo
completo: `User`, `InsulinRegimen` + `RegimenVersion` (versionado),
`GlucoseReading`, `FoodItem`, `Meal` + `MealItem`, `HabitualMeal`,
`InsulinEvent`, `ExerciseEvent`, `ContextEvent`, `DoseCalculation`
(auditoría inmutable), `Alert`, `FollowUp`, `Report`, `AuditLog`.

## Instalación

```bash
npm install
cp .env.example .env
# edita .env con tus connection strings de Neon y un SESSION_SECRET
npx prisma generate
npx prisma migrate dev --name init   # si es la primera vez
npm run dev
```

## Variables de entorno

Ver `.env.example`. Se necesitan tres:

- `DATABASE_URL` — connection string pooled de Neon.
- `DIRECT_URL` — connection string directa de Neon (para migraciones).
- `SESSION_SECRET` — cadena aleatoria larga para firmar las cookies de
  sesión. Generar con `openssl rand -base64 32`.

## Testing

```bash
npm test
```

12 tests sobre `SafetyEngine` y la integración `SafetyEngine` +
`DoseCalculationEngine`, incluyendo el caso más crítico: verificar que nunca
se devuelve una dosis cuando el `SafetyEngine` bloquea el cálculo.

**No hay tests automatizados todavía para las rutas de autenticación ni para
los endpoints CRUD (glucosa, comidas, insulina, actividad)** — quedan como
pendiente explícito.

## Deployment

Ver instrucciones detalladas más abajo en la conversación del proyecto.
Resumen: Vercel (Next.js) + Neon (Postgres), con `DATABASE_URL`,
`DIRECT_URL` y `SESSION_SECRET` configuradas como variables de entorno en
el proyecto de Vercel.

## Arquitectura de seguridad

- Contraseñas nunca se guardan en texto plano (bcrypt, costo 12).
- Sesión en cookie `httpOnly`, `secure` en producción, firmada con JWT.
- Middleware protege todas las rutas salvo login/registro/health.
- Mensajes de error de login genéricos (no revelan si el correo existe).
- `SafetyEngine` bloquea el cálculo de dosis ante glucosa baja, datos
  faltantes, estimaciones de foto no confirmadas, etc. — ver
  `src/domain/SafetyEngine.ts`.
- **Pendiente**: rate limiting en endpoints de auth, verificación de correo,
  recuperación de contraseña, roles/permisos más allá de "dueño del dato".

## Estado de validación clínica

**Nada en esta aplicación ha sido validado clínicamente.** Es un MVP de
desarrollo. Específicamente:

- Los umbrales del `SafetyEngine` (glucosa baja/alta, ventana de dosis
  reciente) son un esqueleto conservador, no valores clínicamente
  confirmados — están marcados `TODO — Clinical validation required` en el
  código.
- `InsulinActivityEngine` no está implementado a propósito.
- El `DoseCalculationEngine` no está conectado a ninguna pantalla todavía —
  aunque estuviera, no debe usarse como prescripción real sin validación.

## Roadmap

1. ✅ Arquitectura + modelo de datos
2. ✅ Autenticación + tratamiento + registro básico (glucosa/comidas/insulina/actividad) + Mi día
3. Conectar `SafetyEngine`/`DoseCalculationEngine` a la pantalla de Insulina (modo simulación, con aviso explícito)
4. Estrés/sueño en UI, alertas en UI, seguimientos
5. Mis patrones (UI)
6. Informe para el equipo de salud + exportación PDF/CSV/JSON
7. Testing de rutas API y flujo end-to-end
8. Pulido UX/UI, estados vacíos, i18n
