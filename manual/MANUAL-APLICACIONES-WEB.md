# Manual de marca — Aplicaciones web

**Colegio Albert Einstein, Huaraz**
Documento MMI-MAN-01 · Versión 1.3.0 · 13 de agosto de 2026
Sistema de referencia: MMI-DS v1.51.1 · Color modo claro **bloqueado**

> Para actualizar un proyecto que ya usa el sistema, empieza por
> [`ACTUALIZAR.md`](ACTUALIZAR.md): dice qué cambió, qué se rompe y cómo instalarlo.

---

## Cómo se usa este manual

`SISTEMA-DE-DISENO.md` explica **por qué** el sistema es como es. Este manual
explica **qué hacer**. Si solo vas a leer uno, lee este.

Está escrito para quien construye una pantalla y tiene que decidir: qué color,
qué tamaño, qué componente, qué texto. Cada sección responde a una decisión
concreta.

**Si una regla de aquí contradice al documento de sistema, gana el documento y
este manual se corrige.** Nunca se deja la contradicción viva.

---

## 1 · Las seis reglas que resuelven el 90 % de las dudas

**1. Nunca escribas un color a mano.** Ni hex, ni `rgb()`, ni `bg-[#004aad]`. Si
el token que necesitas no existe, se añade en `sistema/tokens/fuente.mjs` y se
regenera. El build falla si lo intentas: eso es intencional.

**2. Un solo azul en superficie grande: el marco.** El azul es estructura, no
decoración. Una pantalla con dos zonas azules grandes ya está mal.

**3. Una sola acción principal por pantalla.** Si hay dos botones rellenos
compitiendo, uno de los dos no era principal.

**4. El rojo en interfaz significa algo.** Nunca es decorativo. Cuando aparece,
hay un problema, una deuda o una pérdida. El rojo del escudo se queda en el logo
y en la landing.

**5. Todo elemento interactivo tiene foco visible.** `outline: none` está
prohibido sin reemplazo de contraste equivalente. Quien navega con teclado no es
un caso raro: es quien va rápido.

**6. La etiqueta del campo siempre visible.** El placeholder es un ejemplo de
formato, nunca la etiqueta. Si el placeholder desaparece al escribir y con él la
única pista de qué va ahí, el formulario está roto.

---

## 2 · Color — cómo elegir el token

### 2.1 El árbol de decisión

**¿Es una superficie?**

| Estás pintando | Token |
|---|---|
| El fondo detrás de todo | `fondo-pagina` |
| Una tarjeta, panel, modal o el cuerpo de una tabla | `fondo-tarjeta` |
| El encabezado de una tabla | `fondo-encabezado` |
| La fila bajo el cursor, o la fila seleccionada | `fondo-fila-hover` |

**¿Es texto?**

| El texto es | Token |
|---|---|
| Contenido, título, celda de tabla | `texto-principal` |
| Dato de apoyo, columna no primaria, metadato | `texto-secundario` |
| Placeholder o ayuda bajo un campo | `texto-pista` |
| Va encima de un botón o del marco | `texto-invertido` |

**¿Es una acción?**

| La acción es | Token | Forma |
|---|---|---|
| La principal de la pantalla | `accion` + `accion-texto` | Relleno |
| Secundaria | `accion-2` | Borde y texto, **sin relleno** |
| Una acción dentro de una fila | `enlace` | **Texto**, no botón |
| No disponible ahora | `accion-deshabilitada` | Relleno apagado |

### 2.2 Por qué «Editar» es texto y no botón

Con cinco filas visibles, cinco botones sólidos generan ruido en lugar de
jerarquía. La vista pasa a ser una rejilla de botones y ya no se lee la tabla.
Las acciones de fila van como `enlace`.

### 2.3 Los estados van siempre en pares

Nunca un color de estado suelto. Fondo y texto salen juntos o no salen:

| Estado | Fondo | Texto | Para qué |
|---|---|---|---|
| Éxito | `exito-fondo` | `exito-texto` | Chip «Activo», confirmación |
| Aviso | `aviso-fondo` | `aviso-texto` | Chip «Parcial», advertencia recuperable |
| Error | `error-fondo` | `error-texto` | Chip «Deuda», validación fallida |
| Información | `info-fondo` | `info-texto` | Aviso neutro, ayuda contextual |

El token `-acento` de cada estado va **solo en el filete del borde**. Es adorno.
No lo uses para texto: por eso conserva el tono saturado.

### 2.4 Los colores de marca — definidos y aun así prohibidos

Son la familia `marca`: **conocida por el sistema y no autorizada en él.** Están
nombradas para poder bloquearlas —lo que no tiene nombre no se puede vigilar— y
un valor de marca fuera de su propia variable **falla el build**.

| Token | Escalón | Sí | **No** |
|---|---|---|---|
| `marca-rojo` | `marca_rojo` | Escudo, titular de landing, impresos | **Interfaz** |
| `marca-oro` | `marca_oro` | Escudo, filete de landing | **Interfaz.** En sistema usa `accion-2` o `marco-acento` |
| `marca-amarillo` | `marca_amarillo` | Campaña, afiches, redes | **Todo el sistema.** 1,2:1 — no admite texto encima |
| `marca-celeste` | `marca_celeste` | Campaña | **Todo el sistema.** 2,6:1 — no admite texto encima |

El celeste es el que más se cuela, porque venía de campaña y se usó en botones.
Un botón celeste con texto blanco es ilegible: 2,6:1 contra el 4,5:1 que exige la
norma. Si ves uno, es un defecto, no una decisión.

La familia tiene además `marca_azul` —el azul institucional del que deriva la
rampa `azul`— y los dos del **lockup**, `marca_rojo_lockup` y
`marca_negro_lockup`. Esos dos documentan un defecto de identidad abierto: el
escudo usa un rojo y el lockup usa **otro**. El sistema adopta el del escudo.

---

## 3 · Tipografía — cómo elegir el tamaño

**IBM Plex Sans** para todo. **IBM Plex Mono** solo para identificadores.

### 3.1 En una pantalla de sistema

| Estás escribiendo | Clase | Tamaño |
|---|---|---|
| El título de la pantalla | `text-s-titulo-pantalla` | 28px SemiBold |
| El título de una sección | `text-s-titulo-seccion` | 20px Medium |
| Texto corrido | `text-s-cuerpo` | 16px Regular |
| Celda de tabla, control | `text-s-interfaz` | 15px Regular |
| Encabezado de columna | `text-s-encabezado` | 15px Medium |
| Etiqueta de campo | `text-s-etiqueta` | 13px Medium |
| Pista, chip | `text-s-pista` | 12px Regular |

**Nada por encima de 28px en el sistema.** La densidad manda: quien lleva seis
horas en la pantalla no necesita titulares, necesita ver más filas.

### 3.2 En la landing

| Estás escribiendo | Clase | Tamaño |
|---|---|---|
| Titular principal | `text-l-hero` | 56px Bold |
| Titular de sección | `text-l-seccion` | 34px SemiBold |
| Subtítulo | `text-l-subtitulo` | 24px Medium |
| Destacado | `text-l-destacado` | 19px Regular |
| Cuerpo | `text-l-cuerpo` | 16px Regular |
| Pie y legal | `text-l-pie` | 13px Regular |

### 3.3 Cuándo va monoespaciado

DNI, RUC, códigos, números de expediente, cualquier identificador. **Nunca** para
texto normal.

Comparar dos DNI de ocho dígitos es mucho más rápido en monoespaciado, y separa
visualmente «esto es un dato» de «esto es texto».

Las columnas de números no necesitan nada especial: Plex trae cifras tabulares
nativas y se alinean solas.

### 3.4 Reglas de tipografía

- **Cuatro pesos y ninguno más:** Regular 400, Medium 500, SemiBold 600, Bold 700.
  Thin, ExtraLight, Light, ExtraBold y Black están prohibidos.
- **Bold 700 solo en titulares de landing.** En el sistema no aparece.
- Prohibido `text-[Npx]`. Solo los pasos de la escala.
- Interlineado nunca por debajo de **1.4** en texto corrido.
- Ancho de línea: máximo **72 caracteres** en landing, **90** en descripciones de
  sistema.
- Cursiva solo en citas de landing. **Nunca en interfaz.**
- Mayúsculas sostenidas solo en el lockup del logo. **Nunca en etiquetas ni
  botones.**

### 3.5 En móvil, bajo 640px

El cuerpo y el texto de interfaz suben a **18px**. No es un capricho: es el
mínimo por debajo del cual la gente empieza a acercarse el teléfono a la cara.

El titular de landing baja de 56px a 32px. El título de pantalla, de 28px a 22px.

---

## 4 · Foco y accesibilidad

**Piso obligatorio: WCAG 2.2 nivel AA.** No es un objetivo, es el mínimo.

### 4.1 El anillo de foco

2px de grosor, 2px de separación. Dos tokens según dónde estés:

| Estás dentro de | Token |
|---|---|
| Contenido: tarjeta, tabla, formulario | `foco` |
| El marco de navegación | `foco-en-marco` |

**Son dos y no uno por una razón medida:** el ámbar oscuro no llega a 3:1 sobre el
marco azul, y el ámbar claro no llega sobre blanco. No hay ningún azul ni ningún
rojo que funcione en los dos contextos.

### 4.2 Lo que está prohibido

- `outline: none` o `outline-none` sin reemplazo de contraste equivalente.
- Sustituir el foco por un cambio de color de borde. Sobre el marco azul es
  invisible, y es exactamente el defecto que se detectó en los filtros.
- Indicar un estado **solo** con color. Siempre acompáñalo de texto o icono: hay
  quien no distingue el rojo del verde.

### 4.3 Comprobaciones antes de cerrar una pantalla

- Recórrela entera **solo con Tab**. Si en algún punto no sabes dónde estás, la
  pantalla no está terminada.
- A 375px de ancho, nada desborda horizontalmente.
- Ningún texto por debajo de 4,5:1. El candado lo verifica por ti:
  `node sistema/candado/verificar-contraste.mjs`

---

## 5 · Composición

### 5.1 Landing y sistema comparten valores, no proporciones

| | Landing | Sistema |
|---|---|---|
| Superficie dominante | `marca-rojo` y blanco | `fondo-pagina` y `fondo-tarjeta` |
| Rojo en áreas grandes | Sí — el panel de marca | **Nunca** |
| Azul en áreas grandes | No | Solo el marco |
| Escala | Hasta 56px | Máximo 28px |
| Densidad | Amplia | Según token |

El trabajo es opuesto: la landing tiene que **detener** a alguien que no conoce el
colegio. El sistema tiene que **desaparecer** para alguien que lleva seis horas
mirándolo.

Nadie los ve lado a lado, pero cualquiera reconoce la misma institución.

### 5.2 El marco de aplicación

54px de alto, fondo `marco-fondo`. Escudo a 32px. «COLEGIO» en `marco-acento`,
el nombre en `marco-texto`. El ítem activo va en `marco-acento` con filete
inferior de 5px. El avatar es un círculo `marco-acento` con las iniciales en
`marco-fondo`.

**El marco es el único azul grande de la pantalla.** No añadas otro.

### 5.3 La tabla de datos

Es el 80 % de la superficie del sistema. Vale la pena hacerla bien.

- Encabezado en `fondo-encabezado`, etiquetas en `text-s-encabezado`.
- Filas de **34px** en densidad cómoda, **28px** en compacta.
- Divisores en `borde`. Fila bajo el cursor en `fondo-fila-hover`.
- Acciones de fila como `enlace`, nunca como botón.
- Chips de estado con radio 3px y el par fondo/texto del estado.
- Paginación: el conteo a la izquierda en `texto-secundario`; la página actual con
  fondo `accion` y texto `accion-texto`.

### 5.4 En móvil, la tabla se convierte en tarjetas

No se hace scroll horizontal. Cada tarjeta lleva: nombre, una línea de metadatos
(DNI y grado), chip de estado, monto, divisor y «Ver detalle» como enlace.

Esa anatomía **ya está construida**: es `TarjetaPersona`. No se maqueta a mano.

### 5.5 Tarjetas: cuál de las tres, y la cuadrícula

| Cuándo | Componente |
|---|---|
| Una persona: avatar, cargo, estado con chip | `TarjetaPersona` |
| **Una tarjeta que lleva a una pantalla**, con imagen arriba | `TarjetaAccion` |
| Cualquier otra cosa: contenido suelto, cabecera, acciones al pie | `Tarjeta` |

Para disponerlas, la clase **`tn-cuadricula`**. Se reparte sola —columnas de
230px mínimo, 12px de separación— y ya trae el `min-width: 0` que evita que un
título largo estire su columna. No se rehace con `grid-template-columns` en el
producto: eso es exactamente lo que esta clase existe para no repetir.

```html
<div class="tn-cuadricula"> … tarjetas … </div>
```

**La regla que no es evidente, y por la que `TarjetaAccion` existe.** Cuando una
tarjeta lleva a un sitio, la imagen, el título y el botón tienen que llevar **al
mismo sitio** — y aun así ser **una sola parada de tabulador**. Tres `<button>`
con el mismo `onClick` parece lo natural y es lo peor: con teclado hay que pasar
por los tres para salir de la tarjeta, y un lector de pantalla la lee tres veces
diciendo lo mismo. En una cuadrícula de veinte tarjetas, sesenta paradas para
veinte destinos.

`TarjetaAccion` ya lo resuelve: un solo control real, cuya zona pulsable cubre
toda la tarjeta. **No lo replique** montando la composición a mano.

```tsx
<TarjetaAccion
  titulo="Ficha del trabajador"
  nivelTitulo={2}          // la jerarquía de SU página; el sistema no la conoce
  texto="Datos personales y contrato"
  foto={urlWebp}
  onAccion={() => navegar('/trabajador/71234567')}
  textoBoton="Abrir"
  editable={puedeEditar}   // por omisión NO se edita
  onEditarFoto={abrirCargador}
/>
```

Dos detalles que evitan un rediseño a mitad de camino:

- **La proporción del medio es 16:9 y la fija el sistema.** La imagen se recorta
  con `CargaImagen formato="medio-tarjeta"`, que produce justo ese encuadre. Las
  dos piezas encajan: no hay que reencuadrar nada en el medio.
- **Bloquear la edición no apaga la navegación.** En solo lectura se sigue
  entrando en la tarjeta; lo único que desaparece es poder cambiar la foto.

El marco se parte en dos filas: identidad arriba, navegación abajo. La acción
principal pasa a **botón flotante de 56px** en la esquina inferior derecha, al
alcance del pulgar.

---

## 5bis · Movimiento — el tiempo también es del sistema

Desde la v1.22.0 (pedido R27 de Control Administrativos). Antes cada producto
inventaba duraciones y reimplementaba `prefers-reduced-motion` regla a regla —
la misma deriva que los hex a mano.

| Token | Valor | Para qué |
|---|---|---|
| `--dur-rapida` | 140ms | Microinteracción: hover, opacidad, aparecer una capa |
| `--dur-media` | 180ms | Lo normal: transform, plegados pequeños, diálogos |
| `--dur-lenta` | 220ms | Paneles, lateral, acordeones |
| `--curva` | `ease` | La curva estándar de toda transición |
| `--permanencia-aviso` | 5s | Cuánto queda en pantalla un aviso temporal |

```css
/* SÍ */  transition: transform var(--dur-media) var(--curva);
/* NO */  transition: transform .2s cubic-bezier(0.16, 0.84, 0.44, 1);
```

Tres reglas:

1. **Ninguna duración se escribe a mano.** El auditor del cascarón lo bloquea
   igual que un hex crudo. `0s` se admite: no es tiempo, es el truco de la
   visibilidad diferida.
2. **`prefers-reduced-motion` ya está resuelto.** Los tokens caen a `0.01ms`
   solos — no a 0: un `transitionend` que nunca llega cuelga a quien lo espera.
   No lo reimplementes por regla.
3. **La permanencia del aviso no es movimiento** y no se reduce: leer no es
   moverse, y quien pide menos movimiento no pide menos tiempo de lectura.

Los tokens viajan en `componentes.css` junto a las sombras — no hace falta
importar nada más.

---

## 6 · Formularios

### 6.1 El formulario trabaja, no enseña

La explicación va al manual, no al campo. Si un campo necesita un párrafo para
entenderse, el problema es el campo.

- **Etiqueta siempre visible.** Encima del campo, en `text-s-etiqueta`.
- **Placeholder solo como ejemplo de formato**: `71234567`, no `Ingrese su DNI`.
- La ayuda va **debajo** del campo, en `texto-pista`, y es una línea.

### 6.2 Ante la duda, avisar sí; bloquear no

Una validación de forma solo debe existir cuando el sistema sabe **con certeza**
que el dato está mal.

Quien tiene prisa y se encuentra un campo que no le deja avanzar **inventa un dato
que sí pase**. Eso es peor que el dato raro: el dato raro se ve; el inventado, no.

### 6.3 Limpiar no es rechazar

Quitar espacios sobrantes al guardar es invisible y ayuda. Exigir un formato exacto
impide trabajar. Limpia en silencio; rechaza solo lo imposible.

El `Campo` **recorta al salir**, no mientras se teclea: el espacio del copy-paste
se va y la persona nunca ve desaparecer lo que escribe. `CampoContrasena` **jamás
normaliza**: ahí un espacio puede ser deliberado.

### 6.4 El error se ve, no solo se colorea

El renglón de error del sistema **lleva icono**. No es adorno: un renglón rojo
suelto se confunde con una ayuda, y el color por sí solo no dice que algo falla
—SC 1.4.1—. Viene puesto; no hay que añadirlo.

### 6.5 Solo lectura no es deshabilitado

Son dos cosas distintas y se eligen por lo que significan:

| | Qué dice | Qué pasa |
|---|---|---|
| **Deshabilitado** | «Esto no es para ti» | Sale del recorrido del tabulador y **el navegador no lo envía con el formulario** |
| **Solo lectura** | «Esto es un dato, ahora no se toca» | Se ve, se lee, se enfoca y **viaja con el formulario** |

El caso que lo trajo: **el selector de tipo de documento mientras se consulta a
la API**. Cambiarlo a mitad tira el resultado que se está esperando, pero
deshabilitarlo perdería el dato al enviar. Va en solo lectura:

```tsx
<Selector etiqueta="Tipo de documento" opciones={TIPOS}
          soloLectura={consultando} value={tipo} onChange={setTipo} />
```

**HTML no tiene `readonly` para `<select>`** —solo para `input` y `textarea`—,
así que lo construye el componente: `aria-readonly` para el lector y bloqueo de
lo que abre o cambia la lista. Tab y Escape siguen pasando: salir nunca se
bloquea. No hay que reconstruirlo con `disabled` y un `input` escondido.

### 6.6 Subir un archivo: tres piezas, y ninguna se rehace

| Qué se sube | Componente | Lo que resuelve |
|---|---|---|
| Foto o logo | `CargaImagen` | Encuadre —mover, acercar, flechas—, recorte en **WebP** y la proporción del hueco real: foto 1:1 en círculo, logo extendido 212×44, logo comprimido 1:1, **medio de tarjeta 16:9** |
| Un PDF | `CargaPdf` | Comprueba que lo es **mirando sus bytes** —la extensión miente— y lo **comprime** antes de entregarlo, sin dependencias |
| Documento de identidad | `CargaId` | Las **dos caras** con la proporción **ID-1** (85,60 × 53,98 mm), anverso y reverso en el mismo diálogo, miniaturas al costado |

Tres reglas comunes que ya vienen dentro:

- **La subida es del producto.** El componente entrega el archivo y una URL
  local para pintarlo al instante; a qué ruta va y con qué reintentos, no.
- **Borrador hasta el final.** Lo elegido no se entrega hasta confirmar:
  cancelar a mitad deja el formulario como estaba. En `CargaId`, un anverso
  suelto sería un documento a medias que nadie pidió.
- **Volver a subir puede exigir permiso.** En `CargaId`, entregadas las dos
  caras el botón se desactiva y solo vuelve cuando el producto baja `bloqueado`
  porque **su back** lo autorizó. Un documento de identidad ya entregado no se
  reemplaza porque a alguien se le ocurra.

### 6.7 Donde se pinta una persona: foto si la hay, avatar si no

Y con **una sola prop**. `persona` lleva su identidad **y su retrato**:

```tsx
<CargaImagen etiqueta="Foto del trabajador"
             persona={{ id: t.id, nombre: t.nombre, foto: t.foto }} … />
```

Con foto se ve la foto; sin foto, el `Avatar` del sistema con sus iniciales y su
color. **No es un círculo parecido**: es el mismo avatar que pintan la ficha y la
tabla, con el color derivado del **identificador estable** —el de la base, nunca
el nombre—, así que la misma persona se ve igual en todas las pantallas.

Sin `persona` no se inventa identidad: el hueco dice «Sin foto» y ya.

---

## 6bis · La frontera de escritura — regla de composición, no del paquete

Cómo entra cada dato a la base **es del producto**, no del sistema de diseño:
el paquete pinta y se comporta en pantalla; lo que se persiste y cómo, lo
decide quien tiene la base. La utilidad `alGuardar` **vivió una versión**
(v1.35.0) y se retiró en la v1.36.0 por esa razón — el propio análisis que la
acompañaba lo decía.

Lo que sí queda, como guía para quien escriba su frontera:

1. **Se normaliza al GRABAR, no al teclear** — la pantalla enseña lo que la
   persona escribe.
2. **`trim` + colapso de espacios** para todo; minúsculas donde la minúscula
   es canónica (correo, usuario, código); **los nombres conservan su caja**
   (la búsqueda insensible ya la da la consulta con `unaccent`/`pg_trgm`, §10);
   la **contraseña jamás se normaliza**.

---

## 7 · Voz de interfaz

Donde la marca deja de ser color y se vuelve tono.

### 7.1 Cómo se escribe

**La gente no lee.** Una frase. Si hacen falta dos, sobra una.

Un aviso que no se lee no avisa. Un diálogo que no se lee no protege. **Alargar el
texto reduce la protección, no la aumenta.**

- Directo y en presente. «Se guardó», no «Se ha procedido a guardar».
- Sin signos de admiración. Sin «¡Ups!». Sin disculpas.
- De usted, sin ser rígido. Es una institución educativa.
- Sin jerga técnica. «No se pudo conectar», no «Error 500».

### 7.2 Ningún mensaje de error sin decir qué hacer

Es la regla mínima y la más incumplida.

| ✗ | ✓ |
|---|---|
| «Error al guardar» | «No se guardó: falta el DNI» |
| «Datos inválidos» | «El DNI debe tener 8 dígitos» |
| «Sin permiso» | «Solo Dirección puede editar notas. Pídelo a Dirección» |
| «Error 500» | «No se pudo conectar. Reintenta en un minuto» |

### 7.3 El estado vacío es el más descuidado y el que más comunica

«Sin resultados» es un callejón. «Sin resultados para *perez*. Prueba con menos
filtros» es una salida.

Distingue tres estados y no los mezcles:

| Estado | Qué pasó | Qué se dice |
|---|---|---|
| Cargando | Se está consultando | Esqueleto, no texto |
| Nunca consultado | Aún no se ha buscado | «Elige un periodo para ver los datos» |
| Sin resultados | Se buscó y no hay | «Sin resultados para *X*. Prueba con menos filtros» |

Confundir «nunca consultado» con «sin resultados» hace que la persona crea que no
hay datos cuando en realidad todavía no ha buscado.

### 7.4 Confirmaciones

Solo cuando la acción es **irreversible**. Confirmar lo reversible entrena a la
gente a aceptar sin leer, y entonces la confirmación que sí importaba tampoco se
lee.

Di qué se va a perder y cuánto: «Se eliminarán 24 registros de asistencia. No se
puede deshacer.»

El botón dice el verbo, no «Aceptar»: **Eliminar** / **Cancelar**.

---

## 8 · Errores frecuentes

| Lo que se ve | Por qué está mal | Qué hacer |
|---|---|---|
| Botón celeste `#01ADED` con texto blanco | 2,6:1. Ilegible | `accion` |
| Dos botones rellenos en una pantalla | Ninguno destaca | Uno relleno, el otro `accion-2` |
| Emoji como icono | No hereda color, no se alinea, cambia según el sistema | Iconos de trazo (Lucide, 1.5px) |
| `outline-none` en un filtro | Con teclado te pierdes | `outline-foco` |
| Placeholder como etiqueta | Al escribir desaparece la pista | Etiqueta visible encima |
| Rojo para decorar | El rojo significa problema | `texto-principal` o `accion` |
| «Editar» como botón en cada fila | Ruido, no jerarquía | `enlace` |
| Segunda zona azul grande | Compite con el marco | `fondo-tarjeta` |
| `text-[14px]` | Evade la escala | `text-s-interfaz` (15px) |
| Mayúsculas en un botón | Se lee más lento | Capitalización normal |

---

## 9 · Antes de dar una pantalla por terminada

| # | Comprobación | Cómo se comprueba |
|---|---|---|
| 1 | Ningún color escrito a mano | `npx eslint` pasa sin errores |
| 2 | Los contrastes cumplen | `node sistema/candado/verificar-contraste.mjs` en verde |
| 3 | Una sola acción principal | A ojo: un solo botón relleno |
| 4 | Un solo azul grande | A ojo: solo el marco |
| 5 | Foco siempre visible | Recorrer la pantalla entera con Tab |
| 6 | Nada desborda en móvil | Navegador a 375px de ancho |
| 7 | Etiquetas visibles en todos los campos | A ojo |
| 8 | Los tres estados resueltos | Probar sin buscar, buscar sin resultados, y con datos |
| 9 | Ningún error sin decir qué hacer | Leer todos los mensajes |
| 10 | Ningún texto bajo 4,5:1 | Lo cubre la comprobación 2 |

---

## 9bis · Dos reglas de composición que llegaron de un proyecto

Las propuso Control Administrativos V2.0 desde su producto. No son de estilo, y
por eso están aquí y no en un componente: no se pueden imponer con código.

### El diálogo de confirmación no nombra a la persona

«¿Seguro que quieres cambiar la foto?», **no** «Se reemplazará la foto de
Zapata, Rosa María».

Es protección de datos, no economía de palabras: el diálogo puede quedar en
pantalla a la vista de quien pase por detrás, y el nombre de un menor o de un
trabajador no tiene por qué estar ahí. El contexto ya lo da la fila desde la que
se abrió.

### Quien no puede hacer algo, no ve el botón

**Ausente, no deshabilitado.** Un botón apagado invita a averiguar por qué, y
esa averiguación termina en alguien pidiendo un permiso que no necesita.

Es distinto de un control deshabilitado por el ESTADO de la pantalla —un
«Guardar» que espera a que el formulario sea válido—: eso sí se deshabilita,
porque la persona puede resolverlo sola.

---

## 9ter · Tablas — tres decisiones que se toman al escribir la columna

Salieron de reportes de producto, y ninguna se puede imponer con código: las
tres viven en cómo se define la columna.

### La unidad va en la cabecera, no en cada celda

«Días» arriba y `20` en la celda. Repetir «20 días», «14 días», «3 días» en
cada fila obliga a leer la unidad noventa veces para comparar tres números, y
ensancha la columna sin añadir nada.

### Una celda numérica no lleva segunda línea

Un `20` con «C-2026-001 · Director» debajo deja de ser una cifra: rompe la
alineación de la columna y ya no se puede recorrer con la vista. Si ese dato
hace falta, es **otra columna** —que además se podrá ordenar y filtrar— o va en
la fila desplegable.

Con `numerica: true` la columna alinea a la derecha y ordena por valor y no por
texto, que es lo que una cifra necesita.

### Con la tabla ancha, solo se desplaza la tabla

La barra —buscar, «Mostrar», el recuento, Filtros, Columnas y las acciones del
producto— y el pie —el rango y la paginación— **se quedan quietos**. Es
comportamiento del componente y no hay que montar nada: lo que se arrastra a la
derecha es la columna que se quiere leer, no los mandos que hacen falta para
seguir trabajando.

Si el producto engancha CSS propio al contenedor de la tabla, el que envuelve
todo es `.tb-bloque`; `.tb-envoltura` es **solo la tabla**, y es la que desliza.

---

## 10 · Lo que este manual todavía no cubre

Honestidad sobre los límites, para que nadie asuma cobertura que no existe.
**Lo que estaba aquí y ya está hecho se ha borrado en vez de dejarlo como
pendiente eterno:** la iconografía —39 iconos, cuatro tamaños y regla de
significado— y la densidad, que salieron en la v1.7.0.

| Pendiente | Estado |
|---|---|
| **Tabla — lo que aún no trae** | `TablaDatos` resuelve orden, filtros —texto libre y dominio cerrado—, búsqueda global, «Mostrar» con recuento, columna N.º, paginación, columnas visibles (controlables desde el perfil), ranura de acciones, estado vacío y **desplazamiento horizontal sin llevarse los mandos** (§9ter). **No** trae selección múltiple ni encabezado fijo |
| **Comportamiento: promesa contra entrega** | El sistema compara **la cascada** del catálogo contra la que viaja —832 elementos, 171.025 propiedades, cinco anchos— y ahí no cabe una diferencia. Lo que **no** compara nadie todavía es el **comportamiento**: qué se abre, qué se cierra, qué clase elige el componente. Cuatro defectos seguidos entraron por ese hueco. Se cierra ejecutando las dos superficies en un navegador, y eso está **pendiente de autorización** |
| **Primitivas de dominio** | DNI y RUC con dígito verificador, dos apellidos, ubigeo en cascada, soles, fechas peruanas |
| ~~**Modo oscuro**~~ | **Aprobado.** Ya no es un pendiente: se pasa `tema` y `onTema` a `MenuUsuario` y el producto guarda la preferencia. El marco va en escala de negros |

Una nota que debe tratarse como contrato y no como detalle de base de datos: que
`perez` encuentre a `Pérez` depende de las extensiones `unaccent` y `pg_trgm`. **Es
una promesa de interfaz.** Si un buscador se monta sin ellas, el componente se
comporta distinto y nadie sabrá por qué.

---

## 11 · Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.2.0 | 2026-08-11 | Sobre MMI-DS **v1.48.0**, tras 37 versiones sin tocar el manual — que es exactamente el defecto que este documento no puede permitirse. Entran: §6.4 el error lleva icono · §6.5 **solo lectura no es deshabilitado**, con el caso del selector de documento durante la consulta · §6.6 los tres componentes de carga —imagen, PDF y documento de identidad— y sus tres reglas comunes · §6.7 **foto si la hay, avatar si no**, con una sola prop · §9ter **tablas**: la unidad en la cabecera, la celda numérica sin segunda línea, y que con la tabla ancha solo se desplaza la tabla. En §10 se borra de «no cubre» lo que ya está hecho |
| 1.1.0 | 2026-08-09 | Sobre MMI-DS v1.11.1. §2.4 pasa de «cuatro colores de marca» a la familia `marca`, con la distinción entre conocido y autorizado. De §10 se BORRAN iconografía y densidad, que ya están hechas. Se añade `ACTUALIZAR.md` |
| 1.0.0 | 2026-08-07 | Primera edición. Sobre MMI-DS v1.1.0 |

**Este manual se corrige cuando cambia el sistema, no al revés.**
