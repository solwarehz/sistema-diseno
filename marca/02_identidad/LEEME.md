# Activos de identidad — Colegio Albert Einstein

**Estos archivos no están en el repositorio y no deben subirse.**

Son propiedad del cliente. `.gitignore` excluye `*.png`, `*.jpg`, `*.pdf`, `*.ai`,
`*.psd` y demás formatos de diseño. El repositorio versiona **el sistema**; la
identidad vive solo en la máquina de trabajo.

Quien clone este repositorio verá esta carpeta vacía. Es lo correcto.

---

## Inventario esperado

| Archivo | Estado | Nota |
|---|---|---|
| `AE-nombre-horizontal.png` | Pendiente de recibir | Lockup horizontal |
| `AE-nombre-vertical.png` | Pendiente de recibir | Lockup vertical |
| `TIPOGRAFIA-web-y-sistema.png` | Pendiente de recibir | Espécimen de las dos escalas |
| `AE-escudo-*.png` | **No existe** | 32 a 1024px. Ver hueco 1 abajo |
| `AE-isotipo-*.png` | **No existe** | Ver hueco 2 abajo |
| `favicon.ico` | **No existe** | Depende del isotipo |
| `apple-touch-icon-180px.png` | **No existe** | Depende del isotipo |

---

## Dos huecos que bloquean, y son trabajo de diseñador

### 1 · No hay escudo suelto

El documento MMI-DS §10 lista `AE-escudo-*.png` de 32 a 1024px. No existen. El
escudo solo está incrustado dentro de los lockups.

Lo necesitan: el marco de aplicación (32px), la landing (48px y 96px) y el panel
de marca. Mientras no exista, el catálogo muestra un **marcador de posición**
explícito. No se recorta del lockup: recortar un logo produce bordes sucios y
proporciones que no son las del original.

### 2 · No hay isotipo simplificado — MMI-DS §8.6

Por debajo de 56px, «COLEGIO» y «HUARAZ» son ilegibles dentro del escudo. Para el
marco a 40px y el favicon a 16px **no hay activo válido**. Hace falta un isotipo
con solo el AE dentro del escudo.

Esto no se resuelve escalando: se resuelve dibujando.

---

## Un defecto de identidad pendiente — MMI-DS §8.5

El escudo usa `#E30613` y el lockup «ALBERT EINSTEIN» usa `#EC2027`. **Son dos
rojos distintos en la misma identidad.** Requiere corrección del diseñador sobre
el archivo del lockup.

El sistema adopta `#E30613` como `marca-rojo` porque es el del escudo, que es el
elemento primario.

---

## Cómo se añaden

Los archivos se dejan en esta carpeta. No hace falta tocar `.gitignore`: ya están
excluidos. Si algún día un activo debe versionarse, se añade una excepción
explícita y se justifica aquí.
