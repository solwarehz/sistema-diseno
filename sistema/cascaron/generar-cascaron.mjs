/**
 * GENERADOR DEL CASCARÓN
 *
 *   node sistema/cascaron/generar-cascaron.mjs
 *
 * Emite `cascaron/index.html`: una sola página autocontenida para VER los
 * colores en acción y aprobarlos. Sin dependencias, sin build, sin npm.
 *
 * Se genera desde `fuente.mjs` y desde el `tokens.css` ya generado, así que
 * no puede divergir del sistema. Si cambias un color, regeneras y ya está.
 *
 * Es un CASCARÓN: estructura y color. No son los componentes reales.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, primitivas, categoricas, autorizados, restringidos, semanticos, correcciones, CAMBIOS } from '../tokens/fuente.mjs';
import { empaquetar, NOMBRE_ZIP } from '../paquete/empaquetar.mjs';
import { ICONOS, ic, icono, TAMANOS } from '../iconos/iconos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const SALIDA = join(RAIZ, 'cascaron');

const tokensCss = readFileSync(join(RAIZ, 'sistema', 'tokens', 'tokens.css'), 'utf8');

/**
 * EL COMPRESOR DE PDF, EL MISMO QUE USA REACT.
 *
 * Se lee el archivo y se inserta tal cual. No es comodidad: si el catálogo
 * tuviera su propia copia, la página enseñaría una compresión que no es la que
 * viaja en el paquete, y el día que una de las dos cambie nadie lo notaría.
 * Es exactamente la reconstrucción que la política prohíbe.
 *
 * Dos ajustes, y ninguno toca la lógica:
 *   · se quita `export`, porque el catálogo es un script clásico —tiene que
 *     abrirse con `file://` y ahí un módulo externo lo bloquea CORS—;
 *   · se envuelve en su propia función para que sus nombres (`Nombre`, `Ref`,
 *     `Lector`…) no choquen con los del catálogo, que es largo.
 */
const fuentePdf = readFileSync(
  join(RAIZ, 'componentes', 'src', 'interno', 'comprimir-pdf.mjs'), 'utf8',
);
const COMPRESOR_PDF = `var PDF = (function () {
${fuentePdf.replace(/^export /gm, '')}
  return { comprimirPdf: comprimirPdf, formatearPeso: formatearPeso, ahorro: ahorro, esPdf: esPdf };
})();`;

// Los activos de marca se incrustan como data URI: el cascarón sigue siendo un
// solo archivo autocontenido y los PNG originales siguen fuera del repositorio
// por .gitignore. Si faltan, se cae al marcador de posición.
const b64 = (rel) => {
  try {
    return 'data:image/png;base64,' + readFileSync(join(RAIZ, rel)).toString('base64');
  } catch {
    return null;
  }
};
const ESCUDO_PNG = b64('imagenes/AE.png');
const LOCKUP_PNG = b64('imagenes/AE-nombre-horizontal.png');

// Los activos de marca NO viajan en git (propiedad del cliente): en un clon
// nuevo faltan y el catalogo cae al marcador. Eso es correcto para MIRAR,
// pero commitear ese catalogo BORRA los logos del que estaba publicado — paso
// el 2026-08-10, seis versiones seguidas sin logos. El aviso existe para que
// no vuelva a pasar en silencio. Recuperacion sin pedir archivos: los PNG
// estan embebidos en base64 en cualquier index.html anterior del historial.
if (!ESCUDO_PNG || !LOCKUP_PNG) {
  console.warn(
    '\n  ⚠ SIN ACTIVOS DE MARCA: falta imagenes/AE.png o AE-nombre-horizontal.png.'
    + '\n    El catalogo saldra con el marcador de posicion. NO lo commitees asi:'
    + '\n    recupera los PNG del historial (estan en base64 dentro de cualquier'
    + '\n    cascaron/index.html anterior) o pidelos por el chat.\n'
  );
}
const lock = JSON.parse(readFileSync(join(RAIZ, 'sistema', 'tokens', 'paleta.lock.json'), 'utf8'));

// ── Utilidades ──────────────────────────────────────────────────────────────

const canal = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};
const contra = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return Math.floor(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};


const GRUPOS = {
  Superficies: ['fondo-pagina', 'fondo-tarjeta', 'fondo-encabezado', 'fondo-fila-alt', 'fondo-fila-hover'],
  Texto: ['texto-principal', 'texto-secundario', 'texto-pista', 'texto-invertido'],
  Bordes: ['borde', 'borde-fuerte', 'borde-campo'],
  Acción: ['accion', 'accion-hover', 'accion-activa', 'accion-texto', 'accion-deshabilitada', 'accion-texto-desh', 'accion-2', 'enlace'],
  'Marco de aplicación': ['marco-fondo', 'marco-texto', 'marco-acento', 'marco-item-activo'],
  Foco: ['foco', 'foco-en-marco'],
  Estados: ['exito-fondo', 'exito-texto', 'exito-acento', 'aviso-fondo', 'aviso-texto', 'aviso-acento', 'error-fondo', 'error-texto', 'error-acento', 'info-fondo', 'info-texto', 'info-acento'],
};

// ── Muestras de color ───────────────────────────────────────────────────────

const muestra = (nombre, tok) => `
  <div class="muestra">
    <div class="muestra-color token-${nombre}" data-claro="${tok.claro}" data-oscuro="${tok.oscuro}"></div>
    <div class="muestra-txt">
      <code class="muestra-nombre">${nombre}</code>
      <span class="muestra-clase" data-hex-de="${nombre}">${
        tok.origen.claro === 'directo' ? 'sin rampa' : tok.origen.claro
      }</span>
      <span class="muestra-uso">${tok.uso}</span>
    </div>
  </div>`;

const grupoMuestras = ([titulo, claves]) => `
  <section class="grupo">
    <h3>${titulo}</h3>
    <div class="rejilla">${claves.map((k) => muestra(k, semanticos[k])).join('')}</div>
  </section>`;

/**
 * Qué tokens se apoyan en cada valor. Se calcula una vez y se consulta por hex:
 * un escalonado se aprueba viendo QUIÉN lo usa, no mirando cuadritos de color.
 * Un paso sin nadie encima es sitio libre; uno con tres es una concentración
 * que conviene mirar.
 */
const QUIEN_USA = (() => {
  const mapa = {};
  for (const [nombre, t] of Object.entries(semanticos)) {
    for (const modo of ['claro', 'oscuro']) {
      const k = t[modo].toUpperCase();
      (mapa[k] ??= []).push(`${nombre}·${modo[0]}`);
    }
  }
  return mapa;
})();

const escala = (nombre, pasos) => `
  <div class="escala">
    <div class="escala-nombre">${nombre}</div>
    <div class="escala-tiras">
      ${Object.entries(pasos)
        .map(([paso, hex]) => {
          // La tira dice DOS cosas: cómo se llama el color y cuánto vale. Antes
          // listaba además qué tokens se apoyaban en él, y era ruido: para
          // escoger un escalón hace falta verlo y saber nombrarlo, no saber
          // quién lo usaba ya.
          const usan = QUIEN_USA[hex.toUpperCase()] ?? [];
          return `
        <div class="tira${usan.length ? ' tira-usada' : ''}">
          <span class="tira-color color-${nombre}_${paso}"></span>
          <code class="tira-nombre">${nombre}_${paso}</code>
          <span class="tira-hex">${hex}</span>
        </div>`;
        })
        .join('')}
    </div>
  </div>`;

// ── Tabla de contrastes ─────────────────────────────────────────────────────

const filasContraste = (modo) =>
  lock.contrastes
    .filter((c) => c.modo === modo && c.minimo !== 'informativo')
    .map(
      (c) => `
    <tr>
      <td><code>${c.frente}</code></td>
      <td><code>${c.fondo}</code></td>
      <td class="num">${c.ratio.toFixed(2)}:1</td>
      <td class="num">${c.minimo}</td>
      <td class="${c.cumple ? 'ok' : 'mal'}">${c.cumple ? 'cumple' : 'FALLA'}</td>
      <td class="motivo">${c.motivo}</td>
    </tr>`
    )
    .join('');

// ── Escudo: marcador de posición explícito ──────────────────────────────────
// No se recorta del lockup: produce bordes sucios y proporciones falsas.

const escudo = (px) => `
  <div class="escudo-falta" style="width:${px}px;height:${px}px"
       title="Activo pendiente: no existe AE-escudo-*.png (MMI-DS §10)">
    <svg viewBox="0 0 40 46" width="${px}" height="${px}" aria-label="Escudo pendiente">
      <path d="M20 1 L38 7 V25 C38 34 30 41 20 45 C10 41 2 34 2 25 V7 Z"
            fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="20" y="27" text-anchor="middle" font-size="14"
            font-weight="700" fill="currentColor">AE</text>
    </svg>
  </div>`;

// ── Medio de tarjeta: muestra sin inventar un activo ────────────────────────
// R57 · El catálogo tiene que EJERCITAR `.tn-medio img`, no solo describirlo:
// lo que no se pinta aquí, el candado de la promesa no lo puede comparar. Pero
// no existe una foto de muestra en el repositorio y no se inventa ninguna, así
// que la muestra es un SVG con la proporción real, dibujado solo con
// `currentColor` — ni un hexadecimal, y en un <img> resuelve a negro.
const MEDIO_MUESTRA = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">'
  + '<rect x="1" y="1" width="158" height="88" fill="none" stroke="currentColor"'
  + ' stroke-dasharray="4 3"/>'
  + '<path d="M18 72 L58 36 L88 62 L110 46 L142 72 Z" fill="none"'
  + ' stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  + '<circle cx="118" cy="26" r="8" fill="none" stroke="currentColor" stroke-width="2"/>'
  + '</svg>'
);

// ── Maquetas ────────────────────────────────────────────────────────────────

const maquetaWeb = `
<div class="lienzo lienzo-web">
  <div class="w-barra">
    <div class="w-marca">
      ${escudo(34)}
      <div>
        <div class="w-colegio">COLEGIO</div>
        <div class="w-nombre">ALBERT EINSTEIN</div>
      </div>
    </div>
    <nav class="w-nav">
      <span class="activo">Inicio</span><span>Admisión</span><span>Niveles</span><span>Contacto</span>
    </nav>
    <div class="w-acciones">
      <button class="btn btn-2">Intranet</button>
      <button class="btn btn-1">Postular</button>
    </div>
  </div>

  <div class="w-hero">
    <div class="w-hero-txt">
      <h1>Educación que forma<br><em>triunfadores</em></h1>
      <div class="w-filete"></div>
      <p>Cincuenta años formando estudiantes en Huaraz con énfasis en ciencias.</p>
      <div class="w-hero-acciones">
        <button class="btn btn-1">Solicitar información</button>
        <button class="btn btn-2">Conocer el colegio</button>
      </div>
    </div>
    <div class="w-panel">${escudo(80)}</div>
  </div>

  <div class="w-datos">
    <div><strong>1 240</strong><span>Estudiantes</span></div>
    <div><strong>50</strong><span>Años</span></div>
    <div><strong>98 %</strong><span>Ingreso a universidad</span></div>
    <div><strong>86</strong><span>Docentes</span></div>
  </div>
</div>`;

const filas = [
  ['Quispe Mamani, Ana', '71234567', '5.º A', 'Activo', 'exito', '—'],
  ['Rojas Vega, Luis', '70998811', '4.º B', 'Parcial', 'aviso', 'S/ 320.00'],
  ['Fernández Cruz, María', '72110455', '5.º A', 'Deuda', 'error', 'S/ 1 240.00'],
  ['Huamán Soto, Pedro', '73456120', '3.º C', 'Activo', 'exito', '—'],
  ['Álvarez Ponce, Rosa', '70551234', '4.º B', 'Activo', 'exito', '—'],
];

// Iconos de trazo 1,5px — Lucide (D-07). Heredan currentColor, que es
// exactamente lo que el emoji no hace.
// El conjunto vive en su propio modulo: lo consume el catalogo y lo consume
// la entrega. Definido aqui, la copia entregada envejeceria por su cuenta.

// Chevrons direccionales del componente Paginación.
const ICO_CHEV_IZQ = icono('chevronIzq', TAMANOS.etiqueta);
const ICO_CHEV_DER = icono('chevronDer', TAMANOS.etiqueta);

const MENU = [
  ['panel', 'Dashboard', false],
  ['matricula', 'Matrícula', true],
  ['asistencia', 'Asistencia', true],
  ['usuarios', 'Usuarios', true],
  ['comunicaciones', 'Comunicaciones', true],
  ['administracion', 'Administración', true],
  ['tesoreria', 'Tesorería', true],
  ['academico', 'Académico', true],
  ['configuracion', 'Configuración', true],
];

/* ───────────────────────────────────────────────────────────────────────────
   R97 · LOS TRAMOS DEL MENU TIENEN QUE CUBRIR TODOS LOS ELEMENTOS
   Los cortes de `ramas` son indices sobre `items`, asi que meter un elemento
   corre todos los que van detras. El comentario de arriba ya contaba DOS
   victimas —Carga de ID y Segmentado, las dos veces el ultimo elemento— y con
   el Panel de privilegios iban tres.
   El candado de la entrega solo caza el caso en que el que se cae es un
   componente PUBLICADO; una pagina de catalogo que se cayera del menu no la
   veria nadie. Esto comprueba lo que aquel da por supuesto: que los tramos
   cubren [0, items.length) sin huecos ni solapes.
   ─────────────────────────────────────────────────────────────────────────── */
function comprobarTramos(grupos) {
  const malos = [];
  for (const g of grupos) {
    if (!g.ramas) continue;
    const cubierto = new Array(g.items.length).fill(0);
    for (const r of g.ramas) {
      const hasta = Math.min(r.hasta, g.items.length);
      for (let i = r.desde; i < hasta; i++) cubierto[i] = (cubierto[i] ?? 0) + 1;
    }
    g.items.forEach((it, i) => {
      if (cubierto[i] === 0) malos.push(`  «${it.t}» (${g.grupo}, indice ${i}) no esta en ninguna rama del menu`);
      if (cubierto[i] > 1) malos.push(`  «${it.t}» (${g.grupo}, indice ${i}) esta en ${cubierto[i]} ramas`);
    });
    const finitos = g.ramas.map((r) => r.hasta).filter((h) => Number.isFinite(h));
    const ultimo = finitos.length ? Math.max(...finitos) : 0;
    if (ultimo > g.items.length) malos.push(`  ${g.grupo}: una rama llega hasta ${ultimo} y solo hay ${g.items.length} elementos`);
  }
  if (malos.length) {
    console.error('\n  El menu no cubre todas las paginas:\n');
    for (const m of malos) console.error(m);
    console.error('\n  Los cortes de `ramas` son INDICES sobre `items`: al meter un elemento');
    console.error('  hay que correr los tramos de detras. Es la tercera vez que pasa.\n');
    process.exit(1);
  }
}

const itemsMenu = (activo = 'panel') =>
  MENU.map(
    ([k, txt, sub]) => `
      <a class="nav-item${k === activo ? ' activo' : ''}" href="#" title="${txt}">
        <span class="nav-ic">${ICONOS[k]}</span>
        <span class="nav-txt">${txt}</span>
        ${sub ? `<span class="nav-chev">${ICONOS.chevron}</span>` : ''}
      </a>`
  ).join('');

const barraSuperior = `
  <div class="top">
    <button class="top-plegar" aria-label="Plegar menú">${ICONOS.panelIzq}</button>
    <div class="top-filtros">
      <label class="cg"><span class="cg-et">Años</span><select class="campo cg-in"><option>2026</option></select></label>
      <label class="cg"><span class="cg-et">Sedes</span><select class="campo cg-in"><option>Todas</option></select></label>
      <label class="cg"><span class="cg-et">Nivel</span><select class="campo cg-in"><option>Todos</option></select></label>
    </div>
    <div class="top-acciones">
      <button class="top-btn" aria-label="Cambiar tema">${ICONOS.sol}</button>
      <button class="top-btn" aria-label="Mensajes">${ICONOS.sobre}</button>
      <button class="top-btn" aria-label="Notificaciones">${ICONOS.campana}<span class="badge">1</span></button>
      <span class="avatar avatar-m avatar-2 top-avatar">JI</span>
    </div>
  </div>`;

const lateral = (colapsado) => `
  <aside class="lat${colapsado ? ' colapsado' : ''}">
    <div class="lat-marca">
      ${escudo(30)}
      <div class="lat-id"><span class="lat-colegio">COLEGIO</span><span class="lat-nombre">ALBERT EINSTEIN</span></div>
    </div>
    <nav class="lat-nav">${itemsMenu()}</nav>
    <div class="lat-usuario">
      <span class="avatar avatar-m avatar-2">JI</span>
      <div class="lat-user-txt">
        <span class="lat-user-nom">JOSE ISIDRO PINEDA</span>
        <span class="lat-user-mail">jose.pineda@ae.edu.pe</span>
      </div>
    </div>
  </aside>`;

const maquetaSistema = `
<div class="lienzo lienzo-sistema">
  <div class="app">
  ${lateral(false)}
  <div class="app-main">
  ${barraSuperior}
  <div class="s-cuerpo">
    <div class="s-cabecera">
      <div>
        <h2>Estudiantes</h2>
        <p>1 240 registros · Marzo 2026</p>
      </div>
      <button class="btn btn-1">Nuevo estudiante</button>
    </div>

    <div class="s-tarjeta">
      <div class="s-filtros">
        <input class="campo" placeholder="71234567" aria-label="Buscar por DNI">
        <select class="campo"><option>Todos los grados</option></select>
        <select class="campo"><option>Todos los estados</option></select>
        <div class="s-filtros-der">
          <button class="btn btn-neutro">Exportar</button>
          <button class="btn btn-oro">Columnas</button>
        </div>
      </div>

      <table class="s-tabla">
        <thead><tr><th>Estudiante</th><th>DNI</th><th>Grado</th><th>Estado</th><th>Deuda</th><th></th></tr></thead>
        <tbody>
          ${filas
            .map(
              ([n, dni, g, est, cls, deuda], i) => `
          <tr${i === 1 ? ' class="hover"' : ''}>
            <td>${n}</td>
            <td class="mono">${dni}</td>
            <td>${g}</td>
            <td><span class="chip chip-${cls}">${est}</span></td>
            <td class="mono ${cls === 'error' ? 'deuda' : 'apagado'}">${deuda}</td>
            <td><a href="#" class="enlace">Editar</a></td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <div class="s-paginacion">
        <span>1–5 de 1 240</span>
        <div class="tb-pag"><span class="pgn-btn activa">1</span><span class="pgn-btn">2</span><span class="pgn-btn">3</span><span class="pgn-btn pgn-flecha"><span>Siguiente</span>${ICO_CHEV_DER}</span></div>
      </div>
    </div>
  </div>
  </div>
  </div>
</div>`;

// El mismo marco con la lateral plegada: solo iconos.
const maquetaColapsada = `
<div class="lienzo lienzo-sistema">
  <div class="app">
  ${lateral(true)}
  <div class="app-main">
  ${barraSuperior}
  <div class="s-cuerpo">
    <div class="s-cabecera">
      <div><h2>Estudiantes</h2><p>1 240 registros · Marzo 2026</p></div>
      <button class="btn btn-1">Nuevo estudiante</button>
    </div>
    <div class="s-tarjeta">
      <table class="s-tabla">
        <thead><tr><th>Estudiante</th><th>DNI</th><th>Grado</th><th>Estado</th><th>Deuda</th><th></th></tr></thead>
        <tbody>
          ${filas
            .map(
              ([n, dni, g, est, cls, deuda], i) => `
          <tr${i === 1 ? ' class="hover"' : ''}>
            <td>${n}</td><td class="mono">${dni}</td><td>${g}</td>
            <td><span class="chip chip-${cls}">${est}</span></td>
            <td class="mono ${cls === 'error' ? 'deuda' : 'apagado'}">${deuda}</td>
            <td><a href="#" class="enlace">Editar</a></td>
          </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
  </div>
  </div>
</div>`;

const maquetaMovil = `
<div class="lienzo lienzo-movil">
  <div class="m-marco">
    <div class="m-marco-fila1">
      <button class="m-hamb" aria-label="Abrir menú">${ICONOS.panelIzq}</button>
      ${escudo(22)}<span class="m-nombre">ALBERT EINSTEIN</span><span class="m-avatar">JH</span>
    </div>
    <div class="m-marco-fila2"><span class="activo">Estudiantes</span><span>Asistencia</span><span>Pagos</span></div>
  </div>
  <div class="m-cuerpo">
    <div class="m-filtros-movil">
      <select class="campo"><option>2026</option></select>
      <select class="campo"><option>Todas las sedes</option></select>
    </div>
    <div class="m-cabecera"><h3>Estudiantes</h3><p>1 240 · Marzo 2026</p></div>
    <input class="campo" placeholder="71234567" aria-label="Buscar">
    ${filas
      .slice(0, 3)
      .map(
        ([n, dni, g, est, cls, deuda]) => `
    <div class="m-tarjeta">
      <div class="m-nom">${n}</div>
      <div class="m-meta mono">${dni} · ${g}</div>
      <div class="m-linea"></div>
      <div class="m-pie">
        <span class="chip chip-${cls}">${est}</span>
        <span class="mono ${cls === 'error' ? 'deuda' : 'apagado'}">${deuda}</span>
      </div>
      <a href="#" class="enlace">Ver detalle</a>
    </div>`
      )
      .join('')}
  </div>
  <button class="m-flotante" aria-label="Nuevo estudiante">+</button>
</div>`;

// ── Casos de uso ────────────────────────────────────────────────────────────
// Cada color en el sitio donde trabaja. Y, al lado, el uso incorrecto: es la
// forma más rápida de que una regla se entienda y no se discuta después.

const caso = (titulo, regla, cuerpo) => `
  <div class="caso">
    <div class="caso-cab">
      <h4>${titulo}</h4>
      <p>${regla}</p>
    </div>
    <div class="caso-lienzo">${cuerpo}</div>
  </div>`;

const casosDeUso = `
<div class="casos">

  ${caso(
    'Acciones',
    'Una sola principal por pantalla. La secundaria va en oro, con borde y sin relleno. Las acciones de fila son <strong>texto</strong>, no botones.',
    `<div class="fila-demo">
      <button class="btn btn-1">Guardar</button>
      <button class="btn btn-2">Columnas</button>
      <button class="btn btn-neutro">Exportar</button>
      <button class="btn" disabled class="demo-desh">Sin permiso</button>
      <a href="#" class="enlace">Editar</a>
    </div>
    <div class="caso-tokens"><code>accion</code> <code>accion-2</code> <code>borde-campo</code> <code>accion-deshabilitada</code> <code>enlace</code></div>`
  )}

  ${caso(
    'Estados — siempre en pares fondo/texto',
    'Nunca un color de estado suelto. El <code>-acento</code> va <strong>solo en el filete</strong>: es adorno y por eso conserva el tono saturado.',
    `<div class="fila-demo">
      <span class="chip chip-exito">Activo</span>
      <span class="chip chip-aviso">Parcial</span>
      <span class="chip chip-error">Deuda</span>
      <span class="chip chip-info">Informativo</span>
    </div>
    <div class="mensajes">
      <div class="msj msj-exito"><span class="msj-ico">${icono('visto', 16)}</span><span class="msj-txt"><strong>Se guardó.</strong> 24 registros actualizados.</span></div>
      <div class="msj msj-aviso"><span class="msj-ico">${icono('alerta', 16)}</span><span class="msj-txt"><strong>Faltan 3 asistencias.</strong> Puedes continuar y completarlas después.</span></div>
      <div class="msj msj-error"><span class="msj-ico">${icono('cerrar', 16)}</span><span class="msj-txt"><strong>No se guardó: falta el DNI.</strong> Complétalo y vuelve a intentar.</span></div>
      <div class="msj msj-info"><span class="msj-ico">${icono('informacion', 16)}</span><span class="msj-txt"><strong>El periodo se cierra el 31 de marzo.</strong> Después no se podrán editar notas.</span></div>
    </div>
    <div class="caso-tokens"><code>exito-*</code> <code>aviso-*</code> <code>error-*</code> <code>info-*</code></div>`
  )}

  ${caso(
    'Campos de formulario',
    'La etiqueta <strong>siempre visible</strong>. El placeholder es un ejemplo de formato, nunca la etiqueta. La ayuda va debajo, en una línea.',
    `<div class="fila-demo campos-demo">
      <label class="campo-grupo">
        <span class="campo-etiqueta">DNI</span>
        <input class="campo" placeholder="71234567">
        <span class="campo-ayuda">Ocho dígitos, sin guiones.</span>
      </label>
      <label class="campo-grupo">
        <span class="campo-etiqueta">Grado</span>
        <select class="campo"><option>5.º A</option></select>
        <span class="campo-ayuda">&nbsp;</span>
      </label>
      <label class="campo-grupo">
        <span class="campo-etiqueta">Correo</span>
        <input class="campo campo-mal" value="ana@" >
        <span class="campo-error">El correo está incompleto.</span>
      </label>
    </div>
    <div class="caso-tokens"><code>borde-campo</code> <code>texto-pista</code> <code>error-texto</code> <code>error-acento</code></div>`
  )}

  ${caso(
    'Foco — dos tokens, no uno',
    'El ámbar oscuro no llega a 3:1 sobre el marco; el claro no llega sobre blanco. <strong>Ningún azul ni rojo funciona en los dos contextos.</strong>',
    `<div class="fila-demo">
      <button class="btn btn-1 foco-demo">Sobre contenido</button>
      <span class="foco-marco"><button class="btn btn-marco foco-demo-marco">Dentro del marco</button></span>
    </div>
    <div class="caso-tokens"><code>foco</code> <code>foco-en-marco</code> — anillo de 2px con 2px de separación</div>`
  )}

  ${caso(
    'Filas de tabla',
    'La fila bajo el cursor y la seleccionada usan el mismo token. Los divisores son <code>borde</code>, no <code>borde-fuerte</code>.',
    `<table class="s-tabla demo-tabla">
      <thead><tr><th>Estudiante</th><th>DNI</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td>Quispe Mamani, Ana</td><td class="mono">71234567</td><td><span class="chip chip-exito">Activo</span></td></tr>
        <tr class="hover"><td>Rojas Vega, Luis</td><td class="mono">70998811</td><td><span class="chip chip-aviso">Parcial</span></td></tr>
        <tr><td>Fernández Cruz, María</td><td class="mono">72110455</td><td><span class="chip chip-error">Deuda</span></td></tr>
      </tbody>
    </table>
    <div class="caso-tokens"><code>fondo-encabezado</code> <code>fondo-fila-hover</code> <code>borde</code></div>`
  )}

  ${caso(
    'Los tres estados de pantalla',
    'Confundir «nunca consultado» con «sin resultados» hace creer que no hay datos cuando todavía no se ha buscado. <strong>El vacío es el que más comunica.</strong>',
    `<div class="estados-demo">
      <div class="estado-caja">
        <div class="esqueleto"></div><div class="esqueleto corto"></div><div class="esqueleto"></div>
        <span class="estado-et">Cargando</span>
      </div>
      <div class="estado-caja centrado">
        <p class="estado-txt">Elige un periodo para ver los datos.</p>
        <span class="estado-et">Nunca consultado</span>
      </div>
      <div class="estado-caja centrado">
        <p class="estado-txt">Sin resultados para <em>perez</em>.<br>Prueba con menos filtros.</p>
        <span class="estado-et">Sin resultados</span>
      </div>
    </div>`
  )}

</div>

<h3 class="sub-seccion">Usos incorrectos</h3>
<p class="seccion-sub">Lo mismo, mal hecho. Cada uno con su medición: no es opinión.</p>

<div class="mal-rejilla">
  <div class="mal-par">
    <div class="mal-caja mal"><button class="btn mal-btn-celeste">Agregar +</button>
      <span class="mal-et">2,56:1 — ilegible</span></div>
    <div class="mal-caja bien"><button class="btn btn-1">Agregar +</button>
      <span class="bien-et">8,13:1 con <code>accion</code></span></div>
  </div>
  <div class="mal-par">
    <div class="mal-caja mal"><span class="emoji-demo">📋 📊 ⚙️</span>
      <span class="mal-et">Emoji: no hereda color, no se alinea</span></div>
    <div class="mal-caja bien"><span class="iconos-demo">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
      </span><span class="bien-et">Trazo 1,5px, hereda <code>currentColor</code></span></div>
  </div>
  <div class="mal-par">
    <div class="mal-caja mal"><div class="filas-boton"><button class="btn btn-1 mini">Editar</button><button class="btn btn-1 mini">Editar</button><button class="btn btn-1 mini">Editar</button></div>
      <span class="mal-et">Cinco botones no son jerarquía, son ruido</span></div>
    <div class="mal-caja bien"><div class="filas-boton col"><a href="#" class="enlace">Editar</a><a href="#" class="enlace">Editar</a><a href="#" class="enlace">Editar</a></div>
      <span class="bien-et">Acción de fila como <code>enlace</code></span></div>
  </div>
  <div class="mal-par">
    <div class="mal-caja mal"><input class="campo sin-foco" value="Sin anillo de foco" tabindex="-1" readonly aria-hidden="true">
      <span class="mal-et"><code>outline:none</code> — con teclado te pierdes</span></div>
    <div class="mal-caja bien"><input class="campo foco-demo" value="Con anillo">
      <span class="bien-et">2px con 2px de separación</span></div>
  </div>
</div>`;

// ── Tipografía — fase 2 ─────────────────────────────────────────────────────

const ESCALA_SISTEMA = [
  ['s-titulo-pantalla', 'Título de pantalla', 28, 'SemiBold 600', 1.2, 'Estudiantes'],
  ['s-titulo-seccion', 'Título de sección', 20, 'Medium 500', 1.3, 'Datos del apoderado'],
  ['s-cuerpo', 'Cuerpo', 16, 'Regular 400', 1.6, 'Texto corrido de una descripción'],
  ['s-interfaz', 'Interfaz y tabla', 15, 'Regular 400', 1.45, 'Quispe Mamani, Ana'],
  ['s-encabezado', 'Encabezado de tabla', 15, 'Medium 500', 1.45, 'Estudiante'],
  ['s-etiqueta', 'Etiqueta de campo', 13, 'Medium 500', 1.4, 'Documento de identidad'],
  ['s-pista', 'Pista y chip', 12, 'Regular 400', 1.4, 'Ocho dígitos, sin guiones'],
];

const ESCALA_LANDING = [
  ['l-hero', 'Titular hero', 56, 'Bold 700', 1.05, 'Educación que forma'],
  ['l-seccion', 'Titular de sección', 34, 'SemiBold 600', 1.15, 'Nuestros niveles'],
  ['l-subtitulo', 'Subtítulo', 24, 'Medium 500', 1.25, 'Inicial, Primaria y Secundaria'],
  ['l-destacado', 'Destacado', 19, 'Regular 400', 1.5, 'Cincuenta años en Huaraz'],
  ['l-cuerpo', 'Cuerpo', 16, 'Regular 400', 1.65, 'Texto corrido de la landing'],
  ['l-pie', 'Pie y legal', 13, 'Regular 400', 1.5, 'Colegio Albert Einstein · Huaraz'],
];

const filaEscala = ([clase, nombre, px, peso, lh, texto]) => `
  <tr>
    <td class="esc-muestra">
      <span style="font-size:${px}px; line-height:${lh}; font-weight:${peso.match(/\d+/)[0]}">${texto}</span>
    </td>
    <td><code>text-${clase}</code></td>
    <td class="num">${px}px</td>
    <td>${peso}</td>
    <td class="num">${lh}</td>
  </tr>`;

const tablaEscala = (filas) => `
  <div class="tabla-escala-caja">
    <table class="tabla-escala">
      <thead><tr><th>Muestra</th><th>Clase</th><th class="num">Tamaño</th><th>Peso</th><th class="num">Interlínea</th></tr></thead>
      <tbody>${filas.map(filaEscala).join('')}</tbody>
    </table>
  </div>`;

const PESOS = [
  [400, 'Regular', 'Cuerpo, celdas de tabla, texto secundario', true],
  [500, 'Medium', 'Etiquetas, encabezados de tabla, botones', true],
  [600, 'SemiBold', 'Títulos de pantalla y de sección', true],
  [700, 'Bold', 'Solo titulares de landing', true],
  [100, 'Thin', 'Prohibido', false],
  [200, 'ExtraLight', 'Prohibido', false],
  [300, 'Light', 'Prohibido', false],
  [800, 'ExtraBold', 'Prohibido', false],
  [900, 'Black', 'Prohibido', false],
];

const tipografia = `
<div class="tipo-nota">
  <strong>Cifras tabulares:</strong> los diez dígitos de IBM Plex Sans miden
  <strong>exactamente 12px a 20px de cuerpo</strong>, sin activar <code>tnum</code>.
  Las columnas numéricas se alinean solas. Con tablas de doscientas filas eso no es
  un detalle estético.
</div>

<h3 class="sub-seccion">Escala del sistema</h3>
<p class="seccion-sub">Rango corto: <strong>nada por encima de 28px</strong>. La densidad manda — quien lleva seis horas mirando la pantalla necesita ver más filas, no titulares.</p>
${tablaEscala(ESCALA_SISTEMA)}

<h3 class="sub-seccion">Escala de la landing</h3>
<p class="seccion-sub">Hasta 56px. El trabajo es el opuesto: <strong>detener</strong> a alguien que no conoce el colegio.</p>
${tablaEscala(ESCALA_LANDING)}

<h3 class="sub-seccion">Cuatro pesos, y ninguno más</h3>
<p class="seccion-sub">Los cinco de abajo están <strong>prohibidos</strong> y el candado los bloquea. Aquí se ven para que se entienda por qué.</p>
<div class="pesos">
${PESOS.map(
  ([w, nombre, uso, ok]) => `
  <div class="peso${ok ? '' : ' peso-mal'}">
    <span class="peso-muestra" style="font-weight:${w}">Albert Einstein 2026</span>
    <span class="peso-meta"><code>font-${nombre.toLowerCase()}</code> · ${w}</span>
    <span class="peso-uso">${uso}</span>
  </div>`
).join('')}
</div>
<p class="seccion-sub" style="margin-top:12px">Fíjate en que Thin, ExtraLight y Light <strong>no se ven distintos</strong> a este tamaño: el navegador no tiene esos cortes y sintetiza o cae al más cercano. Un peso que no existe en el archivo no es una decisión de diseño, es un accidente.</p>

<h3 class="sub-seccion">Cuándo va monoespaciado</h3>
<p class="seccion-sub">Identificadores: DNI, RUC, códigos, expedientes. <strong>Nunca</strong> texto normal.</p>
<div class="mono-comp">
  <div class="mono-caja">
    <div class="mono-et">Plex Sans — cuesta comparar</div>
    <div class="mono-lista sans">71234567<br>71284567<br>71234561</div>
  </div>
  <div class="mono-caja">
    <div class="mono-et">Plex Mono — la diferencia salta</div>
    <div class="mono-lista mono">71234567<br>71284567<br>71234561</div>
  </div>
</div>
<p class="seccion-sub" style="margin-top:8px">Los tres DNI difieren en un dígito. En monoespaciado las columnas se alinean y el dígito distinto salta a la vista; en proporcional hay que leerlos.</p>

<h3 class="sub-seccion">Ancho de línea</h3>
<p class="seccion-sub">Máximo <strong>72 caracteres</strong> en landing, <strong>90</strong> en descripciones de sistema. Más allá, el ojo pierde el renglón al volver.</p>
<div class="anchos">
  <div class="ancho-caja"><span class="ancho-et">72ch — landing</span><p class="ancho-72">La institución mantiene un énfasis declarado en ciencias desde su fundación, y ese énfasis se refleja en la distribución de horas del plan de estudios y en los talleres de la tarde.</p></div>
  <div class="ancho-caja"><span class="ancho-et">Sin límite — ilegible</span><p class="ancho-libre">La institución mantiene un énfasis declarado en ciencias desde su fundación, y ese énfasis se refleja en la distribución de horas del plan de estudios y en los talleres de la tarde.</p></div>
</div>

<h3 class="sub-seccion">Móvil — bajo 640px</h3>
<p class="seccion-sub">El cuerpo y el texto de interfaz <strong>suben</strong> a 18px. No es capricho: por debajo, la gente se acerca el teléfono a la cara.</p>
<table class="tabla-simple">
  <thead><tr><th>Estilo</th><th class="num">Escritorio</th><th class="num">Móvil</th></tr></thead>
  <tbody>
    <tr><td>Cuerpo</td><td class="num">16px</td><td class="num"><strong>18px</strong></td></tr>
    <tr><td>Interfaz y tabla</td><td class="num">15px</td><td class="num"><strong>18px</strong></td></tr>
    <tr><td>Etiqueta</td><td class="num">13px</td><td class="num">14px</td></tr>
    <tr><td>Pista</td><td class="num">12px</td><td class="num">13px</td></tr>
    <tr><td>Titular hero</td><td class="num">56px</td><td class="num">32px</td></tr>
    <tr><td>Título de pantalla</td><td class="num">28px</td><td class="num">22px</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Las siete reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Cuatro pesos y ningún otro.</td></tr>
    <tr><td class="num">2</td><td>Identificadores y columnas numéricas en <strong>Plex Mono</strong>. Todo lo demás en Plex Sans.</td></tr>
    <tr><td class="num">3</td><td>Prohibido <code>text-[Npx]</code>. Solo los pasos de la escala. <em>El candado lo bloquea.</em></td></tr>
    <tr><td class="num">4</td><td>Interlínea <strong>nunca por debajo de 1.4</strong> en texto corrido.</td></tr>
    <tr><td class="num">5</td><td>Ancho de línea: 72 caracteres en landing, 90 en sistema.</td></tr>
    <tr><td class="num">6</td><td>Cursiva solo en citas de landing. <strong>Nunca en interfaz.</strong></td></tr>
    <tr><td class="num">7</td><td>Mayúsculas sostenidas solo en el lockup. <strong>Nunca en etiquetas ni botones.</strong></td></tr>
  </tbody>
</table>
`;

// ── Espaciado ───────────────────────────────────────────────────────────────

const OPCIONES = [
  ['A', 28, 12, 'Compacto'],
  ['B', 32, 12, 'Normal estrecho'],
  ['C', 32, 16, 'Normal'],
  ['D', 36, 16, 'Holgado — el que sale de 8px vertical'],
  ['E', 40, 16, 'Grande'],
];

const tiraBotones = (h, ph) => `
  <div class="op-fila">
    <button class="btn-op btn-op-1" style="height:${h}px;padding-inline:${ph}px">Nuevo estudiante</button>
    <button class="btn-op btn-op-2" style="height:${h}px;padding-inline:${ph}px">Columnas</button>
    <button class="btn-op btn-op-n" style="height:${h}px;padding-inline:${ph}px">Ver</button>
    <input class="campo op-campo" style="height:${h}px;padding-inline:${ph}px" placeholder="71234567">
    <select class="campo op-campo" style="height:${h}px;padding-inline:${ph}px"><option>Todos los grados</option></select>
  </div>`;

const opciones = OPCIONES.map(
  ([letra, h, ph, nombre]) => `
  <div class="op">
    <div class="op-cab">
      <span class="op-letra">${letra}</span>
      <div>
        <strong>${nombre}</strong>
        <span class="op-med">alto <b>${h}px</b> · horizontal <b>${ph}px</b> · ${h >= 44 ? 'táctil OK' : h >= 24 ? 'AA OK, táctil corto' : 'FALLA'}</span>
      </div>
    </div>
    ${tiraBotones(h, ph)}
    <div class="op-contexto">
      <table class="s-tabla op-tabla">
        <thead><tr><th>Estudiante</th><th>DNI</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr><td>Quispe Mamani, Ana</td><td class="mono">71234567</td><td><span class="chip chip-exito">Activo</span></td><td><a href="#" class="enlace">Editar</a></td></tr>
          <tr class="hover"><td>Rojas Vega, Luis</td><td class="mono">70998811</td><td><span class="chip chip-aviso">Parcial</span></td><td><a href="#" class="enlace">Editar</a></td></tr>
        </tbody>
      </table>
    </div>
  </div>`
).join('');

const espaciado = `
<div class="aviso">
  <strong>Los controles no declaran padding vertical.</strong> Se fija la <strong>altura</strong> desde la rejilla y el texto se centra.
  El padding solo gobierna el horizontal.
  <br><br>
  Por qué: con padding vertical, la altura del botón depende de la interlínea de la
  fuente. 13px a 1.4 da caja de 18px; con 8+8 y borde salen <strong>36px</strong>, y no
  hay ningún múltiplo de 4 que dé 32px por esa vía —haría falta 6px de padding, que
  se sale de la rejilla. Fijando la altura, 28 · 32 · 40 · 48 salen exactos y todos
  los controles de una fila casan solos.
</div>

<h3 class="sub-seccion">Tamaños</h3>
<p class="seccion-sub">Cada tamaño con sus controles y la tabla debajo, para verlos en proporción.</p>
<div class="opciones">${opciones}</div>

<h3 class="sub-seccion">La rejilla de 4</h3>
<div class="rejilla-vis">
  ${[4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64].map((n) => `<div class="rej"><div class="rej-barra" style="width:${n}px"></div><span>${n}</span></div>`).join('')}
</div>

<h3 class="sub-seccion">Valores fuera de rejilla</h3>
<p class="seccion-sub">Tres medidas heredadas no son múltiplo de 4.</p>
<table class="tabla-simple">
  <thead><tr><th>Valor</th><th class="num">Hoy</th><th class="num">Propuesto</th><th>Consecuencia</th></tr></thead>
  <tbody>
    <tr><td>Fila cómoda</td><td class="num">34px</td><td class="num"><strong>32px</strong></td><td class="motivo">Dos píxeles menos por fila. En 25 filas visibles, gana media fila más de pantalla</td></tr>
    <tr><td>Alto del marco</td><td class="num">54px</td><td class="num"><strong>56px</strong></td><td class="motivo">Coincide con el botón flotante de móvil, que ya es 56</td></tr>
    <tr><td>Lateral plegada</td><td class="num">58px</td><td class="num"><strong>56px</strong></td><td class="motivo">Icono de 18px centrado en 56 deja 19px a cada lado</td></tr>
    <tr><td>Fila compacta</td><td class="num">28px</td><td class="num">28px</td><td class="motivo">Ya encaja. Sin cambio</td></tr>
  </tbody>
</table>`;

// ── Bloque «Ver código» ─────────────────────────────────────────────────────
// Plegado por defecto, con revelar y copiar. Es el patrón que usan Material,
// Carbon y Polaris: el ejemplo vivo manda, el código está a un clic.

let nCodigo = 0;
const verCodigo = (titulo, codigo) => {
  const id = 'cod' + ++nCodigo;
  const escapado = codigo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `
  <div class="cod-bloque">
    <div class="cod-cab">
      <button class="cod-ver" data-ver="${id}" aria-expanded="false" aria-controls="${id}">
        ${ICONOS.chevron}<span>Ver código</span>
      </button>
      <span class="cod-tit">${titulo}</span>
      <button class="copiar" data-copiar-de="${id}">Copiar</button>
    </div>
    <pre class="cod-pre" id="${id}" hidden>${escapado}</pre>
  </div>`;
};

// ── Elemento: Botón ─────────────────────────────────────────────────────────

const pagBoton = `
<p class="pag-intro">Cinco variantes y cuatro tamaños. <strong>Una sola acción principal
por pantalla</strong>: si hay dos botones rellenos compitiendo, uno de los dos no era
principal.</p>

<h3 class="sub-seccion">Las seis variantes</h3>
<p class="seccion-sub">Ordenadas de más a menos énfasis. <strong>Cuanto más abajo, más barato es equivocarse al pulsarlo.</strong></p>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf"><button class="btn btn-1">Guardar</button><span class="mf-et"><b>Principal</b><br><code>accion</code><br>Una por pantalla</span></div>
    <div class="mf"><button class="btn btn-destr">Eliminar</button><span class="mf-et"><b>Destructiva</b><br><code>destructiva</code><br>Irreversible</span></div>
    <div class="mf"><button class="btn btn-2">Columnas</button><span class="mf-et"><b>Secundaria</b><br><code>accion-2</code> en oro<br>Apoyo con identidad</span></div>
    <div class="mf"><button class="btn btn-neutro">Exportar</button><span class="mf-et"><b>Neutra</b><br><code>borde-campo</code><br>Apoyo sin peso</span></div>
    <div class="mf"><button class="btn btn-terc">Cancelar</button><span class="mf-et"><b>Terciaria</b><br>sin relleno ni borde<br>Retroceder</span></div>
    <div class="mf"><a href="#" class="enlace">Editar</a><span class="mf-et"><b>Enlace</b><br><code>enlace</code><br>Acción de fila</span></div>
  </div>
</div>

<h3 class="sub-seccion">Por acción — qué variante le toca a cada una</h3>
<p class="seccion-sub">La tabla que resuelve la duda real. No se elige la variante por gusto: se elige por lo que la acción hace y por lo que cuesta deshacerla.</p>
<table class="tabla-simple">
  <thead><tr><th>Acción</th><th>Variante</th><th>Aspecto</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>Guardar</strong> · Grabar · Crear · Confirmar</td><td><code>principal</code></td><td><button class="btn btn-mini btn-1">Guardar</button></td><td class="motivo">Es a lo que vino la persona. Una sola por pantalla</td></tr>
    <tr><td><strong>Eliminar</strong> · Anular · Dar de baja</td><td><code>destructiva</code></td><td><button class="btn btn-mini btn-destr">Eliminar</button></td><td class="motivo">Irreversible. El rojo avisa antes de pulsar, no después</td></tr>
    <tr><td><strong>Cancelar</strong> · Volver · Descartar</td><td><code>terciaria</code></td><td><button class="btn btn-mini btn-terc">Cancelar</button></td><td class="motivo">No debe competir. Si Cancelar pesa lo mismo que Guardar, la pantalla no dice qué hacer</td></tr>
    <tr><td><strong>Editar</strong> · Ver detalle (en fila)</td><td><code>enlace</code></td><td><a href="#" class="enlace">Editar</a></td><td class="motivo">Con cinco filas, cinco botones son ruido, no jerarquía</td></tr>
    <tr><td><strong>Columnas</strong> · Filtros avanzados</td><td><code>secundaria</code></td><td><button class="btn btn-mini btn-2">Columnas</button></td><td class="motivo">Le da al oro trabajo funcional y no solo decorativo</td></tr>
    <tr><td><strong>Exportar</strong> · Imprimir · Duplicar</td><td><code>neutra</code></td><td><button class="btn btn-mini btn-neutro">Exportar</button></td><td class="motivo">Apoyo que no necesita reclamar atención</td></tr>
    <tr><td><strong>Inactivo</strong> — sin permiso o sin datos</td><td><code>deshabilitada</code></td><td><button class="btn btn-mini demo-desh" disabled>Guardar</button></td><td class="motivo">Se ve pero no se pulsa. <strong>Di por qué</strong> en un texto al lado</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Dónde se ve de verdad: el pie de un diálogo</h3>
<p class="seccion-sub">Es el sitio donde Cancelar y la acción conviven, y donde más se equivoca la gente.</p>
<div class="bloque">
  <div class="dialogos">
    <div class="dlg">
      <div class="dlg-cuerpo">
        <strong>Eliminar 24 registros de asistencia</strong>
        <p>No se puede deshacer.</p>
      </div>
      <div class="dlg-pie">
        <button class="btn btn-terc">Cancelar</button>
        <button class="btn btn-destr">Eliminar</button>
      </div>
      <span class="dlg-et dlg-ok">Correcto</span>
    </div>
    <div class="dlg dlg-mal">
      <div class="dlg-cuerpo">
        <strong>¿Está seguro de que desea continuar?</strong>
        <p>Esta acción podría afectar a los datos del sistema.</p>
      </div>
      <div class="dlg-pie">
        <button class="btn btn-1">Aceptar</button>
        <button class="btn btn-1">Cancelar</button>
      </div>
      <span class="dlg-et dlg-mal-et">Incorrecto</span>
    </div>
  </div>
</div>
<table class="tabla-simple" style="margin-top:12px">
  <thead><tr><th>Lo que falla en el segundo</th><th>Regla</th></tr></thead>
  <tbody>
    <tr><td>Dos botones rellenos compitiendo</td><td class="motivo">Cancelar va en terciaria. Solo una acción lleva relleno</td></tr>
    <tr><td>«Aceptar» no dice qué va a pasar</td><td class="motivo">El botón lleva el <strong>verbo</strong>: <em>Eliminar</em>, no <em>Aceptar</em></td></tr>
    <tr><td>«¿Está seguro?» no informa</td><td class="motivo">Di <strong>qué</strong> se pierde y <strong>cuánto</strong>: «24 registros»</td></tr>
    <tr><td>«podría afectar a los datos»</td><td class="motivo">Un aviso que no se lee no avisa. Alargar el texto reduce la protección</td></tr>
    <tr><td>Cancelar a la derecha</td><td class="motivo">La acción va a la derecha, Cancelar a su izquierda. Siempre igual</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Estados de la principal</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf"><button class="btn btn-1">Guardar</button><span class="mf-et">Normal<br><code>accion</code></span></div>
    <div class="mf"><button class="btn" class="demo-hover">Guardar</button><span class="mf-et">Hover<br><code>accion-hover</code></span></div>
    <div class="mf"><button class="btn" class="demo-activa">Guardar</button><span class="mf-et">Presionado<br><code>accion-activa</code></span></div>
    <div class="mf"><button class="btn btn-1 foco-demo">Guardar</button><span class="mf-et">Con foco<br>anillo <code>foco</code> 2px</span></div>
  </div>
</div>

<h3 class="sub-seccion">Con icono</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf"><button class="btn btn-1 btn-ic">${ICONOS.panel}Nuevo estudiante</button><span class="mf-et">Icono a la izquierda</span></div>
    <div class="mf"><button class="btn btn-2 btn-ic">${ICONOS.chevron}Columnas</button><span class="mf-et">Icono en secundaria</span></div>
    <div class="mf"><button class="btn btn-neutro btn-ic btn-solo-ic" aria-label="Configuración">${ICONOS.configuracion}</button><span class="mf-et">Solo icono<br><strong>exige <code>aria-label</code></strong></span></div>
  </div>
</div>

<h3 class="sub-seccion">En móvil</h3>
<div class="bloque">
  <div class="movil-btn-demo">
    <button class="btn btn-1" style="width:100%;height:48px">Solicitar información</button>
    <span class="mf-et">Ancho completo, 48px de alto. Por debajo de 44px el dedo falla.</span>
  </div>
</div>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Una sola principal por pantalla.</strong> El resto son secundarias o neutras.</td></tr>
    <tr><td class="num">2</td><td><strong>Las acciones de fila van como enlace</strong>, no como botón. Con cinco filas, cinco botones sólidos son ruido, no jerarquía.</td></tr>
    <tr><td class="num">3</td><td>El botón dice el <strong>verbo</strong>, no «Aceptar». <em>Eliminar</em> / <em>Cancelar</em>.</td></tr>
    <tr><td class="num">4</td><td><strong>Nunca mayúsculas sostenidas.</strong> Se leen más lento.</td></tr>
    <tr><td class="num">5</td><td>Botón de solo icono <strong>siempre con <code>aria-label</code></strong>.</td></tr>
    <tr><td class="num">6</td><td>Prohibido quitar el anillo de foco. En móvil, mínimo 44px de alto.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Props</h3>
<table class="tabla-simple">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Por defecto</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td><code>variante</code></td><td class="mono">principal · secundaria · neutra</td><td class="mono">principal</td><td class="motivo">Jerarquía visual. Una sola principal por pantalla</td></tr>
    <tr><td><code>tamaño</code></td><td class="mono">pequeño · normal · grande</td><td class="mono">normal</td><td class="motivo">Pendiente de tu decisión en Espaciado</td></tr>
    <tr><td><code>deshabilitado</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Sin permiso o sin datos válidos</td></tr>
    <tr><td><code>icono</code></td><td class="mono">ReactNode</td><td class="mono">—</td><td class="motivo">Se coloca a la izquierda del texto</td></tr>
    <tr><td><code>anchoCompleto</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Ocupa el ancho del contenedor. Móvil</td></tr>
    <tr><td><code>aria-label</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo"><strong>Obligatorio</strong> si el botón es solo icono</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Boton } from '@ae/sistema';

<Boton variante="principal">Guardar</Boton>
<Boton variante="secundaria">Columnas</Boton>
<Boton variante="neutra">Exportar</Boton>
<Boton variante="principal" deshabilitado>Sin permiso</Boton>
<Boton variante="neutra" icono={<Ajustes />} aria-label="Configuración" />`
)}
<p class="pag-intro" style="margin-top:12px"><strong>Se copia la importación y las props, no el markup interno</strong> (MMI-DS §9). Si copiaras las tripas del botón, cada pantalla tendría su propia versión y el sistema dejaría de ser un sistema.</p>

<h3 class="sub-seccion">Composición — aquí sí se copia el markup</h3>
<p class="seccion-sub">La excepción del §9: ensamblar varios elementos es una composición puntual, no un componente compartido.</p>
${verCodigo(
  'Barra de filtros',
  `<div className="flex gap-2 p-4 border-b border-borde">
  <CampoTexto placeholder="71234567" aria-label="Buscar por DNI" />
  <Selector opciones={grados} placeholder="Todos los grados" />
  <div className="ml-auto flex gap-2">
    <Boton variante="neutra">Exportar</Boton>
    <Boton variante="secundaria">Columnas</Boton>
  </div>
</div>`
)}
`;

// ── Elemento: Enlace ────────────────────────────────────────────────────────

const pagEnlace = `
<p class="pag-intro">Un enlace <strong>lleva a otro sitio</strong>. Un botón <strong>hace algo
donde estás</strong>. Elegir mal no es un detalle de estilo: cambia el teclado, el menú
contextual, el lector de pantalla y si «abrir en pestaña nueva» funciona.</p>

<h3 class="sub-seccion">Enlace o botón</h3>
<table class="tabla-simple">
  <thead><tr><th>Si la acción…</th><th>Es</th><th>Ejemplo</th></tr></thead>
  <tbody>
    <tr><td>Cambia de pantalla o de URL</td><td><strong>Enlace</strong> <code>&lt;a href&gt;</code></td><td class="motivo">Ver detalle · Editar · Ir al expediente</td></tr>
    <tr><td>Descarga un archivo</td><td><strong>Enlace</strong></td><td class="motivo">Descargar constancia</td></tr>
    <tr><td>Modifica datos</td><td><strong>Botón</strong> <code>&lt;button&gt;</code></td><td class="motivo">Guardar · Eliminar</td></tr>
    <tr><td>Abre un diálogo o despliega algo</td><td><strong>Botón</strong></td><td class="motivo">Filtros · Columnas</td></tr>
    <tr><td>Envía un formulario</td><td><strong>Botón</strong></td><td class="motivo">Matricular</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">Regla rápida: <strong>si al pulsarlo con el botón derecho tiene sentido «abrir en pestaña nueva», es un enlace.</strong> Si no, es un botón.</p>

<h3 class="sub-seccion">El subrayado no es decoración: es obligatorio en texto corrido</h3>
<div class="aviso">
  <code>enlace</code> contra <code>texto-principal</code>
  da <strong>2,48:1</strong> en claro y <strong>1,91:1</strong> en oscuro. WCAG 1.4.1 pide 3:1
  para distinguir por color solo. No llega — <strong>y no hay ningún azul que llegue sin dejar
  de ser azul</strong>. Por eso el enlace dentro de un párrafo va subrayado siempre.
</div>
<div class="bloque">
  <div class="enl-comp">
    <div class="enl-caja bien">
      <p>La matrícula se cierra el 31 de marzo. Consulta los <a href="#" class="enlace enl-sub">requisitos de admisión</a> antes de esa fecha.</p>
      <span class="bien-et">Subrayado — se distingue sin depender del color</span>
    </div>
    <div class="enl-caja mal">
      <p>La matrícula se cierra el 31 de marzo. Consulta los <a href="#" class="enlace enl-nosub">requisitos de admisión</a> antes de esa fecha.</p>
      <span class="mal-et">Sin subrayar — 2,48:1 contra el texto. Quien no distingue el azul no lo ve</span>
    </div>
  </div>
</div>
<p class="pag-intro" style="margin-top:12px"><strong>La excepción:</strong> en una tabla o una lista, donde el enlace está solo en su celda y no rodeado de texto, el subrayado puede reservarse para el hover. Ahí no hay texto del que distinguirlo.</p>

<h3 class="sub-seccion">Los cuatro sitios donde aparece</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf">
      <p style="margin:0;font-size:15px;max-width:34ch">Consulta el <a href="#" class="enlace enl-sub">calendario académico</a>.</p>
      <span class="mf-et"><b>En texto corrido</b><br>Subrayado siempre<br><code>enlace</code></span>
    </div>
    <div class="mf">
      <a href="#" class="enlace">Editar</a>
      <span class="mf-et"><b>Acción de fila</b><br>Sin subrayar; subraya al pasar<br><code>enlace</code></span>
    </div>
    <div class="mf">
      <a href="#" class="enlace enl-sub enl-ext">Ministerio de Educación</a>
      <span class="mf-et"><b>Externo</b><br>Icono y <code>aria-label</code> que avisa<br>Sale del sistema</span>
    </div>
    <div class="mf">
      <span class="enl-marco-caja"><a href="#" class="enl-en-marco">Ayuda</a></span>
      <span class="mf-et"><b>Dentro del marco</b><br><code>marco-acento</code>, nunca <code>enlace</code><br>El azul sobre azul da 1,81:1</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Estados</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf"><a href="#" class="enlace">Ver detalle</a><span class="mf-et"><b>Reposo</b><br>5,75:1 sobre tarjeta</span></div>
    <div class="mf"><a href="#" class="enlace enl-sub">Ver detalle</a><span class="mf-et"><b>Hover</b><br>Aparece el subrayado</span></div>
    <div class="mf"><a href="#" class="enlace foco-demo">Ver detalle</a><span class="mf-et"><b>Foco</b><br>Anillo <code>foco</code> 2px</span></div>
    <div class="mf"><a href="#" class="enlace enl-activo">Ver detalle</a><span class="mf-et"><b>Activo</b><br><code>accion-activa</code></span></div>
    <div class="mf"><span class="enl-desh">Ver detalle</span><span class="mf-et"><b>Sin permiso</b><br>No es enlace: es texto<br>Un enlace muerto engaña</span></div>
  </div>
</div>

<h3 class="sub-seccion">El texto del enlace</h3>
<table class="tabla-simple">
  <thead><tr><th>✗</th><th>✓</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td>«Clic aquí»</td><td>«Ver requisitos de admisión»</td><td class="motivo">Un lector de pantalla puede listar solo los enlaces. «Clic aquí» ×12 no dice nada</td></tr>
    <tr><td>«Más información»</td><td>«Calendario académico 2026»</td><td class="motivo">El texto debe entenderse <strong>fuera de contexto</strong></td></tr>
    <tr><td>«https://ae.edu.pe/adm…»</td><td>«Admisión»</td><td class="motivo">Una URL cruda se lee carácter a carácter</td></tr>
    <tr><td>«Leer más» en cada tarjeta</td><td>«Leer sobre Inicial»</td><td class="motivo">Doce enlaces idénticos que llevan a sitios distintos</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Navega → enlace. Actúa → botón. <strong>Nunca un <code>div</code> con <code>onClick</code>.</strong></td></tr>
    <tr><td class="num">2</td><td>En texto corrido, <strong>subrayado siempre</strong>. Medido: 2,48:1 no llega a los 3:1 que pide la norma.</td></tr>
    <tr><td class="num">3</td><td>Dentro del marco, <code>marco-acento</code>. <strong>Nunca <code>enlace</code></strong>: 1,81:1.</td></tr>
    <tr><td class="num">4</td><td>El texto debe entenderse fuera de contexto. Prohibido «clic aquí».</td></tr>
    <tr><td class="num">5</td><td>Enlace externo: icono visible y aviso en <code>aria-label</code>.</td></tr>
    <tr><td class="num">6</td><td><code>target="_blank"</code> solo si salir pierde trabajo del formulario. Y avísalo.</td></tr>
    <tr><td class="num">7</td><td>Sin permiso, <strong>no es un enlace deshabilitado</strong>: es texto plano. Un enlace muerto engaña.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Enlace } from '@ae/sistema';

<Enlace href="/estudiantes/71234567">Ver detalle</Enlace>
<Enlace href="/calendario" enTexto>calendario académico</Enlace>
<Enlace href="https://minedu.gob.pe" externo>Ministerio de Educación</Enlace>
<Enlace href="/ayuda" enMarco>Ayuda</Enlace>`
)}
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Por defecto</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td><code>href</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo"><strong>Obligatorio.</strong> Sin destino no es un enlace</td></tr>
    <tr><td><code>enTexto</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Subrayado permanente. Para enlaces dentro de un párrafo</td></tr>
    <tr><td><code>externo</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Añade icono, <code>rel="noopener"</code> y aviso accesible</td></tr>
    <tr><td><code>enMarco</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Usa <code>marco-acento</code>. Obligatorio dentro de la navegación</td></tr>
  </tbody>
</table>`;

// ── Elemento: Campo de texto ────────────────────────────────────────────────

// Icono de error propio de esta página: el error nunca se señala solo con
// color, y un chevron girado no dice «error». Se define aquí y no en ICONOS
// para no alterar la página de Iconos, que ya está cerrada.
const ICO_ERROR = icono('alerta');

const campoDemo = (o = {}) => `
  <label class="cg ${o.clase || ''}">
    <span class="cg-et">${o.etiqueta || 'Documento de identidad'}${o.obligatorio ? '<b class="cg-req" aria-hidden="true">*</b>' : ''}</span>
    ${
      o.area
        ? `<textarea class="campo cg-in ${o.inClase || ''}" rows="3" placeholder="${o.pista || ''}"${o.desh ? ' disabled' : ''}>${o.valor || ''}</textarea>`
        : `<input class="campo cg-in ${o.inClase || ''}" placeholder="${o.pista || ''}" value="${o.valor || ''}"${o.desh ? ' disabled' : ''}${o.lectura ? ' readonly' : ''}>`
    }
    ${o.error ? `<span class="cg-error">${ICO_ERROR}${o.error}</span>` : ''}
    ${o.ayuda ? `<span class="cg-ayuda">${o.ayuda}</span>` : ''}
  </label>`;

const pagCampo = `
<p class="pag-intro">El sitio donde el sistema pide algo. <strong>El formulario trabaja, no
enseña</strong>: si un campo necesita un párrafo para entenderse, el problema es el campo.</p>

<h3 class="sub-seccion">Anatomía</h3>
<div class="bloque">
  <div class="anatomia">
    ${campoDemo({ etiqueta: 'Documento de identidad', obligatorio: true, pista: '71234567', ayuda: 'Ocho dígitos, sin guiones ni puntos.' })}
    <ol class="anat-lista">
      <li><b>Etiqueta</b> — <strong>siempre visible</strong>, encima del campo. 13px Medium.</li>
      <li><b>Marca de obligatorio</b> — solo si de verdad lo es. Y nunca es el único aviso.</li>
      <li><b>Contorno</b> — <code>borde-campo</code>. Mide 3,48:1: es lo que hace que el campo se vea.</li>
      <li><b>Pista</b> — un <strong>ejemplo del formato</strong>, no una instrucción. Desaparece al escribir.</li>
      <li><b>Ayuda</b> — una línea, debajo. Si hacen falta dos, sobra una.</li>
    </ol>
  </div>
</div>

<h3 class="sub-seccion">La etiqueta nunca se sustituye por la pista</h3>
<div class="bloque">
  <div class="enl-comp">
    <div class="enl-caja bien">
      ${campoDemo({ etiqueta: 'Documento de identidad', pista: '71234567' })}
      <span class="bien-et">Al escribir, la etiqueta sigue ahí</span>
    </div>
    <div class="enl-caja mal">
      <label class="cg"><span class="cg-et cg-et-oculta">&nbsp;</span>
        <input class="campo cg-in" value="71234567"></label>
      <span class="mal-et">Etiqueta como pista: al escribir desaparece y ya nadie sabe qué campo es</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Estados</h3>
<div class="bloque">
  <div class="campos-rejilla">
    ${campoDemo({ etiqueta: 'Reposo', pista: '71234567' })}
    ${campoDemo({ etiqueta: 'Con foco', pista: '71234567', inClase: 'foco-demo' })}
    ${campoDemo({ etiqueta: 'Relleno', valor: '71234567' })}
    ${campoDemo({ etiqueta: 'Con error', valor: '7123', inClase: 'cg-mal', error: 'Faltan 4 dígitos.' })}
    ${campoDemo({ etiqueta: 'Solo lectura', valor: '71234567', lectura: true, ayuda: 'Se ve y se copia. No se edita.' })}
    ${campoDemo({ etiqueta: 'Sin permiso', valor: '71234567', desh: true, ayuda: 'Solo Dirección puede editarlo.' })}
  </div>
</div>
<p class="pag-intro" style="margin-top:12px"><strong>Deshabilitado y solo lectura no son lo mismo.</strong>
Solo lectura se puede seleccionar, copiar y leer con lector de pantalla; deshabilitado no.
Para un dato que la persona debe <em>ver</em> pero no cambiar, va <strong>solo lectura</strong>.</p>

<h3 class="sub-seccion">Tipos</h3>
<div class="bloque">
  <div class="campos-rejilla">
    ${campoDemo({ etiqueta: 'Texto', pista: 'Quispe Mamani' })}
    ${campoDemo({ etiqueta: 'DNI', pista: '71234567', ayuda: 'Se valida el dígito verificador.' })}
    ${campoDemo({ etiqueta: 'Correo', pista: 'ana@ae.edu.pe' })}
    ${campoDemo({ etiqueta: 'Teléfono', pista: '987 654 321' })}
    ${campoDemo({ etiqueta: 'Monto en soles', pista: '1 240.00', ayuda: 'Alineado a la derecha, en mono.' })}
    ${campoDemo({ etiqueta: 'Observación', area: true, pista: 'Motivo de la inasistencia' })}
  </div>
</div>
<p class="pag-intro" style="margin-top:12px">DNI, RUC, montos y fechas peruanas son <strong>primitivas de dominio</strong>, no campos genéricos con una máscara encima. Entran en la fase 6. Ninguna librería del mundo las trae.</p>

<h3 class="sub-seccion">Validación — ante la duda, avisar sí; bloquear no</h3>
<div class="aviso">
  Una validación que <strong>impide escribir</strong> solo debe existir cuando el sistema sabe
  <strong>con certeza</strong> que el dato está mal. Quien tiene prisa y se topa con un campo
  que no le deja avanzar <strong>inventa un dato que sí pase</strong>. Y un dato inventado es
  peor que un dato raro: el raro se ve, el inventado no.
</div>
<table class="tabla-simple">
  <thead><tr><th>Situación</th><th>Qué hace el campo</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td>El DNI tiene 7 dígitos</td><td><strong>Avisa al salir</strong> del campo</td><td class="motivo">Se sabe con certeza que está mal. Pero avisa, no borra</td></tr>
    <tr><td>El apellido lleva espacios sobrantes</td><td><strong>Limpia en silencio</strong></td><td class="motivo">Limpiar no es rechazar. Quitar espacios es invisible y ayuda</td></tr>
    <tr><td>El teléfono tiene formato raro</td><td><strong>Lo acepta</strong></td><td class="motivo">Hay teléfonos con extensión, con prefijo. No se sabe con certeza</td></tr>
    <tr><td>El nombre lleva un solo apellido</td><td><strong>Lo acepta</strong></td><td class="motivo">Hay personas con un apellido. Bloquear excluye</td></tr>
    <tr><td>Falta un campo obligatorio</td><td><strong>Avisa al enviar</strong>, no antes</td><td class="motivo">Marcar en rojo lo que aún no se ha rellenado castiga por ir en orden</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">El mensaje de error dice qué hacer</h3>
<table class="tabla-simple">
  <thead><tr><th>✗</th><th>✓</th></tr></thead>
  <tbody>
    <tr><td>«Campo inválido»</td><td>«El DNI debe tener 8 dígitos»</td></tr>
    <tr><td>«Error de formato»</td><td>«Falta el @ en el correo»</td></tr>
    <tr><td>«Dato incorrecto»</td><td>«El dígito verificador no coincide. Revísalo»</td></tr>
    <tr><td>«Campo requerido»</td><td>«Falta el nombre del apoderado»</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Accesibilidad</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>La etiqueta va en <code>&lt;label&gt;</code> asociada al campo. <strong>Un <code>&lt;span&gt;</code> encima no vale:</strong> pulsar la etiqueta no enfoca y el lector no la lee.</td></tr>
    <tr><td class="num">2</td><td>La ayuda y el error se enlazan con <code>aria-describedby</code>. Si no, el lector los ignora.</td></tr>
    <tr><td class="num">3</td><td>En error, <code>aria-invalid="true"</code>.</td></tr>
    <tr><td class="num">4</td><td>El error <strong>nunca solo en rojo</strong>: lleva texto y icono. Hay quien no distingue el rojo.</td></tr>
    <tr><td class="num">5</td><td>El asterisco de obligatorio va <code>aria-hidden</code> y el campo lleva <code>required</code>. El asterisco solo no se anuncia.</td></tr>
    <tr><td class="num">6</td><td>En móvil, mínimo <strong>16px</strong> de texto: por debajo, iOS hace zoom al enfocar y descoloca la pantalla.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { CampoTexto } from '@ae/sistema';

<CampoTexto
  etiqueta="Documento de identidad"
  pista="71234567"
  ayuda="Ocho dígitos, sin guiones ni puntos."
  obligatorio
/>

<CampoTexto etiqueta="Observación" area rows={3} />
<CampoTexto etiqueta="Monto" tipo="soles" />
<CampoTexto etiqueta="Sede" valor="Huaraz" soloLectura />
<CampoTexto etiqueta="DNI" valor="7123" error="Faltan 4 dígitos." />`
)}
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Por defecto</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td><code>etiqueta</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo"><strong>Obligatoria.</strong> Sin etiqueta el componente no renderiza</td></tr>
    <tr><td><code>pista</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo">Ejemplo de formato. <strong>Nunca una instrucción</strong></td></tr>
    <tr><td><code>ayuda</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo">Una línea bajo el campo</td></tr>
    <tr><td><code>error</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo">Su presencia activa el estado de error y <code>aria-invalid</code></td></tr>
    <tr><td><code>tipo</code></td><td class="mono">texto · dni · ruc · correo · soles</td><td class="mono">texto</td><td class="motivo">Teclado, alineación y validación de dominio</td></tr>
    <tr><td><code>soloLectura</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Se ve y se copia. Prefiérelo a <code>deshabilitado</code></td></tr>
    <tr><td><code>obligatorio</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Marca visual + <code>required</code></td></tr>
    <tr><td><code>area</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Renderiza <code>textarea</code></td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Campo de contraseña — el que jamás se normaliza</h3>
<p class="seccion-sub">Su regla existía antes que él (§6bis): <strong>ni trim, ni caja</strong> — un
espacio en una contraseña puede ser deliberado, y «limpiarlo» es cambiar la llave sin avisar.
Por eso no usa el input de <code>Campo</code> (que recorta al salir): se compone con su render-prop
y pone el suyo, exento por construcción. Trae el conmutador <strong>ver / no ver</strong> con
<code>aria-pressed</code> —mostrar es solo pantalla, el valor no cambia—, <code>autoComplete</code>
correcto (<code>current-password</code>, o <code>new-password</code> con la prop <code>nueva</code>) y
<strong>nada de bloquear pegado</strong>: quien pega desde su gestor hace lo correcto.</p>
<div class="bloque">
  <div class="muestra-fila">
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="cp-demo">Contraseña</label>
      <div class="cp">
        <input class="campo cp-in" id="cp-demo" type="password" value="correcto caballo pila" readonly>
        <button type="button" class="cp-ver" aria-pressed="false" aria-label="Mostrar contraseña">${icono('ojo')}</button>
      </div>
    </div>
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="cp-demo-2">Nueva contraseña</label>
      <div class="cp">
        <input class="campo cp-in" id="cp-demo-2" type="text" value="correcto caballo pila" readonly>
        <button type="button" class="cp-ver" aria-pressed="true" aria-label="Ocultar contraseña">${icono('ojoTachado')}</button>
      </div>
      <span class="campo-ayuda">Mostrada: el conmutador es solo pantalla</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">La frontera de escritura es del producto</h3>
<p class="seccion-sub">Cómo entra cada dato a la base <strong>no es de este paquete</strong>: el sistema
pinta y se comporta en pantalla; persistir lo decide quien tiene la base. La guía vive en el
manual (§6bis): normalizar <strong>al grabar, no al teclear</strong>; <code>trim</code> y colapso de espacios
para todo; minúsculas solo donde son canónicas (correo, usuario, código); <strong>los nombres
conservan su caja</strong>; la contraseña jamás se normaliza. La utilidad <code>alGuardar</code> vivió
una versión (v1.35.0) y se retiró por esta misma razón.</p>`;

// ── Elemento: Carga de imagen — R35 ─────────────────────────────────────────

// ── Elemento: Fila de carga ─────────────────────────────────────────────────
// R102. La pieza de la que dependen las tres cargas. Su página va ANTES que
// las tres a propósito: lo que hay que entender primero es la medida.

const pagFilaCarga = `
<p class="pag-intro">El <strong>arranque y el final comunes</strong> de las tres cargas —imagen,
PDF e ID—. Una fila que mide <strong>lo que mide un campo</strong>: el rótulo arriba, el
disparador y lo ya cargado al costado, y debajo el error y la nota. Nada crece, cargue lo que
cargue.</p>

<div class="aviso"><strong>La regla es una medida, no un gusto.</strong> Un <code>.campo</code>
mide <strong>36,45 px</strong> —medidos aquí, con el navegador: 13 px de texto con 18,85 de interlínea real, más 8+8 de relleno y
1+1 de borde—. Antes, la carga de imagen pintaba una caja de <strong>96</strong>, la de PDF
apilaba la lista <em>encima</em> del botón y la de ID ponía miniaturas de <strong>48</strong>.
Las tres rompían la rejilla del formulario, cada una a su manera.</div>

<div class="bloque">
  <p class="seccion-sub"><strong>Las tres, en el mismo formulario.</strong> Con los campos de
  verdad alrededor, que es donde se ve si rompen o no. Ninguna de las tres filas pasa de los
  36 px, y las cuatro etiquetas caen sobre la misma columna.</p>

  <div class="caso">
    <div class="caso-lienzo">
      <div class="caso-form">
      <div class="campo-grupo">
        <label class="campo-etiqueta" for="cx-m-1">Alumno</label>
        <input id="cx-m-1" class="campo cg-in" value="Quispe Ramos, Ana Lucía" readonly>
      </div>

      <div class="cx">
        <div class="cx-fila">
          <span class="cx-et">Boleta de notas</span>
          <button class="btn btn-neutro btn-mini btn-ic">${icono('subir')}Subir imagen</button>
          <ul class="cx-adjuntos">
            <li class="cx-adj cx-adj-img">
              <img class="cx-mini" id="cx-demo-fuente" src="${ESCUDO_PNG}" alt="Boleta de notas">
              <button class="btn btn-terc btn-mini btn-solo-ic" aria-label="Quitar Boleta de notas">${icono('papelera')}</button>
            </li>
          </ul>
        </div>
        <span class="cx-nota">JPG o PNG · hasta 5 MB</span>
      </div>

      <div class="cx">
        <div class="cx-fila">
          <span class="cx-et">Acta firmada</span>
          <button class="btn btn-neutro btn-mini btn-ic" aria-expanded="false">${icono('pdf')}Subir PDF</button>
          <ul class="cx-adjuntos">
            <li class="cx-adj">
              ${icono('documento')}
              <span class="cx-arch"><span class="cx-nombre">acta-bimestre-III-2026</span><span class="cx-ext">.pdf</span></span>
              <span class="cx-peso">312 KB</span>
              <button class="btn btn-terc btn-mini btn-solo-ic" aria-label="Quitar acta-bimestre-III-2026.pdf">${icono('papelera')}</button>
            </li>
          </ul>
        </div>
      </div>

      <div class="cx">
        <div class="cx-fila">
          <span class="cx-et">Documento de identidad</span>
          <button class="btn btn-neutro btn-mini btn-ic">${icono('documento')}Subir ID</button>
          <ul class="cx-adjuntos">
            <li class="cx-adj cx-adj-img">
              <button type="button" class="cx-ver" aria-label="Ver anverso en grande">
                <img class="cx-mini cx-mini-id" src="${LOCKUP_PNG}" alt="">
              </button>
            </li>
            <li class="cx-adj cx-adj-img">
              <button type="button" class="cx-ver" aria-label="Ver reverso en grande">
                <img class="cx-mini cx-mini-id" src="${LOCKUP_PNG}" alt="">
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="campo-grupo">
        <label class="campo-etiqueta" for="cx-m-2">Observación</label>
        <input id="cx-m-2" class="campo cg-in" placeholder="Opcional">
      </div>
      </div>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Los estados</h3>
<p class="seccion-sub">Todos miden lo mismo. Lo que cambia es qué hay dentro, nunca cuánto ocupa.</p>

<div class="bloque">
  <div class="caso-form">
    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Vacío</span>
        <button class="btn btn-neutro btn-mini btn-ic">${icono('subir')}Subir imagen</button>
        <span class="cx-vacio">Ningún archivo</span>
      </div>
    </div>

    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Varios — el sobrante se cuenta, no se apila</span>
        <button class="btn btn-neutro btn-mini btn-ic">${icono('subir')}Subir imagen</button>
        <ul class="cx-adjuntos">
          <li class="cx-adj cx-adj-img"><img class="cx-mini" data-mini alt="Cara A"></li>
          <li class="cx-adj cx-adj-img"><img class="cx-mini" data-mini alt="Cara B"></li>
          <li class="cx-mas">+3</li>
        </ul>
      </div>
    </div>

    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Con error</span>
        <button class="btn btn-neutro btn-mini btn-ic" aria-expanded="false">${icono('pdf')}Subir PDF</button>
        <ul class="cx-adjuntos">
          <li class="cx-adj">
            ${icono('documento')}
            <span class="cx-arch"><span class="cx-nombre">escaneo-completo</span><span class="cx-ext">.pdf</span></span>
            <span class="cx-peso">8,4 MB</span>
          </li>
        </ul>
      </div>
      <span class="cx-error">${icono('alerta')}Pesa 8,4 MB después de comprimir. El máximo son 5 MB.</span>
    </div>

    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Con el panel abierto — se despliega aquí y empuja</span>
        <button class="btn btn-neutro btn-mini btn-ic" aria-expanded="true">${icono('pdf')}Subir PDF</button>
      </div>
      <div class="cx-panel">
        <p class="cx-nota">Arrastra el PDF aquí o elígelo desde tu equipo.</p>
      </div>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Tres decisiones que no son de aspecto</h3>
<ol class="man-lista">
  <li><strong>Lo que no cabe se cuenta.</strong> Tres adjuntos a la vista y «+2» para el resto.
  Envolver en dos renglones vuelve a romper la estática, solo que hacia abajo; una tira que se
  sale por el borde no dice cuánto falta.</li>
  <li><strong>La extensión no se recorta jamás.</strong> El nombre sí —con puntos suspensivos—,
  pero cortar <code>boleta-…-2026.pdf</code> por el final se lleva justo el dato que dice qué es
  el archivo.</li>
  <li><strong>La miniatura no sirve para reconocer.</strong> A 22 px no se lee un documento, y no
  es a lo que va: sirve para saber que hay algo puesto y cuál de los dos es. Reconocerlo es
  trabajo del visor, que se abre pulsándola.</li>
</ol>`;

const pagCargaImagen = `
<p class="pag-intro">Elegir una imagen, <strong>encuadrarla</strong> —arrastrar para mover,
botones para acercar, flechas con el teclado— y entregar el recorte <strong>en WebP</strong> con la
<strong>proporción del hueco real</strong> donde va a vivir. Tres formatos cerrados: la foto en
círculo (1:1), el logo extendido a <strong>212×44</strong> —el hueco de la marca en el lateral—
y el comprimido en cuadrado. La subida es del producto.</p>
<div class="aviso"><strong>Por omisión es una fila</strong>, la misma que la carga de PDF y la de
ID: <strong>el rótulo, el botón y la imagen cargada, en un solo renglón</strong> de 36 px. Nunca dos. La vista previa a tamaño real sigue existiendo y se pide —<code>presentacion="caja"</code>—
para las pantallas que están hechas para poner esa imagen.</div>

<div class="bloque">
  <p class="seccion-sub"><strong>Pruébalo.</strong> Elige una imagen y encuadra. Al grabar, la
  miniatura queda <strong>al costado del botón</strong>, dentro de la fila: 22 px, y en
  <strong>círculo</strong> cuando lo que se sube es la foto de una persona —así se ve en la ficha
  y en la tabla, y aquí tiene que ser la misma persona con la misma pinta—. El editor sí adopta la
  proporción del formato: encuadrar un logo apaisado en un cuadro cuadrado es encuadrar a ciegas.</p>

  <div class="caso-form">
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ci-f-1">Apellidos y nombres</label>
      <input id="ci-f-1" class="campo cg-in" value="QUISPE MAMANI, Rosa" readonly>
    </div>

    <div class="cx" data-carga="foto">
      <div class="cx-fila">
        <span class="cx-et">Foto del trabajador</span>
        <button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('camara')}Subir foto</button>
        <ul class="cx-adjuntos" data-minis hidden></ul>
        <span class="cx-vacio" data-vacio>Sin foto</span>
      </div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>

    <div class="cx" data-carga="ext">
      <div class="cx-fila">
        <span class="cx-et">Logo extendido</span>
        <button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('subir')}Subir logo</button>
        <ul class="cx-adjuntos" data-minis hidden></ul>
        <span class="cx-vacio" data-vacio>Sin logo</span>
      </div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>

    <div class="cx" data-carga="comp">
      <div class="cx-fila">
        <span class="cx-et">Logo comprimido</span>
        <button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('subir')}Subir logo</button>
        <ul class="cx-adjuntos" data-minis hidden></ul>
        <span class="cx-vacio" data-vacio>Sin logo</span>
      </div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>

    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Con error</span>
        <button class="btn btn-neutro btn-mini btn-ic">${icono('camara')}Subir foto</button>
        <span class="cx-vacio">Sin foto</span>
      </div>
      <span class="cx-error">${icono('alerta')}La imagen pesa 6 MB y el máximo es 2 MB.</span>
    </div>

    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ci-f-2">Observación</label>
      <input id="ci-f-2" class="campo cg-in" placeholder="Opcional">
    </div>
  </div>
</div>

<h3 class="sub-seccion">La vista previa a tamaño real: <code>presentacion="caja"</code></h3>
<p class="seccion-sub">Para una pantalla <strong>dedicada</strong> a poner esa imagen, donde la caja
no estorba sino que es el punto: enseña el <strong>hueco real</strong> donde va a vivir —el círculo
del avatar, los 212×44 de la marca en el lateral—. En un formulario mide 96 px contra los 36,45 de
un campo, y por eso ahí va la fila.</p>
<div class="bloque">
  <div class="muestra-fila">
    <div class="ci" data-carga="foto">
      <span class="cx-et">Foto del trabajador</span>
      <div class="ci-caja ci-m ci-redonda"><span class="cx-vacio">Sin foto</span></div>
      <div class="ci-acciones"><button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('camara')}Subir foto</button></div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>
    <div class="ci" data-carga="foto">
      <span class="cx-et">Foto del trabajador</span>
      <div class="ci-caja ci-m ci-redonda"><span class="avatar avatar-xl avatar-2 ci-avatar" title="JOSE ISIDRO PINEDA">JI</span><span class="sr-solo">Sin foto</span></div>
      <div class="ci-acciones"><button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('camara')}Subir foto</button></div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>
    <div class="ci" data-carga="ext">
      <span class="cx-et">Logo extendido</span>
      <div class="ci-caja ci-extendida"><span class="cx-vacio">Sin logo</span></div>
      <div class="ci-acciones"><button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('subir')}Subir logo</button></div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>
    <div class="ci" data-carga="comp">
      <span class="cx-et">Logo comprimido</span>
      <div class="ci-caja ci-s"><span class="cx-vacio">Sin logo</span></div>
      <div class="ci-acciones"><button class="btn btn-neutro btn-mini btn-ic" data-elegir>${icono('subir')}Subir logo</button></div>
      <span class="cx-nota" data-peso hidden></span>
      <input type="file" accept="image/*" class="ci-entrada" tabindex="-1" aria-hidden="true">
    </div>
    <div class="ci">
      <span class="cx-et">Foto del trabajador</span>
      <div class="ci-caja ci-l ci-redonda"><span class="cx-vacio">Sin foto</span></div>
      <div class="ci-acciones"><button class="btn btn-neutro btn-mini btn-ic">${icono('camara')}Subir foto</button></div>
      <span class="cx-error">${icono('alerta')}La imagen pesa 6 MB y el máximo es 2 MB.</span>
    </div>
  </div>

  <!-- EL EDITOR VIVE EN UN DIALOGO, como en el componente. Estaba suelto al
       final de la pagina, y con las filas arriba se abria a pantalla y media de
       distancia de donde se habia pulsado: parecia que no pasaba nada. Ademas
       era una divergencia con lo entregado — el componente lo abre en «Dialogo»
       y el catalogo lo desplegaba en linea. El MISMO marcado que emite Dialogo:
       caja, cabecera, cuerpo y pie con Cancelar a la izquierda. -->
  <dialog class="dialogo" id="ci-demo-dlg" aria-labelledby="ci-demo-tit">
    <div class="dialogo-caja">
      <div class="dialogo-cab"><h2 class="dialogo-tit" id="ci-demo-tit" tabindex="-1">Encuadrar</h2></div>
      <div class="dialogo-cuerpo">
        <div class="ci-editor" id="ci-demo-editor">
          <div class="ci-marco-editor">
            <canvas class="ci-lienzo" id="ci-demo-lienzo" width="260" height="260" tabindex="0"
              aria-label="Encuadre. Flechas para mover la imagen; los botones acercan y alejan."></canvas>
            <div class="ci-mascara" id="ci-demo-mascara" aria-hidden="true" hidden></div>
          </div>
          <div class="ci-zoom">
            <button class="btn btn-neutro btn-mini" id="ci-demo-menos" aria-label="Alejar">−</button>
            <button class="btn btn-neutro btn-mini" id="ci-demo-mas" aria-label="Acercar">+</button>
          </div>
        </div>
      </div>
      <div class="dialogo-pie">
        <button class="btn btn-neutro" id="ci-demo-cancelar">Cancelar</button>
        <button class="btn btn-1" id="ci-demo-usar">Grabar</button>
      </div>
    </div>
  </dialog>
</div>
<p class="seccion-sub">En React, el editor vive en un <code>Dialogo</code> con «pulsar fuera»
APAGADO —un encuadre a medias no se pierde por un clic—. El recorte sale en <strong>WebP</strong>
(0,85), con caída a PNG por especificación: se lee <code>blob.type</code>, no se asume extensión.</p>

<p class="seccion-sub">La caja mide <strong>96 px</strong> y un campo <strong>36,45</strong>: entre
dos campos rompe la rejilla, y por eso el defecto es la <a href="#filacarga" data-ir="filacarga"
class="enlace">fila de carga</a>. La caja se pide cuando la pantalla ES para poner esa imagen.</p>

<div class="cod">
  <div class="cod-cab"><span class="cod-tit">Uso</span></div>
  <pre class="cod-pre"><code>&lt;!-- En un formulario. No hay que pedir nada: la fila es el defecto --&gt;
&lt;CargaImagen
  etiqueta="Foto del trabajador"
  valor={ficha.foto}
  onCambio={({ archivo }) =&gt; subir(archivo)}
  onQuitar={() =&gt; borrar()}
/&gt;

&lt;!-- En una pantalla dedicada a poner esa imagen --&gt;
&lt;CargaImagen
  etiqueta="Logo de la institución"
  presentacion="caja"
  formato="logo-extendido"
  valor={marca.logo}
  onCambio={({ archivo }) =&gt; subir(archivo)}
/&gt;</code></pre>
</div>`;

// ── Elemento: Carga de PDF ──────────────────────────────────────────────────

const pagCargaPdf = `
<p class="pag-intro">Soltar o elegir <strong>un PDF</strong>, comprobar que lo es
<strong>mirando sus bytes</strong> —no la extensión, que miente— y
<strong>comprimirlo antes de entregarlo</strong>. La subida es del producto: el componente
devuelve el archivo listo y los dos pesos.</p>

<div class="bloque">
  <p class="seccion-sub"><strong>Pruébalo con un PDF de verdad.</strong> Suéltalo en el recuadro o
  elígelo. Aquí —y <em>solo</em> aquí— se enseña <strong>peso inicial → peso final</strong>: en un
  producto esa cifra no le importa a quien sube un acta, pero en el catálogo es la prueba de que la
  compresión ocurre. Los dos pesos viajan siempre en <code>onCambio</code>.</p>

  <p class="seccion-sub"><strong>Está dentro de un formulario a propósito</strong>: pulsa «Subir PDF»
  y mira cómo el panel se despliega <em>en su sitio</em> y empuja los campos de abajo. Nada flota
  encima. Al grabar o cancelar, el formulario vuelve a su diseño con la información puesta.</p>

  <form class="campos-rejilla" data-form-pdf onsubmit="return false">
    <label class="cg"><span class="cg-et">Apellidos y nombres</span>
      <input class="campo cg-in" value="QUISPE MAMANI, Rosa" readonly></label>

    <div class="cx" data-pdf="uno">
      <span class="cpdf-et">Acta de notas</span>

      <!-- R102 · LA FILA. Lo cargado va AL COSTADO del disparador y no encima:
           antes la lista se apilaba arriba y el formulario entero se movia
           cada vez que se anadia un archivo. -->
      <div class="cx-fila">
        <button class="btn btn-neutro btn-mini btn-ic" data-abrir
          aria-expanded="false" aria-controls="cpdf-demo-panel">${icono('pdf')}Subir PDF</button>
        <ul class="cx-adjuntos" data-lista hidden></ul>
        <span class="cx-vacio" data-vacio>Ningún archivo</span>
      </div>

      <div class="cx-panel" id="cpdf-demo-panel" data-panel hidden>
        <div class="cpdf-zona" data-zona>
          <ul class="cpdf-lista" data-borrador hidden></ul>
          <p class="cpdf-invita" data-invita>
            <span class="cpdf-ico" aria-hidden="true">${icono('subir', TAMANOS.estado)}</span>
            <span class="cpdf-instr">Arrastra el PDF aquí o elígelo desde tu equipo.</span>
          </p>
          <span class="cpdf-pista">Solo PDF · máximo 10,0 MB una vez comprimido.</span>
          <div class="cpdf-trabajo" data-trabajo hidden>
            <div class="pr-caja">
              <div class="pr-cab"><span>Comprimiendo el PDF…</span></div>
              <div class="pr" role="progressbar" aria-label="Comprimiendo el PDF"><div class="pr-indet"></div></div>
            </div>
          </div>
          <span class="cpdf-error" data-error role="alert" hidden></span>
          <input type="file" accept="application/pdf,.pdf" class="cpdf-entrada" tabindex="-1" aria-hidden="true">
        </div>
        <!-- EXACTAMENTE DOS BOTONES. «Subir» siempre; el segundo MUTA:
             «Cancelar» sin contenido o con error, «Grabar» con un PDF valido.
             Los dos estados NO se parecen —terciario plano frente al principal
             azul— para que el cambio se vea, no solo se lea. -->
        <div class="cpdf-pie">
          <button class="btn btn-neutro btn-mini btn-ic" data-subir>${icono('subir')}Subir</button>
          <button class="btn btn-terc btn-mini" data-segundo>Cancelar</button>
        </div>
      </div>

      <span class="cx-nota">El acta va al legajo del estudiante.</span>
    </div>

    <label class="cg"><span class="cg-et">Observaciones</span>
      <input class="campo cg-in" placeholder="Este campo se desplaza hacia abajo"></label>
  </form>
</div>

<h3 class="sub-seccion">Cerrado, abierto, y el archivo puesto</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Cerrado y vacío</span>
        <button class="btn btn-neutro btn-mini btn-ic" aria-expanded="false">${icono('pdf')}Subir PDF</button>
        <span class="cx-vacio">Ningún archivo</span>
      </div>
      <span class="cx-nota">Lo que ve el formulario mientras no hay nada.</span>
    </div>

    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Con el archivo puesto</span>
        <button class="btn btn-neutro btn-mini btn-ic" aria-expanded="false">${icono('pdf')}Subir PDF</button>
        <ul class="cx-adjuntos">
          <li class="cx-adj">
            ${icono('documento')}
            <span class="cx-arch"><span class="cx-nombre">acta-2026-3B</span><span class="cx-ext">.pdf</span></span>
            <button class="btn btn-terc btn-mini btn-solo-ic"
              aria-label="Quitar acta-2026-3B.pdf">${icono('papelera')}</button>
          </li>
        </ul>
      </div>
    </div>

    <div class="cx">
      <div class="cx-fila">
        <span class="cx-et">Con error</span>
        <button class="btn btn-neutro btn-mini btn-ic" aria-expanded="false">${icono('pdf')}Subir PDF</button>
        <span class="cx-vacio">Ningún archivo</span>
      </div>
      <span class="cx-error">${icono('alerta')}Ese archivo no es un PDF. Solo se admiten PDF.</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Qué comprime, y cuánto — medido, no prometido</h3>
<p class="seccion-sub">Sin ninguna dependencia: el paquete no carga con una librería de PDF y el
producto que lo instala, tampoco. Lo que hace, en el orden en que gana peso:</p>
<table class="tabla-simple">
  <thead><tr><th>Qué</th><th>Cuánto</th><th>Sobre qué archivo</th></tr></thead>
  <tbody>
    <tr><td><strong>Recomprimir las imágenes</strong></td><td>lo que de verdad mueve la aguja</td><td class="motivo">Escaneos. Solo JPEG incrustados, reducidos al ancho máximo. <strong>Necesita navegador</strong>: en Node no ocurre y se dice en <code>imagenesOmitidas</code></td></tr>
    <tr><td><strong>Desinflar lo que viajaba en crudo</strong></td><td><strong>88–91 %</strong> medido</td><td class="motivo">Generadores que no comprimen nada. La cifra sale de las pruebas, no de una estimación</td></tr>
    <tr><td><strong>Tirar lo inalcanzable</strong></td><td>según cuántas revisiones arrastre</td><td class="motivo">Un PDF editado o firmado varias veces guarda todas sus versiones anteriores</td></tr>
    <tr><td><strong>Tirar XMP y <code>/PieceInfo</code></strong></td><td>kilobytes</td><td class="motivo">Lo que deja un procesador de textos y ningún lector usa</td></tr>
    <tr><td><strong>Reempaquetar</strong></td><td>evita que crezca</td><td class="motivo">Sin esto un PDF moderno SALDRÍA MÁS GRANDE: sus objetos pequeños ya venían empaquetados</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Las tres promesas</h3>
<div class="bloque">
  <table class="tabla-simple">
    <thead><tr><th>Promesa</th><th>Cómo se sostiene</th></tr></thead>
    <tbody>
      <tr><td><strong>Nunca devuelve algo más grande</strong></td><td class="motivo">Se comparan los dos pesos al final. Si no se ganó, vuelve el original intacto y <code>motivo</code> dice <code>sin-ganancia</code></td></tr>
      <tr><td><strong>Nunca devuelve algo que no sepa releer</strong></td><td class="motivo">Lo escrito se vuelve a analizar con el mismo lector y se exige que el catálogo resuelva y que las páginas sean las mismas. Si no cuadra, vuelve el original</td></tr>
      <tr><td><strong>Nunca toca un PDF cifrado</strong></td><td class="motivo">Reescribirlo sin descifrar produce un archivo que abre y no se lee. Vuelve intacto con <code>motivo: 'cifrado'</code></td></tr>
    </tbody>
  </table>
  <p class="seccion-sub">Y lo que <strong>no</strong> hace, que también hay que decirlo: no reduce
  imágenes que no sean JPEG, no toca las fuentes incrustadas y no vuelve a comprimir un flujo que ya
  venía desinflado. <strong>Un PDF que ya pasó por un optimizador saldrá igual</strong> — y devuelto
  tal cual, que es lo correcto.</p>
</div>

<h3 class="sub-seccion">Dos decisiones que no son de aspecto</h3>
<table class="tabla-simple">
  <thead><tr><th>Regla</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>Solo PDF, comprobado en los bytes</strong></td><td class="motivo">El <code>accept</code> del navegador filtra el diálogo de archivos y nada más: arrastrando entra cualquier cosa, y renombrar un <code>.docx</code> a <code>.pdf</code> lo cuela. Se exige <code>%PDF-</code></td></tr>
    <tr><td><strong>El peso máximo se mide DESPUÉS de comprimir</strong></td><td class="motivo">Al revés se rechazan archivos que sí habrían cabido, y la persona ve «pesa demasiado» en algo que el sistema mismo podía arreglar</td></tr>
    <tr><td><strong>Dos archivos a la vez se rechazan</strong></td><td class="motivo">Coger el primero en silencio deja a alguien creyendo que subió los tres que soltó</td></tr>
  </tbody>
</table>
<p class="seccion-sub">Se compone, no se reconstruye: el disparador y «Quitar» son <code>Boton</code>,
el progreso es <code>Progreso</code>, el ahorro es un <code>Chip</code> —pintar aquí un verde a mano
habría metido un par de contraste que nadie midió— y el icono es <code>Icono</code>. Lo único propio
es la zona de soltar, que no existía. <strong>Soltar es un atajo de ratón</strong>, y por eso el
control accesible es el botón: la zona no se tabula.</p>`;

// ── Elemento: Área de texto ─────────────────────────────────────────────────

const pagAreaTexto = `
<p class="pag-intro">El campo de <strong>varias líneas</strong>: observaciones, motivo de una baja,
descripción de una incidencia. No es un <code>Campo</code> más alto — se comporta distinto en tres
cosas, y esas tres son la razón de que exista.</p>

<div class="bloque">
  <p class="seccion-sub"><strong>Escribe en el primero</strong> y verás que crece solo. Escribe en el
  segundo y pasa del límite a propósito: <strong>no te corta</strong>.</p>
  <div class="campos-rejilla">
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ta-demo-1">Observaciones</label>
      <div class="ta-crece" data-crece>
        <textarea class="campo ta" id="ta-demo-1" rows="3" data-cuadro
          placeholder="Qué pasó y qué se hizo."></textarea>
      </div>
      <span class="campo-ayuda">Crece con lo escrito hasta un tope, y a partir de ahí se desplaza.</span>
    </div>
    <div class="campo-grupo" data-limite="60">
      <label class="campo-etiqueta" for="ta-demo-2">Motivo de la baja</label>
      <div class="ta-crece" data-crece>
        <textarea class="campo ta" id="ta-demo-2" rows="3" data-cuadro
          aria-describedby="ta-demo-2-ayuda"></textarea>
      </div>
      <span class="campo-error" data-error hidden></span>
      <span class="campo-ayuda" id="ta-demo-2-ayuda">
        <span class="ta-pie">
          <span>Máximo 60 caracteres.</span>
          <span class="ta-cuenta" data-cuenta>60 restantes</span>
        </span>
      </span>
    </div>
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ta-demo-3">Nota interna</label>
      <div class="ta-fija">
        <textarea class="campo ta" id="ta-demo-3" rows="3"
          placeholder="Sin autoCrecer: alto fijo."></textarea>
      </div>
      <span class="campo-ayuda">Para una rejilla donde todos los campos miden lo mismo.</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Las tres diferencias con un campo de una línea</h3>
<table class="tabla-simple">
  <thead><tr><th>Diferencia</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>Crece con lo escrito</strong></td><td class="motivo">Un cuadro de cuatro líneas para un texto de doce obliga a redactar mirando por una rendija. Se hace <strong>con CSS</strong>: la rejilla lleva una copia invisible del texto en <code>::after</code>. Escribir la altura desde JavaScript exigiría el atributo <code>style</code>, que el candado prohíbe (§2.5.6)</td></tr>
    <tr><td><strong>El límite es blando</strong></td><td class="motivo"><code>maxlength</code> corta al pegar, en silencio y sin deshacer: se pega un párrafo, entra media frase, y nadie se entera hasta que lo lee el destinatario. Aquí entra entero, se marca inválido y se dice cuánto sobra. <strong>Bloquear el envío es del producto</strong>, que sabe si ese texto se puede guardar a medias</td></tr>
    <tr><td><strong>El contador se anuncia solo cuando importa</strong></td><td class="motivo">En el <code>aria-describedby</code> está siempre —se lee al entrar al campo—, pero la región viva solo habla en los últimos 20 caracteres y al pasarse. Un contador que dicta un número por cada tecla no informa: tapa lo que se escribe</td></tr>
  </tbody>
</table>
<p class="seccion-sub">Lo demás <strong>es</strong> el <code>Campo</code>, no se le parece: el rótulo
obligatorio y siempre visible, la ayuda, el error y los <code>aria-describedby</code> que los enlazan
salen de su ranura de contenido propio. Y el <strong>recorte al salir</strong> es el mismo y por la
misma razón —el copy-paste con cola—, solo en los extremos: los saltos de línea de dentro son el
texto, no basura.</p>

<h3 class="sub-seccion">Estados</h3>
<div class="bloque">
  <div class="campos-rejilla">
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ta-e1">Reposo</label>
      <div class="ta-fija"><textarea class="campo ta" id="ta-e1" rows="2" readonly></textarea></div>
    </div>
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ta-e2">Con foco</label>
      <div class="ta-fija"><textarea class="campo ta foco-demo" id="ta-e2" rows="2" readonly></textarea></div>
    </div>
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ta-e3">Con error</label>
      <div class="ta-fija"><textarea class="campo ta campo-mal" id="ta-e3" rows="2" readonly>Se pasa de largo</textarea></div>
      <span class="campo-error">El texto se pasa por 8 caracteres. Acórtalo antes de guardar.</span>
    </div>
    <div class="campo-grupo">
      <label class="campo-etiqueta" for="ta-e4">Sin permiso</label>
      <div class="ta-fija"><textarea class="campo ta" id="ta-e4" rows="2" disabled>Solo Dirección edita este campo.</textarea></div>
    </div>
  </div>
</div>`;

// ── Elemento: Carga de documento de identidad ───────────────────────────────

const pagCargaId = `
<p class="pag-intro">Las <strong>dos caras</strong> del documento de identidad, encuadradas con
<strong>su proporción real</strong> y entregadas en <strong>WebP</strong>. Mismo guion que la carga
de PDF —botón, diálogo, borrador que solo se confirma al final— y <strong>el mismo editor de
encuadre</strong> que la carga de imagen, porque es literalmente el mismo.</p>

<div class="aviso"><strong>La proporción no es un número bonito.</strong> El documento de identidad
es una tarjeta <strong>ID-1</strong> (ISO/IEC 7810): <strong>85,60 × 53,98 mm</strong>, o sea
1,5858:1. El marco del editor mide <strong>428×270 px</strong> — 1,5852:1, cuatro milésimas por
debajo del nominal. Encuadrar un carné en un cuadrado sería encuadrar a ciegas.</div>

<div class="bloque">
  <p class="seccion-sub"><strong>Pruébalo.</strong> Pulsa «Subir ID»: se abre el diálogo y pide
  <em>primero el anverso</em>. Elige una imagen, encuádrala —arrastrar para mover, botones para
  acercar, flechas con el teclado— y graba. El mismo diálogo pasa entonces al <em>reverso</em>; al
  grabarlo se cierra, las dos miniaturas quedan al costado del botón y <strong>el botón se
  desactiva</strong>. Pulsa una miniatura para verla en grande.</p>

  <div class="cx" id="cid-demo">
    <div class="cx-fila">
      <span class="cx-et">Documento de identidad</span>
      <button class="btn btn-neutro btn-mini btn-ic" id="cid-demo-btn">${icono('documento')}Subir ID</button>
      <ul class="cx-adjuntos" id="cid-demo-minis"></ul>
    </div>
    <span class="cx-nota">JPG o PNG, máximo 4 MB por cara. Se guarda en WebP.</span>
    <input type="file" accept="image/*" class="ci-entrada" id="cid-demo-entrada" tabindex="-1" aria-hidden="true">
  </div>

  <!-- El MISMO marcado que emite Dialogo: caja, cabecera, cuerpo y pie con
       Cancelar a la izquierda y la acción a la derecha. -->
  <dialog class="dialogo" id="cid-demo-dlg" aria-labelledby="cid-demo-tit">
    <div class="dialogo-caja">
      <div class="dialogo-cab"><h2 class="dialogo-tit" id="cid-demo-tit" tabindex="-1">Documento de identidad — Anverso</h2></div>
      <div class="dialogo-cuerpo">
        <p class="cid-paso" id="cid-demo-paso">Primero el anverso: la cara con la foto y los datos.</p>
        <button class="btn btn-1 btn-ic" id="cid-demo-elegir">${icono('subir')}Elegir la imagen del anverso</button>
        <div class="ci-editor" id="cid-demo-editor" hidden>
          <div class="ci-marco-editor">
            <canvas class="ci-lienzo" id="cid-demo-lienzo" width="428" height="270" tabindex="0"
              role="img" aria-label="Encuadre. Flechas para mover la imagen; los botones acercan y alejan."></canvas>
          </div>
          <div class="ci-zoom">
            <button class="btn btn-neutro btn-mini" id="cid-demo-menos" aria-label="Alejar">−</button>
            <button class="btn btn-neutro btn-mini" id="cid-demo-mas" aria-label="Acercar">+</button>
          </div>
        </div>
      </div>
      <div class="dialogo-pie">
        <button class="btn btn-neutro" id="cid-demo-cancelar">Cancelar</button>
        <button class="btn btn-1" id="cid-demo-grabar" hidden>Grabar</button>
      </div>
    </div>
  </dialog>

  <dialog class="dialogo" id="cid-demo-visor" aria-labelledby="cid-demo-visor-tit">
    <div class="dialogo-caja">
      <div class="dialogo-cab"><h2 class="dialogo-tit" id="cid-demo-visor-tit" tabindex="-1">Documento de identidad</h2></div>
      <div class="dialogo-cuerpo"><img class="cid-visor-img" id="cid-demo-visor-img" src="" alt="Cara del documento de identidad"></div>
      <div class="dialogo-pie"><button class="btn btn-neutro" id="cid-demo-visor-cerrar">Cerrar</button></div>
    </div>
  </dialog>

  <p class="seccion-sub"><strong>Volver a subir se autoriza desde atrás, no desde la pantalla.</strong>
  Un documento de identidad ya entregado no se reemplaza porque a alguien se le ocurra: el botón se
  queda desactivado y solo vuelve cuando el producto baja la prop <code>bloqueado</code> porque su
  back se lo indicó. Aquí, para poder seguir probando, este botón hace de ese aviso:</p>

  <button class="btn btn-terc btn-mini" id="cid-demo-liberar">Simular el permiso del back</button>
</div>

<h3 class="sub-seccion">Lo que entrega</h3>
<p class="seccion-sub">Una sola llamada, con las <strong>dos caras juntas</strong>. Hasta que el
reverso está grabado, el anverso es un <strong>borrador</strong>: cancelar a mitad deja el
expediente como estaba. Un anverso suelto es un documento a medias que nadie pidió.</p>

<div class="cod">
  <div class="cod-cab"><span class="cod-tit">Uso</span></div>
  <pre class="cod-pre"><code>&lt;CargaId
  etiqueta="Documento de identidad"
  anverso={ficha.dniAnverso}
  reverso={ficha.dniReverso}
  bloqueado={!permiso.puedeReemplazarDni}
  onCambio={({ anverso, reverso }) =&gt; subir(anverso.archivo, reverso.archivo)}
/&gt;</code></pre>
</div>`;

// ── Elemento: Selector ──────────────────────────────────────────────────────

const ICO_LUPA = icono('lupa');
const ICO_CHECK = icono('visto');

// Nombres con tilde a propósito: la demostración de búsqueda sin tildes solo
// significa algo si hay tildes que ignorar.
const APODERADOS = [
  'Álvarez Ponce, Rosa', 'Bustamante Ríos, Julio', 'Castañeda Ludeña, Miriam',
  'Fernández Cruz, María', 'García Núñez, Óscar', 'Gutiérrez Paredes, Elena',
  'Huamán Soto, Pedro', 'Jiménez Vílchez, Andrés', 'López Ñahui, Teresa',
  'Mendoza Quiñones, Raúl', 'Pérez Salazar, Ana', 'Quispe Mamani, Lucía',
  'Ramírez Ochoa, Víctor', 'Rojas Vega, Luis', 'Sánchez Idrogo, Patricia',
  'Torres Bejarano, Iván', 'Valdivia Ccahuana, Sofía', 'Zúñiga Peralta, Martín',
];

const pagSelector = `
<p class="pag-intro">Dos componentes distintos con el mismo aspecto. La diferencia no es
estética: <strong>por encima de cierto número de opciones, buscar es más rápido que
mirar</strong>, y por debajo la caja de búsqueda estorba.</p>

<h3 class="sub-seccion">Cuál de los dos</h3>
<table class="tabla-simple">
  <thead><tr><th>Opciones</th><th>Componente</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>2</strong></td><td>Interruptor o dos radios</td><td class="motivo">Un desplegable para dos opciones esconde la mitad de la información</td></tr>
    <tr><td><strong>3 a 8</strong></td><td><code>Selector</code> simple</td><td class="motivo">Se abarcan de un vistazo. Una caja de búsqueda sería un paso de más</td></tr>
    <tr><td><strong>9 o más</strong></td><td><code>Selector</code> con búsqueda</td><td class="motivo">A partir de ahí la lista deja de leerse y se recorre</td></tr>
    <tr><td><strong>Cientos o miles</strong></td><td>Con búsqueda <strong>contra el servidor</strong></td><td class="motivo">No se traen mil filas al navegador para filtrar tres</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Selector simple — 3 a 8 opciones</h3>
<div class="bloque">
  <div class="campos-rejilla">
    <label class="cg"><span class="cg-et">Nivel</span>
      <select class="campo cg-in"><option>Inicial</option><option>Primaria</option><option>Secundaria</option></select></label>
    <label class="cg"><span class="cg-et">Estado</span>
      <select class="campo cg-in"><option>Todos</option><option>Activo</option><option>Parcial</option><option>Deuda</option></select></label>
    <label class="cg"><span class="cg-et">Sin permiso</span>
      <select class="campo cg-in" disabled><option>Huaraz</option></select>
      <span class="cg-ayuda">Solo Dirección puede cambiar la sede.</span></label>
  </div>
</div>

<h3 class="sub-seccion">Solo lectura — no es lo mismo que deshabilitado</h3>
<p class="seccion-sub">Lo pidió el responsable para el <strong>selector de documento mientras se consulta
a la API</strong>: cambiar el tipo a mitad de la consulta tira el resultado que se estaba esperando.
<strong>Deshabilitado no vale aquí</strong> — dice «esto no es para ti», se sale del recorrido del
tabulador y <strong>el navegador no lo envía con el formulario</strong>, que es justo el dato que hay
que conservar. Solo lectura dice «esto es un dato, ahora no se toca»: se enfoca, se lee y viaja.</p>

<div class="aviso"><strong>HTML no tiene <code>readonly</code> para <code>&lt;select&gt;</code></strong>
—solo para <code>input</code> y <code>textarea</code>—, así que el componente lo construye:
<code>aria-readonly</code> para que el lector lo anuncie, y el bloqueo de lo que abre o cambia la
lista. Con teclado siguen pasando Tab y Escape: salir nunca se bloquea.</div>

<div class="bloque">
  <div class="campos-rejilla">
    <label class="cg"><span class="cg-et">Tipo de documento</span>
      <select class="campo cg-in" aria-readonly="true" data-solo-lectura>
        <option>DNI</option><option>Carné de extranjería</option><option>Pasaporte</option></select>
      <span class="cg-ayuda">Consultando el documento…</span></label>
    <label class="cg"><span class="cg-et">Número</span>
      <input class="campo cg-in" value="71234567" readonly>
      <span class="cg-ayuda">Vuelve a editarse cuando la consulta termina.</span></label>
    <label class="cg"><span class="cg-et">Editable, para comparar</span>
      <select class="campo cg-in"><option>DNI</option><option>Pasaporte</option></select></label>
  </div>
</div>

<h3 class="sub-seccion">Selector con búsqueda — funciona, pruébalo</h3>
<p class="seccion-sub">${APODERADOS.length} apoderados. Escribe y filtra por coincidencias. Flechas para moverte, Enter para elegir, Esc para cerrar.</p>
<div class="bloque">
  <div class="sel-demo-fila">
    <div class="cg" style="max-width:340px">
      <span class="cg-et" id="sel-et">Apoderado</span>
      <div class="sel" data-sel>
        <div class="sel-caja sel-con-lupa">
          <span class="sel-lupa">${ICO_LUPA}</span>
          <input class="campo sel-in" role="combobox" aria-expanded="false"
                 aria-autocomplete="list" aria-controls="sel-lista" aria-labelledby="sel-et"
                 placeholder="Escribe para buscar" autocomplete="off">
          <span class="sel-chev">${ICONOS.chevron}</span>
        </div>
        <ul class="sel-lista" id="sel-lista" role="listbox" aria-labelledby="sel-et" hidden></ul>
      </div>
      <span class="cg-ayuda" data-sel-conteo>${APODERADOS.length} apoderados</span>
    </div>
    <div class="sel-notas">
      <p><strong>La búsqueda ignora tildes y mayúsculas.</strong> <code>perez</code> encuentra «Pérez Salazar, Ana».</p>
      <p>Eso no es un detalle de la caja de búsqueda: en producción lo hacen las
      extensiones <code>unaccent</code> y <code>pg_trgm</code> de PostgreSQL.
      <strong>Es una promesa de interfaz.</strong> Si otro buscador se monta sin
      esas extensiones, el componente se comporta distinto y nadie sabrá por qué.</p>
      <p>Lo mismo con <code>ñ</code> y <code>quinones</code>.</p>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Estados</h3>
<div class="bloque">
  <div class="campos-rejilla">
    <label class="cg"><span class="cg-et">Reposo</span>
      <div class="sel-caja sel-con-lupa"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in" placeholder="Escribe para buscar" readonly></div></label>
    <label class="cg"><span class="cg-et">Con foco</span>
      <div class="sel-caja sel-con-lupa"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in foco-demo" placeholder="Escribe para buscar" readonly></div></label>
    <label class="cg"><span class="cg-et">Con selección</span>
      <div class="sel-caja sel-con-lupa"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in" value="Pérez Salazar, Ana" readonly></div></label>
    <label class="cg"><span class="cg-et">Con error</span>
      <div class="sel-caja sel-con-lupa"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in cg-mal" placeholder="Escribe para buscar" readonly></div>
      <span class="cg-error">${ICO_ERROR}Elige un apoderado.</span></label>
  </div>
</div>

<h3 class="sub-seccion">Sin resultados: el estado que más comunica</h3>
<div class="bloque">
  <div class="enl-comp">
    <div class="enl-caja bien">
      <p><strong>Sin resultados para <em>zapata</em>.</strong><br>Prueba con menos letras, o revisa si está matriculado.</p>
      <span class="bien-et">Dice qué se buscó y ofrece salida</span>
    </div>
    <div class="enl-caja mal">
      <p><strong>No hay datos</strong></p>
      <span class="mal-et">Callejón. Ni dice qué se buscó ni qué hacer</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Teclado — es donde se cae este componente</h3>
<table class="tabla-simple">
  <thead><tr><th>Tecla</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td class="mono">↓ ↑</td><td>Mueve por las opciones. Abre la lista si está cerrada</td></tr>
    <tr><td class="mono">Enter</td><td>Elige la opción marcada y cierra</td></tr>
    <tr><td class="mono">Esc</td><td>Cierra sin elegir. <strong>Devuelve el valor anterior</strong>, no lo vacía</td></tr>
    <tr><td class="mono">Tab</td><td>Sale del campo. Si había una marcada, la elige</td></tr>
    <tr><td class="mono">Inicio · Fin</td><td>Primera y última opción</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Por qué aquí sí se usa una librería</h3>
<div class="aviso">
  MMI-DS §9 prohíbe adoptar una librería de componentes <strong>en general</strong>, y
  autoriza primitivas accesibles para <strong>exactamente tres casos</strong>: diálogo, menú
  y <strong>selector con búsqueda</strong>.
  <br><br>
  La razón está medida en la práctica del sector: el patrón <code>combobox</code> de ARIA
  exige <code>aria-activedescendant</code>, anuncio del número de resultados, foco que se
  queda en el input mientras la selección se mueve por la lista, y un contrato de teclado
  completo. <strong>Escrito a mano produce fallos de accesibilidad de forma sistemática.</strong>
  Radix o Ark resuelven el comportamiento y <strong>el estilo queda íntegro</strong>: los
  tokens siguen siendo los nuestros.
</div>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Menos de 3 opciones: no es un selector. Son radios o un interruptor.</td></tr>
    <tr><td class="num">2</td><td>9 o más: <strong>con búsqueda</strong>. Por debajo, la caja estorba.</td></tr>
    <tr><td class="num">3</td><td>La búsqueda <strong>ignora tildes y mayúsculas</strong>. <code>perez</code> encuentra <code>Pérez</code>.</td></tr>
    <tr><td class="num">4</td><td>Sin resultados: di <strong>qué se buscó</strong> y ofrece una salida.</td></tr>
    <tr><td class="num">5</td><td>Esc devuelve el valor anterior. <strong>Nunca vacía la selección.</strong></td></tr>
    <tr><td class="num">6</td><td>La etiqueta va fuera y siempre visible, como en cualquier campo.</td></tr>
    <tr><td class="num">7</td><td>Nunca metas una acción en la lista de opciones. Una lista se elige, no se pulsa.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Selector } from '@ae/sistema';

// 3 a 8 opciones
<Selector etiqueta="Nivel" opciones={niveles} />

// 9 o más: la búsqueda se activa sola
<Selector etiqueta="Apoderado" opciones={apoderados} />

// Cientos: filtra contra el servidor
<Selector
  etiqueta="Apoderado"
  buscar={(texto) => api.apoderados.buscar(texto)}
  sinResultados={(t) => \`Sin resultados para \${t}. Prueba con menos letras.\`}
/>`
)}
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Por defecto</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td><code>etiqueta</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo"><strong>Obligatoria</strong></td></tr>
    <tr><td><code>opciones</code></td><td class="mono">Opcion[]</td><td class="mono">—</td><td class="motivo">Lista local. Con 9 o más activa la búsqueda sola</td></tr>
    <tr><td><code>buscar</code></td><td class="mono">(texto) =&gt; Promise</td><td class="mono">—</td><td class="motivo">Filtra contra el servidor. Excluye <code>opciones</code></td></tr>
    <tr><td><code>sinResultados</code></td><td class="mono">(texto) =&gt; string</td><td class="mono">genérico</td><td class="motivo">Recibe lo buscado para poder nombrarlo</td></tr>
    <tr><td><code>error</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo">Activa el estado de error</td></tr>
  </tbody>
</table>`;

// ── Elemento: Chip de estado ────────────────────────────────────────────────

const ESTADOS_CHIP = [
  ['exito', 'Activo', 'La matrícula está al día'],
  ['aviso', 'Parcial', 'Falta completar algo, pero se puede seguir'],
  ['error', 'Deuda', 'Hay algo que impide continuar'],
  ['info', 'En trámite', 'Estado neutro, sin bueno ni malo'],
];

const chip = (clase, texto) => `<span class="chip chip-${clase}">${texto}</span>`;

const pagChip = `
<p class="pag-intro">Una etiqueta que dice <strong>en qué estado está una fila</strong>. No se
pulsa, no se cierra y no navega: solo informa. Si hace alguna de esas tres cosas, no es un
chip de estado.</p>

<h3 class="sub-seccion">Los cuatro estados, siempre en pares</h3>
<p class="seccion-sub">Fondo y texto salen juntos o no salen. <strong>Nunca un color de estado suelto.</strong></p>
<div class="bloque">
  <table class="tabla-simple">
    <thead><tr><th>Chip</th><th>Tokens</th><th class="num">Texto sobre fondo</th><th>Cuándo</th></tr></thead>
    <tbody>
      ${ESTADOS_CHIP.map(([c, t, uso]) => {
        const par = lock.contrastes.find(
          (x) => x.modo === 'claro' && x.frente === c + '-texto' && x.fondo === c + '-fondo'
        );
        return `<tr><td>${chip(c, t)}</td>
          <td class="mono">${c}-fondo · ${c}-texto · ${c}-acento</td>
          <td class="num">${par ? par.ratio.toFixed(2) + ':1' : '—'}</td>
          <td class="motivo">${uso}</td></tr>`;
      }).join('')}
    </tbody>
  </table>
</div>

<h3 class="sub-seccion">Y cuatro que no significan nada</h3>
<p class="seccion-sub">Los seis de arriba <strong>dicen algo</strong>. Estos cuatro son los del avatar y
<strong>no dicen nada</strong>: sirven para <strong>agrupar</strong> —una sede, un turno, un responsable— y
nunca para informar.</p>
<div class="bloque">
  <p class="pag-intro" style="margin-top:0">Como leyenda de una rejilla, que es para lo que nacieron:</p>
  <div class="chip-sup-fila" style="align-items:center;gap:12px">
    <span><span class="chip chip-punto chip-identidad-1"></span> Sede Centro</span>
    <span><span class="chip chip-punto chip-identidad-2"></span> Sede Norte</span>
    <span><span class="chip chip-punto chip-identidad-3"></span> Sede Sur</span>
    <span><span class="chip chip-punto chip-identidad-4"></span> Sede Este</span>
  </div>
  <p class="pag-intro">Y como ficha con texto, cuando hace falta nombrar el grupo:</p>
  <div class="chip-sup-fila">
    <span class="chip chip-identidad-1">Sede Centro</span>
    <span class="chip chip-identidad-2">Sede Norte</span>
    <span class="chip chip-identidad-3">Sede Sur</span>
    <span class="chip chip-identidad-4">Sede Este</span>
  </div>
</div>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Agrupar sí, informar no.</strong> Lo agrupado va <strong>también en texto</strong> y con leyenda al lado. Cuatro colores sin leyenda son cuatro adornos, y quien no distinga dos de ellos se queda sin el dato (SC 1.4.1).</td></tr>
    <tr><td class="num">2</td><td><strong>Cuatro, y no más.</strong> Es lo que la paleta de estado deja libre: cada uno queda a 30° o más del tono de estado más cercano. Una paleta larga de colores decorativos acaba con dos que nadie distingue.</td></tr>
    <tr><td class="num">3</td><td><strong>No se ordena ni se criba por ellos.</strong> No son un valor: son ayuda de reconocimiento.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">El filete no es adorno: es lo que dibuja el chip</h3>
<div class="aviso">
  Sobre las cuatro superficies donde vive un chip, el relleno da entre
  <strong>1,00 y 1,19:1</strong> contra el fondo. Sobre el encabezado de tabla mide exactamente
  <strong>1,00:1</strong> — luminancia idéntica. El filete de acento da entre
  <strong>4,18 y 4,84:1</strong> en todos los casos.
  <br><br>
  Sin filete, el chip no es un chip: es texto de color flotando en la fila. Por eso
  <strong>el filete no se quita nunca</strong>, ni siquiera «para que se vea más limpio».
</div>
<div class="bloque">
  <div class="chip-sup">
    ${['fondo-tarjeta', 'fondo-pagina', 'fondo-fila-hover', 'fondo-encabezado']
      .map(
        (s) => `<div class="chip-sup-caja token-${s}">
          <span class="chip-sup-et"><code>${s}</code></span>
          <div class="chip-sup-fila">
            ${ESTADOS_CHIP.map(([c, t]) => chip(c, t)).join('')}
          </div>
          <div class="chip-sup-fila">
            ${ESTADOS_CHIP.map(([c, t]) => `<span class="chip chip-${c} chip-sin-filete">${t}</span>`).join('')}
          </div>
          <span class="chip-sup-nota">arriba con filete · abajo sin él</span>
        </div>`
      )
      .join('')}
  </div>
</div>

<h3 class="sub-seccion">El color nunca es el único portador</h3>
<div class="bloque">
  <div class="enl-comp">
    <div class="enl-caja bien">
      <div class="chip-fila-demo">${chip('exito', 'Activo')} ${chip('error', 'Deuda')}</div>
      <span class="bien-et">El texto dice el estado. Quien no distingue el rojo del verde lo lee igual</span>
    </div>
    <div class="enl-caja mal">
      <div class="chip-fila-demo"><span class="chip chip-exito chip-punto"></span> <span class="chip chip-error chip-punto"></span></div>
      <span class="mal-et">Solo color. Un 8 % de los hombres no distingue estos dos</span>
    </div>
  </div>
</div>
<p class="pag-intro" style="margin-top:12px">Un punto de color <strong>puede acompañar</strong> al
texto, nunca sustituirlo. Si la columna es estrecha, se acorta el texto —«Deuda» en vez de
«Con deuda pendiente»—, no se elimina.</p>

<h3 class="sub-seccion">Chip de estado y chip de filtro no son el mismo componente</h3>
<table class="tabla-simple">
  <thead><tr><th></th><th>Chip de estado</th><th>Chip de filtro</th></tr></thead>
  <tbody>
    <tr><td><strong>Qué hace</strong></td><td>Informa</td><td class="motivo">Representa un filtro aplicado</td></tr>
    <tr><td><strong>Se pulsa</strong></td><td>No</td><td class="motivo">Sí, para quitarlo</td></tr>
    <tr><td><strong>Lleva ✕</strong></td><td>Nunca</td><td class="motivo">Siempre</td></tr>
    <tr><td><strong>Etiqueta HTML</strong></td><td><code>&lt;span&gt;</code></td><td class="motivo"><code>&lt;button&gt;</code></td></tr>
    <tr><td><strong>Estado</strong></td><td>Listo</td><td class="motivo">Sin construir. Entra con la tabla de datos, fase 5</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">Meter la ✕ en el chip de estado es el error más común:
convierte una etiqueta informativa en algo que parece pulsable y no lo es.</p>

<h3 class="sub-seccion">Tamaño y forma</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf">${chip('exito', 'Activo')}<span class="mf-et"><b>Normal</b><br>12px Medium · radio 3px</span></div>
    <div class="mf"><span class="chip chip-exito chip-con-punto"><i></i>Activo</span><span class="mf-et"><b>Con punto</b><br>El punto acompaña, no sustituye</span></div>
    <div class="mf">${chip('aviso', 'Parcial')}${chip('error', 'Deuda')}<span class="mf-et"><b>Varios</b><br>8px de separación</span></div>
  </div>
</div>
<p class="pag-intro" style="margin-top:12px"><strong>Radio 3px, no cápsula.</strong> El redondeo
completo se lee como algo pulsable, y este componente no se pulsa.</p>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Fondo y texto <strong>siempre en pareja</strong>. Nunca un color de estado suelto.</td></tr>
    <tr><td class="num">2</td><td><strong>El filete no se quita.</strong> Es lo único que hace visible el chip: el relleno da 1,00:1 sobre el encabezado.</td></tr>
    <tr><td class="num">3</td><td>El texto lleva el significado. <strong>El color solo, nunca.</strong></td></tr>
    <tr><td class="num">4</td><td>No se pulsa, no se cierra, no navega. <strong>Sin ✕.</strong></td></tr>
    <tr><td class="num">5</td><td>Radio 3px. La cápsula parece un botón.</td></tr>
    <tr><td class="num">6</td><td>Una palabra, dos como mucho. Si necesita explicación, va en la celda de al lado.</td></tr>
    <tr><td class="num">7</td><td>Cuatro estados y ninguno más. Un quinto color obliga a aprenderse una leyenda.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Chip } from '@ae/sistema';

<Chip estado="exito">Activo</Chip>
<Chip estado="aviso">Parcial</Chip>
<Chip estado="error">Deuda</Chip>
<Chip estado="info">En trámite</Chip>

<Chip estado="exito" punto>Activo</Chip>`
)}
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Por defecto</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td><code>estado</code></td><td class="mono">exito · aviso · error · info</td><td class="mono">—</td><td class="motivo"><strong>Obligatorio.</strong> Trae el par fondo/texto y su filete</td></tr>
    <tr><td><code>children</code></td><td class="mono">string</td><td class="mono">—</td><td class="motivo"><strong>Obligatorio.</strong> Sin texto no renderiza: el color solo no informa</td></tr>
    <tr><td><code>punto</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Añade un punto antes del texto. Nunca lo sustituye</td></tr>
  </tbody>
</table>`;

// ── Elemento: Tarjeta ───────────────────────────────────────────────────────

// Silueta neutra. No se inventan fotos de personas: cuando no hay foto se
// muestran las iniciales, que es lo que hará el sistema real.
const SILUETA = `<svg viewBox="0 0 40 40" class="avatar-silueta" aria-hidden="true">
  <circle cx="20" cy="15" r="7" fill="currentColor" opacity=".5"/>
  <path d="M6 38c0-8 6-13 14-13s14 5 14 13" fill="currentColor" opacity=".5"/>
</svg>`;

const iniciales = (n) => {
  const [ap, no] = n.split(',').map((s) => s.trim());
  return (ap[0] + (no ? no[0] : ap.split(' ')[1][0])).toUpperCase();
};

const PERSONAL = [
  ['Álvarez Ponce, Rosa', 'Docente · Primaria', 'exito', 'Asistió', '07:42', true],
  ['Quispe Mamani, Lucía', 'Docente · Inicial', 'exito', 'Asistió', '07:38', false],
  ['Rojas Vega, Luis', 'Auxiliar', 'aviso', 'Tardanza', '08:21', false],
  ['Fernández Cruz, María', 'Docente · Secundaria', 'pend', 'Aún no marca', '—', true],
  ['Huamán Soto, Pedro', 'Mantenimiento', 'error', 'Falta', '—', false],
  ['Mendoza Quiñones, Raúl', 'Docente · Secundaria', 'info', 'Permiso', '—', false],
];

const tarjetaPersona = ([nombre, cargo, est, etiqueta, hora, conFoto]) => `
  <article class="tp tp-${est}">
    <div class="avatar avatar-l">${conFoto ? SILUETA : `<span class="av-ini">${iniciales(nombre)}</span>`}</div>
    <div class="tp-txt">
      <h4 class="tp-nom">${nombre}</h4>
      <p class="tp-cargo">${cargo}</p>
      <div class="tp-pie">
        <span class="chip chip-${est === 'pend' ? 'pend' : est}">${etiqueta}</span>
        <span class="tp-hora mono">${hora}</span>
      </div>
    </div>
  </article>`;

const pagTarjeta = `
<p class="pag-intro">Dos componentes con el mismo nombre y trabajos distintos. La
<strong>tarjeta de persona</strong> se lee en bloque, de un vistazo y a decenas. La
<strong>tarjeta normal</strong> agrupa contenido en una pantalla.</p>

<h3 class="sub-seccion">Tarjeta de persona — control de asistencia</h3>
<p class="seccion-sub">Foto o iniciales, apellidos y nombre, cargo, estado y hora de marca. Para mirar treinta a la vez y saber quién falta <strong>sin leer una por una</strong>.</p>
<div class="bloque">
  <div class="tp-rejilla">${PERSONAL.map(tarjetaPersona).join('')}</div>
</div>

<div class="aviso">
  <strong>Por qué el estado va también en el borde izquierdo.</strong> Con treinta tarjetas
  en pantalla, el chip es demasiado pequeño para barrerlo con la vista. El filete recorre
  toda la altura y se ve de reojo. Es el mismo criterio del chip: el color estructural va en
  el borde, no en el relleno.
</div>

<h3 class="sub-seccion">Activo e inactivo</h3>
<div class="bloque">
  <div class="tp-rejilla tp-rejilla-2">
    ${tarjetaPersona(['Álvarez Ponce, Rosa', 'Docente · Primaria', 'exito', 'Activo', '07:42', true])}
    ${tarjetaPersona(['Torres Bejarano, Iván', 'Docente · Primaria', 'inact', 'Inactivo', '—', false])}
  </div>
</div>
<table class="tabla-simple" style="margin-top:12px">
  <thead><tr><th>Estado</th><th>Tokens</th><th>Se distingue por</th></tr></thead>
  <tbody>
    <tr><td>Activo · Asistió</td><td class="mono">exito-*</td><td class="motivo">Filete verde, chip «Activo», superficie normal</td></tr>
    <tr><td>Tardanza</td><td class="mono">aviso-*</td><td class="motivo">Filete ámbar y la hora de marca visible</td></tr>
    <tr><td>Aún no marca</td><td class="mono">borde-fuerte</td><td class="motivo">Filete neutro. <strong>No es falta todavía</strong></td></tr>
    <tr><td>Falta</td><td class="mono">error-*</td><td class="motivo">Filete rojo. Solo cuando se cierra el día</td></tr>
    <tr><td>Permiso</td><td class="mono">info-*</td><td class="motivo">Filete azul. Ausencia justificada</td></tr>
    <tr><td>Inactivo — ya no trabaja aquí</td><td class="mono">fondo-encabezado</td><td class="motivo"><strong>Cambia la superficie</strong>, no la opacidad del texto</td></tr>
  </tbody>
</table>

<div class="aviso">
  <strong>«Aún no marca» y «Falta» no son el mismo estado</strong>, igual que «nunca
  consultado» y «sin resultados» no lo son en una tabla. A las 08:00 nadie ha faltado
  todavía. Pintar de rojo a quien aún puede llegar produce llamadas que no hacían falta.
</div>

<h3 class="sub-seccion">Nunca se atenúa con opacidad</h3>
<div class="aviso">
  <strong>Medido:</strong> <code>texto-principal</code> a opacidad <strong>0,6</strong> cae a
  <strong>4,00:1</strong> y ya incumple AA. A <strong>0,5</strong> queda en
  <strong>2,99:1</strong>. Y <code>texto-secundario</code> a 0,7 se queda en 2,98:1.
  <br><br>
  Atenuar la tarjeta inactiva es el reflejo habitual y <strong>rompe el contraste de media
  pantalla</strong>. Lo inactivo se marca cambiando la superficie y el chip; el texto se queda
  a contraste completo.
</div>
<div class="bloque">
  <div class="enl-comp">
    <div class="enl-caja bien">
      <div class="tp-rejilla-1">${tarjetaPersona(['Torres Bejarano, Iván', 'Docente · Primaria', 'inact', 'Inactivo', '—', false])}</div>
      <span class="bien-et">Superficie distinta, texto a 12,48:1</span>
    </div>
    <div class="enl-caja mal">
      <div class="tp-rejilla-1 tp-opaca">${tarjetaPersona(['Torres Bejarano, Iván', 'Docente · Primaria', 'inact', 'Inactivo', '—', false])}</div>
      <span class="mal-et">Opacidad 0,5 — el texto cae a 2,99:1</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">La foto</h3>
<div class="bloque">
  <div class="muestra-fila">
    <div class="mf"><div class="avatar avatar-xl avatar-vacio">${SILUETA}</div><span class="mf-et"><b>Sin foto cargada</b><br>Silueta neutra<br>Marcador, no una persona inventada</span></div>
    <div class="mf"><div class="avatar avatar-xl avatar-vacio"><span class="av-ini">QM</span></div><span class="mf-et"><b>Iniciales</b><br>Del primer apellido y el nombre<br>Preferible a la silueta</span></div>
    <div class="mf"><div class="avatar avatar-xl avatar-marco"><span class="av-ini">RA</span></div><span class="mf-et"><b>En el marco</b><br><code>marco-acento</code></span></div>
  </div>
</div>
<p class="pag-intro" style="margin-top:12px">Las iniciales <strong>ganan a la silueta</strong>:
identifican, la silueta no. La foto es un lujo; las iniciales son el suelo. Y el avatar
<strong>nunca es el único identificador</strong>: el nombre va siempre al lado.</p>

<h3 class="sub-seccion">Tarjeta normal</h3>
<div class="bloque">
  <div class="tn-cuadricula">
    <article class="tn">
      <div class="tn-cuerpo"><h4>Simple</h4><p>Solo contenido. Fondo <code>fondo-tarjeta</code>, borde <code>borde</code>, radio 6px.</p></div>
    </article>
    <article class="tn">
      <div class="tn-cab"><h4>Con cabecera</h4><span class="chip chip-info">12</span></div>
      <div class="tn-cuerpo"><p>La cabecera separa el título del contenido con un divisor.</p></div>
    </article>
    <article class="tn">
      <div class="tn-cab"><h4>Con acciones</h4></div>
      <div class="tn-cuerpo"><p>Las acciones van al pie, alineadas a la derecha.</p></div>
      <div class="tn-pie"><button class="btn btn-terc">Cancelar</button><button class="btn btn-1">Guardar</button></div>
    </article>
    <button type="button" class="tn tn-pulsable">
      <div class="tn-cuerpo"><h4>Pulsable →</h4><p>Si toda la tarjeta hace algo, es un <code>&lt;button&gt;</code>; si navega, un <code>&lt;a&gt;</code>. <strong>Nunca un div con onClick.</strong></p></div>
    </button>
    <article class="tn">
      <div class="tn-medio"><img src="${MEDIO_MUESTRA}" alt=""></div>
      <div class="tn-cuerpo"><h4>Con medio</h4><p>La imagen va <strong>arriba</strong>, antes del título, a <code>16:9</code>. La proporción la fija el sistema.</p></div>
    </article>
    <button type="button" class="tn tn-pulsable">
      <div class="tn-medio"><img src="${MEDIO_MUESTRA}" alt=""></div>
      <div class="tn-cuerpo"><h4>Medio pulsable →</h4><p>Al pasar el cursor, la imagen se acerca <strong>dentro de su marco</strong>: la tarjeta no empuja a las de al lado.</p></div>
    </button>
    <article class="tn">
      <div class="tn-medio"><span class="tn-medio-vacio">Sin imagen</span></div>
      <div class="tn-cuerpo"><h4>Sin imagen</h4><p>El hueco <strong>se reserva igual</strong>. Si no, en una cuadrícula las tarjetas sin foto salen más bajas y el borde inferior queda dentado.</p></div>
    </article>
  </div>

  <h3 class="sub-seccion">Tarjeta de acción</h3>
  <p class="parrafo">Foto, título, texto y un botón — y <strong>una sola acción</strong>: pulsar la imagen, el título, el texto o el botón lleva al mismo sitio. Hay <strong>un único control real</strong>, el título, y su zona pulsable se estira sobre toda la tarjeta. Una parada de tabulador y un anuncio, no cuatro.</p>
  <div class="tn-cuadricula">
    <article class="tn tn-pulsable tna">
      <div class="tn-medio"><img src="${MEDIO_MUESTRA}" alt=""></div>
      <div class="tn-cuerpo">
        <h4><button type="button" class="tna-disparo">Registro de asistencia</button></h4>
        <p class="tna-txt">No editable: el producto la manda así y solo se mira. Se sigue entrando igual.</p>
      </div>
      <div class="tn-pie"><span class="btn btn-1" aria-hidden="true">Ver</span></div>
    </article>
    <article class="tn tn-pulsable tna">
      <div class="tn-medio">
        <img src="${MEDIO_MUESTRA}" alt="">
        <button class="btn btn-neutro btn-mini tna-editar" type="button">Cambiar imagen</button>
      </div>
      <div class="tn-cuerpo">
        <h4><button type="button" class="tna-disparo">Ficha del trabajador</button></h4>
        <p class="tna-txt">Editable: el control de la foto va <strong>encima</strong> de la zona pulsable. Es la única acción que no es <em>la</em> acción.</p>
      </div>
      <div class="tn-pie"><span class="btn btn-1" aria-hidden="true">Abrir</span></div>
    </article>
    <article class="tn tn-pulsable tna">
      <div class="tn-medio"><span class="tn-medio-vacio">Sin imagen</span></div>
      <div class="tn-cuerpo">
        <h4><button type="button" class="tna-disparo">Sin foto todavía</button></h4>
        <p class="tna-txt">Bloquear la edición <strong>no apaga la navegación</strong>. Sin foto, el hueco se reserva y se rotula.</p>
      </div>
      <div class="tn-pie"><span class="btn btn-1" aria-hidden="true">Ver</span></div>
    </article>
  </div>
</div>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>El estado va en el <strong>filete del borde</strong>, no en el fondo de la tarjeta. Un fondo de color entero cansa y compite con el contenido.</td></tr>
    <tr><td class="num">2</td><td><strong>Nunca opacidad</strong> para atenuar. Medido: a 0,6 ya incumple AA.</td></tr>
    <tr><td class="num">3</td><td>«Aún no marca» ≠ «Falta». No pintes de rojo a quien todavía puede llegar.</td></tr>
    <tr><td class="num">4</td><td>El avatar nunca identifica solo. <strong>El nombre va siempre.</strong></td></tr>
    <tr><td class="num">5</td><td>Si toda la tarjeta navega, es un <code>&lt;a&gt;</code>. Si tiene varias acciones dentro, <strong>no</strong> es pulsable entera.</td></tr>
    <tr><td class="num">6</td><td>El estado lleva texto, no solo color. Se lee «Tardanza», no se deduce del ámbar.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Tarjeta de persona',
  `import { TarjetaPersona } from '@ae/sistema';

<TarjetaPersona
  nombre="Álvarez Ponce, Rosa"
  cargo="Docente · Primaria"
  foto={trabajador.foto}      // si falta, muestra iniciales
  estado="asistio"            // asistio · tardanza · pendiente · falta · permiso · inactivo
  hora="07:42"
/>`
)}
<div style="height:10px"></div>
${verCodigo(
  'Tarjeta normal',
  `import { Tarjeta } from '@ae/sistema';

<Tarjeta titulo="Resumen del mes">
  <p>Contenido</p>
</Tarjeta>

<Tarjeta titulo="Editar sede" acciones={
  <><Boton variante="terciaria">Cancelar</Boton>
    <Boton variante="principal">Guardar</Boton></>
}>
  <CampoTexto etiqueta="Nombre" />
</Tarjeta>

<Tarjeta href="/estudiantes/71234567" titulo="Quispe Mamani, Ana" />`
)}`;

// ── Elemento: Tabla de datos ────────────────────────────────────────────────

const CARGOS = ['Docente · Inicial', 'Docente · Primaria', 'Docente · Secundaria', 'Auxiliar', 'Administración', 'Mantenimiento'];
const SEDES = ['Huaraz', 'Independencia'];
const EST_ASIS = [
  ['exito', 'Asistió'], ['exito', 'Asistió'], ['exito', 'Asistió'],
  ['aviso', 'Tardanza'], ['pend', 'Aún no marca'], ['error', 'Falta'], ['info', 'Permiso'],
];

// Datos deterministas: sin Math.random, para que dos generaciones den lo mismo
// y el diff del HTML sea legible.
const FILAS_TABLA = APODERADOS.concat([
  'Aguilar Ñopo, Beatriz', 'Barrantes Yupanqui, Hugo', 'Cáceres Molina, Nadia',
  'Delgado Ríos, Fabián', 'Espinoza Marín, Gabriela', 'Flores Ccopa, Ignacio',
  'Guzmán Alarcón, Jimena', 'Herrera Túpac, Kevin', 'Ibáñez Rosales, Lorena',
  'Juárez Manrique, Mateo', 'Lazo Chávez, Natalia', 'Maldonado Ríos, Omar',
  'Navarro Espíritu, Paula', 'Ocampo Villar, Quintín', 'Palacios Tirado, Rebeca',
  'Rivas Coronel, Sergio', 'Salcedo Bravo, Tatiana', 'Ubillús Grados, Ulises',
  'Vargas Melgarejo, Verónica', 'Yarleque Ampuero, Wilmer',
]).map((nombre, i) => {
  const [est, etiqueta] = EST_ASIS[i % EST_ASIS.length];
  const marca = est === 'exito' ? `07:${String(30 + (i * 7) % 25).padStart(2, '0')}`
    : est === 'aviso' ? `08:${String(5 + (i * 3) % 25).padStart(2, '0')}` : '—';
  return {
    nombre,
    dni: String(70000000 + i * 137923).slice(0, 8),
    cargo: CARGOS[i % CARGOS.length],
    sede: SEDES[i % SEDES.length],
    est,
    estado: etiqueta,
    marca,
    tarde: est === 'aviso' ? (5 + (i * 3) % 25) : 0,
  };
});

const COLUMNAS = [
  // El índice es POSICIÓN, no dato: continúa entre páginas y no se ordena.
  // Ordenar por la posición no significa nada.
  { k: '__n', t: 'N.º', tipo: 'indice' },
  { k: 'nombre', t: 'Trabajador', tipo: 'texto', fija: true, filtro: 'texto' },
  { k: 'dni', t: 'DNI', tipo: 'mono', filtro: 'texto' },
  // Pocos valores distintos → lista. Escribir «Docente · Secundaria» a mano
  // para filtrar es trabajo que la interfaz puede ahorrar.
  { k: 'cargo', t: 'Cargo', tipo: 'texto', filtro: 'lista' },
  { k: 'sede', t: 'Sede', tipo: 'texto', filtro: 'lista' },
  { k: 'estado', t: 'Estado', tipo: 'chip', filtro: 'lista' },
  { k: 'marca', t: 'Marca', tipo: 'mono', filtro: 'texto' },
  { k: 'tarde', t: 'Min. tarde', tipo: 'numero', filtro: 'texto' },
];

const ICO_DESC = icono('descargar2');
const ICO_ORD = icono('ordenar');
const ICO_COLS = icono('columnas');
const ICO_FILTRO = icono('filtro');
const ICO_X = icono('cerrar');

const pagTabla = `
<p class="pag-intro">Es el <strong>80 % de la superficie del sistema</strong>. Todo lo demás se
mira un rato; esto se mira seis horas. Ordena, pagina, oculta columnas, recuerda la
configuración y descarga CSV.</p>

<div class="bloque tb-bloque">
  <div class="tb-barra">
    <div class="tb-barra-izq">
      <label class="tb-mini tb-buscar"><span>Buscar en toda la tabla</span>
        <span class="sel-caja sel-con-lupa"><span class="sel-lupa">${ICO_LUPA}</span>
          <input class="campo sel-in" id="tb-buscar" placeholder="Nombre, DNI, cargo…" autocomplete="off"></span>
      </label>
      <label class="tb-mini"><span>Mostrar</span>
        <select class="campo" id="tb-tam"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="0">Todas</option></select>
      </label>
      <span class="tb-conteo" id="tb-conteo"></span>
    </div>
    <div class="tb-barra-der">
      <button class="btn btn-neutro btn-ic" id="tb-filtros-btn" aria-expanded="false">${ICO_FILTRO}Filtros</button>
      <div class="tb-cols-menu">
        <button class="btn btn-neutro btn-ic" id="tb-cols-btn" aria-expanded="false">${ICO_COLS}Columnas</button>
        <div class="tb-cols-panel" id="tb-cols-panel" hidden></div>
      </div>
      <button class="btn btn-2 btn-ic" id="tb-csv">${ICO_DESC}CSV</button>
    </div>
  </div>

  <div class="tb-activos" id="tb-activos" hidden></div>

  <div class="tb-envoltura">
    <table class="tb" id="tb-tabla">
      <thead><tr id="tb-cab"></tr><tr id="tb-filtros" class="tb-fila-filtros" hidden></tr></thead>
      <tbody id="tb-cuerpo"></tbody>
    </table>
  </div>

  <div class="tb-pie">
    <span class="tb-rango" id="tb-rango"></span>
    <div class="tb-pag" id="tb-pag"></div>
  </div>
</div>

<h3 class="sub-seccion">Tabla simple</h3>
<p class="seccion-sub">Muestra datos y ya: <strong>no ordena, no filtra, no pagina</strong>. Mismo lenguaje visual que la de datos, sin sus controles. Es la que se usa para documentar, para comparar y para las fichas de detalle.</p>
<div class="bloque">
  <table class="tabla-simple">
    <thead><tr><th>Trabajador</th><th>DNI</th><th>Cargo</th><th class="num">Min. tarde</th></tr></thead>
    <tbody>
      <tr><td>Álvarez Ponce, Rosa</td><td class="mono">70000000</td><td>Docente · Inicial</td><td class="num">0</td></tr>
      <tr><td>Rojas Vega, Luis</td><td class="mono">70275846</td><td>Auxiliar</td><td class="num">14</td></tr>
      <tr><td>Huamán Soto, Pedro</td><td class="mono">70827538</td><td>Mantenimiento</td><td class="num">0</td></tr>
    </tbody>
  </table>
</div>
<table class="tabla-simple" style="margin-top:12px">
  <thead><tr><th></th><th>Tabla simple</th><th>Tabla de datos</th></tr></thead>
  <tbody>
    <tr><td><strong>Cuándo</strong></td><td>Hasta ~15 filas que caben de una vez</td><td class="motivo">Conjuntos que no caben en pantalla</td></tr>
    <tr><td><strong>Ordena</strong></td><td>No</td><td class="motivo">Sí, por columna</td></tr>
    <tr><td><strong>Filtra</strong></td><td>No</td><td class="motivo">Sí, global y por columna</td></tr>
    <tr><td><strong>Pagina</strong></td><td>No</td><td class="motivo">Sí</td></tr>
    <tr><td><strong>Recuerda</strong></td><td>Nada</td><td class="motivo">Columnas, orden y tamaño</td></tr>
    <tr><td><strong>Comparte</strong></td><td colspan="2" class="motivo">Encabezado, altura de fila, divisores, resaltado y alineación de números</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">Las dos <strong>comparten el lenguaje visual</strong>. Si no lo compartieran, dos tablas en la misma pantalla parecerían de dos productos distintos.</p>

<h3 class="sub-seccion">El ancho mínimo, y cómo se renuncia a él</h3>
<p class="seccion-sub">Dentro de la envoltura deslizante, una tabla simple lleva un <strong>suelo de 520&nbsp;px</strong>.
Es un buen valor por omisión: por debajo, las columnas se apelmazan y se lee peor estrujada que desplazándola.</p>
<p class="pag-intro">Pero <strong>para configurar no vale</strong>: se pierde de vista la fila mientras se pulsa
la columna. Esa es una decisión de quien monta la pantalla, así que se puede renunciar al suelo — <strong>diciéndolo</strong>,
con <code>tabla-libre</code>, y no sacando la tabla fuera de la envoltura para que no lo herede.</p>
<div class="bloque">
  <div class="tb-envoltura">
    <table class="tabla-simple tabla-libre">
      <thead><tr><th>Grupo</th><th>Ver</th><th>Editar</th><th>Crear</th></tr></thead>
      <tbody>
        <tr><td>Organigrama</td><td>Sí</td><td>Sí</td><td class="motivo">No</td></tr>
        <tr><td>Locales</td><td>Sí</td><td class="motivo">No</td><td class="motivo">No</td></tr>
      </tbody>
    </table>
  </div>
</div>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Sin declarar nada, el suelo son <strong>520&nbsp;px</strong> y la envoltura desplaza. Para <strong>leer</strong> está bien.</td></tr>
    <tr><td class="num">2</td><td>Con <code>tabla-libre</code> <strong>no hay suelo</strong>. La contrapartida es de quien la usa: las celdas tienen que poder encoger.</td></tr>
    <tr><td class="num">3</td><td>Es <strong>contrato</strong>, no un descubrimiento: el candado de la cascada lo comprueba a los once anchos, en las dos caras — que <code>tabla-libre</code> reciba 0 <em>y</em> que sin declarar nada siga recibiendo 520.</td></tr>
    <tr><td class="num">4</td><td>La tabla de datos <strong>no está afectada</strong>: emite <code>.tb</code>, no <code>.tabla-simple</code>, y nunca tuvo suelo.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Densidad</h3>
<p class="pag-intro">Dos alturas de fila: <strong>cómoda 34px</strong> y <strong>compacta 28px</strong>.
Se cambia en el menú de usuario, junto al tema.</p>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Es <strong>global, no por tabla</strong>. Un conmutador por tabla permitiría dos alturas de fila en la misma pantalla, y eso no se lee como una preferencia: se lee como un fallo.</td></tr>
    <tr><td class="num">2</td><td>Es una preferencia <strong>de la persona</strong>, no de la pantalla. Por eso vive en el menú de usuario y se recuerda.</td></tr>
    <tr><td class="num">3</td><td><strong>En táctil no se aplica.</strong> Una fila de 28px no es un blanco que se acierte con el dedo: SC 2.5.8 pide 24px como mínimo y la práctica pide 44.</td></tr>
    <tr><td class="num">4</td><td>Cambia la <strong>altura de la fila</strong>, nunca el tamaño de la letra. Encoger el texto no es densidad: es hacerlo ilegible.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Filas desplegables — agrupar subelementos</h3>
<p class="seccion-sub">El símbolo se llama <strong>chevron</strong>; cuando su trabajo es abrir y cerrar contenido se le llama <em>disclosure</em>. Gira al desplegar y el contenido entra con transición de altura.</p>
<div class="bloque">
  <div class="tb-envoltura">
    <table class="tb tb-desp">
      <thead><tr>
        <th class="tb-th tb-th-chev"></th>
        <th class="tb-th tb-th-indice"><span class="tb-th-txt tb-num">N.º</span></th>
        <th class="tb-th"><span class="tb-th-txt">Cargo</span></th>
        <th class="tb-th"><span class="tb-th-txt">Personal</span></th>
        <th class="tb-th"><span class="tb-th-txt">Asistieron</span></th>
        <th class="tb-th tb-num"><span class="tb-th-txt">Pendientes</span></th>
      </tr></thead>
      <tbody>
      ${CARGOS.map((cargo, n) => {
        const gente = FILAS_TABLA.filter((f) => f.cargo === cargo);
        const asis = gente.filter((f) => f.est === 'exito').length;
        const pend = gente.length - asis;
        return `
        <tr class="tb-grupo${n % 2 ? ' tb-alt' : ''}" data-grupo="g${n}">
          <td class="tb-chev-celda">
            <button class="tb-chev" aria-expanded="false" aria-controls="det-g${n}"
                    aria-label="Mostrar personal de ${cargo}">${ICONOS.chevron}</button>
          </td>
          <td class="tb-indice mono">${n + 1}</td>
          <td><strong>${cargo}</strong></td>
          <td class="mono">${gente.length}</td>
          <td><span class="chip chip-exito">${asis}</span></td>
          <td class="tb-num mono">${pend || '—'}</td>
        </tr>
        <tr class="tb-detalle" id="det-g${n}">
          <td colspan="6">
            <div class="tb-desliza">
              <div class="tb-desliza-in">
                <table class="tb-sub">
                  <thead><tr><th class="tb-num tb-sub-n">N.º</th><th>Trabajador</th><th>DNI</th><th>Sede</th><th>Estado</th><th>Marca</th></tr></thead>
                  <tbody>
                  ${gente
                    .map(
                      (f, j) => `<tr><td class="tb-indice mono tb-sub-n">${j + 1}</td>
                        <td>${f.nombre}</td><td class="mono">${f.dni}</td><td>${f.sede}</td>
                        <td><span class="chip chip-${f.est}">${f.estado}</span></td>
                        <td class="mono">${f.marca}</td></tr>`
                    )
                    .join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div>
</div>
<table class="tabla-simple" style="margin-top:12px">
  <thead><tr><th>Detalle</th><th>Por qué así</th></tr></thead>
  <tbody>
    <tr><td>El chevron es un <code>&lt;button&gt;</code>, no un icono suelto</td><td class="motivo">Se alcanza con Tab y se activa con Enter o Espacio. Un <code>span</code> con <code>onClick</code> no</td></tr>
    <tr><td><code>aria-expanded</code> y <code>aria-controls</code></td><td class="motivo">El lector de pantalla anuncia si está abierto y qué controla</td></tr>
    <tr><td>La transición usa <code>grid-template-rows</code></td><td class="motivo">Es lo único que anima hasta altura automática sin fijar píxeles a mano</td></tr>
    <tr><td>La fila resumen trae las cifras</td><td class="motivo">Si hay que desplegar para saber si importa, el resumen no sirve de nada</td></tr>
    <tr><td>Solo un nivel de anidamiento</td><td class="motivo">Dos niveles y la persona se pierde. Si hacen falta dos, es otra pantalla</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Comportamiento</h3>
<table class="tabla-simple">
  <thead><tr><th>Regla</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>10 por defecto</strong>, luego 25, 50 y Todas</td><td class="motivo">10 cabe sin desplazar en un portátil. Quien necesita más lo sube una vez y queda recordado</td></tr>
    <tr><td><strong>«Todas» avisa por encima de 500 filas</strong></td><td class="motivo">Pintar miles de filas congela el navegador. El aviso llega antes que el bloqueo</td></tr>
    <tr><td><strong>El resaltado lleva filete azul de 3px</strong></td><td class="motivo">Medido: sobre la fila alterna el fondo solo cambia 1,04:1. El filete es inequívoco sobre las dos</td></tr>
    <tr><td><strong>La primera columna no se puede ocultar</strong></td><td class="motivo">Sin el nombre, la fila no identifica nada. Ocultarla deja una tabla de datos huérfanos</td></tr>
    <tr><td><strong>El orden se marca con flecha y con <code>aria-sort</code></strong></td><td class="motivo">Un encabezado resaltado sin flecha no dice en qué sentido está ordenado</td></tr>
    <tr><td><strong>La configuración se guarda por persona</strong></td><td class="motivo">Quien usa la tabla a diario no la reconfigura cada mañana</td></tr>
    <tr><td><strong>El CSV exporta lo <em>filtrado</em>, no la página</strong></td><td class="motivo">Descargar solo las 10 visibles deja fuera lo que la persona considera su resultado</td></tr>
    <tr><td><strong>Números a la derecha y en mono</strong></td><td class="motivo">Las cifras se comparan por columna. Alineadas a la izquierda no se comparan</td></tr>
    <tr><td><strong>La columna N.º no ordena</strong></td><td class="motivo">Es posición, no dato. Continúa entre páginas: la página 2 empieza en 11</td></tr>
    <tr><td><strong>Filtro de lista donde hay pocos valores</strong></td><td class="motivo">Escribir «Docente · Secundaria» a mano es trabajo que la interfaz puede ahorrar</td></tr>
    <tr><td><strong>El filtro ignora tildes</strong></td><td class="motivo"><code>nunez</code> encuentra <code>Núñez</code>. Misma promesa que el selector</td></tr>
    <tr><td><strong>Los filtros NO se recuerdan</strong></td><td class="motivo">Un filtro guardado hace que al día siguiente se vean 3 filas de 38 y parezca que faltan datos. La configuración es preferencia; el filtro es del momento</td></tr>
    <tr><td><strong>Los filtros activos se ven arriba</strong></td><td class="motivo">Con la fila de filtros plegada, nada más indica que la tabla está filtrada</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Sin construir</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td>Selección múltiple con acciones en lote</td><td class="motivo">Necesita definir qué acciones y con qué permisos. Es regla de negocio</td></tr>
    <tr><td>Encabezado fijo al desplazar</td><td class="motivo">Trivial de añadir; se hace con el componente real</td></tr>
    <tr><td>Reordenar columnas arrastrando</td><td class="motivo">Coste alto y beneficio dudoso. Ocultar ya cubre el 90 % del caso</td></tr>
    <tr><td>Guardar vistas con nombre</td><td class="motivo">«Mis tardanzas de esta semana». Útil, pero primero hay que ver si alguien lo pide</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Filas de <strong>34px</strong> en densidad cómoda, 28px en compacta.</td></tr>
    <tr><td class="num">2</td><td>Las acciones de fila van como <strong>enlace</strong>, no como botón.</td></tr>
    <tr><td class="num">3</td><td>El resaltado <strong>lleva filete</strong>, no solo fondo. Con cebra, el fondo solo no basta.</td></tr>
    <tr><td class="num">4</td><td>Números a la derecha, en mono. Texto a la izquierda.</td></tr>
    <tr><td class="num">5</td><td>La columna identificadora <strong>no se oculta</strong>.</td></tr>
    <tr><td class="num">6</td><td>Los tres estados de pantalla —cargando, nunca consultado, sin resultados— <strong>son obligatorios</strong>.</td></tr>
    <tr><td class="num">7</td><td>El CSV exporta el conjunto filtrado, nunca solo la página visible.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { TablaDatos } from '@ae/sistema';

<TablaDatos
  id="asistencia-personal"        // clave con la que se recuerda la configuración
  filas={personal}
  columnas={[
    { clave: 'nombre', titulo: 'Trabajador', fija: true },
    { clave: 'dni',    titulo: 'DNI',        tipo: 'mono' },
    { clave: 'estado', titulo: 'Estado',     tipo: 'chip' },
    { clave: 'tarde',  titulo: 'Min. tarde', tipo: 'numero' },
  ]}
  porPagina={10}                  // 10 · 25 · 50 · 0 para todas
  exportarCSV
  accionFila={(f) => <Enlace href={\`/personal/\${f.dni}\`}>Editar</Enlace>}
/>`
)}`;

// ── Elemento: Paginación ────────────────────────────────────────────────────

const pagPaginacion = `
<p class="pag-intro">Divide un conjunto largo en páginas y dice <strong>dónde estás y cuánto
queda</strong>. Lo segundo importa más que lo primero: «página 3 de ?» no informa de nada.</p>
<p class="pag-intro">Un solo componente para todo el sistema. La
<a href="#tabla" data-ir="tabla" class="enlace">tabla de datos</a> lo consume igual que
cualquier otro listado: no tiene paginación propia.</p>

<h3 class="sub-seccion">Anatomía</h3>
<div class="bloque">
  <div class="pg-demo" id="pg-demo">
    <span class="tb-rango" id="pg-rango"></span>
    <div class="tb-pag" id="pg-botones"></div>
  </div>
  <ol class="anat-lista" style="margin-top:16px">
    <li><b>Rango</b> — <code>1–10 de 1 240</code>. Dice el tamaño del problema, no solo la posición.</li>
    <li><b>Anterior y siguiente</b> — se deshabilitan en los extremos, no desaparecen: si desaparecen, los botones se mueven bajo el cursor.</li>
    <li><b>Números</b> — primera, última y las vecinas de la actual.</li>
    <li><b>Elisión</b> — <code>…</code> donde se saltan páginas. No es un botón.</li>
  </ol>
</div>

<h3 class="sub-seccion">Paginar, «cargar más» o desplazamiento infinito</h3>
<table class="tabla-simple">
  <thead><tr><th>Patrón</th><th>Cuándo</th><th>Cuándo no</th></tr></thead>
  <tbody>
    <tr><td><strong>Paginación</strong></td><td class="motivo">Hay que localizar un registro concreto, volver a él, o saber cuántos hay en total</td><td class="motivo">—</td></tr>
    <tr><td><strong>Cargar más</strong></td><td class="motivo">Listas donde el orden es cronológico y nadie vuelve a una posición: avisos, historial</td><td class="motivo">Cuando hace falta el total o volver a la página 7</td></tr>
    <tr><td><strong>Desplazamiento infinito</strong></td><td class="motivo">—</td><td class="motivo"><strong>Nunca en el sistema.</strong> No se llega al pie, se pierde el sitio al volver atrás y no hay forma de decir «está en la página 4»</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Variantes</h3>
<div class="bloque">
  <div class="pg-variantes">
    <div class="pg-var">
      <div class="tb-pag">
        <span class="pgn-btn pgn-flecha" aria-disabled="true">${ICO_CHEV_IZQ}<span>Anterior</span></span>
        <span class="pgn-btn activa">1</span><span class="pgn-btn">2</span><span class="pgn-btn">3</span>
        <span class="pgn-elip">…</span><span class="pgn-btn">124</span>
        <span class="pgn-btn pgn-flecha"><span>Siguiente</span>${ICO_CHEV_DER}</span>
      </div>
      <span class="mf-et"><b>Completa</b><br>Escritorio, con muchas páginas</span>
    </div>
    <div class="pg-var">
      <div class="tb-pag">
        <span class="pgn-btn activa">1</span><span class="pgn-btn">2</span><span class="pgn-btn">3</span>
      </div>
      <span class="mf-et"><b>Corta</b><br>Tres páginas o menos: sin flechas ni elisión</span>
    </div>
    <div class="pg-var">
      <div class="tb-pag">
        <span class="pgn-btn pgn-flecha">${ICO_CHEV_IZQ}<span>Anterior</span></span><span class="pg-pos">3 de 124</span><span class="pgn-btn pgn-flecha"><span>Siguiente</span>${ICO_CHEV_DER}</span>
      </div>
      <span class="mf-et"><b>Móvil</b><br>Sin números: no caben y el dedo falla</span>
    </div>
    <div class="pg-var">
      <button class="btn btn-neutro">Cargar 25 más</button>
      <span class="mf-et"><b>Cargar más</b><br>Dice <strong>cuántos</strong>, no «Cargar más» a secas</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Una sola página: no se pinta</h3>
<div class="bloque">
  <div class="enl-comp">
    <div class="enl-caja bien">
      <div class="pg-demo-mini"><span class="tb-rango">1–6 de 6</span></div>
      <span class="bien-et">Queda el rango. Confirma que están todos</span>
    </div>
    <div class="enl-caja mal">
      <div class="pg-demo-mini"><span class="tb-rango">1–6 de 6</span>
        <div class="tb-pag"><span class="pgn-btn pgn-flecha" aria-disabled="true">${ICO_CHEV_IZQ}<span>Anterior</span></span><span class="pgn-btn activa">1</span><span class="pgn-btn pgn-flecha" aria-disabled="true"><span>Siguiente</span>${ICO_CHEV_DER}</span></div></div>
      <span class="mal-et">Controles que no llevan a ninguna parte</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Accesibilidad</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Va dentro de <code>&lt;nav aria-label="Paginación"&gt;</code>. Sin etiqueta, un lector anuncia «navegación» y no dice cuál.</td></tr>
    <tr><td class="num">2</td><td>La página actual lleva <code>aria-current="page"</code>. El color solo no la marca.</td></tr>
    <tr><td class="num">3</td><td>Cada número necesita nombre accesible: <code>aria-label="Página 4"</code>. Un «4» suelto no dice nada.</td></tr>
    <tr><td class="num">4</td><td>Las flechas también: <code>aria-label="Página anterior"</code>. Los símbolos <code>‹</code> y <code>›</code> se leen mal o no se leen.</td></tr>
    <tr><td class="num">5</td><td>La elisión <code>…</code> va <code>aria-hidden</code>: no es un control.</td></tr>
    <tr><td class="num">6</td><td>Al cambiar de página, el foco va al inicio de la lista. Si se queda en el botón, hay que recorrer la paginación entera de vuelta.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>El <strong>rango es obligatorio</strong>. Los números de página son opcionales.</td></tr>
    <tr><td class="num">2</td><td>Con una sola página, <strong>no se pinta la paginación</strong>. El rango se queda.</td></tr>
    <tr><td class="num">3</td><td>Anterior y siguiente se <strong>deshabilitan</strong> en los extremos, no se ocultan.</td></tr>
    <tr><td class="num">4</td><td>Nunca desplazamiento infinito.</td></tr>
    <tr><td class="num">5</td><td>En móvil, sin números: anterior, posición y siguiente. <strong>El chevron y el nombre nunca se separan.</strong></td></tr>
    <tr><td class="num">6</td><td>«Cargar más» dice <strong>cuántos</strong> carga.</td></tr>
    <tr><td class="num">7</td><td>Al filtrar u ordenar, se vuelve a la <strong>página 1</strong>. Quedarse en la 7 de un conjunto que ahora tiene 2 muestra una página vacía.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Paginacion } from '@ae/sistema';

<Paginacion
  total={1240}
  porPagina={10}
  pagina={pagina}
  onCambio={setPagina}
/>

// Móvil: sin números
<Paginacion total={1240} porPagina={10} pagina={p} onCambio={setP} compacta />

// Cargar más
<Paginacion variante="cargar-mas" restantes={215} porTanda={25} onCargar={cargar} />`
)}
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Por defecto</th><th>Qué hace</th></tr></thead>
  <tbody>
    <tr><td><code>total</code></td><td class="mono">number</td><td class="mono">—</td><td class="motivo"><strong>Obligatorio.</strong> Sin total no se puede construir el rango</td></tr>
    <tr><td><code>porPagina</code></td><td class="mono">number</td><td class="mono">10</td><td class="motivo">0 significa todas</td></tr>
    <tr><td><code>pagina</code></td><td class="mono">number</td><td class="mono">1</td><td class="motivo">Controlado desde fuera</td></tr>
    <tr><td><code>compacta</code></td><td class="mono">boolean</td><td class="mono">false</td><td class="motivo">Sin números. Se activa sola bajo 640px</td></tr>
    <tr><td><code>variante</code></td><td class="mono">paginas · cargar-mas</td><td class="mono">paginas</td><td class="motivo">—</td></tr>
  </tbody>
</table>`;

// ── Elemento: Estados de pantalla ───────────────────────────────────────────

const ICO_BUSCAR_VACIO = ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
const ICO_PRIMERA = ic('<path d="M12 5v14M5 12h14"/>');
const ICO_AVERIA = ic('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>');
const ICO_CANDADO = ic('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>');
const ICO_PERIODO = ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>');

const ESTADOS_PANTALLA = [
  {
    k: 'cargando', t: 'Cargando',
    cuando: 'La petición está en marcha',
    titulo: null,
  },
  {
    k: 'inicial', t: 'Nunca consultado', ico: ICO_PERIODO,
    cuando: 'Aún no se ha pedido nada',
    titulo: 'Elige un periodo para ver la asistencia',
    linea: 'Los datos se cargan al seleccionar mes y sede.',
    accion: null,
  },
  {
    k: 'sin-resultados', t: 'Sin resultados', ico: ICO_BUSCAR_VACIO,
    cuando: 'Se buscó y no hubo coincidencias',
    titulo: 'Sin resultados para «perez»',
    linea: 'Prueba con menos letras, o revisa los filtros.',
    accion: 'Quitar filtros',
  },
  {
    k: 'primera-vez', t: 'Primera vez', ico: ICO_PRIMERA,
    cuando: 'No hay datos porque todavía no se ha creado ninguno',
    titulo: 'Todavía no hay trabajadores registrados',
    linea: 'Al registrar el primero aparecerá aquí.',
    accion: 'Registrar trabajador',
  },
  {
    k: 'error', t: 'Error', ico: ICO_AVERIA,
    cuando: 'La petición falló',
    titulo: 'No se pudo cargar la asistencia',
    linea: 'La conexión se interrumpió. Los datos no se han perdido.',
    accion: 'Reintentar',
  },
  {
    k: 'sin-permiso', t: 'Sin permiso', ico: ICO_CANDADO,
    cuando: 'La persona no puede ver esto',
    titulo: 'No tienes acceso a la asistencia de otras sedes',
    linea: 'Pídeselo a Dirección si lo necesitas.',
    accion: null,
  },
  // v1.7.0 — SÉPTIMO. No sustituye a «Error»: son cosas distintas y confundirlas
  // da una pantalla que miente. En «Error» la petición falló pero QUEDA pantalla,
  // y por eso se ofrece Reintentar. Aquí reventó el propio dibujado y NO hay área
  // donde pintar: ofrecer Reintentar sería ofrecer un botón que vuelve a fallar,
  // porque volvería a ejecutar exactamente el mismo dibujado que ya falló.
  {
    k: 'fallo-dibujado', t: 'Fallo de dibujado', ico: icono('roto', TAMANOS.estado),
    cuando: 'El componente reventó al pintarse',
    titulo: 'No pudimos mostrar esta pantalla',
    linea: 'Puedes recargar o volver al inicio. Referencia: 7K4M-92.',
    accion: 'Recargar la pantalla',
  },
];

const cajaEstado = (e) =>
  e.k === 'cargando'
    ? `<div class="ep ep-cargando">
        <div class="esqueleto" style="width:38%"></div>
        <div class="esqueleto" style="width:64%"></div>
        <div class="esqueleto" style="width:52%"></div>
        <div class="esqueleto" style="width:70%"></div>
      </div>`
    : `<div class="ep">
        <div class="ep-ico ep-ico-${e.k}">${e.ico}</div>
        <h4 class="ep-titulo">${e.titulo}</h4>
        <p class="ep-linea">${e.linea}</p>
        ${e.accion ? `<button class="btn btn-1">${e.accion}</button>` : ''}
      </div>`;

const pagEstados = `
<p class="pag-intro">Una pantalla pasa más tiempo <strong>sin datos que con ellos</strong>:
cargando, recién abierta, filtrada a cero, caída. Son seis estados, y confundir dos de ellos
hace que la gente crea que el sistema perdió su información.</p>

<h3 class="sub-seccion">Los siete</h3>
<div class="bloque">
  <div class="ep-rejilla">
    ${ESTADOS_PANTALLA.map(
      (e) => `<div class="ep-caja">
        <span class="ep-et">${e.t}</span>
        ${cajaEstado(e)}
        <p class="ep-cuando">${e.cuando}</p>
      </div>`
    ).join('')}
  </div>
</div>

<h3 class="sub-seccion">Error o fallo de dibujado</h3>
<p class="pag-intro">Los dos dicen «algo salió mal» y no son lo mismo. Confundirlos da una
pantalla que <strong>ofrece un botón que vuelve a fallar</strong>.</p>
<table class="tabla-simple">
  <thead><tr><th></th><th>Error</th><th>Fallo de dibujado</th></tr></thead>
  <tbody>
    <tr><td><strong>Qué pasó</strong></td><td>La petición falló</td><td class="motivo">El componente reventó al pintarse</td></tr>
    <tr><td><strong>Queda pantalla</strong></td><td>Sí. El aviso va dentro del área de contenido</td><td class="motivo">No. <strong>No hay área</strong> donde pintar</td></tr>
    <tr><td><strong>Qué se ofrece</strong></td><td>Reintentar la petición</td><td class="motivo">Recargar. Reintentar repetiría el mismo dibujado</td></tr>
    <tr><td><strong>Alcance</strong></td><td>Un panel o una tabla</td><td class="motivo">La región entera que quedó rota</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Qué NO se dice en un fallo</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Ni traza, ni nombre de excepción, ni ruta, ni nombre de servicio. <strong>A quien lo lee no le sirve, y a quien no debería verlo, sí.</strong></td></tr>
    <tr><td class="num">2</td><td>Sí un <strong>código de referencia</strong> corto y copiable. Es lo que convierte «no funciona» en un caso que alguien puede buscar.</td></tr>
    <tr><td class="num">3</td><td>Un código sin registro detrás es <strong>decoración</strong>. Si no se puede buscar, no se pone.</td></tr>
    <tr><td class="num">4</td><td>Nunca se culpa a la persona. No hizo nada mal: se rompió el programa.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Las tres parejas que se confunden</h3>
<table class="tabla-simple">
  <thead><tr><th>No es lo mismo</th><th>que</th><th>Consecuencia de confundirlos</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>Nunca consultado</strong><br><span class="ep-mini">No se ha pedido nada</span></td>
      <td><strong>Sin resultados</strong><br><span class="ep-mini">Se pidió y no hay</span></td>
      <td class="motivo">La persona cree que no hay datos cuando en realidad todavía no ha buscado. Cierra la pantalla y llama por teléfono</td>
    </tr>
    <tr>
      <td><strong>Sin resultados</strong><br><span class="ep-mini">El filtro no encontró</span></td>
      <td><strong>Primera vez</strong><br><span class="ep-mini">No existe ninguno todavía</span></td>
      <td class="motivo">«No hay trabajadores» con un filtro puesto hace pensar que se borraron. Y en una pantalla recién estrenada, «sin resultados» no dice que hay que crear el primero</td>
    </tr>
    <tr>
      <td><strong>Error</strong><br><span class="ep-mini">Falló la petición</span></td>
      <td><strong>Sin permiso</strong><br><span class="ep-mini">No le corresponde verlo</span></td>
      <td class="motivo">Un error invita a reintentar; sin permiso, reintentar no sirve. Y al revés: pintar de error algo que es de permisos manda a la gente a soporte sin motivo</td>
    </tr>
  </tbody>
</table>

<h3 class="sub-seccion">Anatomía</h3>
<div class="bloque">
  <div class="anatomia">
    ${cajaEstado(ESTADOS_PANTALLA[2])}
    <ol class="anat-lista">
      <li><b>Icono</b> — de trazo, 32px, en <code>texto-pista</code>. Solo en error y sin permiso toma color.</li>
      <li><b>Título</b> — <strong>nombra lo que pasó</strong>, con el dato concreto: «Sin resultados para <em>perez</em>», no «Sin resultados».</li>
      <li><b>Una línea</b> — dice qué hacer. Si hacen falta dos, sobra una.</li>
      <li><b>Acción</b> — solo si existe una salida real. Sin salida, no se pone botón.</li>
    </ol>
  </div>
</div>

<h3 class="sub-seccion">Cargando: esqueleto, giro o nada</h3>
<table class="tabla-simple">
  <thead><tr><th>Duración</th><th>Qué se muestra</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td>Bajo <strong>300 ms</strong></td><td><strong>Nada</strong></td><td class="motivo">Un parpadeo se percibe como un fallo. Esperar en silencio se percibe como rapidez</td></tr>
    <tr><td>300 ms a 3 s</td><td><strong>Esqueleto</strong></td><td class="motivo">Se conoce la forma de lo que viene: filas, tarjetas, campos. Reserva el sitio y la página no salta</td></tr>
    <tr><td>Más de 3 s</td><td>Esqueleto <strong>y aviso</strong></td><td class="motivo">«Esto tarda más de lo normal» evita que se pulse otra vez</td></tr>
    <tr><td>Forma desconocida</td><td>Indicador de giro</td><td class="motivo">Solo cuando no se puede dibujar el esqueleto. Es el último recurso, no el primero</td></tr>
  </tbody>
</table>
<div class="aviso">
  <strong>El esqueleto imita la maqueta, no la decora.</strong> Si el esqueleto tiene cuatro
  líneas y llegan diez filas, la página salta y se pierde el sitio donde se estaba mirando.
</div>

<h3 class="sub-seccion">Dónde vive el estado</h3>
<div class="bloque">
  <div class="ep-ambitos">
    <div class="ep-ambito">
      <div class="ep-marco-demo"><div class="ep-mini-cab"></div>${cajaEstado(ESTADOS_PANTALLA[1])}</div>
      <span class="mf-et"><b>Pantalla entera</b><br>El marco y los filtros se quedan.<br>Nunca desaparece la navegación</span>
    </div>
    <div class="ep-ambito">
      <div class="tn"><div class="tn-cab"><h4>Asistencia del mes</h4></div>${cajaEstado(ESTADOS_PANTALLA[4])}</div>
      <span class="mf-et"><b>Dentro de una tarjeta</b><br>Si falla un panel, el resto de la pantalla sigue</span>
    </div>
    <div class="ep-ambito">
      <div class="tb-envoltura">
        <table class="tb"><thead><tr><th class="tb-th"><span class="tb-th-txt">Trabajador</span></th><th class="tb-th"><span class="tb-th-txt">Estado</span></th></tr></thead>
        <tbody><tr><td colspan="2" class="tb-vacio"><strong>Sin resultados para «zapata».</strong><br>Prueba con menos letras.</td></tr></tbody></table>
      </div>
      <span class="mf-et"><b>Dentro de una tabla</b><br>El encabezado se queda: dice qué columnas habría</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">El texto</h3>
<table class="tabla-simple">
  <thead><tr><th>✗</th><th>✓</th></tr></thead>
  <tbody>
    <tr><td>«Sin resultados»</td><td>«Sin resultados para <em>perez</em>. Prueba con menos letras»</td></tr>
    <tr><td>«No hay datos»</td><td>«Todavía no hay trabajadores registrados»</td></tr>
    <tr><td>«Error 500»</td><td>«No se pudo cargar. Reintenta en un minuto»</td></tr>
    <tr><td>«Acceso denegado»</td><td>«No tienes acceso a otras sedes. Pídeselo a Dirección»</td></tr>
    <tr><td>«Ha ocurrido un error inesperado»</td><td>«La conexión se interrumpió. Los datos no se han perdido»</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">En el error, decir <strong>qué NO se perdió</strong>
importa tanto como decir qué falló. Quien acaba de rellenar un formulario largo necesita saberlo
antes que la causa técnica.</p>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Los seis estados son <strong>obligatorios</strong> en cualquier pantalla que cargue datos. No solo el que tiene datos.</td></tr>
    <tr><td class="num">2</td><td><strong>Nunca consultado ≠ sin resultados ≠ primera vez.</strong> Tres mensajes distintos.</td></tr>
    <tr><td class="num">3</td><td>El título <strong>nombra el dato concreto</strong>: qué se buscó, qué periodo, qué sede.</td></tr>
    <tr><td class="num">4</td><td>Una línea. Si hacen falta dos, sobra una.</td></tr>
    <tr><td class="num">5</td><td>Botón <strong>solo si hay salida real</strong>. Un botón que no resuelve nada es peor que ninguno.</td></tr>
    <tr><td class="num">6</td><td>Bajo 300 ms no se muestra nada. El parpadeo se lee como fallo.</td></tr>
    <tr><td class="num">7</td><td>El estado <strong>no se come el marco ni los filtros</strong>: quien llegó ahí necesita poder cambiar la consulta.</td></tr>
    <tr><td class="num">8</td><td>En error, di <strong>qué no se perdió</strong>.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { EstadoPantalla } from '@ae/sistema';

// El componente elige el estado; la pantalla no lo decide a mano
<EstadoPantalla
  cargando={cargando}
  error={error}
  consultado={consultado}       // false = nunca consultado
  vacio={filas.length === 0}
  existenDatos={totalSinFiltros > 0}   // distingue «sin resultados» de «primera vez»
  busqueda={texto}              // para nombrarlo en el título
  onReintentar={recargar}
  onQuitarFiltros={limpiar}
>
  <TablaDatos filas={filas} />
</EstadoPantalla>`
)}
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Prop</th><th>Tipo</th><th>Qué resuelve</th></tr></thead>
  <tbody>
    <tr><td><code>consultado</code></td><td class="mono">boolean</td><td class="motivo">Separa «nunca consultado» de «sin resultados»</td></tr>
    <tr><td><code>existenDatos</code></td><td class="mono">boolean</td><td class="motivo">Separa «sin resultados» de «primera vez». <strong>Es el total sin filtros</strong>, no el filtrado</td></tr>
    <tr><td><code>busqueda</code></td><td class="mono">string</td><td class="motivo">Permite nombrar lo buscado en el título</td></tr>
    <tr><td><code>error</code></td><td class="mono">Error · null</td><td class="motivo">Si es de permisos, el componente muestra «sin permiso» y oculta Reintentar</td></tr>
    <tr><td><code>esqueleto</code></td><td class="mono">ReactNode</td><td class="motivo">La forma de lo que viene. Por defecto, filas</td></tr>
  </tbody>
</table>`;

// ── Elemento: Interruptor ───────────────────────────────────────────────────

// EL NOMBRE ACCESIBLE VA CON aria-labelledby, Y NO ES OPCIONAL.
// Envolver en <label> NO nombra a un <button>: HTML-AAM calcula el nombre de un
// botón desde aria-labelledby → aria-label → su subárbol → title, y <label> no
// entra en esa lista. El botón está vacío —solo lleva la bolita—, así que sin
// esto los ocho interruptores se anunciaban como «interruptor, activado» SIN
// decir qué controlan. Es SC 4.1.2.
let nSw = 0;
const sw = (o = {}) => {
  const id = `sw-et-${++nSw}`;
  // R66 · Cerrado por regla: el interruptor DESAPARECE y en su hueco va el
  // candado. Un control que no puede cambiar nunca no es un interruptor, y el
  // motivo es la mitad del estado — sin el, el candado se lee como un fallo.
  if (o.cerrado) return `
  <div class="sw-fila sw-cerrado">
    <span class="sw-candado">${icono('candado', 16)}</span>
    <span class="sw-txt">
      <span class="sw-et">${o.etiqueta || 'Tesorería'}</span>
      <span class="sw-motivo">${o.cerrado}</span>
    </span>
  </div>`;
  return `
  <label class="sw-fila${o.desh ? ' sw-desh' : ''}">
    <button type="button" role="switch" class="sw" aria-checked="${o.on ? 'true' : 'false'}"
            aria-labelledby="${id}"
            ${o.desh ? "aria-disabled='true'" : ''}${o.demo ? ' data-sw' : ''}><span class="sw-bolita"></span></button>
    <span class="sw-txt">
      <span class="sw-et" id="${id}">${o.etiqueta || 'Notificar por correo'}</span>
      ${o.ayuda ? `<span class="sw-ayuda">${o.ayuda}</span>` : ''}
    </span>
  </label>`;
};

const pagInterruptor = `
<p class="pag-intro">Enciende o apaga algo, y <strong>surte efecto al instante</strong>. Si hace
falta pulsar «Guardar» después, no es un interruptor: es una casilla dentro de un formulario.</p>

<h3 class="sub-seccion">Interruptor o casilla</h3>
<table class="tabla-simple">
  <thead><tr><th></th><th>Interruptor</th><th>Casilla</th></tr></thead>
  <tbody>
    <tr><td><strong>Cuándo surte efecto</strong></td><td>Al instante</td><td class="motivo">Al enviar el formulario</td></tr>
    <tr><td><strong>Necesita «Guardar»</strong></td><td>No</td><td class="motivo">Sí</td></tr>
    <tr><td><strong>Se puede deshacer</strong></td><td>Volviéndolo a pulsar</td><td class="motivo">Cancelando el formulario</td></tr>
    <tr><td><strong>Ejemplo</strong></td><td>Activar notificaciones</td><td class="motivo">Acepto el reglamento</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">Un interruptor dentro de un formulario con «Guardar»
engaña: la persona lo mueve, se va, y el cambio no se aplicó.</p>

<h3 class="sub-seccion">Estados</h3>
<div class="bloque">
  <div class="sw-rejilla">
    ${sw({ etiqueta: 'Apagado', on: false })}
    ${sw({ etiqueta: 'Encendido', on: true })}
    ${sw({ etiqueta: 'Apagado sin permiso', on: false, desh: true, ayuda: 'Solo Dirección puede cambiarlo.' })}
    ${sw({ etiqueta: 'Encendido sin permiso', on: true, desh: true })}
    ${sw({ etiqueta: 'Tesorería', cerrado: 'Cerrado: no puedes conceder un privilegio que tú no tienes.' })}
  </div>
</div>

<h3 class="sub-seccion">Pruébalo</h3>
<div class="bloque">
  <div class="sw-rejilla">
    ${sw({ etiqueta: 'Notificar tardanzas por correo', on: true, demo: true, ayuda: 'Se envía un resumen a las 09:00.' })}
    ${sw({ etiqueta: 'Permitir marcar desde el móvil', on: false, demo: true, ayuda: 'Requiere estar dentro del colegio.' })}
    ${sw({ etiqueta: 'Modo compacto en las tablas', on: false, demo: true, ayuda: 'Filas de 28px en vez de 34px.' })}
  </div>
</div>

<h3 class="sub-seccion">La transición</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>La bolita se desplaza en <strong>180 ms</strong> con <code>ease</code>. Más rápido no se ve; más lento se percibe lento.</td></tr>
    <tr><td class="num">2</td><td>El fondo cambia de color en el <strong>mismo tiempo</strong>: si van desacompasados, parece un fallo.</td></tr>
    <tr><td class="num">3</td><td>Con <code>prefers-reduced-motion</code>, el cambio es <strong>instantáneo</strong>. Sigue siendo perceptible: no depende del movimiento.</td></tr>
    <tr><td class="num">4</td><td>Nunca se anima el foco. El anillo aparece y desaparece de golpe.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Surte efecto <strong>al instante</strong>. Sin «Guardar».</td></tr>
    <tr><td class="num">2</td><td>La etiqueta va <strong>al lado y es pulsable</strong>. Un interruptor sin etiqueta no dice qué apaga.</td></tr>
    <tr><td class="num">3</td><td>La etiqueta nombra <strong>lo que se activa</strong>, no el estado: «Notificar por correo», no «Notificaciones activas».</td></tr>
    <tr><td class="num">4</td><td>Si guardar puede fallar, el interruptor <strong>vuelve atrás</strong> y avisa. Nunca se queda mostrando algo que no se guardó.</td></tr>
    <tr><td class="num">5</td><td>Nunca para acciones destructivas. Eso es un botón con confirmación.</td></tr>
    <tr><td class="num">6</td><td><code>role="switch"</code> con <code>aria-checked</code>. Con Espacio se activa.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Interruptor } from '@ae/sistema';

<Interruptor
  etiqueta="Notificar tardanzas por correo"
  ayuda="Se envía un resumen a las 09:00."
  valor={activo}
  onCambio={guardarYAplicar}
/>

<Interruptor etiqueta="Marcar desde el móvil" valor={x} deshabilitado />`
)}`;

// ── Elemento: Selección múltiple ────────────────────────────────────────────

const OPCIONES_ENCUESTA = [
  ['Puntualidad en el ingreso', true],
  ['Trato con los estudiantes', true],
  ['Cumplimiento del plan de clase', false],
  ['Uso de material didáctico', false],
  ['Registro de asistencia al día', false],
];

const pagMultiple = `
<p class="pag-intro">Elegir <strong>varias opciones de una lista</strong>. Es el control de las
encuestas y de las configuraciones por lote. Se distingue de la lista de un solo valor no por el
aspecto, sino por lo que permite: una o varias.</p>

<h3 class="sub-seccion">Qué control para qué caso</h3>
<table class="tabla-simple">
  <thead><tr><th>Se elige</th><th>Cuántas opciones</th><th>Control</th></tr></thead>
  <tbody>
    <tr><td rowspan="2"><strong>Varias</strong></td><td>Hasta 7</td><td>Casillas a la vista</td></tr>
    <tr><td>8 o más</td><td class="motivo">Selector múltiple con búsqueda</td></tr>
    <tr><td rowspan="2"><strong>Una sola</strong></td><td>Hasta 5</td><td>Botones de opción a la vista</td></tr>
    <tr><td>6 o más</td><td class="motivo">Selector</td></tr>
    <tr><td><strong>Sí o no, ya</strong></td><td>—</td><td class="motivo">Interruptor</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">A la vista se responde más rápido: no hay que abrir
nada y se compara de un vistazo. Escondidas en un desplegable solo compensa cuando no caben.</p>

<h3 class="sub-seccion">Casillas — varias respuestas</h3>
<div class="bloque">
  <fieldset class="ms-grupo">
    <legend class="ms-leyenda">Aspectos observados en la visita de aula</legend>
    <p class="ms-ayuda">Marca todos los que apliquen.</p>
    <label class="ms-op ms-todas"><input type="checkbox" data-ms-todas><span>Seleccionar todos</span></label>
    <div class="ms-lista" data-ms-lista>
      ${OPCIONES_ENCUESTA.map(
        ([t, on], i) => `<label class="ms-op"><input type="checkbox" data-ms${on ? ' checked' : ''}><span>${t}</span></label>`
      ).join('')}
    </div>
    <p class="ms-conteo" data-ms-conteo></p>
  </fieldset>
</div>

<h3 class="sub-seccion">Botones de opción — una sola respuesta</h3>
<div class="bloque">
  <fieldset class="ms-grupo">
    <legend class="ms-leyenda">Resultado de la visita</legend>
    <div class="ms-lista">
      <label class="ms-op"><input type="radio" name="res"><span>Satisfactorio</span></label>
      <label class="ms-op"><input type="radio" name="res" checked><span>Satisfactorio con observaciones</span></label>
      <label class="ms-op"><input type="radio" name="res"><span>Requiere acompañamiento</span></label>
      <label class="ms-op ms-desh"><input type="radio" name="res" disabled><span>No realizada</span><em>solo Dirección</em></label>
    </div>
  </fieldset>
</div>

<h3 class="sub-seccion">Estados</h3>
<div class="bloque">
  <div class="ms-estados">
    <label class="ms-op"><input type="checkbox"><span>Sin marcar</span></label>
    <label class="ms-op"><input type="checkbox" checked><span>Marcada</span></label>
    <label class="ms-op"><input type="checkbox" data-indet><span>Parcial</span></label>
    <label class="ms-op ms-desh"><input type="checkbox" disabled><span>Sin permiso</span></label>
    <label class="ms-op ms-desh"><input type="checkbox" checked disabled><span>Marcada y bloqueada</span></label>
    <label class="ms-op ms-mal"><input type="checkbox"><span>Con error</span></label>
  </div>
  <p class="cg-error" style="margin-top:12px">${ICO_ERROR}Elige al menos un aspecto.</p>
</div>
<p class="pag-intro" style="margin-top:12px">El estado <strong>parcial</strong> es el de
«Seleccionar todos» cuando hay algunas marcadas y otras no. No es un tercer valor: es un resumen
de las de abajo.</p>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Van dentro de <code>&lt;fieldset&gt;</code> con <code>&lt;legend&gt;</code>. Sin eso, el lector lee opciones sueltas sin saber de qué pregunta son.</td></tr>
    <tr><td class="num">2</td><td>La etiqueta <strong>completa</strong> es pulsable, no solo el cuadrito.</td></tr>
    <tr><td class="num">3</td><td>En vertical, una por línea. En horizontal se pierde qué texto va con qué casilla.</td></tr>
    <tr><td class="num">4</td><td>Casillas para varias, botones de opción para una. <strong>Nunca casillas donde solo cabe una respuesta.</strong></td></tr>
    <tr><td class="num">5</td><td>Un grupo de opción <strong>siempre tiene una marcada</strong>. Si «ninguna» es válida, es una opción más.</td></tr>
    <tr><td class="num">6</td><td>«Seleccionar todos» solo con 5 o más opciones.</td></tr>
    <tr><td class="num">7</td><td>El orden es el que la persona espera: alfabético, cronológico o de importancia. <strong>Nunca el orden de la base de datos.</strong></td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { SeleccionMultiple, GrupoOpcion } from '@ae/sistema';

<SeleccionMultiple
  leyenda="Aspectos observados en la visita de aula"
  ayuda="Marca todos los que apliquen."
  opciones={aspectos}
  valor={marcados}
  onCambio={setMarcados}
  seleccionarTodos
/>

<GrupoOpcion
  leyenda="Resultado de la visita"
  opciones={resultados}
  valor={resultado}
  onCambio={setResultado}
/>`
)}`;

// ── Elemento: Segmentado ────────────────────────────────────────────────────

// R69 · Dos o tres opciones excluyentes en una linea. El ejemplo va en CADA
// opcion y no solo en la elegida: si solo se viera bajo la activa, para saber
// que concede «parcial» habria que concederlo primero — cambiar un privilegio
// real de un cargo real para aprender que significa —. El ejemplo es la
// definicion, y una definicion se lee antes de elegir, no despues.
let nSg = 0;
const sg = (o = {}) => {
  const g = `sg-g-${++nSg}`;
  const ops = (o.opciones || []).map((op, i) => {
    if (op.cerrado) return `
      <span class="sg-op sg-op-cerrada">
        <span class="sg-candado">${icono('candado', 16)}</span>
        <span class="sg-txt">${op.texto}</span>
        <span class="sg-motivo">${op.cerrado}</span>
      </span>`;
    return `
      <label class="sg-op" for="${g}-${i}">
        <input id="${g}-${i}" class="sg-in" type="radio" name="${g}"${op.elegida ? ' checked' : ''}
               aria-labelledby="${g}-${i}-txt"${op.ejemplo ? ` aria-describedby="${g}-${i}-ej"` : ''}${o.desh ? " aria-disabled='true'" : ''}>
        <span class="sg-txt" id="${g}-${i}-txt">${op.texto}</span>
        ${op.ejemplo ? `<span class="sg-ej mono" id="${g}-${i}-ej">${op.ejemplo}</span>` : ''}
      </label>`;
  }).join('');

  if (o.cerrado) return `
  <div class="sg sg-cerrado">
    <span class="sg-et">${o.etiqueta}</span>
    <span class="sg-barra-cerrada">
      <span class="sg-candado">${icono('candado', 16)}</span>
      <span class="sg-motivo">${o.cerrado}</span>
    </span>
  </div>`;

  return `
  <fieldset class="sg${o.desh ? ' sg-desh' : ''}">
    <legend class="sg-et">${o.etiqueta}</legend>
    <div class="sg-barra">${ops}</div>
  </fieldset>`;
};

const pagSegmentado = `
<p class="pag-intro">Dos o tres opciones <strong>excluyentes</strong>, en una sola línea. Existe porque
hay datos que no se ven o no se ven: tienen un <strong>punto medio</strong>, y es el que hace útil el
sistema. Con el interruptor, de dos posiciones, ese punto medio no se puede expresar sin mentir.</p>

<h3 class="sub-seccion">La regla que lo gobierna</h3>
<p class="pag-intro">Cada dato sensible tiene una <strong>versión reducida que sirve para trabajar,
pero no para suplantar</strong>. Tres dígitos identifican a una persona en una lista y no permiten
reconstruir un documento. Una edad distingue y no sirve para verificar una identidad.</p>

<h3 class="sub-seccion">Los tres niveles, con su ejemplo</h3>
<div class="sw-rejilla">
  ${sg({ etiqueta: 'Documento', opciones: [
    { texto: 'Completo', ejemplo: '71602303' },
    { texto: 'Parcial', ejemplo: '*****303', elegida: true },
  ] })}
  ${sg({ etiqueta: 'Fecha de nacimiento', opciones: [
    { texto: 'Completa', ejemplo: '12/03/1992' },
    { texto: 'Parcial', ejemplo: '34 años', elegida: true },
    { texto: 'Oculta', ejemplo: '—' },
  ] })}
  ${sg({ etiqueta: 'Dirección', opciones: [
    { texto: 'Completa', ejemplo: 'Jr. Bolívar 340' },
    { texto: 'Oculta', ejemplo: '—', elegida: true },
  ] })}
</div>

<h3 class="sub-seccion">Dos o tres, y no siempre las mismas</h3>
<table class="tabla-simple">
  <thead><tr><th>Dato</th><th>Completo</th><th>Parcial</th><th>Oculto</th></tr></thead>
  <tbody>
    <tr><td><strong>Apellido materno</strong></td><td class="mono">SUÁREZ MENDOZA</td><td class="mono">SUÁREZ M.</td><td class="motivo">No aplica: hay que poder identificar</td></tr>
    <tr><td><strong>Documento</strong></td><td class="mono">71602303</td><td class="mono">*****303</td><td class="motivo">No aplica: sin él, dos personas con el mismo apellido son indistinguibles</td></tr>
    <tr><td><strong>Fecha de nacimiento</strong></td><td class="mono">12/03/1992</td><td class="mono">34 años</td><td>Sí</td></tr>
    <tr><td><strong>Correo o celular personal</strong></td><td>Completo</td><td>Parcial</td><td>Sí</td></tr>
    <tr><td><strong>Dirección</strong></td><td>Completa</td><td class="motivo">No aplica: media dirección ya dice el barrio</td><td>Sí</td></tr>
  </tbody>
</table>
<p class="pag-intro">Un nivel que <strong>no aplica no se pasa</strong>. Un nivel que aplica pero
<strong>no se puede conceder</strong> se pasa cerrado, que es otra cosa.</p>

<h3 class="sub-seccion">Cerrado por regla — por nivel y por control</h3>
<p class="pag-intro">Quien reparte privilegios <strong>no puede conceder uno que lo iguale a él
mismo</strong>. Eso casi nunca cierra el campo entero: cierra <strong>un nivel</strong>.</p>
<div class="sw-rejilla">
  ${sg({ etiqueta: 'Documento', opciones: [
    { texto: 'Completo', cerrado: 'Tú lo ves en parcial' },
    { texto: 'Parcial', ejemplo: '*****303', elegida: true },
    { texto: 'Oculto', ejemplo: '—' },
  ] })}
  ${sg({ etiqueta: 'Privilegios', cerrado: 'No puedes conceder el reparto de privilegios' })}
</div>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>El nivel cerrado <strong>no desaparece</strong>. Desaparecido, quien reparte no entiende por qué su lista no coincide con la de al lado, y lo lee como una carga a medias.</td></tr>
    <tr><td class="num">2</td><td><strong>No se pinta apagado.</strong> Apagado se lee «ahora no, vuelve luego» e invita a buscar la forma de encenderlo. Aquí el mensaje es el contrario.</td></tr>
    <tr><td class="num">3</td><td>Va <strong>con su motivo</strong>. Un candado sin explicación se lee como un fallo del sistema.</td></tr>
    <tr><td class="num">4</td><td>Deja de ser un control: no es un botón de opción desactivado, es <strong>texto</strong>. Un control que no puede cambiar nunca no es un control.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Deshabilitado — que es otra cosa</h3>
<div class="sw-rejilla">
  ${sg({ etiqueta: 'Celular personal', desh: true, opciones: [
    { texto: 'Completo', ejemplo: '987 654 321' },
    { texto: 'Parcial', ejemplo: '*** *** 321', elegida: true },
    { texto: 'Oculto', ejemplo: '—' },
  ] })}
</div>
<p class="pag-intro">Temporal: «ahora no». Para lo permanente está <strong>cerrado</strong>.</p>

<h3 class="sub-seccion">Por qué no es Selección múltiple con una sola respuesta</h3>
<table class="tabla-simple">
  <thead><tr><th></th><th>Segmentado</th><th>Selección múltiple, modo única</th></tr></thead>
  <tbody>
    <tr><td><strong>Qué ocupa</strong></td><td>Ancho: una línea</td><td class="motivo">Alto: una fila por opción</td></tr>
    <tr><td><strong>Repetido diez veces</strong></td><td>Diez líneas</td><td class="motivo">Treinta filas</td></tr>
    <tr><td><strong>Para qué sirve</strong></td><td>Configurar una tabla de campos</td><td class="motivo">Elegir una vez, leyendo de arriba abajo</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Dos o tres opciones.</strong> Más de tres no cabe a 390&nbsp;px y deja de ser un segmentado.</td></tr>
    <tr><td class="num">2</td><td>El <strong>ejemplo va en cada opción</strong>, no solo en la elegida. Si no, para saber qué concede «parcial» hay que concederlo primero.</td></tr>
    <tr><td class="num">3</td><td>Botones de opción <strong>nativos</strong> dentro de un <code>fieldset</code>. Es lo que da las flechas del teclado y el foco itinerante sin escribirlos.</td></tr>
    <tr><td class="num">4</td><td>El botón de opción se <strong>tapa, no se quita</strong>. Con <code>display:none</code> se van las flechas, y un grupo de diez se vuelve treinta tabulaciones.</td></tr>
    <tr><td class="num">5</td><td>Los segmentos <strong>reparten el ancho a partes iguales</strong> pase lo que pase dentro. Un ejemplo largo no empuja: se recorta.</td></tr>
    <tr><td class="num">6</td><td>Con lector de pantalla, <code>contexto</code> antepone el grupo al rótulo. «Documento, parcial» no dice de qué grupo.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Segmentado } from '@ae/sistema';

<Segmentado
  etiqueta="Documento"
  contexto="Trabajadores"
  valor={nivel}
  onCambio={guardarYAplicar}
  opciones={[
    { valor: 'completo', texto: 'Completo', ejemplo: '71602303',
      cerrado: 'Tú lo ves en parcial' },
    { valor: 'parcial',  texto: 'Parcial',  ejemplo: '*****303' },
  ]}
/>

<Segmentado
  etiqueta="Privilegios"
  cerrado="No puedes conceder el reparto de privilegios"
  opciones={[]} valor="" onCambio={() => {}}
/>`
)}`;

// ── Elemento: Fecha ─────────────────────────────────────────────────────────

const pagFecha = `
<p class="pag-intro">Fecha suelta y rango de fechas. En el sistema casi siempre es
<strong>rango</strong>: la asistencia, los pagos y los reportes se consultan por periodo, no por
día.</p>

<h3 class="sub-seccion">Formato</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td><strong>Se muestra</strong></td><td class="mono">31/03/2026</td><td class="motivo">Formato peruano, día primero. Nunca el americano</td></tr>
    <tr><td><strong>Se escribe</strong></td><td class="mono">31/03/2026 · 31-03-2026 · 31032026</td><td class="motivo">Se acepta con barras, guiones o sin nada. <strong>Limpiar no es rechazar</strong></td></tr>
    <tr><td><strong>Se guarda</strong></td><td class="mono">2026-03-31</td><td class="motivo">ISO, siempre. El formato es cosa de la pantalla</td></tr>
    <tr><td><strong>En una tabla</strong></td><td class="mono">31/03/2026</td><td class="motivo">En mono y alineada a la derecha, para comparar por columna</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Fecha suelta</h3>
<div class="bloque">
  <div class="campos-rejilla">
    <label class="cg"><span class="cg-et">Fecha de ingreso</span>
      <input type="date" class="campo cg-in" value="2026-03-01">
      <span class="cg-ayuda">Se muestra como 01/03/2026.</span></label>
    <label class="cg"><span class="cg-et">Con error</span>
      <input type="date" class="campo cg-in cg-mal" value="2027-01-01">
      <span class="cg-error">${ICO_ERROR}No puede ser posterior a hoy.</span></label>
    <label class="cg"><span class="cg-et">Sin permiso</span>
      <input type="date" class="campo cg-in" value="2026-03-01" disabled>
      <span class="cg-ayuda">Solo Dirección puede cambiarla.</span></label>
  </div>
</div>

<h3 class="sub-seccion">Rango con calendario — pruébalo</h3>
<p class="seccion-sub">Primer clic marca el inicio, segundo marca el fin, y el tramo entre ambos queda sombreado. Al pasar el cursor se previsualiza el tramo antes de fijarlo.</p>
<div class="bloque">
  <div class="fc-zona" id="fc-zona">
    <div class="fc-campos">
      <label class="cg"><span class="cg-et">Desde</span>
        <input class="campo cg-in mono fc-campo" id="fc-ini" placeholder="dd/mm/aaaa"
               readonly aria-haspopup="dialog" aria-expanded="false" aria-controls="fc-cal"></label>
      <span class="fc-guion" aria-hidden="true">${ICO_CHEV_DER}</span>
      <label class="cg"><span class="cg-et">Hasta</span>
        <input class="campo cg-in mono fc-campo" id="fc-fin" placeholder="dd/mm/aaaa"
               readonly aria-haspopup="dialog" aria-expanded="false" aria-controls="fc-cal"></label>
      <button class="btn btn-neutro" id="fc-limpiar">Limpiar</button>
    </div>

    <div class="fc-cal" id="fc-cal" role="dialog" aria-label="Elegir rango de fechas" hidden>
      <div class="fc-cal-cab">
        <button class="pgn-btn" id="fc-prev" aria-label="Mes anterior">${ICO_CHEV_IZQ}</button>
        <span class="fc-meses" id="fc-titulo"></span>
        <button class="pgn-btn" id="fc-next" aria-label="Mes siguiente">${ICO_CHEV_DER}</button>
      </div>
      <div class="fc-cal-marco">
        <div class="fc-cal-cuerpo" id="fc-cuerpo"></div>
        <div class="fc-atajos">
          <span class="fc-atajos-tit">Periodos</span>
          <button class="fc-atajo" data-fc="mes">Este mes</button>
          <button class="fc-atajo" data-fc="mes-pasado">Mes pasado</button>
          <button class="fc-atajo" data-fc="bimestre">Últimos 2 meses</button>
          <button class="fc-atajo" data-fc="anio">Este año</button>
        </div>
      </div>
      <div class="fc-cal-pie"><span id="fc-pista">Elige la fecha de inicio.</span></div>
    </div>
  </div>

  <p class="fc-resumen" id="fc-resumen">Sin rango elegido.</p>
</div>
<table class="tabla-simple" style="margin-top:16px">
  <thead><tr><th>Detalle</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>Dos meses a la vez</strong></td><td class="motivo">La mayoría de rangos cruzan de mes. Con uno solo hay que navegar a media selección y se pierde el hilo</td></tr>
    <tr><td><strong>Previsualización al pasar el cursor</strong></td><td class="motivo">Se ve el tramo antes de fijarlo, así se corrige sin tener que empezar de nuevo</td></tr>
    <tr><td><strong>Segundo clic anterior al primero</strong></td><td class="motivo">No se rechaza: se toma como nuevo inicio. Quien lo hizo quería mover el periodo, no equivocarse</td></tr>
    <tr><td><strong>Extremos e interior se distinguen</strong></td><td class="motivo">Los extremos van rellenos con <code>accion</code>; el interior en <code>fondo-fila-hover</code>. Si se pintan igual no se sabe dónde empieza</td></tr>
    <tr><td><strong>Los campos son de solo lectura</strong></td><td class="motivo">El calendario es la fuente. Tecleado y calendario a la vez se desincronizan</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Las cuatro reglas del rango</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>«Hasta» no puede ser anterior a «Desde».</strong> Si se elige una fecha menor, se ajusta «Desde» en vez de rechazar: quien lo hizo probablemente quería mover el periodo entero.</td></tr>
    <tr><td class="num">2</td><td>Siempre <strong>se muestra cuántos días</strong> abarca. «Del 1 al 31 de marzo» no dice si son 30 o 31.</td></tr>
    <tr><td class="num">3</td><td><strong>Atajos para lo que se pide siempre:</strong> este mes, mes pasado, este año. Ahorra dos calendarios cada vez.</td></tr>
    <tr><td class="num">4</td><td>Un rango sin fin es válido si el periodo sigue abierto. Se dice: «Desde el 01/03/2026, en curso».</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Formato peruano al mostrar, ISO al guardar.</td></tr>
    <tr><td class="num">2</td><td>Se acepta escribir con barras, guiones o seguido. Se limpia al guardar.</td></tr>
    <tr><td class="num">3</td><td>El calendario es <strong>ayuda, no obligación</strong>: siempre se puede teclear.</td></tr>
    <tr><td class="num">4</td><td>Las fechas fuera de lo posible se avisan, no se bloquean, salvo que el sistema lo sepa con certeza (una fecha de ingreso futura sí es un error cierto).</td></tr>
    <tr><td class="num">5</td><td>En tablas, mono y a la derecha.</td></tr>
    <tr><td class="num">6</td><td>Nunca «dd/mm/aaaa» como etiqueta. Eso es la pista; la etiqueta dice <strong>qué fecha es</strong>.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { CampoFecha, RangoFechas } from '@ae/sistema';

<CampoFecha etiqueta="Fecha de ingreso" maximo="hoy" />

<RangoFechas
  etiquetaInicio="Desde"
  etiquetaFin="Hasta"
  valor={rango}
  onCambio={setRango}
  atajos={['mes', 'mes-pasado', 'anio']}
  permitirAbierto            // «en curso», sin fecha de fin
/>`
)}`;

// ── Elemento: Barra de progreso ─────────────────────────────────────────────

const pagProgreso = `
<p class="pag-intro">Muestra <strong>cuánto lleva y cuánto queda</strong> de algo que avanza. Si
no se sabe cuánto queda, no es una barra de progreso: es un
<a href="#estados" data-ir="estados" class="enlace">estado de carga</a>.</p>

<h3 class="sub-seccion">Determinada o indeterminada</h3>
<table class="tabla-simple">
  <thead><tr><th></th><th>Cuándo</th><th>Qué muestra</th></tr></thead>
  <tbody>
    <tr><td><strong>Determinada</strong></td><td>Se conoce el total: 40 de 120 filas importadas</td><td class="motivo">El porcentaje y las cifras reales</td></tr>
    <tr><td><strong>Indeterminada</strong></td><td>No se conoce el total pero sí que está trabajando</td><td class="motivo">Movimiento, sin cifras. <strong>Solo si no hay alternativa</strong></td></tr>
    <tr><td><strong>Ninguna</strong></td><td>La forma de lo que viene sí se conoce</td><td class="motivo">Esqueleto, que además reserva el sitio</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Variantes</h3>
<div class="bloque">
  <div class="pr-rejilla">
    <div class="pr-caja">
      <div class="pr-cab"><span>Importando trabajadores</span><span class="mono">62 %</span></div>
      <div class="pr" role="progressbar" aria-valuenow="62" aria-valuemin="0" aria-valuemax="100" aria-label="Importando trabajadores"><div class="pr-relleno" style="width:62%"></div></div>
      <span class="pr-pie">74 de 120 filas</span>
    </div>
    <div class="pr-caja">
      <div class="pr-cab"><span>Completado</span><span class="mono">100 %</span></div>
      <div class="pr" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" aria-label="Completado"><div class="pr-relleno pr-exito" style="width:100%"></div></div>
      <span class="pr-pie">120 de 120 filas</span>
    </div>
    <div class="pr-caja">
      <div class="pr-cab"><span>Se detuvo</span><span class="mono">38 %</span></div>
      <div class="pr" role="progressbar" aria-valuenow="38" aria-valuemin="0" aria-valuemax="100" aria-label="Se detuvo"><div class="pr-relleno pr-error" style="width:38%"></div></div>
      <span class="pr-pie pr-pie-error">Fila 46: el DNI 7123 no tiene 8 dígitos</span>
    </div>
    <div class="pr-caja">
      <div class="pr-cab"><span>Trabajando</span></div>
      <div class="pr" role="progressbar" aria-label="Trabajando"><div class="pr-indet"></div></div>
      <span class="pr-pie">Sin total conocido</span>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Pruébalo</h3>
<div class="bloque">
  <div class="pr-caja" style="max-width:420px">
    <div class="pr-cab"><span>Importando asistencia</span><span class="mono" id="pr-pct">0 %</span></div>
    <div class="pr" id="pr-barra" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Importando asistencia"><div class="pr-relleno" id="pr-relleno" style="width:0%"></div></div>
    <span class="pr-pie" id="pr-pie">0 de 120 filas</span>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn btn-1 btn-mini" id="pr-ir">Importar</button>
      <button class="btn btn-neutro btn-mini" id="pr-reset">Reiniciar</button>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Progreso por pasos</h3>
<div class="bloque">
  <ol class="pr-pasos">
    <li class="pr-paso pr-hecho"><span class="pr-punto">${ICO_CHECK}</span><div><b>Archivo recibido</b><span>120 filas</span></div></li>
    <li class="pr-paso pr-hecho"><span class="pr-punto">${ICO_CHECK}</span><div><b>Formato validado</b><span>Sin errores</span></div></li>
    <li class="pr-paso pr-curso"><span class="pr-punto">3</span><div><b>Comprobando DNI</b><span>74 de 120</span></div></li>
    <li class="pr-paso"><span class="pr-punto">4</span><div><b>Guardando</b><span>Pendiente</span></div></li>
  </ol>
</div>
<p class="pag-intro" style="margin-top:12px">Los pasos sirven cuando el proceso tiene
<strong>fases con nombre</strong> y la persona necesita saber en cuál va. Con menos de tres pasos
no aportan nada sobre una barra.</p>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Si no se conoce el total, <strong>no es una barra de progreso</strong>. Usa esqueleto.</td></tr>
    <tr><td class="num">2</td><td>Junto al porcentaje van <strong>las cifras reales</strong>: «74 de 120». El 62 % solo no dice si son minutos o segundos.</td></tr>
    <tr><td class="num">3</td><td>La barra <strong>nunca retrocede</strong>. Si el total cambia, se recalcula sin bajar.</td></tr>
    <tr><td class="num">4</td><td>Al fallar, la barra <strong>se queda donde estaba</strong> y en rojo, con el motivo. Vaciarla borra la única pista de dónde ocurrió.</td></tr>
    <tr><td class="num">5</td><td><code>role="progressbar"</code> con <code>aria-valuenow</code>, <code>min</code> y <code>max</code>. La indeterminada va sin <code>valuenow</code>.</td></tr>
    <tr><td class="num">6</td><td>Con <code>prefers-reduced-motion</code>, la indeterminada <strong>deja de moverse</strong> y se apoya en el texto.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { Progreso, ProgresoPasos } from '@ae/sistema';

<Progreso
  etiqueta="Importando trabajadores"
  valor={74}
  total={120}
  unidad="filas"
/>

<Progreso etiqueta="Trabajando" indeterminada />

<Progreso etiqueta="Se detuvo" valor={46} total={120}
  error="Fila 46: el DNI 7123 no tiene 8 dígitos" />

<ProgresoPasos pasos={pasos} actual={3} />`
)}`;

// ── Elemento: Aviso temporal ────────────────────────────────────────────────

const pagAviso = `
<p class="pag-intro">Confirma que <strong>algo pasó</strong> y se va solo. No interrumpe, no pide
nada y no tapa el contenido. Si hace falta que la persona lea y decida, no es un aviso temporal:
es un diálogo.</p>

<h3 class="sub-seccion">Pruébalo</h3>
<div class="bloque">
  <div class="av-botones">
    <button class="btn btn-1" data-av="exito">Guardar</button>
    <button class="btn btn-2" data-av="info">Exportar</button>
    <button class="btn btn-neutro" data-av="aviso">Enviar con faltas</button>
    <button class="btn btn-destr" data-av="error">Eliminar</button>
    <button class="btn btn-terc" data-av="deshacer">Archivar (con deshacer)</button>
  </div>
</div>

<h3 class="sub-seccion">Los cuatro tonos y su duración</h3>
<table class="tabla-simple">
  <thead><tr><th>Tono</th><th>Cuándo</th><th class="num">Dura</th><th>Por qué esa duración</th></tr></thead>
  <tbody>
    <tr><td><span class="chip chip-exito">Éxito</span></td><td>Se hizo lo que se pidió</td><td class="num">4 s</td><td class="motivo">Solo confirma. Leerlo cuesta un segundo</td></tr>
    <tr><td><span class="chip chip-info">Información</span></td><td>Algo ocurrió que conviene saber</td><td class="num">5 s</td><td class="motivo">Suele traer un dato que hay que retener</td></tr>
    <tr><td><span class="chip chip-aviso">Aviso</span></td><td>Se hizo, pero con salvedades</td><td class="num">7 s</td><td class="motivo">Hay algo que releer antes de seguir</td></tr>
    <tr><td><span class="chip chip-error">Error</span></td><td>No se pudo hacer</td><td class="num">No se va</td><td class="motivo"><strong>Un error que desaparece solo es un error que nadie leyó.</strong> Se cierra a mano</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Con deshacer, el reloj cambia</h3>
<div class="aviso">
  Un aviso con <strong>Deshacer</strong> dura <strong>10 segundos</strong>, no 4. Ese botón es la
  única ventana para arreglar un error, y cuatro segundos no bastan para leer, entender y decidir.
  <br><br>
  Y mientras el cursor esté encima o el foco dentro, <strong>el reloj se detiene</strong>. Si se va
  justo cuando alguien iba a pulsarlo, el botón nunca sirvió de nada.
</div>

<h3 class="sub-seccion">Aviso temporal, aviso fijo o diálogo</h3>
<table class="tabla-simple">
  <thead><tr><th></th><th>Aviso temporal</th><th>Aviso fijo en la página</th><th>Diálogo</th></tr></thead>
  <tbody>
    <tr><td><strong>Interrumpe</strong></td><td>No</td><td class="motivo">No</td><td class="motivo">Sí</td></tr>
    <tr><td><strong>Se va solo</strong></td><td>Sí</td><td class="motivo">No</td><td class="motivo">No</td></tr>
    <tr><td><strong>Para qué</strong></td><td>Confirmar lo ya hecho</td><td class="motivo">Una condición que sigue vigente: «El periodo se cierra el 31»</td><td class="motivo">Pedir una decisión antes de continuar</td></tr>
    <tr><td><strong>Ejemplo</strong></td><td>«Se guardó»</td><td class="motivo">«Hay 3 tardanzas sin justificar»</td><td class="motivo">«¿Eliminar 24 registros?»</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Dónde y cómo aparece</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Arriba a la derecha</strong>, bajo la barra superior. Es donde la vista vuelve tras pulsar, y no tapa el contenido que se acaba de tocar.</td></tr>
    <tr><td class="num">2</td><td>En móvil, <strong>arriba y a ancho completo</strong> menos los márgenes. Abajo compite con el botón flotante y con el teclado.</td></tr>
    <tr><td class="num">3</td><td>Entra deslizando <strong>16px desde arriba</strong> —de donde viene— en 220 ms y sale igual. Un aviso que aparece de golpe se percibe como un fallo de pintado.</td></tr>
    <tr><td class="num">4</td><td>Se apilan, <strong>máximo tres</strong>. El cuarto expulsa al más antiguo: cuatro avisos a la vez ya no se leen.</td></tr>
    <tr><td class="num">5</td><td>Con <code>prefers-reduced-motion</code> aparece sin deslizar, solo con fundido.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Accesibilidad</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>La zona es <code>aria-live="polite"</code>. El lector lo anuncia al terminar la frase en curso, sin cortar.</td></tr>
    <tr><td class="num">2</td><td>El error es <code>aria-live="assertive"</code> con <code>role="alert"</code>: interrumpe, porque algo no se hizo.</td></tr>
    <tr><td class="num">3</td><td>El aviso <strong>no roba el foco</strong>. Robarlo saca a la persona de donde estaba escribiendo.</td></tr>
    <tr><td class="num">4</td><td>Si trae acción, es alcanzable con Tab y el reloj se detiene al enfocarla.</td></tr>
    <tr><td class="num">5</td><td>Todo aviso se puede cerrar a mano. El temporizador es una comodidad, no la única salida.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">El texto</h3>
<table class="tabla-simple">
  <thead><tr><th>✗</th><th>✓</th></tr></thead>
  <tbody>
    <tr><td>«Operación exitosa»</td><td>«Se guardó la asistencia de marzo»</td></tr>
    <tr><td>«Registro eliminado»</td><td>«Se eliminaron 24 registros» <em>+ Deshacer</em></td></tr>
    <tr><td>«Error al guardar»</td><td>«No se guardó: falta el DNI de 2 trabajadores»</td></tr>
    <tr><td>«¡Listo!»</td><td>«Se exportaron 38 filas a CSV»</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">Una línea. El aviso <strong>dice qué pasó y con qué
dato</strong>; el detalle vive en la pantalla, no en algo que se va en cuatro segundos.</p>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Solo para <strong>lo ya hecho</strong>. Si hay que decidir, es un diálogo.</td></tr>
    <tr><td class="num">2</td><td><strong>Los errores no se van solos.</strong></td></tr>
    <tr><td class="num">3</td><td>Con Deshacer, 10 segundos y el reloj se detiene al pasar por encima.</td></tr>
    <tr><td class="num">4</td><td>Una línea, con el dato concreto.</td></tr>
    <tr><td class="num">5</td><td>Máximo tres a la vez.</td></tr>
    <tr><td class="num">6</td><td>Nunca roba el foco.</td></tr>
    <tr><td class="num">7</td><td>Nunca para información permanente: eso va en la pantalla.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { avisar } from '@ae/sistema';

avisar.exito('Se guardó la asistencia de marzo');
avisar.info('Se exportaron 38 filas a CSV');
avisar.aviso('Se envió con 3 faltas sin justificar');

// El error no se va solo
avisar.error('No se guardó: falta el DNI de 2 trabajadores');

// Con deshacer: 10 s y el reloj se detiene al pasar por encima
avisar.exito('Se archivaron 12 expedientes', {
  accion: { texto: 'Deshacer', al: restaurar },
});`
)}`;

// ── Elemento: Confirmación en línea ─────────────────────────────────────────

const pagConfirmar = `
<p class="pag-intro">Cuando algo hay que confirmar, <strong>no se abre una ventana encima</strong>:
aparece una banda arriba del contenido y lo empuja hacia abajo. Al confirmar o cancelar, la banda
se pliega y el contenido vuelve a subir.</p>

<h3 class="sub-seccion">Por qué no un diálogo encima</h3>
<table class="tabla-simple">
  <thead><tr><th>Problema del diálogo modal</th><th>Qué pasa en móvil</th></tr></thead>
  <tbody>
    <tr><td>Tapa la pantalla entera</td><td class="motivo">Se pierde de vista <strong>qué</strong> se estaba a punto de borrar</td></tr>
    <tr><td>Se cierra al tocar fuera</td><td class="motivo">Un roce con el pulgar lo descarta sin querer</td></tr>
    <tr><td>Pelea con el teclado</td><td class="motivo">Si trae un campo, el teclado lo parte por la mitad</td></tr>
    <tr><td>Rompe el botón «atrás»</td><td class="motivo">Atrás sale de la pantalla en vez de cerrar el diálogo</td></tr>
    <tr><td>Hay que atrapar el foco dentro</td><td class="motivo">Se hace mal casi siempre, y con lector de pantalla se sale del diálogo</td></tr>
  </tbody>
</table>
<p class="pag-intro" style="margin-top:12px">La banda no tiene ninguno de esos problemas:
<strong>vive en el flujo de la página</strong>. Se desplaza con ella, el teclado no la parte, y
«atrás» sigue siendo «atrás».</p>

<h3 class="sub-seccion">Pruébalo</h3>
<div class="bloque">
  <div class="cf-demo">
    <div class="cf-banda" id="cf-banda" hidden>
      <div class="cf-banda-in">
        <div class="cf-caja">
          <div class="cf-txt">
            <strong id="cf-titulo">Eliminar el registro</strong>
            <span id="cf-linea">No se puede deshacer.</span>
          </div>
          <div class="cf-acciones">
            <button class="btn btn-terc" id="cf-cancelar">Cancelar</button>
            <button class="btn btn-destr" id="cf-ok">Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="cf-lista" id="cf-lista"></div>
  </div>
</div>

<h3 class="sub-seccion">Anatomía</h3>
<div class="bloque">
  <ol class="anat-lista">
    <li><b>Aparece arriba del contenido</b>, no encima. El contenido baja; nada se tapa.</li>
    <li><b>Título</b> — nombra <strong>qué</strong> y <strong>cuánto</strong>: «Eliminar 24 registros de asistencia».</li>
    <li><b>Una línea</b> — qué se pierde. «No se puede deshacer» cuando es cierto.</li>
    <li><b>Acciones a la derecha</b> — Cancelar en terciaria, la acción en su variante. La acción va a la derecha, siempre igual.</li>
    <li><b>Filete izquierdo</b> — en <code>error-acento</code> si es destructiva, en <code>aviso-acento</code> si no.</li>
  </ol>
</div>

<h3 class="sub-seccion">La transición</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>La banda abre con <code>grid-template-rows</code> de <code>0fr</code> a <code>1fr</code> en <strong>240 ms</strong>. Es lo único que anima hasta altura automática sin fijar píxeles.</td></tr>
    <tr><td class="num">2</td><td>El contenido <strong>no se anima aparte</strong>: baja porque la banda ocupa sitio. Animar los dos por separado los descompasa.</td></tr>
    <tr><td class="num">3</td><td>Al cerrarse, el contenido sube con la misma curva. Entrada y salida <strong>simétricas</strong>.</td></tr>
    <tr><td class="num">4</td><td>Con <code>prefers-reduced-motion</code>, aparece y desaparece sin transición.</td></tr>
    <tr><td class="num">5</td><td>La fila afectada <strong>se marca mientras la banda está abierta</strong>. Sin eso, con veinte filas no se sabe cuál se va a borrar.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Accesibilidad</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>La banda es <code>role="region"</code> con <code>aria-live="assertive"</code>: se anuncia al aparecer sin necesidad de atrapar el foco.</td></tr>
    <tr><td class="num">2</td><td>El foco <strong>va a la banda</strong> al abrirse. Es una decisión que hay que tomar; dejar el foco atrás obliga a buscarla.</td></tr>
    <tr><td class="num">3</td><td><strong>Escape cancela</strong> y devuelve el foco al botón que la abrió.</td></tr>
    <tr><td class="num">4</td><td>No se atrapa el foco. Se puede salir con Tab, y eso está bien: no es modal.</td></tr>
    <tr><td class="num">5</td><td>El botón dice el <strong>verbo</strong>: <em>Eliminar</em>, no <em>Aceptar</em>.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Cuándo sí y cuándo no</h3>
<table class="tabla-simple">
  <thead><tr><th>Situación</th><th>Qué se usa</th></tr></thead>
  <tbody>
    <tr><td>Confirmar algo <strong>irreversible</strong></td><td>Banda de confirmación</td></tr>
    <tr><td>Algo reversible</td><td class="motivo"><strong>Nada.</strong> Se hace y se ofrece <a href="#aviso" data-ir="aviso" class="enlace">Deshacer</a> en el aviso</td></tr>
    <tr><td>Un formulario de varios campos</td><td class="motivo">Otra pantalla o un panel lateral, no una banda</td></tr>
    <tr><td>Elegir de una lista larga</td><td class="motivo"><a href="#selector" data-ir="selector" class="enlace">Selector con búsqueda</a></td></tr>
    <tr><td>Avisar de algo ya hecho</td><td class="motivo"><a href="#aviso" data-ir="aviso" class="enlace">Aviso temporal</a></td></tr>
  </tbody>
</table>
<div class="aviso">
  <strong>Confirmar lo reversible entrena a aceptar sin leer</strong>, y entonces la confirmación
  que sí importaba tampoco se lee. Si la acción se puede deshacer, no se pregunta: se hace y se
  ofrece Deshacer.
</div>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Nunca un diálogo encima.</strong> La banda empuja, no tapa.</td></tr>
    <tr><td class="num">2</td><td>Solo para lo irreversible. Lo reversible se hace y se ofrece Deshacer.</td></tr>
    <tr><td class="num">3</td><td>Di <strong>qué</strong> y <strong>cuánto</strong> se pierde, con la cifra.</td></tr>
    <tr><td class="num">4</td><td>Una línea. Alargar el texto reduce la protección, no la aumenta.</td></tr>
    <tr><td class="num">5</td><td>La acción a la derecha, Cancelar a su izquierda. Siempre igual.</td></tr>
    <tr><td class="num">6</td><td>Marca la fila afectada mientras la banda está abierta.</td></tr>
    <tr><td class="num">7</td><td>Al confirmar, la banda se cierra y sale un <strong>aviso temporal</strong> con el resultado.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Código</h3>
${verCodigo(
  'Uso del componente',
  `import { useConfirmar } from '@ae/sistema';

const confirmar = useConfirmar();

async function eliminar(fila) {
  const ok = await confirmar({
    titulo: \`Eliminar \${fila.nombre}\`,
    linea: 'No se puede deshacer.',
    accion: 'Eliminar',
    tono: 'destructivo',      // destructivo · aviso
    marcar: fila.id,          // resalta la fila mientras se decide
  });
  if (!ok) return;
  await api.eliminar(fila.id);
  avisar.exito(\`Se eliminó \${fila.nombre}\`);
}`
)}`;

// ── Elementos aún no construidos ────────────────────────────────────────────

const pendiente = (nombre) => `
<div class="pendiente">
  <div class="pendiente-ic">${ICONOS.configuracion}</div>
  <h3>${nombre}</h3>
  <p>Sin construir.</p>
</div>`;

// ── Manual en Markdown → HTML ───────────────────────────────────────────────
// Conversor mínimo. Cubre solo lo que el manual usa: encabezados, tablas,
// listas, negrita, cursiva, código, enlaces y citas. No es un parser general.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const enLinea = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="enlace">$1</a>');

const md = (texto) => {
  const out = [];
  const lineas = texto.split('\n');
  let i = 0;
  while (i < lineas.length) {
    const l = lineas[i];

    // Tabla
    if (/^\|/.test(l) && /^\|[\s:|-]+\|$/.test(lineas[i + 1] || '')) {
      const cabs = l.split('|').slice(1, -1).map((c) => c.trim());
      i += 2;
      const filas = [];
      while (i < lineas.length && /^\|/.test(lineas[i])) {
        filas.push(lineas[i].split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      out.push(
        `<table class="tabla-simple tabla-manual"><thead><tr>${cabs.map((c) => `<th>${enLinea(c)}</th>`).join('')}</tr></thead>` +
          `<tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${enLinea(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      );
      continue;
    }

    // Encabezados
    const h = l.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const n = h[1].length;
      out.push(`<h${n} class="man-h${n}">${enLinea(h[2])}</h${n}>`);
      i++;
      continue;
    }

    // Cita
    if (/^>\s/.test(l)) {
      const cita = [];
      while (i < lineas.length && /^>/.test(lineas[i])) {
        cita.push(lineas[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote class="man-cita">${enLinea(cita.join(' '))}</blockquote>`);
      continue;
    }

    // Lista
    if (/^[-*]\s/.test(l)) {
      const items = [];
      while (i < lineas.length && /^[-*]\s/.test(lineas[i])) {
        items.push(lineas[i].replace(/^[-*]\s/, ''));
        i++;
      }
      out.push(`<ul class="man-lista">${items.map((t) => `<li>${enLinea(t)}</li>`).join('')}</ul>`);
      continue;
    }

    // Separador
    if (/^---+$/.test(l)) { out.push('<hr class="man-hr">'); i++; continue; }

    // Párrafo
    if (l.trim()) {
      const p = [];
      while (i < lineas.length && lineas[i].trim() && !/^[#>|-]/.test(lineas[i])) {
        p.push(lineas[i]);
        i++;
      }
      if (p.length) { out.push(`<p class="man-p">${enLinea(p.join(' '))}</p>`); continue; }
    }
    i++;
  }
  return out.join('\n');
};

// El manual se parte por sus secciones `## N · Título`
const manualCrudo = readFileSync(join(RAIZ, 'manual', 'MANUAL-APLICACIONES-WEB.md'), 'utf8');
const trozos = manualCrudo.split(/\n(?=## )/).filter((t) => t.startsWith('## '));
const seccionesManual = trozos.map((t) => {
  const titulo = t.split('\n')[0].replace(/^##\s+/, '');
  const limpio = titulo.replace(/^\d+\s*·\s*/, '');
  const id = 'man-' + limpio.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34);
  return { id, t: limpio, cuerpo: md(t.split('\n').slice(1).join('\n')) };
});

// ── Jerarquía del catálogo ──────────────────────────────────────────────────

const pagColor = `
<p class="pag-intro">${Object.keys(semanticos).length} tokens semánticos sobre ${Object.keys(primitivas).length} rampas y ${Object.keys(categoricas).length} familias categóricas.
Es lo único que un componente consume. <strong>Las primitivas están prohibidas dentro de un componente.</strong></p>
${Object.entries(GRUPOS).map(grupoMuestras).join('')}
<h3 class="sub-seccion">Colores autorizados</h3>
<p class="seccion-sub">Los de este panel y ninguno más. Un color que no esté aquí no vive en el sistema:
no tiene nombre, no se puede volver a encontrar y el candado no lo protege.
Son <strong>${autorizados.length} valores</strong> en ${Object.keys(primitivas).length} rampas y 1 familia categórica,
y <code>verificar-color.mjs</code> falla el build si aparece uno fuera de la lista.
Los ${restringidos.length} de <strong>marca</strong> no están aquí: el sistema los conoce para poder vigilarlos, no para usarlos.</p>
<p class="seccion-sub">Un solo deletreo en los tres sitios: el escalón se llama <code>ambar_900</code>,
la variable es <code>--ambar_900</code> y la clase <code>.color-ambar_900</code>. La misma cadena, sin traducir nada.
Autorizado no es lo mismo que libre: en un componente se usan los <strong>tokens semánticos</strong> de arriba,
que son los que están medidos contra un fondo concreto.</p>
<h3 class="sub-seccion">Rampas</h3>
<p class="seccion-sub">Un tono a muchas claridades. Existen para que los semánticos elijan. No se consumen directamente.</p>
${Object.entries(primitivas).map(([n, p]) => escala(n, p)).join('')}
<h3 class="sub-seccion">Familias categóricas</h3>
<p class="seccion-sub">No es una rampa y forzarla a serlo sería mentir sobre lo que es.
<code>identidad</code> son colores que solo tienen que distinguirse <em>entre sí</em>, todos a la misma
claridad para que el mismo blanco funcione encima; por eso el paso es un índice sin significado
—el 3 no es «más» que el 2—.</p>
${escala('identidad', categoricas.identidad)}
<h3 class="sub-seccion">Marca</h3>
${escala('marca', categoricas.marca)}`;

const pagContraste = `
<p class="pag-intro">${lock.resumen.paresBloqueantes} pares bloqueantes en los dos modos ·
<strong>${lock.resumen.fallos} fallos</strong> · ${lock.norma}. Recalculados en cada build por
<code>verificar-contraste.mjs</code>: si el contrato miente, el build falla.</p>
<h3 class="sub-seccion">Modo claro</h3>
<table class="tabla-simple">
  <thead><tr><th>Frente</th><th>Fondo</th><th class="num">Medido</th><th class="num">Mínimo</th><th>Estado</th><th>Motivo</th></tr></thead>
  <tbody>${filasContraste('claro')}</tbody>
</table>
<h3 class="sub-seccion">Modo oscuro</h3>
<table class="tabla-simple">
  <thead><tr><th>Frente</th><th>Fondo</th><th class="num">Medido</th><th class="num">Mínimo</th><th>Estado</th><th>Motivo</th></tr></thead>
  <tbody>${filasContraste('oscuro')}</tbody>
</table>
<h3 class="sub-seccion">Correcciones sobre el documento original</h3>
<table class="tabla-simple">
  <thead><tr><th>Token</th><th>Antes</th><th>Ahora</th><th>Medido</th><th>Norma</th><th>Razón</th></tr></thead>
  <tbody>${correcciones.map((c) => `<tr><td><code>${c.token}</code></td><td class="mono">${c.antes}</td>
    <td class="mono">${c.despues}</td><td class="num">${c.medido}</td><td>${c.criterio}</td>
    <td class="motivo">${c.razon}</td></tr>`).join('')}</tbody>
</table>`;

const pagIconos = `
<p class="pag-intro">Lucide, trazo <strong>1,5px a 18px</strong>, alineado con texto de 15px.
Heredan <code>currentColor</code> — que es exactamente lo que el emoji no hace.</p>
<div class="bloque">
  <div class="iconos-rejilla">
  ${Object.entries(ICONOS).map(([n, svg]) => `<div class="ico-item">${svg}<span>${n}</span></div>`).join('')}
  </div>
</div>
<h3 class="sub-seccion">Por qué no emoji</h3>
<div class="mal-rejilla">
  <div class="mal-par">
    <div class="mal-caja mal"><span class="emoji-demo">📋 📊 ⚙️</span><span class="mal-et">No hereda color, no se alinea, cambia según el sistema operativo</span></div>
    <div class="mal-caja bien"><span class="iconos-demo">${ICONOS.panel}${ICONOS.tesoreria}${ICONOS.configuracion}</span><span class="bien-et">Trazo 1,5px, hereda <code>currentColor</code></span></div>
  </div>
</div>
<p class="pag-intro" style="margin-top:16px">Es el tercer defecto real que el documento reporta en §1.3, y el único que seguía sin resolver.</p>`;

const pagMaquetas = `
<p class="pag-intro">Los tres contextos. Landing y sistema <strong>comparten valores, no proporciones</strong>.
El botón de plegar funciona, y el sol de la barra conmuta el tema.</p>
<div class="maqueta-tit">Web — landing</div>${maquetaWeb}
<div class="maqueta-tit">Sistema — lateral desplegada</div>${maquetaSistema}
<div class="maqueta-tit">Sistema — lateral plegada</div>${maquetaColapsada}
<div class="maqueta-tit">App — móvil, 375px</div>${maquetaMovil}`;

const pagInicio = `
<p class="pag-intro">Vista general del sistema. Todo lo que hay, de una vez.
El menú de la izquierda lo abre por partes.</p>

<div class="estado-rejilla">
  <div class="est"><b>${Object.keys(semanticos).length}</b><span>tokens semánticos</span></div>
  <div class="est"><b>${lock.resumen.paresBloqueantes}</b><span>pares verificados</span></div>
  <div class="est est-ok"><b>${lock.resumen.fallos}</b><span>fallos de contraste</span></div>
  <div class="est"><b>2</b><span>modos, claro y oscuro</span></div>
</div>

<h3 class="sub-seccion">Color</h3>
${Object.entries(GRUPOS).map(grupoMuestras).join('')}

<h3 class="sub-seccion">Casos de uso</h3>
${casosDeUso}

<h3 class="sub-seccion">Y además</h3>
<div class="atajos">
  <a href="#maquetas" data-ir="maquetas" class="atajo"><span class="atajo-ic">${ICONOS.matricula}</span>
    <span><strong>Maquetas</strong>Web, sistema y móvil. La lateral se pliega de verdad</span></a>
  <a href="#boton" data-ir="boton" class="atajo"><span class="atajo-ic">${ICONOS.panel}</span>
    <span><strong>Botón</strong>Variantes, estados y código para copiar</span></a>
  <a href="#espaciado" data-ir="espaciado" class="atajo"><span class="atajo-ic">${ICONOS.administracion}</span>
    <span><strong>Espaciado</strong>Rejilla de 4px y tamaños de control</span></a>
  <a href="#contraste" data-ir="contraste" class="atajo"><span class="atajo-ic">${ICONOS.academico}</span>
    <span><strong>Contrastes</strong>Los ${lock.resumen.paresBloqueantes} pares medidos</span></a>
</div>`;

// ── Registro de cambios ─────────────────────────────────────────────────────
// Se genera desde CAMBIOS, en fuente.mjs. La entrega decía «mira el Historial
// del catálogo: ahí está qué cambió y por qué», y esa página es la historia del
// MANUAL —una fila, sobre otro artefacto—. Un consumidor que abría eso para
// decidir si actualizaba no encontraba nada que le sirviera.
const pagCambios = `
<p class="pag-intro">Qué cambió en cada versión y <strong>qué puede romperte</strong>. Es lo que hay
que leer antes de actualizar. Las altas y bajas de token se comprueban contra el historial del
repositorio; el porqué es lo único escrito a mano.</p>

<div class="aviso"><strong>En ocho versiones no se ha retirado ni renombrado ningún token.</strong>
Solo altas. Lo que sí se rompió dos veces fue otra cosa, y está declarado abajo.</div>

${CAMBIOS.map(
  (c) => `
<h3 class="sub-seccion">v${c.v} <span class="cam-fecha">${c.fecha}</span></h3>
<p class="pag-intro"><strong>${c.que}.</strong> ${c.porque}</p>
${
  c.rompe.length
    ? `<table class="tabla-simple"><thead><tr><th>Puede romperte</th></tr></thead><tbody>${c.rompe
        .map((r) => `<tr><td>${r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')}</td></tr>`)
        .join('')}</tbody></table>`
    : ''
}
${
  c.tokens.alta.length
    ? `<p class="cam-tok"><strong>Tokens nuevos:</strong> ${c.tokens.alta.map((t) => `<code>${t}</code>`).join(' · ')}</p>`
    : ''
}
${
  c.tokens.baja.length
    ? `<p class="cam-tok"><strong>Tokens retirados:</strong> ${c.tokens.baja.map((t) => `<code>${t}</code>`).join(' · ')}</p>`
    : ''
}`
).join('')}

<h3 class="sub-seccion">Cómo leer los números de versión</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Un <strong>cambio de valor de color</strong> que mantiene el contrato —el par sigue verificado— es una versión <strong>menor</strong>. Lo que compras aquí es «este par cumple AA», no un hexadecimal concreto, y el verificador lo hace mecánico.</td></tr>
    <tr><td class="num">2</td><td>Retirar o renombrar un <strong>token</strong>, cambiar la <strong>forma</strong> de lo que se exporta o mover un <strong>archivo entregado</strong> es <strong>mayor</strong>. Las dos brechas de la v1.2.0 salieron como menores y no debieron.</td></tr>
    <tr><td class="num">3</td><td>Añadir tokens es <strong>menor</strong>. Siempre lo ha sido y siempre lo será: nada de lo que ya usabas cambia.</td></tr>
  </tbody>
</table>
`;

// ── Avatar ──────────────────────────────────────────────────────────────────
// La asignación es DETERMINISTA y por identificador estable, nunca por nombre:
// un cambio de apellido no debe cambiarle el color a nadie.
const colorIdentidad = (id) => {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return (n % 4) + 1;
};
const PERSONAS_AV = [
  { id: '71234567', n: 'QUISPE MAMANI, Rosa' },
  { id: '08765432', n: 'ROJAS VARGAS, Luis' },
  { id: '45120983', n: 'PINEDA HUAMÁN, José' },
  { id: '62901745', n: 'VARGAS SOTO, Ana' },
  { id: '33845612', n: 'CHÁVEZ RÍOS, Marta' },
  { id: '19472068', n: 'TORRES LEÓN, Pedro' },
];
const inicialesDe = (n) => {
  const [ap, no] = n.split(',');
  return (ap.trim()[0] + (no ? no.trim()[0] : '')).toUpperCase();
};

const pagAvatar = `
<p class="pag-intro">El disco con las iniciales de una persona. Existe para <strong>reconocer de un
vistazo</strong> en una lista larga, no para informar de nada.</p>

<h3 class="sub-seccion">El color no significa nada</h3>
<p class="pag-intro">Es la decisión que sostiene todo lo demás. El avatar usa una paleta de
<strong>identidad</strong>, no la de estado, y esto no es preferencia: si un avatar fuera rojo,
diría que esa persona tiene un problema <strong>sin que nadie lo haya dicho</strong>. Sería pintar
un estado donde solo hay una identidad.</p>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Los cuatro colores <strong>no coinciden con ningún tono de estado</strong>. Medido en tono: estado ocupa rojo, ámbar, verde y azul; cada identidad queda a 30° o más del tono de estado más cercano.</td></tr>
    <tr><td class="num">2</td><td>Son <strong>cuatro y no seis</strong> porque cuatro es lo que la paleta de estado deja libre. Añadir un quinto obligaría a invadir una familia que ya significa algo.</td></tr>
    <tr><td class="num">3</td><td>Las iniciales cumplen <strong>4,5:1 sobre los cuatro</strong>, verificado en los dos modos y dentro del contrato, como cualquier otro par.</td></tr>
    <tr><td class="num">4</td><td>El color <strong>nunca filtra, agrupa ni informa</strong>. Si alguien lo usa para eso, deja de ser identidad y pasa a ser un estado sin declarar.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">La paleta</h3>
<div class="bloque">
  <div class="avatar-rejilla">
    ${[1, 2, 3, 4]
      .map(
        (i) => `<span class="avatar-caso"><span class="avatar avatar-xl avatar-${i}">AE</span>
        <code>identidad-${i}</code></span>`
      )
      .join('')}
  </div>
</div>

<h3 class="sub-seccion">Cómo se asigna</h3>
<p class="pag-intro">Determinista y por <strong>identificador estable</strong>, nunca por nombre:
un cambio de apellido no debe cambiarle el color a nadie. La misma persona sale del mismo color
en todas las pantallas y en todos los proyectos.</p>
<div class="bloque">
  <div class="avatar-rejilla">
    ${PERSONAS_AV.map(
      (p) => `<span class="avatar-caso"><span class="avatar avatar-l avatar-${colorIdentidad(p.id)}">${inicialesDe(p.n)}</span>
      <code>${p.id}</code></span>`
    ).join('')}
  </div>
</div>

<h3 class="sub-seccion">Tamaños</h3>
<div class="bloque">
  <div class="avatar-rejilla">
    <span class="avatar-caso"><span class="avatar avatar-s avatar-1">RQ</span>24 · en tabla</span>
    <span class="avatar-caso"><span class="avatar avatar-m avatar-2">LR</span>32 · en la barra</span>
    <span class="avatar-caso"><span class="avatar avatar-l avatar-3">JP</span>40 · en tarjeta</span>
    <span class="avatar-caso"><span class="avatar avatar-xl avatar-4">AV</span>48 · en detalle</span>
  </div>
</div>
<p class="pag-intro">Cuatro pasos, todos en la rejilla de 4. Hasta la v1.7.0 convivían cuatro
tamaños distintos —30, 36, 42 y 48— en tres implementaciones separadas. Era el mismo defecto que
ya costó tener dos paginaciones.</p>

<h3 class="sub-seccion">Cuando sí hay foto</h3>
<div class="bloque">
  <div class="avatar-rejilla">
    <span class="avatar-caso"><span class="avatar avatar-xl avatar-vacio">${SILUETA}</span>Sin foto y sin nombre</span>
    <span class="avatar-caso"><span class="avatar avatar-xl avatar-2">RQ</span>Sin foto, con nombre</span>
    <span class="avatar-caso"><span class="avatar avatar-xl avatar-marco">RA</span>Sobre el marco</span>
  </div>
</div>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Proporción <strong>1:1 y recorte centrado</strong>. Nunca deformada: una cara estirada se nota siempre.</td></tr>
    <tr><td class="num">2</td><td>Si la imagen <strong>no carga, quedan las iniciales</strong>. Ni marco roto ni hueco.</td></tr>
    <tr><td class="num">3</td><td>Sin foto y sin nombre, <strong>silueta neutra</strong>. Es un marcador, no una persona inventada.</td></tr>
    <tr><td class="num">4</td><td>El avatar <strong>no es un botón</strong> por defecto. Si abre algo, el control lo envuelve y lleva su nombre accesible.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Lo que decide cada proyecto</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td>De dónde salen las fotos, dónde se guardan y con qué caducidad</td></tr>
    <tr><td><strong>Si se muestran fotos de menores de edad.</strong> Eso no es una decisión de interfaz: es de dirección y con consentimiento por escrito. El sistema entrega el componente; a qué caras se aplica, no.</td></tr>
  </tbody>
</table>
`;

// ── Horario ─────────────────────────────────────────────────────────────────
// Dos juegos de datos a propósito: uno de clases con paso de 30 minutos y otro
// de turnos con paso de 60 y siete días. Si el componente solo supiera dibujar
// el primero, el segundo lo delataría.
const HORARIOS = {
  clases: {
    titulo: 'Horario de clases · 5.º A',
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    ini: '07:30', fin: '13:30', paso: 30,
    bloques: [
      { dia: 0, de: '07:30', a: '08:00', t: 'Tutoría', d: 'Aula 201', tono: 'neutro' },
      { dia: 0, de: '08:00', a: '09:30', t: 'Matemática', d: 'Aula 201', tono: 'info' },
      { dia: 0, de: '09:30', a: '10:00', t: 'Recreo', d: '', tono: 'neutro' },
      { dia: 0, de: '10:00', a: '11:30', t: 'Comunicación', d: 'Aula 201', tono: 'exito' },
      { dia: 0, de: '11:30', a: '13:00', t: 'Ciencia y Tecnología', d: 'Laboratorio', tono: 'oro' },
      { dia: 1, de: '07:30', a: '09:00', t: 'Inglés', d: 'Aula 104', tono: 'aviso' },
      { dia: 1, de: '09:00', a: '09:30', t: 'Recreo', d: '', tono: 'neutro' },
      { dia: 1, de: '09:30', a: '11:00', t: 'Matemática', d: 'Aula 201', tono: 'info' },
      { dia: 1, de: '11:00', a: '12:30', t: 'Educación Física', d: 'Patio', tono: 'error' },
      { dia: 2, de: '07:30', a: '09:00', t: 'Comunicación', d: 'Aula 201', tono: 'exito' },
      { dia: 2, de: '09:00', a: '09:30', t: 'Recreo', d: '', tono: 'neutro' },
      { dia: 2, de: '09:30', a: '11:30', t: 'Arte y Cultura', d: 'Taller', tono: 'oro' },
      { dia: 2, de: '11:30', a: '13:30', t: 'Matemática', d: 'Aula 201', tono: 'info' },
      { dia: 3, de: '08:00', a: '09:30', t: 'Ciencias Sociales', d: 'Aula 201', tono: 'aviso' },
      { dia: 3, de: '09:30', a: '10:00', t: 'Recreo', d: '', tono: 'neutro' },
      { dia: 3, de: '10:00', a: '12:00', t: 'Inglés', d: 'Aula 104', tono: 'aviso' },
      { dia: 4, de: '07:30', a: '09:30', t: 'Matemática', d: 'Aula 201', tono: 'info' },
      { dia: 4, de: '09:30', a: '10:00', t: 'Recreo', d: '', tono: 'neutro' },
      { dia: 4, de: '10:00', a: '11:30', t: 'Educación Religiosa', d: 'Aula 201', tono: 'neutro' },
      { dia: 4, de: '11:30', a: '13:00', t: 'Educación Física', d: 'Patio', tono: 'error' },
    ],
  },
  turnos: {
    titulo: 'Horario de trabajo · Secretaría',
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    ini: '06:00', fin: '22:00', paso: 60,
    bloques: [
      { dia: 0, de: '07:00', a: '15:00', t: 'Turno mañana', d: 'M. Quispe', tono: 'info' },
      { dia: 0, de: '15:00', a: '21:00', t: 'Turno tarde', d: 'L. Rojas', tono: 'oro' },
      { dia: 1, de: '07:00', a: '15:00', t: 'Turno mañana', d: 'M. Quispe', tono: 'info' },
      { dia: 1, de: '15:00', a: '21:00', t: 'Turno tarde', d: 'L. Rojas', tono: 'oro' },
      { dia: 2, de: '07:00', a: '15:00', t: 'Turno mañana', d: 'A. Vargas', tono: 'info' },
      { dia: 2, de: '15:00', a: '21:00', t: 'Turno tarde', d: 'L. Rojas', tono: 'oro' },
      { dia: 3, de: '07:00', a: '15:00', t: 'Turno mañana', d: 'M. Quispe', tono: 'info' },
      { dia: 3, de: '15:00', a: '21:00', t: 'Turno tarde', d: 'A. Vargas', tono: 'oro' },
      { dia: 4, de: '07:00', a: '15:00', t: 'Turno mañana', d: 'M. Quispe', tono: 'info' },
      { dia: 4, de: '15:00', a: '22:00', t: 'Turno tarde ampliado', d: 'L. Rojas', tono: 'aviso' },
      { dia: 5, de: '08:00', a: '13:00', t: 'Turno sábado', d: 'A. Vargas', tono: 'exito' },
      { dia: 6, de: '09:00', a: '12:00', t: 'Guardia', d: 'Rotativo', tono: 'error' },
    ],
  },
};

const pagHorario = `
<p class="pag-intro">Una rejilla de <strong>día por hora</strong>: sirve igual para el horario de
clases de un aula que para los turnos de un puesto. No es el calendario de elegir una fecha
—eso es <a href="#fecha" data-ir="fecha" class="enlace">Fecha y rango</a>—, es el de ver qué
ocupa cada franja.</p>

<h3 class="sub-seccion">Horario o calendario de fecha</h3>
<table class="tabla-simple">
  <thead><tr><th></th><th>Horario</th><th>Fecha y rango</th></tr></thead>
  <tbody>
    <tr><td><strong>Qué responde</strong></td><td>Qué pasa en esta franja</td><td class="motivo">Qué día es</td></tr>
    <tr><td><strong>Se repite</strong></td><td>Sí, cada semana</td><td class="motivo">No, es un día concreto</td></tr>
    <tr><td><strong>Eje</strong></td><td>Día × hora</td><td class="motivo">Mes</td></tr>
    <tr><td><strong>Ejemplo</strong></td><td>Matemática, lunes de 8:00 a 9:30</td><td class="motivo">Matrícula: 01/03/2026</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Pruébalo</h3>
<p class="pag-intro">Los dos ajustes valen para <strong>todos los horarios de la aplicación</strong>
y sobreviven a la recarga. Rota la presentación y cambia el formato: los dos ejemplos de abajo
responden a la vez.</p>

<div class="hor-barra" role="group" aria-label="Ajustes del horario">
  <span class="hor-grupo">
    <span class="hor-grupo-et" id="hor-et-eje">Presentación</span>
    <span class="hor-botones" role="group" aria-labelledby="hor-et-eje">
      <button type="button" class="btn btn-mini" data-hor-eje="vertical">Vertical</button>
      <button type="button" class="btn btn-mini" data-hor-eje="horizontal">Horizontal</button>
    </span>
  </span>
  <span class="hor-grupo">
    <span class="hor-grupo-et" id="hor-et-fmt">Formato</span>
    <span class="hor-botones" role="group" aria-labelledby="hor-et-fmt">
      <button type="button" class="btn btn-mini" data-hor-fmt="24">24 h</button>
      <button type="button" class="btn btn-mini" data-hor-fmt="12">12 h</button>
    </span>
  </span>
</div>

<h4 class="hor-tit">${HORARIOS.clases.titulo}</h4>
<div class="hor-env" data-horario="clases" tabindex="0" role="region" aria-label="${HORARIOS.clases.titulo}"></div>

<h4 class="hor-tit">${HORARIOS.turnos.titulo}</h4>
<div class="hor-env" data-horario="turnos" tabindex="0" role="region" aria-label="${HORARIOS.turnos.titulo}"></div>

<h3 class="sub-seccion">Por qué se puede rotar</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Vertical</strong> —día en columna, hora en fila— es como se lee un horario escolar en papel. Es el que se reconoce sin pensar.</td></tr>
    <tr><td class="num">2</td><td><strong>Horizontal</strong> —día en fila, hora en columna— es el de una planificación de turnos: se ve de un vistazo quién cubre la tarde toda la semana.</td></tr>
    <tr><td class="num">3</td><td>Rotar <strong>no reordena datos</strong>: intercambia los ejes de la misma tabla. Lo que cambia es qué eje es el que se recorre.</td></tr>
    <tr><td class="num">4</td><td>Con muchas horas y pocos días, vertical se hace alto y horizontal se hace ancho. <strong>Se elige por la forma de los datos</strong>, no por gusto.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Es una <strong>tabla de verdad</strong>, no una rejilla dibujada. Con lector de pantalla, cada bloque se anuncia con su día y su franja porque las cabeceras están declaradas.</td></tr>
    <tr><td class="num">2</td><td>El bloque lleva <strong>filete de color a la izquierda</strong>, igual que el <a href="#chip" data-ir="chip" class="enlace">chip de estado</a>. El color solo no distingue nada: SC 1.4.1.</td></tr>
    <tr><td class="num">3</td><td>El bloque <strong>siempre dice su franja en texto</strong>. Deducirla de la altura de la celda no es leerla.</td></tr>
    <tr><td class="num">4</td><td>La franja vacía es <strong>una celda vacía</strong>, no un bloque gris. Un hueco es ausencia de dato, y pintarlo lo convierte en dato.</td></tr>
    <tr><td class="num">5</td><td>La preferencia de presentación y de formato <strong>es de la persona, no de la pantalla</strong>: se guarda y vale para toda la aplicación.</td></tr>
    <tr><td class="num">6</td><td>En pantalla estrecha el horario <strong>se desplaza dentro de su marco</strong>. Nunca se encoge la letra para que quepa.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">La celda no es un interruptor: es un porcentaje</h3>
<p class="seccion-sub">Un bloque de <strong>13:30 a 15:00</strong> se pinta como <strong>media celda</strong> de las 13:00
más la de las 14:00 entera. La rejilla se queda en <strong>24 filas</strong> aunque alguien entre a las 07:45.</p>
<div class="bloque">
  <div class="hor-env" tabindex="0">
    <table class="hor">
      <thead><tr><th class="hor-esq" scope="col">Hora</th><th scope="col">Lunes</th><th scope="col">Martes</th></tr></thead>
      <tbody>
        <tr><th class="hor-eje hor-eje-v" scope="row">07:00</th>
          <td class="hor-c" rowspan="2"><div class="hor-pila">
            <i class="hor-hueco hor-q3-2" aria-hidden="true"></i>
            <span class="hor-b hor-identidad-1"><b>Turno mañana</b><span>Sede Centro</span><span class="hor-rango">07:45 – 09:00</span></span>
          </div></td>
          <td class="hor-c hor-vacia"></td></tr>
        <tr><td class="hor-c hor-vacia"></td></tr>
        <tr><th class="hor-eje hor-eje-v" scope="row">13:00</th>
          <td class="hor-c" rowspan="2"><div class="hor-pila">
            <i class="hor-hueco hor-q2-2" aria-hidden="true"></i>
            <span class="hor-b hor-identidad-2"><b>Turno tarde</b><span>Sede Norte</span><span class="hor-rango">13:30 – 15:00</span></span>
          </div></td>
          <td class="hor-c"><div class="hor-pila">
            <span class="hor-b hor-neutro"><b>Refuerzo</b><span>Sede Centro</span><span class="hor-rango">13:00 – 14:00</span></span>
          </div></td></tr>
        <tr><td class="hor-c hor-vacia"></td></tr>
      </tbody>
    </table>
  </div>
</div>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>Se cuenta en <strong>cuartos de franja</strong>. Es la resolución que se pidió —25&nbsp;%, 50&nbsp;%, 75&nbsp;%—, no una rejilla de precisión.</td></tr>
    <tr><td class="num">2</td><td><strong>El relleno redondea; el rótulo no.</strong> La hora exacta viaja en el texto del bloque, que es donde se lee. Una entrada de 07:25 sombreada como «casi media celda» no miente: el minuto está escrito dentro.</td></tr>
    <tr><td class="num">3</td><td>Se reparte con una <strong>pila flexible</strong> —hueco, bloque, hueco— y proporciones. No hay una sola medida en píxeles, y el bloque <strong>sigue en el flujo</strong>: si el texto no cabe, la fila crece, como antes. Sacarlo con <code>position: absolute</code> habría dejado la fila sin nada que la empuje.</td></tr>
    <tr><td class="num">4</td><td><strong>La tabla no cambia.</strong> Los <code>th scope</code> y los <code>rowSpan</code>/<code>colSpan</code> se quedan exactamente igual: es lo que hace accesible este componente y era la condición del pedido.</td></tr>
    <tr><td class="num">5</td><td>El tope es <strong>seis franjas de span</strong>. Por encima se pinta a celda entera <strong>y se avisa</strong> — un límite que no se dice es un descarte silencioso, que es justo lo que este pedido venía a quitar.</td></tr>
    <tr><td class="num">6</td><td><strong>La proporción es aproximada, y se dice con el número.</strong> Medido: donde tocaría un 37,5&nbsp;% sale un <strong>35,5&nbsp;%</strong>. El bloque <strong>nunca se comprime por debajo de su texto</strong>, así que cuando el contenido pesa, el reparto cede. Es la decisión correcta —cortar el título para cuadrar un sombreado sería cambiar un dato por un adorno— y por eso el rótulo lleva la hora exacta.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Y el descarte deja de ser silencioso</h3>
<p class="seccion-sub">Lo que el horario no puede dibujar tal cual se anuncia por <code>onAjuste</code>, con su motivo.
Antes desaparecía: una celda vacía es un estado normal, así que <strong>nadie echaba en falta el bloque</strong>.</p>
<table class="tabla-simple">
  <thead><tr><th>Motivo</th><th>Cuándo</th><th>Qué hacía antes</th></tr></thead>
  <tbody>
    <tr><td class="mono">fuera-de-rango</td><td>Empieza o acaba fuera de la ventana del horario</td><td class="motivo">Desaparecía</td></tr>
    <tr><td class="mono">dia-inexistente</td><td>Apunta a un día que no está en <code>dias</code></td><td class="motivo">Desaparecía</td></tr>
    <tr><td class="mono">duracion-nula</td><td>Dura menos de un cuarto de franja</td><td class="motivo">Desaparecía</td></tr>
    <tr><td class="mono">sin-sitio</td><td>Se solapa con otro ya colocado</td><td class="motivo"><strong>Pisaba al anterior</strong>, que desaparecía</td></tr>
    <tr><td class="mono">span-largo</td><td>Abarca más de seis franjas</td><td class="motivo">No existía el caso</td></tr>
  </tbody>
</table>
<div class="aviso">
  <p><strong>El desalineado ya no se mueve.</strong> Un bloque de las 07:45 con paso de una hora se dibujaba
  <strong>en la fila de las 08:00</strong>, con el rótulo «07:45» al lado: se veía una hora que no era. Ahora se
  ancla a la franja donde <strong>cae</strong> su inicio y el resto lo resuelve el sombreado.</p>
</div>

<h3 class="sub-seccion">Colorear por sede, sin gastar el rojo</h3>
<p class="seccion-sub">Un profesor reparte su semana entre varios locales. El color es lo que permite ver
<strong>dónde está cada tramo</strong> sin leer caja por caja — pero los tonos de estado no valen para eso:
usar <code>error</code> como adorno <strong>gasta el rojo</strong>.</p>
<div class="bloque">
  <div class="hor-env">
    <table class="hor">
      <thead><tr><th class="hor-esq"></th><th>Lun</th><th>Mar</th><th>Mié</th><th>Jue</th></tr></thead>
      <tbody>
        <tr><th class="hor-eje hor-eje-v" scope="row">08:00</th>
          <td class="hor-c"><span class="hor-b hor-identidad-1"><b>Matemática</b><span>Sede Centro · A-201</span><span class="hor-rango">08:00 – 09:30</span></span></td>
          <td class="hor-c"><span class="hor-b hor-identidad-2"><b>Comunicación</b><span>Sede Norte · B-104</span><span class="hor-rango">08:00 – 09:30</span></span></td>
          <td class="hor-c hor-vacia"></td>
          <td class="hor-c"><span class="hor-b hor-identidad-3"><b>Tutoría</b><span>Sede Sur · C-12</span><span class="hor-rango">08:00 – 08:45</span></span></td></tr>
        <tr><th class="hor-eje hor-eje-v" scope="row">10:00</th>
          <td class="hor-c"><span class="hor-b hor-identidad-4"><b>Ciencias</b><span>Sede Este · Lab 1</span><span class="hor-rango">10:00 – 11:30</span></span></td>
          <td class="hor-c hor-vacia"></td>
          <td class="hor-c"><span class="hor-b hor-error"><b>Sin docente</b><span>Sede Centro · A-201</span><span class="hor-rango">10:00 – 11:30</span></span></td>
          <td class="hor-c hor-vacia"></td></tr>
      </tbody>
    </table>
  </div>
  <p class="pag-intro">Mire el bloque rojo: <strong>sigue siendo lo que más pesa</strong>. Esa es toda la
  decisión de diseño.</p>
  <div class="chip-sup-fila" style="align-items:center;gap:12px;margin-top:8px">
    <span><span class="chip chip-punto chip-identidad-1"></span> Sede Centro</span>
    <span><span class="chip chip-punto chip-identidad-2"></span> Sede Norte</span>
    <span><span class="chip chip-punto chip-identidad-3"></span> Sede Sur</span>
    <span><span class="chip chip-punto chip-identidad-4"></span> Sede Este</span>
  </div>
</div>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>El color va en el <strong>filete, y a 6&nbsp;px</strong>. Los tonos de estado llevan 3: <strong>el grosor distinto es en sí la señal</strong> de que esto es otra dimensión, no un estado más.</td></tr>
    <tr><td class="num">2</td><td>Se probó el <strong>fondo macizo</strong> con texto blanco, que es como se ve el avatar y como se pidió. Cumple el contraste (6,05–7,53:1) y se lee rapidísimo, pero <strong>cuatro cajas macizas decorativas pesan más que un bloque de error</strong> en rojo tenue: la alarma quedaba por debajo del adorno.</td></tr>
    <tr><td class="num">3</td><td>También el <strong>título en el color</strong> (5,27–6,55:1). Descartado: aquí el <strong>texto</strong> de color ya significa estado, y un título verde se lee como «bien».</td></tr>
    <tr><td class="num">4</td><td><strong>La sede va en el texto del bloque y en la leyenda.</strong> El color acompaña; no es el dato. Sin las dos cosas, no se usa.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">12 horas o 24 horas</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td>En el Perú se dice «a las tres de la tarde», pero los horarios oficiales se publican en 24 h. Por eso <strong>24 h es el valor por omisión</strong> y 12 h es la preferencia que se elige.</td></tr>
    <tr><td class="num">2</td><td>En 12 h se escribe <code>a. m.</code> y <code>p. m.</code> <strong>con espacio y con puntos</strong>, que es la forma correcta en español.</td></tr>
    <tr><td class="num">3</td><td>El cambio de formato <strong>no toca los datos</strong>. Una franja guardada es un minuto del día; el formato es solo cómo se escribe.</td></tr>
  </tbody>
</table>
`;


// ── Cuatro elementos que el sistema PUBLICA y el catalogo no ensenaba ───────
// Un componente sin pagina es un componente que nadie encuentra: el area de
// sistemas se guia del catalogo, y lo que no esta ahi lo reconstruye. Es el
// mismo fallo que denuncio Control Administrativos V2.0 al reves.

const pagCabecera = `
<p class="pag-intro">Migas, titulo, accion y descripcion. El bloque con el que abre
<strong>toda</strong> pantalla, y con el que abren las 39 paginas de este catalogo.</p>

<h3 class="sub-seccion">Por que es componente y no una convencion</h3>
<p class="seccion-sub">El titulo de pantalla es el <code>&lt;h1&gt;</code> del documento, y
<strong>debe haber uno solo por pagina</strong>. Un componente lo garantiza; una nota en un
comentario pidiendo que no se usen dos a la vez es disciplina, y la disciplina se rompe el dia
que entra alguien nuevo.</p>
<p class="seccion-sub">Por eso el titulo es <strong>texto y no marcado libre</strong>: si aceptara
marcado, un proyecto podria meter otro encabezado dentro y volveriamos al principio.</p>

<h3 class="sub-seccion">Anatomia</h3>
<div class="bloque">
  <header class="pant-cab">
    <nav class="migas" aria-label="Ubicacion">
      <span class="migas-tramo"><a href="#inicio" data-ir="inicio">Inicio</a></span>
      <span class="migas-tramo"><span class="migas-sep" aria-hidden="true">/</span><span class="migas-actual" aria-current="page">Personal</span></span>
    </nav>
    <div class="pant-fila">
      <h2 style="font-size:28px;font-weight:600;margin:0">Personal</h2>
      <div class="pant-accion"><button class="btn btn-1">Nuevo</button></div>
    </div>
    <p class="pant-desc">Docentes y administrativos con contrato vigente.</p>
  </header>
</div>
<p class="seccion-sub">La descripcion va <strong>debajo</strong> de la accion, no en medio: entre
las dos separaria la accion de aquello sobre lo que actua.</p>

<h3 class="sub-seccion">Codigo</h3>
<pre class="cod"><code>&lt;CabeceraPantalla
  migas={[{ texto: 'Inicio', href: '/' }, { texto: 'Personal' }]}
  titulo="Personal"
  descripcion="Docentes y administrativos con contrato vigente."
  accion={&lt;Boton variante="principal"&gt;Nuevo&lt;/Boton&gt;}
/&gt;</code></pre>`;

const pagMigas = `
<p class="pag-intro">Donde estas dentro de la jerarquia. Seis reglas de estilo y ningun
comportamiento &mdash; y aun asi se reconstruian mal, porque <strong>lo que hay que copiar no se
ve</strong>.</p>

<h3 class="sub-seccion">Las tres cosas que no se ven</h3>
<table class="tabla-simple">
  <thead><tr><th>Que</th><th>Por que</th></tr></thead>
  <tbody>
    <tr><td><code>aria-label</code> en el <code>&lt;nav&gt;</code></td><td class="motivo">Sin el, quien navega por regiones oye <q>navegacion</q> dos veces y no sabe cual es cual</td></tr>
    <tr><td><code>aria-hidden</code> en las barras</td><td class="motivo">Sin eso el lector lee <q>Inicio, barra inclinada, Personal</q></td></tr>
    <tr><td><code>aria-current="page"</code> en el ultimo</td><td class="motivo">Es lo que dice que ahi estas. Es lo que mas se pierde al copiar solo el sombreado</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">El ultimo nivel NUNCA es enlace</h3>
<p class="seccion-sub">Un enlace a la pagina en la que ya estas no lleva a ninguna parte, y quien
tabula pasa por el sin ganar nada. Aunque se pase <code>href</code>, se ignora.</p>
<div class="bloque">
  <nav class="migas" aria-label="Ubicacion">
    <span class="migas-tramo"><a href="#inicio" data-ir="inicio">Sistema de diseno</a></span>
    <span class="migas-tramo"><span class="migas-sep" aria-hidden="true">/</span><a href="#boton" data-ir="boton">Elementos</a></span>
    <span class="migas-tramo"><span class="migas-sep" aria-hidden="true">/</span><span class="migas-actual" aria-current="page">Interruptor</span></span>
  </nav>
</div>

<h3 class="sub-seccion">En movil</h3>
<p class="seccion-sub">Con tres o mas niveles no caben en un telefono. Los de mas atras se ocultan
<strong>a la vista</strong>, no del lector: la ubicacion completa sigue siendo informacion aunque
no quepa. Se eligio quedarse con el anterior en vez de colapsar en <q>...</q> porque en un
telefono lo que se busca es <strong>volver</strong>, no situarse.</p>

<h3 class="sub-seccion">Codigo</h3>
<pre class="cod"><code>&lt;Migas ruta={[
  { texto: 'Inicio', href: '/' },
  { texto: 'Elementos', href: '/elementos' },
  { texto: 'Interruptor' },
]} /&gt;</code></pre>`;

const pagNota = `
<p class="pag-intro">Texto que <strong>explica y se queda</strong>: como se calcula un dato, una
aclaracion bajo un formulario, una advertencia legal que siempre esta.</p>

<h3 class="sub-seccion">No es un aviso, y la diferencia importa</h3>
<p class="seccion-sub">El aviso aparece y desaparece, y su color ensena a la gente que algo requiere
atencion. Usarlo para algo permanente tiene dos costes: <strong>grita mas de lo que debe</strong>, y
<strong>si el ambar siempre esta, deja de significar <q>mira esto</q></strong>.</p>
<p class="seccion-sub">El razonamiento es de Control Administrativos V2.0 y es correcto.</p>

<div class="bloque">
  <div class="msj msj-nota"><strong>Como se calcula:</strong> las horas se redondean al bloque de 15 minutos mas cercano.</div>
  <div style="height:12px"></div>
  <div class="msj msj-aviso"><span class="msj-ico">${icono('alerta', 16)}</span><span class="msj-txt">Se envio con 3 faltas sin justificar.</span></div>
</div>
<p class="seccion-sub">Arriba, la nota. Abajo, el aviso. La nota no reclama nada: solo esta.</p>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <thead><tr><th>Regla</th><th>Por que</th></tr></thead>
  <tbody>
    <tr><td>Superficie neutra, sin tono de estado</td><td class="motivo">El color de estado significa algo; una nota no significa, explica</td></tr>
    <tr><td>Sin <code>role</code></td><td class="motivo">Una nota permanente no es una region viva. Anunciarla la haria interrumpir en cada repintado</td></tr>
    <tr><td>No se cierra ni se desvanece</td><td class="motivo">Si se pudiera cerrar, la mitad de la gente no la veria nunca</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Codigo</h3>
<pre class="cod"><code>&lt;Nota titulo="Como se calcula:"&gt;
  Las horas se redondean al bloque de 15 minutos mas cercano.
&lt;/Nota&gt;</code></pre>`;

const pagDialogo = `
<p class="pag-intro">Modal con el foco atrapado. El sistema acepta primitiva accesible para
<strong>exactamente tres casos</strong> &mdash;dialogo, menu y selector con busqueda&mdash; y este
es uno.</p>

<h3 class="sub-seccion">Cuando NO usarlo, que importa mas</h3>
<p class="seccion-sub">Para confirmar una accion esta <a href="#confirmar" data-ir="confirmar">Confirmacion</a>,
que es una banda en linea y <strong>no tapa</strong>. Un dialogo detiene la tarea entera, y eso solo
se justifica cuando lo que hay dentro <strong>ES la tarea</strong>: un formulario que no cabe en la
fila, o elegir entre opciones que hay que ver juntas.</p>

<h3 class="sub-seccion">Que resuelve el navegador y que ponemos nosotros</h3>
<table class="tabla-simple">
  <thead><tr><th>Lo pone</th><th>Que</th></tr></thead>
  <tbody>
    <tr><td><code>&lt;dialog&gt;</code></td><td class="motivo">El foco no se escapa por detras, Escape cierra, y queda en la capa superior por encima de cualquier <code>z-index</code></td></tr>
    <tr><td>El componente</td><td class="motivo">Que el foco <strong>entre</strong> en el titulo &mdash;no en un campo sin contexto&mdash; y <strong>vuelva</strong> al origen al cerrar</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">El pie</h3>
<p class="seccion-sub"><strong>Cancelar a la izquierda y la accion a la derecha.</strong> No es
estetica: es el orden que la gente ya tiene aprendido, e invertirlo hace que se pulse el que no era.</p>
<div class="bloque">
  <div class="dlg">
    <div class="dlg-cuerpo"><strong>Editar los datos de contacto</strong><p>Telefono y correo de la persona.</p></div>
    <div class="dlg-pie"><button class="btn btn-neutro">Cancelar</button><button class="btn btn-1">Guardar</button></div>
  </div>
</div>

<h3 class="sub-seccion">Cerrar al pulsar el fondo</h3>
<p class="seccion-sub">Viene puesto, y <strong>hay que quitarlo cuando haya datos sin guardar</strong>:
perder lo escrito por un clic fuera es peor que un clic de mas.</p>

<h3 class="sub-seccion">Codigo</h3>
<pre class="cod"><code>&lt;Dialogo
  abierto={abierto}
  titulo="Editar los datos de contacto"
  origen={botonQueLoAbrio}
  onCerrar={() =&gt; setAbierto(false)}
  accion={{ texto: 'Guardar', onClick: guardar }}
  cerrarAlPulsarFuera={false}
&gt;
  {formulario}
&lt;/Dialogo&gt;</code></pre>`;


const pagPanelPrivilegios = `
<p class="pag-intro">Reparte permisos <strong>por módulo</strong>: qué puede hacer alguien en cada parte de una
aplicación. No sabe de negocio —ni de cargos, ni de sedes— así que el mismo panel sirve para los permisos de un
puesto, los de una persona suelta o los de una clave de API.</p>

<h3 class="sub-seccion">Se compone, no se dibuja</h3>
<p class="seccion-sub">El interruptor, el chip y el botón de dentro son los del sistema. Lo único propio es el
andamiaje de la lista — <strong>catorce reglas</strong>, y si fueran muchas más sería señal de estar
reconstruyendo.</p>
<div class="bloque">
  <div class="pp">
    <div class="pp-lista">

      <section class="pp-mod pp-abierto">
        <button class="pp-mod-cab" type="button" aria-expanded="true">
          <span class="pp-chev">${ic('chevron', 18)}</span>
          <span class="pp-mod-nom">Trabajadores</span>
          <span class="pp-tags">
            <span class="chip chip-info">Ver</span><span class="chip chip-info">Editar</span>
            <span class="chip chip-info">Crear</span><span class="chip chip-info">Descargar</span>
          </span>
          <span class="pp-conteo">4 de 4</span>
        </button>
        <div class="pp-mod-cuerpo">
          <div class="pp-priv pp-priv-base">
            <label class="sw-fila"><button type="button" role="switch" class="sw" aria-checked="true" aria-label="Ver"><span class="sw-bolita"></span></button><span class="sw-txt"><span class="sw-et">Ver</span></span></label>
          </div>
          <div class="pp-priv">
            <label class="sw-fila"><button type="button" role="switch" class="sw" aria-checked="true" aria-label="Editar"><span class="sw-bolita"></span></button><span class="sw-txt"><span class="sw-et">Editar</span></span></label>
          </div>
          <div class="pp-priv">
            <span class="sw-fila sw-cerrado"><span class="sw-candado">${ic('candado', 18)}</span><span class="sw-txt"><span class="sw-et">Dar de alta</span><span class="sw-motivo">Dar de alta a una persona es del Jefe de personal.</span></span></span>
          </div>
          <div class="pp-niveles">
            <fieldset class="sg">
              <legend class="sg-et">Documento</legend>
              <div class="sg-barra">
                <label class="sg-op"><input class="sg-in" type="radio" name="doc" checked><span class="sg-tit">Completo</span><span class="sg-ej">71602303</span></label>
                <label class="sg-op"><input class="sg-in" type="radio" name="doc"><span class="sg-tit">Parcial</span><span class="sg-ej">*****303</span></label>
                <label class="sg-op"><input class="sg-in" type="radio" name="doc"><span class="sg-tit">Oculto</span></label>
              </div>
            </fieldset>
          </div>
          <div class="pp-grupo">
            <p class="pp-grupo-tit">Dentro del módulo</p>
            <div class="pp-priv">
              <label class="sw-fila"><button type="button" role="switch" class="sw" aria-checked="true" aria-label="Ver documento, dirección y correo"><span class="sw-bolita"></span></button><span class="sw-txt"><span class="sw-et">Ver documento, dirección y correo</span><span class="sw-ayuda">Dato sensible: quien lo tenga verá el número completo.</span></span></label>
            </div>
          </div>
        </div>
      </section>

      <section class="pp-mod">
        <button class="pp-mod-cab" type="button" aria-expanded="false">
          <span class="pp-chev">${ic('chevron', 18)}</span>
          <span class="pp-mod-nom">Marcaciones<span class="pp-marca"><span class="chip chip-identidad-3">modificado</span></span></span>
          <span class="pp-tags"><span class="chip chip-info">Ver</span></span>
          <span class="pp-conteo">1 de 1</span>
        </button>
      </section>

      <section class="pp-mod pp-sin-base pp-abierto">
        <button class="pp-mod-cab" type="button" aria-expanded="true">
          <span class="pp-chev">${ic('chevron', 18)}</span>
          <span class="pp-mod-nom">Horarios</span>
          <span class="pp-tags"><span class="chip chip-pend">sin permisos</span></span>
          <span class="pp-conteo">0 de 3</span>
        </button>
        <div class="pp-mod-cuerpo">
          <div class="pp-priv pp-priv-base">
            <label class="sw-fila"><button type="button" role="switch" class="sw" aria-checked="false" aria-label="Ver"><span class="sw-bolita"></span></button><span class="sw-txt"><span class="sw-et">Ver</span></span></label>
          </div>
          <div class="pp-priv">
            <label class="sw-fila"><button type="button" role="switch" class="sw" aria-checked="false" aria-label="Editar"><span class="sw-bolita"></span></button><span class="sw-txt"><span class="sw-et">Editar</span></span></label>
          </div>
          <p class="pp-aviso">${ic('alerta', 16)}<span>Sin este permiso, el resto del módulo no se aplica.</span></p>
        </div>
      </section>

    </div>
    <div class="pp-pie">
      <span class="pp-pie-txt">1 módulo modificado</span>
      <button class="btn btn-neutro btn-mini" type="button">Volver al preset</button>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Las cinco decisiones que lleva dentro</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>Hay un privilegio que manda.</strong> Sin «ver», editar no significa nada: apagarlo apaga el módulo, y encender cualquier otro lo enciende solo. Se cambia con <code>base</code> o se desactiva con <code>base={null}</code> cuando el dominio no funcione así. Sin esto se puede guardar «editar sin ver», y cada producto lo resolvería a su manera.</td></tr>
    <tr><td class="num">2</td><td><strong>Lo cerrado dice por qué.</strong> Se pasa el motivo, no un booleano. Es el <code>cerrado</code> del Interruptor (R66), que nació para esto: un candado sin explicación se lee como un fallo del sistema.</td></tr>
    <tr><td class="num">3</td><td><strong>Lo que no aplica no se pasa.</strong> No hay «no aplica» que pintar: si un módulo no tiene «descargar», ese privilegio no está en su lista. Una casilla vacía y un permiso denegado no son lo mismo.</td></tr>
    <tr><td class="num">4</td><td><strong>Lo concedido se ve sin abrir.</strong> Los chips y el «4 de 6» están en la cabecera: abrir es para <em>cambiar</em>, no para <em>enterarse</em>. Con diez módulos, obligar a abrirlos uno por uno es diez veces el mismo gesto.</td></tr>
    <tr><td class="num">5</td><td><strong>El preset se ve y se recupera.</strong> Pasando <code>preset</code>, cada módulo que difiera se marca y aparece cómo volver. Sin él nadie sabe qué tocó.</td></tr>
    <tr><td class="num">6</td><td><strong>Un privilegio puede declarar niveles por campo</strong> — cuánto se ve de un dato sensible. Van en <a href="#segmentado" data-ir="segmentado" class="enlace">Segmentado</a>, que nació para esto, y <strong>dentro del privilegio</strong>: sin «ver» concedido, elegir cuánto se ve no significa nada.</td></tr>
    <tr><td class="num">7</td><td><strong>Apagar el privilegio que manda no borra nada.</strong> Lo configurado se conserva para cuando se vuelva a encender — igual que los filtros de la tabla al plegarse. Lo que no se conserva es el <em>efecto</em>: <code>privilegiosEfectivos()</code> devuelve lo que de verdad se aplica, que es lo que va al backend.</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Lo que NO hace, y es a propósito</h3>
<table class="tabla-simple">
  <tbody>
    <tr><td class="num">1</td><td><strong>No ordena por estado.</strong> Subir los concedidos al principio haría que la fila saltara bajo el dedo justo después de tocarla, y borraría el orden ver → editar → crear → desactivar, que es una escalera de riesgo. El orden lo pone quien pasa los datos.</td></tr>
    <tr><td class="num">2</td><td><strong>No guarda.</strong> Es controlado: recibe <code>valor</code> y emite <code>onCambio</code>. Cuándo se persiste es del producto.</td></tr>
    <tr><td class="num">3</td><td><strong>No sabe de cargos.</strong> El selector de arriba lo pone el producto por <code>children</code>. El día que esto sirva para permisos de una clave de API, no habrá que tocarlo.</td></tr>
  </tbody>
</table>
`;

const pagPanelBarra = `
<p class="pag-intro">El boton con contador de la barra superior y la ventana que se abre al
pulsarlo. <strong>Mensajes y notificaciones son el mismo componente.</strong></p>

<h3 class="sub-seccion">Por que uno y no dos</h3>
<p class="seccion-sub">Tienen exactamente la misma forma: un boton con contador y una lista de
cosas con su momento. Hacer <code>PanelMensajes</code> y <code>PanelNotificaciones</code> por
separado seria tener dos y verlos divergir &mdash;el sistema ya tuvo dos paginaciones y paso&mdash;.
Lo que cambia es el icono, el titulo y los datos, que es justo lo que se pasa por propiedades.</p>

<h3 class="sub-seccion">Pruebalo</h3>
<div class="bloque">
  <div class="demo-paneles">
    <div class="us" data-pb>
      <button class="top-btn" aria-expanded="false" aria-haspopup="dialog"
              aria-controls="pb-msj" aria-label="Mensajes, 2 sin leer" data-pb-btn>
        ${ICONOS.sobre}<span class="badge" aria-hidden="true">2</span>
      </button>
      <div class="us-menu pb-panel" id="pb-msj" role="dialog" aria-label="Mensajes" hidden>
        <div class="us-sec"><span class="us-et">Mensajes</span></div>
        <ul class="pb-lista">
          <li><button class="pb-item pb-nuevo"><span class="pb-txt"><span class="pb-tit">QUISPE MAMANI, Rosa</span><span class="pb-det">Justificacion de tardanza del 12 de agosto</span></span><span class="pb-cuando">hace 5 min</span><span class="pb-punto" aria-hidden="true"></span></button></li>
          <li><button class="pb-item pb-nuevo"><span class="pb-txt"><span class="pb-tit">HUAMAN LOPEZ, Luis</span><span class="pb-det">Consulta sobre el horario de tutoria</span></span><span class="pb-cuando">hace 2 h</span><span class="pb-punto" aria-hidden="true"></span></button></li>
          <li><button class="pb-item"><span class="pb-txt"><span class="pb-tit">Direccion academica</span><span class="pb-det">Recordatorio de la reunion del viernes</span></span><span class="pb-cuando">ayer</span></button></li>
        </ul>
        <button class="us-op pb-todos">Ver todos</button>
      </div>
    </div>

    <div class="us" data-pb>
      <button class="top-btn" aria-expanded="false" aria-haspopup="dialog"
              aria-controls="pb-not" aria-label="Notificaciones, 1 sin leer" data-pb-btn>
        ${ICONOS.campana}<span class="badge" aria-hidden="true">1</span>
      </button>
      <div class="us-menu pb-panel" id="pb-not" role="dialog" aria-label="Notificaciones" hidden>
        <div class="us-sec"><span class="us-et">Notificaciones</span></div>
        <ul class="pb-lista">
          <li><button class="pb-item pb-nuevo"><span class="pb-txt"><span class="pb-tit">Cierre de matricula</span><span class="pb-det">Quedan 3 dias para el cierre del periodo</span></span><span class="pb-cuando">hace 1 h</span><span class="pb-punto" aria-hidden="true"></span></button></li>
          <li><button class="pb-item"><span class="pb-txt"><span class="pb-tit">Copia de seguridad</span><span class="pb-det">Se completo correctamente</span></span><span class="pb-cuando">ayer</span></button></li>
        </ul>
        <button class="us-op pb-todos">Ver todas</button>
      </div>
    </div>
  </div>
</div>

<h3 class="sub-seccion">Lo que no se ve</h3>
<table class="tabla-simple">
  <thead><tr><th>Que</th><th>Por que</th></tr></thead>
  <tbody>
    <tr><td>El contador va en el <strong>nombre del boton</strong></td><td class="motivo">Quien usa lector no ve la burbuja. Saber que hay tres sin leer es lo que hace que merezca la pena abrir</td></tr>
    <tr><td>La burbuja lleva <code>aria-hidden</code></td><td class="motivo">Lo que dice ya esta en el nombre. Leerlo dos veces es ruido</td></tr>
    <tr><td><code>role="dialog"</code>, no <code>menu</code></td><td class="motivo">Dentro hay texto que se lee, no opciones entre las que se elige. Con <code>menu</code> el lector entra en modo de opciones y el texto de cada aviso deja de leerse</td></tr>
    <tr><td>Escape cierra y <strong>devuelve el foco</strong></td><td class="motivo">Cerrar y dejar el foco en el limbo obliga a tabular desde el principio de la pagina</td></tr>
    <tr><td>El titulo sin leer va en <strong>600</strong></td><td class="motivo">SC 1.4.1: el punto azul no puede ser el unico portador</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-simple">
  <thead><tr><th>Regla</th><th>Por que</th></tr></thead>
  <tbody>
    <tr><td>El detalle se recorta a <strong>dos lineas</strong></td><td class="motivo">Un aviso largo no puede empujar a los demas fuera del panel</td></tr>
    <tr><td>El pie <strong>no se desplaza</strong> con la lista</td><td class="motivo">«Ver todos» tiene que seguir estando con veinte elementos</td></tr>
    <tr><td>Sin nada, <strong>se dice</strong></td><td class="motivo">Una ventana vacia no distingue «no hay» de «fallo la carga»</td></tr>
    <tr><td>El momento lo formatea <strong>el proyecto</strong></td><td class="motivo">El sistema no sabe de husos horarios ni de que idioma habla esta pantalla</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Codigo</h3>
<pre class="cod"><code>&lt;PanelBarra
  icono="sobre"
  titulo="Mensajes"
  items={mensajes.map(m =&gt; ({
    id: m.id, titulo: m.de, texto: m.asunto,
    cuando: formatearMomento(m.fecha), sinLeer: !m.leido,
    onClick: () =&gt; abrir(m.id),
  }))}
  onVerTodos={() =&gt; router.push('/mensajes')}
/&gt;</code></pre>`;

const CATALOGO = [
  {
    grupo: 'Inicio',
    icono: 'panel',
    items: [{ id: 'inicio', t: 'Vista general', estado: 'listo', c: pagInicio }],
  },
  {
    grupo: 'Fundamentos',
    icono: 'administracion',
    items: [
      { id: 'color', t: 'Color', estado: 'listo', c: pagColor },
      { id: 'tipografia', t: 'Tipografía', estado: 'listo', c: tipografia },
      { id: 'espaciado', t: 'Espaciado', estado: 'listo', c: espaciado },
      { id: 'iconos', t: 'Iconos', estado: 'listo', c: pagIconos },
    ],
  },
  {
    grupo: 'Elementos',
    icono: 'panel',
    // Veintitrés ítems seguidos no se leen (lo dijo el responsable buscando
    // la carga de imagen y sin encontrarla): cinco ramas, como en el Manual.
    // El ORDEN de items define los rangos de cada rama.
    ramas: [
      // Los cortes son ÍNDICES sobre `items`: meter un elemento en medio los
      // corre a todos. Pasó al entrar «Carga de ID» —el último, «Panel de la
      // barra», se cayó fuera del último tramo y desapareció del menú—, y lo
      // cazó el candado de la entrega, que lee los títulos del menú.
      // Y volvió a pasar al entrar «Segmentado» (R69, v1.59.0), con la misma
      // víctima. Dos veces la misma trampa: los cortes se corren a mano y solo
      // se nota si el que se cae es el ÚLTIMO. Si un elemento se metiera en la
      // rama equivocada, ningún candado lo vería.
      { t: 'Acciones', desde: 0, hasta: 2 },
      // +1 en los tres cortes de detrás al entrar «Fila de carga» (R102,
      // v1.77.0). Es la cuarta vez que hay que correrlos a mano.
      { t: 'Formulario', desde: 2, hasta: 13 },
      { t: 'Datos', desde: 13, hasta: 19 },
      { t: 'Respuesta', desde: 19, hasta: 25 },
      // `Infinity` y no un numero: el ULTIMO tramo llega siempre al final, asi
      // que meter un elemento al final deja de tener trampa. Los cortes de en
      // medio siguen siendo indices, y por eso existe `comprobarTramos`.
      { t: 'Marco y navegación', desde: 25, hasta: Infinity },
    ],
    items: [
      { id: 'boton', t: 'Botón', estado: 'listo', c: pagBoton },
      { id: 'enlace', t: 'Enlace', estado: 'listo', c: pagEnlace },
      { id: 'campo', t: 'Campo de texto', estado: 'listo', c: pagCampo },
      { id: 'areatexto', t: 'Área de texto', estado: 'listo', c: pagAreaTexto },
      // R102 · va ANTES que las tres cargas: lo primero que hay que entender
      // es la medida que las tres respetan.
      { id: 'filacarga', t: 'Fila de carga', estado: 'listo', c: pagFilaCarga },
      { id: 'cargaimagen', t: 'Carga de imagen', estado: 'listo', c: pagCargaImagen },
      { id: 'cargapdf', t: 'Carga de PDF', estado: 'listo', c: pagCargaPdf },
      { id: 'cargaid', t: 'Carga de ID', estado: 'listo', c: pagCargaId },
      { id: 'selector', t: 'Selector', estado: 'listo', c: pagSelector },
      { id: 'interruptor', t: 'Interruptor', estado: 'listo', c: pagInterruptor },
      { id: 'multiple', t: 'Selección múltiple', estado: 'listo', c: pagMultiple },
      { id: 'segmentado', t: 'Segmentado', estado: 'listo', c: pagSegmentado },
      { id: 'fecha', t: 'Fecha y rango', estado: 'listo', c: pagFecha },
      { id: 'horario', t: 'Horario', estado: 'listo', c: pagHorario },
      { id: 'chip', t: 'Chip de estado', estado: 'listo', c: pagChip },
      { id: 'avatar', t: 'Avatar', estado: 'listo', c: pagAvatar },
      { id: 'tarjeta', t: 'Tarjeta', estado: 'listo', c: pagTarjeta },
      { id: 'tabla', t: 'Tabla de datos', estado: 'listo', c: pagTabla },
      { id: 'paginacion', t: 'Paginación', estado: 'listo', c: pagPaginacion },
      { id: 'progreso', t: 'Barra de progreso', estado: 'listo', c: pagProgreso },
      { id: 'aviso', t: 'Aviso temporal', estado: 'listo', c: pagAviso },
      { id: 'confirmar', t: 'Confirmación', estado: 'listo', c: pagConfirmar },
      { id: 'estados', t: 'Estados de pantalla', estado: 'listo', c: pagEstados },
      { id: 'nota', t: 'Nota permanente', estado: 'listo', c: pagNota },
      { id: 'dialogo', t: 'Diálogo', estado: 'listo', c: pagDialogo },
      { id: 'migas', t: 'Migas de pan', estado: 'listo', c: pagMigas },
      { id: 'cabecera', t: 'Cabecera de pantalla', estado: 'listo', c: pagCabecera },
      { id: 'panelbarra', t: 'Panel de la barra', estado: 'listo', c: pagPanelBarra },
      { id: 'panelprivilegios', t: 'Panel de privilegios', estado: 'listo', c: pagPanelPrivilegios },
    ],
  },
  {
    grupo: 'Composición',
    icono: 'matricula',
    items: [
      { id: 'casos', t: 'Casos de uso', estado: 'listo', c: casosDeUso },
      { id: 'maquetas', t: 'Maquetas', estado: 'listo', c: pagMaquetas },
    ],
  },
  {
    grupo: 'Manual de uso',
    icono: 'comunicaciones',
    // Segundo nivel: las doce secciones se agrupan en dos ramas. Doce ítems
    // seguidos no se leen; dos ramas de seis, sí.
    ramas: [
      { t: 'Cómo se aplica', desde: 0, hasta: 6 },
      { t: 'Cómo se escribe', desde: 6, hasta: Infinity },
    ],
    items: seccionesManual.map((s) => ({
      id: s.id,
      t: s.t,
      estado: 'listo',
      c: `<div class="manual">${s.cuerpo}</div>`,
    })),
  },
  {
    grupo: 'Referencia',
    icono: 'academico',
    items: [
      { id: 'cambios', t: 'Registro de cambios', estado: 'listo', c: pagCambios },
      { id: 'contraste', t: 'Contrastes', estado: 'listo', c: pagContraste },
    ],
  },
];

comprobarTramos(CATALOGO);

const PUNTO = { listo: '', decidir: '', pendiente: '<span class="pt pt-pend" title="Sin construir"></span>' };

// El menú del catálogo ES el mismo componente que el de la aplicación:
// icono + nombre, sombreado en el activo, y chevron que despliega el grupo.
// Si el catálogo no usara su propio sistema, no valdría nada.
const menuCatalogo = CATALOGO.map(
  (g, n) => `
  <div class="nav-grupo" data-grupo="${n}">
    <button class="nav-item nav-grupo-tit" aria-expanded="true" data-desplegar="${n}">
      <span class="nav-ic">${ICONOS[g.icono]}</span>
      <span class="nav-txt">${g.grupo}</span>
      <span class="nav-chev">${ICONOS.chevron}</span>
    </button>
    <div class="nav-hijos" id="grupo-${n}">
      <div class="nav-hijos-in">
      <span class="nav-flot-tit">${g.grupo}</span>
      ${
        g.ramas
          ? g.ramas
              .map(
                (r, k) => `<div class="nav-rama" data-rama="${n}-${k}">
                  <button class="nav-hijo nav-rama-tit" aria-expanded="false" data-abrir-rama="${n}-${k}">
                    <span class="nav-txt">${r.t}</span>
                    <span class="nav-chev">${ICONOS.chevron}</span>
                  </button>
                  <div class="nav-nietos"><div class="nav-nietos-in">
                    ${g.items
                      .slice(r.desde, r.hasta)
                      .map(
                        (i) => `<a class="nav-nieto" href="#${i.id}" data-ir="${i.id}" title="${i.t}">
                          <span class="nav-txt">${i.t}</span></a>`
                      )
                      .join('')}
                  </div></div>
                </div>`
              )
              .join('')
          : g.items
              .map(
                (i) => `<a class="nav-hijo" href="#${i.id}" data-ir="${i.id}" title="${i.t}">
                  <span class="nav-txt">${i.t}</span>${PUNTO[i.estado]}</a>`
              )
              .join('')
      }
      </div>
    </div>
  </div>`
).join('');

const paginasCatalogo = CATALOGO.flatMap((g) =>
  g.items.map(
    (i) => `<section class="pagina" id="pg-${i.id}" hidden>
      <nav class="migas" aria-label="Ubicación">
        <a href="#inicio" data-ir="inicio">Sistema de diseño</a>
        <span class="migas-sep" aria-hidden="true">/</span>
        <a href="#${g.items[0].id}" data-ir="${g.items[0].id}" class="migas-grupo">${g.grupo}</a>
        <span class="migas-sep" aria-hidden="true">/</span>
        <a href="#${i.id}" data-ir="${i.id}" class="migas-actual" aria-current="page">${i.t}</a>
      </nav>
      <div class="pant-cab"><h1>${i.t}</h1></div>
      ${i.c}
    </section>`
  )
).join('');

const html = `<!doctype html>
<html lang="es" data-tema="claro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cascarón · Sistema de diseño Colegio Albert Einstein v${VERSION}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${tokensCss}

/* ── Cascarón. Estilos de la propia página de revisión ───────────────────── */
*, *::before, *::after { box-sizing: border-box; }
/* La sombra de las capas flotantes se define una vez y se reutiliza. No es un
   token de color -no se mide contraste sobre ella- pero sí un valor del
   sistema: tres sombras distintas se notan. */
:root { --sombra-capa: 0 8px 24px rgba(0,0,0,.16); --sombra-aviso: 0 8px 24px rgba(0,0,0,.18);
  /* ── PROFUNDIDAD DEL MARCO ────────────────────────────────────────────────
     El marco y la barra se separan del contenido por ELEVACION, no por color.

     Sale de una medicion incomoda: en modo oscuro la pagina es casi negra, y
     CUALQUIER marco lo bastante oscuro para leer como modo oscuro queda a menos
     de 1,6:1 de ella. Da igual que sea azul o gris —se probaron los diez
     escalones de indigo y los catorce de negro—. La luminancia no puede
     separarlos ahi.

     La sombra si, porque no depende del contraste entre los dos colores: es
     una pista de profundidad, y funciona igual sobre negro que sobre blanco.

     DOS VALORES, no uno. En claro basta la sombra. En oscuro una sombra negra
     sobre casi negro no se ve, asi que se acompana de un FILETE CLARO en el
     canto que da al contenido: es como se dibuja el relieve en una interfaz
     oscura —luz arriba, sombra abajo—. */
  --sombra-marco: 2px 0 12px rgba(0,0,0,.18);
  --sombra-barra: 0 2px 10px rgba(0,0,0,.14);
  --canto-marco: none;
}
[data-tema='oscuro'], :root:not([data-tema]) {
  /* Mas opaca y con canto: sobre negro, una sombra al 18 % no existe. */
  --sombra-marco: 2px 0 16px rgba(0,0,0,.55);
  --sombra-barra: 0 2px 12px rgba(0,0,0,.45);
  --canto-marco: inset -1px 0 0 var(--marco-borde);
}

/* ── MOVIMIENTO — R27 ────────────────────────────────────────────────────────
   El sistema definia color, tipografia y espacio, pero no TIEMPO, asi que cada
   producto inventaba duraciones y reimplementaba prefers-reduced-motion regla
   a regla (R27, Control Administrativos 2026-08-10).

   La escala NO se invento: sale del inventario de lo que el catalogo ya
   animaba. Habia seis duraciones (.14/.15/.18/.22/.24/.3s) para tres
   intenciones, y se consolidan en tres pasos:

     rapida 140ms  microinteraccion: hover, opacidad, aparecer una capa
     media  180ms  lo normal: transform, plegados pequenos, dialogos
     lenta  220ms  paneles y lateral (los 220ms que Control Administrativos
                   midio en R26 siguen siendo 220ms)

   Las dos animaciones infinitas conservan su tiempo con nombre propio (giro
   del boton ocupado, onda del progreso indeterminado). La curva estandar es la
   que el sistema ya usaba en TODAS sus transiciones: ease. Cambiarla por otra
   es decision de diseno pendiente; el token es el asidero para ese dia.

   prefers-reduced-motion se resuelve AQUI y una sola vez: las duraciones caen
   a 0.01ms —no a 0: un transitionend que nunca llega cuelga a quien lo
   espera— y la PERMANENCIA del aviso no se toca, porque leer no es moverse y
   quien pide menos movimiento no pide menos tiempo de lectura. */
:root {
  --dur-rapida: 140ms;
  --dur-media: 180ms;
  --dur-lenta: 220ms;
  --dur-giro: 700ms;
  --dur-onda: 1300ms;
  --curva: ease;
  --curva-vaiven: ease-in-out;
  --curva-giro: linear;
  --permanencia-aviso: 5s;
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-rapida: 0.01ms;
    --dur-media: 0.01ms;
    --dur-lenta: 0.01ms;
    --dur-giro: 0.01ms;
    --dur-onda: 0.01ms;
  }
}

/* SOLO PARA EL LECTOR. Oculta a la vista sin sacar del árbol de accesibilidad.
   No es display:none ni visibility:hidden: los dos lo quitan también del
   lector, que es justo lo contrario de lo que hace falta.

   Los componentes la usaban desde el principio —«Cargando» del esqueleto, el
   «(se abre en una pestaña nueva)» del enlace externo, la etiqueta oculta del
   filtro de la tabla— y NO EXISTÍA en ninguna hoja. El texto salía en pantalla,
   suelto, sin que nadie entendiera de dónde venía.

   No lleva la propiedad clip, que esta obsoleta: clip-path con inset(50%) hace lo mismo y
   es lo que la especificación mantiene. */
.sr-solo {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
body {
  margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif;
  background: var(--fondo-pagina); color: var(--texto-principal);
  font-size: 15px; line-height: 1.45; transition: background var(--dur-media), color var(--dur-media);
}
h1,h2,h3,h4 { margin: 0; }
code { font-family: 'IBM Plex Mono', monospace; }

.envoltorio { max-width: 1180px; margin: 0 auto; padding: 0 24px 80px; }

/* Cabecera */
.cab {
  position: sticky; top: 0; z-index: 20;
  background: var(--marco-fondo); color: var(--marco-texto);
  padding: 12px 24px; display: flex; align-items: center; gap: 20px;
  border-bottom: 3px solid var(--marco-acento);
}
.cab h1 { font-size: 16px; font-weight: 600; }
.cab .ver { font-size: 12px; color: var(--marco-acento); font-family: 'IBM Plex Mono', monospace; }
.cab .sep { flex: 1; }
.conmutador {
  display: flex; background: var(--marco-item-activo); border-radius: 6px; padding: 4px; gap: 4px;
}
.conmutador button {
  font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  background: transparent; color: var(--marco-texto); border: 0;
  padding: 4px 12px; border-radius: 6px;
}
.conmutador button[aria-pressed="true"] { background: var(--marco-acento); color: var(--marco-item-activo); }
.conmutador button:focus-visible { outline: 2px solid var(--foco-en-marco); outline-offset: 2px; }

/* ── El cascarón usa la misma cáscara que la aplicación ──────────────────── */
.app.app-cascaron { min-height: 100vh; }
/* La lateral plegada NO puede recortar el panel flotante, que sale fuera de
   sus 56px. El recorte se limita al eje vertical. */
.app-cascaron .lat { position: sticky; top: 0; height: 100vh; overflow: visible; }
.app-cascaron .lat-nav { overflow-y: auto; overflow-x: visible; }
.app-cascaron .lat.colapsado .lat-nav { overflow: visible; }
.app-cascaron .app-main { min-height: 100vh; }
/* .top-cascaron y .top tenian la MISMA especificidad (0,1,0) y ganaba la
   ultima: la barra decia ser pegajosa y no lo era. Con las dos clases en el
   selector gana esta. sticky establece bloque contenedor igual que relative,
   asi que el escudo centrado en movil sigue en su sitio.
   scroll-margin-top reserva los 64px de la barra: sin el, tabular hacia arriba
   deja el elemento enfocado DEBAJO de la barra y eso incumple SC 2.4.11. */
.top.top-cascaron { position: sticky; top: 0; z-index: 20; }

/* ── REFLUJO — SC 1.4.10 ─────────────────────────────────────────────────────
   A 320px de ancho el armazón pedía 790px de mínimo y la página se desplazaba
   en horizontal 470px: la lateral se quedaba con 236 de 320 y dejaba 84 para el
   contenido, con el texto envolviendo a una palabra por línea.

   Dos culpables medidos: la lateral con ancho fijo de 236px que nunca colapsaba,
   y tres campos de filtro con min-width de 120px que nunca envolvían.

   La vista móvil NO resolvía esto: es un conmutador manual que mete la
   aplicación en un marco de 390×780. Es una simulación, no comportamiento
   responsivo. 320px es el umbral de la norma; 375 y 390 no lo son.

   El corte va en 700px porque por debajo de ahí la lateral de 236 más un
   contenido utilizable ya no caben a la vez. */
@media (max-width: 700px) {
  /* La lateral sale del flujo y entra con el botón, igual que en vista móvil. */
  .app-cascaron .lat { position: absolute; left: 0; top: 0; bottom: 0; z-index: 60;
    height: 100%; transform: translateX(-100%); transition: transform var(--dur-lenta) var(--curva); }
  .app-cascaron .lat:not(.colapsado) { transform: translateX(0); box-shadow: var(--sombra-capa); }
  /* R39: el velo EXISTE de verdad. El React lo pintaba con su onClick y la
     hoja no traia ni una regla: un div de 0x0 ni vela ni se puede pulsar, y
     el unico cierre con raton quedaba tapado por el propio cajon (z 60 sobre
     z 10). Receta del velo de siempre: fondo del marco con opacidad, bajo el
     cajon y sobre todo lo demas, incluida la barra. */
  .app-cascaron .velo { position: fixed; inset: 0; z-index: 55;
    background: var(--marco-fondo); opacity: .5; cursor: pointer; }
  .app.app-cascaron { position: relative; overflow-x: hidden; }
  /* Los filtros envuelven y encogen en vez de imponer 360px de mínimo. */
  .top-filtros { flex-wrap: wrap; }
  .top-filtros .campo { min-width: 0; }
  .top-filtros .cg { min-width: 0; flex: 1 1 120px; }
  /* El intercambio de los dos iconos del botón de plegar YA NO ESTÁ AQUÍ: vive
     pegado a sus reglas base, 500 líneas más abajo. Estar en dos sitios era el
     defecto R25 —a igual especificidad ganaba quien el extractor colocara
     después, y en el paquete ganaba la que no debía—. */
  /* La barra deja de tener altura fija: con los filtros envolviendo, 64px la
     obligaban a solaparse con el contenido de debajo. */
  .top.top-cascaron { height: auto; flex-wrap: wrap; row-gap: 8px; }
  /* El panel flotante del menú plegado NO tiene sentido con la lateral fuera de
     pantalla: se quedaba colgado sobre el contenido, y además su ancho de 216px
     no cabe en 320. */
  .app-cascaron .lat.colapsado .nav-hijos { display: none; }
}
.cat-cuerpo :where(a, button, input, select, textarea, [tabindex]) { scroll-margin-top: 72px; }

/* Grupos desplegables — icono + nombre + chevron.
   Comprimidos por defecto. Se abren al pasar el ratón, y el grupo de la página
   en curso queda FIJADO: no se cierra al salir el cursor. Un menú que se cierra
   bajo la página en la que estás obliga a buscarla otra vez. */
/* Sin margen propio: la separación la da el gap del contenedor. Con las dos
   cosas se contaba doble y los grupos quedaban a 8px. */
.nav-grupo { margin-bottom: 0; }
/* El titulo de grupo y el de rama son el mismo control. */
.nav-grupo-tit, .nav-rama-tit { width: 100%; background: transparent; border: 0; cursor: pointer;
  font: inherit; text-align: left; }
.nav-grupo-tit .nav-chev .ic { transition: transform var(--dur-media) var(--curva); transform: rotate(-90deg); }
.nav-grupo.abierto .nav-chev .ic { transform: rotate(0deg); }
/* grid-template-rows de 0fr a 1fr: lo único que anima hasta altura automática. */
/* El arbol tiene dos niveles y se comportan igual: una sola regla. */
.nav-hijos, .nav-nietos { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--dur-media) var(--curva); }
.nav-grupo.abierto .nav-hijos { grid-template-rows: 1fr; }
/* El padding va en los hijos, no en la caja: el padding de la caja NO lo
   recorta overflow, y un grupo cerrado se quedaba ocupando 8px. */
/* EL CONTENIDO PLEGADO SE OCULTA DE VERDAD. Con solo grid-template-rows:0fr y
   overflow:hidden los enlaces conservan tamaño cero pero siguen en el orden de
   tabulación y en el árbol de accesibilidad: son paradas de Tab invisibles
   mientras el botón anuncia aria-expanded="false".
   La visibilidad se retrasa hasta que acaba la animación de cierre y vuelve al
   instante al abrir, así que el plegado sigue viéndose igual. */
.nav-hijos-in { overflow: hidden; visibility: hidden; transition: visibility 0s var(--dur-media); }
.nav-grupo.abierto .nav-hijos-in { visibility: visible; transition: visibility 0s; }
.nav-hijos-in > .nav-hijo:first-child { margin-top: 4px; }
.nav-hijos-in > .nav-hijo:last-child { margin-bottom: 8px; }
/* El grupo fijado se marca: dice por qué está abierto mientras los demás no. */
.nav-grupo.fijo > .nav-grupo-tit { color: var(--marco-acento); opacity: 1; }
@media (prefers-reduced-motion: reduce) { .nav-hijos { transition: none; } }
/* Los dos niveles usan marco-nivel-1 y marco-nivel-2, medidos: el techo lo
   pone el acento dorado, que por debajo de #41507F dejaría de cumplir AA. */
.nav-hijos-in { background: var(--marco-nivel-1); }
.nav-nietos-in { background: var(--marco-nivel-2); }
.nav-rama { border-top: 1px solid var(--marco-borde); }
.nav-rama:first-child { border-top: 0; }
.nav-rama-tit .nav-chev .ic { width: 14px; height: 14px;
  transition: transform var(--dur-media) var(--curva); transform: rotate(-90deg); }
.nav-rama.abierta .nav-chev .ic { transform: rotate(0deg); }
.nav-rama.abierta .nav-nietos { grid-template-rows: 1fr; }
.nav-nietos-in { overflow: hidden; visibility: hidden; transition: visibility 0s var(--dur-media); }
.nav-rama.abierta .nav-nietos-in { visibility: visible; transition: visibility 0s; }
.nav-nieto { display: block; padding: 4px 8px 4px 56px; border-radius: 6px;
  text-decoration: none; color: var(--marco-texto); font-size: 12px;
  opacity: .78; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav-nieto:hover { background: var(--marco-item-activo); opacity: 1; }
.nav-nieto.activo { background: var(--marco-item-activo); opacity: 1;
  color: var(--marco-acento); font-weight: 500;
  box-shadow: inset 3px 0 0 var(--marco-acento); }
/* El segundo nivel TAMBIÉN vive en el panel flotante, con su propio fondo.
   Ocultarlo obligaría a desplegar la lateral solo para llegar a él. */
.lat.colapsado .nav-rama { border-top-color: var(--marco-borde); }

.nav-hijo { display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 4px 8px 4px 40px; border-radius: 6px; text-decoration: none;
  color: var(--marco-texto); font-size: 13px; opacity: .78; white-space: nowrap; }
.nav-hijo:hover { background: var(--marco-item-activo); opacity: 1; }
.nav-hijo.activo { background: var(--marco-item-activo); opacity: 1;
  color: var(--marco-acento); font-weight: 500;
  box-shadow: inset 3px 0 0 var(--marco-acento); }
/* PLEGADA: las subopciones no desaparecen, salen en panel FLOTANTE a la
   derecha del carril. Es como lo resuelven VS Code, Linear y Ant Design: con
   56px no cabe el texto, pero sí cabe al lado. Se puede elegir sin desplegar
   la lateral, y al elegir el panel se cierra y la lateral sigue plegada. */
.lat.colapsado .lat-leyenda { display: none; }
.nav-grupo { position: relative; }
.lat.colapsado .nav-hijos {
  position: absolute; left: 56px; top: 0; z-index: 50;
  min-width: 216px; grid-template-rows: 1fr;
  border-radius: 6px; box-shadow: var(--sombra-capa);
  border: 1px solid var(--marco-borde);
  opacity: 0; visibility: hidden; transform: translateX(-4px);
  transition: opacity var(--dur-rapida) var(--curva), transform var(--dur-rapida) var(--curva), visibility var(--dur-rapida); }
.lat.colapsado .nav-grupo.abierto .nav-hijos {
  opacity: 1; visibility: visible; transform: translateX(0); }
.lat.colapsado .nav-hijos-in { border-radius: 6px; }
/* El texto vuelve DENTRO del panel: la regla que lo oculta es para el carril
   de 56px, no para una capa que sale fuera y tiene sitio de sobra. */
.lat.colapsado .nav-hijos .nav-txt,
.lat.colapsado .nav-hijos .pt { display: block; }
.lat.colapsado .nav-hijos .nav-chev { display: grid; }
.lat.colapsado .nav-hijo { padding-left: 12px; }
.lat.colapsado .nav-nieto { padding-left: 28px; }
/* Los fondos del panel son los MISMOS que los del menú desplegado: el panel es
   el mismo menú en otro sitio, no otro componente. */
.lat.colapsado .nav-hijos-in { background: var(--marco-nivel-1); }
.lat.colapsado .nav-nietos-in { background: var(--marco-nivel-2); }
.lat.colapsado .nav-rama-tit { padding-left: 12px; }
/* El nombre del grupo solo se muestra en el panel: plegada no se ve en el carril. */
.nav-flot-tit { display: none; }
.lat.colapsado .nav-flot-tit { display: block; padding: 8px 12px;
  font-size: 12px; font-weight: 600; color: var(--marco-acento);
  border-bottom: 1px solid var(--marco-borde); }
@media (prefers-reduced-motion: reduce) {
  .lat.colapsado .nav-hijos { transition: none; }
}
.lat.colapsado .nav-grupo-tit { justify-content: center; padding-inline: 0; }

.pt { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.pt-decidir { background: var(--aviso-acento); }
/* Los tres viven SOBRE el marco oscuro y se pintaban con blanco translúcido.
   Los tokens para esto existen desde la v1.6.0 —se añadieron justo para las
   capas del marco— y el CSS nunca se cambió: el sistema tenía la respuesta
   escrita y seguía usando la mano.
   El del 62 % además era TEXTO, y un texto en rgba no está en ningún par del
   contrato: su contraste no lo medía nadie. Ahora es marco-texto-tenue, que
   sí está medido contra las tres capas del marco. */
.pt-pend { background: var(--marco-texto-tenue); }
.lat-leyenda { border-top: 1px solid var(--marco-borde); margin: 0 8px;
  padding: 12px 4px; font-size: 12px; color: var(--marco-texto-tenue);
  display: grid; gap: 4px; }
.lat-leyenda div { display: flex; align-items: center; gap: 8px; }

.cat-cuerpo { flex: 1; min-width: 0;
  padding: 24px max(32px, calc((100% - 1056px) / 2)) 80px;
  background: var(--fondo-pagina); }
.migas { display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 12px; margin-bottom: 8px; }
/* Los tres tramos son enlaces. El último, además, lleva aria-current="page":
   sigue siendo navegable pero el lector anuncia que es la página en curso. */
.migas a { color: var(--enlace); text-decoration: none; border-radius: 3px; }
.migas a:hover { text-decoration: underline; }
.migas a:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
.migas-sep { color: var(--texto-pista); }
.migas a.migas-actual { color: var(--texto-principal); font-weight: 500; }
.migas a.migas-actual:hover { color: var(--enlace); }
/* El nivel actual NO es enlace en el componente: un enlace a la pagina en la
   que ya estas no lleva a ninguna parte y quien tabula pasa por el sin ganar
   nada. La regla de arriba se queda para el catalogo, que si lo pinta como
   enlace por su navegacion interna. */
/* ───────────────────────────────────────────────────────────────────────────
   DIALOGO MODAL. Se apoya en <dialog> del navegador, que ya resuelve el foco
   inerte por detras, Escape y la capa superior. Aqui solo va el aspecto.

   El fondo del ::backdrop se resuelve como YA lo resuelve el velo del marco:
   token mas opacity, no rgba(). El candado de color lo caza al primer intento
   —rgba solo se admite en sombras— y tiene razon: un rgba a mano es un color
   que no pasa por ningun par verificado.
   Y el tono no se elige de nuevo: es el mismo marco-fondo al 50 % que ya usa
   el velo en vista movil. Dos velos del mismo sistema con distinto color serian
   dos decisiones donde solo hace falta una. */
.dialogo { border: 0; padding: 0; background: transparent; max-width: 100%;
  max-height: 100%; }
.dialogo::backdrop { background: var(--marco-fondo); opacity: .5; }
.dialogo-caja { background: var(--fondo-tarjeta); border-radius: 6px;
  box-shadow: var(--sombra-capa); width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 64px); display: flex; flex-direction: column; }
.dialogo-cab { padding: 20px 20px 0; }
.dialogo-tit { font-size: 20px; font-weight: 600; margin: 0;
  color: var(--texto-principal); }
/* Sin anillo al enfocar el titulo: se enfoca al ABRIR, no al tabular, y un
   anillo que aparece solo confunde. El foco sigue estando, que es lo que
   importa para el lector. */
.dialogo-tit:focus { outline: none; }
.dialogo-cuerpo { padding: 12px 20px; overflow-y: auto; min-height: 0;
  color: var(--texto-principal); }
/* El pie NO se desplaza con el cuerpo: los botones tienen que estar siempre a
   la vista, tambien en un dialogo largo. */
.dialogo-pie { display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px 20px; border-top: 1px solid var(--borde); }

.migas-tramo { display: inline-flex; align-items: center; gap: 8px; }
.migas > .migas-tramo > .migas-actual { color: var(--texto-principal); font-weight: 500; }
/* En un telefono las migas no caben con tres o mas niveles. Se ocultan los de
   mas atras A LA VISTA, no del lector: la ubicacion completa sigue siendo
   informacion aunque no quepa. */
@media (max-width: 640px) {
  .migas-tramo:has(> .migas-atras) { position: absolute; width: 1px; height: 1px;
    margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
/* ───────────────────────────────────────────────────────────────────────────
   CABECERA DE PANTALLA. Estaba en las 39 paginas del catalogo y NO viajaba:
   cada proyecto la montaba a mano y cada pantalla salia un poco distinta —una
   con linea, otra sin; una a 16px, otra a 24—. La deriva no se ve pantalla a
   pantalla, solo al ponerlas juntas, que es cuando ya cuesta arreglarla.

   Lo reporto Control Administrativos V2.0 con once pantallas montadas, y con
   el argumento que decide: el titulo de pantalla es el <h1> y debe haber UNO
   por pagina. Un componente lo garantiza; una nota en un comentario pidiendo
   que no se usen dos a la vez es disciplina, no mecanismo.

   La clase se renombra a pant- porque pag- es del catalogo y no viaja. */
.pant-cab { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid var(--borde); }
.pant-cab h1 { font-size: 28px; font-weight: 600; margin: 0; }
/* El titulo y la accion en la misma linea, y la accion a la derecha. Con la
   accion debajo, la vista arranca con un boton antes que con el contenido. */
.pant-fila { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.pant-desc { margin: 8px 0 0; color: var(--texto-secundario); max-width: 75ch; }
/* En movil la accion baja y ocupa el ancho: a 375px no cabe al lado del titulo
   sin partir una de las dos cosas. */
@media (max-width: 640px) {
  .pant-fila { flex-direction: column; }
  .pant-fila > .pant-accion { width: 100%; }
}

.pag-intro { font-size: 15px; color: var(--texto-secundario); max-width: 90ch; margin: 0 0 20px; }

.bloque { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 20px; margin-bottom: 8px; }
.muestra-fila { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; }
.mf { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.mf-et { font-size: 12px; color: var(--texto-secundario); line-height: 1.45; }
.btn-ic { display: inline-flex; align-items: center; gap: 8px; }
/* Misma trampa: un boton con icono lleva display propio y [hidden] no lo tapa. */
.btn-ic[hidden] { display: none; }
/* R51 · y el boton a secas tambien: .btn declara su display desde v1.41.1, asi
   que sin esto un <Boton hidden> se seguia viendo. Lo pidio el candado de la
   cascada, que es el unico que mira lo que NO se escribio. */
.btn[hidden] { display: none; }
.btn-solo-ic { padding-inline: 8px; }
.movil-btn-demo { max-width: 340px; display: flex; flex-direction: column; gap: 8px; }

/* Confirmación en línea */
.cf-demo { border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
/* La banda abre empujando: grid-template-rows de 0fr a 1fr es lo único que
   anima hasta altura automática sin fijar píxeles a mano. */
.cf-banda { display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-lenta) var(--curva); }
/* Lo encontro el candado OCULTABLE, y llevaba publicado desde que existe la
   banda. Colapsada a 0fr PARECE oculta —eso es lo que engañaba—, pero seguia
   en el arbol de accesibilidad: su region aria-live viva y sus botones
   alcanzables con el tabulador. Cerrada de verdad no la ve nadie. */
.cf-banda[hidden] { display: none; }
.cf-banda.abierta { grid-template-rows: 1fr; }
.cf-banda-in { overflow: hidden; }
.cf-caja { display: flex; align-items: center; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 16px;
  background: var(--error-fondo); border-bottom: 1px solid var(--borde);
  border-left: 4px solid var(--error-acento); }
.cf-banda.cf-aviso .cf-caja { background: var(--aviso-fondo); border-left-color: var(--aviso-acento); }
.cf-txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cf-txt strong { font-size: 15px; font-weight: 600; color: var(--error-texto); }
.cf-banda.cf-aviso .cf-txt strong { color: var(--aviso-texto); }
.cf-txt span { font-size: 12px; color: var(--error-texto); opacity: .85; }
.cf-banda.cf-aviso .cf-txt span { color: var(--aviso-texto); }
.cf-acciones { display: flex; gap: 8px; margin-left: auto; }
.cf-lista { background: var(--fondo-tarjeta); }
.cf-item { display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 0 16px; height: 44px; border-bottom: 1px solid var(--borde); }
.cf-item:last-child { border-bottom: 0; }
.cf-item.cf-marcada { background: var(--error-fondo); box-shadow: inset 3px 0 0 var(--error-acento); }
.cf-nom { font-size: 15px; }
.cf-meta { font-size: 12px; color: var(--texto-secundario); margin-left: 8px; }
@media (prefers-reduced-motion: reduce) { .cf-banda { transition: none; } }

/* Aviso temporal */
.av-botones { display: flex; gap: 8px; flex-wrap: wrap; }
/* Arriba a la derecha, por debajo de la barra superior. Es donde la vista
   vuelve tras pulsar, y no tapa el contenido que se acaba de tocar. */
.av-zona { position: fixed; right: 20px; top: 76px; z-index: 100;
  display: flex; flex-direction: column; gap: 8px; max-width: 380px; }
/* R29: las dos regiones hermanas de dentro —alert para el error, status para
   el resto—. Existen desde la carga aunque estén vacías: una región viva
   creada en el momento del fallo no la anuncian la mayoría de lectores. */
.av-grupo { display: flex; flex-direction: column; gap: 8px; }
.av { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 16px;
  border-radius: 6px; border-left: 4px solid; font-size: 13px;
  background: var(--fondo-tarjeta); box-shadow: var(--sombra-aviso);
  /* Entra deslizando 16px DESDE ARRIBA, que es de donde viene: aparecer de
     golpe se percibe como fallo de pintado. */
  transform: translateY(-16px); opacity: 0;
  transition: transform var(--dur-lenta) var(--curva), opacity var(--dur-lenta) var(--curva); }
.av-dentro { transform: translateY(0); opacity: 1; }
/* FILETE INTENSO Y FONDO TENUE, los dos. El aviso solo cambiaba el filete y se
   quedaba sobre fondo-tarjeta, así que en pantalla era una tarjeta blanca con
   una raya de color: no se parecía a lo que la tabla de tonos documenta ni al
   chip del mismo estado. El sistema describía una cosa y pintaba otra.

   El texto se queda en texto-principal y NO pasa a exito-texto. Medido: 12,03:1
   en el peor de los cuatro tonos frente a 7,82:1 del texto del estado. El chip usa
   el del estado porque es una etiqueta corta donde el color refuerza el
   significado; el aviso lleva una frase, y ahí manda la legibilidad. Los ocho
   pares están en el contrato. */
.av-exito { border-color: var(--exito-acento); background: var(--exito-fondo); }
.av-info  { border-color: var(--info-acento);  background: var(--info-fondo); }
.av-aviso { border-color: var(--aviso-acento); background: var(--aviso-fondo); }
.av-error { border-color: var(--error-acento); background: var(--error-fondo); }
.av-txt { flex: 1; line-height: 1.45; }
.av-accion { font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  background: transparent; border: 0; color: var(--enlace); text-decoration: underline;
  padding: 4px; border-radius: 6px; flex: none; }
.av-x { display: grid; place-items: center; background: transparent; border: 0;
  cursor: pointer; color: var(--texto-secundario); padding: 4px; border-radius: 6px; flex: none; }
.av-x:hover { color: var(--texto-principal); background: var(--fondo-encabezado); }
.av-x .ic { width: 16px; height: 16px; }
@media (max-width: 640px) { .av-zona { left: 16px; right: 16px; top: 68px; max-width: none; } }
@media (prefers-reduced-motion: reduce) { .av { transform: none; transition: opacity var(--dur-rapida) var(--curva); } }

/* Interruptor */
.sw-rejilla { display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 16px; }
.sw-fila { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
.sw-desh { cursor: not-allowed; }
/* PASTILLA: radio mayor que la mitad del alto. El sistema define 3 y 6, que son
   radios de esquina; una pastilla no es una esquina redondeada sino una forma.
   Queda admitido en el auditor como valor del sistema, no como número suelto.
   El barrido a la rejilla lo había llevado de 12px a 6px y le quitó la forma. */
.sw { width: 40px; height: 24px; flex: none; padding: 0; cursor: pointer;
  border: 1px solid var(--apagado-borde); border-radius: 999px;
  background: var(--apagado-fondo); position: relative;
  transition: background-color var(--dur-media) var(--curva), border-color var(--dur-media) var(--curva); }
/* La bolita NO usa la superficie: usa el token hecho para ir sobre SU vía.
   Con fondo-tarjeta quedaba a 1,19:1 sobre el rojo claro y a 1,17:1 sobre el
   rojo oscuro —invisible en los dos modos—. Ahora:
       apagado    apagado-bolita sobre apagado-fondo  5,62 claro · 7,98 oscuro
       encendido  accion-texto   sobre accion         5,75 claro · 7,34 oscuro
   El peor caso pasa de 1,17 a 5,62. */
.sw-bolita { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
  border-radius: 999px; background: var(--apagado-bolita);
  border: 1px solid var(--apagado-bolita);
  /* El desplazamiento y el color van al MISMO tiempo: desacompasados parecen fallo. */
  transition: transform var(--dur-media) var(--curva), background-color var(--dur-media) var(--curva), border-color var(--dur-media) var(--curva); }
.sw[aria-checked='true'] { background: var(--accion); border-color: var(--accion); }
.sw[aria-checked='true'] .sw-bolita { transform: translateX(16px);
  background: var(--accion-texto); border-color: var(--accion-texto); }
/* R41 · Estas tres reglas pedian el atributo disabled, y el componente usa
   aria-disabled a proposito —disabled sale del tabulador y su estado se vuelve
   indescubrible con teclado—. O sea que NO casaban nunca: el interruptor
   deshabilitado conservaba su color de encendido y solo se apagaba el rotulo. */
.sw:disabled, .sw[aria-disabled='true'] { cursor: not-allowed; background: var(--accion-deshabilitada); border-color: var(--borde-fuerte); }
.sw:disabled .sw-bolita, .sw[aria-disabled='true'] .sw-bolita { background: var(--texto-secundario); border-color: var(--texto-secundario); }
.sw:disabled[aria-checked='true'], .sw[aria-disabled='true'][aria-checked='true'] { background: var(--borde-fuerte); border-color: var(--borde-fuerte); }

/* R66 · CERRADO POR REGLA. No es apagado y no es deshabilitado, y confundirlos
   tiene consecuencia: deshabilitado se lee como «ahora no, vuelve luego» e
   invita a buscar la forma de encenderlo. Aqui el mensaje es el contrario —no
   se va a poder, nunca, mientras la regla siga— y quien reparte privilegios
   necesita entender por que su lista no coincide con la de al lado.
   Por eso NO se oculta la opcion y por eso el interruptor DESAPARECE: un
   control que no puede cambiar nunca no es un interruptor. En su hueco va el
   candado, que ocupa exactamente lo mismo para que la columna no baile.
   El motivo es la mitad del componente: un candado sin explicacion se lee como
   un fallo del sistema. */
.sw-cerrado { cursor: default; }
.sw-cerrado .sw-et { color: var(--texto-secundario); }
.sw-candado { width: 40px; height: 24px; flex: none; display: grid; place-items: center;
  color: var(--texto-pista); }
.sw-motivo { font-size: 12px; color: var(--texto-secundario); line-height: 1.5; }
.sw-txt { display: flex; flex-direction: column; gap: 4px; }
.sw-et { font-size: 15px; }
.sw-desh .sw-et { color: var(--texto-secundario); }
.sw-ayuda { font-size: 12px; color: var(--texto-pista); }
@media (prefers-reduced-motion: reduce) {
  .sw, .sw-bolita { transition: none; }
}

/* Selección múltiple */
.ms-grupo { border: 0; padding: 0; margin: 0; }
.ms-leyenda { font-size: 15px; font-weight: 600; padding: 0; margin-bottom: 4px; }
.ms-ayuda { font-size: 12px; color: var(--texto-pista); margin: 0 0 12px; }
.ms-lista { display: flex; flex-direction: column; gap: 4px; }
.ms-op { display: flex; align-items: center; gap: 12px; padding: 8px;
  border-radius: 6px; cursor: pointer; font-size: 15px; }
/* R101 · La opcion que el grupo NECESITA: se ve, no se cambia. Su ayuda dice
   por que — una casilla que no responde y no lo explica se lee como averia. */
.ms-op-fija { cursor: not-allowed; color: var(--texto-secundario); }
.ms-op:hover { background: var(--fondo-encabezado); }
.ms-op input { width: 16px; height: 16px; flex: none; accent-color: var(--accion); cursor: pointer; }
.ms-desh { cursor: not-allowed; color: var(--texto-secundario); }
.ms-desh input { cursor: not-allowed; }
.ms-desh em { margin-left: auto; font-style: normal; font-size: 12px; color: var(--texto-pista); }
.ms-mal input { outline: 2px solid var(--error-acento); outline-offset: 1px; }
.ms-todas { border-bottom: 1px solid var(--borde); border-radius: 6px 6px 0 0;
  margin-bottom: 8px; font-weight: 500; }
.ms-conteo { font-size: 12px; color: var(--texto-secundario); margin: 12px 0 0;
  padding-top: 12px; border-top: 1px dashed var(--borde); }
.ms-estados { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 4px; }

/* R69 · SEGMENTADO — dos o tres opciones excluyentes, en una sola linea.
   Lo pidio Control Administrativos V2.0: un dato sensible no se ve o no se ve,
   y tiene un punto medio —*****303— que es el que hace util el sistema. Con el
   interruptor, de dos posiciones, no se podia expresar sin mentir.
   NO es Seleccion multiple con modo unica: esa apila una fila por opcion y aqui
   el control se repite en cinco a diez filas de una tabla. Apilado son treinta
   filas para configurar cinco campos, y a 390px eso deja de ser una pantalla.
   Una ocupa ALTO por opcion y esta ocupa ANCHO: a diez repeticiones, eso decide
   si la pantalla existe.
   Los pares de color son los ya medidos: accion-texto sobre accion en la opcion
   elegida (5,75 claro · 7,34 oscuro), y texto-principal / texto-secundario
   sobre fondo-tarjeta en las demas. No entra ningun par nuevo. */
.sg { border: 0; padding: 0; margin: 0; min-width: 0; }
.sg-et { font-size: 13px; font-weight: 500; padding: 0; margin-bottom: 4px;
  color: var(--texto-principal); }
.sg-desh .sg-et { color: var(--texto-secundario); }
/* overflow hidden para que el relleno de la opcion elegida respete el radio de
   la barra: sin el, la esquina pintada se sale del filete y se ve un diente. */
.sg-barra { display: flex; align-items: stretch; overflow: hidden;
  border: 1px solid var(--borde-campo); border-radius: 6px;
  background: var(--fondo-tarjeta); }
/* flex-basis 0 y min-width 0: los tres segmentos reparten el ancho a partes
   iguales pase lo que pase dentro. Sin min-width 0 un ejemplo largo empuja y a
   390px la barra desborda la pagina, que es justo lo que R68 prohibe. */
.sg-op { flex: 1 1 0; min-width: 0; position: relative; display: flex;
  flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  min-height: 44px; padding: 8px 4px; cursor: pointer; text-align: center;
  transition: background-color var(--dur-rapida) var(--curva); }
.sg-op + .sg-op { border-left: 1px solid var(--borde-campo); }
.sg-op:hover { background: var(--fondo-encabezado); }
/* El boton de opcion se tapa, no se quita: display:none lo saca del orden de
   tabulacion y con el se van las flechas del teclado, que es lo unico que hace
   navegable un grupo de diez. Cubre el segmento entero para que el clic caiga
   donde se ve. */
.sg-in { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
  opacity: 0; cursor: pointer; }
.sg-txt { font-size: 13px; line-height: 1.3; color: var(--texto-principal); }
.sg-ej { font-size: 11px; line-height: 1.3; color: var(--texto-secundario);
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-op:has(.sg-in:checked) { background: var(--accion); }
.sg-op:has(.sg-in:checked) .sg-txt { color: var(--accion-texto); font-weight: 600; }
.sg-op:has(.sg-in:checked) .sg-ej { color: var(--accion-texto); }
/* El anillo va DENTRO: el segmento pega con el filete de la barra y por fuera
   lo recortaria el overflow del padre. */
.sg-op:has(.sg-in:focus-visible) { outline: 2px solid var(--foco); outline-offset: -2px; }
.sg-desh .sg-op, .sg-desh .sg-in { cursor: not-allowed; }
.sg-desh .sg-txt, .sg-desh .sg-ej { color: var(--texto-secundario); }
.sg-desh .sg-op:has(.sg-in:checked) { background: var(--accion-deshabilitada); }
.sg-desh .sg-op:has(.sg-in:checked) .sg-txt,
.sg-desh .sg-op:has(.sg-in:checked) .sg-ej { color: var(--accion-texto-desh); }
/* R66 · CERRADO POR REGLA, y aqui por NIVEL. El caso es de seguridad: quien
   reparte privilegios no puede conceder uno que lo iguale a el mismo, y eso no
   cierra el campo, cierra un nivel. El segmento NO desaparece —desaparecido, la
   lista no coincide con la de al lado y se lee como una carga a medias— y NO se
   pinta apagado —apagado se lee «ahora no, vuelve luego» e invita a encenderlo—.
   Deja de ser un control: sin boton de opcion detras, es texto con su motivo. */
.sg-op-cerrada { cursor: default; background: var(--fondo-encabezado); }
.sg-op-cerrada:hover { background: var(--fondo-encabezado); }
.sg-op-cerrada .sg-txt { color: var(--texto-secundario); }
.sg-candado { display: grid; place-items: center; color: var(--texto-pista); }
.sg-motivo { font-size: 11px; line-height: 1.3; color: var(--texto-secundario); }
/* Control entero cerrado: no hay barra que pintar, hay una razon que leer. */
.sg-cerrado { display: block; }
.sg-barra-cerrada { display: flex; align-items: center; gap: 8px;
  min-height: 44px; padding: 8px; border-radius: 6px;
  border: 1px dashed var(--borde-campo); background: var(--fondo-encabezado); }
@media (prefers-reduced-motion: reduce) {
  .sg-op { transition: none; }
}

/* Fecha */
.fc-campos { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.fc-campos .cg { width: 172px; flex: none; }
.fc-guion { color: var(--texto-pista); padding-bottom: 8px; display: grid; place-items: center; }
.fc-guion .ic { width: 16px; height: 16px; }
/* Cada campo lleva su icono de calendario. Como son de solo lectura, el icono
   es la única señal de que abren un calendario. */
input.fc-campo { padding-right: 32px;
  background-repeat: no-repeat; background-position: right 12px center;
  background-size: 16px 16px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236A6864' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='5' width='18' height='16' rx='2'/><path d='M3 10h18M8 3v4M16 3v4'/></svg>");
  cursor: pointer; }
[data-tema='oscuro'] input.fc-campo {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C3C1BD' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='5' width='18' height='16' rx='2'/><path d='M3 10h18M8 3v4M16 3v4'/></svg>");
}
/* El campo que se está eligiendo se marca: con dos campos y un calendario hay
   que saber cuál se va a rellenar. */
input.fc-campo.fc-activo { border-color: var(--accion); box-shadow: inset 0 0 0 1px var(--accion); }

.fc-zona { position: relative; }
.fc-cal { position: absolute; z-index: 40; top: calc(100% + 6px); left: 0;
  border: 1px solid var(--borde-campo); border-radius: 6px; overflow: hidden;
  background: var(--fondo-tarjeta); max-width: 560px;
  box-shadow: var(--sombra-capa); }
/* Los atajos viven DENTRO del calendario y en COLUMNA LATERAL, como en los
   selectores de periodo de Facebook o Analytics: debajo no se ven, y fuera
   obligarían a cerrar y reabrir para usarlos.
   Son <button> con apariencia de enlace: ACTÚAN, no navegan, y la regla del
   elemento Enlace dice que lo que actúa es un botón. La apariencia es de
   enlace porque es una lista de accesos, no una fila de acciones. */
.fc-cal-marco { display: flex; align-items: stretch; }
.fc-atajos { display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  padding: 16px; border-left: 1px solid var(--borde);
  background: var(--fondo-pagina); min-width: 152px; }
.fc-atajos-tit { font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .07em; color: var(--texto-secundario); margin-bottom: 4px; }
.fc-atajo { font: inherit; font-size: 13px; cursor: pointer; text-align: left;
  background: transparent; border: 0; padding: 4px 0;
  color: var(--enlace); border-radius: 6px; }
.fc-atajo:hover { text-decoration: underline; text-underline-offset: 2px; }
.fc-atajo:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
.fc-cal-pie { padding: 12px 16px; border-top: 1px solid var(--borde);
  background: var(--fondo-encabezado); font-size: 12px; color: var(--texto-secundario); }
.fc-cal-cab { display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 8px 12px; background: var(--fondo-encabezado);
  border-bottom: 1px solid var(--borde); }
.fc-meses { font-size: 13px; font-weight: 600; text-transform: capitalize; }
.fc-cal-cuerpo { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 16px; }
.fc-mes-tit { font-size: 12px; font-weight: 600; text-transform: capitalize;
  text-align: center; margin-bottom: 8px; }
.fc-sem, .fc-dias { display: grid; grid-template-columns: repeat(7,1fr); }
.fc-sem span { font-size: 12px; font-weight: 500; color: var(--texto-secundario);
  text-align: center; padding-bottom: 4px; }
.fc-d { height: 30px; font: inherit; font-size: 12px; cursor: pointer;
  background: transparent; border: 0; color: var(--texto-principal); border-radius: 6px; }
/* El hover es el del sistema, fondo-fila-hover, el mismo que la fila de tabla
   bajo el cursor. Antes usaba fondo-encabezado, un gris que no es un hover. */
.fc-d:hover { background: var(--fondo-fila-hover); }
/* Los días del mes vecino: visibles y pulsables pero atenuados. Es
   texto-secundario y NO texto-pista porque son fechas reales que se pueden
   elegir, y el uso declarado de texto-pista dice «nunca contenido real».
   Sus pares ya son bloqueantes en el candado (sobre tarjeta y sobre hover).
   Va ANTES de .fc-ini/.fc-fin para que el extremo gane el color si coincide. */
.fc-otro-mes { color: var(--texto-secundario); }
.fc-vacio { cursor: default; }
.fc-vacio:hover { background: transparent; }
/* El interior del tramo y los extremos NO se pintan igual: si no, no se sabe
   dónde empieza y dónde acaba. El interior va en el mismo hover del sistema. */
.fc-dentro { background: var(--fondo-fila-hover); border-radius: 0; }
.fc-ini, .fc-fin { background: var(--accion); color: var(--accion-texto); font-weight: 600; }
.fc-ini:hover, .fc-fin:hover { background: var(--accion-hover); }
.fc-ini { border-radius: 6px 0 0 6px; }
.fc-fin { border-radius: 0 6px 6px 0; }
.fc-ini.fc-fin { border-radius: 6px; }
/* El extremo previsualizado se pinta IGUAL que uno real: está enseñando lo que
   va a quedar. Antes usaba un azul más oscuro que aparecía de golpe. */
.fc-previo { background: var(--accion); }
.fc-resumen { font-size: 13px; color: var(--texto-secundario); margin: 16px 0 0; }
@media (max-width: 620px) { .fc-cal-cuerpo { grid-template-columns: 1fr; } }

/* Barra de progreso */
.pr-rejilla { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 20px; }
.pr-caja { display: flex; flex-direction: column; gap: 8px; }
.pr-cab { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; font-weight: 500; }
.pr { height: 8px; border-radius: 6px; background: var(--neutra-fondo);
  overflow: hidden; border: 1px solid var(--borde); }
.pr-relleno { height: 100%; background: var(--accion); transition: width var(--dur-lenta) var(--curva); }
.pr-exito { background: var(--exito-acento); }
.pr-error { background: var(--error-acento); }
.pr-indet { height: 100%; width: 34%; background: var(--accion);
  animation: pr-va var(--dur-onda) var(--curva-vaiven) infinite; }
@keyframes pr-va { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }
.pr-pie { font-size: 12px; color: var(--texto-secundario); }
.pr-pie-error { color: var(--error-texto); }
@media (prefers-reduced-motion: reduce) {
  .pr-indet { animation: none; width: 100%; opacity: .5; }
  .pr-relleno { transition: none; }
}
.pr-pasos { list-style: none; margin: 0; padding: 0; display: flex;
  flex-direction: column; gap: 0; }
.pr-paso { display: flex; gap: 12px; align-items: flex-start; padding-bottom: 20px;
  position: relative; }
.pr-paso:not(:last-child)::before { content: ''; position: absolute; left: 11px; top: 24px;
  bottom: 0; width: 2px; background: var(--borde); }
.pr-paso.pr-hecho:not(:last-child)::before { background: var(--exito-acento); }
.pr-punto { width: 24px; height: 24px; border-radius: 50%; flex: none; z-index: 1;
  display: grid; place-items: center; font-size: 12px; font-weight: 600;
  background: var(--neutra-fondo); color: var(--texto-secundario);
  border: 1px solid var(--borde-campo); }
.pr-hecho .pr-punto { background: var(--exito-acento); color: var(--texto-invertido); border-color: var(--exito-acento); }
.pr-hecho .pr-punto .ic { width: 14px; height: 14px; }
.pr-curso .pr-punto { background: var(--accion); color: var(--accion-texto); border-color: var(--accion); }
.pr-paso b { display: block; font-size: 15px; font-weight: 600; }
.pr-paso span { font-size: 12px; color: var(--texto-secundario); }
.pr-paso div b + span { display: block; }

/* ── VISTA MÓVIL ─────────────────────────────────────────────────────────
   Solo del catálogo: encierra la aplicación en un marco de 390x780 para verla
   como en un teléfono. No es una maqueta dibujada: es el catálogo entero
   dentro del ancho real, así que lo que se rompa, se rompe de verdad. */
[data-vista='movil'] body { background: var(--fondo-encabezado); padding: 24px 0; }
[data-vista='movil'] .app.app-cascaron {
  width: 390px; height: 780px; margin: 0 auto; overflow: hidden;
  border: 1px solid var(--borde-fuerte); border-radius: 6px;
  box-shadow: var(--sombra-capa); position: relative; }
/* La lateral sale de pantalla y vuelve con el botón: en 390px no caben las dos. */
[data-vista='movil'] .lat {
  position: absolute; left: 0; top: 0; bottom: 0; z-index: 60;
  transform: translateX(-100%); transition: transform var(--dur-lenta) var(--curva); height: 100%; }
[data-vista='movil'] .lat:not(.colapsado) { transform: translateX(0); }
[data-vista='movil'] .lat.colapsado { transform: translateX(-100%); }
/* En móvil no hay panel flotante: con la lateral fuera de pantalla no hay
   carril del que salir. La lateral se abre entera y se cierra al elegir. */
[data-vista='movil'] .lat.colapsado .nav-hijos { display: none; }
[data-vista='movil'] .lat:not(.colapsado) { width: 288px; }
[data-vista='movil'] .lat:not(.colapsado) .nav-txt,
[data-vista='movil'] .lat:not(.colapsado) .lat-id,
[data-vista='movil'] .lat:not(.colapsado) .lat-user-txt { display: block; }
/* Velo detrás de la lateral abierta: en móvil tapa contenido, y hay que poder
   cerrarla tocando fuera. */
[data-vista='movil'] .velo { position: absolute; inset: 0; z-index: 55;
  background: var(--marco-fondo); opacity: .5; }
[data-vista='movil'] .app-main { min-height: 0; height: 100%; overflow-y: auto; }
[data-vista='movil'] .top { position: sticky; top: 0; }
/* Los filtros globales no caben en fila: se deslizan. */
/* Un icono por vista: en móvil la hamburguesa es lo que la gente reconoce como
   «aquí está el menú». El de plegar panel no significa nada en un teléfono. */
/* El centrado es común a los dos; el display NO, porque es justo lo que decide
   cuál se ve. Estaban juntos en la misma regla —.ic-escritorio y .ic-movil
   compartiendo display:grid— y esa línea deshacía el display:none de la
   anterior: en escritorio salían el icono de plegar Y la hamburguesa a la vez.

   R25 · Y aun arreglado eso, el defecto siguió VIVO EN LA ENTREGA hasta la
   v1.18.1, aunque en el catálogo no se viera. La causa es la que importa:
   estas reglas empezaban por .ic-, y el extractor reparte las reglas entre
   elementos por su PRIMERA clase. ic está declarado como estructura del
   catálogo —el envoltorio del SVG en plantilla, que en React pone Icono—,
   así que no viajaba. Lo que sí viajaba era la consulta de móvil, porque
   aquella empieza por .top-plegar. Resultado exacto en el paquete: los dos
   iconos SOLO tenían reglas por debajo de 700px, y por encima ninguna, así que
   ambos caían a display por omisión y se pintaban juntos.

   Lo reportó Control Administrativos V2.0 con la medición hecha, y su
   diagnóstico era correcto de cabo a rabo.

   Dos cambios, y los dos son el mismo criterio:
   · Se acotan bajo .top-plegar, que es donde de verdad viven: no son iconos
     cualesquiera, son los dos del botón de plegar. Así viajan con el marco.
   · La consulta de móvil se trae AQUÍ, pegada a la base. Estaba a 500 líneas,
     y como tiene la misma especificidad, quien ganaba dependía del orden en
     que el extractor las colocara. Pegadas, el orden es un hecho y no una
     suerte. */
.top-plegar .ic-escritorio, .top-plegar .ic-movil { place-items: center; }
.top-plegar .ic-escritorio { display: grid; }
.top-plegar .ic-movil { display: none; }
@media (max-width: 700px) {
  .top-plegar .ic-escritorio { display: none; }
  .top-plegar .ic-movil { display: grid; }
}
[data-vista='movil'] .top-plegar .ic-escritorio { display: none; }
[data-vista='movil'] .top-plegar .ic-movil { display: grid; }
/* Los filtros globales se MUDAN al menú de usuario: en 390px, tres selectores
   en la barra dejan sin sitio al título y se deslizan mal. */
[data-vista='movil'] .top-filtros { flex-direction: column; gap: 12px; padding: 12px; width: 100%; }
[data-vista='movil'] .top-filtros .cg { width: 100%; }
[data-vista='movil'] .top-filtros .campo { width: 100%; min-width: 0; font-size: 16px; }
[data-vista='movil'] .us-menu { min-width: 264px; }
/* Los filtros globales tienen SU PROPIO desplegable, no van dentro del menú de
   usuario: son de la pantalla, no de la cuenta. Se elige y se cierra. */
/* El botón de filtros solo existe en móvil: en escritorio los filtros ya están
   a la vista en la barra y un desplegable sobraría. */
.fg { position: relative; display: none; }
[data-vista='movil'] .fg { display: block; }
/* Se abre hacia la DERECHA del botón. Anclado a la derecha se salía del marco,
   porque el botón de filtros vive a la izquierda de la barra. */
.fg-panel { position: absolute; z-index: 60; left: 0; top: calc(100% + 8px);
  width: max-content; max-width: 320px; min-width: 240px; padding: 4px;
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-campo); border-radius: 6px;
  box-shadow: var(--sombra-capa); }
.fg-panel .top-filtros { flex-direction: column; gap: 12px; padding: 12px; width: 100%; }
.fg-panel .cg { width: 100%; }
/* R22 · la barra tiene DOS rotuladores —.cg del catalogo y .campo-grupo de los
   componentes— y sus reglas solo alcanzaban al primero. Un SelectorBusqueda con
   rotulo mide 71,7px en una barra de 64: se sale por arriba y por abajo.
   Lo reporto Control Administrativos V2.0, que ya lo estaba apanando con
   .top-filtros. Que la clase de la barra no alcance al componente de la barra
   es un fallo nuestro, no un apano suyo. */
.top-filtros .campo-grupo { flex-direction: row; align-items: center; gap: 8px; min-width: 0; }
.top-filtros .campo-etiqueta { font-size: 12px; color: var(--texto-secundario); white-space: nowrap; }
.top-filtros .campo-grupo .campo { padding: 4px 8px; width: auto; min-width: 0; }
.fg-panel .campo { width: 100%; min-width: 0; font-size: 16px; }
#fg-btn.activo { color: var(--accion); background: var(--fondo-fila-hover); }
/* LA MARCA EN MÓVIL. Con la lateral fuera de pantalla, la barra superior es lo
   único que queda del marco: sin logo aquí la marca desaparece de toda la
   aplicación.
   Va el ESCUDO y no el lockup. Medido sobre los píxeles reales del PNG: el
   lockup lleva texto #1D1D1B que da 1,08:1 sobre el fondo oscuro —invisible—,
   mientras que el escudo es 62% blanco y da 15,55:1 en oscuro. Es el mismo
   activo que ya usa la lateral plegada, así que no añade ni activo ni fallo.
   Centrado en la PANTALLA, no entre los dos grupos de botones: el centro
   óptico de una barra de navegación es el del dispositivo. A 44px de alto mide
   36px de ancho y queda a 85px del grupo de la izquierda y a 55px del de la
   derecha, así que no colisiona ni con los filtros ni con las acciones. */
[data-vista='movil'] .top-marca { display: block; position: absolute;
  left: 50%; transform: translateX(-50%); border-radius: 6px; }
[data-vista='movil'] .top-marca img { display: block; height: 44px; width: auto; }
[data-vista='movil'] .top-marca:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }

/* ── VISTA APP MÓVIL ──────────────────────────────────────────────────────
   No es la web estrecha: es otra gramática. La navegación baja al pulgar en
   forma de pestañas, la lateral desaparece, y la barra superior pasa de
   cabecera web a barra de app —atrás y título—.

   data-app SE SUMA a data-vista='movil': hereda el marco de 390px y las
   reglas de ancho ya escritas, y aquí solo se cambia el cromo. */

/* ZONAS RESERVADAS DEL DISPOSITIVO. Arriba viven la barra de estado y la
   muesca de la cámara; abajo, la barra de gestos o los botones del sistema.
   Lo que se dibuje ahí queda tapado o es intocable, así que el contenido no
   entra: se reserva con relleno del marco.
   44px arriba y 36px abajo. iOS marca 34pt abajo y se redondea HACIA ARRIBA
   para seguir en la rejilla de 4 —pasarse deja aire, quedarse corto invade—. */
[data-app] .app.app-cascaron { padding: 44px 0 36px; }
.app-zona-arriba, .app-zona-abajo, .app-tabs { display: none; }
[data-app] .app-zona-arriba, [data-app] .app-zona-abajo {
  position: absolute; left: 0; right: 0; display: grid; place-items: center;
  background: var(--fondo-pagina); z-index: 45; }
[data-app] .app-zona-arriba { top: 0; height: 44px; }
[data-app] .app-zona-abajo { bottom: 0; height: 36px; }
[data-app] .app-camara { width: 96px; height: 24px; border-radius: 999px;
  background: var(--texto-principal); }
[data-app] .app-gestos { width: 136px; height: 4px; border-radius: 999px;
  background: var(--texto-secundario); }

/* La lateral no existe en la app: si se pudiera abrir habría dos navegaciones
   compitiendo y ninguna sería la de verdad. */
[data-app] .lat, [data-app] .velo,
[data-app] #plegar-cat, [data-app] #fg { display: none; }

/* PESTAÑAS. Se apoyan SOBRE la zona de gestos, nunca debajo. Cinco como
   máximo: a partir de ahí ni se leen las etiquetas ni se aciertan con el
   pulgar, y el sexto grupo entra en «Más». */
[data-app] .app-tabs { display: flex; position: absolute; left: 0; right: 0;
  bottom: 36px; z-index: 44; background: var(--fondo-tarjeta);
  border-top: 1px solid var(--borde); }

/* ───────────────────────────────────────────────────────────────────────────
   EN UN TELEFONO DE VERDAD las zonas del dispositivo NO se dibujan: existen.
   Lo de arriba es la SIMULACION del catalogo, que las pinta para que se vea
   donde no se puede poner nada. Un producto que las dibujara estaria tapando
   con un rectangulo gris justo la franja que el sistema operativo ya ocupa.

   Lo que un producto necesita es RESPETARLAS, y eso lo dan las variables de
   entorno del navegador. Sin esto, la barra de gestos del telefono se come la
   fila de pestanas y la ultima no se puede pulsar.

   La clase app-marco la pone el componente; data-app es el modo del catalogo.
   Las dos reglas conviven porque hacen cosas distintas en sitios distintos. */
.app-marco .app-tabs { display: flex; position: fixed; left: 0; right: 0;
  bottom: 0; z-index: 44; background: var(--fondo-tarjeta);
  border-top: 1px solid var(--borde);
  padding-bottom: env(safe-area-inset-bottom, 0px); }
/* Y arriba, la muesca de la camara. El relleno se suma al que ya tenga la
   barra, no lo sustituye. */
.app-marco .top { padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
/* El contenido termina POR ENCIMA de las pestanas. Sin esto, la ultima fila de
   una tabla queda debajo de la barra y parece que la lista se corta. */
.app-marco .app-contenido { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }
/* En la app no hay lateral: si se pudiera abrir habria dos navegaciones
   compitiendo y ninguna seria la de verdad. */
.app-marco .lat, .app-marco .velo, .app-marco .top-plegar { display: none; }
/* La lista de «Mas» se abre SOBRE las pestanas, no las sustituye: quien la
   abre tiene que seguir viendo donde estaba. Y termina por encima de la barra
   de gestos, igual que las pestanas. */
.app-marco .app-lista { position: fixed; left: 0; right: 0; z-index: 43;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px));
  background: var(--fondo-tarjeta); border-top: 1px solid var(--borde);
  box-shadow: var(--sombra-capa); max-height: 50vh; overflow-y: auto; }
.app-marco .app-lista[hidden] { display: none; }
.app-tab { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px; padding: 8px 4px;
  background: transparent; border: 0; cursor: pointer; min-height: 56px;
  color: var(--texto-secundario); font-size: 12px; font-weight: 500;
  font-family: inherit; }
/* §1.3 y SC 1.4.1: el activo no se distingue SOLO por color. Lleva el peso
   del icono relleno mediante el trazo más grueso y el texto en 600. */
.app-tab[aria-current='page'] { color: var(--accion); font-weight: 600; }
.app-tab[aria-current='page'] .ic { stroke-width: 2.2; }
.app-tab:focus-visible { outline: 2px solid var(--foco); outline-offset: -2px; }
.app-tab-txt { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* El contenido termina POR ENCIMA de las pestañas, que flotan sobre él: 57px
   de barra más aire. Lleva los dos atributos a propósito: la regla de móvil
   usa el atajo padding y va después en la hoja, así que con un solo atributo
   ganaba ella y el último bloque quedaba 9px por debajo de las pestañas. */
[data-vista='movil'][data-app] .cat-cuerpo { padding-bottom: 80px; }

/* BARRA DE APP. Atrás sustituye a hamburguesa y filtros; el escudo se queda.
   No lleva título: lo pone el h1 de la pantalla, y ponerlo en los dos sitios
   es decir lo mismo dos veces en 64px.
   El :not([hidden]) NO es adorno: display:grid gana al display:none que el
   navegador aplica por el atributo hidden, y sin él la flecha de atrás se veía
   también en las pantallas raíz, donde no hay a dónde volver. */
[data-app] .app-atras:not([hidden]) { display: grid; place-items: center;
  background: transparent; border: 0; cursor: pointer; padding: 8px;
  margin-left: -8px; border-radius: 6px; color: var(--texto-principal); }
[data-app] .app-atras:hover { background: var(--fondo-encabezado); }
[data-app] .app-atras:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
/* Las migas son la vuelta atrás de la web. En la app esa función la hace la
   flecha, y dejar las dos es tener dos caminos para lo mismo. */
[data-app] .migas { display: none; }

/* LISTA DE SECCIÓN. El patrón de la app es pestaña → lista → detalle, no una
   página larga. Es una lista de toque, con blanco de 48px. */
.app-lista { display: flex; flex-direction: column; }
.app-lista-it { display: flex; align-items: center; gap: 12px; padding: 12px 4px;
  min-height: 48px; background: transparent; border: 0; border-bottom: 1px solid var(--borde);
  cursor: pointer; text-align: left; font-family: inherit; font-size: 16px;
  color: var(--texto-principal); width: 100%; }
.app-lista-it:hover { background: var(--fondo-fila-hover); }
.app-lista-it:focus-visible { outline: 2px solid var(--foco); outline-offset: -2px; }
.app-lista-it .ic { color: var(--texto-secundario); flex: none; }
.app-lista-tx { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-lista-ch { flex: none; color: var(--texto-secundario); transform: rotate(-90deg); }
[data-vista='movil'] .cat-cuerpo { padding: 16px 12px 48px; }
[data-vista='movil'] .pag-cab h1 { font-size: 24px; }
/* §3.5 — bajo 640px el cuerpo y el texto de interfaz suben a 18px. */
[data-vista='movil'] .pag-intro,
[data-vista='movil'] .man-p,
[data-vista='movil'] .man-lista { font-size: 19px; }
[data-vista='movil'] .campo { font-size: 16px; }
/* Rejillas a una columna: en 390px dos columnas dan 170px por celda. */
[data-vista='movil'] .rejilla,
[data-vista='movil'] .campos-rejilla,
[data-vista='movil'] .sw-rejilla,
[data-vista='movil'] .tp-rejilla,
[data-vista='movil'] .tn-cuadricula,
[data-vista='movil'] .ep-rejilla,
[data-vista='movil'] .chip-sup,
[data-vista='movil'] .pr-rejilla,
[data-vista='movil'] .estado-rejilla,
[data-vista='movil'] .atajos,
[data-vista='movil'] .mal-rejilla,
[data-vista='movil'] .enl-comp { grid-template-columns: 1fr; }
/* La comparación mal/bien es una rejilla DENTRO de otra. La de fuera colapsaba
   y la de dentro no, así que en 390px sus dos pistas quedaban a 173px con un
   campo de 189px encima. Apiladas, el divisor pasa de vertical a horizontal. */
[data-vista='movil'] .mal-par { grid-template-columns: 1fr; }
[data-vista='movil'] .mal-caja.bien { border-left: 0; border-top: 1px solid var(--borde); }
[data-vista='movil'] .anatomia,
[data-vista='movil'] .sel-demo-fila,
[data-vista='movil'] .fc-cal-cuerpo { grid-template-columns: 1fr; }
[data-vista='movil'] .fc-cal { position: static; max-width: none; }
[data-vista='movil'] .fc-cal-marco { flex-direction: column; }
[data-vista='movil'] .fc-atajos { border-left: 0; border-top: 1px solid var(--borde); }
/* El aviso ocupa el ancho, como manda su propia regla en móvil. */
[data-vista='movil'] .av-zona { position: absolute; left: 12px; right: 12px;
  top: 76px; max-width: none; z-index: 70; }
[data-vista='movil'] .lienzo-movil { max-width: 100%; }
.sw-mini { width: 40px; height: 24px; }

/* ── Nada desborda la pantalla ───────────────────────────────────────────
   Regla del sistema: lo ancho se desplaza DENTRO de su caja; la página nunca
   se desplaza en horizontal. Las tablas de documentación no estaban envueltas
   en ningún contenedor, así que estiraban la página entera. Con display:block
   la propia tabla se convierte en su caja de desplazamiento. */
/* R42b: la cabecera CAE sobre sus columnas porque comparten layout. Antes
   thead y tbody eran display:table cada uno — DOS tablas independientes,
   cada una repartiendo columnas por su cuenta, y los rótulos no coincidían
   con las celdas (lo vio el responsable del consumidor a la primera). Con
   display:block en la tabla, el navegador envuelve AMBOS grupos en UNA tabla
   anónima: alineados por construcción, y el bloque se desplaza solo si hace
   falta. Y dentro de la envoltura —que ya resuelve el desbordamiento— vuelve
   a ser tabla plena a todo lo ancho. */
.tabla-simple, .tb-sub { display: block; overflow-x: auto; }
.tb-envoltura > .tabla-simple { display: table; width: 100%; min-width: 520px; }
/* P3 (R85) · EL SUELO DE 520px SE PUEDE QUITAR, Y SE QUITA DICIENDOLO.
   Lo pidio Control Administrativos y el motivo es bueno: su apano era sacar la
   tabla FUERA de .tb-envoltura para que no heredara el suelo, y eso depende de
   un detalle interno de esta cascada. El dia que este selector cambie, se les
   rompe y no se enteran. Un contrato que se descubre leyendo la hoja no es un
   contrato.
   520px es un suelo BUENO por omision: una tabla de datos por debajo de eso
   apelmaza las columnas y se lee peor desplazandola que estrujandola. Pero para
   CONFIGURAR no vale —se pierde de vista la fila mientras se pulsa la columna—
   y esa es una decision del que monta la pantalla, no nuestra.
   Con tabla-libre la tabla NO tiene suelo, y la contrapartida es suya: las
   celdas tienen que poder encoger. Ahi es donde paga el flex 1 1 0 con
   min-width 0 del Segmentado.
   Va en las dos posiciones a proposito: dentro de la envoltura gana por
   especificidad (0,3,0 contra 0,2,0), y suelta deja dicho que tampoco lo tiene
   —que hoy es cierto por el display:block de arriba, pero por accidente—. */
.tabla-simple.tabla-libre { min-width: 0; }
.tb-envoltura > .tabla-simple.tabla-libre { min-width: 0; }
/* Los hijos de una rejilla o de un flex no bajan de su contenido si no se les
   dice: es el mismo motivo por el que las muestras de color desbordaban. */
.cat-cuerpo, .pagina, .bloque, .app-main { min-width: 0; }
[data-vista='movil'] .muestra-fila > *,
[data-vista='movil'] .op-fila > *,
[data-vista='movil'] .fila-demo > * { max-width: 100%; }
[data-vista='movil'] .codigo, [data-vista='movil'] .cod-pre { max-width: 100%; }

/* Estados de pantalla */
.ep-rejilla { display: grid; grid-template-columns: repeat(auto-fit,minmax(232px,1fr)); gap: 12px; }
.ep-caja { border: 1px solid var(--borde); border-radius: 6px; overflow: hidden;
  display: flex; flex-direction: column; }
.ep-et { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
  color: var(--texto-secundario); padding: 8px 12px; background: var(--fondo-encabezado);
  border-bottom: 1px solid var(--borde); }
.ep-cuando { font-size: 12px; color: var(--texto-pista); margin: 0;
  padding: 8px 12px; border-top: 1px dashed var(--borde); }
.ep { flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center; gap: 8px; padding: 24px 16px;
  background: var(--fondo-tarjeta); min-height: 168px; }
.ep-cargando { align-items: stretch; justify-content: flex-start; gap: 12px; }
/* Sin display propio el icono queda en linea y arrastra el hueco del
   descendiente debajo: el estado vacio salia descentrado en cuanto la pagina
   que lo montaba no fijaba nada. Misma familia que el .btn de la v1.41.0. */
.ep-ico { color: var(--texto-pista); display: grid; place-items: center; }
.ep-ico .ic { width: 32px; height: 32px; }
/* Solo error y sin permiso toman color: los demás no son incidencias. */
.ep-ico-error { color: var(--error-acento); }
.ep-ico-sin-permiso { color: var(--aviso-acento); }
.ep-titulo { font-size: 15px; font-weight: 600; margin: 0; max-width: 28ch; }
.ep-linea { font-size: 13px; color: var(--texto-secundario); margin: 0; max-width: 34ch; line-height: 1.5; }
.ep-mini { font-size: 12px; color: var(--texto-secundario); }
.ep-ambitos { display: grid; grid-template-columns: repeat(auto-fit,minmax(250px,1fr)); gap: 20px; }
.ep-ambito { display: flex; flex-direction: column; gap: 8px; }
.ep-marco-demo { border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
.ep-mini-cab { height: 34px; background: var(--marco-fondo); }
.ep-ambito .tn .ep { min-height: 128px; }

/* Paginación */
/* Todo el bloque en rejilla de 4. */
.pg-demo { display: flex; align-items: center; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; }
.pg-demo-mini { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.pg-variantes { display: grid; grid-template-columns: repeat(auto-fit,minmax(252px,1fr)); gap: 20px; }
.pg-var { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.pg-pos { font-size: 12px; color: var(--texto-secundario); padding: 4px 8px; }
.pg-var .pgn-btn { cursor: default; }

/* Tabla de datos */
.tb-barra { display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
/* Envuelven: en 373px la fila de búsqueda + tamaño + conteo mide 406px y
   estiraba la página. Y el buscador encoge en vez de imponer su ancho. */
.tb-barra-izq, .tb-barra-der { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
.tb-barra-izq { min-width: 0; }
.tb-buscar { min-width: 0; flex: 1 1 180px; }
.tb-buscar input.campo.sel-in { min-width: 0; width: 100%; }
.tb-mini { display: flex; flex-direction: column; gap: 4px; }
.tb-mini span { font-size: 12px; font-weight: 500; color: var(--texto-secundario); }
.tb-mini .campo { font-size: 13px; padding: 4px 8px; min-width: 92px; }
.tb-conteo { font-size: 12px; color: var(--texto-secundario); padding-bottom: 8px; }

.tb-cols-menu { position: relative; }
.tb-cols-panel { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px);
  min-width: 210px; padding: 4px; background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-campo); border-radius: 6px;
  box-shadow: var(--sombra-capa); }
.tb-col-op { display: flex; align-items: center; gap: 8px; padding: 8px 8px;
  border-radius: 6px; font-size: 13px; cursor: pointer; }
.tb-col-op:hover { background: var(--fondo-encabezado); }
.tb-col-op.fija { cursor: not-allowed; color: var(--texto-secundario); }
.tb-col-op em { margin-left: auto; font-style: normal; font-size: 12px;
  color: var(--texto-pista); text-transform: uppercase; letter-spacing: .06em; }
.tb-col-op input { accent-color: var(--accion); width: 15px; height: 15px; }
.tb-col-reset { width: 100%; margin-top: 4px; padding: 8px; font: inherit; font-size: 12px;
  cursor: pointer; background: transparent; border: 0; border-top: 1px solid var(--borde);
  color: var(--enlace); }

/* R49 · EL CONTENEDOR DEL COMPONENTE, QUE NO DESLIZA.
   La barra, la tira de filtros, la tabla y el pie son HERMANOS aqui dentro, y
   el unico que lleva overflow es .tb-envoltura, que solo envuelve la tabla. Asi
   el buscador, el Mostrar, Filtros, Columnas, CSV, el rango y la paginacion se
   quedan quietos mientras se mira una columna de la derecha.
   min-width: 0 para que pueda encoger dentro de un flex o un grid: sin eso el
   contenido ancho empuja al padre y la barra horizontal sale en la PAGINA. */
.tb-bloque { min-width: 0; }
.tb-envoltura { overflow-x: auto; border: 1px solid var(--borde); border-radius: 6px; }
.tb { width: 100%; border-collapse: collapse; font-size: 15px; background: var(--fondo-tarjeta); }
.tb-th { background: var(--fondo-encabezado); text-align: left; padding: 0;
  white-space: nowrap; border-bottom: 1px solid var(--borde); }
.tb-orden { display: flex; align-items: center; gap: 4px; width: 100%; padding: 8px 12px;
  font: inherit; font-size: 15px; font-weight: 500; cursor: pointer;
  background: transparent; border: 0; color: var(--texto-principal); text-align: left; }
.tb-orden:hover { color: var(--accion); }
.tb-orden.activo { color: var(--accion); }
.tb-flecha { font-size: 12px; width: 10px; }
.tb-th.tb-num .tb-orden { justify-content: flex-end; }
/* UN DATO, UNA LÍNEA. (R86, v1.61.0) La celda de datos NO PARTE el texto.
   Lo reportó Control Administrativos con la medida hecha, y medido aquí en la
   hoja que viaja sale igual: en una columna estrecha, tres filas de la misma
   tabla median 54,7 · 34,0 · 72,3 px con 34 declarados, y en compacta 36,7 con
   28 declarados. La altura de fila deja de ser una altura y pasa a ser un
   mínimo.
   Partir no ganaba nada, y esa es la razón de fondo: .tb-envoltura YA desplaza
   en horizontal desde R49, así que el texto largo tiene a dónde ir. Sin nowrap
   ni siquiera se desplaza —el ejemplo compacto medía scrollWidth 419 sobre
   clientWidth 419—: el desbordamiento se estaba absorbiendo hacia abajo, en el
   único eje donde el componente había prometido una medida.
   Se desplaza la columna que se quiere leer, y las filas se mantienen a la
   altura que la densidad declara. */
.tb td { padding: 0 12px; height: 34px; border-top: 1px solid var(--borde);
  white-space: nowrap; }
/* DENSIDAD. El atributo va en <html> y no en la tabla: es GLOBAL. Un conmutador
   por tabla permitiría dos alturas de fila en la misma pantalla, y eso no se lee
   como preferencia sino como fallo. Los dos valores son los del preset —
   fila-comoda 34px, fila-compacta 28px—, ya definidos desde v1.0.0. */
[data-densidad='compacta'] .tb td { height: 28px; }
[data-densidad='compacta'] .hor-c { height: 28px; }
/* EN TÁCTIL LA DENSIDAD COMPACTA NO SE APLICA. Una fila de 28px no es un blanco
   que se acierte con el dedo: SC 2.5.8 pide 24px como mínimo absoluto y la
   práctica pide 44. Sin esta regla pasaba lo mismo pero POR ACCIDENTE —el
   contenido no cabía en 28 y la fila crecía sola a 45—, y lo que ocurre por
   accidente deja de ocurrir en cuanto alguien encoge el contenido. */
[data-vista='movil'][data-densidad='compacta'] .tb td { height: 44px; }
.tb-num { text-align: right; }
/* Columna de posición: estrecha, en secundario y sin botón de orden. Es un
   localizador para decir "mira la fila 7", no un dato que se compare. */
.tb-th-indice { width: 52px; }
.tb-th-indice .tb-th-txt { display: block; padding: 8px 12px; font-weight: 500; }
.tb-indice { text-align: right; color: var(--texto-secundario);
  font-size: 13px; width: 52px; }
.tb-acc { text-align: right; white-space: nowrap; }
/* Cebra: una fila blanca y la siguiente en fondo-fila-alt. */
.tb tbody tr.tb-alt { background: var(--fondo-fila-alt); }
/* El resaltado lleva FILETE, no solo fondo: medido, sobre la fila alterna el
   fondo solo cambia 1,04:1 y la mitad de las filas no responderían. */
.tb tbody tr:hover { background: var(--fondo-fila-hover); box-shadow: inset 3px 0 0 var(--accion); }
/* EL VACÍO NO ES UN DATO: es una frase, y vuelve a partir. Ya renunciaba a la
   altura de fila (height: auto), así que renuncia también al nowrap — si no,
   «Prueba con menos filtros, o quítalos todos» sale en una línea y obliga a
   desplazar una tabla que no tiene ni una fila que mirar. */
.tb-vacio { text-align: center; padding: 32px 16px !important; height: auto !important;
  font-size: 13px; color: var(--texto-secundario); line-height: 1.6; }
/* Y LA EXCEPCIÓN HAY QUE GANARLA, no solo declararla. Escrita dentro de la regla
   de arriba NO servía: .tb-vacio es una clase (100) y .tb td suma clase y tipo
   (101), así que el nowrap seguía ganando y el vacío salía en una línea. Lo sacó
   el candado de la cascada en rojo, a los once anchos, antes de que se viera en
   ninguna pantalla — que es justo para lo que está. Se declara con la misma
   forma que la regla que hay que vencer. */
.tb td.tb-vacio { white-space: normal; }
.tb-vacio strong { color: var(--texto-principal); }

/* Filtros por columna */
.tb-buscar .sel-caja { display: flex; }
.tb-buscar input.campo.sel-in { min-width: 230px; font-size: 13px; padding-block: 4px; }
#tb-filtros-btn.activo { border-color: var(--accion); color: var(--accion); }
.tb-fila-filtros .tb-f-celda { padding: 4px 8px; background: var(--fondo-encabezado);
  border-bottom: 1px solid var(--borde); }
/* R87 · EL FILTRO SOLO DECLARA LO QUE ES SUYO: llenar la columna.
   Llevaba ademas font-size: 12px, padding: 4px 8px y, en el select, su propia
   flecha a 13px. Ninguna de las tres se veia NUNCA aqui: empatan en
   especificidad con .campo y select.campo —una clase contra una clase— y el
   catalogo las anula por orden. Eran declaraciones muertas.
   Muertas aqui, y VIVAS en la entrega. El extractor agrupa por elemento, asi
   que .campo (Campo de texto) pasa a ir ANTES que .tb-f (Tabla de datos), el
   empate se resuelve al reves y el filtro salia a 12px con 26,73px de alto
   donde el catalogo lo enseña a 13px con 36,18. Medido en el navegador, con
   las dos hojas y el mismo marcado.
   No se arregla dandole mas especificidad: eso congelaria en la hoja un valor
   que esta pagina no ha mostrado nunca. Se arregla quitando lo que sobra, y
   entonces las dos hojas coinciden POR CONSTRUCCION, sin empate que resolver.
   Lo vigila verificar-empate.mjs sobre las combinaciones de clases que
   existen de verdad en el marcado. */
.tb-f { width: 100%; }

/* [hidden] tiene que ganar al display, o la tira de filtros activos ocupa
   16px vacia y se ve como una banda azul sin contenido. Lo reporto Control
   Administrativos V2.0 sobre nuestra propia demostracion. */
.tb-activos[hidden] { display: none; }
/* Panel de columnas. Mismo tratamiento que la tira de filtros: sin esto el
   [hidden] pierde contra el display y queda una banda vacia. */
.tb-columnas { padding: 12px; border-bottom: 1px solid var(--borde);
  background: var(--fondo-encabezado); }
.tb-columnas[hidden] { display: none; }
.tb-activos { display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
  margin-bottom: 8px; padding: 8px 8px; border-radius: 6px;
  background: var(--info-fondo); border-left: 3px solid var(--info-acento); }
.tb-act { display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
  color: var(--info-texto); background: var(--fondo-tarjeta);
  border: 1px solid var(--borde); border-radius: 3px; padding: 4px 4px 4px 8px; }
.tb-act b { font-weight: 600; }
.tb-act-x { display: grid; place-items: center; background: transparent; border: 0;
  cursor: pointer; color: var(--texto-secundario); padding: 4px; border-radius: 3px; }
.tb-act-x:hover { color: var(--error-texto); }
.tb-act-x .ic { width: 14px; height: 14px; }
.tb-act-todo { font: inherit; font-size: 12px; cursor: pointer; background: transparent;
  border: 0; color: var(--info-texto); text-decoration: underline; margin-left: 4px; }
.tb-vacio-quitar { font: inherit; font-size: 13px; cursor: pointer; background: transparent;
  border: 0; color: var(--enlace); text-decoration: underline; padding: 0; }

.tb-pie { display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.tb-rango { font-size: 12px; color: var(--texto-secundario); }
/* Componente Paginación. Las clases son suyas, no de la tabla: la tabla lo
   consume igual que cualquier otro listado. */
.tb-pag, .pgn { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
/* Rejilla de 4: padding 4px vertical y 8px horizontal. La altura fija de 28px
   manda sobre el alto; el padding queda declarado y en rejilla igualmente, y
   el centrado lo garantiza inline-flex y no el ajuste por defecto del botón. */
.pgn-btn { min-width: 28px; height: 28px; padding: 4px 8px; font: inherit; font-size: 12px;
  cursor: pointer; background: var(--fondo-tarjeta); color: var(--texto-principal);
  border: 1px solid var(--borde); border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center; }
.pgn-btn:hover:not(:disabled) { border-color: var(--accion); color: var(--accion); }
.pgn-btn.activa { background: var(--accion); color: var(--accion-texto); border-color: var(--accion); }
.pgn-btn:disabled, .pgn-btn[aria-disabled='true'] { color: var(--accion-texto-desh); cursor: not-allowed; }
.pgn-elip { color: var(--texto-pista); padding: 4px; display: inline-flex; align-items: center; }
/* Anterior y Siguiente llevan nombre visible, no solo el chevron. */
/* Declaraba gap SIN display, asi que la alineacion se la ponia .pgn-btn — la
   misma dependencia entre clases que dejo el boton de CSV apilado. Ahora se
   sostiene sola: usada suelta se comporta igual. */
.pgn-flecha { display: inline-flex; align-items: center; justify-content: center;
  gap: 4px; padding: 4px 12px; }
.pgn-flecha .ic { width: 14px; height: 14px; }
/* El chevron y el nombre van siempre juntos, en cualquier ancho: el chevron
   da la dirección de un vistazo y el nombre la nombra. */

/* Tabla con filas desplegables */
.tb-desp .tb-th-txt { display: block; padding: 8px 12px; font-weight: 500; }
.tb-th-chev { width: 42px; }

/* EL DISPARADOR DE ORDEN. No existia porque la tabla del catalogo es estatica:
   nunca hubo nada que pulsar. El componente si ordena, y su boton se quedaba
   sin estilo en cualquier proyecto que importara la hoja —salia con el aspecto
   de boton del navegador dentro del encabezado—.
   Se crea aqui, que es donde vive el estilo, y no en el componente: dos fuentes
   para lo mismo divergen. */
.tb-th-btn { display: flex; align-items: center; gap: 4px; width: 100%;
  font: inherit; color: inherit; text-align: inherit; background: none;
  border: 0; padding: 0; cursor: pointer; }
.tb-th-btn:hover .tb-th-txt { text-decoration: underline; }
/* La flecha ocupa sitio SIEMPRE, tambien sin ordenar: si apareciera al pulsar,
   el encabezado se movaria y la columna bailaria a cada clic. */
.tb-th-flecha { flex: none; width: 12px; color: var(--accion); }
.tb-chev-celda { width: 42px; padding: 0 !important; }
.tb-chev { width: 100%; height: 34px; display: grid; place-items: center;
  background: transparent; border: 0; cursor: pointer; color: var(--texto-secundario); }
.tb-chev:hover { color: var(--accion); }
.tb-chev .ic { width: 16px; height: 16px; transition: transform var(--dur-media) var(--curva); }
.tb-chev[aria-expanded='true'] .ic { transform: rotate(180deg); }
.tb-grupo.abierto { background: var(--fondo-fila-hover); }
.tb-grupo.abierto td { border-bottom: 0; }

/* EL PANEL DE DETALLE TAMPOCO ES UNA CELDA DE DATOS: lo llena el producto con
   lo que quiera —prosa, fichas, otra tabla— y no tiene altura declarada que
   proteger. Renuncia al nowrap igual que el vacío, y por la misma razón: aquí
   el nowrap no mantiene una promesa, solo se hereda hacia dentro y estira un
   panel que nadie midió. */
.tb-detalle > td { padding: 0 !important; height: auto !important; border-top: 0 !important;
  white-space: normal; }
/* grid-template-rows 0fr → 1fr es lo único que anima hasta altura automática
   sin tener que fijar la altura en píxeles a mano. */
.tb-desliza { display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-lenta) var(--curva); }
.tb-detalle.abierto .tb-desliza { grid-template-rows: 1fr; }
/* Mismo caso que el menú: sin ocultarlo, un lector de pantalla lee las
   sub-tablas de las seis filas mientras cada chevron dice aria-expanded=false. */
.tb-desliza-in { overflow: hidden; visibility: hidden; transition: visibility 0s var(--dur-lenta); }
.tb-detalle.abierto .tb-desliza-in { visibility: visible; transition: visibility 0s; }
.tb-sub { width: 100%; border-collapse: collapse; font-size: 13px;
  background: var(--fondo-pagina); }
.tb-sub th { text-align: left; font-weight: 500; font-size: 12px;
  color: var(--texto-secundario); padding: 8px 12px 8px 40px;
  border-bottom: 1px solid var(--borde); }
.tb-sub th:not(:first-child) { padding-left: 12px; }
/* LA SUB-TABLA SÍ, y no por simetría: tiene el MISMO defecto medido. Con el
   detalle a 240px, dos filas de 30px declarados medían 46,7 y 30,0. Y tiene la
   misma salida que la tabla grande —.tb-sub es display:block con
   overflow-x:auto, así que desplaza sola—, así que lo que se gana partiendo
   es cero y lo que se pierde es la altura. Lo declara EN LA CELDA a propósito:
   el white-space: normal del panel que la contiene se hereda, y un valor
   declarado en el propio elemento gana siempre a lo heredado — la prosa del
   panel parte y la sub-tabla no, sin depender del orden de las reglas. */
.tb-sub td { padding: 0 12px; height: 30px; border-bottom: 1px solid var(--borde);
  white-space: nowrap; }
.tb-sub .tb-sub-n { width: 52px; padding-left: 40px; text-align: right; }
.tb-sub tr:last-child td { border-bottom: 0; }
.tb-sub tbody tr:hover { background: var(--fondo-tarjeta); }

/* Tarjeta de persona */
.tp-rejilla { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 8px; }
.tp-rejilla-2 { grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); max-width: 560px; }
.tp-rejilla-1 { max-width: 300px; }
.tp { display: flex; gap: 12px; align-items: flex-start; padding: 12px 12px;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-left: 4px solid var(--borde-fuerte); border-radius: 6px; }
/* El estado va en el filete: con treinta tarjetas el chip es demasiado pequeño
   para barrerlo con la vista, y el filete recorre toda la altura. */
.tp-exito { border-left-color: var(--exito-acento); }
.tp-aviso { border-left-color: var(--aviso-acento); }
.tp-error { border-left-color: var(--error-acento); }
.tp-info  { border-left-color: var(--info-acento); }
.tp-pend  { border-left-color: var(--borde-fuerte); }
/* Inactivo: cambia la SUPERFICIE. Nunca la opacidad del texto. */
.tp-inact { background: var(--fondo-encabezado); border-left-color: var(--borde-fuerte); }

/* ── AVATAR ──────────────────────────────────────────────────────────────────
   UNO solo. Hasta v1.7.0 vivía en tres sitios con cuatro tamaños —30, 36, 42 y
   48px, uno de ellos fuera de rejilla—: el mismo defecto que ya costó tener dos
   paginaciones. Ahora es un componente con cuatro pasos, todos en rejilla de 4.

   El color NO significa nada. Es ayuda de reconocimiento en una lista larga, y
   por eso usa la paleta de IDENTIDAD y no la de estado: un avatar rojo diría
   que esa persona tiene un problema sin que nadie lo haya dicho. */
.avatar { border-radius: 50%; flex: none; overflow: hidden; display: grid;
  place-items: center; font-weight: 600; line-height: 1; user-select: none;
  background: var(--identidad-4); color: var(--identidad-texto); }
.avatar-s  { width: 24px; height: 24px; font-size: 12px; }
.avatar-m  { width: 32px; height: 32px; font-size: 13px; }
.avatar-l  { width: 40px; height: 40px; font-size: 16px; }
.avatar-xl { width: 48px; height: 48px; font-size: 19px; }
.avatar-1 { background: var(--identidad-1); }
.avatar-2 { background: var(--identidad-2); }
.avatar-3 { background: var(--identidad-3); }
.avatar-4 { background: var(--identidad-4); }
/* Ni foto ni nombre: silueta neutra. Es un marcador, no una persona inventada. */
.avatar-vacio { background: var(--fondo-encabezado); color: var(--texto-secundario); }
.tp-inact .avatar-vacio { background: var(--borde); }
/* La foto se recorta centrada y nunca se deforma. Si no carga, el navegador
   deja ver las iniciales que hay detrás. */
.av img, .avatar-silueta { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-marco { background: var(--marco-acento); color: var(--marco-fondo); }
.avatar-rejilla { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
.avatar-caso { display: flex; flex-direction: column; align-items: center; gap: 4px;
  font-size: 12px; color: var(--texto-secundario); }

.tp-txt { min-width: 0; flex: 1; }
.tp-nom { font-size: 15px; font-weight: 600; margin: 0 0 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-cargo { font-size: 12px; color: var(--texto-secundario); margin: 0 0 8px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-pie { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tp-hora { font-size: 12px; color: var(--texto-secundario); }
.chip.chip-pend { background: var(--fondo-encabezado); color: var(--texto-principal);
  border-color: var(--borde-fuerte); }
.chip.chip-inact { background: var(--borde); color: var(--texto-principal);
  border-color: var(--borde-fuerte); }
/* ───────────────────────────────────────────────────────────────────────────
   PANEL DE PRIVILEGIOS · clases .pp-*
   Reparte permisos por modulo. Aqui SOLO vive el andamiaje de la lista: el
   interruptor, el chip y el boton de dentro son los del sistema, importados.
   Si esto tuviera muchas reglas seria senal de que se esta reconstruyendo en
   vez de componer, que es la regla 1 de la politica.
   ─────────────────────────────────────────────────────────────────────────── */
.pp { display: flex; flex-direction: column; gap: 16px; }
.pp-cab { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.pp-lista { display: flex; flex-direction: column; gap: 4px; }

.pp-mod { background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; }
.pp-mod.pp-abierto { border-color: var(--borde-fuerte); }

/* La cabecera es UN boton: toda la fila abre. Un chevron de 20px es un blanco
   pequeno para el dedo, y aqui hay diez seguidos. */
.pp-mod-cab { display: grid; grid-template-columns: 20px 1fr auto auto; gap: 12px;
  align-items: center; width: 100%; padding: 11px 14px; background: transparent;
  border: 0; font: inherit; text-align: left; cursor: pointer; border-radius: 6px;
  color: var(--texto-principal); }
.pp-mod-cab:hover { background: var(--fondo-encabezado); }
.pp-mod-cab:focus-visible { outline: 2px solid var(--foco); outline-offset: -2px; }
.pp-chev { display: grid; place-items: center; color: var(--texto-secundario);
  transition: transform var(--dur-media) var(--curva); }
.pp-abierto .pp-chev { transform: rotate(180deg); }
.pp-mod-nom { font-size: 15px; font-weight: 500; min-width: 0; }
.pp-marca { margin-left: 8px; }
.pp-tags { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; max-width: 46ch; }
.pp-conteo { font-size: 12px; color: var(--texto-secundario);
  font-variant-numeric: tabular-nums; white-space: nowrap; }

/* El sangrado alinea los privilegios bajo el nombre del modulo, no bajo el
   chevron: lo que se lee en vertical son los permisos, no las flechas. */
.pp-mod-cuerpo { padding: 4px 14px 12px 46px; border-top: 1px solid var(--borde); }
.pp-mod-cuerpo[hidden] { display: none; }

.pp-priv { padding: 8px 0; border-bottom: 1px solid var(--borde); }
.pp-priv:last-child { border-bottom: 0; }
/* El privilegio base cierra su bloque con filete fuerte: manda sobre los de
   abajo y la linea lo dice sin una palabra mas. */
.pp-priv-base { border-bottom-color: var(--borde-fuerte); }
/* Sin el base, el resto del modulo no se aplica: se atenua para que se vea que
   estan ahi pero no rigen. No se ocultan — desaparecer un permiso concedido
   haria pensar que se perdio. */
.pp-sin-base .pp-priv:not(.pp-priv-base) { opacity: .5; }

.pp-aviso { display: flex; align-items: center; gap: 8px; margin: 12px 0 0;
  padding: 8px 12px; border-radius: 6px; font-size: 13px;
  background: var(--aviso-fondo); color: var(--aviso-texto);
  border-left: 3px solid var(--aviso-acento); }

.pp-grupo { margin-top: 12px; padding-top: 4px; border-top: 1px dashed var(--borde); }
.pp-grupo-tit { margin: 8px 0 4px; font-size: 12px; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: var(--texto-secundario); }

/* R99 · LOS TRES MOTIVOS POR LOS QUE UN PRIVILEGIO NO SE REPARTE, y cada uno
   con su dibujo. Con uno solo los tres se leen igual, y los tres invitan a lo
   mismo: a insistir. Lo trajo Control Administrativos citando nuestro propio
   codigo — «un apagado invita a encenderlo».
     · cerrado   candado    · no se podra conceder nunca      → olvidalo
     · ajeno     usuarios   · existe, pero usted no lo tiene  → hable con quien si
     · pendiente informacion· todavia no existe en el sistema → espere
   El icono cambia, la etiqueta cambia y el motivo se lee debajo. Ninguno se
   pinta apagado: apagado es «ahora no, vuelve luego», que es justo lo que aqui
   no se quiere decir. */
.pp-cerrado { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: start; }
.pp-cerrado-ic { display: grid; place-items: center; width: 40px; height: 24px; }
.pp-cerrado-txt { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.pp-cerrado-nom { font-size: 15px; color: var(--texto-secundario); }
.pp-cerrado-eti { display: flex; gap: 4px; flex-wrap: wrap; }
.pp-cerrado-motivo { font-size: 12px; color: var(--texto-secundario); line-height: 1.5; }
/* El definitivo se apaga del todo; el ajeno y el pendiente conservan el color
   del texto, porque en los dos hay algo que hacer: preguntar, o esperar. */
.pp-no-cerrado .pp-cerrado-ic { color: var(--texto-pista); }
.pp-no-ajeno .pp-cerrado-ic { color: var(--info-acento); }
.pp-no-pendiente .pp-cerrado-ic { color: var(--texto-secundario); }

/* R99 · «va con Editar»: lo que se mueve junto se dice ANTES de pulsar, no
   despues de ver saltar el otro interruptor. */
.pp-junto { font-size: 12px; color: var(--texto-secundario); font-weight: 400; }

/* R98 · Los niveles cuelgan del privilegio que los gobierna, sangrados bajo su
   interruptor: se lee «ver, y de lo que ve, el documento en parcial». Sueltos
   parecerian permisos aparte. */
.pp-niveles { display: flex; flex-direction: column; gap: 12px;
  margin: 12px 0 4px 52px; padding-left: 12px;
  border-left: 1px solid var(--borde); }

.pp-pie { display: flex; align-items: center; justify-content: flex-end; gap: 12px;
  padding-top: 4px; }
.pp-pie-txt { font-size: 13px; color: var(--texto-secundario); }

@media (prefers-reduced-motion: reduce) { .pp-chev { transition: none; } }
/* R98 · MOVIL. Lo pidieron por esto: la tabla que tenian no cabia a 390px y era
   su motivo principal para cambiar. Aqui no hay tabla, asi que no hay nada que
   desplazar — pero si tres cosas que apretar.
   El sangrado cae a 20px: con 46 no queda ancho para el nombre del privilegio.
   Los chips de la cabecera se van: el conteo «4 de 6» dice lo mismo en una
   linea y no parte el titulo del modulo en tres. */
@media (max-width: 900px) {
  .pp-mod-cab { grid-template-columns: 20px 1fr auto; }
  .pp-tags { display: none; }
  .pp-mod-cuerpo { padding-left: 20px; }
}
@media (max-width: 560px) {
  /* Los niveles pierden el sangrado y se quedan con el filete: a 390px, 52px de
     margen se comen un tercio de la pantalla. */
  .pp-niveles { margin-left: 0; }
  .pp-mod-cab { padding: 12px; gap: 8px; }
  .pp-mod-cuerpo { padding: 4px 12px 12px; }
  /* El pie deja de ir a la derecha: en una columna, un boton pegado al borde
     derecho se alcanza peor con el pulgar que uno a lo ancho. */
  .pp-pie { flex-direction: column; align-items: stretch; gap: 8px; }
  .pp-pie-txt { text-align: center; }
}

/* R88 · IDENTIDAD EN EL CHIP — porque la leyenda va en chips, y si las dos
   paletas no coinciden, la leyenda MIENTE. Lo dijeron ellos y es exacto.
   Aqui el filete se queda en 3px, y no por descuido: en el horario los 6px
   distinguen identidad de estado dentro de una rejilla donde conviven; un chip
   dice su sede EN EL TEXTO y no compite con ninguna alarma en la misma linea.
   Un filete de 6px en una ficha de 22px de alto la desequilibra.

   R95 · DOS CLASES EN EL SELECTOR, Y border-left-color EN VEZ DE border-color.
   Nacieron con una sola clase y con el atajo, y los tags salian GRISES: .chip
   declara border-left: 3px solid currentcolor mas abajo en la hoja, empata en
   especificidad —una clase cada una— y al ganar por orden el atajo REESCRIBE el
   color con currentcolor, que aqui es texto-principal. Lo midio Control
   Administrativos: el borde pintado era rgb(44,42,37) y no #0E6F63.
   Los tonos semanticos se salvaban POR ACCIDENTE: el extractor emite .chip-exito
   dos veces y la segunda cae despues de .chip. Apoyarse en eso no es tener una
   regla, es tener suerte.
   Se arregla con ESPECIFICIDAD y no con orden —dos clases ganan siempre a una—
   y declarando el lado que de verdad se pinta. Es la leccion de R87 aplicada a
   nuestro propio codigo. */
.chip.chip-identidad-1 { background: var(--fondo-encabezado); color: var(--texto-principal);
  border-left-color: var(--identidad-1); }
.chip.chip-identidad-2 { background: var(--fondo-encabezado); color: var(--texto-principal);
  border-left-color: var(--identidad-2); }
.chip.chip-identidad-3 { background: var(--fondo-encabezado); color: var(--texto-principal);
  border-left-color: var(--identidad-3); }
.chip.chip-identidad-4 { background: var(--fondo-encabezado); color: var(--texto-principal);
  border-left-color: var(--identidad-4); }
/* Solo para el ejemplo de lo que NO se debe hacer. */
.tp-opaca { opacity: .5; }

/* Tarjeta normal */
/* R61 · LA CUADRICULA SE ENTREGA.
   Estaba resuelta aqui y NO viajaba: se llamaba .tn-rejilla, y el extractor
   trata como andamiaje del catalogo toda clase acabada en -rejilla —lo hace
   por una razon buena, ahi viven las rejillas de muestras—. Asi que el
   catalogo tenia la disposicion resuelta y cada producto la rehacia. Con
   nombre propio sale del filtro y viaja.
   auto-fill y no auto-fit: con auto-fit, dos tarjetas sueltas se estiran a
   media pantalla cada una. Con auto-fill conservan su ancho y la cuadricula se
   lee como una cuadricula aunque este a medias.
   Los hijos con min-width 0 porque sin eso un titulo largo estira su columna
   y rompe el reparto. */
.tn-cuadricula { display: grid; grid-template-columns: repeat(auto-fill,minmax(230px,1fr)); gap: 12px; }
.tn-cuadricula > * { min-width: 0; }
/* R56 · La pulsable es un <button>, y un boton NO hereda tipografia.
   Sin font/text-align/padding/margin el navegador impone su fuente
   (~13,3px Arial), centra el texto y anade relleno propio. Aqui no se veia
   porque el catalogo la pintaba como <a>, y un ancla si hereda. */
.tn { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; display: flex; flex-direction: column; text-decoration: none;
  color: var(--texto-principal);
  font: inherit; text-align: left; padding: 0; margin: 0;
  transition: border-color var(--dur-rapida) var(--curva); }
.tn-cab { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 12px 12px; border-bottom: 1px solid var(--borde); }
/* R58 · La hoja estilaba h4 y el componente emitia h3, asi que el titulo de la
   tarjeta salia SIN ESTILO en cada producto —con el h3 por defecto del
   navegador— mientras el catalogo se veia bien. Mismo origen que R56: la hoja
   se escribio mirando el catalogo. Ahora la hoja NO ELIGE el nivel: estila la
   ranura, y el nivel lo pone quien conoce la jerarquia de su pagina. */
.tn-cab :is(h2,h3,h4), .tn-cuerpo :is(h2,h3,h4) { font-size: 15px; font-weight: 600; margin: 0 0 4px;
  transition: color var(--dur-rapida) var(--curva); }
.tn-cab :is(h2,h3,h4) { margin: 0; }
.tn-cuerpo { padding: 12px; flex: 1; }
.tn-cuerpo p { margin: 0; font-size: 13px; color: var(--texto-secundario); line-height: 1.55; }
.tn-pie { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 12px;
  border-top: 1px solid var(--borde); }
/* R57 · EL MEDIO. La proporcion la declara el sistema, no el producto: con
   imagen dentro, un recorte mal elegido deforma o corta la cara. 16:9 es la
   del formato medio-tarjeta de CargaImagen, asi que lo recortado alli entra
   aqui sin reencuadrar. Radio 5px y no 6px: es el interior del borde de 1px. */
/* R64 · El medio es SU PROPIO bloque contenedor. Lo reporto Control
   Administrativos V2.0 y es una declaracion, pero no es cosmetica: .tna-editar
   es position absolute, y sin esto su bloque contenedor era .tna —la tarjeta
   entera—. En el catalogo se veia bien POR ACCIDENTE, porque el medio es el
   primer hijo y esta pegado arriba, asi que top 8px caia donde parecia.
   Dos formas de romperse: si algo se cuela por encima del medio, el boton se
   queda donde estaba; y medioAccion es prop publica de Tarjeta, asi que una
   Tarjeta normal —que no lleva .tna— no tenia NINGUN ancestro posicionado y el
   boton se iba al primero que encontrara, fuera del componente. */
.tn-medio { position: relative; aspect-ratio: 16 / 9; overflow: hidden; display: grid; place-items: center;
  background: var(--fondo-encabezado); border-bottom: 1px solid var(--borde);
  border-radius: 5px 5px 0 0; }
.tn-medio img { display: block; width: 100%; height: 100%; object-fit: cover;
  transition: transform var(--dur-media) var(--curva); }
/* R57 · Sin imagen no sale un agujero: sale el mismo hueco rotulado que usa
   .cx-vacio. En un catalogo real siempre falta alguna. */
.tn-medio-vacio { font-size: 12px; color: var(--texto-pista); text-align: center; padding: 8px; }
.tn-pulsable { cursor: pointer; }
/* R70 · EL FOCO DEL TECLADO. WCAG 2.2 SC 2.4.7 (Focus Visible), Nivel AA.
   No tenia ninguna regla, y la generica de foco solo alcanza lo que vive DENTRO
   del marco de aplicacion —[data-marco], .marco, .lat—: una tarjeta en una
   pantalla de aterrizaje esta fuera, asi que no la tocaba nada y se quedaba con
   el anillo por defecto del navegador sobre una tarjeta que ya trae su propio
   borde de 1px.
   El agravante: al pasar el RATON si cambia el borde a color de accion. Quien
   navega con teclado recibia MENOS señal que quien usa raton, que es al reves
   de como tiene que ser. Mismo anillo que el resto del sistema. */
.tn-pulsable:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
.tn-pulsable:hover { border-color: var(--accion); }
.tn-pulsable:hover :is(h2,h3,h4) { color: var(--accion); }
/* R57 · El acercamiento va CONTENIDO dentro del marco —el medio recorta—, asi
   la tarjeta no empuja a las de al lado. Con una imagen ocupando la mayor
   parte de la tarjeta, un cambio instantaneo es lo que peor se ve. */
.tn-pulsable:hover .tn-medio img { transform: scale(1.04); }
/* R57 · Los tokens de duracion ya caen a 0,01ms, pero transform no es una
   duracion: sin esto el acercamiento seguiria ocurriendo, solo que de golpe.
   Mismo remedio que el avatar. */
@media (prefers-reduced-motion: reduce) { .tn-pulsable:hover .tn-medio img { transform: none; } }

/* R59 · TARJETA DE ACCION — una sola accion, cuatro sitios donde pulsarla.
   Se pidio que la imagen, el titulo y el boton llevaran A LO MISMO. Tres
   <button> haciendo lo mismo son TRES paradas de tabulador y tres anuncios
   para una sola accion: con teclado hay que pasar por las tres para salir de
   la tarjeta, y el lector la lee tres veces. Asi que hay UN control real —el
   titulo— y su zona pulsable se estira sobre toda la tarjeta con ::after. Una
   parada, un anuncio, y se puede pulsar donde sea. El boton del pie es la
   señal visual de la accion, no un control aparte: por eso va aria-hidden y
   sin foco, y el clic lo recoge la zona que tiene debajo. */
.tna { position: relative; }
.tna-disparo { font: inherit; color: inherit; background: none; border: 0;
  padding: 0; margin: 0; text-align: left; cursor: pointer; }
.tna-disparo::after { content: ''; position: absolute; inset: 0; border-radius: 6px; }
/* El anillo rodea LA TARJETA, no dos palabras del titulo: lo que se activa al
   pulsar Enter es la tarjeta entera, y el foco tiene que decir eso. */
.tna-disparo:focus-visible { outline: none; }
.tna-disparo:focus-visible::after { outline: 2px solid var(--foco); outline-offset: 2px; }
.tna-txt { margin: 4px 0 0; font-size: 13px; color: var(--texto-secundario); line-height: 1.55; }
/* La ÚNICA accion distinta de la tarjeta va por encima de la zona pulsable.
   Sin este z-index el ::after se la comeria y cambiar la foto abriria la
   pagina. */
.tna-editar { position: absolute; top: 8px; right: 8px; z-index: 1; }

/* Chip de estado */
.chip-sup { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 8px; }
.chip-sup-caja { border: 1px solid var(--borde); border-radius: 6px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px; }
.chip-sup-et code { font-size: 12px; color: var(--texto-secundario); }
.chip-sup-fila { display: flex; gap: 4px; flex-wrap: wrap; }
.chip-sup-nota { font-size: 12px; color: var(--texto-pista); }
.chip-sin-filete { border-left-color: transparent !important; }
/* El punto suelto usa el ACENTO, no el relleno: con el relleno sería invisible
   y el ejemplo no se entendería. Este es el patrón real que se ve por ahí, un
   punto de color sin texto al lado. */
.chip.chip-punto { width: 14px; height: 14px; border-radius: 50%; padding: 0;
  border-left-width: 0; display: inline-block; flex: none; }
.chip-punto.chip-exito { background: var(--exito-acento); }
.chip-punto.chip-aviso { background: var(--aviso-acento); }
.chip-punto.chip-error { background: var(--error-acento); }
.chip-punto.chip-info  { background: var(--info-acento); }
/* El punto de identidad usa el color PLENO y no un acento, porque identidad no
   tiene rampa: es un color y ya. Es la pieza de leyenda que R88 necesitaba, y
   ya existia — solo le faltaban estos cuatro. */
.chip-punto.chip-identidad-1 { background: var(--identidad-1); }
.chip-punto.chip-identidad-2 { background: var(--identidad-2); }
.chip-punto.chip-identidad-3 { background: var(--identidad-3); }
.chip-punto.chip-identidad-4 { background: var(--identidad-4); }
.chip-con-punto i { display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; margin-right: 4px; vertical-align: middle; }
.chip-fila-demo { display: flex; gap: 8px; align-items: center; }

/* Selector con búsqueda */
.sel { position: relative; }
.sel-caja { position: relative; display: flex; align-items: center; }
.sel-lupa { position: absolute; left: 9px; color: var(--texto-pista);
  display: grid; place-items: center; pointer-events: none; }
.sel-lupa .ic { width: 16px; height: 16px; }
/* Todo selector lleva el chevron que lo identifica como tal. Sin él, con solo
   la lupa, el componente parece una caja de búsqueda y no un desplegable. */
.sel-chev { position: absolute; right: 12px; color: var(--texto-secundario);
  display: grid; place-items: center; pointer-events: none; }
.sel-chev .ic { width: 16px; height: 16px; transition: transform var(--dur-rapida) var(--curva); }
.sel-caja.abierta .sel-chev .ic { transform: rotate(180deg); }
/* Especificidad explícita: la clase .campo declara padding en atajo y pisaría
   estas dos longhand si empataran. La lupa ocupa la izquierda y el chevron la
   derecha, así que el texto necesita hueco reservado a ambos lados. */
/* R100 · EL SANGRADO SOLO CUANDO HAY LUPA.
   Con la lupa siempre puesta, este campo empezaba el texto a 32px y el resto
   del formulario a 8, asi que en una columna de campos el suyo se salia de la
   alineacion. Lo reporto Control Administrativos: «se ve distinto a los demas».
   Medido: mismo alto (32,7px) y mismo ancho que el Selector; de nueve
   propiedades distintas, ocho eran intrinsecas del <select> nativo —su flecha
   de fondo, el ajuste de linea— y la unica que se ve es esta.
   La lupa NO se retira del sistema: en el buscador de la tabla es correcta,
   porque alli se busca de verdad. Se vuelve opcional, y por omision no esta —
   elegir de una lista es el mismo gesto en los dos componentes, y que uno
   ademas filtre escribiendo es un detalle de interaccion, no otra clase de
   campo. */
input.campo.sel-in { width: 100%; padding-right: 32px; }
.sel-caja.sel-con-lupa input.campo.sel-in { padding-left: 32px; }
.sel-lista { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0;
  max-height: 244px; overflow-y: auto; margin: 0; padding: 4px; list-style: none;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde-campo);
  border-radius: 6px; box-shadow: var(--sombra-capa); }
.sel-op { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 8px; border-radius: 6px; font-size: 15px; cursor: pointer; }
.sel-op.marcado { background: var(--fondo-fila-hover); }
.sel-op[aria-selected="true"] { color: var(--accion); font-weight: 500; }
.sel-check { color: var(--accion); display: grid; place-items: center; }
.sel-check .ic { width: 16px; height: 16px; }
.sel-vacio { padding: 12px 12px; font-size: 13px; color: var(--texto-secundario); line-height: 1.55; }
.sel-vacio strong { color: var(--texto-principal); }
.sel-demo-fila { display: grid; grid-template-columns: minmax(260px,360px) 1fr; gap: 28px; align-items: start; }
.sel-notas p { margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: var(--texto-secundario); }
.sel-notas strong { color: var(--texto-principal); }
@media (max-width: 760px) { .sel-demo-fila { grid-template-columns: 1fr; } }

/* Campo de texto */
/* R53 · .cg y .campo-grupo son la MISMA pieza con dos nombres, y su bloque
   compartido esta mas abajo, junto a .campo-*. Aqui quedan solo las piezas que
   no tienen gemelo. */
.cg-et-oculta { visibility: hidden; }
.cg-req { color: var(--error-texto); margin-left: 4px; font-weight: 600; }
.cg-in { width: 100%; }
/* background-color y no el atajo background: el atajo borra el background-image
   y un select deshabilitado se quedaba sin su flecha, que es justo lo que lo
   identifica como selector. */
/* R41 · Y el CAMPO igual: solo select.campo tenia trato de deshabilitado, asi
   que un campo de texto apagado se veia editable. Se le da el MISMO que ya
   tenia .cg-in en vez de inventar otro — dos tratos distintos para el mismo
   estado es la deriva que este sistema existe para evitar. */
.campo:disabled, .cg-in:disabled { background-color: var(--fondo-encabezado); color: var(--texto-secundario);
  border-color: var(--borde); cursor: not-allowed; }
/* R54 · solo lectura: se ve, se lee, se enfoca y no se cambia. El catalogo lo
   estilizaba solo en .cg-in, asi que un campo readonly del producto —que emite
   .campo— no se veia distinto de uno editable. El select no tiene readonly en
   HTML: por eso tambien se mira aria-readonly, que es lo que el componente
   pone. */
.cg-in[readonly], .campo[readonly], .campo[aria-readonly="true"] {
  background-color: var(--fondo-encabezado); border-color: var(--borde); }
.campo[aria-readonly="true"] { cursor: default; }
.campos-rejilla { display: grid; grid-template-columns: repeat(auto-fit,minmax(210px,1fr)); gap: 16px; }
.anatomia { display: grid; grid-template-columns: minmax(220px,300px) 1fr; gap: 28px; align-items: start; }
.anat-lista { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7;
  color: var(--texto-secundario); }
.anat-lista b { color: var(--texto-principal); }
@media (max-width: 700px) { .anatomia { grid-template-columns: 1fr; } }

/* Enlace */
a.enlace.enl-sub { text-decoration: underline; text-underline-offset: 2px; }
a.enlace.enl-nosub { text-decoration: none; }
.enl-activo { color: var(--accion-activa); }
.enl-desh { color: var(--texto-secundario); font-size: 13px; }
.enl-ext::after { content: ' ↗'; font-size: 12px; }
.enl-comp { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 12px; }
.enl-caja { display: flex; flex-direction: column; gap: 12px; padding: 16px;
  border-radius: 6px; border: 1px solid var(--borde); }
.enl-caja.bien { background: var(--exito-fondo); border-color: var(--exito-acento); }
.enl-caja.mal { background: var(--error-fondo); border-color: var(--error-acento); }
.enl-caja p { margin: 0; font-size: 15px; line-height: 1.6; }
.enl-caja.bien p { color: var(--exito-texto); }
.enl-caja.mal p { color: var(--error-texto); }
.enl-marco-caja { background: var(--marco-fondo); padding: 8px 12px; border-radius: 6px;
  display: inline-block; }
.enl-en-marco { color: var(--marco-acento); text-decoration: underline;
  text-underline-offset: 2px; font-size: 13px; }

/* ── HORARIO ─────────────────────────────────────────────────────────────────
   Rejilla de día por hora. Es una TABLA de verdad y no una rejilla dibujada:
   con lector de pantalla cada bloque se anuncia con su día y su franja porque
   las cabeceras están declaradas con scope. Una rejilla de divs no lo hace.
   Rotar intercambia los ejes de la misma tabla; no reordena datos. */
.hor-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-bottom: 12px; }
.hor-grupo { display: flex; align-items: center; gap: 8px; }
.hor-grupo-et { font-size: 12px; color: var(--texto-secundario); }
.hor-botones { display: flex; gap: 4px; }
.hor-tit { font-size: 13px; font-weight: 600; color: var(--texto-secundario); margin: 16px 0 4px; }
/* El horario se desplaza DENTRO de su marco. Nunca se encoge la letra para que
   quepa. Lleva tabindex para que el desplazamiento también se alcance con
   teclado: un área que solo se mueve con el ratón deja fuera a quien no lo usa. */
.hor-env { overflow-x: auto; border: 1px solid var(--borde); border-radius: 6px;
  background: var(--fondo-tarjeta); }
.hor-env:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
.hor { border-collapse: collapse; font-size: 13px; width: 100%; }
.hor th, .hor td { border: 1px solid var(--borde); }
.hor thead th { background: var(--fondo-encabezado); color: var(--texto-principal);
  font-weight: 600; font-size: 12px; padding: 8px 12px; white-space: nowrap; }
.hor-esq { background: var(--fondo-encabezado); }
/* La cabecera de franja va en 12px y alineada al borde que toca el dato: así
   la columna de horas no compite con el contenido. */
.hor-eje { background: var(--fondo-encabezado); color: var(--texto-secundario);
  font-weight: 400; font-size: 12px; padding: 4px 8px; white-space: nowrap;
  vertical-align: top; }
.hor-eje-v { text-align: right; }
.hor-eje-h { text-align: left; }
.hor-c { vertical-align: top; padding: 0; min-width: 108px; height: 32px; }
.hor-vacia { background: var(--fondo-tarjeta); }
/* El filete de la izquierda es estructural, igual que en el chip: el color solo
   no distingue nada -SC 1.4.1-. */
.hor-b { display: block; height: 100%; padding: 4px 8px; border-left: 3px solid;
  border-radius: 3px; }

/* R89 · SOMBREADO FRACCIONADO — la celda deja de ser un interruptor.
   Lo pidio Control Administrativos con el argumento que lo cierra: las 07:45.
   Si un bloque solo se dibuja cuando el paso divide sus horas, un trabajador
   que entre a menos cuarto obliga a dibujar la semana entera en franjas de
   quince minutos, para todos. Con fraccion, la rejilla se queda en 24 filas
   siempre.

   SE REPARTE POR PROPORCION, NO POR ALTURA. La celda se llena con una pila
   flexible de hasta tres piezas —hueco de arriba, bloque, hueco de abajo— y
   cada una crece segun su numero de CUARTOS. Asi el reparto es exacto sin
   saber cuantas celdas abarca el rowSpan, y sin una sola medida en pixeles.

   Y sobre todo: el bloque SIGUE EN EL FLUJO. Sacarlo con position:absolute
   habria dejado la fila sin nada que la empuje, y el texto —titulo, detalle y
   rango— se saldria de una celda de 32px. Con flex-shrink: 0 el bloque nunca
   se comprime por debajo de su contenido: si no cabe, crece la fila, que es lo
   que ya pasaba antes.

   La tabla, los th scope y los rowSpan/colSpan se quedan EXACTAMENTE igual.
   Era su condicion y es la que hace accesible este componente. */
/* min-height y no height: con height fijo la pila no puede crecer, y un bloque
   con linea de detalle desbordaba la celda con el texto cortado por el borde.
   Con min-height el reparto sigue siendo porcentual —todas las celdas de una
   fila miden lo mismo— y ademas la fila crece si el contenido lo pide. */
.hor-pila { display: flex; flex-direction: column; height: 100%; }
.hor-hueco { flex-basis: 0; flex-shrink: 0; }
.hor-pila > .hor-b { flex: 1 0 auto; height: auto; }
/* R94 · EL HUECO MIDE UNA FRACCION DE LA CELDA, NO DEL ESPACIO SOBRANTE.
   La v1.64.0 repartia con flex-grow, y flex-grow reparte lo que SOBRA. Sobra
   distinto en cada celda —una con linea de detalle tiene mas contenido que una
   sin ella—, asi que dos bloques de la MISMA hora en la MISMA fila empezaban a
   alturas distintas. Lo reporto Control Administrativos viendolo en pantalla:
   martes y jueves mas abajo que lunes, miercoles y viernes con el mismo horario.
   Ya estaba medida la desviacion —37,5 % que salia 35,5 %— y se declaro como
   aproximacion aceptable; lo que no se vio es que NO ES UNIFORME, y una
   desviacion que cambia con el contenido no es aproximar: es desalinear.
   Ahora el hueco es flex-basis en PORCENTAJE del contenedor, que es la celda
   —o las L celdas del rowSpan—, y todas las celdas de una fila miden lo mismo.
   El bloque se lleva el resto con flex: 1 1 auto, asi que si su texto no cabe la
   fila crece, y al crecer el porcentaje se recalcula sobre la misma altura para
   todas. El reparto deja de depender del contenido. */
${[1, 2, 3].flatMap((q) => Array.from({ length: 6 }, (_, i) => {
  const L = i + 1;
  return `.hor-hueco.hor-q${q}-${L} { flex: 0 0 ${(q * 25 / L).toFixed(4).replace(/\.?0+$/, '')}%; }`;
})).join('\n')}

.hor-b b { display: block; font-weight: 600; font-size: 13px; }
.hor-b span { display: block; font-size: 12px; }
/* Sin opacidad. Atenuar texto con opacity lo saca del contrato: medido daba
   4,35:1 sobre el bloque oro, por debajo de 4,5. La jerarquia la hace el
   tamano, no la transparencia. */
.hor-rango { font-variant-numeric: tabular-nums; }
.hor-info   { background: var(--info-fondo);      color: var(--info-texto);   border-left-color: var(--info-acento); }
.hor-exito  { background: var(--exito-fondo);     color: var(--exito-texto);  border-left-color: var(--exito-acento); }
.hor-aviso  { background: var(--aviso-fondo);     color: var(--aviso-texto);  border-left-color: var(--aviso-acento); }
.hor-error  { background: var(--error-fondo);     color: var(--error-texto);  border-left-color: var(--error-acento); }
.hor-oro    { background: var(--accion-2-fondo);  color: var(--accion-2);     border-left-color: var(--accion-2); }
.hor-neutro { background: var(--neutra-fondo);    color: var(--neutra-texto); border-left-color: var(--borde-fuerte); }

/* R88 · IDENTIDAD EN EL HORARIO — el color que agrupa, no el que avisa.
   Lo pidio Control Administrativos para colorear cada bloque por SEDE: un
   profesor reparte su semana entre dos o tres locales y el color es lo que
   permite ver donde esta cada tramo sin leer caja por caja. Tenian razon en el
   diagnostico: los tonos de estado no sirven para eso. Usar error como color
   decorativo GASTA el rojo, que es justo lo que este sistema defiende en la
   Nota — si el ambar siempre esta, deja de significar «mira esto».

   EL COLOR VA EN EL FILETE, Y A 6PX. Se probaron las tres formas con la rejilla
   real y bloques de estado mezclados, que es como se ve de verdad:
     · Fondo macizo con texto blanco, como lo pedian y como es el avatar: se lee
       rapidisimo, pero MIDE mal la jerarquia — cuatro cajas macizas decorativas
       pesan mas que el bloque de error en rojo tenue, asi que la alarma queda
       por debajo del adorno. Es el mismo error que ellos denuncian, del reves.
     · Titulo en el color: 5,27–6,55:1, cumple, pero en este sistema el TEXTO de
       color ya significa estado. Un titulo verde se lee como «bien».
     · Filete de 6px sobre fondo neutro: el grosor distinto del semantico —3px—
       es EN SI la senal de que esto es otra dimension, no un estado mas.
   Va en .hor-b.hor-identidad-N y no en .hor-identidad-N a secas para que el
   ancho GANE al border-left: 3px de .hor-b por especificidad y no por
   orden. Eso ultimo es R87: dos reglas de una clase empatan, y el empate se
   resuelve al reves en cada hoja. */
.hor-b.hor-identidad-1,
.hor-b.hor-identidad-2,
.hor-b.hor-identidad-3,
.hor-b.hor-identidad-4 { background: var(--neutra-fondo); color: var(--neutra-texto);
  border-left-width: 6px; }
.hor-b.hor-identidad-1 { border-left-color: var(--identidad-1); }
.hor-b.hor-identidad-2 { border-left-color: var(--identidad-2); }
.hor-b.hor-identidad-3 { border-left-color: var(--identidad-3); }
.hor-b.hor-identidad-4 { border-left-color: var(--identidad-4); }

.cam-fecha { font-size: 13px; font-weight: 400; color: var(--texto-secundario); }
.cam-tok { font-size: 13px; color: var(--texto-secundario); margin: 8px 0 0; }
.cam-tok code { font-size: 12px; }


/* Diálogos de ejemplo */
.dialogos { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 12px; }
.dlg { display: flex; flex-direction: column; border: 1px solid var(--borde);
  border-radius: 6px; background: var(--fondo-tarjeta); }
.dlg-mal { border-color: var(--error-acento); }
.dlg-cuerpo { padding: 16px 16px 12px; }
.dlg-cuerpo strong { display: block; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.dlg-cuerpo p { margin: 0; font-size: 13px; color: var(--texto-secundario); }
.dlg-pie { display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 16px; border-top: 1px solid var(--borde); }
.dlg-et { padding: 8px 16px 12px; font-size: 12px;
  font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
.dlg-ok { color: var(--exito-acento); }
.dlg-mal-et { color: var(--error-texto); }
.mf-et b { color: var(--texto-principal); font-weight: 600; }

.atajos { display: grid; grid-template-columns: repeat(auto-fit,minmax(230px,1fr)); gap: 8px; }
.atajo { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; text-decoration: none; color: var(--texto-principal); }
.atajo:hover { border-color: var(--accion); }
.atajo-ic { color: var(--accion); display: grid; place-items: center; flex: none; margin-top: 4px; }
.atajo strong { display: block; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.atajo span span, .atajo > span:last-child { font-size: 12px; color: var(--texto-secundario); line-height: 1.45; }

.estado-rejilla { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr));
  gap: 8px; margin-bottom: 16px; }
.est { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 12px 16px; }
.est b { display: block; font-size: 24px; font-weight: 600; line-height: 1.1; }
.est span { font-size: 12px; color: var(--texto-secundario); }
.est-ok b { color: var(--exito-acento); }

.iconos-rejilla { display: grid; grid-template-columns: repeat(auto-fill,minmax(104px,1fr)); gap: 8px; }
.ico-item { display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 12px 4px; border: 1px solid var(--borde); border-radius: 6px; }
.ico-item span { font-size: 12px; color: var(--texto-secundario); }

.pendiente { text-align: center; padding: 56px 24px; background: var(--fondo-tarjeta);
  border: 1px dashed var(--borde-fuerte); border-radius: 6px; }
.pendiente-ic { color: var(--texto-pista); margin-bottom: 12px; }
.pendiente-ic .ic { width: 32px; height: 32px; }
.pendiente h3 { font-size: 19px; font-weight: 600; margin-bottom: 4px; }
.pendiente p { font-size: 15px; color: var(--texto-secundario); margin: 0 0 4px; }
.pendiente-nota { font-size: 12px !important; color: var(--texto-pista) !important; max-width: 46ch; margin: 8px auto 0 !important; }

/* Ver código */
.cod-bloque { border: 1px solid var(--borde); border-radius: 6px;
  background: var(--fondo-tarjeta); overflow: hidden; }
.cod-cab { display: flex; align-items: center; gap: 12px; padding: 8px 12px;
  background: var(--fondo-encabezado); }
.cod-ver { display: inline-flex; align-items: center; gap: 4px; font: inherit;
  font-size: 13px; font-weight: 500; cursor: pointer; background: transparent;
  border: 0; color: var(--accion); padding: 4px 4px; border-radius: 6px; }
.cod-ver .ic { width: 16px; height: 16px; transition: transform var(--dur-rapida); }
.cod-ver.abierto .ic { transform: rotate(180deg); }
.cod-tit { flex: 1; font-size: 12px; color: var(--texto-secundario); }
.cod-pre { margin: 0; padding: 16px; font-family: 'IBM Plex Mono', monospace;
  font-size: 13px; line-height: 1.65; overflow-x: auto;
  border-top: 1px solid var(--borde); }
.copiar { font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  padding: 4px 12px; border-radius: 6px; border: 1px solid var(--borde-campo);
  background: var(--fondo-tarjeta); color: var(--texto-principal); }
.copiar:hover { border-color: var(--accion); color: var(--accion); }

/* Manual */
.manual { max-width: 88ch; }
.man-h2 { font-size: 20px; font-weight: 600; margin: 28px 0 8px; }
.man-h3 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; }
.man-h4 { font-size: 15px; font-weight: 600; margin: 16px 0 4px; }
.man-p { font-size: 15px; line-height: 1.65; margin: 0 0 12px; }
.man-lista { font-size: 15px; line-height: 1.65; margin: 0 0 12px; padding-left: 20px; }
.man-lista li { margin-bottom: 4px; }
.man-cita { margin: 0 0 16px; padding: 12px 16px; background: var(--info-fondo);
  color: var(--info-texto); border-left: 3px solid var(--info-acento); border-radius: 6px;
  font-size: 15px; }
.man-hr { border: 0; border-top: 1px solid var(--borde); margin: 24px 0; }
.tabla-manual { margin: 0 0 16px; }
.manual code { background: var(--fondo-encabezado); padding: 4px 4px;
  border-radius: 3px; font-size: 13px; }

@media (max-width: 900px) {
  .catalogo { flex-direction: column; }
  .cat-nav { width: 100%; position: static; max-height: none;
    border-right: 0; border-bottom: 1px solid var(--borde); }
  .cat-cuerpo { padding: 20px 16px 60px; }
}

h2.seccion {
  font-size: 24px; font-weight: 600; margin: 44px 0 4px;
  padding-bottom: 8px; border-bottom: 2px solid var(--borde);
}
.seccion-sub { color: var(--texto-secundario); font-size: 15px; margin: 0 0 20px; }

/* Muestras */
.grupo { margin-bottom: 24px; }
.grupo h3 { font-size: 13px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .07em; color: var(--texto-secundario); margin-bottom: 8px; }
.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: 8px; }
.muestra { display: flex; gap: 8px; align-items: center;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; padding: 8px; }
.muestra-color { width: 46px; height: 46px; border-radius: 6px; flex: none;
  border: 1px solid var(--borde-fuerte); }
.muestra-txt { min-width: 0; }
.muestra-nombre { display: block; font-size: 12px; font-weight: 500; }
.muestra-hex { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 12px;
  color: var(--texto-secundario); }
/* El texto FLUYE. Con white-space: nowrap fijaba el ancho mínimo de la tarjeta
   en 484px: en escritorio se disimulaba con puntos suspensivos, y en 373px
   desbordaba 108px. Además, para qué sirve un token es justo lo que la página
   tiene que dejar leer. */
.muestra-uso { display: block; font-size: 12px; color: var(--texto-pista);
  line-height: 1.4; }
/* Los ítems de una rejilla tienen min-width auto y no bajan de su contenido:
   sin esto, cualquier texto largo estira la columna. */
.rejilla > *, .campos-rejilla > *,
.tp-rejilla > *, .ep-rejilla > * { min-width: 0; }

/* Escalas */
.escala { margin-bottom: 12px; }
.escala-nombre { font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--texto-secundario); margin-bottom: 4px; }
/* La escala se desplaza DENTRO de su contenedor. El gris cálido tiene 11 pasos
   y cada tira necesita ~59px para que quepa el hex: por debajo de 650px de
   contenido la última se salía y arrastraba la barra a toda la página. La regla
   del sistema es que lo ancho se desplaza en su caja, nunca la página. */
.escala-tiras { display: flex; border-radius: 6px; overflow-x: auto;
  border: 1px solid var(--borde); }
/* EL TEXTO NO VA ENCIMA DEL COLOR, VA DEBAJO.
   Antes el paso y el hex se pintaban sobre la propia muestra y la tinta se
   elegía por umbral de luminancia. Medido: 5 de las 41 muestras no alcanzan
   4,5:1 con NINGUNA de las dos tintas —la peor, 4,1:1—, y el hex además llevaba
   opacity .75, que lo hundía hasta 2:1. Y el hex es información, no adorno: no
   tiene exención.
   Con la etiqueta sobre la tarjeta, las 41 se leen a 12,48:1 y la muestra puede
   ser de cualquier color, que es justo lo que una rampa necesita poder hacer. */
.tira { flex: 1 0 60px; padding: 8px 4px; font-size: 12px; text-align: center;
  font-family: 'IBM Plex Mono', monospace; display: flex; flex-direction: column; gap: 4px;
  color: var(--texto-principal); }
.tira-color { display: block; height: 40px; border-radius: 3px;
  border: 1px solid var(--borde); }
.tira-paso { font-weight: 600; }
.tira-hex { font-size: 12px; color: var(--texto-secundario); }


/* Maquetas */
.maquetas { display: grid; gap: 28px; }
.maqueta-tit { font-size: 13px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .07em; color: var(--texto-secundario); margin-bottom: 8px; }
.lienzo { border: 1px solid var(--borde-fuerte); border-radius: 6px; overflow: hidden;
  background: var(--fondo-pagina); }

/* Botones compartidos */
/* EL line-height ES DEL BOTON, NO DEL ANFITRION, y esa es la correccion.
   Sin declararlo, la altura del boton la decidia la pagina que lo montaba: en
   el catalogo se hereda 1,45 —un renglon de 18,8px, mas alto que el icono de
   18— y todos los botones median igual; en un producto que no fija nada, el
   renglon de normal cae a ~16,9px y entonces el icono, que sigue midiendo
   18, ESTIRA solo a los botones que lo llevan. Por eso el CSV salia mas alto
   que Filtros y Columnas en la entrega y no en el catalogo.

   18px es a proposito el tamaño del icono de texto: asi el boton mide lo mismo
   lleve icono o no. Y las dos alturas caen en la rejilla de 4 — 36px el normal
   (18+16+2) y 28px el mini (18+8+2). */
/* EL display TAMBIEN ES DEL BOTON. Segunda vez que el mismo cimiento falla por
   lo mismo, y lo diagnostico el responsable desde su producto:

     «El .btn que entrega el paquete no declara display. Filtros y Columnas se
      alinean porque llevan .btn-ic (inline-flex); nuestro CSV no la lleva, cae
      en display:block, el icono y el texto se apilan y el boton mide 55px
      contra 37px.»

   Tenia razon: la alineacion vivia en .btn-ic, una clase OPCIONAL, asi que un
   boton con icono y sin ella quedaba a merced del display que le pusiera la
   pagina. Ahora la alineacion es DEL BOTON: lleve .btn-ic o no, el icono y el
   texto van en linea y centrados. .btn-ic se queda —hay productos que ya la
   usan— pero deja de ser imprescindible.

   El gap solo se nota cuando hay dos cosas dentro, asi que en un boton de solo
   texto no cambia nada. */
.btn { font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  line-height: 18px;
  padding: 8px 16px; border-radius: 6px; border: 1px solid transparent; }
.btn-1 { background: var(--accion); color: var(--accion-texto); }
.btn-1:hover { background: var(--accion-hover); }
/* Secundaria y neutra son TONALES: relleno suave + borde. El relleno no llega
   a 3:1 contra la tarjeta y no tiene por qué: quien identifica el control es
   el borde (SC 1.4.11). Por eso el borde no se quita. */
.btn-2, .btn-oro { background: var(--accion-2-fondo); color: var(--accion-2); border-color: var(--accion-2); }
/* R20 · el hover se queda DENTRO de la familia de la accion secundaria.
   Usaba marco-acento, y en oscuro marco-acento vale EXACTAMENTE lo mismo que
   accion-2: el rotulo desaparecia sobre su propio fondo, 1,00:1.
   El candado no podia verlo, y eso es lo interesante: verifica los pares del
   CONTRATO, y este par no lo declaro nadie —nace de una regla :hover que cruza
   dos familias—. Ahora invierte dentro de su familia: 7,77:1 en claro,
   10,15:1 en oscuro. */
.btn-2:hover, .btn-oro:hover { background: var(--accion-2); color: var(--accion-texto); }
.btn-neutro { background: var(--neutra-fondo); color: var(--neutra-texto); border-color: var(--borde-campo); }
.btn-neutro:hover { background: var(--borde); }
/* Terciaria: ni relleno ni borde. Cancelar es retroceder, y retroceder no debe
   competir con la acción de la pantalla. */
.btn-terc { background: transparent; color: var(--texto-principal); border-color: transparent; }
.btn-terc:hover { background: var(--fondo-encabezado); }
.btn-destr { background: var(--destructiva); color: var(--destructiva-texto); }
.btn-destr:hover { background: var(--destructiva-hover); }
/* R41 · LO DESHABILITADO NO SE VEIA. Tercera vez pedido, y era cierto: .btn no
   tenia NINGUNA regla :disabled, asi que un boton principal apagado se pintaba
   con el mismo --accion y el mismo texto que uno activo. Identico. Lo unico
   que cambiaba era que no respondia, y eso se descubre pulsando.
   Lo mas revelador: el par accion-texto-desh / accion-deshabilitada YA estaba
   declarado en el contrato de contraste como «Boton deshabilitado, exento por
   1.4.3». Se midio el color de un boton que la hoja nunca pinto.
   Se cubre tambien [aria-disabled] porque el sistema lo prefiere donde el
   control tiene que seguir siendo alcanzable y anunciable. */
.btn:disabled, .btn[aria-disabled='true'] {
  background: var(--accion-deshabilitada); color: var(--accion-texto-desh);
  border-color: var(--accion-deshabilitada); cursor: not-allowed; }
/* El hover no lo resucita: sin esto, .btn-1:hover volvia a pintarlo de azul. */
.btn:disabled:hover, .btn[aria-disabled='true']:hover {
  background: var(--accion-deshabilitada); color: var(--accion-texto-desh); }
/* El terciario NO se rellena: es un boton de texto, y darle fondo gris lo
   convertiria en solido justo cuando deja de poder pulsarse. */
.btn-terc:disabled, .btn-terc[aria-disabled='true'],
.btn-terc:disabled:hover, .btn-terc[aria-disabled='true']:hover {
  background: transparent; border-color: transparent; color: var(--accion-texto-desh); }
.btn-mini { font-size: 12px; padding: 4px 12px; }

/* ACCION DE SERVIDOR. No es otro boton: es el MISMO ocupado.
   Se resolvio dentro de .btn a proposito. Un BotonServidor aparte seria una
   garantia de la que se puede salir eligiendo el otro componente, y entonces
   no garantiza nada: el dia que alguien pone el boton normal en Guardar, el
   doble envio vuelve. Ademas el sistema ya tuvo dos paginaciones y divergieron.

   El giro NO sustituye al texto: cambiar «Guardar» por «Enviando…» mueve el
   ancho del boton y la fila entera baila. Gira, se apaga, y lo dice aria-busy. */
.btn-ocupado { cursor: progress; }
/* LOS DOS TEXTOS APILADOS. El botón reserva el ancho del más largo desde el
   principio, asi que pasar a «Guardando…» no mueve nada. Es la unica forma de
   dar el texto de espera sin que la fila baile, y por eso vive aqui y no en
   cada proyecto: fuera, cada uno lo resolveria a su manera o no lo resolveria.
   Sale de un requerimiento de Control Administrativos V2.0. */
.btn-textos { display: inline-grid; }
.btn-textos > * { grid-area: 1 / 1; }
/* visibility y no opacity: opacity deja el texto seleccionable y
   copiable aunque no se vea. Y no display none, que dejaria de reservar el
   ancho, que es todo el proposito. */
.btn-texto-oculto { visibility: hidden; }
.btn-giro { width: 14px; height: 14px; flex: none; border-radius: 50%;
  border: 2px solid currentColor; border-top-color: transparent;
  animation: btn-girar var(--dur-giro) var(--curva-giro) infinite; }
@keyframes btn-girar { to { transform: rotate(360deg); } }
/* Quien pide menos movimiento no ve un aspa girando: se queda quieta y sigue
   diciendo que hay algo en marcha. WCAG 2.2, y ademas marea. */
@media (prefers-reduced-motion: reduce) {
  .btn-giro { animation: none; border-top-color: currentColor; opacity: .5; }
}
.enlace { color: var(--enlace); text-decoration: none; font-size: 13px; }
.enlace:hover { text-decoration: underline; }
/* R82 · EL FOCO DEL TECLADO. WCAG 2.2 SC 2.4.7. Mismo hueco que R70 y por el
   mismo motivo: la regla generica de foco solo alcanza lo que vive dentro del
   marco de aplicacion, y .enlace es la accion de FILA —el manual manda usarlo
   ahi en vez de un boton, para no convertir la tabla en una rejilla de
   botones—. En una tabla de veinte filas con varias acciones por fila, el
   anillo es lo unico que dice en cual estas. Sin el, con teclado te pierdes.
   Y como con el raton si se subraya, el teclado recibia menos señal que el
   raton, igual que en la tarjeta. */
.enlace:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; border-radius: 3px; }
.mono { font-family: 'IBM Plex Mono', monospace; }
.apagado { color: var(--texto-secundario); }
.deuda { color: var(--error-texto); font-weight: 500; }

.campo { font: inherit; font-size: 13px; padding: 8px 8px; border-radius: 6px;
  border: 1px solid var(--borde-campo); background: var(--fondo-tarjeta);
  color: var(--texto-principal); }
.campo::placeholder { color: var(--texto-pista); }

/* La flecha nativa del desplegable la dibuja el navegador: va pegada al borde,
   no respeta el espaciado y no es de trazo. Se sustituye por el chevron del
   sistema, a 12px del borde y con hueco reservado para que el texto no lo pise.
   El color va literal porque un data URI no resuelve var(); son los valores de
   texto-secundario en cada modo, y el catálogo está exento del candado. */
select.campo {
  appearance: none; -webkit-appearance: none;
  padding-right: 32px;
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px 16px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236A6864' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
}
[data-tema='oscuro'] select.campo {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C3C1BD' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
}
select.campo:disabled { opacity: .75; }

/* ── FILA DE CARGA — R102 ─────────────────────────────────────────────────────
   El arranque y el final COMUNES de las tres cargas: imagen, PDF e ID. Antes
   cada una rompia la rejilla del formulario a su manera —una caja de 96px, una
   lista apilada encima del boton, dos miniaturas de 48—. Ahora las tres emiten
   este marcado, asi que no pueden divergir.

   LA REGLA ES UNA MEDIDA: la fila mide lo que mide un «.campo». Medido en el
   catalogo con el navegador: 36,45px —13px de texto con 18,85 de interlinea
   REAL, mas 8+8 de relleno y 1+1 de borde—. La fila se fija en 36.

   La cifra exacta depende de la interlinea que herede el producto, asi que lo
   que esta regla garantiza no es un numero: es que la fila NO CRECE con lo
   que se cargue. Con uno, con cinco y con ninguno mide lo mismo. */
.cx { display: flex; flex-direction: column; gap: 4px; }
/* EL ROTULO VA DENTRO DE LA FILA, no encima. Es la excepcion declarada a la
   regla del formulario, y se sostiene porque aqui no encabeza una caja de
   escribir: encabeza un mando. Mismo trato que «.top-filtros» y «.pgn».
   QUIEN CEDE PRIMERO. En estrecho algo tiene que encoger, y no puede ser
   envolviendo: eso son dos renglones, que es lo que esta fila existe para
   evitar. El orden es: primero los adjuntos —el nombre del archivo ya se
   recorta y la extension se salva—, y solo cuando ya no queda nada que quitar
   ahi, el rotulo. Por eso «.cx-adjuntos» encoge 100 veces mas rapido.
   El rotulo se recorta con puntos suspensivos y NO se corta en seco: los
   puntos dicen que hay mas; un corte limpio miente. */
.cx-et { font-size: 13px; font-weight: 500; color: var(--texto-principal);
  flex: 0 1 auto; min-width: 3ch;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 'nowrap' es la regla, no un descuido: envolver es romper la estatica otra
   vez, solo que hacia abajo. Lo que no cabe se cuenta, ver «.cx-mas». */
.cx-fila { display: flex; align-items: center; gap: 8px;
  min-height: 36px; min-width: 0; flex-wrap: nowrap; }
.cx-fila > .btn { flex: none; }
.cx-vacio { font-size: 12px; color: var(--texto-pista); }
.cx-adjuntos { display: flex; align-items: center; gap: 4px;
  flex: 1 100 auto; min-width: 0; overflow: hidden;
  list-style: none; margin: 0; padding: 0; }
/* Sin esto, «display: flex» le gana a [hidden] y la lista vacia sigue ahi
   ocupando su hueco. Lo cazo el candado de la cascada, no la vista. */
.cx-adjuntos[hidden] { display: none; }
/* 27px y no 37: el adjunto vive DENTRO de la fila, no la define. */
.cx-adj { display: inline-flex; align-items: center; gap: 4px;
  min-width: 0; max-width: 100%; height: 27px; padding: 0 4px;
  border: 1px solid var(--borde); border-radius: 6px;
  background: var(--fondo-tarjeta); font-size: 12px; color: var(--texto-principal); }
.cx-adj .ic { width: 14px; height: 14px; flex: none; color: var(--texto-secundario); }
/* Con imagen no hay caja: la miniatura ya es la ficha, y una caja alrededor
   de una miniatura de 22px es mas borde que contenido. */
.cx-adj-img { padding: 0; border-color: transparent; background: transparent; gap: 4px; }
.cx-mini { width: 22px; height: 22px; flex: none; display: block;
  object-fit: cover; border-radius: 3px; border: 1px solid var(--borde);
  background: var(--fondo-encabezado); }
/* La miniatura del carne conserva su proporcion: ID-1 es 1,5858:1 y 35x22 da
   1,5909 — cinco milesimas por encima, y el alto sigue cabiendo en la fila. */
.cx-mini-id { width: 35px; }
/* La foto de una persona se ve en circulo en todo el sistema (Avatar), y aqui
   tambien: es la misma persona con la misma pinta en la ficha, en la tabla y
   en la fila. Solo cambia el radio — 22px de alto, como las demas, porque lo
   que no puede pasar es que la fila ocupe dos renglones. */
.cx-mini-redonda { border-radius: 50%; }
.cx-ver { padding: 0; border: 0; background: transparent; cursor: pointer;
  display: block; border-radius: 3px; }
.cx-ver:hover .cx-mini { border-color: var(--accion); }
.cx-ver:focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
/* El nombre se recorta; la EXTENSION no. Cortar «boleta-…-2026.pdf» por el
   final se lleva justo el dato que dice que es el archivo. */
.cx-arch { display: inline-flex; align-items: baseline; min-width: 0; }
.cx-nombre { overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  min-width: 4ch; max-width: 22ch; }
.cx-ext { flex: none; }
.cx-peso { font-size: 12px; color: var(--texto-secundario); flex: none; }
/* El sobrante se CUENTA. Una tira que se sale por el borde no dice cuanto
   falta; un numero si. */
.cx-mas { flex: none; height: 22px; padding: 0 4px;
  display: inline-flex; align-items: center; border-radius: 3px;
  background: var(--fondo-encabezado); color: var(--texto-secundario);
  font-size: 12px; font-weight: 500; }
/* El panel se despliega EN SU SITIO y empuja hacia abajo lo que venga despues.
   No flota y no tapa el formulario. */
.cx-panel { margin-top: 4px; padding: 12px;
  border: 1px solid var(--borde); border-radius: 8px;
  background: var(--fondo-encabezado);
  display: flex; flex-direction: column; gap: 12px; }
.cx-panel[hidden] { display: none; }
.cx-error { font-size: 12px; color: var(--error-texto); font-weight: 500;
  display: inline-flex; align-items: center; gap: 4px; }
.cx-error .ic { width: 14px; height: 14px; flex: none; }
.cx-nota { font-size: 12px; color: var(--texto-secundario); }

/* Carga de imagen — R35. La caja no puede romperse: tamaño fijo por variante
   y el recorte YA es cuadrado, así que cover no recorta nada nuevo. */
/* R50 · LA COLUMNA SE CENTRA SOBRE SU CAJA.
   Estaba en flex-start, asi que el rotulo, la caja y el boton se alineaban por
   la izquierda y cada uno mide distinto: la caja es lo ancho, el boton menos y
   el rotulo otra cosa. Salia una escalera. Centrados, la caja manda y los tres
   caen sobre su eje. Lo pidio el responsable. */
.ci { display: flex; flex-direction: column; gap: 8px; align-items: center; }
.ci-caja { display: grid; place-items: center; overflow: hidden;
  border: 1px solid var(--borde-campo); border-radius: 6px;
  background: var(--fondo-encabezado); }
.ci-s { width: 64px; height: 64px; }
.ci-m { width: 96px; height: 96px; }
.ci-l { width: 144px; height: 144px; }
.ci-img { display: block; width: 100%; height: 100%; object-fit: cover; }
/* R102 · EL VACIO ES «.cx-vacio», el mismo de las otras dos cargas. Lo unico
   propio de la caja es como se COLOCA dentro de ella: centrado y con aire.
   Antes era «.ci-vacia» —otro nombre para el mismo estilo, y hasta con otro
   genero—, que es justo lo que R102 dijo que habia que dejar de hacer. */
.ci-caja .cx-vacio { text-align: center; padding: 8px; }
/* R50 · EL AVATAR COMO ESTADO VACIO, y solo cuando hay persona detras.
   Sin foto pero CON datos, «Sin foto» no dice nada que no se sepa; las
   iniciales con su color si dicen DE QUIEN es el hueco. Es el mismo Avatar del
   sistema —mismo color por identificador, mismas iniciales— llenando la caja,
   asi que la ficha, la tabla y esta carga pintan a la misma persona igual.
   El borde se retira: el avatar ya es la forma. */
.ci-caja:has(> .ci-avatar) { border-color: transparent; background: transparent; }
/* .ci-caja delante NO es adorno: .ci-avatar y .avatar-xl pesan lo mismo, asi que
   ganaria la que la hoja pusiera despues — y el extractor reparte por
   componente, de modo que en el catalogo gana una y en la entrega la otra. Es
   el defecto que el candado de la promesa acaba de cazar en .us-menu. Con el
   antepasado delante gana esta en las dos, se ordenen como se ordenen. */
.ci-caja .ci-avatar { width: 100%; height: 100%; }
/* Los tres pasos de la escala (§3.4) que caen cerca del 40 % de cada caja, que
   es la proporcion que el propio avatar usa: 19px sobre 48. */
.ci-s .ci-avatar { font-size: 24px; }
.ci-m .ci-avatar { font-size: 34px; }
.ci-l .ci-avatar { font-size: 56px; }
.ci-acciones { display: flex; gap: 8px; }

/* Carga de documento de identidad — R51. Aqui NO hay caja de vista previa: lo
   entregado son dos miniaturas al costado del boton, con la proporcion ID-1
   (85,60 x 53,98 mm).

   R102 · EL ANDAMIAJE YA NO ES SUYO. El grupo, la fila, las miniaturas, el
   error y la nota eran «.cid-*» propias y ahora son «.cx-*», la fila comun de
   las tres cargas. Las miniaturas median 76x48, y una fila de 48 entre campos
   de 36 rompia la rejilla igual que la caja de la carga de imagen: a 35x22
   la proporcion se conserva —1,5909 contra 1,5858— y la fila no crece.
   Lo unico que le queda aqui es lo que vive DENTRO del dialogo. */
.cid-paso { font-size: 13px; color: var(--texto-secundario); margin: 0 0 12px; }
/* El visor: la cara a tamaño legible, sin pasarse del alto de la ventana. */
.cid-visor-img { display: block; max-width: 100%; max-height: 60vh;
  border-radius: 6px; border: 1px solid var(--borde); }
/* El input real, fuera de la vista y del tabulador pero SIN display:none:
   algunos navegadores ignoran click() sobre lo que no se pinta. */
.ci-entrada { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

/* Campo de contraseña: el conmutador ver/no ver vive DENTRO del campo, a la
   derecha, sin robar sitio al texto. Pieza propia con clase propia, como el
   boton de orden de la tabla. */
.cp { position: relative; display: flex; }
.cp-in { width: 100%; padding-right: 40px; }
.cp-ver { position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  display: grid; place-items: center; padding: 8px; border: 0; border-radius: 3px;
  background: transparent; cursor: pointer; color: var(--texto-secundario); }
.cp-ver:hover { color: var(--texto-principal); background: var(--fondo-encabezado); }
.cp-ver[aria-pressed="true"] { color: var(--accion); }
.cp-ver:disabled { opacity: .75; cursor: default; }
.ci-editor { display: flex; flex-direction: column; gap: 8px; align-items: center; }
/* La leccion R16, otra vez: display:flex GANA a [hidden] del navegador y el
   editor no se ocultaba nunca — con su mascara difuminando la pagina entera
   despues de guardar. Lo vio el responsable probando la foto. */
.ci-editor[hidden] { display: none; }
/* La foto vive en círculo y el logo extendido en su hueco real: 212×44, que
   es el lateral desplegado (236) menos su relleno (24). La vista previa ES el
   hueco, no una aproximación. */
.ci-redonda { border-radius: 50%; }
.ci-extendida { width: 212px; height: 44px; }
/* R57 · La vista previa ES el hueco: 16:9, la misma proporcion que .tn-medio.
   192x108 para que quepa junto a los mandos sin empujarlos. */
.ci-medio { width: 192px; height: 108px; }
/* overflow:hidden CONTIENE la sombra de 999px de la mascara: sin el, el
   difuminado se derrama del marco y atenua la pagina entera. El difuminado
   es del encuadre, no del mundo. */
.ci-marco-editor { position: relative; overflow: hidden; border-radius: 6px; }
/* La máscara del encuadre circular: la receta del velo —token del marco con
   opacidad—, nada de colores a mano. Enseña qué quedará dentro del círculo. */
.ci-mascara { position: absolute; inset: 0; border-radius: 50%;
  box-shadow: 0 0 0 999px var(--marco-fondo); opacity: .5; pointer-events: none; }
.ci-lienzo { display: block; border: 1px solid var(--borde); border-radius: 6px;
  background: var(--fondo-encabezado); cursor: move; touch-action: none; }
.ci-zoom { display: flex; gap: 8px; align-items: center; }

/* Carga de PDF — R43. La zona de soltar es lo único que este elemento aporta
   de dibujo nuevo: el disparador, el progreso y el icono ya existían. El borde
   discontinuo dice «esto admite que le sueltes algo» sin escribirlo.

   DENTRO DE LA ZONA SOLO SE USAN texto-principal Y texto-secundario, y no es
   una preferencia: son los dos únicos frentes medidos contra las DOS
   superficies que la zona alterna —fondo-tarjeta en reposo y fondo-encabezado
   al arrastrar encima—. texto-pista está medido sobre la primera y no sobre la
   segunda, así que aquí dentro no entra: al soltar un archivo la pista
   quedaría sin garantía. */
.cpdf { display: flex; flex-direction: column; gap: 4px; }
.cpdf-et { font-size: 13px; font-weight: 500; }
.cpdf-zona { display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 16px; border-radius: 6px; text-align: center;
  border: 2px dashed var(--borde-campo); background: var(--fondo-tarjeta);
  transition: border-color var(--dur-media) var(--curva),
              background-color var(--dur-media) var(--curva); }
.cpdf-encima { border-color: var(--accion); background: var(--fondo-encabezado); }
.cpdf-mal { border-color: var(--error-acento); }
.cpdf-invita { display: flex; flex-direction: column; align-items: center; gap: 4px;
  margin: 0; font-size: 13px; color: var(--texto-secundario); }
.cpdf-ico { display: block; color: var(--texto-secundario); }
.cpdf-instr { display: block; }
.cpdf-lista { list-style: none; margin: 0; padding: 0; width: 100%;
  display: flex; flex-direction: column; gap: 8px; }
/* align-items:flex-start y no center: con varias lineas de datos, centrar
   dejaria el icono flotando a media altura del bloque. */
.cpdf-puesto { display: flex; align-items: flex-start; gap: 12px; text-align: left;
  max-width: 100%; }
/* El nombre y el tachito COMPARTEN LINEA. Puesto al final de la fila, el boton
   quedaba a la altura del bloque entero y con cinco archivos no se sabia a
   cual pertenecia. En la misma linea que el nombre, se ve que se lleva. */
.cpdf-linea { display: flex; align-items: center; gap: 8px; width: 100%; }
.cpdf-quitar { flex: none; }
/* LA LECCION R16, TERCERA VEZ: display GANA a [hidden] del navegador. Toda
   regla que fije display deja su elemento imposible de ocultar con el atributo,
   y no avisa — se ve pintado y nadie sabe por que. Lo encontro el responsable
   pulsando «Quitar»: el manejador corria, ponia hidden, y el bloque seguia ahi.
   Se pone la guarda AL LADO de la regla que causa el problema, no en un rincon,
   para que quien anada otro display la vea. */
.cpdf-invita[hidden], .cpdf-puesto[hidden], .cpdf-lista[hidden],
.cpdf-linea[hidden], .cpdf-acciones[hidden], .cpdf-panel[hidden],
.cpdf-pie[hidden] { display: none; }

/* EN FORMULARIO NO HAY VENTANA FLOTANTE. Lo dijo el responsable: «nosotros no
   trabajamos con pop up, lo que hacemos es aparecer este componente y desplazar
   el contenido del formulario debajo». Asi que el panel se despliega EN SU
   SITIO y empuja lo que venga despues; nada tapa el formulario y al cerrar
   todo vuelve donde estaba.

   Entra con una animacion corta —el desplazamiento se entiende mejor si se ve
   ocurrir— y NO se anima al salir: cerrar tiene que ser inmediato. La
   preferencia de movimiento reducido ya la resuelve el sistema una sola vez.

   Se monta y se desmonta de verdad: colapsarlo con altura cero lo dejaria en
   el arbol de accesibilidad con sus botones tabulables, que es el defecto que
   el candado OCULTABLE acaba de encontrar en .cf-banda. */
.cpdf-panel { display: flex; flex-direction: column; gap: 8px;
  animation: cpdf-desplegar var(--dur-media) var(--curva); }
@keyframes cpdf-desplegar {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
/* El pie del panel: Guardar y Cancelar. DOS botones, nunca uno que cambie de
   significado — uno solo que pasara de «Cancelar» a «Guardar» al detectar
   contenido cambiaria lo que hace bajo el cursor. */
.cpdf-pie { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.cpdf-datos { display: flex; flex-direction: column; gap: 4px; min-width: 0;
  align-items: flex-start; }
.cpdf-nombre { font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.cpdf-peso { font-size: 12px; color: var(--texto-secundario); }
.cpdf-acciones { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.cpdf-pista { font-size: 12px; color: var(--texto-secundario); }
.cpdf-trabajo { padding-top: 4px; }
.cpdf-error { font-size: 12px; color: var(--error-texto); font-weight: 500; }
/* El input real, fuera de la vista y del tabulador pero SIN display:none, por
   la misma razón que en la carga de imagen. */
.cpdf-entrada { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

/* Área de texto — R44. .ta-crece hace crecer el cuadro con lo escrito SIN
   tocar la altura desde JavaScript: la copia invisible del texto vive en
   ::after, ocupa la misma celda de la rejilla que el <textarea>, y es ella la
   que estira la fila. Las dos TIENEN que compartir tipografía y relleno al
   milímetro o la copia mediría distinto que el original.

   Escribir la altura a mano exigiría el atributo style, que el candado
   prohíbe (§2.5.6) — y aquí la prohibición no estorbó: obligó a la solución
   que además sobrevive a que el texto llegue ya escrito. */
.ta { resize: vertical; min-height: 0; line-height: 1.5; width: 100%; }
.ta-fija { display: block; }
.ta-crece { display: grid; max-height: 18em; overflow: auto; }
.ta-crece > .ta { resize: none; overflow: hidden; }
.ta-crece > .ta,
.ta-crece::after {
  grid-area: 1 / 1 / 2 / 2;
  font: inherit; font-size: 13px; line-height: 1.5;
  padding: 8px 8px;
  white-space: pre-wrap; overflow-wrap: anywhere;
}
/* EL BORDE VA SOLO EN LA COPIA, no en la regla compartida. Ponerlo en las dos
   se lo quitaba al cuadro —quedaba un campo sin contorno, indistinguible del
   texto de al lado— y además le habría fijado 1px, pisando los 2px que
   .campo-mal usa para marcar el error. El cuadro conserva el suyo, el de
   .campo; la copia lleva uno transparente solo para medir igual.

   El espacio final evita que la última línea vacía no cuente y el cuadro se
   quede una línea corto justo al pulsar Intro. */
.ta-crece::after {
  content: attr(data-replica) ' '; visibility: hidden;
  border: 1px solid transparent; border-radius: 6px;
}
.ta-pie { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.ta-cuenta { flex: none; font-variant-numeric: tabular-nums; }
.ta-cuenta-mal { color: var(--error-texto); font-weight: 500; }

/* Mismo caso que el select: el icono del campo de fecha lo pinta el navegador
   y LO RETIRA al deshabilitarlo. Sin icono deja de parecer un campo de fecha,
   y en deshabilitado es cuando más falta hace saber qué es, porque no se puede
   abrir para averiguarlo. Se dibuja con el del sistema. */
/* Una fecha ocupa lo que ocupa: 10 caracteres. Estirarla a toda la columna la
   hace parecer un campo de texto libre. Mismo ancho que el rango. */
input[type='date'].campo, input.fc-campo { max-width: 172px; }
/* 32px de hueco: el icono ocupa de 12 a 28 desde el borde. */
input[type='date'].campo {
  appearance: none; -webkit-appearance: none;
  padding-right: 32px; position: relative;
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px 16px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236A6864' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='5' width='18' height='16' rx='2'/><path d='M3 10h18M8 3v4M16 3v4'/></svg>");
}
[data-tema='oscuro'] input[type='date'].campo {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C3C1BD' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='5' width='18' height='16' rx='2'/><path d='M3 10h18M8 3v4M16 3v4'/></svg>");
}
/* El disparador nativo se mantiene pulsable pero invisible: el icono visible
   es el nuestro y ocupa su sitio. */
/* El disparador nativo se mantiene, invisible, cubriendo la zona del icono.
   El icono visible es el del sistema. */
input[type='date'].campo::-webkit-calendar-picker-indicator {
  opacity: 0; cursor: pointer;
  width: 32px; height: 100%; margin: 0; padding: 0;
  position: absolute; right: 0; top: 0;
}
input[type='date'].campo:disabled::-webkit-calendar-picker-indicator { display: none; }

.chip { display: inline-block; font-size: 12px; font-weight: 500;
  padding: 4px 8px; border-radius: 3px; border-left: 3px solid; }
/* Fija display, asi que sin esto un chip con [hidden] se sigue viendo. */
.chip[hidden] { display: none; }
/* EL COLOR DEL ESTADO SE ESCRIBE UNA VEZ, no una por elemento.
   Estaba en .chip-* y otra vez en .msj-*, identico, y el dia que un tono
   cambiara habria cambiado en uno de los dos. No es un ahorro de lineas: es
   que la pareja fondo/texto/filete de un estado es UNA decision, y una
   decision escrita dos veces se separa. */
.chip.chip-exito, .msj.msj-exito { background: var(--exito-fondo); color: var(--exito-texto); border-color: var(--exito-acento); }
.chip.chip-aviso, .msj.msj-aviso { background: var(--aviso-fondo); color: var(--aviso-texto); border-color: var(--aviso-acento); }
.chip.chip-error, .msj.msj-error { background: var(--error-fondo); color: var(--error-texto); border-color: var(--error-acento); }
.chip.chip-info, .msj.msj-info { background: var(--info-fondo);  color: var(--info-texto);  border-color: var(--info-acento); }

/* Escudo pendiente */
.escudo-falta { color: var(--texto-pista); flex: none; display: grid; place-items: center; }

/* ── Maqueta WEB ─────────────────────────────────────────────────────────── */
.lienzo-web { background: var(--fondo-tarjeta); }
.w-barra { display: flex; align-items: center; gap: 20px; padding: 12px 20px;
  background: var(--fondo-tarjeta); border-bottom: 1px solid var(--borde); }
.w-marca { display: flex; align-items: center; gap: 8px; }
.w-colegio { font-size: 12px; font-weight: 500; letter-spacing: .13em; color: var(--texto-secundario); }
.w-nombre { font-size: 15px; font-weight: 700; color: var(--marca-rojo); letter-spacing: .01em; }
.w-nav { display: flex; gap: 16px; flex: 1; font-size: 12px; }
.w-nav span { color: var(--texto-secundario); padding-bottom: 4px; }
.w-nav .activo { color: var(--texto-principal); font-weight: 500; border-bottom: 3px solid var(--marca-oro); }
.w-acciones { display: flex; gap: 8px; }

.w-hero { display: grid; grid-template-columns: 1.35fr 1fr; }
.w-hero-txt { padding: 44px 40px; }
.w-hero-txt h1 { font-size: 34px; line-height: 1.05; font-weight: 700; }
.w-hero-txt h1 em { font-style: normal; color: var(--marca-rojo); }
.w-filete { width: 74px; height: 5px; background: var(--marca-oro); margin: 16px 0 12px; }
.w-hero-txt p { font-size: 15px; color: var(--texto-secundario); max-width: 42ch; margin: 0 0 20px; }
.w-hero-acciones { display: flex; gap: 8px; }
.w-panel { background: var(--marca-rojo-panel); display: grid; place-items: center; color: var(--texto-invertido); }

.w-datos { display: flex; background: var(--fondo-pagina); border-top: 1px solid var(--borde); }
.w-datos > div { flex: 1; padding: 16px 12px; text-align: center; border-right: 1px solid var(--borde); }
.w-datos > div:last-child { border-right: 0; }
.w-datos strong { display: block; font-size: 20px; font-weight: 700; color: var(--marca-rojo); }
.w-datos span { font-size: 12px; color: var(--texto-secundario); }

/* ── Maqueta SISTEMA — lateral plegable + barra de filtros globales ──────── */
.app { display: flex; min-height: 520px; }

/* En un ítem flexible manda flex-basis, no width. Y min-width:0 desactiva el
   mínimo automático, que si no impide encoger por debajo del contenido. */
/* El plegado se anima sobre width con flex-basis auto: animar flex-basis
   directamente dejaba el ancho desincronizado de la clase. */
/* La elevacion va en el LATERAL, no en un pseudoelemento: asi acompana al
   panel tanto extendido como plegado, sin una regla por estado. */
.lat { box-shadow: var(--sombra-marco), var(--canto-marco); position: relative; z-index: 20;
  flex: 0 0 auto; width: 236px; min-width: 0; overflow: hidden;
  background: var(--marco-fondo); color: var(--marco-texto);
  display: flex; flex-direction: column;
  transition: width var(--dur-lenta) var(--curva); }
.lat.colapsado { width: 56px; }
@media (prefers-reduced-motion: reduce) { .lat { transition: none; } }
.lat.colapsado .nav-txt, .lat.colapsado .nav-chev,
.lat.colapsado .lat-id, .lat.colapsado .lat-user-txt { display: none; }
.lat.colapsado .lat-marca, .lat.colapsado .lat-usuario { justify-content: center; }
.lat.colapsado .nav-item { justify-content: center; padding-inline: 0; }

/* BANDA CLARA detrás de la marca. Medido: el rojo del lockup da 2,38:1 sobre
   el marco y el negro de «COLEGIO» 1,66:1. Los activos son transparentes, así
   que irían directos sobre el azul y no se leerían. El escudo solo sí funciona
   sobre azul —tiene cuerpo blanco propio—, pero se usa la misma banda en los
   dos estados para que el plegado no cambie de fondo. */
/* R19 · el fondo es el del MARCO, no el de la tarjeta.
   Con fondo-tarjeta, el respaldo en texto —marco-texto, blanco— quedaba a
   1,00:1 en modo claro: INVISIBLE. Y el respaldo existe justo para el producto
   que todavia no tiene logotipo, que es como se monta un sistema nuevo. Lo que
   no se leia era de quien son los datos que se estan mirando.
   Con marco-fondo da 10,43:1 en los dos modos. Lo reporto Control
   Administrativos V2.0 midiendolo en la pantalla pintada. */
.lat-marca { display: flex; align-items: center; justify-content: center;
  padding: 8px 12px; background: var(--marco-fondo);
  border-bottom: 1px solid var(--marco-borde); height: 64px; flex: none; }
/* El logo crece hasta llenar la banda: 44px de alto en 64px de caja. */
/* La marca lleva al inicio, que es lo que todo el mundo espera de un logo en la
   cabecera. El alt de las imágenes va vacío a propósito: el nombre accesible lo
   pone el enlace, y con los dos puestos el lector lo diría dos veces. */
.lat-marca-enl { display: flex; align-items: center; justify-content: center;
  min-width: 0; border-radius: 6px; }
.lat-marca-enl:focus-visible { outline: 2px solid var(--foco-en-marco); outline-offset: 2px; }
/* ───────────────────────────────────────────────────────────────────────────
   LA MARCA DEL CLIENTE. La sube el, y no puede romper el marco.

   Antes era height 44px con width auto y max-width 100 %, y eso NO lo
   garantiza: con una imagen ancha, max-width recorta el ancho mientras la
   altura sigue clavada en 44px, y la imagen sale DEFORMADA. Con una muy ancha,
   ademas desborda el carril plegado de 64px.

   Y no es hipotetico: en este mismo proyecto el escudo llego a dibujarse a
   1063px porque la altura solo estaba puesta bajo .lat.colapsado.

   La combinacion de abajo es la unica que no puede fallar:

     · la CAJA tiene tamano fijo, asi que el hueco existe antes de que la
       imagen cargue y el menu no da un salto al aparecer;
     · max-width y max-height al 100 % con width y height en auto
       hacen que la imagen se ENCOJA hasta caber, nunca al reves;
     · object-fit contain conserva la proporcion pase lo que pase;
     · overflow hidden en la caja es el cinturon: aunque llegara algo raro
       —un SVG con tamano intrinseco absurdo—, no sale de su sitio.

   Da igual lo que suban: 4000x40, 40x4000 o un cuadrado. Cabe o se encoge.
   Lo unico que el sistema NO puede arreglar es un logo ilegible a 40px, y por
   eso el componente avisa en desarrollo cuando la imagen es muy apaisada. */
/* El prefijo es lat- y no marca- porque marca esta reservado al catalogo
   —es la pagina de los colores de marca— y lo que empieza asi NO VIAJA en la
   entrega. Lo cazo el candado de huerfanas al primer intento. */
.lat-marca-caja { display: grid; place-items: center; overflow: hidden; flex: none; }
.lat-marca-caja img { display: block; max-width: 100%; max-height: 100%;
  width: auto; height: auto; object-fit: contain; }
/* Desplegado: ancho el del carril menos su relleno; alto el del lockup. */
.lat-marca-ancha { width: 100%; height: 44px; }
/* Plegado: cuadrado. Un lockup apaisado se encoge hasta caber, y por eso se
   pide una version compacta aparte —el escudo— en vez de reusar el mismo. */
.lat-marca-estrecha { width: 40px; height: 40px; }
/* Si la imagen no carga, queda el texto. Un alt vacio y una imagen rota dejan
   el menu sin identidad y sin explicacion. */
/* EL TEXTO DE RESPALDO TAMPOCO PUEDE ROMPER EL MARCO. Es el mismo agujero que
   la imagen y se cerro tarde: un colegio con nombre largo desbordaba la caja
   igual que un PNG ancho.

     · line-clamp a 2 lineas: la caja mide 44px y a la tercera se sale;
     · overflow-wrap anywhere para el caso peor, una sola palabra larguisima
       sin espacios, que sin esto no parte por ningun sitio y desborda;
     · max-width 100 % para que la palabra no empuje el carril entero. */
.lat-marca-texto { font-size: 13px; font-weight: 600; line-height: 1.2;
  color: var(--marco-texto); text-align: center; max-width: 100%;
  overflow-wrap: anywhere; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
/* Plegado son iniciales: tres letras caben en 40px sin recortar nada. */
.lat-marca-estrecha .lat-marca-texto { -webkit-line-clamp: 1; font-size: 14px; }

.lat-lockup { display: block; height: 44px; width: auto; max-width: 100%; }
.lat-escudo { display: none; height: 40px; width: auto; }
/* Plegada: el lockup no cabe, queda el escudo. */
.lat.colapsado .lat-lockup { display: none; }
.lat.colapsado .lat-escudo { display: block; }
.lat.colapsado .lat-marca { padding: 8px; }
.lat-id { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
.lat-colegio { font-size: 12px; letter-spacing: .13em; color: var(--marco-acento); font-weight: 500; }
.lat-nombre { font-size: 12px; font-weight: 600; white-space: nowrap; }

/* R18 · el grupo del pie se empuja al fondo y se separa con una linea. Va aqui
   y no en el componente: es aspecto, y el componente solo pone la clase. */
.nav-al-pie { margin-top: auto; border-top: 1px solid var(--marco-borde); padding-top: 4px; }
.lat-nav { display: flex; flex-direction: column; flex: 1; padding: 8px 8px; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
.nav-item { display: flex; align-items: center; gap: 8px; padding: 8px 8px;
  border-radius: 6px; color: var(--marco-texto); text-decoration: none;
  font-size: 13px; opacity: .84; white-space: nowrap; }
.nav-item:hover { background: var(--marco-item-activo); opacity: 1; }
/* PENDIENTE: el sistema no define capas sobre el marco -separador, texto
   atenuado y punto tenue-. Hasta que existan esos tokens se usa blanco con
   alfa. Está declarado, no escondido. */
.nav-item.activo { background: var(--marco-item-activo); opacity: 1;
  color: var(--marco-acento); font-weight: 500;
  box-shadow: inset 3px 0 0 var(--marco-acento); }
.nav-ic { display: grid; place-items: center; flex: none; }
.nav-txt { flex: 1; }
.nav-chev { opacity: .5; display: grid; place-items: center; }
.nav-chev .ic { width: 14px; height: 14px; }

.lat-usuario { display: flex; align-items: center; gap: 8px; padding: 12px;
  border-top: 1px solid var(--marco-borde); }
.lat-user-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.lat-user-nom { font-size: 12px; font-weight: 500; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.lat-user-mail { font-size: 12px; color: var(--marco-texto-tenue); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }

.app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
/* LA ZONA DE CONTENIDO del marco. No existia como clase del sistema: el
   catalogo usaba .cat-cuerpo, que es suya y no viaja, asi que un proyecto que
   montara el marco se quedaba sin margenes ni ancho maximo y el texto le salia
   de borde a borde.

   El ancho maximo NO es estetico: por encima de ~75 caracteres el ojo pierde
   el renglon al volver (§ Ancho de linea del manual). El relleno inferior es
   generoso a proposito, para que la ultima fila de una tabla no quede pegada
   al borde y parezca cortada. */
/* En pantalla muy ancha la columna de lectura se CENTRA y no se arrincona:
   el relleno lateral absorbe el sobrante (max: nunca baja de 32px) y la
   medida interior queda clavada en 1056px, la misma de siempre (1120 − 64).
   Se centra con relleno y no con margen porque el contenedor debe seguir
   pintando de lado a lado. Lo pidió el responsable con captura de 1900px:
   contenido pegado al lateral y el menu de usuario exiliado en la esquina. */
.app-contenido { flex: 1; min-width: 0; overflow-y: auto;
  padding: 24px max(32px, calc((100% - 1056px) / 2)) 80px; width: 100%; }
@media (max-width: 700px) { .app-contenido { padding: 16px 16px 64px; } }

/* ── REFLUJO ─────────────────────────────────────────────────────────────────
   SC 1.4.10 exige que el contenido fluya a 320 CSS px. El sistema solo se había
   probado a 390, y a 320 pasaba algo peor que desbordar: la lateral de 236px NO
   colapsaba y TAPABA el contenido. El documento no se desplazaba —parecía
   correcto medido con scrollWidth— pero el 74 % de la pantalla quedaba
   inservible y los títulos salían cortados. Solo se ve mirándolo.

   El corte va en 900px: por debajo, la lateral de 236 ya estrecha demasiado la
   tabla, que es el 80 % de la superficie. Se pliega al carril de iconos, que es
   exactamente lo que ya hace el botón de plegar.

   La altura del escudo se repite aquí a propósito: vive bajo .lat.colapsado,
   y esta regla NO añade esa clase. Sin repetirla, el escudo se dibuja a tamaño
   natural —1063px— y revienta la página entera. Pasó, y no lo cazó ninguna
   medida: el documento no desbordaba porque overflow lo recortaba. */
/* R38a (v1.34.0): AQUÍ VIVÍA el bloque que forzaba el riel de 56px entre 701
   y 900 con :not(.colapsado). Se retiró a propósito, y la lección de arriba
   sigue siendo cierta — el corte en 900 y el escudo de 1063px pasaron.

   Por qué se fue: forzar el riel por CSS dejaba al React SIN ENTERARSE. El
   aria-expanded decía «desplegada» con la barra a 56px, y MarcaMenu no
   conmutaba al logo compacto: el lockup quedaba estrujado — el caso exacto
   contra el que MarcaMenu existe. Dos verdades a la vez, la enfermedad R34.

   El riel bajo 900 sigue existiendo, pero ahora es ESTADO: MarcoApp se pliega
   solo al cruzar la banda (matchMedia, avisando por onPlegar), MarcaMenu
   conmuta el logo, y el aria dice la verdad. Quien quiera re-desplegar a ese
   ancho, puede: los 236px caben en línea. El comportamiento es del
   componente; la hoja pinta estados, no los impone. */
@media (max-width: 640px) {
  /* Tres selectores globales de 120px suman 360 y por sí solos impedían bajar
     de 320. Sueltan su ancho mínimo y la barra envuelve. */
  .top { flex-wrap: wrap; height: auto; }
  .top-filtros { flex-wrap: wrap; }
  .top-filtros .campo { min-width: 0; }
}

/* Altura fija y COMPARTIDA con la banda de marca: así la línea divisoria del
   header y el inicio del menú caen en la misma y. 64px, en rejilla. */
/* flex:none no es adorno: sin él la barra es un elemento flexible que CEDE
   cuando el contenido desborda, y en móvil se encogía de 64px a 51px. La
   altura declarada tiene que cumplirse o la línea divisoria deja de caer donde
   dice el comentario de arriba. */
/* La barra se eleva sobre el contenido que se desplaza por debajo. z-index
   MENOR que el del lateral: donde se cruzan, manda el lateral. */
.top { box-shadow: var(--sombra-barra); z-index: 10;
  display: flex; align-items: center; gap: 12px; position: relative;
  /* La barra ACOMPAÑA a la columna: pintada de lado a lado, pero sus mandos
     alineados con el contenido (mismo centrado, con los 16px de saliente de
     siempre). Asi el menu de usuario cae sobre el borde derecho de lo que se
     lee, no en la esquina del monitor. */
  padding: 8px max(16px, calc((100% - 1056px) / 2 - 16px)); height: 64px; flex: none;
  background: var(--fondo-tarjeta); border-bottom: 1px solid var(--borde); }
/* La marca de la barra solo existe en móvil: en escritorio ya la lleva la
   banda de la lateral y repetirla sería marca duplicada en pantalla. */
.top-marca { display: none; }
.top-plegar { background: transparent; border: 0; cursor: pointer; padding: 4px;
  border-radius: 6px; color: var(--texto-secundario); display: grid; place-items: center; }
.top-plegar:hover { background: var(--fondo-encabezado); color: var(--texto-principal); }
/* Los filtros de la barra usan la anatomía del Campo -.cg y .cg-et-, no clases
   propias. El cascarón consume su propio sistema. */
.top-filtros { display: flex; gap: 8px; flex: 1; }
.top-filtros .cg { gap: 4px; }
.top-filtros .cg-et { font-size: 12px; color: var(--texto-secundario); }
.top-filtros .campo { font-size: 13px; padding: 4px 8px; min-width: 120px; }
.top-filtros select.campo { padding-right: 28px; background-position: right 8px center; }
/* Las acciones se van SIEMPRE a la derecha. En móvil los filtros salen de la
   barra y ya no hay nada que empuje: sin esto, los iconos se quedaban pegados
   a la hamburguesa. */
.top-acciones { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.top-btn { background: transparent; border: 0; cursor: pointer; padding: 8px;
  border-radius: 6px; color: var(--texto-secundario); position: relative;
  display: grid; place-items: center; }
.top-btn:hover { background: var(--fondo-encabezado); color: var(--texto-principal); }
.badge { position: absolute; top: 1px; right: 1px; min-width: 15px; height: 15px;
  border-radius: 6px; background: var(--error-acento); color: var(--texto-invertido);
  font-size: 12px; font-weight: 600; display: grid; place-items: center; padding: 0 4px; }
.top-avatar { margin-left: 4px; border: 0; cursor: pointer; }

/* Menú de usuario */
.us { position: relative; }
/* ───────────────────────────────────────────────────────────────────────────
   PANEL DE LA BARRA — mensajes y notificaciones.

   Reutiliza .us-menu entero: misma superficie, mismo anclaje, misma sombra.
   Es la MISMA ventana que la del menu de usuario, y darle otra habria sido
   tener dos ventanas del mismo sistema que se separan en cuanto se toque una.
   Lo unico propio es la lista de dentro, que si es distinta: un aviso lleva
   titulo, detalle y momento; una opcion de menu, no.

   Mas ancho que el menu de usuario a proposito: aqui hay texto que leer, no
   opciones que elegir, y a 248px un aviso de dos lineas se parte en cuatro. */
/* Solo del catalogo: el prefijo demo no viaja. En la barra real los botones
   estan a la derecha del todo y el anclaje a la derecha es el correcto; aqui
   estan a la izquierda de la pagina y el panel se saldria de pantalla. */
/* ESTADOS DEL BOTON, dibujados sin pasar el raton. Solo del catalogo: un
   producto no necesita pintar el hover a mano, lo hace el navegador. Estaban
   en atributos style= y el catalogo no puede saltarse la regla que exige. */
.demo-hover { background: var(--accion-hover); color: var(--accion-texto); }
.demo-activa { background: var(--accion-activa); color: var(--accion-texto); }
.demo-desh { background: var(--accion-deshabilitada); color: var(--accion-texto-desh); cursor: not-allowed; }
.demo-accion { background: var(--accion); }
.demo-paneles { display: flex; gap: 24px; }
.demo-paneles .pb-panel { right: auto; left: 0; }
/* DOS DECLARACIONES QUE AQUI NUNCA SE APLICARON, y en la entrega SI.
   PanelBarra emite las dos clases —us-menu y pb-panel— y pesan lo mismo: gana
   la que este DESPUES. En esta hoja .us-menu va detras, asi que el panel
   siempre se vio con min-width 248px y padding 4px, y el 320/4px 0 0 de aqui
   era letra muerta. El extractor reparte por componente y en componentes.css
   .pb-panel cae DESPUES, asi que alli ganaban y el panel salia mas ancho y
   con otro relleno: el catalogo enseñaba una cosa y el producto veia otra.
   Lo encontro el candado de la promesa el dia que dejo de mirar una lista a
   mano y paso a recorrer TODO el marcado — es el unico caso que quedaba.
   Se retiran las dos muertas en vez de duplicar la especificidad: lo que no se
   aplica no se escribe. El max-width se queda porque ese si gana. */
.pb-panel { max-width: 360px; }
.pb-lista { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
.pb-item { display: flex; align-items: flex-start; gap: 8px; width: 100%;
  padding: 8px 12px; background: none; border: 0; text-align: left;
  font: inherit; color: var(--texto-principal); cursor: pointer; }
.pb-item:hover { background: var(--fondo-encabezado); }
.pb-txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
.pb-tit { font-size: 13px; font-weight: 500; }
/* El detalle se recorta a dos lineas: un aviso largo no puede empujar a los
   demas fuera del panel. */
.pb-det { font-size: 12px; color: var(--texto-secundario);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; }
.pb-cuando { font-size: 12px; color: var(--texto-pista); flex: none; }
/* SC 1.4.1: el punto no es el unico portador de «sin leer». El titulo va en
   600 y el contador esta en el nombre del boton. */
.pb-nuevo .pb-tit { font-weight: 600; }
.pb-punto { width: 8px; height: 8px; border-radius: 999px; flex: none;
  margin-top: 4px; background: var(--accion); }
.pb-vacio { margin: 0; padding: 16px 12px; font-size: 13px;
  color: var(--texto-secundario); text-align: center; }
/* El pie NO se desplaza con la lista: «Ver todos» tiene que seguir estando. */
.pb-todos { justify-content: center; border-top: 1px solid var(--borde); }

.us-menu { position: absolute; z-index: 60; right: 0; top: calc(100% + 8px);
  min-width: 248px; padding: 4px; background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-campo); border-radius: 6px;
  box-shadow: var(--sombra-aviso); }
.us-cab { display: flex; align-items: center; gap: 12px; padding: 12px;
  border-bottom: 1px solid var(--borde); margin-bottom: 4px; }

.us-txt { display: flex; flex-direction: column; min-width: 0; }
.us-nom { font-size: 13px; font-weight: 600; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.us-mail { font-size: 12px; color: var(--texto-secundario); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.us-sec { display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 8px 12px; }
.us-et { font-size: 12px; color: var(--texto-secundario); }
/* El tema va en iconos, no en palabras: sol y luna se reconocen sin leer. */
.us-tema { display: flex; gap: 4px; padding: 4px; border-radius: 6px;
  background: var(--neutra-fondo); border: 1px solid var(--borde); }
.us-tema-b { display: grid; place-items: center; width: 28px; height: 24px;
  background: transparent; border: 0; border-radius: 6px; cursor: pointer;
  color: var(--texto-secundario); }
.us-tema-b:hover { color: var(--texto-principal); }
.us-tema-b[aria-pressed='true'] { background: var(--accion); color: var(--accion-texto); }
.us-tema-b .ic { width: 16px; height: 16px; }
.us-op { display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 8px 12px; font: inherit; font-size: 13px; text-align: left; cursor: pointer;
  background: transparent; border: 0; border-radius: 6px; color: var(--texto-principal); }
.us-op:hover { background: var(--fondo-encabezado); }
.us-op:focus-visible { outline: 2px solid var(--foco); outline-offset: -2px; }
/* Es un enlace, así que hay que quitarle el subrayado que le pone el navegador:
   dentro de un menú, la fila entera ya es el blanco. §2.5.7 exige que el
   subrayado esté en los enlaces DE TEXTO, no en las filas de un menú. */
.us-zip { text-decoration: none; }
.us-zip span { display: block; }
.us-zip-det { font-size: 12px; color: var(--texto-secundario); }
.us-op .ic { width: 16px; height: 16px; color: var(--texto-secundario); }
.us-salir { border-top: 1px solid var(--borde); border-radius: 0 0 6px 6px; margin-top: 4px; }
.us-salir:hover { background: var(--error-fondo); color: var(--error-texto); }
.us-salir:hover .ic { color: var(--error-texto); }

.s-cuerpo { padding: 20px; background: var(--fondo-pagina); }
.s-cabecera { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.s-cabecera h2 { font-size: 24px; font-weight: 600; }
.s-cabecera p { margin: 4px 0 0; font-size: 12px; color: var(--texto-secundario); }

.s-tarjeta { background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; }
.s-filtros { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--borde); }
.s-filtros-der { margin-left: auto; display: flex; gap: 8px; }

.s-tabla { width: 100%; border-collapse: collapse; font-size: 15px; }
.s-tabla th { background: var(--fondo-encabezado); text-align: left; font-weight: 500;
  font-size: 15px; padding: 8px 12px; color: var(--texto-principal); }
.s-tabla td { padding: 0 12px; height: 34px; border-top: 1px solid var(--borde); }
.s-tabla tbody tr.hover { background: var(--fondo-fila-hover); }

.s-paginacion { display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; border-top: 1px solid var(--borde); font-size: 12px; color: var(--texto-secundario); }
.s-pag-btns { display: flex; gap: 4px; }
.pag { min-width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px;
  font-size: 12px; border: 1px solid var(--borde); }
.pag.activa { background: var(--accion); color: var(--accion-texto); border-color: var(--accion); }

/* ── Maqueta MÓVIL ───────────────────────────────────────────────────────── */
.lienzo-movil { max-width: 375px; position: relative; }
.m-marco { background: var(--marco-fondo); color: var(--marco-texto); }
.m-marco-fila1 { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
.m-nombre { font-size: 12px; font-weight: 600; flex: 1; }
.m-avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--marco-acento);
  color: var(--marco-fondo); display: grid; place-items: center; font-size: 12px; font-weight: 600; }
.m-marco-fila2 { display: flex; gap: 16px; padding: 0 12px; font-size: 12px; }
.m-marco-fila2 span { padding: 4px 0 8px; opacity: .85; }
.m-marco-fila2 .activo { opacity: 1; color: var(--marco-acento); font-weight: 500;
  border-bottom: 4px solid var(--marco-acento); }
.m-hamb { background: transparent; border: 0; cursor: pointer; padding: 4px;
  color: var(--marco-texto); display: grid; place-items: center; }
.m-filtros-movil { display: flex; gap: 8px; margin-bottom: 12px; }
.m-filtros-movil .campo { flex: 1; min-width: 0; font-size: 15px; }
.m-cuerpo { padding: 12px; background: var(--fondo-pagina); }
.m-cabecera h3 { font-size: 20px; font-weight: 600; }
.m-cabecera p { margin: 4px 0 12px; font-size: 12px; color: var(--texto-secundario); }
.m-cuerpo .campo { width: 100%; margin-bottom: 12px; font-size: 16px; }
.m-tarjeta { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 12px 12px; margin-bottom: 8px; }
.m-nom { font-size: 15px; font-weight: 500; }
.m-meta { font-size: 12px; color: var(--texto-secundario); margin-top: 4px; }
.m-linea { height: 1px; background: var(--borde); margin: 8px 0; }
.m-pie { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.m-tarjeta .enlace { display: inline-block; margin-top: 8px; }
.m-flotante { position: absolute; right: 16px; bottom: 16px; width: 56px; height: 56px;
  border-radius: 50%; border: 0; cursor: pointer; font-size: 24px;
  background: var(--accion); color: var(--accion-texto);
  box-shadow: 0 4px 14px rgba(0,0,0,.28); }

/* ── Tipografía ──────────────────────────────────────────────────────────── */
.tipo-nota { background: var(--exito-fondo); color: var(--exito-texto);
  border-left: 3px solid var(--exito-acento); padding: 12px 16px;
  border-radius: 6px; font-size: 13px; margin-bottom: 20px; }
.tipo-nota code { background: var(--fondo-tarjeta); padding: 4px; border-radius: 3px; }

/* Misma regla que la escala de primitivas y que la tabla de datos: lo ancho se
   desplaza en su caja. La muestra de 56px del titular hero no encoge. */
.tabla-escala-caja { overflow-x: auto; border: 1px solid var(--borde); border-radius: 6px; }
.tabla-escala { width: 100%; border-collapse: collapse; font-size: 13px;
  background: var(--fondo-tarjeta); min-width: 520px; }
.tabla-escala th { background: var(--fondo-encabezado); text-align: left;
  padding: 8px 12px; font-weight: 500; font-size: 12px; }
.tabla-escala td { padding: 8px 12px; border-top: 1px solid var(--borde); vertical-align: middle; }
.tabla-escala .num { font-family: 'IBM Plex Mono', monospace; text-align: right; }
.esc-muestra { width: 45%; overflow: hidden; }
.esc-muestra span { display: block; }

.pesos { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 8px; }
.peso { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 12px 12px; display: flex; flex-direction: column; gap: 4px; }
.peso-mal { background: var(--error-fondo); border-color: var(--error-acento); }
.peso-muestra { font-size: 19px; }
.peso-mal .peso-muestra { color: var(--error-texto); }
.peso-meta { font-size: 12px; color: var(--texto-secundario); }
.peso-mal .peso-meta, .peso-mal .peso-uso { color: var(--error-texto); }
.peso-uso { font-size: 12px; color: var(--texto-pista); }

.mono-comp { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mono-caja { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 12px; }
.mono-et { font-size: 12px; color: var(--texto-secundario); margin-bottom: 8px; }
.mono-lista { font-size: 19px; line-height: 1.6; }
.mono-lista.sans { font-family: 'IBM Plex Sans', sans-serif; }
.mono-lista.mono { font-family: 'IBM Plex Mono', monospace; }

.anchos { display: grid; gap: 12px; }
.ancho-caja { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 12px; }
.ancho-et { font-size: 12px; color: var(--texto-secundario); display: block; margin-bottom: 4px; }
.ancho-72 { max-width: 72ch; margin: 0; font-size: 16px; line-height: 1.65; }
.ancho-libre { margin: 0; font-size: 16px; line-height: 1.65; }

/* ── Opciones de espaciado de botón ──────────────────────────────────────── */
.opciones { display: grid; gap: 12px; }
.op { background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
.op-cab { display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: var(--fondo-encabezado); border-bottom: 1px solid var(--borde); }
.op-letra { width: 28px; height: 28px; border-radius: 50%; flex: none;
  background: var(--accion); color: var(--accion-texto);
  display: grid; place-items: center; font-weight: 600; font-size: 13px; }
.op-cab strong { display: block; font-size: 15px; }
.op-med { font-size: 12px; color: var(--texto-secundario); }
.op-med b { font-family: 'IBM Plex Mono', monospace; color: var(--texto-principal); }

.op-fila { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 16px; }
.btn-op { font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  border-radius: 6px; border: 1px solid transparent; padding-block: 0;
  display: inline-flex; align-items: center; justify-content: center; }
.btn-op-1 { background: var(--accion); color: var(--accion-texto); }
.btn-op-2 { background: transparent; color: var(--accion-2); border-color: var(--accion-2); }
.btn-op-n { background: transparent; color: var(--texto-principal); border-color: var(--borde-campo); }
.op-campo { padding-block: 0; font-size: 13px; }

.op-contexto { padding: 0 16px 16px; }
.op-tabla { border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }

.rejilla-vis { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 16px; }
.rej { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.rej-barra { height: 24px; background: var(--accion); border-radius: 3px; }
.rej span { font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: var(--texto-secundario); }

/* Tabla de contrastes */
/* TABLA SIMPLE — el elemento. Muestra datos y ya: no ordena, no filtra, no
   pagina. Mismo lenguaje visual que la tabla de datos, sin sus controles.
   El catálogo la consume entera; antes tenía tres estilos de tabla inventados
   -contraste, manual y escala- que el sistema no reconocía. */
.tabla-simple { width: 100%; border-collapse: collapse; font-size: 13px;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; }
.tabla-simple th { background: var(--fondo-encabezado); text-align: left;
  padding: 8px 12px; font-weight: 500; font-size: 13px; color: var(--texto-principal); }
.tabla-simple td { padding: 8px 12px; border-top: 1px solid var(--borde);
  vertical-align: top; line-height: 1.45; }
.tabla-simple tbody tr:hover { background: var(--fondo-fila-hover); }
.tabla-simple .num { font-family: 'IBM Plex Mono', monospace; text-align: right; white-space: nowrap; }
.tabla-simple .ok { color: var(--exito-texto); font-weight: 500; }
.tabla-simple .mal { color: var(--error-texto); font-weight: 600; }
.tabla-simple .motivo { color: var(--texto-secundario); }
.tabla-simple code { background: var(--fondo-encabezado); padding: 0 4px; border-radius: 3px; font-size: 12px; }

/* ── Casos de uso ────────────────────────────────────────────────────────── */
.sub-seccion { font-size: 16px; font-weight: 600; margin: 40px 0 4px; }
.casos { display: grid; gap: 16px; }
.caso { background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
.caso-cab { padding: 12px 16px; border-bottom: 1px solid var(--borde); background: var(--fondo-encabezado); }
.caso-cab h4 { font-size: 15px; font-weight: 600; }
.caso-cab p { margin: 4px 0 0; font-size: 12px; color: var(--texto-secundario); }
.caso-cab code { background: var(--fondo-tarjeta); padding: 4px 4px; border-radius: 3px; font-size: 12px; }
.caso-lienzo { padding: 16px 16px; }
/* Andamio del catalogo: la columna de campos con la que se mira si una fila
   rompe la rejilla. No viaja — «caso» esta en SOLO_CATALOGO. */
.caso-form { display: flex; flex-direction: column; gap: 16px; max-width: 520px; }
.caso-tokens { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--borde);
  font-size: 12px; color: var(--texto-secundario); }
.caso-tokens code { background: var(--fondo-encabezado); padding: 4px 4px;
  border-radius: 3px; margin-right: 4px; font-size: 12px; }
.fila-demo { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.mensajes { display: grid; gap: 8px; margin-top: 12px; }
/* R83 · EL MENSAJE EN FLUJO LLEVA GLIFO. El tono se decia SOLO CON COLOR, que
   es lo que prohibe SC 1.4.1: quien no distingue el rojo del ambar no sabe si
   lo que lee es un fallo o una advertencia. El glifo es la señal no cromatica.
   Va oculto al lector —regla de significado de la iconografia—: para quien usa
   lector, el canal es el role: status o alert. */
.msj { display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; padding: 8px 12px; border-radius: 6px; border-left: 3px solid; }
/* El glifo se alinea con la PRIMERA LINEA del texto, no con el centro de la
   caja: con dos renglones, centrado queda flotando en medio de la nada. */
.msj-ico { flex: none; margin-top: 1px; }
.msj-txt { min-width: 0; }
/* NOTA PERMANENTE. Los cuatro de arriba son ESTADOS: dicen que algo paso.
   Esta no dice nada, explica —como se calcula un dato, una advertencia legal
   que siempre esta ahi—, y por eso no puede vestirse de aviso.

   Usar el ambar para algo permanente le quita el significado al ambar: si
   siempre esta, deja de querer decir «mira esto». Lo razono asi Control
   Administrativos V2.0 y es correcto.

   Sin color de estado y sin filete de acento: superficie neutra y borde
   normal. Tokens ya existentes, ningun color nuevo. */
.msj-nota { background: var(--fondo-encabezado); color: var(--texto-secundario);
  border-left-color: var(--borde-fuerte); }

.campos-demo { align-items: flex-start; }
/* R53 · DOS NOMBRES PARA LA MISMA PIEZA, Y YA HABIAN DERIVADO.
   El grupo de campo se llama .cg-* en las paginas de campo, selector, fecha y
   maquetas, y .campo-* en area de texto, casos y en TODOS los componentes de
   React. Eran dos bloques de reglas separados, y con el tiempo se separaron
   tambien por dentro: .cg-et declaraba color y .campo-etiqueta no —asi que la
   etiqueta del producto salia del color que heredara, negro puro en vez del
   gris tinta del sistema—, y .cg-error era flex con hueco para su icono
   mientras .campo-error era texto suelto.
   Lo vio el responsable: «la entrega del selector no es igual que la promesa».
   Ahora los dos nombres COMPARTEN declaracion. No es un alias que haya que
   acordarse de mantener: es el mismo bloque, y volver a separarlos exige
   borrarlo aqui a proposito. El nombre .campo-* se queda porque hay productos
   que ya lo tienen enganchado, y .cg-* porque es el que el catalogo enseña. */
.cg, .campo-grupo { display: flex; flex-direction: column; gap: 4px; }
/* Dentro de la paginacion el grupo va EN LINEA: apilar etiqueta y control
   duplicaria la altura de la barra. Es el mismo componente, otra disposicion. */
.pgn .campo-grupo { flex-direction: row; align-items: center; gap: 8px; }
.pgn .campo-grupo .campo { width: auto; }
.cg-et, .campo-etiqueta { font-size: 13px; font-weight: 500; color: var(--texto-principal); }
.cg-ayuda, .campo-ayuda { font-size: 12px; color: var(--texto-pista); }
.cg-error, .campo-error { font-size: 12px; color: var(--error-texto); font-weight: 500;
  display: flex; align-items: center; gap: 4px; }
.cg-error .ic, .campo-error .ic { width: 14px; height: 14px; flex: none; }
/* Y se puede seguir ocultando: al pasar a flex, [hidden] dejaba de valer — el
   mismo defecto que el candado de la cascada caza en .btn. */
.cg-error[hidden], .campo-error[hidden] { display: none; }
.cg-mal, .campo-mal { border-color: var(--error-acento); border-width: 2px; }

.foco-demo { outline: 2px solid var(--foco); outline-offset: 2px; }
.foco-marco { background: var(--marco-fondo); padding: 12px 12px; border-radius: 6px; display: inline-block; }
.btn-marco { background: transparent; color: var(--marco-texto); border-color: var(--marco-acento); }
.foco-demo-marco { outline: 2px solid var(--foco-en-marco); outline-offset: 2px; }

.demo-tabla { border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
.demo-tabla td { height: 34px; }

.estados-demo { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px,1fr)); gap: 12px; }
.estado-caja { border: 1px dashed var(--borde-fuerte); border-radius: 6px; padding: 16px;
  min-height: 116px; display: flex; flex-direction: column; gap: 8px; position: relative; }
.estado-caja.centrado { align-items: center; justify-content: center; text-align: center; }
.estado-txt { font-size: 13px; color: var(--texto-secundario); margin: 0; }
.estado-txt em { font-style: normal; font-weight: 600; color: var(--texto-principal); }
.estado-et { position: absolute; top: -9px; left: 11px; background: var(--fondo-tarjeta);
  padding: 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .07em;
  color: var(--texto-pista); font-weight: 500; }
.esqueleto { height: 11px; border-radius: 3px; background: var(--fondo-encabezado); }
.esqueleto.corto { width: 62%; }

/* Usos incorrectos */
.mal-rejilla { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px,1fr)); gap: 12px; }
.mal-par { display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; background: var(--fondo-tarjeta); }
/* Las etiquetas van EN FLUJO, no posicionadas al fondo. En absoluto, al ocupar
   dos o tres líneas en 390px se montaban encima del contenido. */
/* min-width:0 porque el valor por defecto de un elemento de rejilla es auto, y
   auto le impide encoger por debajo de su contenido: un campo de ejemplo de
   189px ensanchaba su pista y sacaba la caja del marco. */
.mal-caja { padding: 16px 12px; display: flex; flex-direction: column; min-width: 0;
  align-items: center; justify-content: space-between; gap: 12px; min-height: 92px; }
.mal-caja.mal { background: var(--error-fondo); }
.mal-caja.bien { background: var(--exito-fondo); border-left: 1px solid var(--borde); }
/* El contraejemplo tambien se pinta con tokens. Ensenar el error no autoriza
   a cometer otro: si el unico atributo style del catalogo vive justo en la
   pagina que prohibe ese atributo, la pagina no se cree. */
.mal-btn-celeste { background: var(--marca-celeste); color: var(--texto-invertido); }
.mal-et, .bien-et { text-align: center; font-size: 12px; line-height: 1.4; }
.mal-et { color: var(--error-texto); font-weight: 500; }
.bien-et { color: var(--exito-texto); font-weight: 500; }
.mal-et code, .bien-et code { font-size: 12px; }
.emoji-demo { font-size: 19px; letter-spacing: 5px; }
.iconos-demo { display: flex; gap: 12px; color: var(--exito-texto); }
.filas-boton { display: flex; gap: 4px; }
.filas-boton.col { flex-direction: column; gap: 8px; align-items: center; }
.btn.mini { font-size: 12px; padding: 4px 8px; }
/* Contraejemplo didactico. Lleva tabindex=-1, readonly y aria-hidden porque
   ANTES era un input vivo en el orden de tabulacion sin indicador de foco: un
   incumplimiento real de SC 2.4.7 dentro de la pagina que lo denuncia. Ensenar
   el defecto no autoriza a cometerlo -§5.2.2: la conformidad es de pagina
   completa-. */
.sin-foco { outline: none; }

.aviso { background: var(--info-fondo); color: var(--info-texto);
  border-left: 3px solid var(--info-acento); padding: 12px 16px;
  border-radius: 6px; font-size: 13px; margin: 16px 0; }
.aviso strong { font-weight: 600; }

@media (max-width: 820px) {
  .w-hero { grid-template-columns: 1fr; }
  .w-panel { padding: 24px 0; }
}
</style>
</head>
<body>

<div class="app app-cascaron">

  <aside class="lat" id="lateral">
    <div class="lat-marca">
      <a class="lat-marca-enl" href="#inicio" data-ir="inicio"
         aria-label="Colegio Albert Einstein — ir al inicio">
      ${
        LOCKUP_PNG
          ? `<img class="lat-lockup" src="${LOCKUP_PNG}" alt="">
             <img class="lat-escudo" src="${ESCUDO_PNG}" alt="">`
          : `${escudo(30)}<div class="lat-id"><span class="lat-colegio">COLEGIO</span><span class="lat-nombre">ALBERT EINSTEIN</span></div>`
      }
      </a>
    </div>
    <nav class="lat-nav">${menuCatalogo}</nav>
    <div class="lat-usuario">
      <span class="avatar avatar-m avatar-2">JI</span>
      <div class="lat-user-txt">
        <span class="lat-user-nom">JOSE ISIDRO PINEDA</span>
        <span class="lat-user-mail">jose.pineda@ae.edu.pe</span>
      </div>
    </div>
  </aside>

  <div class="app-main">
    <div class="top top-cascaron">
      <button class="top-plegar" id="plegar-cat" aria-label="Plegar menú" aria-expanded="true">
        <span class="ic-escritorio">${ICONOS.panelIzq}</span>
        <span class="ic-movil">${ICONOS.hamburguesa}</span>
      </button>
      <!-- Barra de app: la vuelta atrás. Solo existe en la vista de app. -->
      <button class="app-atras" id="app-atras" aria-label="Volver" hidden>${ICONOS.atras}</button>
      <div class="top-filtros">
        <label class="cg"><span class="cg-et">Sistema</span>
          <select class="campo cg-in"><option>Colegio Albert Einstein</option></select></label>
        <label class="cg"><span class="cg-et">Versión</span>
          <select class="campo cg-in"><option>v${VERSION}</option></select></label>
        <label class="cg"><span class="cg-et">Modo</span>
          <select class="campo cg-in"><option>Catálogo</option><option>Producción</option></select></label>
      </div>
      <div class="fg" id="fg">
        <button class="top-btn" id="fg-btn" aria-expanded="false"
                aria-controls="fg-panel" aria-haspopup="true" aria-label="Filtros">${ICO_FILTRO}</button>
        <div class="fg-panel" id="fg-panel" hidden></div>
      </div>
      ${ESCUDO_PNG
        ? `<a class="top-marca" href="#inicio" data-ir="inicio"
              aria-label="Colegio Albert Einstein — ir al inicio"><img src="${ESCUDO_PNG}" alt=""></a>`
        : ''}
      <div class="top-acciones">
        <!-- Los dos paneles de la barra. Antes eran botones que no hacian nada:
             el catalogo dibujaba el icono y ahi acababa. Ahora se abren, que es
             como se comprueba que el componente funciona. -->
        <div class="us" data-pb>
          <button class="top-btn" data-pb-btn aria-expanded="false" aria-haspopup="dialog"
                  aria-controls="pb-msj-top" aria-label="Mensajes, 2 sin leer">${ICONOS.sobre}<span class="badge" aria-hidden="true">2</span></button>
          <div class="us-menu pb-panel" id="pb-msj-top" role="dialog" aria-label="Mensajes" hidden>
            <div class="us-sec"><span class="us-et">Mensajes</span></div>
            <ul class="pb-lista">
              <li><button class="pb-item pb-nuevo"><span class="pb-txt"><span class="pb-tit">QUISPE MAMANI, Rosa</span><span class="pb-det">Justificacion de tardanza del 12 de agosto</span></span><span class="pb-cuando">hace 5 min</span><span class="pb-punto" aria-hidden="true"></span></button></li>
              <li><button class="pb-item pb-nuevo"><span class="pb-txt"><span class="pb-tit">HUAMAN LOPEZ, Luis</span><span class="pb-det">Consulta sobre el horario de tutoria</span></span><span class="pb-cuando">hace 2 h</span><span class="pb-punto" aria-hidden="true"></span></button></li>
              <li><button class="pb-item"><span class="pb-txt"><span class="pb-tit">Direccion academica</span><span class="pb-det">Recordatorio de la reunion del viernes</span></span><span class="pb-cuando">ayer</span></button></li>
            </ul>
            <button class="us-op pb-todos">Ver todos</button>
          </div>
        </div>

        <div class="us" data-pb>
          <button class="top-btn" data-pb-btn aria-expanded="false" aria-haspopup="dialog"
                  aria-controls="pb-not-top" aria-label="Notificaciones, 1 sin leer">${ICONOS.campana}<span class="badge" aria-hidden="true">1</span></button>
          <div class="us-menu pb-panel" id="pb-not-top" role="dialog" aria-label="Notificaciones" hidden>
            <div class="us-sec"><span class="us-et">Notificaciones</span></div>
            <ul class="pb-lista">
              <li><button class="pb-item pb-nuevo"><span class="pb-txt"><span class="pb-tit">Cierre de matricula</span><span class="pb-det">Quedan 3 dias para el cierre del periodo</span></span><span class="pb-cuando">hace 1 h</span><span class="pb-punto" aria-hidden="true"></span></button></li>
              <li><button class="pb-item"><span class="pb-txt"><span class="pb-tit">Copia de seguridad</span><span class="pb-det">Se completo correctamente</span></span><span class="pb-cuando">ayer</span></button></li>
            </ul>
            <button class="us-op pb-todos">Ver todas</button>
          </div>
        </div>

        <div class="us">
          <button class="avatar avatar-m avatar-2 top-avatar" id="us-btn" aria-expanded="false" aria-controls="us-menu"
                  aria-haspopup="menu" aria-label="Menú de JOSE ISIDRO PINEDA">JI</button>
          <div class="us-menu" id="us-menu" role="menu" hidden>
            <div class="us-cab">
              <span class="avatar avatar-m avatar-2">JI</span>
              <div class="us-txt">
                <span class="us-nom">JOSE ISIDRO PINEDA</span>
                <span class="us-mail">jose.pineda@ae.edu.pe</span>
              </div>
            </div>

            <div class="us-sec">
              <span class="us-et">Tema</span>
              <div class="us-tema" role="group" aria-label="Modo de color">
                <button id="b-claro" class="us-tema-b" aria-pressed="true" aria-label="Modo claro" title="Claro">${ICONOS.sol}</button>
                <button id="b-oscuro" class="us-tema-b" aria-pressed="false" aria-label="Modo oscuro" title="Oscuro">${ICONOS.luna}</button>
              </div>
            </div>

            <div class="us-sec">
              <span class="us-et">Densidad</span>
              <div class="us-tema" role="group" aria-label="Densidad de las tablas">
                <button id="d-comoda" class="us-tema-b" aria-pressed="true"
                        aria-label="Densidad cómoda" title="Cómoda">${icono('filas', TAMANOS.control)}</button>
                <button id="d-compacta" class="us-tema-b" aria-pressed="false"
                        aria-label="Densidad compacta" title="Compacta">${icono('filasFinas', TAMANOS.control)}</button>
              </div>
            </div>

            <div class="us-sec">
              <span class="us-et">Vista</span>
              <div class="us-tema" role="group" aria-label="Vista del catálogo">
                <button id="v-escritorio" class="us-tema-b" aria-pressed="true"
                        aria-label="Vista de escritorio" title="Escritorio">${ICONOS.escritorio}</button>
                <button id="v-movil" class="us-tema-b" aria-pressed="false"
                        aria-label="Vista web en móvil" title="Web en móvil">${ICONOS.movil}</button>
                <button id="v-app" class="us-tema-b" aria-pressed="false"
                        aria-label="Vista de aplicación móvil" title="App móvil">${ICONOS.panel}</button>
              </div>
            </div>

            <!-- La entrega para el área de sistemas. Es un enlace y no un
                 botón porque descargar un archivo es navegar a él: así funciona
                 con «guardar como», con el botón central y con teclado, sin
                 una línea de JavaScript. -->
            <a class="us-op us-zip" role="menuitem" href="${NOMBRE_ZIP}" download
               >${ICONOS.descargar}<span>Descargar el sistema <span class="us-zip-det">v${VERSION}</span></span></a>

            <button class="us-op us-salir" role="menuitem">${ICONOS.salir}<span>Salir del sistema</span></button>
          </div>
        </div>
      </div>
    </div>
    <main class="cat-cuerpo">${paginasCatalogo}
      <section class="pagina app-lista-pag" id="pg-app-seccion" hidden></section>
    </main>
  </div>

  <!-- ZONAS RESERVADAS DEL DISPOSITIVO. Se dibujan para que se vea dónde NO se
       puede poner nada: arriba la barra de estado y la muesca de cámara, abajo
       la barra de gestos o los botones del sistema. -->
  <div class="app-zona-arriba" aria-hidden="true"><span class="app-camara"></span></div>
  <nav class="app-tabs" id="app-tabs" aria-label="Secciones"></nav>
  <div class="app-zona-abajo" aria-hidden="true"><span class="app-gestos"></span></div>
</div>

<script>
// EL COMPRESOR DE PDF, insertado desde componentes/src/interno/comprimir-pdf.mjs
// SIN TOCARLE LA LOGICA. Es el mismo archivo que importa el componente de
// React: dos copias ensenarian dos compresiones distintas.
${COMPRESOR_PDF}

(function () {
  var raiz = document.documentElement;
  var bClaro = document.getElementById('b-claro');
  var bOscuro = document.getElementById('b-oscuro');

  // ── COMPONENTE: Paginación ───────────────────────────────────────────────
  // Un solo sitio. La tabla lo consume igual que cualquier otro listado; no
  // tiene copia propia. Antes la tenía, y la copia ya había divergido: sus
  // botones no llevaban aria-label ni aria-current.
  //
  //   Paginacion(caja, { total, porPagina, pagina, onCambio })
  //
  // Devuelve un objeto con .ir(n) y .estado(). Con una sola página no pinta
  // nada: el rango, que va fuera, es el que sigue informando.
  // Chevrons de verdad: los caracteres ‹ y › se leen mal o no se leen, y el
  // texto visible manda sobre el aria-label (SC 2.5.3, «Label in Name»).
  var CHEV_IZQ = '${ic("<path d=\'m15 18-6-6 6-6\'/>").replace(/'/g, "\\'")}';
  var CHEV_DER = '${ic("<path d=\'m9 18 6-6-6-6\'/>").replace(/'/g, "\\'")}';

  window.Paginacion = function (caja, o) {
    var pagina = o.pagina || 1;

    function paginas() {
      return o.porPagina ? Math.max(1, Math.ceil(o.total() / o.porPagina())) : 1;
    }

    function pintar() {
      var n = paginas();
      if (pagina > n) pagina = n;
      if (n <= 1) { caja.innerHTML = ''; return; }

      // Variante compacta: sin números. La regla del elemento dice que en móvil
      // no caben y el dedo falla, así que el componente la implementa —no basta
      // con documentarla—. En el catálogo la señal es la vista móvil; en la
      // aplicación real sería el ancho.
      if (document.documentElement.getAttribute('data-vista') === 'movil') {
        caja.innerHTML =
          '<button class="pgn-btn pgn-flecha" data-pgn="' + (pagina - 1) +
          '" aria-label="Página anterior"' + (pagina === 1 ? ' disabled' : '') + '>' +
          CHEV_IZQ + '<span>Anterior</span></button>' +
          '<span class="pg-pos" aria-current="page">' + pagina + ' de ' + n + '</span>' +
          '<button class="pgn-btn pgn-flecha" data-pgn="' + (pagina + 1) +
          '" aria-label="Página siguiente"' + (pagina === n ? ' disabled' : '') + '>' +
          '<span>Siguiente</span>' + CHEV_DER + '</button>';
        return;
      }

      var b = ['<button class="pgn-btn pgn-flecha" data-pgn="' + (pagina - 1) +
        '" aria-label="Página anterior"' + (pagina === 1 ? ' disabled' : '') + '>' +
        CHEV_IZQ + '<span>Anterior</span></button>'];
      for (var p = 1; p <= n; p++) {
        if (p === 1 || p === n || Math.abs(p - pagina) <= 1) {
          b.push('<button class="pgn-btn' + (p === pagina ? ' activa' : '') +
            '" data-pgn="' + p + '" aria-label="Página ' + p + '"' +
            (p === pagina ? ' aria-current="page"' : '') + '>' + p + '</button>');
        } else if (Math.abs(p - pagina) === 2) {
          b.push('<span class="pgn-elip" aria-hidden="true">…</span>');
        }
      }
      b.push('<button class="pgn-btn pgn-flecha" data-pgn="' + (pagina + 1) +
        '" aria-label="Página siguiente"' + (pagina === n ? ' disabled' : '') + '>' +
        '<span>Siguiente</span>' + CHEV_DER + '</button>');
      caja.innerHTML = b.join('');
    }

    caja.setAttribute('role', 'navigation');
    caja.setAttribute('aria-label', o.etiqueta || 'Paginación');
    caja.addEventListener('click', function (e) {
      var b = e.target.closest('.pgn-btn');
      if (!b || b.disabled) return;
      pagina = Number(b.dataset.pgn);
      pintar();
      if (o.onCambio) o.onCambio(pagina);
    });

    pintar();
    var api = {
      pagina: function () { return pagina; },
      ir: function (n) { pagina = n; pintar(); },
      refrescar: pintar,
    };
    (window.__paginaciones = window.__paginaciones || []).push(api);
    return api;
  };

  // La CLASE de cada token en cada modo. Antes era el hexadecimal, pero un
  // hexadecimal no se puede escribir en el codigo: lo que se aplica es la clase.
  var clases = ${JSON.stringify(
    Object.fromEntries(Object.entries(semanticos).map(([k, v]) => [k, v.origen]))
  )};

  function aplicar(modo) {
    raiz.setAttribute('data-tema', modo);
    bClaro.setAttribute('aria-pressed', String(modo === 'claro'));
    bOscuro.setAttribute('aria-pressed', String(modo === 'oscuro'));
    // La clase mostrada bajo cada muestra sigue al modo: en oscuro un token
    // sale de otro escalon, y decir el de claro seria mentir.
    document.querySelectorAll('[data-hex-de]').forEach(function (el) {
      var t = clases[el.getAttribute('data-hex-de')];
      if (t) el.textContent = t[modo] === 'directo' ? 'sin rampa' : t[modo];
    });
    try { localStorage.setItem('mmi-tema', modo); } catch (e) {}
  }

  bClaro.addEventListener('click', function () { aplicar('claro'); });
  bOscuro.addEventListener('click', function () { aplicar('oscuro'); });

  var guardado = null;
  try { guardado = localStorage.getItem('mmi-tema'); } catch (e) {}
  aplicar(guardado || 'claro');

  // ── Navegación del catálogo ──────────────────────────────────────────────
  var paginas = document.querySelectorAll('.pagina');
  var enlaces = document.querySelectorAll('.nav-hijo[data-ir], .nav-nieto[data-ir]');

  // Los grupos nacen comprimidos. Se abren al pasar el ratón y se cierran al
  // salir, salvo el que está FIJADO, que es el de la página en curso.
  var grupos = document.querySelectorAll('.nav-grupo');

  function sincronizarGrupo(g) {
    // Plegada, el FIJADO no abre el panel flotante: solo el cursor. Si no, al
    // elegir una opción el grupo queda fijado y el panel se reabre solo.
    var plegada = document.getElementById('lateral').classList.contains('colapsado');
    var abierto = (!plegada && g.classList.contains('fijo')) || g.classList.contains('hover');
    g.classList.toggle('abierto', abierto);
    g.querySelector('.nav-grupo-tit').setAttribute('aria-expanded', String(abierto));
  }

  grupos.forEach(function (g) {
    // Retardo al salir: plegada, el cursor tiene que recorrer los 56px del
    // carril hasta el panel flotante. Sin margen, el panel se cierra por el
    // camino y no hay forma de llegar a elegir.
    var salida = null;
    g.addEventListener('mouseenter', function () {
      clearTimeout(salida);
      g.classList.add('hover');
      sincronizarGrupo(g);
    });
    g.addEventListener('mouseleave', function () {
      clearTimeout(salida);
      salida = setTimeout(function () {
        g.classList.remove('hover');
        sincronizarGrupo(g);
      }, 220);
    });
    // Con teclado no hay ratón: al enfocar dentro, se abre igual.
    g.addEventListener('focusin', function () { g.classList.add('hover'); sincronizarGrupo(g); });
    g.addEventListener('focusout', function (e) {
      if (!g.contains(e.relatedTarget)) { g.classList.remove('hover'); sincronizarGrupo(g); }
    });
    sincronizarGrupo(g);
  });

  // Las ramas de segundo nivel se despliegan al pulsar su título.
  document.querySelectorAll('[data-abrir-rama]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = b.closest('.nav-rama');
      var ab = !r.classList.contains('abierta');
      r.classList.toggle('abierta', ab);
      b.setAttribute('aria-expanded', String(ab));
    });
  });

  // El título del grupo fija o suelta. Fijar es la forma de dejarlo abierto
  // sin tener el cursor encima.
  document.querySelectorAll('[data-desplegar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.closest('.nav-grupo');
      var yaFijo = g.classList.contains('fijo');
      grupos.forEach(function (o) { o.classList.remove('fijo'); sincronizarGrupo(o); });
      if (!yaFijo) g.classList.add('fijo');
      sincronizarGrupo(g);
    });
  });

  // Plegado de la lateral del cascarón. Tiene su propio manejador y el
  // genérico de las maquetas lo salta: si los dos actúan sobre el mismo botón
  // se anulan entre sí, y el ancho queda un clic por detrás de la clase.
  function velo(poner) {
    var app = document.querySelector('.app-cascaron');
    var v = app.querySelector('.velo');
    if (poner && !v) {
      v = document.createElement('div');
      v.className = 'velo';
      v.addEventListener('click', function () {
        plegarLateral(true);
        velo(false);
      });
      app.appendChild(v);
    } else if (!poner && v) v.remove();
  }

  /* R48 · UN SOLO SITIO QUE PLIEGA.
     La clase, el aria y la apertura de los grupos salen del MISMO estado.
     Estaban repartidos, y cada camino —el botón, el velo, la banda de ancho,
     el conmutador de vista— tenía que acordarse de los tres: la banda no se
     acordaba de ninguno, y el botón no tocaba el aria en toda su vida.
     Devuelve el estado que QUEDA, no el que se pidió. */
  function plegarLateral(poner) {
    var lateral = document.getElementById('lateral');
    var nuevo = poner === undefined ? !lateral.classList.contains('colapsado') : !!poner;
    lateral.classList.toggle('colapsado', nuevo);
    var boton = document.getElementById('plegar-cat');
    boton.setAttribute('aria-expanded', String(!nuevo));
    boton.setAttribute('aria-label', nuevo ? 'Desplegar menú' : 'Plegar menú');
    // Al plegar cambia la regla de apertura: fijado deja de abrir y solo abre
    // el cursor. Sin re-sincronizar, el grupo fijado se quedaba como panel
    // flotante atascado, abierto sin que nadie lo hubiera pedido.
    document.querySelectorAll('.nav-grupo').forEach(function (g) {
      g.classList.remove('hover');
      sincronizarGrupo(g);
    });
    return nuevo;
  }

  document.getElementById('plegar-cat').addEventListener('click', function () {
    var plegado = plegarLateral();
    if (document.documentElement.getAttribute('data-vista') === 'movil') velo(!plegado);
  });

  function abrir(id) {
    var hay = false;
    paginas.forEach(function (p) {
      var esta = p.id === 'pg-' + id;
      p.hidden = !esta;
      if (esta) hay = true;
    });
    if (!hay) return abrir('inicio');
    enlaces.forEach(function (a) {
      var act = a.getAttribute('data-ir') === id;
      a.classList.toggle('activo', act);
    });
    // El grupo de la página en curso queda FIJADO: se queda abierto aunque el
    // cursor se vaya. Los demás vuelven a comprimirse. Si el activo está en
    // una rama de segundo nivel, la rama también se abre.
    var plegada = document.getElementById('lateral').classList.contains('colapsado');
    var activo = document.querySelector('.nav-hijo.activo, .nav-nieto.activo');
    document.querySelectorAll('.nav-rama').forEach(function (r) {
      var dentro = !!activo && r.contains(activo);
      if (dentro) {
        r.classList.add('abierta');
        r.querySelector('.nav-rama-tit').setAttribute('aria-expanded', 'true');
      }
    });
    document.querySelectorAll('.nav-grupo').forEach(function (g) {
      g.classList.toggle('fijo', !!activo && g.contains(activo));
      var ab = (!plegada && g.classList.contains('fijo')) || g.classList.contains('hover');
      g.classList.toggle('abierto', ab);
      g.querySelector('.nav-grupo-tit').setAttribute('aria-expanded', String(ab));
    });
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    document.querySelector('.cat-cuerpo').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ir]');
    if (!a) return;
    e.preventDefault();
    abrir(a.getAttribute('data-ir'));
    // Con la lateral plegada, elegir cierra el panel flotante y la lateral
    // sigue plegada: quien la plegó quiere que siga así.
    // En móvil, elegir cierra la lateral: ocupa media pantalla.
    if (document.documentElement.getAttribute('data-vista') === 'movil' && a.closest('.lat')) {
      plegarLateral(true);
      var v = document.querySelector('.velo');
      if (v) v.remove();
    }
    var g = a.closest('.nav-grupo');
    if (g && document.getElementById('lateral').classList.contains('colapsado')) {
      // Se quita el hover a mano: el cursor sigue encima tras el clic, así que
      // no habrá mouseleave hasta que la persona lo mueva.
      document.querySelectorAll('.nav-grupo').forEach(function (o) {
        o.classList.remove('hover');
        o.classList.remove('abierto');
        o.querySelector('.nav-grupo-tit').setAttribute('aria-expanded', 'false');
      });
    }
  });

  window.addEventListener('hashchange', function () {
    abrir(location.hash.slice(1) || 'inicio');
  });

  abrir(location.hash.slice(1) || 'inicio');

  // ── Tabla de datos ───────────────────────────────────────────────────────
  (function () {
    var tabla = document.getElementById('tb-tabla');
    if (!tabla) return;
    var FILAS = ${JSON.stringify(FILAS_TABLA)};
    var COLS = ${JSON.stringify(COLUMNAS)};
    var CLAVE = 'mmi-tabla-asistencia';

    var cab = document.getElementById('tb-cab');
    var cuerpo = document.getElementById('tb-cuerpo');
    var selTam = document.getElementById('tb-tam');
    var panel = document.getElementById('tb-cols-panel');
    var btnCols = document.getElementById('tb-cols-btn');

    // Configuración recordada por persona: columnas visibles, orden y tamaño.
    var cfg = { ocultas: [], orden: null, dir: 1, tam: 10, pag: 1 };
    try {
      var g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (g) { cfg.ocultas = g.ocultas || []; cfg.orden = g.orden || null; cfg.dir = g.dir || 1; cfg.tam = g.tam == null ? 10 : g.tam; }
    } catch (e) {}
    function guardar() {
      try { localStorage.setItem(CLAVE, JSON.stringify({ ocultas: cfg.ocultas, orden: cfg.orden, dir: cfg.dir, tam: cfg.tam })); } catch (e) {}
    }

    var visibles = function () { return COLS.filter(function (c) { return cfg.ocultas.indexOf(c.k) === -1; }); };

    // Los filtros NO se guardan. La configuración —columnas, orden, tamaño— sí,
    // porque es preferencia. Un filtro guardado hace que la persona vuelva al
    // día siguiente, vea 3 filas de 38 y crea que faltan datos.
    var filtros = {};
    var busca = '';

    function plano(s) {
      return String(s).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
    }

    function filtradas() {
      return FILAS.filter(function (f) {
        for (var k in filtros) {
          if (!filtros[k]) continue;
          if (plano(f[k]).indexOf(plano(filtros[k])) === -1) return false;
        }
        if (busca) {
          var hay = visibles().some(function (c) {
            return c.tipo !== 'indice' && plano(f[c.k]).indexOf(plano(busca)) !== -1;
          });
          if (!hay) return false;
        }
        return true;
      });
    }

    function ordenadas() {
      var f = filtradas();
      if (!cfg.orden) return f;
      var col = COLS.filter(function (c) { return c.k === cfg.orden; })[0];
      return f.sort(function (a, b) {
        var x = a[cfg.orden], y = b[cfg.orden];
        if (col && col.tipo === 'numero') return (x - y) * cfg.dir;
        return String(x).localeCompare(String(y), 'es', { sensitivity: 'base' }) * cfg.dir;
      });
    }

    function pintar() {
      var f = ordenadas();
      var tam = cfg.tam || f.length;
      var paginas = Math.max(1, Math.ceil(f.length / tam));
      if (cfg.pag > paginas) cfg.pag = paginas;
      var desde = (cfg.pag - 1) * tam;
      var trozo = f.slice(desde, desde + tam);

      // Encabezado: cada columna ordena, con flecha y aria-sort.
      cab.innerHTML = visibles().map(function (c) {
        // La columna de índice no ordena: es un localizador, no un dato.
        if (c.tipo === 'indice') {
          return '<th class="tb-th tb-th-indice"><span class="tb-th-txt tb-num">' + c.t + '</span></th>';
        }
        var act = cfg.orden === c.k;
        var aria = act ? (cfg.dir === 1 ? 'ascending' : 'descending') : 'none';
        return '<th class="tb-th' + (c.tipo === 'numero' ? ' tb-num' : '') + '" aria-sort="' + aria + '">' +
          '<button class="tb-orden' + (act ? ' activo' : '') + '" data-col="' + c.k + '">' +
          '<span>' + c.t + '</span>' +
          '<span class="tb-flecha">' + (act ? (cfg.dir === 1 ? '↑' : '↓') : '') + '</span></button></th>';
      }).join('') + '<th class="tb-th"></th>';

      // Fila de filtros: lista donde hay pocos valores, texto donde no.
      var filaF = document.getElementById('tb-filtros');
      filaF.innerHTML = visibles().map(function (c) {
        if (!c.filtro) return '<td class="tb-f-celda"></td>';
        if (c.filtro === 'lista') {
          var vals = FILAS.map(function (x) { return x[c.k]; })
            .filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
          return '<td class="tb-f-celda"><select class="campo tb-f" data-col="' + c.k + '">' +
            '<option value="">Todos</option>' +
            vals.map(function (v) {
              return '<option' + (filtros[c.k] === v ? ' selected' : '') + '>' + v + '</option>';
            }).join('') + '</select></td>';
        }
        return '<td class="tb-f-celda"><input class="campo tb-f" data-col="' + c.k +
          '" value="' + (filtros[c.k] || '') + '" placeholder="Filtrar" aria-label="Filtrar por ' + c.t + '"></td>';
      }).join('') + '<td class="tb-f-celda"></td>';

      // Resumen de filtros activos, para que nadie olvide que están puestos.
      var activos = Object.keys(filtros).filter(function (k) { return filtros[k]; });
      var cajaAct = document.getElementById('tb-activos');
      if (!activos.length && !busca) cajaAct.hidden = true;
      else {
        cajaAct.hidden = false;
        cajaAct.innerHTML = (busca ? '<span class="tb-act">Busca: <b>' + busca + '</b>' +
          '<button class="tb-act-x" data-quitar="__busca" aria-label="Quitar búsqueda">' + '${ICO_X.replace(/'/g, "\\'")}' + '</button></span>' : '') +
          activos.map(function (k) {
            var c = COLS.filter(function (x) { return x.k === k; })[0];
            return '<span class="tb-act">' + c.t + ': <b>' + filtros[k] + '</b>' +
              '<button class="tb-act-x" data-quitar="' + k + '" aria-label="Quitar filtro de ' + c.t + '">' + '${ICO_X.replace(/'/g, "\\'")}' + '</button></span>';
          }).join('') +
          '<button class="tb-act-todo">Quitar todos</button>';
      }

      cuerpo.innerHTML = trozo.length ? trozo.map(function (fila, i) {
        return '<tr class="' + (i % 2 ? 'tb-alt' : '') + '">' + visibles().map(function (c) {
          var v = fila[c.k];
          // Numeración continua: la página 2 empieza en 11, no vuelve a 1.
          if (c.tipo === 'indice') return '<td class="tb-indice mono">' + (desde + i + 1) + '</td>';
          if (c.tipo === 'chip') return '<td><span class="chip chip-' + fila.est + '">' + v + '</span></td>';
          if (c.tipo === 'numero') return '<td class="tb-num mono">' + (v || '—') + '</td>';
          if (c.tipo === 'mono') return '<td class="mono">' + v + '</td>';
          return '<td>' + v + '</td>';
        }).join('') + '<td class="tb-acc"><a href="#" class="enlace">Editar</a></td></tr>';
      }).join('')
        : '<tr><td colspan="' + (visibles().length + 1) + '" class="tb-vacio">' +
          '<strong>Sin resultados' + (busca ? ' para «' + busca + '»' : '') + '.</strong><br>' +
          (activos.length || busca
            ? 'Prueba con menos filtros, o <button class="tb-vacio-quitar">quítalos todos</button>.'
            : 'No hay trabajadores registrados todavía.') + '</td></tr>';

      // Con un filtro puesto se muestra siempre «X de Y», aunque X sea igual
      // que Y. Si no, un filtro que no descarta nada parece no haber hecho nada.
      var total = filtradas().length;
      var hayFiltro = activos.length > 0 || !!busca;
      document.getElementById('tb-conteo').textContent = hayFiltro
        ? total + ' de ' + FILAS.length + ' trabajadores'
        : FILAS.length + ' trabajadores';
      document.getElementById('tb-rango').textContent = f.length
        ? (desde + 1) + '–' + Math.min(desde + tam, f.length) + ' de ' + f.length
        : '0 de 0';

      // La tabla NO pinta su paginación: la delega en el componente.
      if (!pgn) {
        pgn = window.Paginacion(document.getElementById('tb-pag'), {
          etiqueta: 'Paginación de la tabla',
          total: function () { return filtradas().length; },
          porPagina: function () { return cfg.tam || filtradas().length; },
          pagina: cfg.pag,
          onCambio: function (n) { cfg.pag = n; pintar(); },
        });
      } else if (pgn.pagina() !== cfg.pag) pgn.ir(cfg.pag);
      else pgn.refrescar();

      selTam.value = String(cfg.tam);
    }
    var pgn = null;

    function pintarPanel() {
      panel.innerHTML = COLS.map(function (c) {
        var vis = cfg.ocultas.indexOf(c.k) === -1;
        return '<label class="tb-col-op' + (c.fija ? ' fija' : '') + '">' +
          '<input type="checkbox" data-col="' + c.k + '"' + (vis ? ' checked' : '') + (c.fija ? ' disabled' : '') + '>' +
          '<span>' + c.t + '</span>' + (c.fija ? '<em>fija</em>' : '') + '</label>';
      }).join('') + '<button class="tb-col-reset">Restablecer</button>';
    }

    // ── Filtros ──────────────────────────────────────────────────────────
    var btnF = document.getElementById('tb-filtros-btn');
    var filaFiltros = document.getElementById('tb-filtros');
    btnF.addEventListener('click', function () {
      var abierto = !filaFiltros.hidden;
      filaFiltros.hidden = abierto;
      btnF.setAttribute('aria-expanded', String(!abierto));
      btnF.classList.toggle('activo', !abierto);
    });

    function aplicar() { cfg.pag = 1; pintar(); }

    filaFiltros.addEventListener('input', function (e) {
      var el = e.target.closest('.tb-f'); if (!el) return;
      filtros[el.dataset.col] = el.value.trim();
      aplicar();
      // El re-render pierde el foco: se devuelve a la misma celda.
      var nuevo = filaFiltros.querySelector('.tb-f[data-col="' + el.dataset.col + '"]');
      if (nuevo && nuevo.tagName === 'INPUT') { nuevo.focus(); nuevo.setSelectionRange(nuevo.value.length, nuevo.value.length); }
    });
    filaFiltros.addEventListener('change', function (e) {
      var el = e.target.closest('select.tb-f'); if (!el) return;
      filtros[el.dataset.col] = el.value;
      aplicar();
    });

    var cajaBuscar = document.getElementById('tb-buscar');
    cajaBuscar.addEventListener('input', function () {
      busca = cajaBuscar.value.trim(); aplicar();
    });

    document.getElementById('tb-activos').addEventListener('click', function (e) {
      var x = e.target.closest('[data-quitar]');
      if (x) {
        if (x.dataset.quitar === '__busca') { busca = ''; cajaBuscar.value = ''; }
        else filtros[x.dataset.quitar] = '';
        return aplicar();
      }
      if (e.target.closest('.tb-act-todo')) {
        filtros = {}; busca = ''; cajaBuscar.value = ''; aplicar();
      }
    });
    cuerpo.addEventListener('click', function (e) {
      if (e.target.closest('.tb-vacio-quitar')) {
        filtros = {}; busca = ''; cajaBuscar.value = ''; aplicar();
      }
    });

    // Ordenar: primer clic ascendente, segundo descendente, tercero quita el orden.
    cab.addEventListener('click', function (e) {
      var b = e.target.closest('.tb-orden'); if (!b) return;
      var k = b.dataset.col;
      if (cfg.orden !== k) { cfg.orden = k; cfg.dir = 1; }
      else if (cfg.dir === 1) cfg.dir = -1;
      else { cfg.orden = null; cfg.dir = 1; }
      guardar(); pintar();
    });

    selTam.addEventListener('change', function () {
      var n = Number(selTam.value);
      if (n === 0 && FILAS.length > 500 &&
          !confirm('Vas a pintar ' + FILAS.length + ' filas de una vez. Puede tardar. ¿Continuar?')) {
        selTam.value = String(cfg.tam); return;
      }
      cfg.tam = n; cfg.pag = 1; guardar(); pintar();
    });

    btnCols.addEventListener('click', function () {
      var abierto = !panel.hidden;
      panel.hidden = abierto;
      btnCols.setAttribute('aria-expanded', String(!abierto));
      if (!abierto) pintarPanel();
    });
    panel.addEventListener('change', function (e) {
      var ch = e.target.closest('input[data-col]'); if (!ch) return;
      var k = ch.dataset.col;
      if (ch.checked) cfg.ocultas = cfg.ocultas.filter(function (x) { return x !== k; });
      else cfg.ocultas.push(k);
      guardar(); pintar();
    });
    panel.addEventListener('click', function (e) {
      if (!e.target.closest('.tb-col-reset')) return;
      cfg.ocultas = []; cfg.orden = null; cfg.dir = 1; cfg.tam = 10; cfg.pag = 1;
      guardar(); pintarPanel(); pintar();
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !e.target.closest('.tb-cols-menu')) {
        panel.hidden = true; btnCols.setAttribute('aria-expanded', 'false');
      }
    });

    // CSV del conjunto ORDENADO Y FILTRADO, no de la página visible.
    document.getElementById('tb-csv').addEventListener('click', function () {
      var cols = visibles();
      var esc = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
      var lineas = [cols.map(function (c) { return esc(c.t); }).join(';')];
      ordenadas().forEach(function (f, i) {
        lineas.push(cols.map(function (c) {
          return esc(c.tipo === 'indice' ? i + 1 : f[c.k]);
        }).join(';'));
      });
      // BOM para que Excel en Windows lea bien las tildes.
      var blob = new Blob(['\\ufeff' + lineas.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'asistencia-personal.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    pintar();
  })();

  // ── Interruptor ──────────────────────────────────────────────────────────
  document.querySelectorAll('[data-sw]').forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    });
  });

  // ── Miniaturas de las demostraciones de la fila de carga (R102) ──────────
  // El escudo pesa 101 KB y aqui hacen falta cuatro miniaturas de 22 px. Si
  // cada una llevara su base64, el catalogo engordaba 540 KB para pintar
  // cuatro cuadrados. Se embebe UNA vez y las demas copian su «src».
  (function () {
    var fuente = document.getElementById('cx-demo-fuente');
    if (!fuente) return;
    document.querySelectorAll('img.cx-mini[data-mini]').forEach(function (img) {
      img.src = fuente.src;
    });
  })();

  // ── Selección múltiple ───────────────────────────────────────────────────
  (function () {
    var lista = document.querySelector('[data-ms-lista]');
    if (!lista) return;
    var todas = document.querySelector('[data-ms-todas]');
    var conteo = document.querySelector('[data-ms-conteo]');
    var ops = lista.querySelectorAll('[data-ms]');

    function refrescar() {
      var n = 0;
      ops.forEach(function (o) { if (o.checked) n++; });
      todas.checked = n === ops.length;
      // Parcial: ni todas ni ninguna. No es un tercer valor, es un resumen.
      todas.indeterminate = n > 0 && n < ops.length;
      conteo.textContent = n === 0 ? 'Ninguno marcado'
        : n === ops.length ? 'Los ' + n + ' marcados'
        : n + ' de ' + ops.length + ' marcados';
    }
    ops.forEach(function (o) { o.addEventListener('change', refrescar); });
    todas.addEventListener('change', function () {
      ops.forEach(function (o) { o.checked = todas.checked; });
      refrescar();
    });
    var indet = document.querySelector('[data-indet]');
    if (indet) indet.indeterminate = true;
    refrescar();
  })();

  // ── Rango de fechas con calendario ───────────────────────────────────────
  (function () {
    var cal = document.getElementById('fc-cal');
    if (!cal) return;
    var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    var hoy = new Date();
    var ancla = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    var ini = null, fin = null, sobre = null;

    var d2 = function (n) { return String(n).padStart(2, '0'); };
    var clave = function (d) { return d.getFullYear() + '-' + d2(d.getMonth() + 1) + '-' + d2(d.getDate()); };
    var esp = function (d) { return d2(d.getDate()) + '/' + d2(d.getMonth() + 1) + '/' + d.getFullYear(); };
    var dias = function (a, b) { return Math.round((b - a) / 86400000) + 1; };

    function mes(base) {
      var y = base.getFullYear(), m = base.getMonth();
      // Semana que empieza en lunes: el domingo pasa de 0 a 6.
      var primero = (new Date(y, m, 1).getDay() + 6) % 7;
      var total = new Date(y, m + 1, 0).getDate();
      var celdas = [];
      for (var i = 0; i < primero; i++) celdas.push('<span class="fc-d fc-vacio"></span>');
      for (var d = 1; d <= total; d++) {
        var f = new Date(y, m, d);
        var t = f.getTime();
        var hasta = fin || (ini && sobre && sobre > ini ? sobre : null);
        var esIni = ini && t === ini.getTime();
        var esFin = fin && t === fin.getTime();
        var dentro = ini && hasta && t > ini.getTime() && t < hasta.getTime();
        var clases = 'fc-d' +
          (esIni ? ' fc-ini' : '') + (esFin ? ' fc-fin' : '') +
          (dentro ? ' fc-dentro' : '') +
          (!fin && ini && sobre && t === sobre.getTime() && t > ini.getTime() ? ' fc-fin fc-previo' : '');
        celdas.push('<button type="button" class="' + clases + '" data-f="' + clave(f) + '"' +
          (esIni || esFin ? ' aria-current="date"' : '') +
          ' aria-label="' + d + ' de ' + MESES[m] + ' de ' + y + '">' + d + '</button>');
      }
      return '<div class="fc-mes"><div class="fc-mes-tit">' + MESES[m] + ' ' + y + '</div>' +
        '<div class="fc-sem">' + DIAS.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>' +
        '<div class="fc-dias">' + celdas.join('') + '</div></div>';
    }

    var cajaIni = document.getElementById('fc-ini');
    var cajaFin = document.getElementById('fc-fin');
    var cal = document.getElementById('fc-cal');
    var modo = 'ini';

    function abrir(cual) {
      // Si aún no hay inicio, siempre se empieza por el inicio.
      modo = (cual === 'fin' && ini) ? 'fin' : 'ini';
      if (modo === 'ini') { ini = null; fin = null; }
      cal.hidden = false;
      cajaIni.setAttribute('aria-expanded', 'true');
      cajaFin.setAttribute('aria-expanded', 'true');
      if (ini) ancla = new Date(ini.getFullYear(), ini.getMonth(), 1);
      pintar();
    }
    function cerrar() {
      cal.hidden = true;
      sobre = null;
      cajaIni.setAttribute('aria-expanded', 'false');
      cajaFin.setAttribute('aria-expanded', 'false');
      pintar();
    }

    function pintar() {
      var sig = new Date(ancla.getFullYear(), ancla.getMonth() + 1, 1);
      document.getElementById('fc-cuerpo').innerHTML = mes(ancla) + mes(sig);
      document.getElementById('fc-titulo').textContent =
        MESES[ancla.getMonth()] + ' – ' + MESES[sig.getMonth()] + ' ' + sig.getFullYear();
      cajaIni.value = ini ? esp(ini) : '';
      cajaFin.value = fin ? esp(fin) : '';
      cajaIni.classList.toggle('fc-activo', !cal.hidden && modo === 'ini');
      cajaFin.classList.toggle('fc-activo', !cal.hidden && modo === 'fin');
      var pista = document.getElementById('fc-pista');
      if (pista) pista.textContent = modo === 'ini'
        ? 'Elige la fecha de inicio.'
        : 'Elige la fecha de fin. Inicio: ' + esp(ini) + '.';
      document.getElementById('fc-resumen').textContent = ini && fin
        ? 'Del ' + esp(ini) + ' al ' + esp(fin) + ' · ' + dias(ini, fin) + ' días.'
        : 'Sin rango elegido.';
    }

    [cajaIni, cajaFin].forEach(function (c) {
      var cual = c === cajaIni ? 'ini' : 'fin';
      c.addEventListener('focus', function () { abrir(cual); });
      c.addEventListener('click', function () { if (cal.hidden) abrir(cual); });
    });

    document.getElementById('fc-cuerpo').addEventListener('click', function (e) {
      var b = e.target.closest('.fc-d[data-f]'); if (!b) return;
      var p = b.dataset.f.split('-');
      var f = new Date(+p[0], +p[1] - 1, +p[2]);
      if (modo === 'ini') {
        ini = f; fin = null; modo = 'fin'; sobre = null;
        cajaIni.value = esp(ini); cajaFin.value = '';
        cajaIni.classList.remove('fc-activo'); cajaFin.classList.add('fc-activo');
        document.getElementById('fc-pista').textContent = 'Elige la fecha de fin. Inicio: ' + esp(ini) + '.';
        resaltar();
        cajaFin.focus({ preventScroll: true });
      } else {
        // Un clic anterior al inicio no se rechaza: pasa a ser el nuevo inicio.
        if (f < ini) { ini = f; sobre = null; pintar(); return; }
        fin = f;
        // Rango completo: los calendarios se van y quedan las dos fechas.
        cerrar();
      }
    });
    // La previsualización SOLO cambia clases. Si repintara el calendario, con
    // un ratón real el botón se destruiría entre el mousedown y el mouseup y
    // el clic no llegaría a dispararse: era la razón de que el segundo clic
    // no hiciera nada.
    function resaltar() {
      var hasta = fin || (ini && sobre && sobre > ini ? sobre : null);
      document.getElementById('fc-cuerpo').querySelectorAll('.fc-d[data-f]').forEach(function (b) {
        var p = b.dataset.f.split('-');
        var t = new Date(+p[0], +p[1] - 1, +p[2]).getTime();
        var esIni = ini && t === ini.getTime();
        var esFin = fin && t === fin.getTime();
        var previo = !fin && ini && sobre && t === sobre.getTime() && t > ini.getTime();
        b.classList.toggle('fc-ini', !!esIni);
        b.classList.toggle('fc-fin', !!esFin || !!previo);
        b.classList.toggle('fc-previo', !!previo);
        b.classList.toggle('fc-dentro', !!(ini && hasta && t > ini.getTime() && t < hasta.getTime()));
      });
    }

    document.getElementById('fc-cuerpo').addEventListener('mouseover', function (e) {
      var b = e.target.closest('.fc-d[data-f]'); if (!b || !ini || fin) return;
      var p = b.dataset.f.split('-');
      sobre = new Date(+p[0], +p[1] - 1, +p[2]);
      resaltar();
    });
    document.getElementById('fc-cuerpo').addEventListener('mouseleave', function () {
      if (!fin) { sobre = null; resaltar(); }
    });
    document.getElementById('fc-prev').addEventListener('click', function () {
      ancla = new Date(ancla.getFullYear(), ancla.getMonth() - 1, 1); pintar();
    });
    document.getElementById('fc-next').addEventListener('click', function () {
      ancla = new Date(ancla.getFullYear(), ancla.getMonth() + 1, 1); pintar();
    });
    document.getElementById('fc-limpiar').addEventListener('click', function () {
      ini = fin = sobre = null; modo = 'ini'; cerrar();
    });
    document.querySelectorAll('[data-fc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var y = hoy.getFullYear(), m = hoy.getMonth(), k = b.dataset.fc;
        if (k === 'mes') { ini = new Date(y, m, 1); fin = new Date(y, m + 1, 0); }
        else if (k === 'mes-pasado') { ini = new Date(y, m - 1, 1); fin = new Date(y, m, 0); }
        else if (k === 'bimestre') { ini = new Date(y, m - 1, 1); fin = new Date(y, m + 1, 0); }
        else { ini = new Date(y, 0, 1); fin = new Date(y, 11, 31); }
        ancla = new Date(ini.getFullYear(), ini.getMonth(), 1);
        // El atajo deja el rango completo: no hay nada que elegir, se cierra.
        cerrar();
      });
    });
    document.addEventListener('click', function (e) {
      // isConnected: al elegir un día el calendario se repinta y el botón
      // pulsado queda desconectado del DOM. Sin esta comprobación, closest()
      // no lo encuentra dentro y el clic se toma por externo: el calendario se
      // cerraba justo al marcar el inicio.
      if (!cal.hidden && e.target.isConnected && !e.target.closest('#fc-zona')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !cal.hidden) { cerrar(); cajaIni.blur(); }
    });
    pintar();
  })();

  // ── Barra de progreso ────────────────────────────────────────────────────
  (function () {
    var barra = document.getElementById('pr-barra');
    if (!barra) return;
    var relleno = document.getElementById('pr-relleno');
    var pct = document.getElementById('pr-pct');
    var pie = document.getElementById('pr-pie');
    var TOTAL = 120, n = 0, t = null;

    function ver() {
      var p = Math.round((n / TOTAL) * 100);
      relleno.style.width = p + '%';
      barra.setAttribute('aria-valuenow', String(p));
      pct.textContent = p + ' %';
      pie.textContent = n + ' de ' + TOTAL + ' filas';
      relleno.classList.toggle('pr-exito', n === TOTAL);
    }
    document.getElementById('pr-ir').addEventListener('click', function () {
      if (t) return;
      t = setInterval(function () {
        n = Math.min(TOTAL, n + 4);
        ver();
        if (n === TOTAL) { clearInterval(t); t = null; }
      }, 80);
    });
    document.getElementById('pr-reset').addEventListener('click', function () {
      clearInterval(t); t = null; n = 0; ver();
    });
    ver();
  })();

  // ── Confirmación en línea ────────────────────────────────────────────────
  (function () {
    var lista = document.getElementById('cf-lista');
    if (!lista) return;
    var banda = document.getElementById('cf-banda');
    var datos = [
      ['Álvarez Ponce, Rosa', '70000000'],
      ['Quispe Mamani, Lucía', '70137923'],
      ['Rojas Vega, Luis', '70275846'],
      ['Fernández Cruz, María', '70413769'],
    ];
    var pendiente = null, origen = null;

    function pintar() {
      lista.innerHTML = datos.map(function (d, i) {
        return '<div class="cf-item' + (pendiente === i ? ' cf-marcada' : '') + '">' +
          '<span><span class="cf-nom">' + d[0] + '</span><span class="cf-meta mono">' + d[1] + '</span></span>' +
          '<button class="btn btn-terc btn-mini" data-cf-del="' + i + '">Eliminar</button></div>';
      }).join('') || '<div class="cf-item"><span class="cf-meta">No queda ninguno. Recarga la página para volver a empezar.</span></div>';
    }

    function abrir(i, boton) {
      pendiente = i; origen = boton;
      document.getElementById('cf-titulo').textContent = 'Eliminar a ' + datos[i][0];
      document.getElementById('cf-linea').textContent = 'No se puede deshacer.';
      banda.hidden = false;
      requestAnimationFrame(function () { banda.classList.add('abierta'); });
      banda.setAttribute('role', 'region');
      banda.setAttribute('aria-live', 'assertive');
      pintar();
      // El foco va a la banda: dejarlo atrás obliga a buscarla.
      document.getElementById('cf-ok').focus();
    }

    function cerrar() {
      banda.classList.remove('abierta');
      pendiente = null;
      pintar();
      setTimeout(function () { banda.hidden = true; }, 260);
      if (origen && document.contains(origen)) origen.focus();
    }

    lista.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cf-del]');
      if (b) abrir(Number(b.dataset.cfDel), b);
    });
    document.getElementById('cf-cancelar').addEventListener('click', cerrar);
    document.getElementById('cf-ok').addEventListener('click', function () {
      var nombre = datos[pendiente][0];
      datos.splice(pendiente, 1);
      cerrar();
      if (window.avisarDemo) window.avisarDemo('exito', 'Se eliminó a ' + nombre);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !banda.hidden) cerrar();
    });

    pintar();
  })();

  // ── SOLO UN DESPLEGABLE ABIERTO ──────────────────────────────────────────
  // Lo reporto el responsable: con el menu de usuario abierto, pulsar la
  // campana dejaba LOS DOS encima del contenido, y el de usuario tapaba lo que
  // acababas de abrir.
  //
  // Y el fallo era SOLO del catalogo. En React esto ya estaba resuelto: hay un
  // registro a nivel de modulo en interno/desplegable, que comparten
  // MenuUsuario y PanelBarra, y sus pruebas pasan. Aqui habia dos cierres
  // escritos a mano que no se conocian: el del menu cerraba menus, el de los
  // paneles cerraba paneles, y ninguno sabia del otro.
  //
  // Es la deriva que este proyecto lleva persiguiendo todo el rato: lo generado
  // acierta y lo escrito a mano se separa. El registro se pone UNA vez y los
  // dos se apuntan, en lugar de que cada uno cierre a los de su especie.
  var DESPLEGABLES = [];
  function cerrarDesplegables(salvo) {
    DESPLEGABLES.forEach(function (d) { if (d !== salvo) d(); });
  }

  // ── Menú de usuario ──────────────────────────────────────────────────────
  (function () {
    var btn = document.getElementById('us-btn');
    var menu = document.getElementById('us-menu');
    if (!btn) return;
    function cerrar() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    DESPLEGABLES.push(cerrar);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var abierto = !menu.hidden;
      // Se cierran los demas ANTES de abrir este.
      cerrarDesplegables(cerrar);
      menu.hidden = abierto;
      btn.setAttribute('aria-expanded', String(!abierto));
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !e.target.closest('.us')) cerrar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { cerrar(); btn.focus(); }
    });
    // Tres vistas del catálogo: escritorio, web en móvil y APP móvil. Solo
    // afectan al catálogo, no al sistema.
    var VISTAS = ['escritorio', 'movil', 'app'];
    var botonVista = {
      escritorio: document.getElementById('v-escritorio'),
      movil: document.getElementById('v-movil'),
      app: document.getElementById('v-app'),
    };
    // Cambiar de vista NO es poner un atributo: muda la zona de avisos, muda
    // los filtros globales, pliega la lateral y repinta las paginaciones. Por
    // eso vive en una función y no dentro del manejador del clic. Restaurar la
    // vista guardada tiene que hacer EXACTAMENTE lo mismo, y si el trabajo
    // estuviera duplicado las dos copias acabarían divergiendo —es el mismo
    // error que ya costó la paginación de la tabla—.
    function aplicarVista(modo, avisar) {
      if (VISTAS.indexOf(modo) < 0) modo = 'escritorio';
      var on = modo !== 'escritorio';   // web-en-móvil y app comparten marco
      var esApp = modo === 'app';
      VISTAS.forEach(function (v) {
        botonVista[v].setAttribute('aria-pressed', String(v === modo));
      });
      var raizEl = document.documentElement;
      if (on) raizEl.setAttribute('data-vista', 'movil');
      else raizEl.removeAttribute('data-vista');
      // data-app se SUMA a data-vista en vez de sustituirla: las reglas de
      // 390px ya escritas valen igual para la app y solo cambia el cromo. Si
      // fuera un tercer valor de data-vista habría que duplicarlas todas.
      if (esApp) raizEl.setAttribute('data-app', 'si');
      else raizEl.removeAttribute('data-app');
      // En 390px la lateral empieza fuera de pantalla. En app NUNCA se abre:
      // la navegación son las pestañas de abajo.
      plegarLateral(on);
      // El aviso se muda dentro del marco: fuera se posicionaría contra la
      // ventana y aparecería flotando fuera del teléfono.
      var zona = document.querySelector('.av-zona');
      if (zona) (on ? document.querySelector('.app-cascaron') : document.body).appendChild(zona);
      // Los filtros se mudan al menú: se MUEVE el nodo, no se duplica. Dos
      // copias del mismo control acaban divergiendo, como pasó con la
      // paginación de la tabla.
      var filtros = document.querySelector('.top-filtros');
      if (filtros) {
        if (on) document.getElementById('fg-panel').appendChild(filtros);
        else document.querySelector('.top-cascaron')
          .insertBefore(filtros, document.querySelector('.top-acciones'));
      }
      document.getElementById('fg-panel').hidden = true;
      document.getElementById('fg-btn').setAttribute('aria-expanded', 'false');
      // La paginación cambia de forma con la vista: se repintan todas.
      (window.__paginaciones || []).forEach(function (p) { p.refrescar(); });
      document.getElementById('plegar-cat')
        .setAttribute('aria-label', on ? 'Abrir menú' : 'Plegar menú');
      if (window.__appSincronizar) window.__appSincronizar();
      if (avisar && window.avisarDemo) {
        window.avisarDemo('info',
          esApp ? 'App móvil: la navegación son las pestañas de abajo'
          : on ? 'Web en móvil: 390px. El menú se abre con el botón de arriba a la izquierda'
          : 'Vista de escritorio');
      }
    }
    // La restaura el arranque, al final del script: ver «Vista guardada».
    window.__aplicarVista = aplicarVista;

    VISTAS.forEach(function (v) { botonVista[v].addEventListener('click', function () {
      aplicarVista(v, true);
      // La vista sobrevive a la recarga, igual que el tema. Al revisar el
      // catálogo en móvil se recarga constantemente, y volver a escritorio en
      // cada F5 obligaba a rehacer el camino entero.
      try { localStorage.setItem('mmi-vista', v); } catch (e) {}
      cerrar();
    }); });

    // La descarga la hace el navegador por el href; aquí solo se recoge el
    // menú, que si no se queda abierto sobre la página.
    menu.querySelector('.us-zip').addEventListener('click', function () { cerrar(); });

    menu.querySelector('.us-salir').addEventListener('click', function () {
      cerrar();
      if (window.avisarDemo) window.avisarDemo('info', 'Salir del sistema — en el catálogo no hay sesión que cerrar');
    });
  })();

  // ── Campo de fecha: toda la caja abre el calendario ──────────────────────
  // Con appearance:none el disparador nativo queda invisible y en un teléfono
  // es un blanco de 22px imposible de acertar. Tocar el campo entero lo abre.
  document.querySelectorAll('input[type="date"]').forEach(function (i) {
    i.addEventListener('click', function () {
      if (!i.disabled && !i.readOnly && typeof i.showPicker === 'function') {
        try { i.showPicker(); } catch (e) {}
      }
    });
  });

  // ── Desplegable de filtros globales ──────────────────────────────────────
  (function () {
    var btn = document.getElementById('fg-btn');
    var panel = document.getElementById('fg-panel');
    if (!btn) return;
    function cerrarFg() {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('activo');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var abierto = !panel.hidden;
      panel.hidden = abierto;
      btn.setAttribute('aria-expanded', String(!abierto));
      btn.classList.toggle('activo', !abierto);
    });
    // Al elegir un valor se cierra: es lo que se venía a hacer.
    panel.addEventListener('change', function (e) {
      if (e.target.closest('select')) cerrarFg();
    });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && !e.target.closest('#fg')) cerrarFg();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { cerrarFg(); btn.focus(); }
    });
  })();

  // ── Panel de la barra ────────────────────────────────────────────────────
  // La demostracion es del catalogo; el comportamiento de verdad vive en
  // PanelBarra. Aqui solo hace falta que se pueda pulsar para verlo.
  (function () {
    var paneles = document.querySelectorAll('[data-pb]');
    paneles.forEach(function (p) {
      var btn = p.querySelector('[data-pb-btn]');
      var caja = p.querySelector('.pb-panel');
      if (!btn || !caja) return;
      function cerrar() { caja.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
      // Al registro comun, no a una lista de paneles: antes esto cerraba los
      // otros paneles y dejaba abierto el menu de usuario.
      DESPLEGABLES.push(cerrar);
      btn.addEventListener('click', function () {
        var abierto = caja.hidden;
        cerrarDesplegables(cerrar);
        cerrar();
        if (abierto) { caja.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !caja.hidden) { cerrar(); btn.focus(); }
      });
      document.addEventListener('mousedown', function (e) {
        if (!p.contains(e.target) && !caja.hidden) cerrar();
      });
    });
  })();

  // ── Carga de imagen (R35): la demo se puede PROBAR ───────────────────────
  // El mismo comportamiento del componente React, con los mismos numeros:
  // el editor adopta la proporcion del formato, la foto encuadra con mascara
  // circular, y el resultado se pinta EN SU HUECO para ver como se vera.
  (function () {
    var FORMATOS = {
      foto: { w: 318, h: 318, redondo: true },
      ext:  { w: 318, h: 66,  redondo: false },
      comp: { w: 318, h: 318, redondo: false },
    };
    var ICO_PAPELERA_CI = ${JSON.stringify(icono('papelera'))};
    var editor = document.getElementById('ci-demo-editor');
    var dlgCi = document.getElementById('ci-demo-dlg');
    if (!editor) return;
    var lienzo = document.getElementById('ci-demo-lienzo');
    var mascara = document.getElementById('ci-demo-mascara');
    var ctx = lienzo.getContext('2d');
    var st = null;

    function escala() { return Math.max(st.f.w / st.img.naturalWidth, st.f.h / st.img.naturalHeight) * st.zoom; }
    function pintar() {
      ctx.clearRect(0, 0, st.f.w, st.f.h);
      var w = st.img.naturalWidth * escala(), h = st.img.naturalHeight * escala();
      ctx.drawImage(st.img, (st.f.w - w) / 2 + st.dx, (st.f.h - h) / 2 + st.dy, w, h);
    }
    function acotar() {
      var tx = Math.max(0, (st.img.naturalWidth * escala() - st.f.w) / 2);
      var ty = Math.max(0, (st.img.naturalHeight * escala() - st.f.h) / 2);
      st.dx = Math.min(tx, Math.max(-tx, st.dx));
      st.dy = Math.min(ty, Math.max(-ty, st.dy));
    }
    function mover(mx, my) { if (!st) return; st.dx += mx; st.dy += my; acotar(); pintar(); }
    function zum(f) { if (!st) return; st.zoom = Math.min(8, Math.max(1, st.zoom * f)); acotar(); pintar(); }

    document.querySelectorAll('[data-carga]').forEach(function (tarjeta) {
      var f = FORMATOS[tarjeta.getAttribute('data-carga')];
      var input = tarjeta.querySelector('input[type="file"]');
      tarjeta.querySelector('[data-elegir]').addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var archivo = input.files && input.files[0];
        if (!archivo) return;
        var img = new Image();
        img.onload = function () {
          st = { img: img, dx: 0, dy: 0, zoom: 1, f: f,
            // R102 · dos destinos posibles, y el mismo editor para los dos:
            // la CAJA de vista previa, o la FILA, donde lo cargado va al
            // costado del boton como miniatura de 22px.
            caja: tarjeta.querySelector('.ci-caja'),
            minis: tarjeta.querySelector('[data-minis]'),
            vacio: tarjeta.querySelector('[data-vacio]'),
            etiqueta: (tarjeta.querySelector('.cx-et') || tarjeta.querySelector('.cx-et') || {}).textContent || '',
            // Solo del cascaron: el peso original, para ensenar al grabar
            // cuanto adelgaza la conversion a WebP. El componente no lo
            // manda — es dato de demostracion, no de la pieza.
            pesoOriginal: archivo.size,
            nota: tarjeta.querySelector('[data-peso]') };
          lienzo.width = f.w; lienzo.height = f.h;
          mascara.hidden = !f.redondo;
          // El editor se abre EN SU DIALOGO, como el componente.
          dlgCi.showModal();
          document.getElementById('ci-demo-tit').focus();
          pintar();
          lienzo.focus();
        };
        img.src = URL.createObjectURL(archivo);
        input.value = '';
      });
    });

    var arrastre = null;
    lienzo.addEventListener('pointerdown', function (e) { arrastre = { x: e.clientX, y: e.clientY }; lienzo.setPointerCapture(e.pointerId); });
    lienzo.addEventListener('pointermove', function (e) {
      if (!arrastre) return;
      mover(e.clientX - arrastre.x, e.clientY - arrastre.y);
      arrastre = { x: e.clientX, y: e.clientY };
    });
    lienzo.addEventListener('pointerup', function () { arrastre = null; });
    lienzo.addEventListener('keydown', function (e) {
      var m = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
      if (m) { e.preventDefault(); mover(m[0], m[1]); }
    });
    document.getElementById('ci-demo-menos').addEventListener('click', function () { zum(1 / 1.15); });
    document.getElementById('ci-demo-mas').addEventListener('click', function () { zum(1.15); });
    document.getElementById('ci-demo-cancelar').addEventListener('click', function () { dlgCi.close(); st = null; });
    document.getElementById('ci-demo-usar').addEventListener('click', function () {
      if (!st) return;
      var corte = document.createElement('canvas');
      corte.width = 512; corte.height = Math.round(512 * st.f.h / st.f.w);
      var c2 = corte.getContext('2d');
      var aw = st.f.w / escala(), ah = st.f.h / escala();
      c2.drawImage(st.img,
        (st.img.naturalWidth - aw) / 2 - st.dx / escala(),
        (st.img.naturalHeight - ah) / 2 - st.dy / escala(),
        aw, ah, 0, 0, corte.width, corte.height);
      var caja = st.caja, nota = st.nota, pesoOriginal = st.pesoOriginal;
      var minis = st.minis, vacio = st.vacio, etiqueta = st.etiqueta, redonda = st.f.redondo;
      function peso(n) { return n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
      // WebP, como el componente: pesa menos y blob.type dice la verdad.
      corte.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        if (minis) {
          // R102 · EN LA FILA. La miniatura va al costado del boton, 22px, y
          // en circulo cuando lo que se sube es la foto de una persona.
          minis.innerHTML = '<li class="cx-adj cx-adj-img">'
            + '<img class="' + (redonda ? 'cx-mini cx-mini-redonda' : 'cx-mini') + '" src="' + url + '" alt="' + etiqueta + '">'
            + '<button type="button" class="btn btn-terc btn-mini btn-solo-ic" data-quitar '
            + 'aria-label="Quitar ' + etiqueta + '">' + ICO_PAPELERA_CI + '</button></li>';
          minis.hidden = false;
          if (vacio) vacio.hidden = true;
          var quitar = minis.querySelector('[data-quitar]');
          quitar.addEventListener('click', function () {
            minis.innerHTML = '';
            minis.hidden = true;
            if (vacio) vacio.hidden = false;
            if (nota) nota.hidden = true;
          });
        } else {
          caja.innerHTML = '<img class="ci-img" src="' + url + '" alt="">';
        }
        // El dato que prueba la conversion: de cuanto a cuanto, y en que.
        if (nota) {
          nota.textContent = blob.type + ' · ' + peso(pesoOriginal) + ' → ' + peso(blob.size);
          nota.hidden = false;
        }
      }, 'image/webp', 0.85);
      dlgCi.close(); st = null;
    });
  })();

  // ── Carga de documento de identidad ──────────────────────────────────────
  // El MISMO guion que el componente: un solo dialogo para las dos caras,
  // borrador hasta grabar el reverso, miniaturas al costado, boton desactivado
  // y visor al pulsar una miniatura.
  (function () {
    var raiz = document.getElementById('cid-demo');
    if (!raiz) return;
    var MARCO = { w: 428, h: 270 };           // ID-1: 85,60 x 53,98 mm
    var dlg = document.getElementById('cid-demo-dlg');
    var visor = document.getElementById('cid-demo-visor');
    var visorImg = document.getElementById('cid-demo-visor-img');
    var entrada = document.getElementById('cid-demo-entrada');
    var editor = document.getElementById('cid-demo-editor');
    var lienzo = document.getElementById('cid-demo-lienzo');
    var elegir = document.getElementById('cid-demo-elegir');
    var grabar = document.getElementById('cid-demo-grabar');
    var boton = document.getElementById('cid-demo-btn');
    var minis = document.getElementById('cid-demo-minis');
    var ctx = lienzo.getContext('2d');
    var st = null, paso = 'anverso', borrador = null, ultima = null;

    function escala() { return Math.max(MARCO.w / st.img.naturalWidth, MARCO.h / st.img.naturalHeight) * st.zoom; }
    function pintar() {
      ctx.clearRect(0, 0, MARCO.w, MARCO.h);
      var w = st.img.naturalWidth * escala(), h = st.img.naturalHeight * escala();
      ctx.drawImage(st.img, (MARCO.w - w) / 2 + st.dx, (MARCO.h - h) / 2 + st.dy, w, h);
    }
    function acotar() {
      var tx = Math.max(0, (st.img.naturalWidth * escala() - MARCO.w) / 2);
      var ty = Math.max(0, (st.img.naturalHeight * escala() - MARCO.h) / 2);
      st.dx = Math.min(tx, Math.max(-tx, st.dx));
      st.dy = Math.min(ty, Math.max(-ty, st.dy));
    }
    function mover(mx, my) { if (!st) return; st.dx += mx; st.dy += my; acotar(); pintar(); }
    function zum(f) { if (!st) return; st.zoom = Math.min(8, Math.max(1, st.zoom * f)); acotar(); pintar(); }

    function pedir(cual) {
      paso = cual;
      document.getElementById('cid-demo-tit').textContent =
        'Documento de identidad — ' + (cual === 'anverso' ? 'Anverso' : 'Reverso');
      document.getElementById('cid-demo-paso').textContent = cual === 'anverso'
        ? 'Primero el anverso: la cara con la foto y los datos.'
        : 'Ahora el reverso. El anverso ya está encuadrado y se graba con este.';
      elegir.hidden = false;
      elegir.textContent = '';
      elegir.insertAdjacentHTML('beforeend', ${JSON.stringify(icono('subir'))});
      elegir.insertAdjacentText('beforeend', 'Elegir la imagen del ' + cual);
      editor.hidden = true;
      grabar.hidden = true;
      st = null;
    }

    boton.addEventListener('click', function () {
      borrador = null;
      pedir('anverso');
      dlg.showModal();
      document.getElementById('cid-demo-tit').focus();
    });

    elegir.addEventListener('click', function () { entrada.click(); });
    entrada.addEventListener('change', function () {
      var archivo = entrada.files && entrada.files[0];
      if (!archivo) return;
      var img = new Image();
      img.onload = function () {
        st = { img: img, dx: 0, dy: 0, zoom: 1 };
        elegir.hidden = true;
        editor.hidden = false;
        grabar.hidden = false;
        pintar();
        lienzo.focus();
      };
      img.src = URL.createObjectURL(archivo);
      entrada.value = '';
    });

    lienzo.addEventListener('keydown', function (e) {
      var m = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
      if (m) { e.preventDefault(); mover(m[0], m[1]); }
    });
    var arrastre = null;
    lienzo.addEventListener('pointerdown', function (e) { arrastre = { x: e.clientX, y: e.clientY }; lienzo.setPointerCapture(e.pointerId); });
    lienzo.addEventListener('pointermove', function (e) {
      if (!arrastre) return;
      mover(e.clientX - arrastre.x, e.clientY - arrastre.y);
      arrastre = { x: e.clientX, y: e.clientY };
    });
    lienzo.addEventListener('pointerup', function () { arrastre = null; });
    document.getElementById('cid-demo-menos').addEventListener('click', function () { zum(1 / 1.15); });
    document.getElementById('cid-demo-mas').addEventListener('click', function () { zum(1.15); });

    document.getElementById('cid-demo-cancelar').addEventListener('click', function () {
      // Cancelar a mitad tira el borrador: dejarlo a medias seria entregar un
      // anverso suelto, que es un documento incompleto.
      borrador = null; st = null; dlg.close();
    });

    function miniatura(cara, url) {
      // R102 · el MISMO marcado que emite «AdjuntoImagen» con forma="id".
      var li = document.createElement('li');
      li.className = 'cx-adj cx-adj-img';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cx-ver';
      b.setAttribute('aria-label', 'Ver ' + cara + ' en grande');
      b.innerHTML = '<img class="cx-mini cx-mini-id" src="' + url + '" alt="">';
      b.addEventListener('click', function () {
        ultima = b;
        visorImg.src = url;
        document.getElementById('cid-demo-visor-tit').textContent =
          'Documento de identidad — ' + (cara === 'anverso' ? 'Anverso' : 'Reverso');
        visor.showModal();
        document.getElementById('cid-demo-visor-tit').focus();
      });
      li.appendChild(b);
      minis.appendChild(li);
    }

    grabar.addEventListener('click', function () {
      if (!st) return;
      var corte = document.createElement('canvas');
      corte.width = 1024; corte.height = Math.round(1024 * MARCO.h / MARCO.w);
      var c2 = corte.getContext('2d');
      var aw = MARCO.w / escala(), ah = MARCO.h / escala();
      c2.drawImage(st.img,
        (st.img.naturalWidth - aw) / 2 - st.dx / escala(),
        (st.img.naturalHeight - ah) / 2 - st.dy / escala(),
        aw, ah, 0, 0, corte.width, corte.height);
      corte.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        if (paso === 'anverso') { borrador = url; pedir('reverso'); return; }
        minis.textContent = '';
        miniatura('anverso', borrador);
        miniatura('reverso', url);
        boton.disabled = true;      // volver a subir lo autoriza el back
        borrador = null; st = null;
        dlg.close();
      }, 'image/webp', 0.85);
    });

    document.getElementById('cid-demo-visor-cerrar').addEventListener('click', function () {
      visor.close();
      if (ultima) ultima.focus();
    });

    document.getElementById('cid-demo-liberar').addEventListener('click', function () {
      boton.disabled = false;
    });
  })();

  // ── Carga de PDF ─────────────────────────────────────────────────────────
  // Usa PDF.comprimirPdf, que es EL MISMO archivo que importa el componente
  // de React: se inserta arriba tal cual. Si esta demo tuviera su propia copia
  // enseñaría una compresión que no es la que viaja en el paquete.
  //
  // La forma es la del formulario: boton siempre presente, panel que se
  // despliega EN SU SITIO empujando los campos de abajo, y BORRADOR que solo
  // se confirma al Grabar — cancelar tiene que dejar el formulario como estaba.
  (function () {
    var TOPE = 10 * 1024 * 1024;
    var ICO_DOC = ${JSON.stringify(icono('documento', TAMANOS.estado))};
    // El de la FILA va al tamano de texto: en 27px de alto el de estado no cabe.
    var ICO_DOC_LINEA = ${JSON.stringify(icono('documento'))};
    var ICO_PAPELERA = ${JSON.stringify(icono('papelera'))};

    document.querySelectorAll('[data-pdf]').forEach(function (caja) {
      var abrir = caja.querySelector('[data-abrir]');
      var vacio = caja.querySelector('[data-vacio]');
      var panel = caja.querySelector('[data-panel]');
      var subir = caja.querySelector('[data-subir]');
      var segundo = caja.querySelector('[data-segundo]');
      var zona = caja.querySelector('[data-zona]');
      var entrada = caja.querySelector('input[type="file"]');
      var invita = caja.querySelector('[data-invita]');
      var lista = caja.querySelector('[data-lista]');
      var borradorUI = caja.querySelector('[data-borrador]');
      var trabajo = caja.querySelector('[data-trabajo]');
      var error = caja.querySelector('[data-error]');
      if (!abrir || !panel) return;

      var confirmados = [];
      var borrador = [];

      function fallo(txt) {
        error.textContent = txt;
        error.hidden = false;
        zona.classList.add('cpdf-mal');
      }
      function limpiar() {
        error.hidden = true;
        zona.classList.remove('cpdf-mal');
      }

      // Una fila: el tachito EN LA MISMA LINEA que el nombre, para que se vea
      // cual se lleva antes de pulsarlo.
      function pintar(destino, items, alQuitar) {
        destino.innerHTML = '';
        destino.hidden = items.length === 0;
        items.forEach(function (it, k) {
          var li = document.createElement('li');
          li.className = 'cpdf-puesto';
          var ico = document.createElement('span');
          ico.className = 'cpdf-ico';
          ico.setAttribute('aria-hidden', 'true');
          ico.innerHTML = ICO_DOC;
          var datos = document.createElement('span');
          datos.className = 'cpdf-datos';
          var linea = document.createElement('span');
          linea.className = 'cpdf-linea';
          var nom = document.createElement('span');
          nom.className = 'cpdf-nombre';
          nom.textContent = it.nombre;
          var bot = document.createElement('button');
          bot.type = 'button';
          bot.className = 'btn btn-terc btn-mini btn-solo-ic cpdf-quitar';
          bot.setAttribute('aria-label', 'Quitar ' + it.nombre);
          bot.innerHTML = ICO_PAPELERA;
          bot.addEventListener('click', function () { alQuitar(k); });
          linea.appendChild(nom);
          linea.appendChild(bot);
          var pes = document.createElement('span');
          pes.className = 'cpdf-peso';
          var pgs = it.paginas > 0 ? ' · ' + it.paginas + (it.paginas === 1 ? ' página' : ' páginas') : '';
          pes.textContent = PDF.formatearPeso(it.pesoFinal) + pgs;
          // LA CIFRA DEL CATALOGO: la demostracion de que la compresion ocurrio.
          var chip = document.createElement('span');
          if (it.comprimido) {
            chip.className = 'chip chip-exito';
            chip.textContent = PDF.formatearPeso(it.pesoInicial) + ' → ' + PDF.formatearPeso(it.pesoFinal)
              + ' · ' + PDF.ahorro(it.pesoInicial, it.pesoFinal) + ' % menos';
          } else {
            chip.className = 'chip chip-inact';
            chip.textContent = PDF.formatearPeso(it.pesoInicial) + ' · sin cambio (' + it.motivo + ')';
          }
          datos.appendChild(linea);
          datos.appendChild(pes);
          datos.appendChild(chip);
          li.appendChild(ico);
          li.appendChild(datos);
          destino.appendChild(li);
        });
      }

      // EL SEGUNDO BOTON MUTA. Con contenido valido y sin error es «Grabar»;
      // sin nada o con error es «Cancelar» — que ademas es la salida.
      function refrescar() {
        pintar(borradorUI, borrador, function (k) {
          borrador.splice(k, 1);
          limpiar();
          refrescar();
        });
        invita.hidden = borrador.length > 0;
        var puedeGrabar = borrador.length > 0 && error.hidden;
        segundo.textContent = puedeGrabar ? 'Grabar' : 'Cancelar';
        segundo.className = puedeGrabar ? 'btn btn-1 btn-mini' : 'btn btn-terc btn-mini';
      }

      // R102 · FUERA DEL PANEL se pinta la FILA, que es otro marcado: el mismo
      // que emite «AdjuntoArchivo». La extension va aparte porque no se recorta
      // nunca; el nombre si.
      function refrescarFuera() {
        lista.innerHTML = '';
        // Con el panel abierto la fila no pinta nada: la lista esta dentro, y
        // sacarla dos veces seria decir dos veces lo mismo.
        var items = panel.hidden ? confirmados : [];
        lista.hidden = items.length === 0;
        // Con el panel abierto NO hay estado vacio que contar: la lista de la
        // fila se vacia para no decir dos veces lo mismo, y el mensaje se
        // encenderia diciendo «ningun archivo» justo encima de un panel que
        // enseña el archivo.
        if (vacio) vacio.hidden = items.length > 0 || !panel.hidden;
        items.forEach(function (it, k) {
          var punto = it.nombre.lastIndexOf('.');
          var base = punto > 0 ? it.nombre.slice(0, punto) : it.nombre;
          var ext = punto > 0 ? it.nombre.slice(punto) : '';
          var li = document.createElement('li');
          li.className = 'cx-adj';
          var arch = document.createElement('span');
          arch.className = 'cx-arch';
          var nom = document.createElement('span');
          nom.className = 'cx-nombre';
          nom.textContent = base;
          arch.appendChild(nom);
          if (ext) {
            var e = document.createElement('span');
            e.className = 'cx-ext';
            e.textContent = ext;
            arch.appendChild(e);
          }
          var pes = document.createElement('span');
          pes.className = 'cx-peso';
          pes.textContent = PDF.formatearPeso(it.pesoFinal);
          var bot = document.createElement('button');
          bot.type = 'button';
          bot.className = 'btn btn-terc btn-mini btn-solo-ic';
          bot.setAttribute('aria-label', 'Quitar ' + it.nombre);
          bot.innerHTML = ICO_PAPELERA;
          bot.addEventListener('click', function () {
            confirmados.splice(k, 1);
            refrescarFuera();
          });
          li.innerHTML = ICO_DOC_LINEA;
          li.appendChild(arch);
          li.appendChild(pes);
          li.appendChild(bot);
          lista.appendChild(li);
        });
      }

      function tomar(archivos) {
        var entrantes = archivos ? [].slice.call(archivos) : [];
        limpiar();
        if (!entrantes.length) return;
        if (entrantes.length > 1) {
          fallo('Solo cabe 1 archivo. Suelta uno.');
          entrada.value = '';
          return;
        }
        var archivo = entrantes[0];
        // Los BYTES, no la extensión: un .docx renombrado se cuela por el nombre.
        PDF.esPdf(archivo).then(function (vale) {
          if (!vale) { fallo('Ese archivo no es un PDF. Solo se admiten PDF.'); return; }
          trabajo.hidden = false;
          subir.disabled = true;
          return PDF.comprimirPdf(archivo).then(function (r) {
            trabajo.hidden = true;
            subir.disabled = false;
            if (r.pesoFinal > TOPE) {
              fallo(archivo.name + ' pesa ' + PDF.formatearPeso(r.pesoFinal) + ' y el máximo es '
                + PDF.formatearPeso(TOPE) + '.');
              return;
            }
            borrador = [{
              nombre: archivo.name, pesoInicial: r.pesoInicial, pesoFinal: r.pesoFinal,
              comprimido: r.comprimido, motivo: r.motivo,
              paginas: (r.detalle && r.detalle.paginas) || -1
            }];
            refrescar();
          });
        }).catch(function () {
          trabajo.hidden = true;
          subir.disabled = false;
          fallo('No se pudo leer el archivo.');
        }).then(function () {
          // Vaciar para que elegir EL MISMO archivo vuelva a disparar 'change'.
          entrada.value = '';
        });
      }

      function cerrarPanel() {
        panel.hidden = true;
        abrir.disabled = false;
        abrir.setAttribute('aria-expanded', 'false');
        borrador = [];
        limpiar();
        refrescarFuera();
      }

      // R102 · el disparador SE QUEDA con el panel abierto, APAGADO. Antes se
      // retiraba, y con el se iba el ancla de la fila. Apagado y no cerrando:
      // las salidas del panel siguen siendo «Grabar» y «Cancelar», que es lo
      // que decide que pasa con el borrador.
      abrir.addEventListener('click', function () {
        // El borrador arranca de lo que ya hay: entrar a cambiar el archivo no
        // puede empezar en blanco y hacer creer que se perdio.
        borrador = confirmados.slice();
        panel.hidden = false;
        abrir.disabled = true;
        abrir.setAttribute('aria-expanded', 'true');
        limpiar();
        refrescar();
        refrescarFuera();
      });
      subir.addEventListener('click', function () { entrada.click(); });
      segundo.addEventListener('click', function () {
        if (borrador.length > 0 && error.hidden) {
          confirmados = borrador.slice();
          cerrarPanel();
          refrescarFuera();
        } else {
          cerrarPanel();
        }
      });

      zona.addEventListener('dragover', function (e) {
        e.preventDefault();
        zona.classList.add('cpdf-encima');
      });
      zona.addEventListener('dragleave', function () { zona.classList.remove('cpdf-encima'); });
      zona.addEventListener('drop', function (e) {
        e.preventDefault();
        zona.classList.remove('cpdf-encima');
        tomar(e.dataTransfer.files);
      });
      entrada.addEventListener('change', function (e) { tomar(e.target.files); });
    });
  })();

  // ── Área de texto ────────────────────────────────────────────────────────
  // Crecer es CSS: lo único que hace falta aquí es mantener al día la copia
  // invisible que estira la rejilla. La altura NO se toca desde JavaScript —
  // eso exigiría el atributo 'style', que el candado prohíbe.
  (function () {
    document.querySelectorAll('[data-crece]').forEach(function (envoltorio) {
      var cuadro = envoltorio.querySelector('textarea');
      if (!cuadro) return;
      var poner = function () { envoltorio.setAttribute('data-replica', cuadro.value); };
      poner();
      cuadro.addEventListener('input', poner);
    });

    // El límite BLANDO: no se corta, se cuenta y se marca.
    document.querySelectorAll('[data-limite]').forEach(function (grupo) {
      var tope = parseInt(grupo.getAttribute('data-limite'), 10);
      var cuadro = grupo.querySelector('[data-cuadro]');
      var cuenta = grupo.querySelector('[data-cuenta]');
      var error = grupo.querySelector('[data-error]');
      if (!cuadro || !cuenta) return;
      cuadro.addEventListener('input', function () {
        var quedan = tope - Array.from(cuadro.value).length;
        var pasado = quedan < 0;
        cuenta.textContent = pasado ? (-quedan) + ' de más' : quedan + ' restantes';
        cuenta.classList.toggle('ta-cuenta-mal', pasado);
        cuadro.classList.toggle('campo-mal', pasado);
        if (pasado) cuadro.setAttribute('aria-invalid', 'true');
        else cuadro.removeAttribute('aria-invalid');
        if (error) {
          error.hidden = !pasado;
          error.textContent = pasado
            ? 'El texto se pasa por ' + (-quedan) + (-quedan === 1 ? ' carácter' : ' caracteres')
              + '. Acórtalo antes de guardar.'
            : '';
        }
      });
    });
  })();

  // ── Aviso temporal ───────────────────────────────────────────────────────
  (function () {
    var botones = document.querySelectorAll('[data-av]');

    // R29: la zona son DOS regiones hermanas que existen desde la carga.
    // Antes era una sola con aria-live=polite y el error metía su role=alert
    // DENTRO: la anidación que el propio Aviso advierte. El catálogo cometía
    // el antipatrón que la entrega prohíbe.
    var zona = document.createElement('div');
    zona.className = 'av-zona';
    var zonaAlerta = document.createElement('div');
    zonaAlerta.className = 'av-grupo';
    zonaAlerta.setAttribute('role', 'alert');
    var zonaEstado = document.createElement('div');
    zonaEstado.className = 'av-grupo';
    zonaEstado.setAttribute('role', 'status');
    zona.appendChild(zonaAlerta);
    zona.appendChild(zonaEstado);
    document.body.appendChild(zona);

    var TEXTOS = {
      exito: ['exito', 'Se guardó la asistencia de marzo', 4000],
      info: ['info', 'Se exportaron 38 filas a CSV', 5000],
      aviso: ['aviso', 'Se envió con 3 faltas sin justificar', 7000],
      // El error NO se va solo: uno que desaparece es uno que nadie leyó.
      error: ['error', 'No se guardó: falta el DNI de 2 trabajadores', 0],
      deshacer: ['exito', 'Se archivaron 12 expedientes', 10000],
    };

    function avisar(tono, texto, conAccion) {
      var d = TEXTOS[tono] || [tono, texto, tono === 'error' ? 0 : 4000];
      if (texto) d = [d[0], texto, d[2]];
      var el = document.createElement('div');
      el.className = 'av av-' + d[0];
      // El rol lo pone la REGIÓN, no el aviso: la de alert interrumpe, la de
      // status espera turno, y las dos ya existían al cargar.
      el.innerHTML = '<span class="av-txt">' + d[1] + '</span>' +
        (conAccion || tono === 'deshacer' ? '<button class="av-accion">Deshacer</button>' : '') +
        '<button class="av-x" aria-label="Cerrar aviso">' + '${ICO_X.replace(/'/g, "\\'")}' + '</button>';
      (d[0] === 'error' ? zonaAlerta : zonaEstado).appendChild(el);
      // Máximo tres a la vista: el cuarto expulsa al más antiguo QUE NO SEA UN
      // ERROR. Un error expulsado en silencio es un error que nadie leyó.
      while (zonaAlerta.children.length + zonaEstado.children.length > 3
        && zonaEstado.children.length) zonaEstado.firstChild.remove();
      requestAnimationFrame(function () { el.classList.add('av-dentro'); });

      var t = null;
      function cerrar() {
        clearTimeout(t);
        el.classList.remove('av-dentro');
        setTimeout(function () { el.remove(); }, 220);
      }
      function arrancar() { if (d[2]) t = setTimeout(cerrar, d[2]); }
      // El reloj se detiene con el cursor encima o con el foco dentro: si se va
      // justo cuando alguien iba a pulsar Deshacer, ese botón nunca sirvió.
      el.addEventListener('mouseenter', function () { clearTimeout(t); });
      el.addEventListener('mouseleave', arrancar);
      el.addEventListener('focusin', function () { clearTimeout(t); });
      el.addEventListener('focusout', arrancar);
      el.querySelector('.av-x').addEventListener('click', cerrar);
      var acc = el.querySelector('.av-accion');
      if (acc) acc.addEventListener('click', cerrar);
      arrancar();
    }

    botones.forEach(function (b) {
      b.addEventListener('click', function () { avisar(b.dataset.av); });
    });

    // Expuesto para que la propia cáscara lo consuma, igual que lo hará
    // cualquier pantalla del sistema.
    window.avisarDemo = avisar;
  })();

  // ── Paginación: la propia página del componente también lo consume ───────
  (function () {
    var caja = document.getElementById('pg-botones');
    if (!caja) return;
    var TOTAL = 1240, POR = 10;
    var rango = document.getElementById('pg-rango');
    function verRango(p) {
      var desde = (p - 1) * POR;
      rango.textContent = (desde + 1) + '–' + Math.min(desde + POR, TOTAL) + ' de ' + TOTAL;
    }
    window.Paginacion(caja, {
      etiqueta: 'Ejemplo de paginación',
      total: function () { return TOTAL; },
      porPagina: function () { return POR; },
      pagina: 1,
      onCambio: verRango,
    });
    verRango(1);
  })();

  // ── Filas desplegables ───────────────────────────────────────────────────
  document.querySelectorAll('.tb-chev').forEach(function (b) {
    b.addEventListener('click', function () {
      var abierto = b.getAttribute('aria-expanded') === 'true';
      var det = document.getElementById(b.getAttribute('aria-controls'));
      b.setAttribute('aria-expanded', String(!abierto));
      det.classList.toggle('abierto', !abierto);
      b.closest('tr').classList.toggle('abierto', !abierto);
      var cargo = b.getAttribute('aria-label').replace(/^(Mostrar|Ocultar) personal de /, '');
      b.setAttribute('aria-label', (abierto ? 'Mostrar' : 'Ocultar') + ' personal de ' + cargo);
    });
  });

  // ── Selector con búsqueda ────────────────────────────────────────────────
  // Demostración del comportamiento. En producción esto lo resuelve Radix
  // (MMI-DS §9 lo autoriza para exactamente tres casos, y este es uno).
  (function () {
    var raizSel = document.querySelector('[data-sel]');
    if (!raizSel) return;
    var OPCIONES = ${JSON.stringify(APODERADOS)};
    var input = raizSel.querySelector('.sel-in');
    var lista = raizSel.querySelector('.sel-lista');
    var conteo = document.querySelector('[data-sel-conteo]');
    var marcado = -1;
    var visibles = [];
    var elegido = '';

    // Sin tildes y sin mayúsculas. Es lo que en producción hacen unaccent y
    // pg_trgm: 'perez' tiene que encontrar 'Pérez'.
    function plano(s) {
      return s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
    }

    function pintar(texto) {
      var q = plano(texto.trim());
      visibles = q ? OPCIONES.filter(function (o) { return plano(o).indexOf(q) !== -1; }) : OPCIONES.slice();
      marcado = visibles.length ? 0 : -1;

      if (!visibles.length) {
        lista.innerHTML = '<li class="sel-vacio"><strong>Sin resultados para «' +
          texto.trim() + '».</strong><br>Prueba con menos letras, o revisa si está matriculado.</li>';
      } else {
        lista.innerHTML = visibles.map(function (o, i) {
          var et = o === elegido ? '<span class="sel-check">${ICO_CHECK.replace(/'/g, "\\'")}</span>' : '';
          return '<li role="option" id="sel-op-' + i + '" data-i="' + i +
            '" class="sel-op' + (i === 0 ? ' marcado' : '') + '"' +
            (o === elegido ? ' aria-selected="true"' : '') + '>' + o + et + '</li>';
        }).join('');
      }
      conteo.textContent = q
        ? visibles.length + ' de ' + OPCIONES.length + ' coinciden con «' + texto.trim() + '»'
        : OPCIONES.length + ' apoderados';
      sincronizar();
    }

    function sincronizar() {
      var ops = lista.querySelectorAll('.sel-op');
      ops.forEach(function (el, i) { el.classList.toggle('marcado', i === marcado); });
      input.setAttribute('aria-activedescendant', marcado >= 0 ? 'sel-op-' + marcado : '');
      var m = ops[marcado];
      if (m) {
        var lr = lista.getBoundingClientRect(), mr = m.getBoundingClientRect();
        if (mr.bottom > lr.bottom) lista.scrollTop += mr.bottom - lr.bottom;
        if (mr.top < lr.top) lista.scrollTop -= lr.top - mr.top;
      }
    }

    var caja = raizSel.querySelector('.sel-caja');
    function abrir() {
      lista.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      caja.classList.add('abierta');
    }
    function cerrar() {
      lista.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      caja.classList.remove('abierta');
      input.setAttribute('aria-activedescendant', '');
      // Esc devuelve el valor anterior; nunca vacía la selección.
      input.value = elegido;
    }
    function elegir(i) {
      if (i < 0 || !visibles[i]) return;
      elegido = visibles[i];
      input.value = elegido;
      cerrar();
      conteo.textContent = 'Elegido: ' + elegido;
    }

    input.addEventListener('focus', function () { pintar(input.value === elegido ? '' : input.value); abrir(); });
    input.addEventListener('input', function () { pintar(input.value); abrir(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (lista.hidden) { pintar(''); abrir(); return; }
        if (!visibles.length) return;
        marcado = e.key === 'ArrowDown'
          ? (marcado + 1) % visibles.length
          : (marcado - 1 + visibles.length) % visibles.length;
        sincronizar();
      } else if (e.key === 'Home' && !lista.hidden) { e.preventDefault(); marcado = 0; sincronizar(); }
      else if (e.key === 'End' && !lista.hidden) { e.preventDefault(); marcado = visibles.length - 1; sincronizar(); }
      else if (e.key === 'Enter') { e.preventDefault(); elegir(marcado); }
      else if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      else if (e.key === 'Tab' && !lista.hidden && marcado >= 0) { elegir(marcado); }
    });
    lista.addEventListener('mousedown', function (e) {
      var li = e.target.closest('.sel-op');
      if (li) { e.preventDefault(); elegir(Number(li.dataset.i)); }
    });
    lista.addEventListener('mousemove', function (e) {
      var li = e.target.closest('.sel-op');
      if (li) { marcado = Number(li.dataset.i); sincronizar(); }
    });
    document.addEventListener('click', function (e) {
      if (!raizSel.contains(e.target) && !lista.hidden) cerrar();
    });
  })();

  // Revelar código: plegado por defecto, como en Material, Carbon y Polaris.
  document.querySelectorAll('.cod-ver').forEach(function (b) {
    b.addEventListener('click', function () {
      var pre = document.getElementById(b.getAttribute('data-ver'));
      var abierto = !pre.hidden;
      pre.hidden = abierto;
      b.setAttribute('aria-expanded', String(!abierto));
      b.querySelector('span').textContent = abierto ? 'Ver código' : 'Ocultar código';
      b.classList.toggle('abierto', !abierto);
    });
  });

  // Copiar. Del bloque salen la importación y las props, nunca el markup
  // interno de un componente compartido (§9).
  document.querySelectorAll('.copiar').forEach(function (b) {
    b.addEventListener('click', function () {
      var pre = document.getElementById(b.getAttribute('data-copiar-de'));
      navigator.clipboard.writeText(pre.textContent).then(function () {
        b.textContent = 'Copiado';
        setTimeout(function () { b.textContent = 'Copiar'; }, 1400);
      });
    });
  });

  // El botón de plegar es real: pliega la lateral de SU maqueta.
  document.querySelectorAll('.top-plegar').forEach(function (b) {
    if (b.id === 'plegar-cat') return; // ese tiene el suyo, arriba
    b.addEventListener('click', function () {
      b.closest('.app').querySelector('.lat').classList.toggle('colapsado');
    });
  });

  // El conmutador de tema de la barra superior de las maquetas también funciona.
  document.querySelectorAll('.top-btn[aria-label="Cambiar tema"]').forEach(function (b) {
    b.addEventListener('click', function () {
      aplicar(raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro');
    });
  });

  // ── Densidad ──────────────────────────────────────────────────────────────
  // GLOBAL, no por tabla. Un conmutador por tabla permite dos tablas con
  // distinta altura de fila en la misma pantalla, y eso no se lee como una
  // preferencia: se lee como un fallo. Por eso el atributo va en <html>.
  (function () {
    var bComoda = document.getElementById('d-comoda');
    var bCompacta = document.getElementById('d-compacta');
    if (!bComoda) return;
    var densidad = 'comoda';
    try { densidad = localStorage.getItem('mmi-densidad') || densidad; } catch (e) {}

    function aplicarDensidad(d, guardar) {
      densidad = d === 'compacta' ? 'compacta' : 'comoda';
      raiz.setAttribute('data-densidad', densidad);
      bComoda.setAttribute('aria-pressed', String(densidad === 'comoda'));
      bCompacta.setAttribute('aria-pressed', String(densidad === 'compacta'));
      // En el catálogo se guarda en el navegador porque no hay sesión. En un
      // producto va al PERFIL de la persona: si no, la preferencia se queda en
      // ese equipo y no le sigue al móvil.
      if (guardar) { try { localStorage.setItem('mmi-densidad', densidad); } catch (e) {} }
    }
    bComoda.addEventListener('click', function () { aplicarDensidad('comoda', true); });
    bCompacta.addEventListener('click', function () { aplicarDensidad('compacta', true); });
    aplicarDensidad(densidad, false);
  })();

  // ── Horario ───────────────────────────────────────────────────────────────
  // Rotar NO reordena datos: intercambia los ejes de la misma tabla. Por eso el
  // dibujo se hace desde los datos en cada pintado en vez de mover nodos —mover
  // celdas entre filas y columnas es donde se pierden los rowspan—.
  (function () {
    var zonas = document.querySelectorAll('[data-horario]');
    if (!zonas.length) return;
    var DATOS = ${JSON.stringify(HORARIOS)};

    var eje = 'vertical', fmt = '24';
    try { eje = localStorage.getItem('mmi-horario-eje') || eje; } catch (e) {}
    try { fmt = localStorage.getItem('mmi-horario-formato') || fmt; } catch (e) {}

    function aMin(s) { var p = s.split(':'); return (+p[0]) * 60 + (+p[1]); }
    // El formato es SOLO cómo se escribe. El dato guardado es un minuto del día.
    function texto(m) {
      var h = Math.floor(m / 60), n = m % 60, mm = (n < 10 ? '0' : '') + n;
      if (fmt === '24') return ((h < 10 ? '0' : '') + h) + ':' + mm;
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      // Con espacio y con puntos: es la forma correcta en español.
      return h12 + ':' + mm + (h < 12 ? ' a. m.' : ' p. m.');
    }
    function esc(t) {
      return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function bloque(b, dia) {
      var rango = texto(aMin(b.de)) + ' – ' + texto(aMin(b.a));
      // El bloque SIEMPRE dice su franja en texto: deducirla de la altura de la
      // celda no es leerla.
      return '<span class="hor-b hor-' + b.tono + '" title="' + esc(dia + ', ' + rango) + '">' +
        '<b>' + esc(b.t) + '</b>' +
        (b.d ? '<span>' + esc(b.d) + '</span>' : '') +
        '<span class="hor-rango">' + rango + '</span></span>';
    }

    function tabla(h) {
      var ini = aMin(h.ini), paso = h.paso;
      var n = Math.round((aMin(h.fin) - ini) / paso);
      var empieza = [], tapada = [];
      h.dias.forEach(function () { empieza.push({}); tapada.push({}); });
      h.bloques.forEach(function (b) {
        var i = Math.round((aMin(b.de) - ini) / paso);
        var largo = Math.round((aMin(b.a) - aMin(b.de)) / paso);
        // Un bloque desalineado o fuera de rango rompería la tabla en silencio.
        if (i < 0 || largo < 1 || i + largo > n) return;
        empieza[b.dia][i] = { b: b, largo: largo };
        for (var k = 1; k < largo; k++) tapada[b.dia][i + k] = true;
      });

      var vertical = eje === 'vertical';
      var o = '<table class="hor"><thead><tr><th class="hor-esq" scope="col">' +
        (vertical ? 'Hora' : 'Día') + '</th>';
      if (vertical) h.dias.forEach(function (d) { o += '<th scope="col">' + esc(d) + '</th>'; });
      else for (var c = 0; c < n; c++) o += '<th scope="col">' + texto(ini + c * paso) + '</th>';
      o += '</tr></thead><tbody>';

      // Las dos ramas recorren lo mismo con los ejes cambiados: en vertical la
      // fila es la franja y el bloque se estira con rowspan; en horizontal la
      // fila es el día y se estira con colspan.
      var filas = vertical ? n : h.dias.length;
      var cols = vertical ? h.dias.length : n;
      for (var f = 0; f < filas; f++) {
        o += '<tr><th scope="row" class="hor-eje ' + (vertical ? 'hor-eje-v' : 'hor-eje-h') + '">' +
          (vertical ? texto(ini + f * paso) : esc(h.dias[f])) + '</th>';
        for (var g = 0; g < cols; g++) {
          var dia = vertical ? g : f, ranura = vertical ? f : g;
          if (tapada[dia][ranura]) continue;
          var e = empieza[dia][ranura];
          if (e) {
            o += '<td class="hor-c" ' + (vertical ? 'rowspan' : 'colspan') + '="' + e.largo + '">' +
              bloque(e.b, h.dias[dia]) + '</td>';
          } else o += '<td class="hor-c hor-vacia"></td>';
        }
        o += '</tr>';
      }
      return o + '</tbody></table>';
    }

    function marcar(sel, valor) {
      document.querySelectorAll(sel).forEach(function (b) {
        var act = b.getAttribute(sel.slice(1, -1)) === valor;
        b.setAttribute('aria-pressed', String(act));
        b.className = 'btn btn-mini ' + (act ? 'btn-1' : 'btn-neutro');
      });
    }

    function pintar() {
      zonas.forEach(function (z) {
        var h = DATOS[z.getAttribute('data-horario')];
        if (h) z.innerHTML = tabla(h);
      });
      marcar('[data-hor-eje]', eje);
      marcar('[data-hor-fmt]', fmt);
    }

    document.addEventListener('click', function (ev) {
      var be = ev.target.closest('[data-hor-eje]');
      if (be) {
        eje = be.getAttribute('data-hor-eje');
        try { localStorage.setItem('mmi-horario-eje', eje); } catch (e) {}
        return pintar();
      }
      var bf = ev.target.closest('[data-hor-fmt]');
      if (bf) {
        fmt = bf.getAttribute('data-hor-fmt');
        try { localStorage.setItem('mmi-horario-formato', fmt); } catch (e) {}
        pintar();
      }
    });

    pintar();
  })();

  // ── Navegación de la app móvil ────────────────────────────────────────────
  // La app NO reinventa la jerarquía: la LEE de la lateral. Así, añadir una
  // página al catálogo la añade a la app sin tocar nada de aquí, y las dos no
  // pueden divergir.
  var appTabs = document.getElementById('app-tabs');
  var appAtras = document.getElementById('app-atras');
  var appLista = document.getElementById('pg-app-seccion');
  var ICO_MAS = '${ICONOS.mas}';
  var ICO_CHEV = '${ICONOS.chevron}';

  var secciones = [].map.call(document.querySelectorAll('.lat-nav .nav-grupo'), function (g) {
    var t = g.querySelector('[data-desplegar]');
    return {
      titulo: t.querySelector('.nav-txt').textContent.trim(),
      icono: t.querySelector('.nav-ic').innerHTML,
      items: [].map.call(g.querySelectorAll('[data-ir]'), function (a) {
        return { id: a.getAttribute('data-ir'), t: a.querySelector('.nav-txt').textContent.trim() };
      }),
    };
  });

  // CUATRO PESTAÑAS. La convención dice cinco como máximo, pero aquí manda la
  // medida: a cinco, cada pestaña tiene 78px y deja 70px de texto, y las
  // etiquetas reales piden 76px -Fundamentos- y 72px -Composición-. No caben,
  // y 12px ya es el paso más pequeño de la escala, así que no hay de dónde
  // recortar. A cuatro quedan 89px y entran holgadas.
  var MAX_TABS = 4;
  var pestanas = secciones.length <= MAX_TABS
    ? secciones.map(function (s) { return { titulo: s.titulo, icono: s.icono, secciones: [s] }; })
    : secciones.slice(0, MAX_TABS - 1)
        .map(function (s) { return { titulo: s.titulo, icono: s.icono, secciones: [s] }; })
        .concat([{ titulo: 'Más', icono: ICO_MAS, secciones: secciones.slice(MAX_TABS - 1) }]);

  var tabDe = {};
  pestanas.forEach(function (p, i) {
    p.secciones.forEach(function (s) { s.items.forEach(function (it) { tabDe[it.id] = i; }); });
  });
  var tabActual = 0;

  appTabs.innerHTML = pestanas.map(function (p, i) {
    return '<button type="button" class="app-tab" data-tab="' + i + '">' + p.icono +
      '<span class="app-tab-txt">' + p.titulo + '</span></button>';
  }).join('');

  // La lista de sección reutiliza .pag-cab y .sub-seccion, que ya existen. No
  // se inventa tipografía nueva para una pantalla nueva.
  function pintarLista(i) {
    var p = pestanas[i];
    var h = '<div class="pant-cab"><h1>' + p.titulo + '</h1></div><div class="app-lista">';
    p.secciones.forEach(function (s) {
      if (p.secciones.length > 1) h += '</div><h2 class="sub-seccion">' + s.titulo + '</h2><div class="app-lista">';
      s.items.forEach(function (it) {
        h += '<button type="button" class="app-lista-it" data-ir="' + it.id + '">' +
          '<span class="app-lista-tx">' + it.t + '</span>' +
          '<span class="app-lista-ch">' + ICO_CHEV + '</span></button>';
      });
    });
    appLista.innerHTML = h + '</div>';
  }

  function appSincronizar() {
    var visible = document.querySelector('.pagina:not([hidden])');
    if (!document.documentElement.hasAttribute('data-app')) {
      appAtras.hidden = true;
      // Al salir de la app, la lista de sección no significa nada fuera.
      if (visible && visible.id === 'pg-app-seccion') abrir('inicio');
      return;
    }
    var enLista = !!visible && visible.id === 'pg-app-seccion';
    if (!enLista && visible) {
      var id = visible.id.replace(/^pg-/, '');
      if (tabDe[id] !== undefined) tabActual = tabDe[id];
    }
    // En la raíz de una pestaña no hay a dónde volver.
    appAtras.hidden = enLista;
    [].forEach.call(appTabs.children, function (b, i) {
      if (i === tabActual) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }
  window.__appSincronizar = appSincronizar;

  function irARaiz(i) {
    tabActual = i;
    pintarLista(i);
    abrir('app-seccion');
    appSincronizar();
  }
  appTabs.addEventListener('click', function (e) {
    var b = e.target.closest('.app-tab');
    if (b) irARaiz(parseInt(b.getAttribute('data-tab'), 10));
  });
  appAtras.addEventListener('click', function () { irARaiz(tabActual); });
  // Se registra DESPUÉS del manejador de [data-ir], así que corre cuando la
  // página ya cambió y la barra puede leer el título de verdad.
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-ir]')) appSincronizar();
  });

  // ── Reflujo: la lateral arranca plegada en pantalla estrecha ──────────────
  // La regla de 700px saca la lateral del flujo y la trae con el botón, que es
  // correcto. Lo que faltaba es el estado INICIAL: en escritorio la lateral
  // nace desplegada, y esa clase viajaba al estrechar, así que a 320px entraba
  // sola y tapaba el contenido. Los títulos salían cortados.
  //
  // Se pliega al arrancar y al cruzar el umbral, no en cada píxel de
  // redimensionado: quien ya la abrió a mano no quiere que se le cierre sola
  // mientras ajusta la ventana.
  //
  // R48 · SON DOS BANDAS, LAS MISMAS QUE MarcoApp: ≤900 el riel de tableta
  // (R38a) y ≤700 el cajón (R39). Aquí solo estaba la de 700, así que entre 701
  // y 900 el catálogo enseñaba un menú de 236px que el producto NO TIENE —él se
  // pliega solo a 56px—. Medido a 900px antes de tocar nada: catálogo 236px
  // desplegado, entrega 56px plegada. La promesa no enseñaba en ningún momento
  // el estado en el que vive la entrega, y por eso «se ve distinto» no tenía
  // dónde verse. Lo reportó el responsable a ese ancho exacto.
  (function () {
    var lateral = document.getElementById('lateral');
    if (!lateral) return;
    var bandas = ['(max-width: 900px)', '(max-width: 700px)'].map(function (q) {
      return window.matchMedia(q);
    });
    var aplicar = function (e) { if (e.matches) plegarLateral(true); };
    bandas.forEach(function (b) { if (b.addEventListener) b.addEventListener('change', aplicar); });
    if (bandas.some(function (b) { return b.matches; })) plegarLateral(true);
  })();

  // ── Vista guardada ────────────────────────────────────────────────────────
  // Va AL FINAL a propósito. Aplicar la vista muda la zona de avisos y repinta
  // las paginaciones, y ninguna de las dos existe todavía cuando se define el
  // menú de usuario. Restaurarla antes dejaría media aplicación en la otra
  // vista: barra de móvil con paginación de escritorio.
  try {
    var vistaGuardada = localStorage.getItem('mmi-vista');
    if ((vistaGuardada === 'movil' || vistaGuardada === 'app') && window.__aplicarVista) {
      window.__aplicarVista(vistaGuardada, false);
    }
  } catch (e) {}
})();
</script>
</body>
</html>
`;

mkdirSync(SALIDA, { recursive: true });
writeFileSync(join(SALIDA, 'index.html'), html);

/* ───────────────────────────────────────────────────────────────────────────
   R98 · NO PUEDE QUEDAR PLANTILLA SIN RESOLVER EN LA SALIDA
   Una barra invertida de mas —`\${ic('chevron', 18)}`— y el catalogo publica el
   codigo en vez del icono. Paso en la v1.72.0, en la pagina del Panel de
   privilegios, y NINGUN candado lo vio: se descubrio mirando una captura.
   Un `${` en el HTML generado no es nunca intencionado.
   ─────────────────────────────────────────────────────────────────────────── */
{
  // Solo en el MARCADO: el catalogo lleva su propio script, que usa template
  // literals en el navegador y ahi `${t}` es legitimo. Buscarlos tambien alli
  // daba trece falsos positivos, y un candado con falsos positivos se acaba
  // ignorando entero — la leccion de R95, aplicada antes de publicarlo.
  // Fuera tambien los EJEMPLOS: el catalogo enseña como se usa cada componente
  // en TSX, y ahi `${t}` o `${f.dni}` son parte de lo que se esta enseñando.
  const soloMarcado = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '');
  const crudo = [...soloMarcado.matchAll(/\$\{[^}\n]{0,60}\}/g)].map((m) => m[0]);
  if (crudo.length) {
    console.error(`\n  ${crudo.length} plantilla(s) sin resolver en cascaron/index.html:\n`);
    for (const c of [...new Set(crudo)].slice(0, 10)) console.error(`    ${c}`);
    console.error('\n  Casi siempre es una barra invertida de mas dentro de un template');
    console.error('  literal: el catalogo acaba publicando el codigo en vez del icono.\n');
    process.exit(1);
  }
}

const kb = (html.length / 1024).toFixed(0);
console.log(`\n  cascaron/index.html  ${kb} KB, autocontenido`);
console.log(`  ${Object.keys(semanticos).length} semánticos · ${Object.keys(primitivas).length} escalas · 3 maquetas · 2 modos`);

// La entrega se reconstruye SIEMPRE con el catálogo, y después de escribirlo
// para que lleve dentro esta misma versión. Si fueran dos comandos separados,
// el botón de descarga acabaría entregando un catálogo viejo sin que se note.
// El inventario del LEEME sale del MISMO índice que el menú, no de una lista
// escrita a mano: si se copiara, envejecería en cuanto se añada un elemento y
// quien recibe la entrega creería que el sistema es más pequeño de lo que es.
// Los estilos de componente se extraen del catalogo RECIEN escrito. Corre aqui
// y no aparte para que no puedan quedarse atras: si el catalogo cambia, la hoja
// entregada cambia en el mismo comando.
const { execFileSync } = await import('node:child_process');
execFileSync(process.execPath, [join(AQUI, '..', 'componentes', 'extraer.mjs')], { stdio: 'inherit' });

const entrega = empaquetar({
  silencioso: true,
  inventario: CATALOGO.map((g) => ({
    grupo: g.grupo,
    items: g.items.map((i) => ({ t: i.t, estado: i.estado })),
  })),
});
console.log(`  ${entrega.nombre}  ${(entrega.bytes / 1024).toFixed(0)} KB, ${entrega.archivos} archivos\n`);
