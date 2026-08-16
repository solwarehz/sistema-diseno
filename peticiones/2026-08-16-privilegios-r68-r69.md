# R68 y R69 · La pantalla de privilegios — y la numeración

**Fecha:** 15 a 16 de agosto de 2026
**Origen:** Control Administrativos V2.0 · documento `requerimiento-R68-R69-privilegios.md`
**Estado:** R69 entregado en v1.59.0 · R68 abierto

> **Por qué existe este documento.** Es la misma razón que el de la v12: lo que
> solo vive en una conversación no se clona. Y esta vez hay algo más que un
> requerimiento — hay un defecto en cómo se están repartiendo los números, y ese
> sí que no puede vivir en un chat.

---

## 1 · La numeración, que es lo primero

La serie `R` **es una sola y la usan dos equipos**: Control Administrativos pide
con ella, y el sistema de diseño ha estado numerando con ella sus propios
hallazgos. Nadie llevaba el inventario. Esto es lo que hay, extraído del
repositorio y no de memoria:

```
OCUPADOS  1–14 · 16–35 · 37–39 · 41–62 · 64–66 · 68 · 69 · 70 · 71 · 81–84
LIBRES    15 · 36 · 40 · 63 · 67(reservado) · 72–80 · 85+
```

### R68 y R69 se aceptan tal como llegaron

Los dos estaban libres. **No se renumeran.** R67 queda reservado a selección
múltiple en TablaDatos, como dice su documento.

### La serie subió a los 80 y volvió a los 60

R70, R71 y R81 a R84 **ya están consumidos, y los pidió Control
Administrativos** — llegaron por chat entre el 14 y el 16 de agosto y están
entregados o aceptados. Después de eso el contador volvió a R65.

**Si el contador sigue subiendo desde R69, choca en el acto:** R70 y R71 existen.

### Dos colisiones ya consumadas

| Nº | Un uso | El otro |
|---|---|---|
| **R50** | v1.44.0 · la carga de imagen se centra, avatar de reserva | v1.55.0 · el Aviso nacía invisible |
| **R65** | v1.53.0 · publicar deja de ser tres pasos | v1.57.0 · la etiqueta del Interruptor admite marcado |

**No se renombran.** Esos números ya salieron en ZIP descargados y en el
historial que lee el consumidor: cambiarlos reescribiría lo entregado, que es
justo lo que este proyecto no hace con lo ya medido. Quedan aquí declaradas.

### Cómo continúa

| | |
|---|---|
| **Siguiente pedido de Control Administrativos** | **R72** · después R73–R80, y luego R85 |
| **Se saltan** | 70, 71 y 81–84 — ya usados |
| **Los huecos (15, 36, 40, 63)** | **no se reutilizan.** Rellenar huecos es cómo se producen las colisiones |
| **Hallazgos internos del sistema de diseño** | **salen de la serie `R`.** Prefijo propio `S-nn`, como las decisiones usan `D-nn` |

Lo último es la corrección de fondo: R60, R61, R62 y R64 los consumió el sistema
de diseño por hallazgos suyos, sin que Control Administrativos lo supiera. Una
serie compartida sin registro compartido acaba en colisión siempre.

---

## 2 · Dos premisas suyas que había que corregir

Con evidencia, y por el mismo criterio con el que ellos corrigen las nuestras.

| Su premisa | Lo medido |
|---|---|
| «R66 CERRADO POR REGLA: seguimos esperándolo» | **Está entregado** en v1.58.0, etiquetada y publicada. Comprobaron contra v1.51.0 |
| «`.tabla-simple` lleva `min-width: 520px` (componentes.css:656)» | **Cierto pero más estrecho.** Está en la línea **674** y el selector es `.tb-envoltura > .tabla-simple`. Un `.tabla-simple` suelto es `display:block; overflow-x:auto` y **no lo lleva**: el impedimento bloquea una matriz dentro de `TablaDatos`, no cualquier tabla |

---

## 3 · R69 · Entregado en v1.59.0

Nace **`Segmentado`**: dos o tres opciones excluyentes en una línea.

Su argumento es correcto y es el que gobierna el componente: *un dato sensible
no se ve o no se ve, y tiene un punto medio que es el que hace útil el sistema.*
Y la frase que explica la pantalla entera, que es suya:

> **Cada dato sensible tiene una versión reducida que sirve para trabajar, pero
> no para suplantar.**

Lo que se decidió, y por qué:

| | Decisión |
|---|---|
| **No es `SeleccionMultiple` con `modo="unica"`** | Esa ya existe y también es excluyente, pero **apila una fila por opción**. Aquí el control se repite en cinco a diez filas: apilado son treinta filas para configurar cinco campos, y a 390 px eso deja de ser una pantalla. Una ocupa **alto** por opción y la otra **ancho** |
| **El ejemplo va en cada opción** | No solo en la elegida. Si solo se viera bajo la activa, para saber qué concede «parcial» habría que **concederlo primero** — cambiar un privilegio real de un cargo real para aprender qué significa |
| **Dos opciones es un caso normal** | No un componente a medias. Un nivel que no aplica **no se pasa** |
| **R66 llega al nivel** | Quien reparte no puede conceder lo que lo iguale a él mismo, y eso casi nunca cierra el campo: cierra **un nivel**. No desaparece, no se pinta apagado, y va con su motivo |
| **El nombre accesible es el rótulo solo** | El ejemplo va de descripción. Sin `aria-labelledby` el lector anuncia «Completo 71602303» y repite «71602303» |

Ocho pruebas, página propia en el catálogo, contrato en `comportamiento.md`, y
los nueve candados en verde.

---

## 4 · R68 · Abierto

Falta el mockup `mockup-privilegios-cargo-puesto.html`, que está fuera de la
carpeta del proyecto y el agente no puede salir de ella. Pedido por el chat.

Lo que ya está decidido y no depende de él:

- **El ancho de referencia es 390 px**, no 393. El candado de la cascada mide a
  once anchos y el más estrecho es 390 — más estricto que el iPhone que
  mencionan. Entre 390 y 393 no hay ningún punto de corte: los tres que existen
  en la hoja son 620, 640 y 700. Medir a 390 cubre 393 y sobra.
- El `min-width: 520px` solo estorba **dentro de `TablaDatos`**, no en cualquier
  tabla (§2).
- La quinta columna —descargar en lote— y el estado cerrado por regla ya tienen
  su pieza: R66 en el Interruptor y R69 en el Segmentado.

---

## 5 · Lo que esto dejó apuntado

**El menú volvió a comerse su último elemento.** Los cortes de las cinco ramas
del catálogo son **índices** sobre la lista de elementos: meter uno en medio los
corre a todos, y «Panel de la barra» se cayó fuera del último tramo. Es
**exactamente** lo que ya pasó al entrar «Carga de ID», con la misma víctima. Lo
cazó el candado de la entrega.

Y queda dicho lo que el candado **no** cubre: solo se nota cuando el que se cae
es el **último**. Si un elemento entrara en la rama equivocada, ningún candado lo
vería.

**`npm run lint` falla en `main`.** Dos usos del atributo `style` en línea en
`componentes/src/Estados.tsx` (líneas 67 y 195), que el propio candado prohíbe.
Es anterior a este trabajo y no está en la lista de candados del `CLAUDE.md`,
que es por lo que lleva tiempo sin verse.
