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
| `AE-escudo-*.png` | **Solo uno, sin juego de tamaños** | Existe `imagenes/AE.png` a **1063 × 1291**, fondo transparente. Faltan los pasos de 32 a 1024 que pide §10 |
| `AE-isotipo-*.png` | **No existe** | Ver hueco 2 abajo |
| `favicon.ico` | **No existe** | Depende del isotipo |
| `apple-touch-icon-180px.png` | **No existe** | Depende del isotipo |

---

## Dos huecos que bloquean, y son trabajo de diseñador

### 1 · Hay UN escudo suelto, no el juego de tamaños

**Corregido el 2026-09-10.** Hasta esa fecha este archivo decía «no existe» y
«el escudo solo está incrustado dentro de los lockups». **Las dos cosas eran
falsas**, y llevaban tiempo leyéndose como si fueran ciertas.

Lo que hay: `imagenes/AE.png`, **1063 × 1291**, fondo transparente, escudo
completo con COLEGIO / AE / átomo / HUARAZ. Es el que consumen de verdad
`MarcaMenu` y la barra móvil.

Lo que falta: el **juego de tamaños** que pide MMI-DS §10, de 32 a 1024px. Lo
necesitan el marco de aplicación (32px), la landing (48px y 96px) y el panel de
marca. Las **maquetas** del catálogo siguen dibujando un marcador de posición
explícito a 22, 30, 34 y 80px.

No se recorta del lockup: recortar un logo produce bordes sucios y proporciones
que no son las del original.

### 2 · No hay isotipo simplificado — MMI-DS §8.6

Por debajo de 56px, «COLEGIO» y «HUARAZ» son ilegibles dentro del escudo. Para el
marco a 40px y el favicon a 16px **no hay activo válido**. Hace falta un isotipo
con solo el AE dentro del escudo.

Esto no se resuelve escalando: se resuelve dibujando.

---

## El defecto de identidad — MMI-DS §8.5 dice DOS rojos. Hay TRES.

**Medido el 2026-09-10** decodificando los PNG y localizando cada color por su
caja envolvente:

| Color | Dónde está, exactamente | % de tinta de su archivo |
|---|---|---|
| `#E30613` | El escudo suelto, `AE.png` | 13,29 % |
| `#EC2027` | El wordmark «ALBERT EINSTEIN» del lockup | 9,18 % |
| `#EC1C24` | **Dentro del escudo incrustado en el lockup** — x 23-53, y 32-71 | 3,26 % |

El tercero no estaba declarado en ninguna parte, y su posición cambia lo que
significa el defecto. No es «el escudo usa un rojo y el lockup usa otro»: es que
**el mismo escudo sale de dos rojos distintos según de qué archivo se saque**.
Cuatro unidades de verde y tres de azul de diferencia son la huella de un
recoloreado o de un perfil de color distinto, no un criterio.

El sistema adopta `#E30613` como `marca_rojo` porque es el del escudo suelto,
que es el elemento primario. Los otros dos están **nombrados y no autorizados**
en `categoricas.marca` (`rojo_lockup`, `rojo_escudo_lockup`): nombrarlos los
mete bajo el candado de color, que es lo que impide que alguien los saque del
PNG y los escriba a mano.

Requiere corrección del diseñador sobre el archivo del lockup.

---

## Y una advertencia sobre el casi-negro

`#1D1D1B` es el **8,41 %** de la tinta del lockup y **no es el wordmark** — ese
es rojo. Son dos bandas de 7px de alto: «COLEGIO» (y 20-26) y el lema «UN
EINSTINO: UN TRIUNFADOR» (y 73-79).

Sobre `--marco-fondo` da **1,62:1** en claro y **1,38:1** en oscuro, así que en
la barra lateral esas dos líneas desaparecen. WCAG 2.1 **exime a los logotipos**
del mínimo de contraste, así que no es un incumplimiento normativo — pero sigue
siendo texto que no se lee, y el sistema ya lo evita en la barra móvil usando el
escudo en vez del lockup.

---

## Cómo se añaden

Los archivos se dejan en esta carpeta. No hace falta tocar `.gitignore`: ya están
excluidos. Si algún día un activo debe versionarse, se añade una excepción
explícita y se justifica aquí.
