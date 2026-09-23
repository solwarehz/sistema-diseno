# Respuesta a R158 — el marco y el alto del tablero · para Control Administrativos V2.0

**23 de septiembre de 2026** · MMI-DS **v1.145.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.145.0"
```

**Los dos puntos entran, y los dos eran del sistema.** El segundo era un defecto
nuestro en el sentido más literal: publicamos la pieza y no publicamos el padre
que la sostiene.

---

## 1 · R158.1 — el encabezado. Confirmado, y el diagnóstico es distinto al suyo

Lo reprodujimos en **su propia pantalla** a 333 px, que es más estrecho que los
481 del responsable. Tres cosas:

**`flex-wrap: wrap` sobraba, y por poquísimo.** Los hijos ocupan 26 + 12 de hueco
+ 264 = **302 px** contra **301,3** de sitio. Envolvía por **siete décimas**.

**Y `height: auto` no se aplicaba nunca.** Es la parte que su lectura no podía
ver desde fuera: la regla base `.top { … height: 64px }` va **después** en el
mismo archivo, empata en especificidad y gana por orden. Por eso la barra
envolvía **y seguía midiendo 64 px** — `top-acciones` acababa en 78 con la barra
terminando en 64: **catorce píxeles por fuera**. Eso es el desalineado que vio el
responsable.

**Su punto 2 no se sostiene, y les decimos dónde mirar para comprobarlo.** No
existe ningún `@media` que le ponga `display: none` a `.top-plegar`. Lo que hay
es `.app-marco .top-plegar`, que lo oculta **sólo** cuando la barra inferior
sustituye al lateral — ahí el botón no tendría nada que plegar. Eso es coherente
y no sobra.

Dos cosas que probablemente son lo que transcribieron, y las dos existen de
verdad en la v1.136.0 que ustedes midieron:

- `@media (max-width: 700px) { .top-plegar .ic-escritorio { display: none } .top-plegar .ic-movil { display: grid } }` — oculta **un icono**, no el botón: es el cambio de glifo de escritorio a móvil.
- La tercera regla que citan como de 640 px —`.top-plegar { background: transparent … }`— **no está dentro de ese bloque**: el `@media` cierra antes y esa regla es la **base**. Por eso «se le vuelve a dar estilo […] sin devolverle `display`»: nunca se lo quitaron.

Y eso último es justo el fondo del asunto que sí tenían razón en señalar.

Pero lo que les hizo leerlo así **es real y es el fondo del asunto**: en esta
hoja las reglas base van después de los `@media`, así que una declaración de
`@media` puede estar escrita y no aplicarse. Es exactamente lo que le pasaba al
`height`.

**Lo entregado**: la barra no envuelve, los filtros tampoco, y `min-width: 0` va
en la regla **base** de `.top-acciones` —no dentro de una consulta de ancho: un
hijo de flex no encoge salvo que se le diga, y eso vale a cualquier ancho; el
ancho sólo decide cuándo se nota—. Medido tras el cambio: **una fila, 64 px, nada
fuera, y el selector de sede en 111,3 px sin cortarse.**

---

## 2 · R158.2 — tienen razón, y era nuestro

Publicamos `tbl-marco` diciendo «el alto lo pone el padre» y **no publicamos
ningún padre que lo diera**. `.app` sólo declara `min-height`, así que un
`height: 100%` de dentro no resuelve, el marco degrada a bloque normal y
`tbl-crece` no desplaza nada.

Y su forma de plantearlo es la correcta: **no es estético, es la regla 2**. Sin
cuerpo que se desplace por dentro, el rótulo que sostiene el color se va de
pantalla al deslizar. Nos citaron nuestra propia frase y les sobraba razón.

**Lo que entra:**

```tsx
<MarcoApp altoCompleto …>
  <Tablero … />
</MarcoApp>
```

`altoCompleto` emite `.app-alto`, que da `height: 100dvh` —con `100vh` de
respaldo para quien no entienda `dvh`— y **anula el `min-height` de toda la
cadena**, que es la mitad que suele olvidarse: sin eso, el primer hijo no baja de
su tamaño de contenido y el pie se va igualmente.

**`dvh` y no `vh`**, como pidieron. Tienen razón en el motivo.

**Va como opción y no por omisión**, y esto sí es una decisión que les afecta:
con ella la página deja de desplazarse y se desplaza el contenido. Imponerlo
rompería cualquier pantalla larga que hoy funciona.

**Y retiraron bien su parche.** Su gancho funcionaba, y lo quitaron porque *«es
código del producto decidiendo maquetación»*. Es el mismo argumento con el que
sacamos el relieve a un token. Pidieron **la pieza y no el valor**, y preferir la
pantalla con el defecto declarado a la pantalla parcheada es exactamente el
criterio correcto. Gracias por eso: si lo hubieran parcheado, el defecto seguiría
en el sistema y lo pagaría el siguiente producto.

---

## 3 · Lo que salió buscando esto: tres defectos que nadie buscaba

R158.1 nos hizo mirar un sitio donde nunca habíamos mirado, y nació el **candado
veintidós**: una declaración dentro de un `@media` que una regla **posterior**
con el mismo selector mata por orden.

No es una regla que falte ni una que sobre. Es una que **está escrita, se lee
como intención, y no se aplica jamás** — y encima tapa el defecto, porque quien
lea la hoja concluye lo contrario de lo que pasa.

El día que nació sacó tres:

1. El `height: auto` del encabezado — el de ustedes.
2. Los dos `min-width: 0` de `.top-filtros .campo`, muertos los dos. **Por eso el
   campo no podía encoger**, que es parte de lo que empujaba su barra a la
   segunda fila.
3. **El peor, y no es suyo: el movimiento reducido de los avisos estaba roto en
   todos los productos.** Nuestro extractor izaba esa regla al principio del
   archivo porque buscaba `--dur-` sin distinguir un **uso** de una
   **declaración**, y `.av` usa `var(--dur-rapida)`. En nuestro catálogo
   funcionaba; **en el paquete que ustedes instalan, no**. Quien tenga activado
   «reducir movimiento» en su sistema operativo llevaba versiones viendo la
   animación igual.

Al actualizar, eso se arregla solo.

---

## 4 · Sobre lo que verificaron ustedes

Las cuatro comprobaciones que hicieron están bien hechas y dos de ellas nos
ahorraron trabajo: que el contrato de marcado se cumple entero **incluido lo que
no se ve** —el `sr-solo`, el `aria-hidden`, el carril con su `role` y su
`aria-label`— es justo lo que nadie suele comprobar.

Y decir *«no lo hemos reproducido nosotros: nuestra ventana de pruebas no baja de 1265 px»*
en vez de darlo por hecho es lo que hizo que fuéramos a medirlo en vez de a
creerlo. Al medirlo salió más de lo que ustedes veían.

---

## 5 · El «No asistió 0» — de acuerdo, no es de diseño

Su diagnóstico es de backend y no lo tocamos: `Trabajador.sedeId` en NULL y el
`IN` de SQL descartándolos. Queda anotado que **afecta igual a Consulta diaria**
porque es el mismo servicio, y que cambia qué ve un administrador de sede — eso
es decisión de su responsable, no nuestra.

---

## 6 · Verificación

- Los **23 pasos** del publicador en verde cuando esto entró —el candado nuevo
  era el veintidós, más ESLint—. Hoy son **25**.
- **1227 pruebas** en 59 archivos.
- Las dos reglas nuevas del contrato —13 y 14 de «Marco de aplicación»— con
  prueba, y las dos **vistas caer** con su mutación: devolver el `wrap` y quitar
  el `dvh`.
- Las medidas de este informe son de navegador, sobre su pantalla.
