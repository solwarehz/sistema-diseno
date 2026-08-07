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

**Estado actual: v1.1.0** — color modo claro bloqueado y verificado.

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
- ⏸️ **Docker requiere autorización aparte**, cada vez. Descargar una imagen o
  levantar un contenedor no está cubierto por el permiso general.
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
2. **No hacer modo oscuro.** Los valores están calculados pero **no aprobados**.
   Duplica la superficie de prueba de contraste. Ese esfuerzo rinde más en densidad.
3. **No mostrar el markup interno de los componentes compartidos.** Lo que se
   copia es **la importación y las props**. Copiar utilidades de Tailwind aplica
   solo a composiciones puntuales.
4. **No adoptar librería de componentes en general.** Sí primitivas accesibles
   para exactamente tres casos: diálogo, menú y **selector con búsqueda**. El
   patrón `combobox` de ARIA escrito a mano produce fallos sistemáticos.

---

## 8 · Git

- Repositorio: **`solwarehz/sistema-diseno`** · privado.
- Se trabaja en ramas **`feat/*`**. **Nadie toca `main`.**
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

| Módulo | Estado |
|---|---|
| Motor de tokens | ✅ v1.1.0 · 46 pares, 35 bloqueantes, 0 fallos |
| Candado de contraste | ✅ verificado, probado en fallo |
| Candado de lint | ✅ escrito · sin ejecutar (falta Docker) |
| Componentes | ⏳ pendiente |
| Catálogo `/diseño` | ⏳ pendiente |
| Manual de aplicaciones web | ✅ `manual/MANUAL-APLICACIONES-WEB.md` |
| Contenedor y ZIP | ⏳ pendiente · Docker sin autorizar |
| Iconografía | ⏳ §8.1 — decidido Lucide, sin implementar |
| Modo oscuro | ⛔ calculado, **no aprobado**. No implementar |

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
