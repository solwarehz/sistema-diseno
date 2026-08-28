# CLAUDE.md — Sistema de diseño Colegio Albert Einstein

**Lee esto completo antes de tocar nada.** Este archivo viaja con el repositorio:
es lo primero que ve cualquier agente que clone en una máquina nueva.

**Y después lee [`memoria/`](memoria/00-INDICE.md)** — estado real, registro de
decisiones con su porqué, qué falta tras un clon, y pendientes por retorno. La
memoria del agente vive en `~/.claude` y **no se clona**; por eso lo que importa
recordar está en el repositorio.

---

## 1 · Qué es este repositorio

La implementación ejecutable de `SISTEMA-DE-DISENO.md` (documento **MMI-DS**),
el sistema de diseño web del Colegio Albert Einstein, Huaraz.

El documento es la **especificación**; esto es el **código**. Cuando ambos
discrepen, gana el que tenga la versión más alta y se corrige el otro en el mismo
commit. Nunca se deja la contradicción viva.

**Estado actual: v1.83.0** — nace la página de **Culqi**, debajo de Izipay y
con el mismo andamiaje: dos pasarelas no pueden dar dos pantallas distintas.
El detalle vive en [`memoria/01-estado.md`](memoria/01-estado.md), que se
reescribe con cada cambio de estado — este número es lo único que se toca aquí.

---

## 2 · Lo primero al abrir sesión

```bash
git -C . pull --ff-only
node sistema/tokens/generar.mjs
node sistema/candado/verificar-contraste.mjs
```

Si el verificador falla, **para y avisa**. Significa que alguien cambió un color
sin regenerar el contrato, o que el contrato miente. No sigas trabajando encima.

Nunca uses `git checkout` ni `git stash` sobre el árbol: trabajan varios agentes
a la vez y te llevarías por delante trabajo ajeno. Para revertir un experimento,
edición inversa.

---

## 3 · Límites de la máquina — no negociables

El usuario los fijó de forma expresa:

- ✅ Escribir, leer y ejecutar **dentro de la carpeta del proyecto**.
- ❌ **No salir de la carpeta.** Ni leer `~/Downloads`, ni `~/Documents`, ni nada
  fuera. Si necesitas un archivo de fuera, **pídelo por el chat**: el usuario lo
  manda y se guarda dentro.
- ❌ **No instalar nada en la máquina.** Ni node global, ni fuentes, ni Homebrew.
- ✅ **Docker: autorizado de forma permanente para este proyecto** (2026-08-10,
  por el responsable). El agente puede levantar y apagar los contenedores del
  proyecto según lo necesite, sin pedir permiso cada vez. El límite sigue siendo
  el ambiente del proyecto: contenedores, volúmenes e imágenes que sirven a este
  repositorio — nada fuera de él.
- ❌ **Nunca borres un archivo del usuario sin permiso explícito.** Y cuando lo
  autorice, va a la papelera, no a `rm -rf`.

Para cualquier cambio en la máquina: **pide autorización una vez, itemizada y por
adelantado** — qué archivos, qué descargas, qué puertos, qué huella queda. No en
goteo: las aprobaciones constantes acaban en «sí» automáticos sin leer.

Las decisiones técnicas de dentro de la carpeta **se toman y se reportan**, no se
consultan. Solo se consultan reglas de negocio y cambios en la máquina.

---

## 4 · Qué NO está en el repositorio — y qué hacer

`.gitignore` excluye los binarios de diseño porque **son propiedad del cliente**.
Al clonar verás `marca/02_identidad/` con solo un `LEEME.md`. **Es lo correcto,
no es un error.**

| Falta | Cómo se consigue |
|---|---|
| `AE-nombre-horizontal.png` | Pedírselo al usuario por el chat |
| `AE-nombre-vertical.png` | Pedírselo al usuario por el chat |
| `TIPOGRAFIA-web-y-sistema.png` | Pedírselo al usuario por el chat |
| `node_modules/` | `docker compose up` — nunca `npm install` en la máquina |

**No inventes los activos que falten. No recortes el escudo del lockup**: produce
bordes sucios y proporciones que no son las del original. Si falta un activo, el
catálogo muestra un marcador de posición explícito.

Dos huecos son **trabajo de diseñador** y no se resuelven con código:

1. **No existe el escudo suelto.** MMI-DS §10 lista `AE-escudo-*.png`. No existen.
2. **No existe el isotipo simplificado** (§8.6). Bajo 56px el escudo es ilegible.
   Para el marco a 40px y el favicon a 16px **no hay activo válido**.

Y un defecto de identidad abierto (§8.5): el escudo usa `#E30613`, el lockup usa
`#EC2027`. **Son dos rojos distintos en la misma identidad.** El sistema adopta
`#E30613` porque el escudo es el elemento primario.

---

## 4bis · Dos reglas que el usuario fijó expresamente

**Ningún color autorizado más sin autorización.** Los «colores autorizados» son
el panel de escalas: los únicos que pueden vivir en el sistema. Ampliarlo **no
es decisión del agente**. Lo que sí es libre es *nombrar*: un valor que existe
pero no se usa entra en la familia `marca` —conocida y **no** autorizada— para
que el candado pueda vigilarlo. Lo que no tiene nombre no se puede bloquear.

> Conocido ≠ autorizado. Nombrar mete el color bajo vigilancia; autorizar le da
> permiso de uso, y eso lo decide el usuario.

Y cuando un hexadecimal aparezca en documentación como **valor probado y
rechazado, con su medición al lado**, no se sustituye por el autorizado más
cercano: cambiaría lo que el registro dice que se midió.

**Todo componente nuevo se compone, no se reconstruye.** Cuatro reglas, en este
orden: se usan los componentes ya creados · se usan los colores autorizados · si
falta un componente se crea · con el conjunto se crean los siguientes. Está
desarrollado en [`sistema/componentes/POLITICA-DE-CREACION.md`](sistema/componentes/POLITICA-DE-CREACION.md)
y es vinculante: lo que no la cumpla no entra en la entrega.

---

## 5 · Cómo se cambia un color

Hay **un solo** sitio donde se escribe un valor: `sistema/tokens/fuente.mjs`.
Todo lo demás se genera.

```bash
# 1 · editar sistema/tokens/fuente.mjs
# 2 · subir VERSION (§2.5 regla 8: cualquier cambio exige nueva versión)
node sistema/tokens/generar.mjs          # regenera lock, CSS y preset
node sistema/candado/verificar-contraste.mjs   # debe salir con 0 fallos
```

**Nunca edites a mano** `paleta.lock.json`, `tokens-light.css` ni
`tailwind-preset.ts`. Llevan aviso de archivo generado. El verificador detecta la
edición manual y falla.

Si tu cambio hace fallar el candado, **el candado tiene razón**. No lo desactives.

---

## 6 · Reglas que el código hace cumplir

`sistema/candado/candado.eslint.config.mjs` prohíbe, con fallo de build:

| Prohibido | Por qué |
|---|---|
| Hex crudo, `rgb()`, `hsl()` | §2.5.6 — lo que no pasa por el token, el candado no lo protege |
| `bg-[#fff]` y arbitrarios | §2.5.6 — evaden el preset |
| `text-[Npx]` | §3.6.3 — solo los pasos de la escala |
| `outline-none` | §2.5.7 — es el defecto real de §1.3: con teclado te pierdes |
| Primitivas en componentes | §2.5.1 — existen para que los semánticos elijan |
| `marca-amarillo`, `marca-celeste` | §2.5.5 — 1,2:1 y 2,6:1, no admiten texto |
| `font-thin/light/extrabold/black` | §3.2 — cuatro pesos y ninguno más |
| Atributo `style` en línea | §2.5.6 — evade preset y candado |

`app/diseno/**` está exento: su trabajo es exhibir la paleta.

---

## 7 · Cuatro cosas que el documento prohíbe — §9

No las «mejores» por iniciativa propia. Están razonadas:

1. **No montar Storybook.** Para ocho componentes es sobrecarga y se desincroniza.
   El catálogo es la ruta `/diseño` dentro de la app, que importa los componentes
   reales y **no puede divergir**.
2. ~~**No hacer modo oscuro.**~~ **APROBADO el 2026-08-09 por el responsable.**
   Deja de ser una prohibición y pasa a ser superficie mantenida: los pares en
   oscuro entran en el candado de contraste igual que los de claro, y ninguna
   versión sube con uno en rojo. Lo que la prohibición decía sigue siendo cierto
   —duplica la superficie de prueba— y por eso lo que se compra con la
   aprobación es trabajo, no una casilla: 178 pares en vez de 89.
3. **No mostrar el markup interno de los componentes compartidos.** Lo que se
   copia es **la importación y las props**. Copiar utilidades de Tailwind aplica
   solo a composiciones puntuales.
4. **No adoptar librería de componentes en general.** Sí primitivas accesibles
   para exactamente tres casos: diálogo, menú y **selector con búsqueda**. El
   patrón `combobox` de ARIA escrito a mano produce fallos sistemáticos.

---

## 8 · Git

- Repositorio: **`solwarehz/sistema-diseno`** · privado.
- Se trabaja en ramas **`feat/*`**.
- **`main` sí se actualiza en este proyecto** —y solo en este—, pero **únicamente
  cuando está verificado y sin errores**. La condición no es una formalidad: es
  lo que hace que la regla sea segura, porque `main` es de donde instala el área
  de sistemas. Antes de subir, los **catorce** candados **en verde** y las pruebas
  pasando:

  ```bash
  node sistema/tokens/generar.mjs
  node sistema/candado/verificar-contraste.mjs
  node sistema/candado/verificar-color.mjs
  node sistema/candado/auditar-cascaron.mjs
  node sistema/candado/probar-candado.mjs
  node sistema/componentes/extraer.mjs        # incluye el candado de huérfanas
  node sistema/candado/verificar-cascada.mjs  # la hoja QUE VIAJA, a once anchos
  node sistema/candado/verificar-contrato.mjs # toda regla Obligatorio tiene prueba
  node sistema/candado/verificar-entrega.mjs  # lo publicado está EN el paquete
  node sistema/candado/verificar-promesa.mjs  # se VE igual que en el catálogo
  node sistema/candado/verificar-elemento.mjs # se emite el MISMO elemento
  node sistema/candado/verificar-empate.mjs   # el ORDEN no decide distinto en cada hoja
  node sistema/candado/verificar-forma.mjs    # lo publicado no cambia de FORMA sin decirlo
  node sistema/candado/verificar-omision.mjs  # el catálogo enseña lo que se ENTREGA por omisión
  ```

  Los dos últimos faltaban de esta lista y **la memoria los contaba entre los
  ocho**: el 2026-08-10 pasaron un día entero sin correrse por eso, y al
  correrlos salieron en rojo los dos. Una lista incompleta de candados es un
  candado abierto.

  El de la cascada es el único que no lee lo que hay, sino lo que **falta**: el
  defecto R25 —dos iconos pintados a la vez— vivía en la ausencia de una regla,
  y por eso los otros seis no lo vieron en tres versiones.

  El del **elemento** cierra el hueco que dejaba el de la promesa, y nació de
  dos defectos de la misma semana: el catálogo pintaba la tarjeta pulsable como
  `<a>` y el componente la emitía como `<button>` (R56), y la hoja estilizaba
  `h4` donde el componente emitía `h3` (R58). En los dos, la tarjeta se veía
  perfecta en el catálogo y mal en cada producto. **El candado de la promesa no
  podía verlos**: resuelve la cascada sobre el MISMO marcado, así que cuando lo
  que difiere es el elemento, le das lo mismo a las dos hojas y las dos
  responden lo mismo. Verde, y la pantalla mal.

  Lleva **deuda declarada**: cinco divergencias que encontró el día que se
  escribió, verificadas a mano y escritas con su daño real. Protege ya de las
  nuevas y no finge que las viejas no existen. Arreglar una es quitar su línea
  —y si se arregla y no se quita, el candado también falla, porque una lista de
  excepciones que nadie poda vuelve a ser el inventario a mano de siempre.

  El de la **forma** es el más joven y el que menos se parece a los demás: no
  mira lo que el sistema dice, sino **cómo está empaquetado lo que dice**. Nació
  de un fallo propio. La v1.67.0 metió el analizador de TypeScript delante en el
  candado de ESLint, y con eso `candado[0].rules` pasó a ser `undefined`: un
  proyecto que copiaba a mano los cuatro campos de `candado[0]` se habría
  quedado **sin ninguna regla activa y en verde**, porque ESLint no protesta
  ante un bloque sin reglas — simplemente no comprueba nada.

  Lo cazó Control Administrativos yendo a mirar la forma antes de confiar en
  ella, **no porque algo fallara**. Nadie se habría enterado, y es la clase de
  defecto que este repositorio ya conoce: el `box-sizing` que no viajaba y el
  analizador que no se entregaba. Lo suyo lo resume mejor que nosotros:
  *«cambiar la forma de lo exportado rompe a quien lo desarma, y verificar-entrega
  comprueba que todo salga, no que la forma se mantenga»*.

  Lo correcto sigue siendo esparcir —`...candado`—, pero **un paquete no puede
  repartir la culpa**: si se puede desarmar, alguien lo desarmará.

  El del **empate** nació de comprobar el anterior. Al montar el mismo marcado
  con las dos hojas en un navegador —24.642 propiedades— el filtro de columna
  de la tabla salió a 12px y 26,73px de alto con la hoja entregada y a 13px y
  36,18 con la del catálogo. **Ninguna regla faltaba ni sobraba: las mismas, en
  distinto orden.** `.tb-f` y `.campo` empatan en especificidad, y cuando dos
  reglas empatan gana la última — pero el extractor agrupa por elemento y les
  cambia el orden relativo. Ninguno de los otros podía verlo: el de la promesa
  compara una lista de elementos escrita a mano y ése no estaba en ella; el de
  la cascada resuelve la hoja que viaja contra sí misma, no una contra otra; el
  del elemento compara etiquetas, no valores.

  Se mide **solo sobre las combinaciones de clases que existen de verdad** en el
  marcado. Sin ese filtro salen 25.823 pares teóricos —`.sr-solo` contra
  `.nav-grupo` y demás parejas que no coinciden jamás—, y una lista así no se
  lee: se ignora.

  El de la **promesa** es el que compara las dos hojas resolviendo la cascada
  sobre el mismo marcado. Existe porque «no veo el botón CSV como lo veo en el
  cascarón» no lo cazaba ninguno: el reset `box-sizing: border-box` estaba en
  el catálogo y **no viajaba**, así que cada producto maquetaba en
  `content-box`. No lleva lista de propiedades «importantes» —compara todo lo
  que cualquiera de las dos hojas declare— porque elegir qué mirar es dejarlo
  a criterio, y eso es lo que se pidió que no se hiciera.

  Se sube por **avance directo**, sin `checkout` y sin reescribir historia:

  ```bash
  git push origin feat/sistema-base-v1:main
  ```

  Si algo sale en rojo, **no se sube**. Un `main` roto es un proyecto ajeno roto.
  Y **nunca** con `--force`: eso sigue necesitando permiso expreso.

- **Subir a `main` no es publicar.** El área de sistemas instala de **dos
  formas**, y las dos tienen que funcionar **siempre**: por `npm` con la
  etiqueta, y descargando el ZIP. Después del push:

  ```bash
  npm run publicar              # dice qué haría
  npm run publicar -- --publicar
  ```

  Pone la etiqueta, crea la publicación con el ZIP adjunto, y **borra los ZIP de
  las versiones anteriores** — solo la última conserva el suyo. Las etiquetas y
  las publicaciones **no se tocan**: si se borraran, `npm install` de una versión
  vieja dejaría de funcionar, que es lo contrario de lo que se garantiza.

  Es un comando y no tres pasos porque los tres pasos ya fallaron: el 2026-08-13
  se descubrió que las etiquetas se cortaban en **v1.38.0** con el sistema en
  v1.48.0 —doce versiones sin etiquetar— y que `ACTUALIZAR.md` mandaba instalar
  `#v1.48.0`, que **no existía**. Nadie podía actualizar y nada lo comprobaba.
  Mismo defecto que la lista de componentes del empaquetador y que la lista de
  candados de aquí arriba: **un paso que depende de acordarse.**

  El publicador **se niega** si el árbol está sucio, si `HEAD` no coincide con
  `origin/main`, o si la etiqueta ya existe apuntando a otro commit. Eso último
  no se resuelve moviendo la etiqueta —una etiqueta movida entrega cosas
  distintas según cuándo se baje, que es el defecto abierto de `v1.10.5`—: se
  sube de versión.
- En este proyecto **se commitea y se hace push al avanzar** — no se espera a que
  el usuario lo pida.
- **Antes de cada commit, revisa el diff.** Si aparece `.env`, una clave o una
  credencial, **aborta**.
- Commits atómicos y mensaje que explique **por qué**, no solo qué.
- No metas archivos generados que ya estén en `.gitignore`.

---

## 9 · Definición de terminado

Una tarea no está hecha hasta que:

- Se verificó **con una herramienta**, no «debería funcionar».
- El candado de contraste sale en verde.
- No quedan artefactos temporales sueltos.
- Lo que no se pudo verificar **se declara explícitamente**.

**Cero invención.** Ninguna cifra, contraste ni versión sin comprobarla. Si una
herramienta no da el dato, se dice — no se rellena con lo que parece razonable.

Una prueba que no se ha visto fallar no protege nada: rómpela a propósito, mírala
en rojo, reviértela.

---

## 10 · Estado

La tabla de módulos que vivía aquí **se quedaba vieja entre versiones** —llegó
a decir «Componentes: pendiente» con 23 publicados y «Docker sin autorizar» con
la autorización ya permanente—. Un registro desfasado es peor que ninguno,
porque se lee como si fuera cierto. El estado por módulo vive en
[`memoria/01-estado.md`](memoria/01-estado.md), que se reescribe entero con
cada cambio; aquí solo queda lo que no cambia: las correcciones históricas de
abajo.

### Correcciones aplicadas sobre MMI-DS v1.0.0

v1.0.0 declara «26 pares verificados, cero fallos». Al verificar los 46 que exige
la composición base (§5.1) aparecieron dos tokens fuera de norma. Ninguno estaba
entre los 26 originales:

| Token | Antes | Ahora | Medido | Norma |
|---|---|---|---|---|
| `borde-campo` | `#C8C6C4` | `#8B8985` | 1,70:1 → **3,48:1** | SC 1.4.11 |
| `texto-pista` | `#8B8985` | `#6A6864` | 3,49:1 → **5,55:1** | SC 1.4.3 |

El contorno de los campos a 1,70:1 era imperceptible: los inputs no se distinguían
del fondo.

En `texto-pista`, el gris más claro que alcanza 4,5:1 queda a **1,06:1** de
`texto-secundario` — indistinguible. La jerarquía del placeholder no se puede
expresar con color sin incumplir AA, así que pasó a regla de composición:
**etiqueta siempre visible, placeholder solo como ejemplo de formato.**
