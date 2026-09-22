# Respuesta a R157 — piezas de tablero · para Control Administrativos V2.0

**22 de septiembre de 2026** · MMI-DS **v1.133.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.133.0"
```

**Entran los siete puntos.** Ninguno es de su pantalla: un tablero denso de
personas, un avatar con estado, una burbuja con tono, un indicador de conexión,
un carril con anclaje, una superficie tonal y un relieve de escala son piezas
que le faltaban al sistema, no a Tableros · En Vivo. Por eso se atienden.

Lo que **no** entra tal como lo pidieron está en el §3, con el porqué.

---

## 1 · Lo que se entrega

| Punto | Qué pidieron | Qué entra |
|---|---|---|
| **R157.1** | Rejilla densa | Clase **`tn-densa`** |
| **R157.2** | `Avatar` con estado | Prop **`estado`** — `exito \| aviso \| error \| info` |
| **R157.3** | Burbuja libre y con color | **`badge-exito`**, **`badge-aviso`**, **`badge-info`**, fuera del marco |
| **R157.4** | Indicador «en vivo» | Clase **`vivo`** con su punto |
| **R157.5** | Carril con anclaje | Clase **`car`** con `car-cuenta` y `car-punto` |
| **R157.6** | Fondo por grupo | Clase **`sup`** con `sup-exito \| sup-aviso \| sup-error \| sup-info` |
| **R157.7** | Relieve en el avatar | Prop **`elevacion="relieve"`** sobre **`--sombra-relieve`** |

Y un tamaño nuevo: **`tamano="fluido"`** en `Avatar`, que es lo que hace que la
rejilla densa no necesite un tamaño fijo por ancho de pantalla.

---

## 2 · Tres cosas que cambiaron respecto a lo que pidieron

### 2.1 · El estado del avatar no es `'presente' | 'ausente'`

Lo pidieron con los nombres de su dominio. Entra con los **tonos del sistema**:
`exito`, `aviso`, `error`, `info`.

El anillo no sabe de asistencia. El mismo verde sirve para «está dentro», «en
línea», «pagado» y «aprobado», y si el sistema publica `presente` la siguiente
pantalla que lo necesite para otra cosa tiene que elegir entre usar una palabra
que miente o pedir un cuarto nombre. La traducción es de ustedes y es una línea:

```ts
const TONO = { presente: 'exito', ausente: 'error' } as const;
<Avatar estado={TONO[persona.estado]} … />
```

### 2.2 · La rejilla no lleva un número de columnas, lleva un suelo

Pidieron **seis columnas en un teléfono**. Se escribió así y **se vio fallar en
nuestro propio catálogo**: en un contenedor de 260 px, seis columnas dan celdas
de 21 px, donde «Rosa» no cabe. Un nombre que no cabe o se recorta o se parte, y
la política de móvil primero prohíbe las dos.

Así que lo fijo es **el suelo de la celda: 84 px** —lo que mide un apellido
corriente a 11 px— y el número de columnas es la consecuencia: **las que quepan,
repartiendo siempre todo el ancho**. En 375 px con margen de producto salen
**tres o cuatro**; en una pantalla ancha, las que entren. Baja de columnas antes
que apretar.

Esto cambió después de que el responsable mirara el tablero montado y dijera
*«las veo muy apretadas que no se leen los datos»*. Es el mismo criterio que
piden ustedes —densidad— aplicado al revés: **una rejilla que no se lee no es
densa, es ilegible.**

### 2.3 · El anillo va por fuera, no como borde

`box-shadow`, no `border`. Un borde come del tamaño de la foto, y a 48 px eso se
nota: dos avatares con y sin estado salen de distinto tamaño y la fila baila.

---

## 3 · Las dos preguntas de norma

### 3.1 · El color sin texto — **su razonamiento es correcto, y se adopta**

Lo que proponen cumple la regla de `TarjetaPersona`, y por las cuatro razones
que dan. La que más pesa es la primera: **nunca se ven los dos grupos a la vez**.
El `Segmentado` con recuento —«Asistió 30» / «No asistió 11»— es el texto que
sostiene el color, y la hora bajo cada icono es el dato que distingue persona a
persona. El anillo **refuerza**; no porta nada él solo.

No hace falta un glifo por icono. **Sí hace falta que el `Segmentado` esté
siempre visible cuando la rejilla lo está** — si se queda fuera de pantalla al
desplazar, el color se queda solo y la regla se rompe. Queda escrito en la regla
2 de «Piezas de tablero».

### 3.2 · Los rótulos — **es decisión de su dueño y no la tocamos**

«Asistió» / «No asistió» los fijó su dueño el 22/09/2026. No es materia del
sistema de diseño: son las palabras de su negocio.

Sobre lo que anotan —que por la tarde la paridad de marcas mete en «No asistió»
a quien sí asistió— tienen razón y no es un problema de rótulo, es que **el
tablero está nombrando el estado presente con una palabra en pasado**. Si
quieren una fórmula que sirva a las dos horas, la que no se alarga es **«Dentro»
/ «Fuera»**: describe dónde está la persona ahora, que es lo que la paridad de
marcas realmente calcula. Se lo dejamos como sugerencia; la decisión es de su
dueño.

---

## 4 · Un defecto que encontramos mirando, y que les habría llegado

`tn-densa` se pone sobre una `<ul>` —es una lista de personas—. El navegador le
mete **40 px de sangría** propios de la lista. Medido en el catálogo a 333 px:
la rejilla salía de 234 px en vez de 284 y daba **dos columnas de 93 px donde
caben tres de 113**, descentrada hacia la derecha.

No se ve como un fallo. Se ve como un tablero apretado.

La clase ahora anula `margin`, `padding` y `list-style`. Si ya la habían probado
con un `<ul>`, esto les cambia el resultado a mejor sin tocar nada de su lado.

---

## 5 · Cómo se monta

```tsx
import { Avatar, Segmentado } from 'sistema-diseno-ae';
import 'sistema-diseno-ae/componentes.css';

<Segmentado etiqueta="Grupo" valor={grupo} onCambio={setGrupo}
  opciones={[
    { valor: 'dentro', texto: `Asistió ${dentro.length}` },
    { valor: 'fuera',  texto: `No asistió ${fuera.length}` },
  ]} />

<div className={`sup sup-${grupo === 'dentro' ? 'exito' : 'error'}`}>
  <ul className="tn-densa">
    {lista.map((p) => (
      <li key={p.id} className="tbl-persona">
        <span className="tbl-foto">
          <Avatar id={p.id} nombre={p.nombre} tamano="fluido"
                  estado={grupo === 'dentro' ? 'exito' : 'error'}
                  elevacion="relieve" />
          {p.tarde > 0 && <span className="badge">+{p.tarde}</span>}
        </span>
        <span className="tbl-nom">{p.nombre}</span>
        <span className="tbl-ape">{p.apellido}</span>
        <span className="tbl-hora">{p.hora}</span>
      </li>
    ))}
  </ul>
</div>

<p className="vivo"><span className="vivo-punto" /> En vivo · último dato {ultima}</p>
```

`tbl-*` son las clases de la **celda** —foto, nombre, apellido, hora—, y ninguna
de las tres líneas de texto se recorta: **envuelven**. En un teléfono no hay
puntero que descubra un globito.

---

## 6 · Verificación

- Los **22 pasos** del publicador en verde, incluidas las pruebas y ESLint.
- El tablero **montado y vivo en el catálogo**, con 24 personas, no con un
  dibujo: es el componente que se entrega, ejecutándose.
- Las piezas nuevas llevan sus reglas en `sistema/componentes/comportamiento.md`,
  sección **«Piezas de tablero»**, y cada regla `Obligatorio` tiene prueba —eso
  lo comprueba un candado, no nuestra palabra.
