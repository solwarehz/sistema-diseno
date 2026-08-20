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

---

## D-16 · La entrega es un ZIP generado, y se distribuye por etiqueta de git

**Decisión:** `node sistema/paquete/empaquetar.mjs` construye
`cascaron/sistema-diseno-v<VERSION>.zip`, y el catálogo lo ofrece desde el menú
de usuario. El empaquetado corre **dentro** del generador del catálogo, después
de escribir `index.html`.

**Por qué corre dentro:** si fueran dos comandos separados, regenerar el
catálogo sin empaquetar dejaría el botón entregando una versión vieja **sin que
se note**. Un fallo silencioso es peor que uno ruidoso.

**Sin dependencias.** El formato ZIP se escribe a mano sobre `zlib` de Node
—`deflateRawSync` y `crc32`, los dos incluidos desde Node 20.15—. No se instala
nada, que es el límite del proyecto.

**Está en `.gitignore`** (`*.zip` ya estaba reservado como «entrega generada»):
es artefacto, no fuente. Se reconstruye con el comando.

### Cómo llegan las mejoras al área de sistemas

La carpeta entregada es **de solo lectura para el proyecto que la consume**.
Nada dentro de `sistema/` se edita allí, así que actualizar es **reemplazar la
carpeta**, nunca resolver conflictos.

| Ruta | Estado | Cómo se actualiza |
|---|---|---|
| **ZIP versionado** | ✅ funciona hoy | Descargar del catálogo y reemplazar `sistema/tokens/` y `sistema/candado/` enteras |
| **Dependencia de git** | ⏳ falta la etiqueta | `npm install github:solwarehz/sistema-diseno#v1.6.0` |

La ruta de git es mejor porque **la versión queda anclada y visible en el
control de versiones**: dos proyectos no se desincronizan sin que se note, y
volver atrás es cambiar un número.

**Después de actualizar, siempre** el verificador de contraste y el lint. Si un
token desapareció o cambió de nombre, el build falla **en compilación, no en
producción** — que es justo lo que se busca.

### Corrección: la ruta de npm se documentó antes de que pudiera funcionar

Se recomendó `npm install github:…#v1.6.0` cuando **no podía funcionar**, por
tres motivos a la vez: no había `package.json` en la raíz —npm no instala un
repositorio sin él—, no había ninguna etiqueta, y el repositorio es privado. Y
un cuarto: las rutas de importación del LEEME eran relativas y no coinciden con
las de `node_modules`.

**Qué se hizo:** se añadió `package.json` con `files` y `exports`, de modo que
el paquete expone solo lo que se consume:

```
sistema-diseno-ae/tokens.css   sistema-diseno-ae/preset
sistema-diseno-ae/fuente       sistema-diseno-ae/lock
sistema-diseno-ae/eslint
```

Verificado con `npm pack --dry-run`: 12 archivos, 35,4 kB, sin `app/`, sin
`memoria/` y sin `cascaron/`. **La instalación no está probada de punta a
punta**: en esta máquina no se instala nada.

**El número de versión ahora vive en dos sitios** —`fuente.mjs` y
`package.json`—, así que `empaquetar.mjs` lo comprueba y sale con código 1 si se
separan. Probado en fallo. Sin ese candado, el área de sistemas instalaría por
etiqueta una versión que dice ser otra, y eso no se descubre hasta que algo se
ve distinto en pantalla.

**Sigue pendiente y necesita autorización:** etiquetar `v1.6.0` y empujar la
etiqueta. Es publicar hacia fuera, no una decisión de dentro de la carpeta.

### El inventario del LEEME se genera, no se escribe

El área de sistemas reportó que el LEEME **no decía todo lo que el sistema
contiene**: al abrir el catálogo aparecían muchas más cosas de las que la
entrega sugería. Tenían razón, y el problema de fondo no era que faltara texto
sino **quién lo escribía**.

Ahora el LEEME lleva una sección «Qué cubre este sistema» construida desde el
**mismo índice que alimenta el menú del catálogo**: 35 páginas, 15 elementos, 12
secciones de manual, y las cifras de tokens y contraste leídas de `fuente.mjs`.
Si el catálogo crece, crece el LEEME. Una lista copiada a mano habría envejecido
en el primer elemento nuevo, y quien recibe la entrega no tiene forma de saber
que está mirando una lista vieja.

**Consecuencia:** `empaquetar.mjs` ya no corre suelto. Exige el inventario y
sale con código 1 si no lo recibe, indicando el comando correcto. Lo lanza el
generador del catálogo, que es quien sabe qué páginas existen. Se quitó el
script `empaquetar` de `package.json` para que no haya dos puertas.

---

## D-17 · El modo oscuro pasa de prohibido a superficie mantenida

**Fecha:** 9 de agosto de 2026 · **Quién:** el usuario, expresamente

MMI-DS §9 lo listaba entre las cuatro cosas prohibidas: «calculado, **no
aprobado**, no implementar». Estaba escrito en **cinco sitios**. Se aprobó.

**Por qué importa cómo se aprobó.** La prohibición no era caprichosa: duplica la
superficie de prueba de contraste. Lo que se compra con la aprobación es
**trabajo continuo**, no una casilla — se pasa de 89 pares a **178**, y los de
oscuro son bloqueantes igual que los de claro.

**Qué lo revertiría:** nada previsible. Pero si alguna vez se propone relajar la
verificación de los pares en oscuro «porque son secundarios», eso es exactamente
la deuda que la prohibición evitaba, y la respuesta es no.

**Consecuencia en el componente.** El selector de tema de `MenuUsuario` sigue
siendo opt-in (`tema` + `onTema`), pero **cambia la razón**, y eso vale más que
el hecho: antes era porque el modo no estaba aprobado; ahora es porque **la
preferencia la guarda el producto**, que es quien tiene sesión. Si el componente
la guardara por su cuenta, un producto que ya la tiene en el perfil tendría dos
fuentes de verdad y la pantalla parpadearía al cargar. La prueba «sin tema no se
pinta el selector» **no se borró**: ahora fija otra cosa.

---

## D-18 · En oscuro el marco va en la escala de negros, no en el azul

**Fecha:** 9 de agosto de 2026 · **Quién:** el usuario · **Versión:** v1.18.0

Hasta aquí el marco se conservaba idéntico al claro «porque se distingue por
matiz». **Era verdad y aun así estaba mal**: un azul saturado sobre una página
casi negra no lee como modo oscuro.

**Y la separación tampoco la daba el matiz.** Medido antes de tocar nada: el
marco quedaba a **1,49:1** de la tarjeta. Se probaron los **diez** escalones de
indigo y los **catorce** de negro, y ninguno separa — la página en oscuro es
`#1E1D1C`, y cualquier marco lo bastante oscuro para leer como modo oscuro queda
a menos de 1,6:1 de ella. **Quien separa es la elevación** que entró en la
v1.16.0, no el color. Aceptado eso, el color queda libre para ser neutro.

Seis tokens cambian **solo en oscuro**; el claro no se toca. El
`marco-texto-tenue` fue el que bloqueaba el cambio: sobre los neutros más claros
caía a **3,39:1**, y tuvo que subir a `negro_100`.

**El acento dorado se queda.** Es lo único que sigue diciendo de quién es el
producto cuando el azul se va; sin él, el marco es un gris cualquiera. Da entre
7,6 y 9:1 sobre los cuatro neutros.

**Qué lo revertiría:** que el colegio decida que su azul debe estar presente en
oscuro. Entonces habría que resolver antes cómo separa el marco de la página,
porque el color no lo hace.

---

## D-19 · El catálogo y el paquete son dos hojas, y solo una importa al verificar

**Fecha:** 9 de agosto de 2026 · **Origen:** defecto R25, reportado por Control
Administrativos V2.0 · **Versión:** v1.19.0

`extraer.mjs` construye la hoja que viaja repartiendo cada regla entre elementos
**por su primera clase**. Una regla cuyo selector empieza por un prefijo
declarado como estructura del catálogo **no viaja**, aunque un componente
publicado emita esa clase.

**Cómo se descubrió.** El botón de plegar enseñaba sus dos iconos a la vez en
escritorio. Las reglas base empezaban por `.ic-` —prefijo catalogado como
estructura— y no viajaban; la consulta de móvil sí, porque empieza por
`.top-plegar`. En el paquete los dos iconos **solo tenían reglas por debajo de
700px**, y por encima ninguna: ambos caían a `display` por omisión. **En el
catálogo se veía perfecto. Vivió tres versiones.**

**Regla que queda:** al verificar CSS se mide `sistema/componentes/componentes.css`,
**nunca el catálogo**. Y una clase que un componente publicado emite tiene que
tener regla en la hoja que viaja — lo comprueba `verificar-cascada`.

**Qué lo revertiría:** que el extractor deje de repartir por prefijo. Sería un
cambio grande y hay que hacerlo con el candado puesto, no antes.

---

## D-20 · Un candado para lo que no está escrito

**Fecha:** 9 de agosto de 2026 · **Lo pidió:** Control Administrativos V2.0

Los siete candados anteriores leen **lo que hay**: hexadecimales sueltos, clases
huérfanas, pares de contraste, reglas obligatorias sin prueba. Ninguno sabía
responder «¿y qué le pasa a este elemento a 1440 píxeles?», que es una pregunta
sobre **lo que no hay**.

`verificar-cascada.mjs` parsea la hoja que viaja, casa sus selectores contra un
árbol de elementos declarado, evalúa las consultas de medios a **once anchos**,
ordena por especificidad y orden, y dice qué declaración gana **o si no gana
ninguna**. Sin dependencias: no se instala nada en la máquina.

**Se vio en rojo antes de darlo por bueno:** apuntado a la v1.17.0 saca R25 a
los siete anchos de escritorio, y verde por debajo de 700 — exactamente lo que
Control Administrativos midió en el navegador. Admite una hoja por argumento
para eso.

**Declara lo que NO hace, y es parte de la decisión:** no calcula diseño. El
defecto R26 —el lateral que no encoge— **no lo habría cazado**. Un candado que
promete más de lo que mide es peor que no tenerlo.

---

## D-21 · Un solo registro de desplegables, y el catálogo no se lo escribe aparte

**Fecha:** 9 de agosto de 2026 · **Origen:** el usuario, sobre el catálogo

Con el menú de usuario abierto, pulsar la campana dejaba **los dos** encima del
contenido. En **React ya estaba resuelto** desde la v1.15.0: hay un registro a
nivel de módulo en `interno/desplegable` que comparten `MenuUsuario` y
`PanelBarra`, y sus pruebas pasan. **El fallo era solo del catálogo**, que tenía
dos cierres escritos a mano que no se conocían — uno cerraba menús, otro
cerraba paneles.

**Lo que esto enseña, y ya van varias:** lo generado acierta y lo escrito a mano
se separa. Cada vez que el catálogo reimplementa lo que un componente resuelve,
la copia diverge. Ya pasó con la paginación.

**Regla que queda:** cuando un comportamiento exista en un componente, el
catálogo lo usa o lo reproduce con **un solo** mecanismo compartido, nunca con
una copia por familia de elementos.

---

## D-22 · En pantalla muy ancha: chasis en los bordes, documento centrado

**Decisión (aprobada por el responsable, 2026-08-10, v1.32.0):** en monitores
anchos la columna de contenido **se centra** en el espacio libre conservando su
medida (1056px interiores), la barra superior alinea sus mandos con esa columna
(su relleno lateral crece con `max()`), y el **lateral se queda pegado al borde
físico**: es chasis, como la barra de tareas — no persigue a la columna.

**Por qué:** medido con captura a 1900px — el contenido quedaba arrinconado
contra el lateral con un desierto a la derecha, y el menú de usuario exiliado
en la esquina, a media pantalla de lo que se leía. Con el centrado, los dos
aires laterales son simétricos y el correo/campana/avatar caen sobre el borde
derecho del contenido, donde el ojo ya está.

**Factura:** se centra con **relleno**, no con margen — `cat-cuerpo` pinta su
propio fondo y un margen dejaría bandas de otro color a los costados. Hasta
~1150px el `max()` cae a los rellenos de siempre y no cambia nada.

**La alternativa descartada:** centrar el bloque entero (lateral incluido).
Convierte la aplicación en página flotante: el menú pierde su anclaje y el
botón de plegar cambia de sitio físico según el monitor — malo para la memoria
muscular.

**Lo revertiría:** que el responsable prefiera el bloque completo centrado
tras usarlo — es un cambio pequeño y localizado en las tres mismas reglas.

---

## D-23 · Publicar no es subir a `main`, y deja de depender de acordarse

**Decisión.** Una versión se publica con `npm run publicar -- --publicar`, que
pone la etiqueta, crea la publicación con el ZIP adjunto y **poda los ZIP de las
versiones anteriores**. Solo la última conserva el suyo.

**Por qué.** El área de sistemas instala de dos formas y las dos tienen que
funcionar siempre: por etiqueta con npm, y bajando el ZIP. Eran tres pasos
sueltos y fallaron: las etiquetas se cortaron en **v1.38.0** con el sistema en
v1.48.0 —doce versiones sin etiquetar— y `ACTUALIZAR.md` mandaba instalar
`#v1.48.0`, que **no existía**. Nadie podía actualizar y nada lo comprobaba.

Es el mismo defecto que la lista de componentes del empaquetador y la lista de
candados del `CLAUDE.md`: **un paso que depende de acordarse**.

**Lo que la poda NO toca.** Etiquetas y publicaciones se quedan. Borrarlas
rompería el `npm install` de una versión vieja, que es lo contrario de lo que se
quiere garantizar. Un ZIP borrado se reconstruye desde su etiqueta.

**Y la etiqueta no se mueve.** Si ya existe apuntando a otro commit, se sube de
versión. Pasó con la v1.51.0 —el manual salió sin la sección de descarga— y se
corrigió sacando la v1.51.1, no moviendo la etiqueta: una etiqueta movida
entrega cosas distintas según cuándo se baje. Es el defecto abierto de `v1.10.5`.

---

## D-24 · Los peores defectos son los que el catálogo no puede enseñar

**Lo observado.** Entre el 12 y el 16 de agosto, cinco defectos graves pasaron
por todos los candados en verde:

- El **aviso nacía invisible** y no se veía en ningún producto (R50).
- El **botón deshabilitado** se pintaba igual que uno activo (R41).
- El **interruptor deshabilitado**, lo mismo, y sus reglas existían pero pedían
  un atributo que el componente no emite.
- La **tarjeta pulsable** salía con la fuente del navegador (R56).
- El **título de la tarjeta** salía sin estilo (R58 interno).

**Qué tienen en común.** Ninguno se puede ver en el catálogo. Allí el aviso lo
hace visible el guion de la página, nadie deshabilita un botón de muestra, y la
hoja se escribió mirando un marcado que el componente no emite.

**Consecuencia para el diseño de candados.** El candado de la promesa compara la
cascada **sobre el mismo marcado**: si el estado no existe en ninguno de los dos
lados, no hay nada que comparar, y sale verde. `verificar-elemento` cerró la
parte que se puede leer del texto —qué elemento emite cada uno—, y encontró
cinco divergencias más el día que se escribió.

**Lo que queda.** Comparar **comportamiento y estados**, no marcado. Pide montar
los componentes en un navegador de verdad dentro del contenedor, y eso es
autorización del responsable. Está declarado en `04-pendientes.md`.

**La lección más incómoda:** que un candado esté en verde no significa que el
componente funcione. Significa que **lo que el candado mira** está bien.

---

## D-25 · La celda de datos no parte el texto — y la tabla simple sí

**Decisión:** `white-space: nowrap` en `.tb td` y `.tb-sub td`; `normal` en el
estado vacío y en el panel de detalle; **nada** en `.tabla-simple td`.

**Por qué:** lo pidió Control Administrativos V2.0 (R86) con el argumento
correcto: como `.tb-envoltura` ya desplaza en horizontal desde R49, partir el
texto **no gana espacio** — solo rompe la altura de fila que el propio
componente fija. Medido antes de tocar nada, en un navegador y con la hoja que
viaja: tres filas de la misma tabla en 54,7 · 34,0 · 72,3 px con 34 declarados,
y 36,7 con 28 en compacta. Y el ejemplo compacto daba `scrollWidth` 419 sobre
`clientWidth` 419: el desbordamiento **no se estaba desplazando**, se estaba
absorbiendo hacia abajo.

**Por qué la tabla simple no**, aunque el pedido lo planteaba: el argumento no
se traslada. `.tabla-simple` **no declara altura de fila**, así que no hay
medida que romper, y sus celdas son prosa **por diseño** — `vertical-align:
top`, `line-height: 1.45`, y la columna `.motivo` del catálogo lleva frases
enteras. Ponerle `nowrap` convertiría cada tabla de documentación en un
deslizador. Su única celda que no parte sigue siendo `.num`, que es la que sí es
un dato de una línea.

**Lo que se aprendió, y vale más que la regla:** una excepción hay que
**ganarla**, no solo declararla. `white-space: normal` escrito dentro de la
regla `.tb-vacio` (una clase, 100) perdía contra `.tb td` (clase + tipo, 101), y
el vacío salía en una línea. Se declara como `.tb td.tb-vacio`. **Lo sacó el
candado de la cascada en rojo**, a los once anchos, antes de que se viera en
ninguna pantalla — la primera vez que caza una excepción que existe pero no
gana.

**Lo revertiría:** que aparezca una columna cuyo valor **solo se entiende
partido** en varias líneas. Está previsto y escrito como regla 29 del contrato:
no se improvisa con CSS del producto, se declara la salida aquí. Y si alguien le
pone `nowrap` a `.tabla-simple` «por simetría», la prueba de `tabla-nowrap`
sale en rojo.
