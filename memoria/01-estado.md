# Estado del proyecto

**Última actualización:** 7 de agosto de 2026
**Versión del sistema:** MMI-DS v1.1.0 — color modo claro bloqueado

---

## Qué está hecho y verificado

| Módulo | Estado | Cómo se comprobó |
|---|---|---|
| Motor de tokens | ✅ | `node sistema/tokens/generar.mjs` — 46 pares, 0 fallos |
| Contrato `paleta.lock.json` | ✅ | Generado desde `fuente.mjs`, no editado a mano |
| Candado de contraste | ✅ | Ejecutado en verde **y saboteado a propósito**: lo detectó, salió con código 1 |
| Candado de lint | ⚠️ escrito | **No ejecutado.** Requiere `npm`/Docker, aún sin autorizar |
| Manual de aplicaciones web | ✅ | `manual/MANUAL-APLICACIONES-WEB.md` |
| Repositorio y `.gitignore` | ✅ | Probado con PNG, PDF, `.env`, `.zip`, `node_modules`: todos bloqueados |

## Qué NO está hecho

| Módulo | Por qué |
|---|---|
| Componentes | Sin Docker no se puede compilar ni verificar nada de React |
| Catálogo `/diseño` | Depende de los componentes |
| Contenedor y ZIP | **Docker sin autorizar** |
| Iconografía | Decidido Lucide; sin implementar |

## Lo que no se ha podido verificar — declarado

- **El candado de lint nunca se ha ejecutado.** Los patrones están escritos y
  razonados, pero ESLint no ha corrido ni una vez. Puede tener errores de sintaxis
  en los selectores. **No lo des por bueno.**
- **Ningún componente React se ha compilado.** No hay `node_modules`.

---

## Números verificados

No los repitas de memoria: regenéralos.

```
Tokens semánticos          38
Escalas primitivas          4  (azul, rojo, oro, gris cálido — 10-11 pasos cada una)
Colores de marca            4  (fuera del sistema)
Pares de contraste         46
  bloqueantes              35
  informativos             11
Fallos                      0
```

Se obtienen con:

```bash
node sistema/candado/verificar-contraste.mjs
```

---

## Repositorio

- **`solwarehz/sistema-diseno`** · privado
- Rama de trabajo: **`feat/sistema-base-v1`**
- `main` existe pero **no se toca**
- Commit y push al avanzar, sin esperar a que el usuario lo pida
- Los binarios de diseño (`*.png`, `*.pdf`, `*.ai`, `*.psd`) **no suben**: son
  propiedad del cliente
