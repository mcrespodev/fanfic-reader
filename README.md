
# Lector de Fanfic — Starter (HTML/CSS/JS)

Plantilla mínima para leer capítulos desde archivos `.txt` referenciados en `chapters.json`.
Incluye búsqueda, navegación, y botón para reproducir música de fondo (requiere interacción del usuario).

## Estructura
```
fanfic-reader-starter/
  .vscode/             # Configs de VS Code
  assets/
    audio/             # MP3s opcionales
    img/               # Portadas
  css/styles.css
  js/app.js
  js/reader.js
  texts/               # Capítulos .txt
  chapters.json        # Metadatos: code, title, song, image, textFile
  index.html
```

## Uso
1. Abre la carpeta en VS Code.
2. Instala la extensión **Live Server** (recomendado).
3. Abre `index.html` con *Open with Live Server*.
4. Edita `chapters.json` y agrega tus capítulos `.txt` en `texts/`.

## Formato de `chapters.json`
```json
[
  {
    "code": "C1-P1",
    "title": "¿Quién cayó primero?",
    "song": "Ending Scene – IU",
    "image": "assets/img/cap1.jpg",
    "textFile": "texts/Capitulo_1.txt"
  }
]
```

## Depuración
Incluye `.vscode/launch.json` para lanzar Chrome contra `http://localhost:5500`.

## Publicar en GitHub Pages
- Sube este repo a GitHub.
- En **Settings → Pages**, fuente: **Deploy from a branch**, selecciona `main` y carpeta `/ (root)`.
- Alternativa: usar una workflow de Pages.
```
