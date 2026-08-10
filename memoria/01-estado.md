# Estado del proyecto

**Última actualización:** 9 de agosto de 2026
**Versión del sistema:** MMI-DS **v1.19.0** — modo oscuro aprobado y ocho candados

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.

---

## Dónde estamos, en una frase

El sistema pasó de **especificación con catálogo** a **paquete que un producto
instala y consume**: 23 componentes de React con su comportamiento dentro, la
hoja de estilos que viaja, ocho candados y 180 pruebas. Ya hay **un producto
real en producción usándolo** —Control Administrativos V2.0—, y de ahí salen
casi todos los defectos que se han corregido.

---

## Qué está hecho y verificado

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `node sistema/tokens/generar.mjs` — 56 semánticos |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | 178 pares · 138 bloqueantes · **0 fallos** |
| Candado de lint | ✅ | Ejecutado en Docker, ya no es «escrito sin correr» |
| **23 componentes de React** | ✅ | 180 pruebas en 13 archivos, en Docker |
| Catálogo navegable | ✅ | `cascaron/index.html` · 44 páginas · 1 008 KB |
| Iconografía | ✅ | 39 iconos, generados como React real, sin `dangerouslySetInnerHTML` |
| Entrega ZIP + npm por etiqueta | ✅ | `sistema-diseno-v1.19.0.zip` · 527 KB · 44 archivos |
| Modo oscuro | ✅ | **Aprobado el 2026-08-09.** Marco en escala de negros |

### Los 23 componentes publicados

`Boton` · `Enlace` · `Campo` · `Selector` (con búsqueda) · `Interruptor` ·
`SeleccionMultiple` · `RangoFecha` · `Horario` · `Chip` · `Avatar` · `Tarjeta` ·
`TablaDatos` · `Paginacion` · `Progreso` · `Aviso` · `EstadoPantalla` ·
`Confirmacion` · `Nota` · `Dialogo` · `Migas` · `CabeceraPantalla` · `Icono` ·
`PanelBarra` · `MarcoApp` + `MenuUsuario` + `MarcaMenu`

---

## Los ocho candados

Se pasan **todos** antes de subir a `main`. Ninguna versión sube con uno en rojo.

| Candado | Qué impide | Se ha visto en rojo |
|---|---|---|
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ saboteado a propósito |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea y marcado fuera de norma | ✅ |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ |
| huérfanas (en `extraer.mjs`) | Clases declaradas que nadie usa | ✅ |
| **`verificar-cascada`** | **Lo que NO se escribió**: declaraciones ausentes o perdedoras en la hoja que viaja, a once anchos | ✅ contra la v1.17.0 |

**El octavo es el importante de esta versión.** Los siete primeros leen *lo que
hay*. El defecto R25 era *lo que no había* —una regla base ausente— y por eso
vivió tres versiones sin que nadie lo viera.

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                   1.19.0
Tokens semánticos             56
Colores autorizados          114
Conocidos y prohibidos         9   (familia marca)
Pares de contraste           178
  bloqueantes                138
  claro                       69   0 fallos
  oscuro                      69   0 fallos
Componentes publicados        23
Pruebas                      180   en 13 archivos
Iconos                        39
Páginas del catálogo          44
```

```bash
node sistema/candado/verificar-contraste.mjs
docker exec 09-sistema-diseo-ds-1 sh -lc "cd /trabajo/componentes && ./node_modules/.bin/vitest run"
```

---

## Lo que NO está hecho — declarado

| Qué | Por qué |
|---|---|
| Los seis `--ambito-alt-*` (R3) | **Colores nuevos: los autoriza el usuario, no el agente.** Ya no hacen falta para pintar; siguen siendo la única vía para un futuro modo soporte |
| R8, R14, R15, R16, R17 | Marcados `PENDIENTE` en `comportamiento.md`: tamaño de página y columnas recordadas, exportar CSV, filas plegables |
| Escudo suelto e isotipo simplificado | **Trabajo de diseñador, no de código.** Bajo 56px el escudo es ilegible y no hay activo válido |
| Candado de pares fabricados por `:hover` | Aceptado en principio, sin construir. Lo propuso Control Administrativos V2.0 |
| Comprobación con navegador real | `verificar-cascada` resuelve la cascada pero **no calcula diseño**. El defecto R26 no lo habría cazado |

### Un defecto abierto que no es nuestro

**R26 · el lateral no encoge al plegarse** en el producto de Control
Administrativos. **No reproduce aquí**: con la hoja que viaja y su marcado
exacto sale 56px a 1440. Las etiquetas v1.15.0 a v1.18.0 tienen las llaves
balanceadas y la regla presente. Hipótesis entregada, **no diagnóstico**:
`@layer` —una capa superior gana a cualquier especificidad de una inferior, así
que «no hay competidor de mayor especificidad» puede ser cierto y aun así perder.

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado · https://github.com/solwarehz/sistema-diseno
- Rama de trabajo: **`feat/sistema-base-v1`**
- **`main` SÍ se actualiza en este proyecto**, y solo en este — pero
  **únicamente con los ocho candados y las pruebas en verde**. Es de donde
  instala el área de sistemas: un `main` roto es un proyecto ajeno roto.
- Se sube por avance directo: `git push origin feat/sistema-base-v1:main`
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- Los binarios de diseño (`*.png`, `*.pdf`, `*.ai`, `*.psd`) **no suben**: son
  propiedad del cliente.
