# «Con solo el `npm install`, Next siguió sirviendo el paquete viejo»

**De:** Control Administrativos V2.0 · **Fecha:** 2026-09-13
**Atendido en:** v1.109.0

> Con solo el `npm install`, Next siguió sirviendo el paquete viejo: la primera
> medición salió idéntica a la de antes y **estuve a punto de reportarlo como no
> resuelto**. Hizo falta reiniciar el contenedor. Queda anotado en el commit,
> porque nos va a volver a pasar.

---

## Por qué es defecto del sistema y no de su entorno

No es que se les olvidara reiniciar: es que **el manual les dio una
comprobación que miente**.

```bash
node -p "require('sistema-diseno-ae/package.json').version"   # 1.108.0
```

Eso mira **el disco**, y **desde otro proceso**. Sale en verde en cuanto npm
descomprime, mucho antes de que el servidor en marcha sirva nada nuevo. La
comprobación que este sistema publicaba **pasaba mientras el navegador recibía
la versión anterior**, y el siguiente paso natural —medir el DOM— devolvía los
números viejos. De ahí a «esto no está resuelto» hay un paso, y casi lo dan.

Y hay una segunda mitad peor: **lo que cambió en R129 y R130 era CSS**. Desde
JavaScript no había **ninguna** forma de preguntarle a la hoja servida qué
versión era. La única superficie que importaba para esa medición era justo la
que no se podía comprobar.

## Qué se entrega

1. **`--mmi-version` en `:root` de `tokens.css`.** La hoja dice su versión y se
   pregunta en ejecución:
   `getComputedStyle(document.documentElement).getPropertyValue('--mmi-version')`.
2. **El §1bis del manual reescrito**: el reinicio como paso obligatorio y no
   como nota al pie, con el comando para tirar la caché de compilación, y una
   tabla de **tres** comprobaciones —disco, JavaScript servido, hoja servida—
   con la advertencia de que si discrepan, es la caché y no el componente.
3. Se documenta que `import { VERSION } from 'sistema-diseno-ae'` ya existía
   desde la raíz del paquete. Existía y nadie lo sabía, porque el manual
   mandaba mirar a otro sitio.

`VERSION` **no** se añade al barril de componentes: se probó y el candado de
entrega lo cazó bien —lo contaba como un componente publicado sin página en el
catálogo—. No es un componente.
