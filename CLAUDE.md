# CLAUDE.md — Sistema de diseño Colegio Albert Einstein

**Lee esto completo antes de tocar nada.** Viaja con el repositorio: es lo primero que ve cualquier
agente que clone en una máquina nueva. **Después lee [`memoria/`](memoria/00-INDICE.md)** (estado real,
decisiones con su porqué, qué falta tras un clon): la memoria del agente vive en `~/.claude` y no se
clona. La historia que se quitó de aquí está en
[`memoria/08-texto-retirado-de-claude-md.md`](memoria/08-texto-retirado-de-claude-md.md).

## 1 · Qué es este repositorio

La implementación ejecutable de `SISTEMA-DE-DISENO.md` (**MMI-DS**), el sistema de diseño web del
Colegio Albert Einstein, Huaraz. El documento es la **especificación**; esto es el **código**. Si
discrepan, gana el de versión más alta y se corrige el otro en el mismo commit.

**Estado actual: v1.152.0** — R168: `PanelPrivilegios` pliega sus módulos en matriz y lista, dibuja un título vacío como título, resume solo lo concedido y admite icono por columna (SPEC 06).
El detalle vive en [`memoria/01-estado.md`](memoria/01-estado.md); **este número es lo único que se toca aquí**.

## 2 · Lo primero al abrir sesión

```bash
git branch --show-current              # debe ser `work` o una rama que salió de ella (§8)
git pull --ff-only
node sistema/tokens/generar.mjs
node sistema/candado/verificar-contraste.mjs
```

Si el verificador falla, **para y avisa**: alguien cambió un color sin regenerar el contrato, o el
contrato miente. Nunca uses `git checkout` ni `git stash` sobre el árbol: trabajan varios agentes y te
llevarías trabajo ajeno. Para ramas temporales, `git switch -c`; para revertir, edición inversa.

## 3 · Límites de la máquina — no negociables

- ✅ Escribir, leer y ejecutar **dentro de la carpeta del proyecto**. ❌ **No salir de ella** (ni
  `~/Downloads`, ni `~/Documents`): si necesitas un archivo de fuera, **pídelo por el chat**.
- ❌ **No instalar nada en la máquina** (ni node global, ni fuentes, ni Homebrew).
- ✅ **Docker autorizado de forma permanente** (2026-08-10): contenedores, volúmenes e imágenes de este
  repositorio, nada fuera. El comando lleva guion: `docker-compose`.
- ❌ **Nunca borres un archivo del usuario sin permiso explícito**; autorizado, va a la papelera.

Un cambio en la máquina se autoriza **una vez, itemizado y por adelantado**. Las decisiones técnicas
de dentro de la carpeta **se toman y se reportan**; solo se consultan reglas de negocio y cambios en la máquina.

## 4 · Qué NO está en el repositorio

`.gitignore` excluye los binarios de diseño porque **son propiedad del cliente**; `marca/02_identidad/`
trae solo un `LEEME.md` y **es lo correcto**. `AE-nombre-horizontal.png`, `AE-nombre-vertical.png` y
`TIPOGRAFIA-web-y-sistema.png` se piden al usuario por el chat; `node_modules/` sale de
`docker-compose up`, nunca de `npm install`. **No inventes los activos que falten ni recortes el
escudo del lockup**: el catálogo muestra un marcador. Son trabajo de **diseñador**, no de código: el
escudo suelto (`AE-escudo-*.png`) y el isotipo simplificado (§8.6; bajo 56 px el escudo es ilegible).
Defecto abierto (§8.5): el escudo usa `#E30613` y el lockup `#EC2027`; el sistema adopta `#E30613`.

## 4ter · El registro de requerimientos no es del agente

Los `R###` los numera el equipo que pide. El agente **no acuña números** (el «R118» inventado el
2026-09-09 chocó con el real). Sin requerimiento detrás, se describe por lo que hace y por la versión;
la concordancia está en `sistema/componentes/comportamiento.md`.

## 4bis · Móvil primero — política de diseño (usuario, 2026-09-19)

- **Lo estrecho es el caso por omisión.** Se diseña para el teléfono y se **gana** con el ancho; si el
  componente decide su forma en ejecución, el estado inicial es el de móvil.
- **Nada obliga a deslizar en horizontal para leer.** Deslizar solo vale como forma (un tablero que se
  pasa como páginas) con tres condiciones: alcanzable con teclado, dice dónde estás y cuántas paradas
  hay, y nada queda solo ahí (política de creación §5).
- **Ningún texto queda cortado sin forma de leerlo entero, y `title` NO basta en un teléfono.** Primero
  no recortar (envolver, apilar); si hay que recortar, el texto entero debe ser alcanzable sin puntero.
- **Se verifica midiendo, no mirando:** a **360 px** como mínimo (no solo a 390) y en navegador.
- **En la hoja:** la regla base es la estrecha, fuera de toda `@media`; lo ancho entra con `min-width`.
  No se copian las `max-width` heredadas. **No hay `@container`** y no se introduce sin más (los
  candados de promesa, empate y muerta solo manejan `@media`); el ancho de un contenedor se mide en JS.
- **Evitar:** dar por buena la pantalla porque cabe la pieza; una letra, sigla o icono como única
  información (`aria-label` no sirve a quien ve «P»: hace falta leyenda visible); recortar o deslizar
  lo que puede envolver; escribir lo estrecho como excepción.
- **Un precedente se lee, no se cita de memoria** (cuenta con `grep -c`). Que el equipo no lo pida **no
  lo saca de la política**.

## 4bis-2 · Color y componentes (usuario)

**Ningún color autorizado más sin autorización:** ampliar el panel de escalas lo decide el usuario.
*Nombrar* es libre: un valor sin uso entra en la familia `marca` (conocida, **no** autorizada) para
que el candado lo vigile. Un hex documentado como **valor probado y rechazado, con su medición**, no se
sustituye. **Todo componente nuevo se compone, no se reconstruye:** se usan los ya creados · los
colores autorizados · si falta uno se crea · con el conjunto se crean los siguientes. Vinculante:
[`sistema/componentes/POLITICA-DE-CREACION.md`](sistema/componentes/POLITICA-DE-CREACION.md).
**Todo diseño o mejora visual se consulta primero con la skill `frontend-design`** (usuario, 2026-11-01): se invoca
antes de proponer o escribir la interfaz. La skill **aconseja**; las reglas de este archivo (tokens, colores
autorizados, móvil primero, componer) **mandan** si chocan con ella.

## 5 · Cómo se cambia un color

**Un solo** sitio donde se escribe un valor: `sistema/tokens/fuente.mjs`. Todo lo demás se genera.
Edita, sube `VERSION` (todo cambio exige versión nueva), y corre `node sistema/tokens/generar.mjs` y
`node sistema/candado/verificar-contraste.mjs` (0 fallos). **Nunca edites a mano** `paleta.lock.json`,
`tokens-light.css`, `tailwind-preset.ts` ni `sistema/componentes/componentes.css`: son **generados**
(el último lo extrae `extraer.mjs` del catálogo; el CSS se escribe en la plantilla de
`sistema/cascaron/generar-cascaron.mjs`). Un token nuevo va también en `grupos` de `generar.mjs`. Si
tu cambio hace fallar el candado, **el candado tiene razón**.

## 6 · Reglas que el código hace cumplir

`sistema/candado/candado.eslint.config.mjs` prohíbe, con fallo de build: hex crudo, `rgb()`, `hsl()` ·
`bg-[#fff]` y arbitrarios, `text-[Npx]` (solo los pasos de la escala) · `outline-none` (con teclado te
pierdes) · primitivas en componentes · `marca-amarillo`/`marca-celeste` (1,2:1 y 2,6:1: no admiten
texto) · `font-thin/light/extrabold/black` (cuatro pesos) · el atributo `style` en línea. Lo que no
pasa por el token, el candado no lo protege. `app/diseno/**` está exento: exhibe la paleta.

## 7 · Cuatro cosas que el documento prohíbe (§9) — no las «mejores» por iniciativa

1. **No montar Storybook:** el catálogo es `/diseño` y no puede divergir.
2. El modo oscuro **está aprobado** (2026-08-09) y es superficie mantenida: **198 pares, 158
   bloqueantes, 79 por modo**; ninguna versión sube con uno en rojo.
3. **No mostrar el markup interno** de los compartidos: se copia la importación y las props.
4. **No adoptar librería de componentes**, salvo primitivas accesibles para diálogo, menú y selector con búsqueda.

## 8 · Git

- Repositorio: **`solwarehz/sistema-diseno`** · privado.
- **Se trabaja solo en la rama permanente `work`.** Nunca en `main`. De `work` salen las ramas
  temporales (`feat/*`, `fix/*`, `docs/*`…) y a `work` vuelven. **La única forma de llegar a `main` en
  GitHub es un PR `work` → `main`**, venga de quien venga: nada de push directo ni de avance directo.
  Se comprueba la rama **antes de la primera edición** de una tarea.
- **`work` es permanente y siempre queda**: nunca se borra, ni local ni remota, ni al mergear un PR
  (sin «delete branch») ni para «limpiar». Solo se borran las ramas temporales ya fusionadas.
- **El merge del PR es el despliegue y se pide antes de hacerlo.** Tras mergear, `work` se sincroniza
  con `main`. **Nunca `--force`** sin permiso expreso.
- Se **commitea y se hace push al avanzar** —a `work` o sus ramas temporales—, sin esperar a que se
  pida. Commits atómicos, con mensaje que explique el **porqué**. **Antes de cada commit revisa el
  diff**: si aparece `.env`, una clave o una credencial, **aborta**. No metas lo de `.gitignore`.
- Para abrir el PR, **los veinticinco pasos en verde** y las pruebas pasando. **Son exactamente los de
  `sistema/paquete/publicar.mjs` y en su orden** (una lista incompleta es un candado abierto):

  ```bash
  node sistema/tokens/generar.mjs
  node sistema/cascaron/generar-cascaron.mjs   # el catálogo, ANTES de lo que lo lee
  node sistema/componentes/extraer.mjs         # incluye huérfanas y @keyframes
  for c in verificar-contraste verificar-tono verificar-color auditar-cascaron probar-candado \
    verificar-cascada verificar-altura verificar-contrato verificar-entrega verificar-promesa \
    verificar-elemento verificar-atributo verificar-empate verificar-forma verificar-omision \
    verificar-iconos verificar-promesa-muerta verificar-copia verificar-muerta verificar-ciegas \
    verificar-citas; do node sistema/candado/$c.mjs || break; done
  # el 25, DENTRO del contenedor (node_modules no vive aquí), y las pruebas:
  docker-compose exec -T ds sh -c 'cd /trabajo && sh sistema/candado/probar-con-eslint.sh'
  docker-compose exec -T ds sh -c "ulimit -c 0; cd componentes && npx vitest run --no-file-parallelism && npx tsc --noEmit"
  git push origin work && gh pr create --base main --head work
  ```

  Qué mira cada candado y por qué nació: [`memoria/08-texto-retirado-de-claude-md.md`](memoria/08-texto-retirado-de-claude-md.md) §B.
  Si algo sale en rojo, **no se abre el PR**: un `main` roto es un proyecto ajeno roto.
- **Subir a `main` no es publicar.** El área de sistemas instala por `npm` con etiqueta **y** por el ZIP;
  las dos deben funcionar siempre. Tras el merge, `npm run publicar` (dice qué haría) y
  `npm run publicar -- --publicar` (etiqueta + publicación con ZIP; borra los ZIP de versiones
  anteriores). Las etiquetas y publicaciones **no se tocan** (borrarlas rompe `npm install` de versiones
  viejas). El publicador **se niega** si el árbol está sucio, si `HEAD` no coincide con `origin/main` o
  si la etiqueta ya existe en otro commit: no se mueve la etiqueta, **se sube de versión**. Publicar
  requiere petición expresa.

## 9 · Definición de terminado

Una tarea no está hecha hasta que se verificó **con una herramienta** (no «debería funcionar»), el
candado de contraste sale en verde, no quedan artefactos temporales y **lo no verificado se declara**.
**Cero invención:** ninguna cifra, contraste ni versión sin comprobarla. Una prueba que no se ha visto
fallar no protege nada: rómpela a propósito, mírala en rojo, reviértela.

## 10 · Estado

El estado por módulo vive en [`memoria/01-estado.md`](memoria/01-estado.md), que se reescribe con cada
cambio; aquí solo está el número de versión (§1). Las correcciones sobre MMI-DS v1.0.0 (`borde-campo`,
`texto-pista`) están en [`memoria/08-texto-retirado-de-claude-md.md`](memoria/08-texto-retirado-de-claude-md.md) §D.

## 12. Memoria

`MEMORY.md` de la raíz es el estado del proyecto para todo agente (no el índice de memoria automática
de Claude Code). Léelo al empezar y **actualízalo siempre al terminar una tarea**: estado, decisiones
(con su porqué) y errores a evitar. Máximo ~50 líneas; nunca claves, tokens ni datos personales.
