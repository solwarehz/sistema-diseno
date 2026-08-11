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

**Estado actual: v1.44.0** — la carga de imagen centrada, y con avatar cuando
hay persona y todavía no hay foto.
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
  de sistemas. Antes de subir, los cinco candados **en verde** y las pruebas
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
  node sistema/candado/verificar-entrega.mjs  # lo publicado está en el catálogo
  node sistema/candado/verificar-promesa.mjs  # se VE igual que en el catálogo
  ```

  Los dos últimos faltaban de esta lista y **la memoria los contaba entre los
  ocho**: el 2026-08-10 pasaron un día entero sin correrse por eso, y al
  correrlos salieron en rojo los dos. Una lista incompleta de candados es un
  candado abierto.

  El de la cascada es el único que no lee lo que hay, sino lo que **falta**: el
  defecto R25 —dos iconos pintados a la vez— vivía en la ausencia de una regla,
  y por eso los otros seis no lo vieron en tres versiones.

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
