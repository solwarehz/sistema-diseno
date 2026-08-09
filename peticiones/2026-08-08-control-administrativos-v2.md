# Respuesta a Control Administrativos V2.0

**De:** mantenimiento del sistema de diseño · MMI-DS
**Sobre:** vuestro pedido del 2026-08-08, sobre la v1.7.0
**Entregado:** v1.9.0

---

## Antes que nada

**Es el mejor reporte que ha recibido este sistema.** No por el tono: por el
método. Cifras contadas en vez de estimadas, dos defectos regalados con su
arreglo, y una sección de *lo que no pedimos* que es tan valiosa como el resto —
la mayoría de equipos piden que el sistema resuelva su negocio, y vosotros
habéis trazado la línea vosotros mismos.

Y vuestra frase de cabecera es correcta: **un sistema de tokens no es un sistema
de diseño.** Estábamos entregando la mitad y llamándolo entero.

| | Vuestro pedido | Estado en v1.9.0 |
|---|---|---|
| **D1** | El candado no funciona tal como se distribuye | ✅ **Confirmado y corregido** |
| **D2** | `.tb-activos` pinta una banda vacía | ✅ Corregido |
| **P1** | Publicad los componentes | 🟡 **Estilo entregado**, comportamiento no |
| **P2** | Marco de plataforma | ⛔ **Vuestra solución no funciona.** Os damos la que sí |
| **P3** | Los cinco iconos que faltan | ✅ Nueve, no cinco |
| **P4** | Arreglad la distribución | ⏳ **Bloqueado**, y no por nosotros |
| **P5** | Escribid las reglas de comportamiento | ✅ Entregado |

---

## D1 · El candado — confirmado, y gracias

Vuestro diagnóstico era **exacto**. Lo reprodujimos midiendo qué le pasa a cada
patrón al incrustarlo en el selector:

| | Con el código que os entregamos |
|---|---|
| Patrones que **cambian de significado** | **7 de 8** — `\b` pasaba a ser «barra invertida seguida de b», que no caza nada |
| Patrones que **hacen reventar a ESLint** | 1 — `Unterminated group`, por el `\(` de las funciones de color |

Corregido con vuestra propuesta. Llevaba así **desde la v1.1.0: siete
versiones**. Es el peor tipo de fallo, y lo dijisteis mejor que nosotros: falla
en silencio, y quien lo adopta cree estar protegido.

**Lo que más nos importa de esto no es el arreglo.** Nuestra prueba
`probar-candado.mjs` comprobaba los **patrones** y no su **incrustación** — y lo
teníamos declarado como no verificado. Encontrasteis exactamente el hueco que
habíamos declarado. Ahora la prueba cubre las dos mitades: **62 casos**, y
saboteada con el código viejo caza los ocho fallos, incluido el `Unterminated
group`.

Vuestra decisión de repararlo en vuestra configuración y **no en nuestro
archivo** fue la correcta. Ahora podéis volver al nuestro.

---

## D2 · La banda vacía

Corregido con vuestra línea. `.tb-activos[hidden] { display: none }`. Medido en
pantalla: **de 16px a 0**.

---

## P1 · Los componentes — la mitad está, y la otra mitad os la debemos

### Lo que ya podéis importar

**`componentes.css` — 627 reglas, 20 elementos, 71 KB.** Botón, enlace, campo,
selector, interruptor, selección múltiple, fecha, horario, chip, avatar, tarjeta
de persona, tarjeta, **tabla de datos**, tabla simple, paginación, progreso,
aviso, confirmación, estados de pantalla y marco de aplicación.

```
import 'sistema-diseno-ae/tokens.css';
import 'sistema-diseno-ae/componentes.css';   // después, o no habrá colores
```

**No es una copia: se EXTRAE del catálogo** dentro del mismo comando que lo
construye. Las reglas entregadas y las que veis en la demostración son
literalmente las mismas, así que no pueden separarse.

**Verificado comparando, no mirando.** Montamos 21 ejemplares reales del
catálogo en una página desnuda con solo esas dos hojas y comparamos once
propiedades calculadas contra el original: **20 de 21 idénticos**.

El único distinto es `.hor-b`, a 15px en vez de 13, porque hereda el tamaño de
`.hor`. No es una regla que falte: es una **dependencia de contexto**, y por eso
el contrato de marcado importa tanto como la hoja.

### Lo que no os entregamos, y por qué

**El comportamiento empaquetado.** Vuestra pila es React y no tenemos dónde
compilarlo ni probarlo: entregar diecisiete componentes que nunca hemos
ejecutado sería exactamente lo que este sistema prohíbe —«verificado con una
herramienta, no *debería funcionar*»—. Preferimos deberos la mitad a entregaros
algo que no hemos visto correr.

Mientras tanto, P5 os da las reglas escritas. No es lo mismo, y lo sabemos.

---

## P2 · Marco de plataforma — el pedido es correcto, la solución no

**Aceptamos la necesidad entera.** Y añadimos un argumento al vuestro: no es
solo saber en qué contexto estás, es que **una equivocación aquí no la corrige
un botón «deshacer»**. Operar sobre un cliente creyendo estar en otro es la
clase de error que se descubre tarde.

**Pero vuestra solución no puede funcionar, y no es opinión.** Lo medimos:

| Segundo marco | Contra `marco-fondo` | Texto blanco encima |
|---|---|---|
| Azul medio `#6B7BA8` | 2,49:1 ❌ | 4,18:1 ✅ |
| Azul claro `#8A93B5` | **3,43:1** ✅ | **3,03:1** ❌ |
| Grafito `#3A3835` | 1,12:1 ❌ | 11,68:1 ✅ |
| Casi negro `#1A1A1A` | 1,66:1 ❌ | 17,40:1 ✅ |

**El que llega a 3:1 contra el marco deja de ser una superficie oscura y tira el
texto por debajo del mínimo. El que sigue siendo oscura no llega. No hay hueco
entre los dos.** Vuestro grafito y vuestro 1,20:1 no eran un mal intento: eran
el resultado correcto de un problema sin solución por ese camino.

Y hay una razón anterior a la aritmética: **SC 1.4.1 prohíbe distinguir por
color solamente.** Para una señal *estética* sería discutible; para una señal de
*seguridad* es descalificatorio. Quien no distingue esos dos azules —por daltonismo,
por un monitor malo, por luz de sol— se queda sin la única señal que tiene.

### Lo que sí define el sistema

**Obligatorio: el contexto se dice con TEXTO, siempre visible en el marco.**
No es un adorno del diseño; es el mecanismo. Un rótulo permanente que nombre
dónde estás — «Plataforma» o el nombre del cliente — en la barra o en la cabecera
de la lateral, nunca solo en un menú desplegado.

Es exactamente la misma decisión que ya tomamos con `texto-pista`: la jerarquía
del placeholder no se podía expresar con color sin incumplir AA, así que pasó a
regla de composición. Aquí igual.

**El color acompaña, no distingue.** Sobre esa base sí definimos los tokens que
pedís, con su significado corregido: no son «el segundo marco», son **el matiz
que refuerza un rótulo que ya está**. Decidnos si los queréis así y entran en la
v1.10.0, verificados en el contrato como todo lo demás.

Si preferís que os demos los tokens sin el rótulo, la respuesta es no — y
preferimos decirlo ahora que veros construir una señal de seguridad que no
señala.

---

## P3 · Los iconos — nueve, no cinco

Los cinco que pedisteis: **candado, lupa, cerrar, visto y alerta**.

Y cuatro más que la tabla necesita y también faltaban, porque sin ellos la
reconstrucción tampoco salía: **filtro, columnas, ordenar y descargar**.

```
import { ICONOS, icono, TAMANOS } from 'sistema-diseno-ae/iconos';
```

**Hicisteis bien en no dibujarlos.** Vuestro razonamiento es el nuestro: un trazo
hecho a mano se separa del conjunto a la primera revisión, y entonces hay dos
iconos distintos para la misma idea en la misma institución. Si os falta otro,
pedidlo; no lo dibujéis.

---

## P4 · Distribución — bloqueado, y no por nosotros

Confirmado punto por punto:

- **`package.json` ya existe** en la raíz, con `files` limitado y `exports`.
- **No hay etiqueta publicada.** Sigue sin haberla.
- **`main` está más de cincuenta commits atrás** y sin manifiesto, así que un
  `npm install` sin referencia va ahí y falla en seco.

Las tres acciones que faltan —fusionar a `main`, etiquetar, daros lectura— son
**del propietario del repositorio, no del equipo del sistema**. Están pedidas y
esperando autorización. Tenéis razón en que es media hora; el problema no es el
trabajo, es el permiso.

Y tenéis razón en lo otro también: **repetirlo en cada versión es lo que de
verdad importa.** Cuando exista la primera etiqueta, el empaquetado ya comprueba
que la versión de `fuente.mjs` y la de `package.json` coincidan, y corta si no.

Mientras tanto el ZIP, con una mejora vuestra incorporada: el empaquetado
**avisa** de las entregas de versiones anteriores que queden en la carpeta, para
que nadie se lleve una vieja creyendo que es la última.

---

## P5 · Las reglas de comportamiento — entregado

**`comportamiento.md`**, en el paquete. Vuestras cinco reglas de la tabla están
las cinco, y hay once más solo para ese elemento: orden, columnas, descarga y
filas desplegables.

Cada regla dice **si es obligatoria del sistema o decisión vuestra**. Ejemplo,
para que veáis el criterio:

> **Obligatorio.** Al filtrar se vuelve a la página 1. Quedarse en la página 7
> de un resultado que ahora tiene 2 muestra una tabla vacía que parece un fallo.
>
> **Del proyecto:** qué columnas son filtrables y con qué control.

Está **leído del código**, no de la memoria de nadie. Y declara al final tres
cosas que todavía no cubre —el teclado del calendario, el foco del menú de
usuario y el comportamiento con lector de pantalla real— en vez de omitirlas.

---

## Lo que vuestro reporte cambió en cómo trabajamos

Tres cosas, y las escribimos aquí para que no se pierdan:

1. **Una prueba que cubre la mitad del camino no cubre nada.** Probábamos los
   patrones del candado y no su incrustación, y ahí estaba el fallo. La prueba
   ahora llega hasta el final.
2. **Entregar el ejemplo no es entregar la pieza.** El catálogo enseñaba el
   resultado; ahora se entrega el resultado *y* la pieza.
3. **Contar lo que cuesta consumirnos.** Vuestras 3.983 líneas contra nuestras
   1.464 es la métrica que nos faltaba, y la vamos a seguir mirando.

---

## Lo que sigue

| | Qué | De quién |
|---|---|---|
| 1 | Etiquetar y publicar. Desbloquea P4 entero | **Del propietario del repositorio** |
| 2 | Decidnos si aceptáis el rótulo de contexto de P2, y entran los tokens | Vuestro |
| 3 | Componentes con comportamiento | Nuestro, en cuanto haya dónde compilarlos |
| 4 | Teclado del calendario y foco de la confirmación | Nuestro, en curso |
