# Alba Shinobi: El Sol Roto

Juego de plataformas y combate ninja (HTML5 + JavaScript puro). Funciona sin internet como PWA y guarda tu progreso en el dispositivo.

## Probar en la computadora (VS Code)
1. Abre esta carpeta en VS Code e instala la extensión **Live Server**.
2. Clic derecho en `index.html` > **Open with Live Server**.

(El service worker solo funciona con `http://localhost` o `https`, no abriendo el archivo directo.)

## Subir a GitHub y Vercel
1. En github.com crea un repositorio nuevo (por ejemplo `alba-shinobi`).
2. Pulsa **Add file > Upload files** y sube TODOS los archivos de esta carpeta (están todos en la raíz, sin subcarpetas). Pulsa **Commit changes**.
3. Entra a vercel.com con tu cuenta de GitHub > **Add New > Project** > elige el repo > **Deploy**. No necesita configuración.
4. Vercel te da un enlace (`https://tu-proyecto.vercel.app`). Pásalo a tus amigos.

## Instalar y jugar sin internet (celular)
1. Abre el enlace una vez con internet (Chrome en Android o Safari en iPhone).
2. Android: botón **Instalar app** del menú, o menú de Chrome > *Instalar aplicación*. iPhone: Compartir > *Añadir a pantalla de inicio*.
3. Abre la app desde el icono. Ya funciona sin conexión.

## Actualizar el juego
Si cambias código, sube los archivos a GitHub y cambia el número en `sw.js` (`const CACHE = 'alba-shinobi-v2'`) para que los teléfonos descarguen la versión nueva.

## Controles
- Teclado: flechas o A/D mover, Espacio saltar, J atacar (combo de 3), K esquivar, L shuriken, I especial, P pausa.
- Celular: pad izquierdo para mover y botones a la derecha (atacar, saltar, esquivar, shuriken, especial).

## Dónde editar
- `data.js`: personajes, mundos, jefes, historia, ropa y armas de la tienda.
- `extra.js`: enemigos no humanos, animaciones del personaje y las armas.
- `game.js`: física, enemigos, combate y generación de niveles.
- `ui.js`: menús, tienda y ajustes.
