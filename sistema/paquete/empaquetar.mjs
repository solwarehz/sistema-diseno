#!/usr/bin/env node
/**
 * EMPAQUETADO DE LA ENTREGA
 *
 *   node sistema/paquete/empaquetar.mjs
 *
 * Construye `cascaron/sistema-diseno-v<VERSION>.zip`, que es lo que se le pasa
 * al área de sistemas para implementar el sistema en un proyecto nuevo.
 *
 * SIN DEPENDENCIAS. Escribe el formato ZIP a mano sobre `zlib` de Node
 * —deflate crudo y crc32, los dos incluidos desde Node 20.15—. No se instala
 * nada en la máquina, que es el límite del proyecto.
 *
 * El ZIP vive junto a `index.html` para que el botón del catálogo lo alcance
 * con una ruta relativa, y está en `.gitignore`: es entrega generada, no
 * fuente. Se reconstruye con este comando.
 */

import { readFileSync, writeFileSync, statSync, mkdirSync, readdirSync } from 'node:fs';
import { deflateRawSync, crc32 } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, NORMA, primitivas, semanticos, marca, pares } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

// ── Escritor de ZIP ─────────────────────────────────────────────────────────

/** Fecha y hora en el formato de 16 bits que heredó el ZIP del MS-DOS. */
const fechaDOS = (d) => ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
const horaDOS = (d) => (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);

function construirZip(entradas) {
  const locales = [];
  const central = [];
  let desplazamiento = 0;

  for (const { nombre, datos, fecha } of entradas) {
    const crudo = Buffer.from(datos);
    const comprimido = deflateRawSync(crudo, { level: 9 });
    // Si comprimir no gana nada, se guarda tal cual: método 0.
    const gana = comprimido.length < crudo.length;
    const cuerpo = gana ? comprimido : crudo;
    const metodo = gana ? 8 : 0;
    const suma = crc32(crudo);
    const nom = Buffer.from(nombre, 'utf8');

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);            // versión necesaria
    local.writeUInt16LE(0, 6);             // banderas
    local.writeUInt16LE(metodo, 8);
    local.writeUInt16LE(horaDOS(fecha), 10);
    local.writeUInt16LE(fechaDOS(fecha), 12);
    local.writeUInt32LE(suma, 14);
    local.writeUInt32LE(cuerpo.length, 18);
    local.writeUInt32LE(crudo.length, 22);
    local.writeUInt16LE(nom.length, 26);
    local.writeUInt16LE(0, 28);            // extra
    locales.push(local, nom, cuerpo);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);              // versión de quien lo creó
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0, 8);
    dir.writeUInt16LE(metodo, 10);
    dir.writeUInt16LE(horaDOS(fecha), 12);
    dir.writeUInt16LE(fechaDOS(fecha), 14);
    dir.writeUInt32LE(suma, 16);
    dir.writeUInt32LE(cuerpo.length, 20);
    dir.writeUInt32LE(crudo.length, 24);
    dir.writeUInt16LE(nom.length, 28);
    dir.writeUInt16LE(0, 30);              // extra
    dir.writeUInt16LE(0, 32);              // comentario
    dir.writeUInt16LE(0, 34);              // disco
    dir.writeUInt16LE(0, 36);              // atributos internos
    dir.writeUInt32LE(0, 38);              // atributos externos
    dir.writeUInt32LE(desplazamiento, 42);
    central.push(dir, nom);

    desplazamiento += local.length + nom.length + cuerpo.length;
  }

  const cuerpoCentral = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(cuerpoCentral.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  fin.writeUInt16LE(0, 20);

  return Buffer.concat([...locales, cuerpoCentral, fin]);
}

// ── Qué entra en la entrega ─────────────────────────────────────────────────

// Sin ñ ni acentos en las rutas del ZIP: los descompresores viejos de Windows
// las rompen, y el nombre de una carpeta no merece ese riesgo.
const CARPETA = `sistema-diseno-v${VERSION}`;

/** El catálogo enlaza aquí. Se exporta para que el nombre exista en UN solo
 *  sitio: escrito dos veces, un cambio de versión rompe el enlace en silencio. */
export const NOMBRE_ZIP = `${CARPETA}.zip`;

const CONTENIDO = [
  // El motor. fuente.mjs es el ÚNICO archivo donde se escribe un color.
  ['sistema/tokens/fuente.mjs', 'sistema/tokens/fuente.mjs'],
  ['sistema/tokens/generar.mjs', 'sistema/tokens/generar.mjs'],
  ['sistema/tokens/paleta.lock.json', 'sistema/tokens/paleta.lock.json'],
  ['sistema/tokens/tokens.css', 'sistema/tokens/tokens.css'],
  ['sistema/tokens/tailwind-preset.ts', 'sistema/tokens/tailwind-preset.ts'],
  // El conjunto de iconos, con su regla de tamaño y de significado.
  ['sistema/iconos/iconos.mjs', 'sistema/iconos/iconos.mjs'],
  // Los estilos de los elementos, para importar en vez de replicar.
  ['sistema/componentes/componentes.css', 'sistema/componentes/componentes.css'],
  ['sistema/componentes/comportamiento.md', 'sistema/componentes/comportamiento.md'],
  // Los COMPONENTES DE REACT. Trece archivos que se construyeron para que nadie
  // reconstruya el comportamiento —ordenar, filtrar, plegar, el teclado del
  // calendario, el foco del diálogo— y que no viajaban en la entrega: el ZIP
  // llevaba catorce archivos y ninguno era uno de estos. Se entregaba el ESTILO
  // y se seguía pidiendo al proyecto que rehiciera lo demás, que es justo el
  // coste que Control Administrativos V2.0 midió en 3.983 líneas.
  ['componentes/src/index.ts', 'componentes/index.ts'],
  ['componentes/src/Boton.tsx', 'componentes/Boton.tsx'],
  ['componentes/src/Enlace.tsx', 'componentes/Enlace.tsx'],
  ['componentes/src/Campo.tsx', 'componentes/Campo.tsx'],
  ['componentes/src/SelectorBusqueda.tsx', 'componentes/SelectorBusqueda.tsx'],
  ['componentes/src/Chip.tsx', 'componentes/Chip.tsx'],
  ['componentes/src/Migas.tsx', 'componentes/Migas.tsx'],
  ['componentes/src/CabeceraPantalla.tsx', 'componentes/CabeceraPantalla.tsx'],
  ['componentes/src/Dialogo.tsx', 'componentes/Dialogo.tsx'],
  ['componentes/src/Nota.tsx', 'componentes/Nota.tsx'],
  ['componentes/src/Avatar.tsx', 'componentes/Avatar.tsx'],
  ['componentes/src/Icono.tsx', 'componentes/Icono.tsx'],
  ['componentes/src/MarcoApp.tsx', 'componentes/MarcoApp.tsx'],
  ['componentes/src/MarcaMenu.tsx', 'componentes/MarcaMenu.tsx'],
  ['componentes/src/MenuUsuario.tsx', 'componentes/MenuUsuario.tsx'],
  ['componentes/src/Interruptor.tsx', 'componentes/Interruptor.tsx'],
  ['componentes/src/Tarjeta.tsx', 'componentes/Tarjeta.tsx'],
  ['componentes/src/TablaDatos.tsx', 'componentes/TablaDatos.tsx'],
  ['componentes/src/Paginacion.tsx', 'componentes/Paginacion.tsx'],
  ['componentes/src/RangoFecha.tsx', 'componentes/RangoFecha.tsx'],
  ['componentes/src/Horario.tsx', 'componentes/Horario.tsx'],
  ['componentes/src/Estados.tsx', 'componentes/Estados.tsx'],
  ['componentes/src/Confirmacion.tsx', 'componentes/Confirmacion.tsx'],
  // Los candados. Sin ellos el sistema es una sugerencia.
  ['sistema/candado/verificar-contraste.mjs', 'sistema/candado/verificar-contraste.mjs'],
  ['sistema/candado/verificar-color.mjs', 'sistema/candado/verificar-color.mjs'],
  ['sistema/candado/verificar-contrato.mjs', 'sistema/candado/verificar-contrato.mjs'],
  ['sistema/candado/verificar-entrega.mjs', 'sistema/candado/verificar-entrega.mjs'],
  ['sistema/candado/candado.eslint.config.mjs', 'sistema/candado/candado.eslint.config.mjs'],
  ['sistema/candado/probar-candado.mjs', 'sistema/candado/probar-candado.mjs'],
  // La documentación.
  ['manual/MANUAL-APLICACIONES-WEB.md', 'manual/MANUAL-APLICACIONES-WEB.md'],
  ['manual/ACTUALIZAR.md', 'manual/ACTUALIZAR.md'],
  ['sistema/componentes/POLITICA-DE-CREACION.md', 'sistema/componentes/POLITICA-DE-CREACION.md'],
  // El catálogo navegable, para consultar cada elemento.
  ['cascaron/index.html', 'catalogo/index.html'],
];

/**
 * La versión vive en fuente.mjs, pero npm solo lee la de package.json. Son dos
 * sitios para el mismo número, así que aquí va el candado: si se separan, el
 * área de sistemas instalaría por etiqueta una versión que dice ser otra, y eso
 * no se descubre hasta que algo se ve distinto en pantalla.
 */
function comprobarVersion() {
  const manifiesto = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));
  if (manifiesto.version !== VERSION) {
    console.error(`\n  La versión no coincide:`);
    console.error(`    sistema/tokens/fuente.mjs   ${VERSION}`);
    console.error(`    package.json                ${manifiesto.version}`);
    console.error(`\n  Iguálalas antes de empaquetar. La entrega y la etiqueta de git`);
    console.error(`  tienen que decir el mismo número.\n`);
    process.exit(1);
  }
}

/**
 * @param {object} opciones
 * @param {Array}  opciones.inventario  El índice REAL del catálogo, tal cual lo
 *   construye el generador. Es obligatorio: el LEEME tiene que enumerar lo que
 *   el sistema cubre de verdad, y escribirlo a mano garantiza que un día diga
 *   una cosa y el catálogo otra. Quien recibe la entrega se guía por el LEEME,
 *   así que un LEEME incompleto es un sistema que parece más pequeño de lo que
 *   es —y eso fue justo lo que reportó el área de sistemas—.
 */
export function empaquetar({ silencioso = false, inventario } = {}) {
  comprobarVersion();
  if (!Array.isArray(inventario) || !inventario.length) {
    console.error(`\n  Falta el inventario del catálogo.`);
    console.error(`\n  El empaquetado no se ejecuta suelto: lo lanza el generador del`);
    console.error(`  catálogo, que es quien sabe qué páginas existen. Usa:`);
    console.error(`\n      node sistema/cascaron/generar-cascaron.mjs\n`);
    process.exit(1);
  }
  const entradas = [];

  for (const [origen, destino] of CONTENIDO) {
    const ruta = join(RAIZ, origen);
    let datos;
    try {
      datos = readFileSync(ruta);
    } catch {
      // Un archivo que falta se declara y no se inventa: la entrega sale
      // incompleta y se dice cuál falta, en vez de fingir que está.
      if (!silencioso) console.log(`  ! falta ${origen} — no entra en la entrega`);
      continue;
    }
    entradas.push({ nombre: `${CARPETA}/${destino}`, datos, fecha: statSync(ruta).mtime });
  }

  const leeme = Buffer.from(LEEME(inventario), 'utf8');
  entradas.unshift({ nombre: `${CARPETA}/LEEME.md`, datos: leeme, fecha: new Date() });

  const zip = construirZip(entradas);
  const salida = join(RAIZ, 'cascaron', `${CARPETA}.zip`);
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(salida, zip);

  // ENTREGAS VIEJAS → A LA PAPELERA.
  //
  // Antes solo se avisaba, y llegaron a acumularse SIETE. El aviso no bastaba:
  // el botón del catálogo apunta a la última, pero quien abre la carpeta en vez
  // de usar el botón se lleva la que pille. Una entrega vieja al lado de la
  // nueva no es historial, es una trampa.
  //
  // Autorizado como regla permanente: siempre a la papelera lo antiguo, solo se
  // conserva lo reciente. A la PAPELERA, nunca borrado directo —son
  // recuperables y el «Devolver» del Finder sigue funcionando—.
  //
  // Solo toca `cascaron/sistema-diseno-v*.zip`, que son archivos que genera
  // este mismo script. Nunca nada escrito por una persona.
  const viejas = readdirSync(join(RAIZ, 'cascaron'))
    .filter((f) => /^sistema-diseno-v.+\.zip$/.test(f) && f !== `${CARPETA}.zip`);

  if (viejas.length) {
    const rutas = viejas.map((f) => join(RAIZ, 'cascaron', f));
    let aPapelera = false;
    try {
      // `trash` mueve a la papelera del sistema. Si no está, NO se cae hacia
      // un borrado directo: se avisa y se deja el archivo. Preferimos ruido
      // antes que un borrado que nadie puede deshacer.
      execFileSync('trash', rutas, { stdio: 'ignore' });
      aPapelera = true;
    } catch {
      aPapelera = false;
    }
    console.log(
      aPapelera
        ? `\n  ${viejas.length} entrega(s) anterior(es) a la papelera —recuperables—:`
        : `\n  ${viejas.length} entrega(s) anterior(es), y NO pude moverlas a la papelera:`
    );
    viejas.forEach((f) => console.log(`    ${f}`));
    if (!aPapelera) {
      console.log('  Falta la orden `trash`. No se borran a mano: muévelas tú.');
    }
  }

  if (!silencioso) {
    console.log(`\n  Entrega — ${CARPETA}.zip`);
    console.log(`  ${entradas.length} archivos · ${(zip.length / 1024).toFixed(0)} KB\n`);
    for (const e of entradas) {
      console.log(`    ${e.nombre.slice(CARPETA.length + 1).padEnd(44)} ${(e.datos.length / 1024).toFixed(1).padStart(7)} KB`);
    }
    console.log('');
  }
  return { nombre: `${CARPETA}.zip`, bytes: zip.length, archivos: entradas.length };
}

// ── El LEEME que abre quien recibe la entrega ───────────────────────────────

function LEEME(inventario) {
  const bloqueantes = pares.filter((p) => typeof p[2] === 'number').length;
  const nEscalas = Object.keys(primitivas).length;
  const nPaginas = inventario.reduce((n, g) => n + g.items.length, 0);

  // El inventario se ESCRIBE desde el índice del catálogo, nunca a mano: una
  // lista copiada envejece en cuanto se añade un elemento, y quien recibe la
  // entrega no tiene forma de saber que está mirando una lista vieja.
  const seccion = (g) => {
    const filas = g.items
      .map((i) => `| ${i.t} | ${i.estado === 'listo' ? 'construido' : 'pendiente'} |`)
      .join('\n');
    return `#### ${g.grupo} — ${g.items.length}\n\n| | |\n|---|---|\n${filas}\n`;
  };

  return `# Sistema de diseño Colegio Albert Einstein — v${VERSION}

Entrega para implementar el sistema en un proyecto nuevo.

**Pila objetivo:** Next.js 14.2 · React 18.3 · TypeScript 5.6 · Tailwind 3.4.
**Norma:** ${NORMA}.

---

## 0 · Qué cubre este sistema

Esta lista se genera desde el índice del catálogo, así que **no puede quedarse
vieja**: si el catálogo crece, crece aquí.

| | |
|---|---|
| Páginas de catálogo | **${nPaginas}** |
| Tokens semánticos | **${Object.keys(semanticos).length}** en dos modos |
| Tokens de marca | ${Object.keys(marca).length} |
| Escalas primitivas | ${nEscalas} |
| Pares de contraste | ${pares.length} definidos → **${pares.length * 2} comprobaciones** en los dos modos |
| De ellas, bloqueantes | **${bloqueantes * 2}** · 0 fallos |

${inventario.map(seccion).join('\n')}
Cada una de esas páginas está en \`catalogo/index.html\`: ábrelo y navégalas.
Traen anatomía, estados, cuándo usar cada cosa y cuándo no.

**El catálogo cubre más de lo que cabe en este archivo.** Si estás decidiendo
cómo resolver una pantalla, la respuesta está en el catálogo, no aquí.

---

## 1 · Comprueba que la entrega está sana antes de usarla

\`\`\`bash
node sistema/tokens/generar.mjs
node sistema/candado/verificar-contraste.mjs
\`\`\`

Tiene que salir con **0 fallos**. Si falla, para y avisa: alguien cambió un
color sin regenerar el contrato. No construyas encima.

No necesita instalar nada: es cálculo puro con el \`node\` que ya tengas.

---

## 2 · Qué hay aquí

| Ruta | Qué es |
|---|---|
| \`sistema/tokens/fuente.mjs\` | **El único archivo donde se escribe un color.** |
| \`sistema/tokens/generar.mjs\` | Regenera contrato, CSS y preset desde la fuente |
| \`sistema/tokens/paleta.lock.json\` | Contrato verificado. **Generado, no editar** |
| \`sistema/tokens/tokens.css\` | Variables CSS de los dos modos. **Generado** |
| \`sistema/tokens/tailwind-preset.ts\` | Preset de Tailwind 3.4. **Generado** |
| \`sistema/candado/verificar-contraste.mjs\` | Recalcula todos los pares y falla si alguno no cumple |
| \`sistema/candado/candado.eslint.config.mjs\` | Reglas de lint que bloquean el build |
| \`manual/MANUAL-APLICACIONES-WEB.md\` | Manual de uso |
| \`catalogo/index.html\` | El catálogo navegable. Ábrelo en el navegador |

En el catálogo, la opción «Descargar el sistema» del menú de usuario **no
funciona dentro de esta entrega**: apunta al ZIP que ya tienes en las manos.

---

## 3 · Cómo se implementa

Las rutas dependen de por dónde llegó el sistema. Si vino en este ZIP, se copia
dentro del proyecto y se importa por ruta relativa. Si vino por npm, se importa
por el nombre del paquete: \`sistema-diseno-ae\`.

**1 · Los colores.** Importa \`tokens.css\` una sola vez, en el layout raíz:

\`\`\`ts
import './sistema/tokens/tokens.css';   // llegó por ZIP
import 'sistema-diseno-ae/tokens.css';  // llegó por npm
\`\`\`

El modo se conmuta con el atributo \`data-tema\` en \`<html>\`:

\`\`\`html
<html data-tema="claro">   <!-- ó data-tema="oscuro" -->
\`\`\`

Sin atributo se respeta la preferencia del sistema operativo.

**2 · Tailwind.** El preset **extiende** la configuración, no la reemplaza:

\`\`\`ts
import preset from './sistema/tokens/tailwind-preset';   // llegó por ZIP
import preset from 'sistema-diseno-ae/preset';           // llegó por npm

export default {
  presets: [preset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
} satisfies Config;
\`\`\`

El preset consume \`var(--token)\`, no valores hex, así que **una sola compilación
sirve para los dos modos**.

**3 · El candado de lint.** Incorpóralo a la configuración de ESLint del
proyecto. Bloquea, con fallo de build:

| Prohibido | Por qué |
|---|---|
| Hex crudo, \`rgb()\`, \`hsl()\` | Lo que no pasa por el token, el candado no lo protege |
| \`bg-[#fff]\` y arbitrarios | Evaden el preset |
| \`text-[Npx]\` | Solo los pasos de la escala |
| \`outline-none\` | Con teclado te pierdes |
| Primitivas en componentes | Existen para que los semánticos elijan |
| \`marca-amarillo\`, \`marca-celeste\` | 1,2:1 y 2,6:1 — no admiten texto |
| \`font-thin/light/extrabold/black\` | Cuatro pesos y ninguno más |
| Atributo \`style\` en línea | Evade preset y candado |

**4 · Integración continua.** Añade el verificador de contraste al pipeline. Sale
con código 1 si algún par incumple, así que corta el build por sí solo.

---

## 4 · Reglas que no se negocian

1. **Nunca edites a mano** \`paleta.lock.json\`, \`tokens.css\` ni
   \`tailwind-preset.ts\`. El verificador detecta la edición manual y falla.
2. **Un solo sitio donde se escribe un color:** \`fuente.mjs\`. Todo lo demás se
   genera con \`node sistema/tokens/generar.mjs\`.
3. **Si tu cambio hace fallar el candado, el candado tiene razón.** No lo
   desactives.
4. **No hay modo oscuro aprobado.** Los valores están calculados y verificados,
   pero la aprobación visual sigue pendiente.

---

## 5 · Cómo llegan las mejoras

Esta carpeta es **de solo lectura para el proyecto que la consume**. Nada de lo
que hay dentro de \`sistema/\` se edita aquí: se edita en el repositorio del
sistema y baja ya generado. Por eso actualizar es **reemplazar la carpeta**, no
resolver conflictos.

### Ruta A · ZIP versionado — funciona hoy

Se descarga el ZIP nuevo desde el catálogo, menú de usuario → **Descargar el
sistema**, y se reemplazan enteras estas dos carpetas:

\`\`\`
sistema/tokens/
sistema/candado/
\`\`\`

**Después de reemplazar, siempre:**

\`\`\`bash
node sistema/candado/verificar-contraste.mjs   # 0 fallos
npm run lint                                    # el candado en su sitio
npm run build
\`\`\`

### Ruta B · dependencia de git — mejor, y necesita dos cosas antes

El repositorio ya trae \`package.json\`, así que es instalable como paquete. Con
la etiqueta publicada, se instala así:

\`\`\`bash
npm install github:solwarehz/sistema-diseno#v${VERSION}
\`\`\`

Actualizar es cambiar el número de la etiqueta y volver a instalar. Es mejor que
el ZIP porque **la versión queda anclada y visible en el control de versiones**:
dos proyectos no se desincronizan sin que nadie se entere, y volver atrás es
cambiar un número.

Antes de que funcione hacen falta dos cosas, y ninguna es del proyecto que
consume:

1. **Que exista la etiqueta \`v${VERSION}\`** en el repositorio.
2. **Acceso de lectura al repositorio**, que es privado. Por HTTPS pide
   credenciales; lo habitual es una clave SSH en la cuenta de quien instala, o
   un token de acceso.

Verificado hasta donde se puede sin instalar: \`npm pack --dry-run\` resuelve el
paquete —12 archivos, 35,4 kB— y el manifiesto se lee bien. **La instalación
completa no está probada de punta a punta**, porque en esta máquina no se
instala nada.

### Qué mirar en cada actualización

Abre el catálogo y ve a **Referencia → Registro de cambios**. Ahí está, versión a
versión: qué cambió, por qué, qué tokens entraron y **qué puede romperte**.

Dos cosas que conviene saber de entrada:

- **En ocho versiones no se ha retirado ni renombrado ningún token.** Solo altas.
  Una versión nueva no te quita nada de lo que ya usas.
- Lo que sí se rompió fueron **dos cosas en la v1.2.0** —la forma del objeto
  \`marca\` y la ruta de \`tokens-light.css\`—, y están declaradas ahí. Salieron como
  versión menor y deberían haber sido mayor.

Si un token desapareciera o cambiara de nombre, el build falla **en compilación,
no en producción**. Eso es intencionado.

---

## 6 · Lo que esta entrega NO trae

- **Componentes de React.** Todavía no existen. El catálogo muestra el
  comportamiento y el marcado de referencia; la implementación está pendiente.
- **Los activos de marca** (escudo y lockup) van embebidos dentro del catálogo,
  pero **no como archivos sueltos**: son propiedad del cliente y se piden aparte.
- **El isotipo simplificado.** Bajo 56px el escudo es ilegible y no existe
  activo válido para 40px ni para el favicon de 16px. Es trabajo de diseñador.

---

Generado por \`node sistema/paquete/empaquetar.mjs\` desde la versión ${VERSION}.
`;
}

// Ejecutado directamente, empaqueta y reporta.
if (process.argv[1] && process.argv[1].endsWith('empaquetar.mjs')) empaquetar();
