# Estado del proyecto

**Última actualización:** 11 de agosto de 2026
**Versión del sistema:** MMI-DS **v1.42.0** — el menú que se quedaba comprimido
enseñando las opciones de extendido, y el marco entra por fin en el candado de
la promesa

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.
>
> **Y se reescribe SIEMPRE.** Van dos veces que no se hace: se quedó en v1.25.0
> con el repositorio en v1.38.0, y otra vez en v1.39.0 con el repositorio en
> v1.41.3 —tres versiones—. Un registro desfasado se lee como si fuera cierto,
> que es exactamente el defecto que este archivo debía evitar.

---

## Dónde estamos, en una frase

El sistema es un **paquete que un producto instala y consume** —35 funciones de
componente, la hoja que viaja, once candados, 295 pruebas— y desde hoy la parte
que más se reconstruye, el marco de aplicación, **está vigilada por el candado
de la promesa**: hasta esta versión no tenía ni un caso.

---

## Qué está hecho y verificado

Cada cifra sale del comando que está al lado. **No se repiten de memoria.**

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `generar.mjs` — 56 semánticos + 5 de marca, claro y oscuro |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | `verificar-contraste` · 178 pares · 138 bloqueantes · **0 fallos** |
| Candado de lint | ✅ | `probar-candado` en Docker |
| Componentes de React | ✅ | **295 pruebas en 20 archivos** · `tsc --noEmit` limpio |
| La hoja que viaja | ✅ | `extraer.mjs` · 707 reglas de 1192 · **516 clases, 0 huérfanas** |
| Catálogo navegable | ✅ | `cascaron/index.html` · 49 páginas · lo genera `generar-cascaron.mjs` |
| Iconografía | ✅ | 45 trazos en `iconos.mjs`, React real |
| Entrega ZIP | ✅ | `sistema-diseno-v1.42.0.zip` · 604 KB · 44 archivos |
| Modo oscuro | ✅ | Aprobado 2026-08-09 · marco en escala de negros |
| Compresor de PDF propio | ✅ | Sin dependencias · **y desde hoy con su `.d.mts`** |

### Lo que cambió desde la v1.39.0

| Versión | Qué |
|---|---|
| v1.40.0 | `CargaPdf` cabe en un formulario: botón fuera, panel que empuja, borrador que confirma al Grabar |
| v1.40.1 | El botón fija su propio `line-height` — el CSV salía más alto en la entrega |
| v1.41.0 | El reset `box-sizing` por fin viaja, y **nace el candado promesa-vs-entrega** |
| v1.41.1 | El botón declara su propio `display` — sin `.btn-ic` el icono y el texto se apilaban |
| v1.41.2 | La tira de filtros de la tabla se entregaba vacía |
| v1.41.3 | R47 · el panel flotante del menú plegado cerraba en seco |
| **v1.42.0** | **R48** · el menú seguía comprimido y sacaba a la vez las opciones de extendido |

### Lo de hoy, con detalle

**R48.** Reportado a 900px: «está el menú comprimido, pero el botón de expandir
se muestra; al dar clic sigue comprimido pero se ven las opciones de extendido».
Reproducido en el navegador con la hoja que viaja: la lateral seguía en 56px con
su clase de plegada y **los cuatro paneles flotantes** encima del contenido.

La causa: el clic re-sincronizaba la apertura de los grupos con el valor
**pedido**. Sin control de fuera da igual —pedir es aplicar—, pero **controlado**
(R21) manda el producto: si no devuelve el valor nuevo, el carril sigue plegado
y los grupos se abrían igual. Y plegado, un grupo abierto **es** un panel
flotante. No hace falta que el producto se equivoque: guardar la preferencia en
el perfil —lo que el sistema recomienda— hace que el valor vuelva tarde.

**Y la promesa no enseñaba ese ancho.** R38a movió el riel de ≤900 al componente
y el catálogo se quedó sin él. Medido antes de tocar nada, a 900px: catálogo
desplegado a 236px, entrega plegada a 56px. Ahora el catálogo lleva las dos
bandas, su botón gana el `aria-expanded` que nunca tuvo, y plegar pasa por un
solo sitio.

**El marco entra en el candado de la promesa** con once casos —lateral, carril,
opciones, panel flotante, botón de plegar con sus dos iconos, velo—: 29 casos a
cinco anchos, todos idénticos.

**El compresor de PDF ya viaja con tipos.** `componentes/src/interno/comprimir-pdf.d.mts`.
Sin él, un producto que compile sin `allowJs` se caía con **TS7016** desde
nuestro propio `index.ts`, sin usar el compresor. Reproducido con un `tsconfig`
de consumidor: dos errores sin la declaración, cero con ella.

---

## Los once candados

Se pasan **todos** antes de subir a `main`. Ninguna versión sube con uno en rojo.

| Candado | Qué impide | Se ha visto en rojo |
|---|---|---|
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea, marcado fuera de norma y duraciones a mano | ✅ |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ |
| huérfanas (en `extraer.mjs`) | Clase emitida sin regla | ✅ |
| `verificar-cascada` | Lo que NO se escribió, a once anchos | ✅ |
| `verificar-promesa` | Que lo entregado no se vea como lo enseñado | ✅ |
| ESLint | El atributo `style`, el hex crudo, `outline:none` | ✅ el mismo día: cazó una comilla invertida que rompía el generador |
| `tsc --noEmit` | Tipos | ✅ |

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                      1.42.0
Tokens semánticos                56   + 5 de marca
Pares de contraste              178   (138 bloqueantes, 0 fallos en ambos modos)
Pruebas                         295   en 20 archivos
Reglas que viajan               707   de 1192 · 516 clases, 0 huérfanas
Casos del candado de promesa     29   a 5 anchos (1440, 1024, 900, 700, 390)
Iconos                           45
Páginas del catálogo             49
```

```powershell
docker compose exec ds node sistema/candado/verificar-contraste.mjs
docker compose exec ds sh -c "cd componentes && npm run probar"
```

---

## Lo que NO está hecho — declarado

| Qué | Por qué |
|---|---|
| **El marco abre TODOS los grupos al desplegar; el catálogo abre solo el de la página** | Divergencia medida hoy y **no resuelta**: son dos modelos de navegación distintos, los dos escritos y defendidos. Decidirlo cambia el menú de todos los productos o la documentación: **es del responsable** |
| **El candado de la promesa compara CSS, no comportamiento** | R47 y R48 fueron defectos de comportamiento: ningún candado los vio. Lo único que los caza hoy son las pruebas del componente |
| Compresión de imágenes que no sean JPEG | El compresor solo toca `/DCTDecode` |
| El compresor en Node no toca imágenes | Necesita `canvas`; lo de imágenes se verificó en el navegador |
| Fuentes incrustadas | No se tocan. Es el otro gran peso de un PDF |
| Los seis `--ambito-alt-*` | Aplazado por el responsable del producto (2026-08-10) |
| R8, R14–R17 | Marcados `PENDIENTE` en `comportamiento.md` |
| Selección múltiple y encabezado fijo en la tabla | Declarado en manual §10 |
| Escudo suelto e isotipo simplificado | **Trabajo de diseñador, no de código** |
| ESLint: 2 errores en `Estados.tsx` (46 y 149) | `style=` dinámico de esqueleto y progreso; la decisión **es del responsable** y sigue sin tomarse |

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado · https://github.com/solwarehz/sistema-diseno
- En esta máquina (Windows) se trabaja en `main` directo, **únicamente con los
  once candados y las pruebas en verde**. Es de donde instala el área de
  sistemas: un `main` roto es un proyecto ajeno roto.
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- `.gitattributes` fija LF; los binarios de diseño no suben.
- Notas de esta máquina: `LEVANTAR-EN-WINDOWS.md`.
