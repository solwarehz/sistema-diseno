# Sistema de diseño web — Colegio Albert Einstein

Implementación ejecutable del documento **MMI-DS**. Tokens de color verificados
contra WCAG 2.2 AA, candado que falla el build si alguien los rompe, y un
cascarón navegable para revisar y aprobar.

**Versión 1.2.0** · 70 pares de contraste bloqueantes en dos modos · 0 fallos

---

## Ver el cascarón

### Lo más rápido — sin instalar nada

`cascaron/index.html` es **autocontenido**: un solo archivo, sin dependencias.
Ábrelo con doble clic.

```bash
open cascaron/index.html          # macOS
xdg-open cascaron/index.html      # Linux
start cascaron\index.html         # Windows
```

> Lo único que pide a la red son las fuentes IBM Plex desde Google Fonts. Sin
> internet se ve igual, con la tipografía del sistema.

### Servido en contenedor — nada se instala en tu máquina

```bash
docker run --rm -d --name mmi-cascaron -p 127.0.0.1:8080:80 -v "$PWD/cascaron":/usr/share/nginx/html:ro nginx:alpine
```

Luego entra a **http://127.0.0.1:8080**. Para pararlo:

```bash
docker rm -f mmi-cascaron
```

El puerto se publica **solo en `127.0.0.1`**: no queda expuesto a tu red ni a
internet. El montaje es de **solo lectura**.

---

## Comprobar que el sistema está sano

```bash
node sistema/candado/verificar-contraste.mjs
```

Debe decir **0 fallos**. Si falla, alguien cambió un color sin regenerar el
contrato: para y avisa, no trabajes encima.

No instala nada: es cálculo puro.

---

## Cambiar un color

Hay **un solo** sitio donde se escribe un valor: `sistema/tokens/fuente.mjs`.
Todo lo demás se genera.

```bash
# 1 · editar sistema/tokens/fuente.mjs
# 2 · subir VERSION
node sistema/tokens/generar.mjs              # contrato + CSS + preset
node sistema/candado/verificar-contraste.mjs # debe salir en verde
node sistema/cascaron/generar-cascaron.mjs   # rehace la página
```

**Nunca edites a mano** `paleta.lock.json`, `tokens.css` ni `tailwind-preset.ts`.
Son generados y el verificador detecta la edición manual.

---

## Qué hay aquí

```
sistema/tokens/     fuente única de color, contrato, CSS y preset de Tailwind 3.4
sistema/candado/    verificador de contraste y reglas de ESLint
sistema/cascaron/   generador de la página de revisión
cascaron/           la página, autocontenida
manual/             manual de marca para aplicaciones web
memoria/            estado, decisiones, fases y qué falta tras un clon
marca/02_identidad/ activos de identidad (vacío en el repo, ver abajo)
```

---

## Qué NO viene en el clon

`.gitignore` excluye los binarios de diseño porque **son propiedad del cliente**.
Ver `marca/02_identidad/LEEME.md`.

| Falta | Cómo se consigue |
|---|---|
| `AE-nombre-horizontal.png` · `AE-nombre-vertical.png` | Pedírselos al usuario |
| `TIPOGRAFIA-web-y-sistema.png` | Pedírselo al usuario |
| **`AE-escudo-*.png`** | **No existe.** Trabajo de diseñador |
| **Isotipo simplificado** | **No existe.** Sin él no hay favicon válido |

Por eso el cascarón muestra el escudo como **marcador punteado**. No se recorta
del lockup: produce bordes sucios y proporciones falsas.

---

## Antes de tocar nada

Lee [`CLAUDE.md`](CLAUDE.md) —límites de trabajo y flujo de git— y
[`memoria/00-INDICE.md`](memoria/00-INDICE.md) —estado real, decisiones con su
porqué, y las ocho fases.

**Estado: fase 1 (color y casos de uso) esperando aprobación.**

---

## Documentos y quién manda sobre quién

| Documento | Responde a |
|---|---|
| `SISTEMA-DE-DISENO.md` (MMI-DS) | **Por qué** el sistema es así. Manda sobre los otros |
| `manual/MANUAL-APLICACIONES-WEB.md` | **Qué hacer** al construir una pantalla |
| `CLAUDE.md` | **Cómo trabajar** en este repositorio |

Si dos se contradicen, gana el de arriba y el otro se corrige **en el mismo
commit**. Nunca se deja la contradicción viva.

El manual en Markdown es la fuente de la versión en Word: se edita el `.md` y se
regenera el Word, nunca al revés.
