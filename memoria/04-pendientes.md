# Pendientes

Ordenados por retorno, no por dificultad.

---

## Bloqueado por autorización

### P-01 · Docker

**Bloquea:** componentes, catálogo, ZIP, y la ejecución del candado de lint.

Sin contenedor no se puede compilar nada de React ni ejecutar ESLint. Escribir
esos archivos sin poder ejecutarlos produce código no verificado, que incumple la
definición de terminado.

Lo que hay que pedir, itemizado: descargar `node:20-alpine` (~190 MB, oficial),
construir la imagen local, levantar en `127.0.0.1:3000`, y volumen con nombre para
`node_modules` para que las dependencias no toquen la carpeta ni la máquina.

### P-02 · Los tres PNG de identidad

Se piden por el chat. Ver [`03-al-clonar.md`](03-al-clonar.md).

---

## Trabajo de diseñador — no se resuelve con código

### P-03 · Isotipo simplificado (MMI-DS §8.6)

Sin él **no hay favicon válido ni marco a 40px**. Es el que más bloquea de los tres.

### P-04 · Escudo suelto — RESUELTO

`imagenes/AE.png`, 1063×1291 con canal alfa. El usuario lo aportó.

**Consecuencia medida al montarlo:** el lockup es transparente y su texto es
rojo `#EC2027` y negro. Sobre `marco-fondo` dan **2,38:1** y **1,66:1**, muy por
debajo de AA. El escudo solo sí funciona sobre azul —tiene cuerpo blanco
propio—, pero el lockup no.

Por eso la marca de la lateral va sobre **banda clara** (`fondo-tarjeta`). Es la
única forma de usar el activo tal como está. La alternativa sería una versión
del lockup en blanco, que no existe.

Sigue en pie el §8.6: a 32px, «COLEGIO» y «HUARAZ» dentro del escudo son
ilegibles. Se lee como marca, no como texto. Para el favicon a 16px sigue
faltando un isotipo.

### P-05 · Corrección del lockup (§8.5)

`#EC2027` debe pasar a `#E30613`. Dos rojos en la misma identidad.

---

## Sistema — por retorno

### P-06 · Tabla de datos — RESUELTO en el cascarón

Orden por columna, filtros por columna y globales, paginación, columnas
ocultables con persistencia, CSV y filas desplegables: todo especificado y
funcionando en `cascaron/index.html`.

**Sigue sin construir:** selección múltiple con acciones en lote (necesita definir
permisos, es regla de negocio), encabezado fijo al desplazar y reordenar columnas
arrastrando.

El §8.3 pedía además «un patrón general para pantallas que no son tabla». Está en
el elemento **Estados de pantalla**, que define seis y las tres parejas que se
confunden.

### P-07 · Iconografía (§8.1)

Decidido Lucide, trazo 1.5px a 18px (ver D-07). Falta implementarlo y **retirar los
emoji**, que es el tercer defecto real del §1.3.

### P-08 · Densidad conmutable (§8.2)

El token existe (34px / 28px). Falta el conmutador y que se recuerde por sesión.

En un sistema donde alguien procesa cien registros al día no es lujo, y casi ningún
sistema institucional lo tiene.

### P-09 · Primitivas de dominio (§8.4)

**El activo que ninguna librería puede dar.** DNI y RUC con validación de dígito
verificador, nombres con dos apellidos, ubigeo en cascada, moneda en soles, fechas
en formato peruano, estados de trámite.

La cascada de ubigeo ya existe en el sistema y **no es un componente de interfaz:
es una primitiva de dominio.**

**Debe documentarse como contrato de componente:** que `perez` encuentre a `Pérez`
depende de las extensiones `unaccent` y `pg_trgm`. Es una **promesa de interfaz**,
no un detalle de base de datos. Si otro buscador se monta sin ellas, el componente
se comporta distinto y nadie sabrá por qué.

### P-10 · Voz de interfaz (§8.7)

**Escrito** en el §7 del manual de aplicaciones web. Falta aplicarlo: revisar los
mensajes que ya existen en los sistemas y corregir los que no dicen qué hacer.

---

## No hacer

| Qué | Por qué |
|---|---|
| Modo oscuro | Calculado pero **no aprobado** (§9, §2.4). Ver D-06 |
| Storybook | Prohibido por §9. Ver D-05 |
| Librería de componentes general | Prohibido por §9. Solo Radix para 3 casos. Ver D-08 |
| Mostrar markup interno de componentes compartidos | §9. Se copia la importación y las props |

---

## Huecos del sistema detectados por el auditor

`node sistema/candado/auditar-cascaron.mjs` comprueba que el catálogo use solo
lo que el sistema define. Encontró dos cosas que **el sistema no cubre**. No son
incumplimientos: son tokens que faltan.

### P-11 · Capas sobre el marco — RESUELTO en v1.6.0

Se definieron cuatro tokens y se midieron contra `marco-fondo`:

| Token | Valor | Para qué |
|---|---|---|
| `marco-nivel-1` | `#39497A` | Subopciones de primer nivel |
| `marco-nivel-2` | `#41507F` | Subopciones de segundo nivel |
| `marco-borde` | `#45558A` | Separador dentro del marco |
| `marco-texto-tenue` | `#B9C2DC` | Correo del usuario y textos de apoyo |

**El techo lo pone el acento dorado, no el texto blanco.** Aclarando el marco
hacia blanco, `marco-acento` cae por debajo de 4,5:1 pasado el 10 %:

| Aclarado | Valor | Blanco | Oro |
|---|---|---|---|
| 0 % | `#2C3D71` | 10,43 | 6,49 |
| 6 % | `#39497A` | 8,72 | 5,42 |
| 10 % | `#41507F` | 7,83 | **4,87** |
| 14 % | `#4A5885` | 6,94 | 4,31 ✗ |

Por eso **hay sitio para exactamente dos niveles de anidamiento y no para
tres**. No es una preferencia: es lo que deja la paleta.

### P-12 · Elevación

El sistema no define sombras. El cascarón usa dos —capa flotante y aviso—
declaradas una sola vez como variables propias, no repetidas.

Falta decidir si la elevación entra al sistema y con cuántos niveles. Con tres
superficies flotantes (menú de usuario, calendario y avisos) probablemente
bastan dos.

### P-13 · Radio de control

El sistema define radio de tarjeta (6px) y de chip (3px). Los controles
pequeños —botones de paginación, ítems de menú— usaban 4px y 5px. Se llevaron a
6px para no inventar un valor, pero conviene decidir si un radio de control
propio tiene sentido.

---

## Peticiones aceptadas de Control de Asistencia — 2026-08-08

Respuesta razonada en
[`../peticiones/2026-08-08-control-de-asistencia.md`](../peticiones/2026-08-08-control-de-asistencia.md).
Orden de entrega decidido por plazo y por bloqueo, no por su prioridad.

**1 · Iconografía** — el conjunto existe (24 iconos, retícula 24×24, trazo
1,5px, `currentColor`) pero **no hay regla de tamaño**: conviven 13, 14, 15, 16,
18 y 32px, y tres están fuera de la rejilla de 4. Falta además entregarlo como
módulo consumible y publicar la regla de icono decorativo frente a significativo.
Hallazgo propio, aparecido al auditar para responderles.

**2 · Fallo de dibujado — estado SÉPTIMO**, no sustituye al «Error» que ya
existe. Error es «la petición falló» y ofrece Reintentar; fallo de dibujado es
«el componente reventó al pintarse» y ofrece Recargar, porque reintentar el mismo
dibujado repite el fallo. Sin traza, sin nombre de excepción, sin ruta.

**3 · Avatar** — cierra C-09. **Necesita tokens nuevos y versión nueva.** No se
puede reutilizar la paleta de estado: un avatar rojo diría que la persona tiene
un problema. Paleta de identidad propia, iniciales a 4,5:1 sobre todos los
colores en los dos modos, asignación determinista por identificador estable
—nunca por nombre, que cambia—. Unifica las tres implementaciones y los cuatro
tamaños actuales (30·36·42·48; el 42 está fuera de rejilla).

**4 · Conmutador de densidad** — los tokens ya existen (`fila-comoda` 34px,
`fila-compacta` 28px), así que **no les bloquea**. Decisión tomada: la densidad
es **global, no por tabla**; dos tablas con distinta altura de fila en la misma
pantalla se leen como fallo, no como preferencia.

### Recomendación repetida a los proyectos

Tema, densidad y formato horario deben persistir en **el perfil del usuario**, no
en `localStorage`. El catálogo usa `localStorage` porque no tiene sesión; un
producto sí la tiene, y una preferencia que no sigue a la persona entre
dispositivos está a medias.

### Advertencia elevada, no resuelta

Si el avatar va a mostrar fotos de **estudiantes menores de edad**, eso no es
decisión de interfaz: es de dirección y con consentimiento por escrito. El
sistema entrega el componente; a qué caras se aplica, no.
