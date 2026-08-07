# Al clonar en otra máquina

Qué falta, por qué falta, y cómo conseguirlo. **Nada de esto es un error del
repositorio.**

---

## 1 · Comprueba que el sistema está sano

```bash
node sistema/tokens/generar.mjs
node sistema/candado/verificar-contraste.mjs
```

Debe salir **46 pares, 0 fallos**. Si falla, para y avisa: alguien cambió un color
sin regenerar el contrato. No trabajes encima.

Esto **no necesita instalar nada**: es cálculo puro con el `node` que ya haya.

---

## 2 · Lo que no viene en el clon

### `marca/02_identidad/` está vacía — es correcto

`.gitignore` excluye los binarios de diseño porque son **propiedad del cliente**.

| Archivo | Cómo se consigue |
|---|---|
| `AE-nombre-horizontal.png` | **Pedírselo al usuario por el chat** |
| `AE-nombre-vertical.png` | **Pedírselo al usuario por el chat** |
| `TIPOGRAFIA-web-y-sistema.png` | **Pedírselo al usuario por el chat** |

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

**El escudo suelto.** MMI-DS §10 lista `AE-escudo-*.png` de 32 a 1024px. No
existen. El escudo solo está incrustado dentro de los lockups. Lo necesitan el
marco (32px), la landing (48px y 96px) y el panel de marca.

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
