# Al clonar en otra máquina

Qué falta, por qué falta, y cómo conseguirlo. **Nada de esto es un error del
repositorio.**

---

## 1 · Comprueba que el sistema está sano

```bash
node sistema/tokens/generar.mjs
node sistema/candado/verificar-contraste.mjs
node sistema/candado/verificar-cascada.mjs
```

Debe salir **178 pares, 138 bloqueantes, 0 fallos** y el candado de la cascada
sin fallos a los once anchos. Si algo falla, **para y avisa**: alguien cambió un
color sin regenerar el contrato, o una regla de la hoja que viaja dejó de ganar.
No trabajes encima.

Esto **no necesita instalar nada**: es cálculo puro con el `node` que ya haya.

Los ocho candados completos, que son los que hay que pasar antes de subir a
`main`, están listados en [`01-estado.md`](01-estado.md) y en
[`../CLAUDE.md`](../CLAUDE.md) §8.

---

## 2 · Lo que no viene en el clon

### `marca/02_identidad/` está vacía — es correcto

`.gitignore` excluye los binarios de diseño porque son **propiedad del cliente**.

Los activos viven en **`imagenes/`** y están excluidos por `.gitignore`.

| Archivo | Para qué | Cómo se consigue |
|---|---|---|
| `imagenes/AE.png` | Escudo. Menú plegado | **Pedírselo al usuario** |
| `imagenes/AE-nombre-horizontal.png` | Lockup. Menú desplegado | **Pedírselo al usuario** |
| `AE-nombre-vertical.png` | Sin usar todavía | Pedírselo al usuario |
| `TIPOGRAFIA-web-y-sistema.png` | Espécimen | Pedírselo al usuario |

Sin ellos el cascarón **no falla**: cae al marcador de posición punteado.

No los busques en `~/Downloads` ni en ninguna otra carpeta: **no se puede salir de
la carpeta del proyecto**. Se piden y el usuario los manda.

**No inventes un activo que falte.** Y no recortes el escudo del lockup: produce
bordes sucios y proporciones que no son las del original. Si falta, el catálogo
muestra un marcador de posición explícito.

### `node_modules/` no viene

Se instala **dentro del contenedor**, en un volumen con nombre. Nunca `npm install`
en la máquina del usuario.

**Docker requiere autorización expresa, cada vez.** No está cubierto por el permiso
general de trabajar en la carpeta.

---

## 3 · Dos activos que no existen en ninguna parte

No los busques: **nunca se han creado**. Son trabajo de diseñador.

**El escudo suelto ya existe** — `imagenes/AE.png`, 1063×1291 con alfa. Cierra
el hueco que MMI-DS §10 daba por perdido.

**El isotipo simplificado** (§8.6). Bajo 56px, «COLEGIO» y «HUARAZ» son ilegibles
dentro del escudo. Para el marco a 40px y el favicon a 16px **no hay activo
válido**. No se resuelve escalando: se resuelve dibujando.

---

## 4 · Un defecto de identidad abierto

MMI-DS §8.5: el escudo usa `#E30613` y el lockup «ALBERT EINSTEIN» usa `#EC2027`.
**Son dos rojos distintos en la misma identidad.**

El sistema adopta `#E30613` como `marca-rojo` porque el escudo es el elemento
primario. La corrección del lockup es trabajo del diseñador y sigue pendiente.

---

## 5 · Antes de tocar nada

- Lee [`../CLAUDE.md`](../CLAUDE.md) — límites de la máquina y flujo de git.
- Lee [`02-decisiones.md`](02-decisiones.md) antes de cambiar algo ya decidido.
- `git pull` antes de empezar. Trabajan varios agentes.
- Nunca `git checkout` ni `git stash` sobre el árbol compartido.
