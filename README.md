# Acompañante de gestión de diabetes (MVP) — Fase 1: Arquitectura y modelo de datos

> Nombre provisional. Esta entrega cubre lo pedido como primer paso: **arquitectura +
> modelo de datos**, con el `SafetyEngine` y el `DoseCalculationEngine` ya
> implementados y probados (son el núcleo de riesgo clínico), y el resto de
> motores como interfaces documentadas listas para implementarse.

## Principio rector

> El paciente aporta información → el sistema organiza y analiza → el sistema
> explica → el sistema alerta cuando corresponde → el profesional de salud
> toma las decisiones clínicas.

La app **no diagnostica, no decide dosis nuevas por sí sola, no modifica la
prescripción, y no inventa ningún parámetro clínico** (relación
insulina/carbohidratos, factor de corrección, objetivo de glucosa, duración de
acción, etc.). Todo eso lo introduce el paciente según indicación de su
profesional de salud.

## Estructura del repositorio

```
diabetes-app/
├── prisma/
│   └── schema.prisma        # Modelo de datos completo (ver sección abajo)
├── src/
│   └── domain/               # Capa de dominio — lógica clínica, sin UI ni DB
│       ├── types.ts                   # Contratos compartidos
│       ├── SafetyEngine.ts            # ✅ Implementado y probado
│       ├── SafetyEngine.test.ts       # 12 tests, incluye casos límite
│       ├── DoseCalculationEngine.ts   # ✅ Implementado y probado
│       ├── MealEngine.ts              # ✅ Implementado (normaliza 3 métodos de registro)
│       ├── InsulinActivityEngine.ts   # 🚧 Stub — TODO: validación clínica
│       ├── PatternEngine.ts           # 🚧 Implementación mínima + TODOs
│       └── NotificationEngine.ts      # ✅ Implementado (recordatorios configurables)
├── package.json
└── tsconfig.json
```

Capas (sección 27 del spec):

```
UI  →  DOMAIN LAYER (motores)  →  DATA LAYER (Prisma / base de datos)
```

La UI nunca debe contener lógica clínica. Todo cálculo/decisión pasa por la
capa de dominio, y la capa de dominio no sabe nada de React/HTTP/etc. — esto
es lo que permite testear `SafetyEngine` y `DoseCalculationEngine` de forma
aislada y, más adelante, someterlos a validación clínica/regulatoria formal
sin tocar el resto del sistema.

## Regla de oro entre los dos motores centrales

```
SafetyEngine.check(input)
        │
        ├── blocksCalculation = true  →  DoseCalculationEngine.calculate()
        │                                devuelve totalDose = null.
        │                                NUNCA se muestra una dosis.
        │
        └── blocksCalculation = false →  se calcula la dosis normalmente,
                                          con las advertencias (WARNING) que
                                          correspondan.
```

`DoseCalculationEngine` llama internamente a `SafetyEngine` en cada
`calculate()` — es imposible obtener una dosis sin pasar primero por las
reglas de seguridad. Esto está cubierto por tests de integración en
`SafetyEngine.test.ts`.

## Modelo de datos (`prisma/schema.prisma`)

Decisiones clave, mapeadas a los requisitos del spec:

| Requisito del spec | Cómo se resolvió en el modelo |
|---|---|
| Nunca sobrescribir tratamiento silenciosamente (sección 7) | `InsulinRegimen` (la insulina) está separado de `RegimenVersion` (sus parámetros en el tiempo). Cada cambio crea una fila nueva con `effectiveFrom`/`effectiveTo`; nunca se edita una versión existente. |
| CGM vs sangre nunca se pierde (secciones 9–10) | `GlucoseReading.measurementSource` es un enum obligatorio (`BLOOD`/`CGM`). No existe forma de guardar un valor de glucosa sin su fuente. |
| Todo cálculo es auditable (sección 34) | `DoseCalculation` guarda `inputValues`, `inputSources`, `parametersUsed`, `rulesTriggered`, `output`, `warnings`, `safetyStatus` — como JSON inmutable, nunca se sobrescribe una fila existente. |
| Alimentos regionales/LATAM (sección 12) | `FoodItem` incluye `region` y `portionUnit` libre (no atado a unidades tipo USDA). |
| Foto de comida — estimación nunca es dato válido por sí sola (sección 11) | `Meal.aiEstimatedCarbsG` es un campo separado de `carbsGDirect`, y `aiEstimationConfirmed` debe ser `true` explícitamente. El `SafetyEngine` bloquea el cálculo si no está confirmada. |
| Estrés/sueño como contexto reportado, no medición clínica (sección 17) | `ContextEvent.reportedStress` (no "cortisol" ni nada médico) — nombrado deliberadamente como "reportado". |
| IOB reservado pero no inventado (sección 15) | `InsulinActivityEngine` existe como clase con método que lanza error explícito hasta que se valide clínicamente — no hay ningún modelo farmacocinético implícito en el modelo de datos ni en el motor. |

## Motores de dominio — estado de cada uno

- **`SafetyEngine`** ✅ Implementado. Reglas: glucosa baja/muy baja (bloquea),
  datos faltantes, estimación de foto no confirmada, dosis reciente sin
  confirmar, glucosa muy alta, problema de tendencia CGM, ejercicio intenso
  reciente, enfermedad reportada. **Los umbrales numéricos son un esqueleto
  conservador y están marcados `TODO — Clinical validation required`.**
- **`DoseCalculationEngine`** ✅ Implementado. Determinista, sin IA. Calcula
  dosis por carbohidratos + corrección únicamente si los parámetros
  correspondientes existen en el perfil del paciente; nunca asume un valor
  por defecto.
- **`MealEngine`** ✅ Implementado. Normaliza los 3 métodos de registro de
  comida en un `MealInput` común.
- **`NotificationEngine`** ✅ Implementado (reglas de tiempo siempre
  configurables por el paciente, nunca fijas).
- **`PatternEngine`** 🚧 Implementación mínima (detecta comidas repetidas con
  glucosa post-comida alta) + lista explícita de TODOs para el resto.
- **`InsulinActivityEngine`** 🚧 Stub que lanza error intencionalmente — no
  se implementa cálculo de insulina activa (IOB) sin validación clínica de
  los parámetros farmacocinéticos.

## Tests

```bash
npm install
npm test
```

12 tests sobre `SafetyEngine` y la integración `SafetyEngine` +
`DoseCalculationEngine`, incluyendo el caso más crítico: **verificar que
nunca se devuelve una dosis cuando el SafetyEngine bloquea el cálculo**.
Todos pasan (`npx vitest run` → 12/12 ✅).

## Base de datos

Motor: **PostgreSQL en Neon**. `schema.prisma` usa `enum` y `Json` nativos
(Postgres sí los soporta — a diferencia de SQLite, que se usó en una
iteración anterior de este MVP y obligaba a simular enums con `String`).

### Configurar Neon

1. En el dashboard de Neon, entra a tu proyecto → **Connection Details**.
2. Copia dos connection strings distintas:
   - La **pooled** (el host incluye `-pooler`) → va en `DATABASE_URL`. Es la
     que usa la app en tiempo de ejecución.
   - La **directa** (sin `-pooler`) → va en `DIRECT_URL`. Prisma la necesita
     específicamente para correr migraciones; con la pooled las migraciones
     pueden fallar o comportarse de forma inconsistente.
3. Copia `.env.example` a `.env` y pega ambas.

```bash
cp .env.example .env
# edita .env con tus dos connection strings de Neon
npx prisma generate
npx prisma migrate dev --name init
```

`prisma migrate dev` crea las tablas directamente en tu base de Neon (no hay
archivo `.db` local como con SQLite).

## Lista explícita de funciones que requieren validación clínica antes de producción

(sección 16 de los entregables pedidos)

1. Umbrales numéricos del `SafetyEngine` (glucosa baja/muy baja/muy alta,
   ventana de "dosis reciente", umbral de ejercicio intenso).
2. Cualquier implementación de `InsulinActivityEngine` (modelo
   farmacocinético / duración de acción por tipo de insulina).
3. Umbral y heurísticas de `PatternEngine` más allá del conteo simple ya
   implementado.
4. Cualquier futura estimación de carbohidratos por foto (IA) — el flujo de
   confirmación obligatoria ya existe en el modelo, pero el modelo de IA en
   sí no se ha construido.
5. Duración de acción de insulinas para deduplicación de dosis (hoy la regla
   `RECENT_INSULIN_DOSE` usa una ventana fija de 60 minutos genérica, no
   basada en el tipo de insulina real).

## Próximos pasos (según el orden pedido en el spec)

1. ✅ Arquitectura + modelo de datos (esta entrega).
2. Flujo principal: onboarding, perfil de tratamiento, registro de glucosa/
   comida/insulina/ejercicio/contexto, timeline "Mi día".
3. Seguridad/alertas: exponer `SafetyEngine`/`Alert`/`FollowUp` en la UI,
   `NotificationEngine` con recordatorios reales.
4. Reportes/exportación: "Informe para mi equipo de salud" + PDF/CSV/JSON.
5. UX/pulido.
