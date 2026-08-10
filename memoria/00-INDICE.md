# Memoria del proyecto

Estos archivos **viajan con el repositorio**. La memoria del agente vive en
`~/.claude` y no se clona: por eso lo que importa recordar está aquí.

Léelos en orden la primera vez que abras el proyecto en una máquina.

| Archivo | Qué contiene | Cuándo leerlo |
|---|---|---|
| [`01-estado.md`](01-estado.md) | Qué está hecho, qué verificado, qué no | Al empezar cualquier sesión |
| [`02-decisiones.md`](02-decisiones.md) | Cada decisión con su porqué y qué la revertiría | Antes de cambiar algo que ya está decidido |
| [`03-al-clonar.md`](03-al-clonar.md) | Qué falta tras un `git clone` y cómo conseguirlo | En una máquina nueva |
| [`04-pendientes.md`](04-pendientes.md) | Lo que falta, ordenado por retorno | Al elegir en qué trabajar |
| [`05-fases.md`](05-fases.md) | El plan por fases y qué necesita cada una | Al planificar |
| [`06-cobertura.md`](06-cobertura.md) | Qué elementos hay y cuáles faltan | Antes de crear un componente |
| [`../peticiones/`](../peticiones/) | Lo que pide cada proyecto y qué se respondió | Cuando llegue un requerimiento |
| [`../auditorias/`](../auditorias/) | Auditorías estrictas con sus hallazgos | Antes de dar algo por sano |

Las reglas de operación —límites de la máquina, flujo de git, definición de
terminado— están en [`../CLAUDE.md`](../CLAUDE.md), que se carga solo.

---

## Los tres documentos y para qué sirve cada uno

No los confundas: se corrigen en direcciones distintas.

| Documento | Responde a | Autoridad |
|---|---|---|
| `SISTEMA-DE-DISENO.md` (MMI-DS) | **Por qué** el sistema es así | La más alta. Manda sobre los otros dos |
| `manual/MANUAL-APLICACIONES-WEB.md` | **Qué hacer** al construir una pantalla | Se corrige cuando cambia el sistema |
| `CLAUDE.md` | **Cómo trabajar** en este repositorio | Reglas de operación, no de diseño |

Si dos se contradicen, gana el de arriba y el otro se corrige **en el mismo
commit**. Nunca se deja la contradicción viva.

El manual en Markdown es la **fuente** de la versión en Word. Se edita el `.md` y
se regenera el Word, nunca al revés.
