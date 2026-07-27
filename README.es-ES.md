# Oneko

Un componente de registro de shadcn que coloca un pequeño gato de píxeles en una aplicación React. El gato se monta en `document.body`, sigue el puntero, toma siestas cuando está inactivo, muestra burbujas de texto temáticas de gatos y puede reproducir sonidos de gato opcionales.

Playground en vivo: [oneko.dhrv.pw](https://oneko.dhrv.pw)

## Instalación

```bash
npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json
```

El comando añade `components/oneko.tsx` a tu proyecto.

## Uso

Renderiza `Oneko` solo en el navegador. En aplicaciones con SSR habilitado, colócalo detrás del límite de "solo cliente" de tu framework o cárgalo mediante lazy-loading después del montaje.

```tsx
"use client";

import Oneko from "@/components/oneko";

export function CatLayer() {
  return <Oneko />;
}
```

Los sonidos de gato opcionales se cargan desde `/cat-sounds/*.ogg`. Añade esos archivos a los activos públicos de tu aplicación si deseas audio; de lo contrario, establece `meow={false}`.

## Características

- Sprite de pixel-art basado en la idea original de oneko, renderizado con bordes nítidos.
- Movimiento que sigue al puntero con detección de obstáculos y ráfagas ocasionales de desplazamiento libre.
- Textos de burbujas temáticos de gatos para estados de inactividad, sueño, juego, rascado y persecución.
- Estilo de burbujas basado en tokens de tema para temas claros y oscuros.
- Pools de sonido opcionales, modo de puntero láser, persistencia de posición, controles de escala, opacidad, rotación y tono.
- Referencia de estado en vivo para playgrounds o paneles de depuración.

## Props Comunes

```tsx
<Oneko
  speed={10}
  scale={1}
  opacity={1}
  meow
  volume={0.5}
  bubbleEnabled
  bubbleText="purr patrol"
  laserPointer={false}
/>
```

Consulta [docs/oneko.md](docs/oneko.md) para la referencia completa de props y notas de integración.

## Mantenedores

Este repositorio aloja el playground y la salida del registro de shadcn para el componente.

```bash
pnpm install
pnpm dev
pnpm run registry:build
pnpm build
```

`pnpm build` ejecuta primero la construcción del registro, para que `public/r/oneko.json` se mantenga sincronizado con `registry.json`.

Más detalles del proyecto se encuentran en [docs/development.md](docs/development.md).

## Estructura del Repositorio

| Ruta                   | Función                                              |
| ---------------------- | ------------------------------------------------- |
| `components/oneko.tsx` | Componente shadcn distribuible                    |
| `registry.json`        | Manifiesto del registro de shadcn                  |
| `public/r/`            | JSON del registro generado para hosting estático  |
| `app/`                 | Shell del playground alojado                      |
| `components/ui/`       | Primitivas locales de shadcn/ui usadas por el playground |
| `docs/oneko.md`        | API del componente y notas de integración         |
| `docs/development.md`  | Flujo de desarrollo local, registro y hosting    |

## Inspiración

Inspirado en [adryd325/oneko.js](https://github.com/adryd325/oneko.js).

## Licencia

MIT. Ver [LICENSE](LICENSE).
