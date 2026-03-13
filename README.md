# T8PracticeThrow

Aplicacion web para practicar throw breaks en **Tekken 8**. Muestra videos de throws aleatorios y el jugador debe presionar el input correcto (1, 2, 1+2) dentro de la ventana de tiempo.

## Inspiracion

Este proyecto esta inspirado en el original [ThrowBreak420](https://github.com/dcep93/throwbreak420/) creado por **dcep93**. Todo el credito del concepto original es para ellos. Esta version fue reconstruida con un stack moderno (Vite + Tailwind CSS v4) y un rediseno visual basado en la estetica de Tekken 8.

## Tech Stack

- React 18
- TypeScript
- Vite 6
- Tailwind CSS v4
- React Router v7
- Firebase Analytics

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm

## Instalacion

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd throwbreak420

# Instalar dependencias
npm install
```

## Correr el proyecto

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

### Build de produccion

```bash
npm run build
```

Genera los archivos optimizados en la carpeta `build/`.

### Preview del build

```bash
npm run preview
```

Sirve el build de produccion localmente para verificar antes de hacer deploy.

## Deploy en Netlify

1. Conecta tu repositorio de GitHub a Netlify
2. Configura el build:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
3. Crea el archivo `public/_redirects` con el siguiente contenido para soportar SPA routing:
   ```
   /*    /index.html   200
   ```

## Uso

- Selecciona P1/P2, tipo de throw (STD/GND), y los breaks que quieras practicar
- Ajusta la velocidad con los botones +/-
- Presiona el input correcto cuando veas el throw
- Revisa tus estadisticas en tiempo real
- En mobile, usa el dispositivo en orientacion horizontal (landscape)
