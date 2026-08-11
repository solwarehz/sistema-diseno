# Estado del proyecto

**Última actualización:** 11 de agosto de 2026
**Versión del sistema:** MMI-DS **v1.39.0** — la carga de PDF que comprime de
verdad y sin dependencias, y el área de texto

> Este archivo se reescribe entero cuando cambia el estado. No se le añaden
> párrafos: un estado con capas es un estado que ya no se lee.
>
> **Y se reescribe SIEMPRE.** Esta vez no se hizo: el archivo se quedó en
> v1.25.0 mientras el repositorio llegaba a v1.38.0 — **catorce versiones
> diciendo un estado que ya no existía**. Un registro desfasado se lee como si
> fuera cierto, que es exactamente el defecto que este archivo debía evitar.

---

## Dónde estamos, en una frase

El sistema es un **paquete que un producto instala y consume** —32 componentes
de React, la hoja que viaja, diez candados, 270 pruebas— y desde hoy sabe
**comprimir un PDF sin cargar con una sola dependencia**: 94 % medido en un
escaneo, con el archivo resultante abierto y leído en un visor de verdad.

---

## Qué está hecho y verificado

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `node sistema/tokens/generar.mjs` — 56 semánticos + movimiento |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, nunca a mano |
| Contraste en **los dos modos** | ✅ | 178 pares · 138 bloqueantes · **0 fallos** |
| Candado de lint | ✅ | Ejecutado en Docker · 62 casos |
| **32 componentes de React** | ✅ | 270 pruebas en 20 archivos, en Docker |
| Catálogo navegable | ✅ | `cascaron/index.html` · 49 páginas |
| Iconografía | ✅ | 43 iconos, React real |
| Entrega ZIP | ✅ | `sistema-diseno-v1.39.0.zip` |
| Modo oscuro | ✅ | Aprobado 2026-08-09 · marco en escala de negros |
| **Compresor de PDF propio** | ✅ | Sin dependencias · 88–91 % en PDF crudo (Node), **94 % en escaneo** (navegador) |

### Lo que cambió desde la v1.25.0

| Versión | Qué |
|---|---|
| v1.26–v1.30.4 | `CargaImagen`: los tres formatos con la proporción del hueco real, encuadre probable en el catálogo, recorte en WebP, y cuatro correcciones seguidas del difuminado y los anchos |
| v1.31.0 | `SelectorBusqueda` entrega su promesa: lupa, chevron, visto — y el resaltado de teclado por fin se pinta |
| v1.32.0–v1.34.0 | R38/R38a/R39 · el responsive es **comportamiento del componente**: columna centrada en pantalla muy ancha, cajón con velo de verdad y pliegue automático, y el riel de tableta como **estado, no CSS forzado** |
| v1.35.0 → v1.36.0 | `alGuardar` entró y **se retiró**: la frontera de escritura es del producto, y faltaba la decisión del responsable |
| v1.37.0 | El `Campo` **recorta al salir**, y nace `CampoContrasena`, que **jamás normaliza** |
| v1.38.0 | R42 · el tercer nivel del menú por fin se emite, y la tabla simple vuelve a ser **una** tabla |
| **v1.39.0** | **R43** `CargaPdf` + compresor propio · **R44** `AreaTexto` |

### Lo de hoy, con detalle

**R43 · `CargaPdf`.** El compresor está **escrito a mano** porque el paquete no
tiene ni una dependencia de ejecución y meter `pdf-lib` se la habría puesto a
todos los productos que lo instalan. Recomprime las imágenes JPEG incrustadas
—lo único que mueve la aguja en un escaneo—, tira lo que ya no alcanza nadie,
tira XMP y `/PieceInfo`, desinfla lo que viajaba en crudo y **reempaqueta en
`/ObjStm`**: sin eso un PDF moderno saldría **más grande**.

Tres promesas, cada una con prueba: nunca devuelve algo más grande, nunca
devuelve algo que no sepa releer —relee su propia salida y exige el mismo
número de páginas—, y nunca toca un PDF cifrado.

**R44 · `AreaTexto`.** Compone el envoltorio de `Campo`, no lo reconstruye.
Crece con lo escrito **con CSS** (la altura desde JavaScript exigiría el
atributo `style`, que el candado prohíbe), el límite es **blando** —`maxlength`
corta al pegar en silencio y sin deshacer— y el contador **solo se anuncia en el
último tramo**.

---

## Los diez candados

Se pasan **todos** antes de subir a `main`. Ninguna versión sube con uno en rojo.

| Candado | Qué impide | Se ha visto en rojo |
|---|---|---|
| `verificar-contraste` | Que el contrato mienta sobre un par | ✅ |
| `verificar-color` | Un hexadecimal, `rgb()` o `hsl()` suelto | ✅ |
| `auditar-cascaron` | Estilo en línea, marcado fuera de norma y duraciones a mano | ✅ |
| `probar-candado` | Que las reglas de ESLint no hagan nada | ✅ |
| `verificar-contrato` | Una regla obligatoria sin prueba que la nombre | ✅ |
| `verificar-entrega` | Que el catálogo enseñe lo que no viaja, y al revés | ✅ el mismo día: pidió página para `CargaPdf` y `AreaTexto` |
| huérfanas (en `extraer.mjs`) | Clase emitida sin regla | ✅ el mismo día: 25 clases nuevas sin regla |
| `verificar-cascada` | Lo que NO se escribió, a once anchos | ✅ |
| ESLint | El atributo `style`, el hex crudo, `outline:none` | ✅ |
| `tsc --noEmit` | Tipos | ✅ |

---

## Números verificados

No los repitas de memoria: **regenéralos**.

```
Versión                   1.39.0
Tokens semánticos             56   + movimiento/elevación
Pares de contraste           178   (138 bloqueantes, 0 fallos en ambos modos)
Componentes de React          32   funciones exportadas desde componentes/src
Pruebas                      270   en 20 archivos
Iconos                        43
Páginas del catálogo          49
```

```powershell
docker compose exec ds node sistema/candado/verificar-contraste.mjs
docker compose exec ds sh -c "cd componentes && npm run probar"
```

---

## Lo que NO está hecho — declarado

| Qué | Por qué |
|---|---|
| **Compresión de imágenes que no sean JPEG** | El compresor solo toca `/DCTDecode`. Un PDF con imágenes PNG incrustadas apenas adelgaza, y se dice en `detalle` |
| **El compresor en Node no toca imágenes** | Necesita `canvas`. Las pruebas de Node cubren el camino estructural; el de imágenes se verificó **en el navegador** y así está declarado en el propio archivo de pruebas |
| **Fuentes incrustadas** | No se tocan. Es el otro gran peso de un PDF y queda fuera |
| Los seis `--ambito-alt-*` | Aplazado por el responsable del producto (2026-08-10) |
| R8, R14–R17 | Marcados `PENDIENTE` en `comportamiento.md` |
| Selección múltiple y encabezado fijo en la tabla | Declarado en manual §10 |
| Escudo suelto e isotipo simplificado | **Trabajo de diseñador, no de código** |
| ESLint: 2 errores en `Estados.tsx` (46 y 149) | `style=` dinámico de esqueleto y progreso; la decisión de arreglarlo **es del responsable** y sigue sin tomarse |

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado · https://github.com/solwarehz/sistema-diseno
- En esta máquina (Windows) se trabaja en `main` directo, **únicamente con los
  diez candados y las pruebas en verde**. Es de donde instala el área de
  sistemas: un `main` roto es un proyecto ajeno roto.
- Nunca `--force`. Nunca `checkout` ni `stash` sobre el árbol compartido.
- `.gitattributes` fija LF; los binarios de diseño no suben.
- Notas de esta máquina: `LEVANTAR-EN-WINDOWS.md`.
