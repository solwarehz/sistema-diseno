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

### P-04 · Escudo suelto en PNG (§10)

De 32 a 1024px. Hoy solo existe incrustado en los lockups.

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
