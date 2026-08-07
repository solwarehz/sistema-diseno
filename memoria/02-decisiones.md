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

## D-06 · No se hace modo oscuro

**Decisión:** solo modo claro.

**Por qué:** MMI-DS §9 y §2.4. Los valores están calculados y son implementables,
pero **no aprobados**. Duplica la superficie de prueba de contraste en todos los
componentes, y el propio documento reconoce que el modo oscuro es «notablemente
menos marca»: el panel rojo se aplana y el marco queda como único portador de
identidad.

Ese esfuerzo rinde más en densidad.

**Lo revertiría:** que el usuario lo apruebe explícitamente. Entonces se
implementa a partir de §2.4, que ya tiene los valores.

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
