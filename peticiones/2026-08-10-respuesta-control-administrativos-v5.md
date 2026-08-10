# Respuesta del sistema de diseño · pedido v5

**Para:** Control Administrativos V2.0
**Fecha:** 2026-08-10
**Versiones que responden:** v1.21.0 a v1.25.0 — las siete peticiones, resueltas
el mismo día, cada una con su versión, su contrato y sus pruebas.

---

## R26 · Retirado por vosotros — y la lección quedó guardada

Gracias por el cierre y por la causa documentada. Vuestra advertencia —una
medición en pestaña oculta no vale para nada que dependa de transiciones— quedó
escrita en la auditoría de composición, pegada al plan del candado que montará
componentes: si algún día pregunta a un navegador real, asegurará página
visible o transiciones apagadas.

## R27 · Tokens de movimiento — **v1.22.0**

La escala no se inventó: salió del inventario del catálogo (seis duraciones
para tres intenciones). Vuestros literales se traducen así:

| Vuestro literal | Token | Valor |
|---|---|---|
| `0.16s` (diálogos) | `--dur-media` | 180ms |
| `0.2s` (paneles) | `--dur-lenta` | 220ms |
| `cubic-bezier(0.16, 0.84, 0.44, 1)` | `--curva` | `ease` — ver nota |
| `5s` (permanencia) | `--permanencia-aviso` | 5s |

**Nota sobre la curva:** el sistema usaba `ease` en todas sus transiciones y
eso es lo que el token congela. Adoptar vuestra curva es una decisión de diseño
que no tomamos de oficio — el token es el asidero para el día que se decida.

`prefers-reduced-motion` está resuelto una sola vez: los tokens caen a `0.01ms`
solos (no a 0: un `transitionend` que nunca llega cuelga a quien lo espera) y
la permanencia **no** se reduce — leer no es moverse. Y el auditor del cascarón
ganó el chequeo MOVIMIENTO: una duración a mano bloquea el build igual que un
hex crudo. Manual §5bis.

## R28 · `.bloque` viaja — **v1.21.0**

Teníais razón dos veces. `.bloque` estaba en la lista de exclusión del
extractor, y la única regla con `.bloque` que sí viajaba era la del andamiaje
del catálogo. La causa era estructural —clasificación por prefijo— y el arreglo
también lo es: el extractor corta ahora **por parte de selector** y por regla.
Consecuencia que os puede tocar: **27 clases de andamiaje dejaron de viajar**
(`*-rejilla`, `*-demo`, `top-cascaron`, `[data-vista]`, `[data-app]`…). Ningún
componente las emite y ningún documento las enseña; si copiasteis alguna del
catálogo, pedidla con su caso — como hicisteis con `.bloque`.

## R29 · `ZonaAvisos` — **v1.23.0**

Publicada, y con vuestra exigencia central: las regiones vivas existen **desde
la carga**, vacías. Son **dos hermanas** — `role="alert"` para el error, que
interrumpe, y `role="status"` para el resto — porque un alert dentro de una
región polite se comporta distinto en cada lector; la advertencia estaba
escrita en el propio `Aviso` y el catálogo la incumplía. El `Aviso` dentro de
la zona cede su rol a la región; suelto, conserva el suyo: cero cambios para
vosotros. Una precisión sobre vuestro pedido: la respuesta móvil es la del
cascarón —a todo el ancho **arriba**, corte en 640px—, no el ancho inferior a
~760px que describíais. Si el abajo tiene un caso, pedidlo con él.

Criterio de referencia, ya en contrato: tres a la vista y el cuarto expulsa al
más antiguo **que no sea un error** — un error expulsado en silencio es un
error que nadie leyó.

## R30 · El pie del lateral — **v1.24.0**

Como pedisteis: el componente, no el criterio, y sin API nueva — los datos ya
viajaban en `usuario`. El círculo es **el mismo `Avatar` de la barra** (misma
persona, mismo color por id, mismas iniciales), no el `.lat-av` a medida que
tenía el cascarón: una identidad que se dibuja distinta arriba y abajo es dos
identidades. Con el lateral plegado queda el círculo y el texto se va. De
paso: tres iniciales del catálogo mentían («JH»/«JP» donde `iniciales()`
produce «JI») y se corrigieron.

**Rompe:** `.lat-av` desaparece de la hoja. Si la copiasteis, componed el
`Avatar`.

## R31 · Columnas controladas — **v1.25.0**

La pareja `ocultas`/`onOcultas`, con el mismo patrón controlado que el plegado
del marco: pasada `ocultas`, esa es la verdad y la tabla no la duplica; sin
pasarla, se la gestiona sola como siempre. Vuestra frase quedó en el contrato
(regla 18): una preferencia que no persiste no es una preferencia.

## R32 · Ranura de acciones — **v1.25.0**

`acciones?: ReactNode`, dentro de la barra junto a «Filtros» y «Columnas».
Solo el sitio; el comportamiento es vuestro. El CSV ya no flota.

## R33 · Dominio cerrado — **v1.25.0**

`Columna.opcionesFiltro` pinta un `Selector` (se compone el que ya existía) y
casa por **igualdad**, no por texto contenido. El detalle que os habría
mordido: «activo» está *contenido* en «inactivo» — con inclusión, elegir
«Activo» devolvía también a los inactivos. Tiene su prueba.

**Y una pieza que nadie pidió pero faltaba:** verificando la composición de la
tabla apareció que con cero filas no decía nada. Ahora el vacío dice por qué y
da la salida en un clic («quítalos todos»), como el cascarón ya hacía.

---

**Verificado antes de responder:** siete candados en verde en cada versión,
178 pares de contraste con 0 fallos, cascada a once anchos, 195 pruebas de
componentes (22 nuevas hoy), `tsc` limpio.
