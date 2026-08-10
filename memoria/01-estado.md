# Estado del proyecto

**Última actualización:** 10 de agosto de 2026
**Versión del sistema:** MMI-DS **v1.25.0** — seis versiones en un día: la
auditoría de composición y los siete pedidos R27–R33 de Control Administrativos

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.

---

## Dónde estamos, en una frase

El sistema es un **paquete que un producto instala y consume** —24 componentes
de React, la hoja que viaja, ocho candados, 195 pruebas— y hoy pasó su primera
**auditoría de composición**: los componentes se componen de componentes, el
andamiaje del catálogo ya no viaja, y los siete pedidos del producto real en
producción se resolvieron el mismo día en que llegaron.

---

## Qué está hecho y verificado

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `node sistema/tokens/generar.mjs` — 56 semánticos + movimiento |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | 178 pares · 138 bloqueantes · **0 fallos** |
| **Tokens de movimiento** (R27) | ✅ | 3 duraciones + curvas + permanencia · `reduced-motion` resuelto una vez · candado MOVIMIENTO probado en rojo |
| Candado de lint | ✅ | Ejecutado en Docker · 62 casos |
| **24 componentes de React** | ✅ | 195 pruebas en 14 archivos, en Docker |
| Catálogo navegable | ✅ | `cascaron/index.html` · 44 páginas |
| Iconografía | ✅ | 39 iconos, React real |
| Entrega ZIP | ✅ | `sistema-diseno-v1.25.0.zip` · 44 archivos |
| Modo oscuro | ✅ | Aprobado 2026-08-09 · marco en escala de negros |
| **Auditoría de composición** | ✅ | `auditorias/2026-08-10-auditoria-composicion.md` + herramienta en `auditorias/herramientas/` |

### Los 24 componentes publicados

`Boton` · `Enlace` · `Campo` · `Selector` (con búsqueda) · `Interruptor` ·
`SeleccionMultiple` · `RangoFecha` · `Horario` · `Chip` · `Avatar` · `Tarjeta` ·
`TablaDatos` · `Paginacion` · `Progreso` · `Aviso` · **`ZonaAvisos`** ·
`EstadoPantalla` · `Confirmacion` · `Nota` · `Dialogo` · `Migas` ·
`CabeceraPantalla` · `Icono` · `PanelBarra` · `MarcoApp` + `MenuUsuario` +
`MarcaMenu`

### Lo que cambió hoy (v1.20.0 → v1.25.0)

| Versión | Qué |
|---|---|
| v1.20.0 | El calendario de `RangoFecha` **viajaba roto** (tres clases sin regla, por el punto ciego documentado del candado de huérfanas — arrays). Arreglados los dos: componente y candado |
| v1.21.0 | R28 · `.bloque` viaja; el extractor corta **por parte de selector** y 27 clases de andamiaje dejaron de viajar |
| v1.22.0 | R27 · tokens de movimiento; el auditor gana el chequeo MOVIMIENTO |
| v1.23.0 | R29 · `ZonaAvisos`: regiones vivas desde la carga, alert y status hermanas — el catálogo incumplía su propia advertencia y se corrigió a la par |
| v1.24.0 | R30 · pie del lateral con la identidad de la sesión, componiendo el `Avatar` real; tres iniciales del catálogo mentían |
| v1.25.0 | R31–R33 · columnas controladas, ranura `acciones`, dominio cerrado por **igualdad** (la trampa activo/inactivo tiene prueba) + el estado vacío que faltaba |

Además: `.gitattributes` fija **LF en todo el repo** (un commit reescribió
CLAUDE.md entero a CRLF y no puede repetirse), el contrato del marco dice que
**se monta envolviendo a la aplicación** (defecto del plegado que se olvidaba,
reportado por el responsable), y Docker quedó **autorizado de forma permanente**
en esta máquina (CLAUDE.md §3).

---

## Los ocho candados (+ la herramienta de auditoría)

Se pasan **todos** antes de subir a `main`. Ninguna versión sube con uno en rojo.

| Candado | Qué impide | Se ha visto en rojo |
|---|---|---|
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea, marcado fuera de norma y **duraciones a mano** | ✅ `.22s` a propósito |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ |
| huérfanas (en `extraer.mjs`) | Clase emitida sin regla — **ahora ve dentro de los arrays** | ✅ por la vía exacta del escape |
| `verificar-cascada` | Lo que NO se escribió, a once anchos | ✅ |

Y `auditorias/herramientas/clases-tsx-vs-hoja.mjs` hace el cruce completo
TSX↔hoja en ambas direcciones (0 fallos hoy).

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                   1.25.0
Tokens semánticos             56   + 9 de movimiento/elevación
Colores autorizados          114
Pares de contraste           178   (138 bloqueantes, 0 fallos en ambos modos)
Componentes publicados        24
Pruebas                      195   en 14 archivos
Iconos                        39
```

```powershell
docker compose exec ds node sistema/candado/verificar-contraste.mjs
docker compose exec ds sh -c "cd componentes && npm run probar"
```

---

## Lo que NO está hecho — declarado

| Qué | Por qué |
|---|---|
| Los seis `--ambito-alt-*` | **Aplazado por el responsable del producto** (2026-08-10): hoy es el único integrante y no hay producción. El diagnóstico está aceptado y el nombre acordado; retomarlo será media conversación |
| R8, R16, R17 | Marcados `PENDIENTE` en `comportamiento.md`: filas plegables y su ocultación real |
| Selección múltiple y encabezado fijo en la tabla | Declarado en manual §10 |
| Escudo suelto e isotipo simplificado | **Trabajo de diseñador, no de código** |
| Candado que monta componentes en navegador real | Fase 1 del plan de la auditoría de composición. Con la lección de R26: página visible o transiciones apagadas, o se miden defectos que no existen |
| Catálogo consumiendo el render real de los componentes | Fase 3 de la auditoría — obra mayor, decisión pendiente del responsable |
| ESLint: 2 errores en `Estados.tsx` (45 y 144) | `style=` dinámico de esqueleto y progreso; la decisión de arreglarlo es del responsable |

### R26 · retirado

El «lateral que no encogía» **no existía**: Control Administrativos midió desde
una pestaña oculta, donde el navegador congela las transiciones en el
milisegundo cero. Lo retiraron ellos con la causa documentada; la lección quedó
en la auditoría de composición.

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado · https://github.com/solwarehz/sistema-diseno
- En esta máquina (Windows) se trabaja en `main` directo, **únicamente con los
  ocho candados y las pruebas en verde**. Es de donde instala el área de
  sistemas: un `main` roto es un proyecto ajeno roto.
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- `.gitattributes` fija LF; los binarios de diseño no suben (propiedad del
  cliente).
- Notas de esta máquina: `LEVANTAR-EN-WINDOWS.md` (contenedores, siete
  comandos, Docker autorizado permanente).
