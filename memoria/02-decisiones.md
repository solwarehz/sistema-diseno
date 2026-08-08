# Registro de decisiones

Cada decisión con su porqué y **qué la revertiría**. Si vas a cambiar algo de
aquí, lee primero por qué está así. Casi todas costaron una medición.

---

## D-01 · Se corrigieron dos valores «BLOQUEADOS»

**Decisión:** subir a v1.1.0 cambiando `borde-campo` y `texto-pista`.

| Token | Antes | Ahora | Medido | Norma |
|---|---|---|---|---|
| `borde-campo` | `#C8C6C4` | `#8B8985` | 1,70:1 → 3,48:1 | SC 1.4.11 |
| `texto-pista` | `#8B8985` | `#6A6864` | 3,49:1 → 5,55:1 | SC 1.4.3 |

**Por qué:** MMI-DS v1.0.0 declara «26 pares verificados, cero fallos». Al verificar
los 46 que exige la composición base del §5.1 aparecieron estos dos. Ninguno estaba
entre los 26 originales.

El contorno de los campos a 1,70:1 era **imperceptible**: los inputs no se
distinguían del fondo. Es el mismo descuido que el §1.3 reporta sobre el foco de
los filtros, en el mismo sitio.

**Lo revertiría:** nada razonable. Revertir vuelve a incumplir AA y el candado
falla, que es exactamente lo que debe hacer.

---

## D-02 · La jerarquía del placeholder no se expresa con color

**Decisión:** `texto-pista` vale lo mismo que `texto-secundario`, y la jerarquía
pasa a ser regla de composición: **etiqueta siempre visible, placeholder solo como
ejemplo de formato**.

**Por qué:** se buscó el gris más claro de la rampa que alcanzara 4,5:1. Es
`#6E6C68`, y queda a **1,06:1 de `texto-secundario`** — visualmente idéntico. No
existe ningún gris que sea a la vez más claro que `texto-secundario` y cumpla AA.

No fue un valor mal elegido: fue un token que pedía algo imposible.

**El token se conserva** aunque tenga el mismo valor, porque documenta la intención
en el componente y permite cambiarlo si algún día se separa.

**Lo revertiría:** que WCAG eximiera al placeholder. No lo hace.

---

## D-03 · Fuente única de color, artefactos generados

**Decisión:** solo `sistema/tokens/fuente.mjs` contiene valores. El contrato, el
CSS y el preset de Tailwind se generan.

**Por qué:** el modo de fallo real de un sistema de diseño no es elegir mal un
color: es que el mismo color viva en cuatro archivos y tres se actualicen. Con
generación, ese fallo no puede ocurrir.

**Lo revertiría:** nada.

---

## D-04 · El candado se probó rompiéndolo

**Decisión:** el verificador no confía en el número guardado; **recalcula** los 46
pares y además comprueba que el hex del par coincida con el del token.

**Por qué:** una prueba que no se ha visto fallar no protege nada. Se saboteó
`borde-campo` en el contrato sin regenerar: el verificador lo detectó y salió con
código 1.

**Lo revertiría:** nada.

---

## D-05 · No se monta Storybook

**Decisión:** el catálogo es la ruta `/diseño` dentro de la aplicación.

**Por qué:** lo prohíbe MMI-DS §9, y con razón. Para ocho componentes Storybook es
otra dependencia, otro build y un catálogo que **se desincroniza**. La ruta importa
los componentes reales, así que no puede divergir.

**Lo revertiría:** que el sistema creciera a decenas de componentes con muchos
estados combinatorios. No es el caso.

---

## D-06 · Modo oscuro — RECOMENDACIÓN RETIRADA

**Decisión inicial:** solo modo claro, porque MMI-DS §9 lo desaconseja y duplica
la superficie de prueba.

**Por qué se retiró:** el usuario mostró una captura del sistema actual y **la
barra superior ya tiene conmutador de tema**. Si el producto ya lo ofrece, el
modo oscuro no es una mejora opcional: es una promesa hecha. Retirarlo sería
quitar función existente.

**Estado:** los dos modos están verificados —35 pares bloqueantes cada uno, 0
fallos— y el cascarón los conmuta.

**Coste que sigue en pie:** cada componente de las fases 4 y 5 se prueba dos
veces. Eso ya no es discutible, es el precio de la función.

---

## D-12 · La composición es lateral vertical, no marco horizontal

**Decisión:** barra lateral plegable a la izquierda (236px desplegada, 58px
plegada), filtros globales en la barra superior, tarjeta de usuario abajo a la
izquierda.

**Por qué:** MMI-DS §5.1 especifica «marco de aplicación, 54px de alto,
navegación horizontal». **El sistema real no es así.** El usuario aportó captura
del sistema en producción: lateral vertical con submenús, filtros globales
arriba (Años · Sedes · Nivel) y usuario abajo.

Manda el sistema real. **MMI-DS §5.1 queda desactualizado y hay que corregirlo.**

**Consecuencia de color que hay que mirar:** `marco-fondo #2C3D71` se eligió «por
intensidad medida» **para una barra de 54px**. En una lateral de altura completa
la superficie se multiplica por seis. El valor sigue cumpliendo contraste, pero
la decisión estética se tomó para otra proporción. Pendiente de que el usuario lo
vea y lo confirme.

**Del sistema real se toma el esquema, NO los colores.** Instrucción expresa del
usuario.

---

## D-13 · Defectos detectados en el sistema en producción

De la captura aportada, para corregir cuando se toque ese código:

| Defecto | Regla que incumple |
|---|---|
| «Hola, JOSE ISIDRO» en tipografía **serif** | §3 — IBM Plex Sans para todo, sin excepción |
| Badge **«0»** en el icono de mensajes | Un contador en cero no informa. No debe pintarse |
| «Tu cuenta todavía no tiene un perfil asignado.» | Callejón sin salida. Ningún mensaje sin decir qué hacer |
| Iconos del menú de trazo variable | §8.1 — pendiente de unificar en Lucide 1,5px |

Los tres primeros son de una línea. El de la tipografía es el más visible.

---

## D-07 · Iconos: Lucide

**Decisión:** Lucide, trazo 1.5px, 18px alineado con texto de 15px.

**Por qué:** MMI-DS §8.1 deja la iconografía pendiente y recomienda exactamente ese
perfil. Hoy son **emoji**, que es el tercer defecto real del §1.3: no heredan
color, no se alinean y cambian según el sistema operativo. Lucide es trazo,
licencia ISC, y hereda `currentColor` — que es justo lo que el emoji no hace.

**Lo revertiría:** que aparezca un requisito de iconos rellenos o de un set
institucional propio.

**Estado:** decidido, **sin implementar**.

---

## D-08 · Radix solo para tres casos

**Decisión:** diálogo, menú y selector con búsqueda. Nada más.

**Por qué:** es literalmente lo que autoriza MMI-DS §9. El patrón `combobox` de
ARIA escrito a mano produce fallos de accesibilidad de forma sistemática. Radix
resuelve el comportamiento y el estilo queda íntegro.

**Lo revertiría:** nada. Y ampliarlo a más componentes incumpliría el §9.

---

## D-09 · Densidad cableada desde el inicio

**Decisión:** `TablaDatos` nace con densidad cómoda (34px) y compacta (28px).

**Por qué:** MMI-DS §8.2 la lista como pendiente, pero añadirla después obliga a
tocar todos los componentes. El coste de dejarla puesta ahora es casi cero.

**Estado:** token definido en el preset. Falta el conmutador y que se recuerde por
sesión.

---

## D-10 · Los activos de marca no van al repositorio

**Decisión:** `.gitignore` excluye `*.png`, `*.jpg`, `*.pdf`, `*.ai`, `*.psd` y
demás formatos de diseño.

**Por qué:** son propiedad del cliente. El repositorio versiona **el sistema**, no
la identidad. Instrucción expresa del usuario.

**Consecuencia:** al clonar, `marca/02_identidad/` está vacía. Ver
[`03-al-clonar.md`](03-al-clonar.md).

---

## D-11 · El sistema es de una sola marca

**Decisión:** el sistema es del Colegio Albert Einstein. No es multi-marca.

**Por qué:** decisión del usuario, tomada explícitamente.

**Nota:** la capa de tokens hace que rebrandear sea cambiar **un archivo**,
`fuente.mjs`. Si algún día se quiere una versión para otro cliente, no se rehace
nada: se cambian los valores y se regenera. No es necesario decidirlo ahora.

---

## D-14 · La app móvil es otra gramática, no la web estrecha

**Decisión:** el catálogo tiene **tres vistas**, no dos: escritorio, web en móvil
y **app móvil**. Se eligen en el menú de usuario.

**Por qué:** una app nativa no es la web a 390px. Cambian las convenciones de
navegación, no solo el ancho:

| Web a 390px | App móvil |
|---|---|
| Hamburguesa y lateral que entra | Pestañas abajo, al alcance del pulgar |
| Migas de navegación | Barra de app con flecha atrás |
| Una página larga que se desplaza | Pestaña → lista → detalle |

**Cómo está implementado:** `data-app` **se suma** a `data-vista='movil'` en vez
de ser un tercer valor. Así hereda el marco de 390px y las ~70 reglas de ancho ya
escritas, y solo se cambia el cromo. Como tercer valor habría que duplicarlas
todas y las copias acabarían divergiendo.

**Las pestañas leen la lateral**, no repiten la jerarquía: añadir una página al
catálogo la añade a la app sin tocar nada.

### Cuatro pestañas, y es una medida, no una opinión

La convención dice cinco como máximo. Aquí manda la medida: a cinco, cada
pestaña ocupa 78px y deja 70px de texto, y las etiquetas reales piden **76px**
(«Fundamentos») y **72px** («Composición»). No caben, y 12px ya es el paso más
pequeño de la escala, así que no hay de dónde recortar. A cuatro quedan 89px.

El sexto grupo y los que sobren entran en **«Más»**, que lista secciones en vez
de páginas.

### Zonas reservadas del dispositivo — obligatorio

Arriba viven la barra de estado y la **muesca de la cámara**; abajo, la **barra
de gestos o los botones del sistema**. Lo que se dibuje ahí queda tapado o es
intocable.

| Zona | Reservado |
|---|---|
| Arriba | **44px** — la barra de app empieza debajo |
| Abajo | **36px** — las pestañas se apoyan encima, nunca debajo |

iOS marca 34pt abajo. Se redondea **hacia arriba** a 36 para seguir en la
rejilla de 4: pasarse deja aire, quedarse corto invade la zona.

**Sin barra de título en la app.** Lo pone el `h1` de la pantalla; ponerlo en los
dos sitios es decir lo mismo dos veces en 64px. Y las **migas se ocultan**: en la
app esa función la hace la flecha de atrás, y dos caminos para lo mismo sobran.

---

## D-15 · La marca en móvil es el escudo, no el lockup

**Decisión:** en la barra superior de móvil va `AE.png` (el escudo), centrado.

**Por qué:** medido sobre los píxeles reales de los dos PNG, no por preferencia.

| | Sobre `#FFFFFF` | Sobre `#242422` (modo oscuro) |
|---|---|---|
| Lockup — texto `#1D1D1B` | 16,88:1 | **1,08:1 · invisible** |
| Escudo — 62% de píxeles blancos | (su rojo, 4,88:1) | **15,55:1** |

El lockup **solo funciona sobre fondo claro**. El escudo tiene cuerpo blanco
propio y funciona en los dos modos, y además ya es el activo de la lateral
plegada: no añade activo ni superficie de fallo nueva.

**Consecuencia abierta:** la banda de marca de la lateral usa `fondo-tarjeta`,
que en oscuro es `#242422`. Ahí el lockup sigue teniendo el mismo problema.
Pendiente de decidir si esa banda se fuerza a blanco en los dos modos.
