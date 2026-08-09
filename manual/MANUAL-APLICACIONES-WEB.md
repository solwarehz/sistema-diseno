# Manual de marca — Aplicaciones web

**Colegio Albert Einstein, Huaraz**
Documento MMI-MAN-01 · Versión 1.1.0 · 9 de agosto de 2026
Sistema de referencia: MMI-DS v1.11.1 · Color modo claro **bloqueado**

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

El marco se parte en dos filas: identidad arriba, navegación abajo. La acción
principal pasa a **botón flotante de 56px** en la esquina inferior derecha, al
alcance del pulgar.

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

## 10 · Lo que este manual todavía no cubre

Honestidad sobre los límites, para que nadie asuma cobertura que no existe.
**Lo que estaba aquí y ya está hecho se ha borrado en vez de dejarlo como
pendiente eterno:** la iconografía —39 iconos, cuatro tamaños y regla de
significado— y la densidad, que salieron en la v1.7.0.

| Pendiente | Estado |
|---|---|
| **Tabla — lo que aún no trae** | `TablaDatos` resuelve orden, filtros y paginación. **No** trae selección múltiple, encabezado fijo ni elegir columnas visibles |
| **Primitivas de dominio** | DNI y RUC con dígito verificador, dos apellidos, ubigeo en cascada, soles, fechas peruanas |
| **Modo oscuro** | Calculado, **no aprobado**. No implementar |

Una nota que debe tratarse como contrato y no como detalle de base de datos: que
`perez` encuentre a `Pérez` depende de las extensiones `unaccent` y `pg_trgm`. **Es
una promesa de interfaz.** Si un buscador se monta sin ellas, el componente se
comporta distinto y nadie sabrá por qué.

---

## 11 · Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1.0 | 2026-08-09 | Sobre MMI-DS v1.11.1. §2.4 pasa de «cuatro colores de marca» a la familia `marca`, con la distinción entre conocido y autorizado. De §10 se BORRAN iconografía y densidad, que ya están hechas. Se añade `ACTUALIZAR.md` |
| 1.0.0 | 2026-08-07 | Primera edición. Sobre MMI-DS v1.1.0 |

**Este manual se corrige cuando cambia el sistema, no al revés.**
