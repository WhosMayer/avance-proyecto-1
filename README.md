# Proyecto 1 — Análisis del Error Numérico
## Fundamentos y Análisis de Métodos Numéricos

### Estructura del proyecto
```
proyecto-1/
├── index.html      ← Interfaz principal (6 pestañas)
├── styles.css      ← Estilos
├── app.ts          ← TypeScript source (tipado completo)
└── app.js          ← JavaScript compilado (ejecutado por el navegador)
```

### Cómo usar
Abre `index.html` en un navegador. No requiere servidor ni instalación.
Los parámetros por defecto (θ₀=1.2 rad, L=1 m, h=0.01, n=5) son buenos para empezar.

### Contenido de cada pestaña

| Pestaña | Contenido |
|---------|-----------|
| θ(t) y ω(t) | Gráficas de la simulación de Euler con Taylor vs analítica |
| Tabla de errores | Error absoluto, relativo % y aproximado % paso a paso |
| Euler vs RK4 | Comparación de métodos y sus errores |
| Error vs paso h | Convergencia empírica de orden ≈ 1 para Euler |
| Series de Taylor | Error de truncamiento de sin(θ) vs número de términos n |
| Redondeo IEEE 754 | Demos de error de redondeo y acumulación iterativa |

### Métodos implementados
- **Euler explícito** (obligatorio): usa sinTaylor(θ, n) en lugar de Math.sin
- **Runge-Kutta 4** (comparación): usa Math.sin exacto

### Tipos de error analizados
- Error de redondeo (IEEE 754, demo con 0.1+0.2, acumulación)
- Error de truncamiento del método (Euler O(h), análisis vs h)
- Error de truncamiento de la función (Taylor, análisis vs n)
- Error de propagación (visible en gráfica Error Abs vs tiempo)
- Error absoluto, relativo porcentual, aproximado porcentual
- Tolerancia basada en cifras significativas

### Compilar TypeScript
```bash
npx tsc app.ts --target ES2017 --lib "ES2017,DOM" --outFile app.js --ignoreDeprecations "6.0"
```
