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
import { VERSION, primitivas, semanticos, marca, correcciones } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const SALIDA = join(RAIZ, 'cascaron');

const tokensCss = readFileSync(join(RAIZ, 'sistema', 'tokens', 'tokens.css'), 'utf8');
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
const esClaro = (hex) => lum(hex) > 0.4;

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
    <div class="muestra-color" data-claro="${tok.claro}" data-oscuro="${tok.oscuro}"
         style="background: var(--${nombre})"></div>
    <div class="muestra-txt">
      <code class="muestra-nombre">${nombre}</code>
      <span class="muestra-hex" data-hex-de="${nombre}">${tok.claro}</span>
      <span class="muestra-uso">${tok.uso}</span>
    </div>
  </div>`;

const grupoMuestras = ([titulo, claves]) => `
  <section class="grupo">
    <h3>${titulo}</h3>
    <div class="rejilla">${claves.map((k) => muestra(k, semanticos[k])).join('')}</div>
  </section>`;

const escala = (nombre, pasos) => `
  <div class="escala">
    <div class="escala-nombre">${nombre}</div>
    <div class="escala-tiras">
      ${Object.entries(pasos)
        .map(
          ([paso, hex]) => `
        <div class="tira" style="background:${hex}; color:${esClaro(hex) ? '#2C2A25' : '#FFFFFF'}">
          <span>${paso}</span><span class="tira-hex">${hex}</span>
        </div>`
        )
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
const ic = (d, extra = '') =>
  `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;

const ICONOS = {
  panel: ic('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  matricula: ic('<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>'),
  asistencia: ic('<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'),
  usuarios: ic('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M17 6a3 3 0 0 1 0 6M18 20c0-2-1-3.5-2.5-4.5"/>'),
  comunicaciones: ic('<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="13" width="4" height="6" rx="1.5"/><rect x="18" y="13" width="4" height="6" rx="1.5"/>'),
  administracion: ic('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
  tesoreria: ic('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
  academico: ic('<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M12 15v6"/>'),
  configuracion: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7"/>'),
  chevron: ic('<path d="m6 9 6 6 6-6"/>'),
  sol: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>'),
  sobre: ic('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'),
  campana: ic('<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  panelIzq: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
};

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
      <label class="filtro"><span class="filtro-et">Años</span><select class="campo"><option>2026</option></select></label>
      <label class="filtro"><span class="filtro-et">Sedes</span><select class="campo"><option>Todas</option></select></label>
      <label class="filtro"><span class="filtro-et">Nivel</span><select class="campo"><option>Todos</option></select></label>
    </div>
    <div class="top-acciones">
      <button class="top-btn" aria-label="Cambiar tema">${ICONOS.sol}</button>
      <button class="top-btn" aria-label="Mensajes">${ICONOS.sobre}</button>
      <button class="top-btn" aria-label="Notificaciones">${ICONOS.campana}<span class="badge">1</span></button>
      <span class="top-avatar">JH</span>
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
      <span class="lat-av">JP</span>
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
        <div class="s-pag-btns"><span class="pag activa">1</span><span class="pag">2</span><span class="pag">3</span><span class="pag">›</span></div>
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
      <button class="btn" disabled style="background:var(--accion-deshabilitada);color:var(--accion-texto-desh);cursor:not-allowed">Sin permiso</button>
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
      <div class="msj msj-exito"><strong>Se guardó.</strong> 24 registros actualizados.</div>
      <div class="msj msj-aviso"><strong>Faltan 3 asistencias.</strong> Puedes continuar y completarlas después.</div>
      <div class="msj msj-error"><strong>No se guardó: falta el DNI.</strong> Complétalo y vuelve a intentar.</div>
      <div class="msj msj-info"><strong>El periodo se cierra el 31 de marzo.</strong> Después no se podrán editar notas.</div>
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
    <div class="mal-caja mal"><button class="btn" style="background:var(--marca-celeste);color:#fff">Agregar +</button>
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
    <div class="mal-caja mal"><input class="campo sin-foco" value="Sin anillo de foco">
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
  <table class="tabla-escala">
    <thead><tr><th>Muestra</th><th>Clase</th><th class="num">Tamaño</th><th>Peso</th><th class="num">Interlínea</th></tr></thead>
    <tbody>${filas.map(filaEscala).join('')}</tbody>
  </table>`;

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
<p class="seccion-sub" style="margin-top:10px">Fíjate en que Thin, ExtraLight y Light <strong>no se ven distintos</strong> a este tamaño: el navegador no tiene esos cortes y sintetiza o cae al más cercano. Un peso que no existe en el archivo no es una decisión de diseño, es un accidente.</p>

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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
  <thead><tr><th>Acción</th><th>Variante</th><th>Aspecto</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td><strong>Guardar</strong> · Grabar · Crear · Confirmar</td><td><code>principal</code></td><td><button class="btn btn-mini btn-1">Guardar</button></td><td class="motivo">Es a lo que vino la persona. Una sola por pantalla</td></tr>
    <tr><td><strong>Eliminar</strong> · Anular · Dar de baja</td><td><code>destructiva</code></td><td><button class="btn btn-mini btn-destr">Eliminar</button></td><td class="motivo">Irreversible. El rojo avisa antes de pulsar, no después</td></tr>
    <tr><td><strong>Cancelar</strong> · Volver · Descartar</td><td><code>terciaria</code></td><td><button class="btn btn-mini btn-terc">Cancelar</button></td><td class="motivo">No debe competir. Si Cancelar pesa lo mismo que Guardar, la pantalla no dice qué hacer</td></tr>
    <tr><td><strong>Editar</strong> · Ver detalle (en fila)</td><td><code>enlace</code></td><td><a href="#" class="enlace">Editar</a></td><td class="motivo">Con cinco filas, cinco botones son ruido, no jerarquía</td></tr>
    <tr><td><strong>Columnas</strong> · Filtros avanzados</td><td><code>secundaria</code></td><td><button class="btn btn-mini btn-2">Columnas</button></td><td class="motivo">Le da al oro trabajo funcional y no solo decorativo</td></tr>
    <tr><td><strong>Exportar</strong> · Imprimir · Duplicar</td><td><code>neutra</code></td><td><button class="btn btn-mini btn-neutro">Exportar</button></td><td class="motivo">Apoyo que no necesita reclamar atención</td></tr>
    <tr><td><strong>Inactivo</strong> — sin permiso o sin datos</td><td><code>deshabilitada</code></td><td><button class="btn btn-mini" disabled style="background:var(--accion-deshabilitada);color:var(--accion-texto-desh);cursor:not-allowed">Guardar</button></td><td class="motivo">Se ve pero no se pulsa. <strong>Di por qué</strong> en un texto al lado</td></tr>
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
<table class="tabla-contraste" style="margin-top:10px">
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
    <div class="mf"><button class="btn" style="background:var(--accion-hover);color:var(--accion-texto)">Guardar</button><span class="mf-et">Hover<br><code>accion-hover</code></span></div>
    <div class="mf"><button class="btn" style="background:var(--accion-activa);color:var(--accion-texto)">Guardar</button><span class="mf-et">Presionado<br><code>accion-activa</code></span></div>
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
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
      <p style="margin:0;font-size:14px;max-width:34ch">Consulta el <a href="#" class="enlace enl-sub">calendario académico</a>.</p>
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
<table class="tabla-contraste">
  <thead><tr><th>✗</th><th>✓</th><th>Por qué</th></tr></thead>
  <tbody>
    <tr><td>«Clic aquí»</td><td>«Ver requisitos de admisión»</td><td class="motivo">Un lector de pantalla puede listar solo los enlaces. «Clic aquí» ×12 no dice nada</td></tr>
    <tr><td>«Más información»</td><td>«Calendario académico 2026»</td><td class="motivo">El texto debe entenderse <strong>fuera de contexto</strong></td></tr>
    <tr><td>«https://ae.edu.pe/adm…»</td><td>«Admisión»</td><td class="motivo">Una URL cruda se lee carácter a carácter</td></tr>
    <tr><td>«Leer más» en cada tarjeta</td><td>«Leer sobre Inicial»</td><td class="motivo">Doce enlaces idénticos que llevan a sitios distintos</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-contraste">
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
<table class="tabla-contraste" style="margin-top:14px">
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
const ICO_ERROR = ic('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>');

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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
  <thead><tr><th>✗</th><th>✓</th></tr></thead>
  <tbody>
    <tr><td>«Campo inválido»</td><td>«El DNI debe tener 8 dígitos»</td></tr>
    <tr><td>«Error de formato»</td><td>«Falta el @ en el correo»</td></tr>
    <tr><td>«Dato incorrecto»</td><td>«El dígito verificador no coincide. Revísalo»</td></tr>
    <tr><td>«Campo requerido»</td><td>«Falta el nombre del apoderado»</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Accesibilidad</h3>
<table class="tabla-contraste">
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
<table class="tabla-contraste" style="margin-top:14px">
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
</table>`;

// ── Elemento: Selector ──────────────────────────────────────────────────────

const ICO_LUPA = ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>');
const ICO_CHECK = ic('<path d="m5 12 5 5L20 7"/>');

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
<table class="tabla-contraste">
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

<h3 class="sub-seccion">Selector con búsqueda — funciona, pruébalo</h3>
<p class="seccion-sub">${APODERADOS.length} apoderados. Escribe y filtra por coincidencias. Flechas para moverte, Enter para elegir, Esc para cerrar.</p>
<div class="bloque">
  <div class="sel-demo-fila">
    <div class="cg" style="max-width:340px">
      <span class="cg-et" id="sel-et">Apoderado</span>
      <div class="sel" data-sel>
        <div class="sel-caja">
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
      <div class="sel-caja"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in" placeholder="Escribe para buscar" readonly></div></label>
    <label class="cg"><span class="cg-et">Con foco</span>
      <div class="sel-caja"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in foco-demo" placeholder="Escribe para buscar" readonly></div></label>
    <label class="cg"><span class="cg-et">Con selección</span>
      <div class="sel-caja"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
        <input class="campo sel-in" value="Pérez Salazar, Ana" readonly></div></label>
    <label class="cg"><span class="cg-et">Con error</span>
      <div class="sel-caja"><span class="sel-lupa">${ICO_LUPA}</span><span class="sel-chev">${ICONOS.chevron}</span>
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste" style="margin-top:14px">
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
  <table class="tabla-contraste">
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
        (s) => `<div class="chip-sup-caja" style="background: var(--${s})">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste" style="margin-top:14px">
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
const SILUETA = `<svg viewBox="0 0 40 40" class="av-silueta" aria-hidden="true">
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
    <div class="tp-av">${conFoto ? SILUETA : `<span class="tp-ini">${iniciales(nombre)}</span>`}</div>
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
<table class="tabla-contraste" style="margin-top:12px">
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
    <div class="mf"><div class="tp-av tp-av-suelto">${SILUETA}</div><span class="mf-et"><b>Sin foto cargada</b><br>Silueta neutra<br>Marcador, no una persona inventada</span></div>
    <div class="mf"><div class="tp-av tp-av-suelto"><span class="tp-ini">QM</span></div><span class="mf-et"><b>Iniciales</b><br>Del primer apellido y el nombre<br>Preferible a la silueta</span></div>
    <div class="mf"><div class="tp-av tp-av-suelto tp-av-marco"><span class="tp-ini">RA</span></div><span class="mf-et"><b>En el marco</b><br><code>marco-acento</code></span></div>
  </div>
</div>
<p class="pag-intro" style="margin-top:12px">Las iniciales <strong>ganan a la silueta</strong>:
identifican, la silueta no. La foto es un lujo; las iniciales son el suelo. Y el avatar
<strong>nunca es el único identificador</strong>: el nombre va siempre al lado.</p>

<h3 class="sub-seccion">Tarjeta normal</h3>
<div class="bloque">
  <div class="tn-rejilla">
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
    <a href="#" class="tn tn-pulsable">
      <div class="tn-cuerpo"><h4>Pulsable →</h4><p>Si toda la tarjeta navega, es un <code>&lt;a&gt;</code>. <strong>Nunca un div con onClick.</strong></p></div>
    </a>
  </div>
</div>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-contraste">
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

const ICO_DESC = ic('<path d="M12 5v14M6 13l6 6 6-6"/>');
const ICO_ORD = ic('<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>');
const ICO_COLS = ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>');
const ICO_FILTRO = ic('<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>');
const ICO_X = ic('<path d="M6 6l12 12M18 6 6 18"/>');

const pagTabla = `
<p class="pag-intro">Es el <strong>80 % de la superficie del sistema</strong>. Todo lo demás se
mira un rato; esto se mira seis horas. Ordena, pagina, oculta columnas, recuerda la
configuración y descarga CSV.</p>

<div class="bloque">
  <div class="tb-barra">
    <div class="tb-barra-izq">
      <label class="tb-mini tb-buscar"><span>Buscar en toda la tabla</span>
        <span class="sel-caja"><span class="sel-lupa">${ICO_LUPA}</span>
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
<table class="tabla-contraste" style="margin-top:12px">
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
<table class="tabla-contraste">
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
<table class="tabla-contraste">
  <tbody>
    <tr><td>Selección múltiple con acciones en lote</td><td class="motivo">Necesita definir qué acciones y con qué permisos. Es regla de negocio</td></tr>
    <tr><td>Encabezado fijo al desplazar</td><td class="motivo">Trivial de añadir; se hace con el componente real</td></tr>
    <tr><td>Reordenar columnas arrastrando</td><td class="motivo">Coste alto y beneficio dudoso. Ocultar ya cubre el 90 % del caso</td></tr>
    <tr><td>Guardar vistas con nombre</td><td class="motivo">«Mis tardanzas de esta semana». Útil, pero primero hay que ver si alguien lo pide</td></tr>
  </tbody>
</table>

<h3 class="sub-seccion">Reglas</h3>
<table class="tabla-contraste">
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
        `<table class="tabla-manual"><thead><tr>${cabs.map((c) => `<th>${enLinea(c)}</th>`).join('')}</tr></thead>` +
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
<p class="pag-intro">${Object.keys(semanticos).length} tokens semánticos sobre 4 escalas primitivas.
Es lo único que un componente consume. <strong>Las primitivas están prohibidas dentro de un componente.</strong></p>
${Object.entries(GRUPOS).map(grupoMuestras).join('')}
<h3 class="sub-seccion">Primitivas</h3>
<p class="seccion-sub">Existen para que los semánticos elijan. No se consumen directamente.</p>
${Object.entries(primitivas).map(([n, p]) => escala(n, p)).join('')}
<h3 class="sub-seccion">Marca — fuera del sistema</h3>
<p class="seccion-sub">Viven en el escudo, la landing y los impresos. No en la interfaz.</p>
<div class="marca-rejilla">
${Object.entries(marca).map(([k, v]) => `
  <div class="marca-item">
    <div class="marca-tapa" style="background: var(--${k})"></div>
    <div class="marca-cuerpo"><code>${k}</code><p>${v.uso}</p>
      <div class="marca-prohibido">Prohibido en: ${v.prohibidoEn}</div></div>
  </div>`).join('')}
</div>`;

const pagContraste = `
<p class="pag-intro">${lock.resumen.paresBloqueantes} pares bloqueantes en los dos modos ·
<strong>${lock.resumen.fallos} fallos</strong> · ${lock.norma}. Recalculados en cada build por
<code>verificar-contraste.mjs</code>: si el contrato miente, el build falla.</p>
<h3 class="sub-seccion">Modo claro</h3>
<table class="tabla-contraste">
  <thead><tr><th>Frente</th><th>Fondo</th><th class="num">Medido</th><th class="num">Mínimo</th><th>Estado</th><th>Motivo</th></tr></thead>
  <tbody>${filasContraste('claro')}</tbody>
</table>
<h3 class="sub-seccion">Modo oscuro</h3>
<table class="tabla-contraste">
  <thead><tr><th>Frente</th><th>Fondo</th><th class="num">Medido</th><th class="num">Mínimo</th><th>Estado</th><th>Motivo</th></tr></thead>
  <tbody>${filasContraste('oscuro')}</tbody>
</table>
<h3 class="sub-seccion">Correcciones sobre el documento original</h3>
<table class="tabla-contraste">
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
<p class="pag-intro" style="margin-top:14px">Es el tercer defecto real que el documento reporta en §1.3, y el único que seguía sin resolver.</p>`;

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
    items: [
      { id: 'boton', t: 'Botón', estado: 'listo', c: pagBoton },
      { id: 'enlace', t: 'Enlace', estado: 'listo', c: pagEnlace },
      { id: 'campo', t: 'Campo de texto', estado: 'listo', c: pagCampo },
      { id: 'selector', t: 'Selector', estado: 'listo', c: pagSelector },
      { id: 'chip', t: 'Chip de estado', estado: 'listo', c: pagChip },
      { id: 'tarjeta', t: 'Tarjeta', estado: 'listo', c: pagTarjeta },
      { id: 'tabla', t: 'Tabla de datos', estado: 'listo', c: pagTabla },
      { id: 'paginacion', t: 'Paginación', estado: 'pendiente', c: pendiente('Paginación', 'fase 5') },
      { id: 'estados', t: 'Estados de pantalla', estado: 'pendiente', c: pendiente('Estados de pantalla', 'fase 5') },
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
    items: [{ id: 'contraste', t: 'Contrastes', estado: 'listo', c: pagContraste }],
  },
];

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
      ${g.items
        .map(
          (i) => `<a class="nav-hijo" href="#${i.id}" data-ir="${i.id}" title="${i.t}">
            <span class="nav-txt">${i.t}</span>${PUNTO[i.estado]}</a>`
        )
        .join('')}
    </div>
  </div>`
).join('');

const paginasCatalogo = CATALOGO.flatMap((g) =>
  g.items.map(
    (i) => `<section class="pagina" id="pg-${i.id}" hidden>
      <nav class="migas" aria-label="Ubicación">
        <a href="#inicio" data-ir="inicio">Sistema de diseño</a>
        <span class="migas-sep" aria-hidden="true">/</span>
        <span class="migas-grupo">${g.grupo}</span>
        <span class="migas-sep" aria-hidden="true">/</span>
        <span class="migas-actual" aria-current="page">${i.t}</span>
      </nav>
      <div class="pag-cab"><h1>${i.t}</h1></div>
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
body {
  margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif;
  background: var(--fondo-pagina); color: var(--texto-principal);
  font-size: 15px; line-height: 1.45; transition: background .18s, color .18s;
}
h1,h2,h3,h4 { margin: 0; }
code { font-family: 'IBM Plex Mono', monospace; }

.envoltorio { max-width: 1180px; margin: 0 auto; padding: 0 24px 80px; }

/* Cabecera */
.cab {
  position: sticky; top: 0; z-index: 20;
  background: var(--marco-fondo); color: var(--marco-texto);
  padding: 14px 24px; display: flex; align-items: center; gap: 20px;
  border-bottom: 3px solid var(--marco-acento);
}
.cab h1 { font-size: 17px; font-weight: 600; }
.cab .ver { font-size: 12px; color: var(--marco-acento); font-family: 'IBM Plex Mono', monospace; }
.cab .sep { flex: 1; }
.conmutador {
  display: flex; background: var(--marco-item-activo); border-radius: 6px; padding: 3px; gap: 3px;
}
.conmutador button {
  font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  background: transparent; color: var(--marco-texto); border: 0;
  padding: 6px 14px; border-radius: 4px;
}
.conmutador button[aria-pressed="true"] { background: var(--marco-acento); color: var(--marco-item-activo); }
.conmutador button:focus-visible { outline: 2px solid var(--foco-en-marco); outline-offset: 2px; }

/* ── El cascarón usa la misma cáscara que la aplicación ──────────────────── */
.app-cascaron { min-height: 100vh; }
.app-cascaron .lat { position: sticky; top: 0; height: 100vh; overflow: hidden; }
.app-cascaron .lat-nav { overflow-y: auto; }
.app-cascaron .app-main { min-height: 100vh; }
.top-cascaron { position: sticky; top: 0; z-index: 20; }

/* Grupos desplegables — icono + nombre + chevron */
.nav-grupo { margin-bottom: 2px; }
.nav-grupo-tit { width: 100%; background: transparent; border: 0; cursor: pointer;
  font: inherit; text-align: left; }
.nav-grupo-tit .nav-chev .ic { transition: transform .15s; }
.nav-grupo[data-cerrado] .nav-chev .ic { transform: rotate(-90deg); }
.nav-grupo[data-cerrado] .nav-hijos { display: none; }
.nav-hijos { padding: 2px 0 6px 0; }
.nav-hijo { display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 6px 10px 6px 40px; border-radius: 5px; text-decoration: none;
  color: var(--marco-texto); font-size: 13px; opacity: .78; white-space: nowrap; }
.nav-hijo:hover { background: rgba(255,255,255,.07); opacity: 1; }
.nav-hijo.activo { background: var(--marco-item-activo); opacity: 1;
  color: var(--marco-acento); font-weight: 500;
  box-shadow: inset 3px 0 0 var(--marco-acento); }
.lat.colapsado .nav-hijos, .lat.colapsado .lat-leyenda { display: none; }
.lat.colapsado .nav-grupo-tit { justify-content: center; padding-inline: 0; }

.pt { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.pt-decidir { background: var(--aviso-acento); }
.pt-pend { background: rgba(255,255,255,.34); }
.lat-leyenda { border-top: 1px solid rgba(255,255,255,.10); margin: 0 8px;
  padding: 11px 4px; font-size: 10px; color: rgba(255,255,255,.62);
  display: grid; gap: 5px; }
.lat-leyenda div { display: flex; align-items: center; gap: 7px; }

.cat-cuerpo { flex: 1; min-width: 0; padding: 24px 32px 80px; max-width: 1120px;
  background: var(--fondo-pagina); }
.migas { display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  font-size: 12px; margin-bottom: 10px; }
.migas a { color: var(--enlace); text-decoration: none; }
.migas a:hover { text-decoration: underline; }
.migas-sep { color: var(--texto-pista); }
.migas-grupo { color: var(--texto-secundario); }
.migas-actual { color: var(--texto-principal); font-weight: 500; }
.pag-cab { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid var(--borde); }
.pag-cab h1 { font-size: 28px; font-weight: 600; }
.pag-intro { font-size: 15px; color: var(--texto-secundario); max-width: 90ch; margin: 0 0 20px; }

.bloque { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 20px; margin-bottom: 8px; }
.muestra-fila { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; }
.mf { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.mf-et { font-size: 11px; color: var(--texto-secundario); line-height: 1.45; }
.btn-ic { display: inline-flex; align-items: center; gap: 7px; }
.btn-solo-ic { padding-inline: 8px; }
.movil-btn-demo { max-width: 340px; display: flex; flex-direction: column; gap: 8px; }

/* Tabla de datos */
.tb-barra { display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.tb-barra-izq, .tb-barra-der { display: flex; align-items: flex-end; gap: 10px; }
.tb-mini { display: flex; flex-direction: column; gap: 3px; }
.tb-mini span { font-size: 11px; font-weight: 500; color: var(--texto-secundario); }
.tb-mini .campo { font-size: 13px; padding: 5px 9px; min-width: 92px; }
.tb-conteo { font-size: 12px; color: var(--texto-secundario); padding-bottom: 7px; }

.tb-cols-menu { position: relative; }
.tb-cols-panel { position: absolute; z-index: 30; right: 0; top: calc(100% + 4px);
  min-width: 210px; padding: 6px; background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-campo); border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,.16); }
.tb-col-op { display: flex; align-items: center; gap: 9px; padding: 7px 9px;
  border-radius: 4px; font-size: 13px; cursor: pointer; }
.tb-col-op:hover { background: var(--fondo-encabezado); }
.tb-col-op.fija { cursor: not-allowed; color: var(--texto-secundario); }
.tb-col-op em { margin-left: auto; font-style: normal; font-size: 10px;
  color: var(--texto-pista); text-transform: uppercase; letter-spacing: .06em; }
.tb-col-op input { accent-color: var(--accion); width: 15px; height: 15px; }
.tb-col-reset { width: 100%; margin-top: 4px; padding: 7px; font: inherit; font-size: 12px;
  cursor: pointer; background: transparent; border: 0; border-top: 1px solid var(--borde);
  color: var(--enlace); }

.tb-envoltura { overflow-x: auto; border: 1px solid var(--borde); border-radius: 6px; }
.tb { width: 100%; border-collapse: collapse; font-size: 14px; background: var(--fondo-tarjeta); }
.tb-th { background: var(--fondo-encabezado); text-align: left; padding: 0;
  white-space: nowrap; border-bottom: 1px solid var(--borde); }
.tb-orden { display: flex; align-items: center; gap: 5px; width: 100%; padding: 9px 12px;
  font: inherit; font-size: 14px; font-weight: 500; cursor: pointer;
  background: transparent; border: 0; color: var(--texto-principal); text-align: left; }
.tb-orden:hover { color: var(--accion); }
.tb-orden.activo { color: var(--accion); }
.tb-flecha { font-size: 11px; width: 10px; }
.tb-th.tb-num .tb-orden { justify-content: flex-end; }
.tb td { padding: 0 12px; height: 34px; border-top: 1px solid var(--borde); }
.tb-num { text-align: right; }
/* Columna de posición: estrecha, en secundario y sin botón de orden. Es un
   localizador para decir "mira la fila 7", no un dato que se compare. */
.tb-th-indice { width: 52px; }
.tb-th-indice .tb-th-txt { display: block; padding: 9px 12px; font-weight: 500; }
.tb-indice { text-align: right; color: var(--texto-secundario);
  font-size: 13px; width: 52px; }
.tb-acc { text-align: right; white-space: nowrap; }
/* Cebra: una fila blanca y la siguiente en fondo-fila-alt. */
.tb tbody tr.tb-alt { background: var(--fondo-fila-alt); }
/* El resaltado lleva FILETE, no solo fondo: medido, sobre la fila alterna el
   fondo solo cambia 1,04:1 y la mitad de las filas no responderían. */
.tb tbody tr:hover { background: var(--fondo-fila-hover); box-shadow: inset 3px 0 0 var(--accion); }
.tb-vacio { text-align: center; padding: 34px 16px !important; height: auto !important;
  font-size: 13px; color: var(--texto-secundario); line-height: 1.6; }
.tb-vacio strong { color: var(--texto-principal); }

/* Filtros por columna */
.tb-buscar .sel-caja { display: flex; }
.tb-buscar input.campo.sel-in { min-width: 230px; font-size: 13px; padding-block: 5px; }
#tb-filtros-btn.activo { border-color: var(--accion); color: var(--accion); }
.tb-fila-filtros .tb-f-celda { padding: 6px 8px; background: var(--fondo-encabezado);
  border-bottom: 1px solid var(--borde); }
.tb-f { width: 100%; font-size: 12px; padding: 4px 8px; }
select.tb-f { padding-right: 26px; background-position: right 7px center; background-size: 13px 13px; }

.tb-activos { display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  margin-bottom: 10px; padding: 8px 10px; border-radius: 6px;
  background: var(--info-fondo); border-left: 3px solid var(--info-acento); }
.tb-act { display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
  color: var(--info-texto); background: var(--fondo-tarjeta);
  border: 1px solid var(--borde); border-radius: 3px; padding: 3px 4px 3px 8px; }
.tb-act b { font-weight: 600; }
.tb-act-x { display: grid; place-items: center; background: transparent; border: 0;
  cursor: pointer; color: var(--texto-secundario); padding: 2px; border-radius: 3px; }
.tb-act-x:hover { color: var(--error-texto); }
.tb-act-x .ic { width: 13px; height: 13px; }
.tb-act-todo { font: inherit; font-size: 12px; cursor: pointer; background: transparent;
  border: 0; color: var(--info-texto); text-decoration: underline; margin-left: 4px; }
.tb-vacio-quitar { font: inherit; font-size: 13px; cursor: pointer; background: transparent;
  border: 0; color: var(--enlace); text-decoration: underline; padding: 0; }

.tb-pie { display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.tb-rango { font-size: 12px; color: var(--texto-secundario); }
.tb-pag { display: flex; gap: 4px; align-items: center; }
.tb-p { min-width: 28px; height: 28px; padding: 0 7px; font: inherit; font-size: 12px;
  cursor: pointer; background: var(--fondo-tarjeta); color: var(--texto-principal);
  border: 1px solid var(--borde); border-radius: 4px; }
.tb-p:hover:not(:disabled) { border-color: var(--accion); color: var(--accion); }
.tb-p.activa { background: var(--accion); color: var(--accion-texto); border-color: var(--accion); }
.tb-p:disabled { color: var(--accion-texto-desh); cursor: not-allowed; }
.tb-elip { color: var(--texto-pista); padding: 0 2px; }

/* Tabla con filas desplegables */
.tb-desp .tb-th-txt { display: block; padding: 9px 12px; font-weight: 500; }
.tb-th-chev { width: 42px; }
.tb-chev-celda { width: 42px; padding: 0 !important; }
.tb-chev { width: 100%; height: 34px; display: grid; place-items: center;
  background: transparent; border: 0; cursor: pointer; color: var(--texto-secundario); }
.tb-chev:hover { color: var(--accion); }
.tb-chev .ic { width: 16px; height: 16px; transition: transform .18s ease; }
.tb-chev[aria-expanded='true'] .ic { transform: rotate(180deg); }
.tb-grupo.abierto { background: var(--fondo-fila-hover); }
.tb-grupo.abierto td { border-bottom: 0; }

.tb-detalle > td { padding: 0 !important; height: auto !important; border-top: 0 !important; }
/* grid-template-rows 0fr → 1fr es lo único que anima hasta altura automática
   sin tener que fijar la altura en píxeles a mano. */
.tb-desliza { display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows .22s ease; }
.tb-detalle.abierto .tb-desliza { grid-template-rows: 1fr; }
.tb-desliza-in { overflow: hidden; }
.tb-sub { width: 100%; border-collapse: collapse; font-size: 13px;
  background: var(--fondo-pagina); }
.tb-sub th { text-align: left; font-weight: 500; font-size: 12px;
  color: var(--texto-secundario); padding: 8px 12px 8px 42px;
  border-bottom: 1px solid var(--borde); }
.tb-sub th:not(:first-child) { padding-left: 12px; }
.tb-sub td { padding: 0 12px; height: 30px; border-bottom: 1px solid var(--borde); }
.tb-sub .tb-sub-n { width: 52px; padding-left: 42px; text-align: right; }
.tb-sub tr:last-child td { border-bottom: 0; }
.tb-sub tbody tr:hover { background: var(--fondo-tarjeta); }

/* Tarjeta de persona */
.tp-rejilla { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 10px; }
.tp-rejilla-2 { grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); max-width: 560px; }
.tp-rejilla-1 { max-width: 300px; }
.tp { display: flex; gap: 11px; align-items: flex-start; padding: 12px 14px;
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

.tp-av { width: 42px; height: 42px; border-radius: 50%; flex: none; overflow: hidden;
  background: var(--fondo-encabezado); color: var(--texto-secundario);
  display: grid; place-items: center; }
.tp-inact .tp-av { background: var(--borde); }
.av-silueta { width: 100%; height: 100%; display: block; }
.tp-ini { font-size: 14px; font-weight: 600; color: var(--texto-principal); }
.tp-av-suelto { width: 48px; height: 48px; }
.tp-av-marco { background: var(--marco-acento); }
.tp-av-marco .tp-ini { color: var(--marco-fondo); }

.tp-txt { min-width: 0; flex: 1; }
.tp-nom { font-size: 14px; font-weight: 600; margin: 0 0 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-cargo { font-size: 12px; color: var(--texto-secundario); margin: 0 0 8px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-pie { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tp-hora { font-size: 12px; color: var(--texto-secundario); }
.chip-pend { background: var(--fondo-encabezado); color: var(--texto-principal);
  border-color: var(--borde-fuerte); }
.chip-inact { background: var(--borde); color: var(--texto-principal);
  border-color: var(--borde-fuerte); }
/* Solo para el ejemplo de lo que NO se debe hacer. */
.tp-opaca { opacity: .5; }

/* Tarjeta normal */
.tn-rejilla { display: grid; grid-template-columns: repeat(auto-fill,minmax(230px,1fr)); gap: 12px; }
.tn { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; display: flex; flex-direction: column; text-decoration: none;
  color: var(--texto-principal); }
.tn-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px 14px; border-bottom: 1px solid var(--borde); }
.tn-cab h4, .tn-cuerpo h4 { font-size: 14px; font-weight: 600; margin: 0 0 4px; }
.tn-cab h4 { margin: 0; }
.tn-cuerpo { padding: 14px; flex: 1; }
.tn-cuerpo p { margin: 0; font-size: 13px; color: var(--texto-secundario); line-height: 1.55; }
.tn-pie { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 14px;
  border-top: 1px solid var(--borde); }
.tn-pulsable:hover { border-color: var(--accion); }
.tn-pulsable:hover h4 { color: var(--accion); }

/* Chip de estado */
.chip-sup { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 10px; }
.chip-sup-caja { border: 1px solid var(--borde); border-radius: 6px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px; }
.chip-sup-et code { font-size: 11px; color: var(--texto-secundario); }
.chip-sup-fila { display: flex; gap: 6px; flex-wrap: wrap; }
.chip-sup-nota { font-size: 10px; color: var(--texto-pista); }
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
.chip-con-punto i { display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; margin-right: 6px; vertical-align: middle; }
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
.sel-chev .ic { width: 16px; height: 16px; transition: transform .15s ease; }
.sel-caja.abierta .sel-chev .ic { transform: rotate(180deg); }
/* Especificidad explícita: la clase .campo declara padding en atajo y pisaría
   estas dos longhand si empataran. La lupa ocupa la izquierda y el chevron la
   derecha, así que el texto necesita hueco reservado a ambos lados. */
input.campo.sel-in { width: 100%; padding-left: 32px; padding-right: 34px; }
.sel-lista { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0;
  max-height: 244px; overflow-y: auto; margin: 0; padding: 4px; list-style: none;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde-campo);
  border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.16); }
.sel-op { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 7px 10px; border-radius: 4px; font-size: 14px; cursor: pointer; }
.sel-op.marcado { background: var(--fondo-fila-hover); }
.sel-op[aria-selected="true"] { color: var(--accion); font-weight: 500; }
.sel-check { color: var(--accion); display: grid; place-items: center; }
.sel-check .ic { width: 15px; height: 15px; }
.sel-vacio { padding: 14px 12px; font-size: 13px; color: var(--texto-secundario); line-height: 1.55; }
.sel-vacio strong { color: var(--texto-principal); }
.sel-demo-fila { display: grid; grid-template-columns: minmax(260px,360px) 1fr; gap: 28px; align-items: start; }
.sel-notas p { margin: 0 0 10px; font-size: 13px; line-height: 1.6; color: var(--texto-secundario); }
.sel-notas strong { color: var(--texto-principal); }
@media (max-width: 760px) { .sel-demo-fila { grid-template-columns: 1fr; } }

/* Campo de texto */
.cg { display: flex; flex-direction: column; gap: 5px; }
.cg-et { font-size: 13px; font-weight: 500; color: var(--texto-principal); }
.cg-et-oculta { visibility: hidden; }
.cg-req { color: var(--error-texto); margin-left: 2px; font-weight: 600; }
.cg-in { width: 100%; }
/* background-color y no el atajo background: el atajo borra el background-image
   y un select deshabilitado se quedaba sin su flecha, que es justo lo que lo
   identifica como selector. */
.cg-in:disabled { background-color: var(--fondo-encabezado); color: var(--texto-secundario);
  border-color: var(--borde); cursor: not-allowed; }
.cg-in[readonly] { background-color: var(--fondo-encabezado); border-color: var(--borde); }
.cg-mal { border-color: var(--error-acento); border-width: 2px; }
.cg-ayuda { font-size: 12px; color: var(--texto-pista); }
.cg-error { font-size: 12px; color: var(--error-texto); font-weight: 500;
  display: flex; align-items: center; gap: 4px; }
.cg-error .ic { width: 14px; height: 14px; flex: none; }
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
.enl-ext::after { content: ' ↗'; font-size: 11px; }
.enl-comp { display: grid; grid-template-columns: repeat(auto-fit,minmax(270px,1fr)); gap: 12px; }
.enl-caja { position: relative; padding: 16px 16px 30px; border-radius: 6px;
  border: 1px solid var(--borde); }
.enl-caja.bien { background: var(--exito-fondo); border-color: var(--exito-acento); }
.enl-caja.mal { background: var(--error-fondo); border-color: var(--error-acento); }
.enl-caja p { margin: 0; font-size: 14px; line-height: 1.6; }
.enl-caja.bien p { color: var(--exito-texto); }
.enl-caja.mal p { color: var(--error-texto); }
.enl-marco-caja { background: var(--marco-fondo); padding: 10px 14px; border-radius: 6px;
  display: inline-block; }
.enl-en-marco { color: var(--marco-acento); text-decoration: underline;
  text-underline-offset: 2px; font-size: 13px; }

/* Diálogos de ejemplo */
.dialogos { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 14px; }
.dlg { position: relative; border: 1px solid var(--borde); border-radius: 6px;
  background: var(--fondo-tarjeta); padding-bottom: 26px; }
.dlg-mal { border-color: var(--error-acento); }
.dlg-cuerpo { padding: 16px 16px 12px; }
.dlg-cuerpo strong { display: block; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.dlg-cuerpo p { margin: 0; font-size: 13px; color: var(--texto-secundario); }
.dlg-pie { display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 16px; border-top: 1px solid var(--borde); }
.dlg-et { position: absolute; bottom: 6px; left: 16px; font-size: 10px;
  font-weight: 600; text-transform: uppercase; letter-spacing: .07em; }
.dlg-ok { color: var(--exito-acento); }
.dlg-mal-et { color: var(--error-texto); }
.mf-et b { color: var(--texto-principal); font-weight: 600; }

.atajos { display: grid; grid-template-columns: repeat(auto-fit,minmax(230px,1fr)); gap: 10px; }
.atajo { display: flex; align-items: flex-start; gap: 11px; padding: 14px 16px;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; text-decoration: none; color: var(--texto-principal); }
.atajo:hover { border-color: var(--accion); }
.atajo-ic { color: var(--accion); display: grid; place-items: center; flex: none; margin-top: 1px; }
.atajo strong { display: block; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.atajo span span, .atajo > span:last-child { font-size: 12px; color: var(--texto-secundario); line-height: 1.45; }

.estado-rejilla { display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr));
  gap: 10px; margin-bottom: 18px; }
.est { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 14px 16px; }
.est b { display: block; font-size: 26px; font-weight: 600; line-height: 1.1; }
.est span { font-size: 11px; color: var(--texto-secundario); }
.est-ok b { color: var(--exito-acento); }

.iconos-rejilla { display: grid; grid-template-columns: repeat(auto-fill,minmax(104px,1fr)); gap: 8px; }
.ico-item { display: flex; flex-direction: column; align-items: center; gap: 7px;
  padding: 14px 6px; border: 1px solid var(--borde); border-radius: 6px; }
.ico-item span { font-size: 10px; color: var(--texto-secundario); }

.pendiente { text-align: center; padding: 56px 24px; background: var(--fondo-tarjeta);
  border: 1px dashed var(--borde-fuerte); border-radius: 6px; }
.pendiente-ic { color: var(--texto-pista); margin-bottom: 12px; }
.pendiente-ic .ic { width: 32px; height: 32px; }
.pendiente h3 { font-size: 19px; font-weight: 600; margin-bottom: 6px; }
.pendiente p { font-size: 14px; color: var(--texto-secundario); margin: 0 0 6px; }
.pendiente-nota { font-size: 12px !important; color: var(--texto-pista) !important; max-width: 46ch; margin: 10px auto 0 !important; }

/* Ver código */
.cod-bloque { border: 1px solid var(--borde); border-radius: 6px;
  background: var(--fondo-tarjeta); overflow: hidden; }
.cod-cab { display: flex; align-items: center; gap: 12px; padding: 8px 12px;
  background: var(--fondo-encabezado); }
.cod-ver { display: inline-flex; align-items: center; gap: 6px; font: inherit;
  font-size: 13px; font-weight: 500; cursor: pointer; background: transparent;
  border: 0; color: var(--accion); padding: 4px 4px; border-radius: 4px; }
.cod-ver .ic { width: 15px; height: 15px; transition: transform .15s; }
.cod-ver.abierto .ic { transform: rotate(180deg); }
.cod-tit { flex: 1; font-size: 12px; color: var(--texto-secundario); }
.cod-pre { margin: 0; padding: 16px; font-family: 'IBM Plex Mono', monospace;
  font-size: 13px; line-height: 1.65; overflow-x: auto;
  border-top: 1px solid var(--borde); }
.copiar { font: inherit; font-size: 12px; font-weight: 500; cursor: pointer;
  padding: 5px 12px; border-radius: 5px; border: 1px solid var(--borde-campo);
  background: var(--fondo-tarjeta); color: var(--texto-principal); }
.copiar:hover { border-color: var(--accion); color: var(--accion); }

/* Manual */
.manual { max-width: 88ch; }
.man-h2 { font-size: 21px; font-weight: 600; margin: 28px 0 10px; }
.man-h3 { font-size: 17px; font-weight: 600; margin: 24px 0 8px; }
.man-h4 { font-size: 14px; font-weight: 600; margin: 18px 0 6px; }
.man-p { font-size: 15px; line-height: 1.65; margin: 0 0 14px; }
.man-lista { font-size: 15px; line-height: 1.65; margin: 0 0 14px; padding-left: 22px; }
.man-lista li { margin-bottom: 5px; }
.man-cita { margin: 0 0 16px; padding: 12px 16px; background: var(--info-fondo);
  color: var(--info-texto); border-left: 3px solid var(--info-acento); border-radius: 4px;
  font-size: 14px; }
.man-hr { border: 0; border-top: 1px solid var(--borde); margin: 26px 0; }
.tabla-manual { width: 100%; border-collapse: collapse; font-size: 14px;
  margin: 0 0 18px; background: var(--fondo-tarjeta);
  border: 1px solid var(--borde); border-radius: 6px; }
.tabla-manual th { background: var(--fondo-encabezado); text-align: left;
  padding: 9px 12px; font-weight: 500; font-size: 13px; }
.tabla-manual td { padding: 9px 12px; border-top: 1px solid var(--borde);
  vertical-align: top; line-height: 1.5; }
.manual code { background: var(--fondo-encabezado); padding: 1px 5px;
  border-radius: 3px; font-size: 13px; }

@media (max-width: 900px) {
  .catalogo { flex-direction: column; }
  .cat-nav { width: 100%; position: static; max-height: none;
    border-right: 0; border-bottom: 1px solid var(--borde); }
  .cat-cuerpo { padding: 20px 16px 60px; }
}

h2.seccion {
  font-size: 22px; font-weight: 600; margin: 44px 0 6px;
  padding-bottom: 8px; border-bottom: 2px solid var(--borde);
}
.seccion-sub { color: var(--texto-secundario); font-size: 14px; margin: 0 0 20px; }

/* Muestras */
.grupo { margin-bottom: 26px; }
.grupo h3 { font-size: 13px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .07em; color: var(--texto-secundario); margin-bottom: 10px; }
.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: 10px; }
.muestra { display: flex; gap: 10px; align-items: center;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; padding: 8px; }
.muestra-color { width: 46px; height: 46px; border-radius: 4px; flex: none;
  border: 1px solid var(--borde-fuerte); }
.muestra-txt { min-width: 0; }
.muestra-nombre { display: block; font-size: 12px; font-weight: 500; }
.muestra-hex { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 11px;
  color: var(--texto-secundario); }
.muestra-uso { display: block; font-size: 11px; color: var(--texto-pista);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Escalas */
.escala { margin-bottom: 14px; }
.escala-nombre { font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--texto-secundario); margin-bottom: 6px; }
.escala-tiras { display: flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--borde); }
.tira { flex: 1; padding: 14px 6px 10px; font-size: 11px; text-align: center;
  font-family: 'IBM Plex Mono', monospace; display: flex; flex-direction: column; gap: 3px; }
.tira-hex { font-size: 9px; opacity: .75; }

/* Marca */
.marca-rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px,1fr)); gap: 12px; }
.marca-item { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; overflow: hidden; }
.marca-tapa { height: 62px; }
.marca-cuerpo { padding: 10px 12px; }
.marca-cuerpo code { font-size: 12px; font-weight: 500; }
.marca-cuerpo p { margin: 4px 0 0; font-size: 11px; color: var(--texto-secundario); }
.marca-prohibido { margin-top: 6px; font-size: 11px; color: var(--error-texto);
  background: var(--error-fondo); border-left: 3px solid var(--error-acento);
  padding: 5px 8px; border-radius: 3px; }

/* Maquetas */
.maquetas { display: grid; gap: 28px; }
.maqueta-tit { font-size: 13px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .07em; color: var(--texto-secundario); margin-bottom: 8px; }
.lienzo { border: 1px solid var(--borde-fuerte); border-radius: 8px; overflow: hidden;
  background: var(--fondo-pagina); }

/* Botones compartidos */
.btn { font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  padding: 8px 15px; border-radius: 6px; border: 1px solid transparent; }
.btn-1 { background: var(--accion); color: var(--accion-texto); }
.btn-1:hover { background: var(--accion-hover); }
/* Secundaria y neutra son TONALES: relleno suave + borde. El relleno no llega
   a 3:1 contra la tarjeta y no tiene por qué: quien identifica el control es
   el borde (SC 1.4.11). Por eso el borde no se quita. */
.btn-2, .btn-oro { background: var(--accion-2-fondo); color: var(--accion-2); border-color: var(--accion-2); }
.btn-2:hover, .btn-oro:hover { background: var(--marco-acento); }
.btn-neutro { background: var(--neutra-fondo); color: var(--neutra-texto); border-color: var(--borde-campo); }
.btn-neutro:hover { background: var(--borde); }
/* Terciaria: ni relleno ni borde. Cancelar es retroceder, y retroceder no debe
   competir con la acción de la pantalla. */
.btn-terc { background: transparent; color: var(--texto-principal); border-color: transparent; }
.btn-terc:hover { background: var(--fondo-encabezado); }
.btn-destr { background: var(--destructiva); color: var(--destructiva-texto); }
.btn-destr:hover { background: var(--destructiva-hover); }
.btn-mini { font-size: 12px; padding: 5px 12px; }
.enlace { color: var(--enlace); text-decoration: none; font-size: 13px; }
.enlace:hover { text-decoration: underline; }
.mono { font-family: 'IBM Plex Mono', monospace; }
.apagado { color: var(--texto-secundario); }
.deuda { color: var(--error-texto); font-weight: 500; }

.campo { font: inherit; font-size: 13px; padding: 7px 10px; border-radius: 6px;
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
  padding-right: 34px;
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px 16px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236A6864' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
}
[data-tema='oscuro'] select.campo {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C3C1BD' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
}
select.campo:disabled { opacity: .75; }

.chip { display: inline-block; font-size: 11px; font-weight: 500;
  padding: 3px 9px; border-radius: 3px; border-left: 3px solid; }
.chip-exito { background: var(--exito-fondo); color: var(--exito-texto); border-color: var(--exito-acento); }
.chip-aviso { background: var(--aviso-fondo); color: var(--aviso-texto); border-color: var(--aviso-acento); }
.chip-error { background: var(--error-fondo); color: var(--error-texto); border-color: var(--error-acento); }

/* Escudo pendiente */
.escudo-falta { color: var(--texto-pista); flex: none; display: grid; place-items: center; }

/* ── Maqueta WEB ─────────────────────────────────────────────────────────── */
.lienzo-web { background: var(--fondo-tarjeta); }
.w-barra { display: flex; align-items: center; gap: 22px; padding: 12px 22px;
  background: var(--fondo-tarjeta); border-bottom: 1px solid var(--borde); }
.w-marca { display: flex; align-items: center; gap: 9px; }
.w-colegio { font-size: 9px; font-weight: 500; letter-spacing: .13em; color: var(--texto-secundario); }
.w-nombre { font-size: 15px; font-weight: 700; color: var(--marca-rojo); letter-spacing: .01em; }
.w-nav { display: flex; gap: 18px; flex: 1; font-size: 12px; }
.w-nav span { color: var(--texto-secundario); padding-bottom: 3px; }
.w-nav .activo { color: var(--texto-principal); font-weight: 500; border-bottom: 3px solid var(--marca-oro); }
.w-acciones { display: flex; gap: 8px; }

.w-hero { display: grid; grid-template-columns: 1.35fr 1fr; }
.w-hero-txt { padding: 44px 40px; }
.w-hero-txt h1 { font-size: 40px; line-height: 1.05; font-weight: 700; }
.w-hero-txt h1 em { font-style: normal; color: var(--marca-rojo); }
.w-filete { width: 74px; height: 5px; background: var(--marca-oro); margin: 16px 0 14px; }
.w-hero-txt p { font-size: 14px; color: var(--texto-secundario); max-width: 42ch; margin: 0 0 20px; }
.w-hero-acciones { display: flex; gap: 9px; }
.w-panel { background: var(--marca-rojo-panel); display: grid; place-items: center; color: #fff; }

.w-datos { display: flex; background: var(--fondo-pagina); border-top: 1px solid var(--borde); }
.w-datos > div { flex: 1; padding: 18px 12px; text-align: center; border-right: 1px solid var(--borde); }
.w-datos > div:last-child { border-right: 0; }
.w-datos strong { display: block; font-size: 21px; font-weight: 700; color: var(--marca-rojo); }
.w-datos span { font-size: 10px; color: var(--texto-secundario); }

/* ── Maqueta SISTEMA — lateral plegable + barra de filtros globales ──────── */
.app { display: flex; min-height: 520px; }

/* En un ítem flexible manda flex-basis, no width. Y min-width:0 desactiva el
   mínimo automático, que si no impide encoger por debajo del contenido. */
.lat { flex: 0 0 236px; min-width: 0; overflow: hidden;
  background: var(--marco-fondo); color: var(--marco-texto);
  display: flex; flex-direction: column; }
.lat.colapsado { flex: 0 0 56px; }
.lat.colapsado .nav-txt, .lat.colapsado .nav-chev,
.lat.colapsado .lat-id, .lat.colapsado .lat-user-txt { display: none; }
.lat.colapsado .lat-marca, .lat.colapsado .lat-usuario { justify-content: center; }
.lat.colapsado .nav-item { justify-content: center; padding-inline: 0; }

.lat-marca { display: flex; align-items: center; gap: 9px; padding: 13px 12px;
  border-bottom: 1px solid rgba(255,255,255,.10); }
.lat-id { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
.lat-colegio { font-size: 8px; letter-spacing: .13em; color: var(--marco-acento); font-weight: 500; }
.lat-nombre { font-size: 12px; font-weight: 600; white-space: nowrap; }

.lat-nav { flex: 1; padding: 8px 8px; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border-radius: 5px; color: var(--marco-texto); text-decoration: none;
  font-size: 13px; opacity: .84; white-space: nowrap; }
.nav-item:hover { background: rgba(255,255,255,.07); opacity: 1; }
.nav-item.activo { background: var(--marco-item-activo); opacity: 1;
  color: var(--marco-acento); font-weight: 500;
  box-shadow: inset 3px 0 0 var(--marco-acento); }
.nav-ic { display: grid; place-items: center; flex: none; }
.nav-txt { flex: 1; }
.nav-chev { opacity: .5; display: grid; place-items: center; }
.nav-chev .ic { width: 14px; height: 14px; }

.lat-usuario { display: flex; align-items: center; gap: 9px; padding: 11px 12px;
  border-top: 1px solid rgba(255,255,255,.10); }
.lat-av { width: 30px; height: 30px; border-radius: 50%; flex: none;
  background: var(--marco-acento); color: var(--marco-fondo);
  display: grid; place-items: center; font-size: 11px; font-weight: 600; }
.lat-user-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.lat-user-nom { font-size: 11px; font-weight: 500; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }
.lat-user-mail { font-size: 10px; opacity: .62; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }

.app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

.top { display: flex; align-items: center; gap: 14px; padding: 9px 16px;
  background: var(--fondo-tarjeta); border-bottom: 1px solid var(--borde); }
.top-plegar { background: transparent; border: 0; cursor: pointer; padding: 5px;
  border-radius: 5px; color: var(--texto-secundario); display: grid; place-items: center; }
.top-plegar:hover { background: var(--fondo-encabezado); color: var(--texto-principal); }
.top-filtros { display: flex; gap: 9px; flex: 1; }
.filtro { display: flex; flex-direction: column; gap: 2px; }
.filtro-et { font-size: 10px; font-weight: 500; color: var(--texto-secundario); }
.filtro .campo { font-size: 13px; padding: 5px 9px; min-width: 118px; }
.top-acciones { display: flex; align-items: center; gap: 5px; }
.top-btn { background: transparent; border: 0; cursor: pointer; padding: 7px;
  border-radius: 6px; color: var(--texto-secundario); position: relative;
  display: grid; place-items: center; }
.top-btn:hover { background: var(--fondo-encabezado); color: var(--texto-principal); }
.badge { position: absolute; top: 1px; right: 1px; min-width: 15px; height: 15px;
  border-radius: 8px; background: var(--error-acento); color: #fff;
  font-size: 9px; font-weight: 600; display: grid; place-items: center; padding: 0 3px; }
.top-avatar { width: 30px; height: 30px; border-radius: 50%; margin-left: 5px;
  background: var(--accion); color: var(--accion-texto);
  display: grid; place-items: center; font-size: 11px; font-weight: 600; }

.s-cuerpo { padding: 20px; background: var(--fondo-pagina); }
.s-cabecera { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.s-cabecera h2 { font-size: 26px; font-weight: 600; }
.s-cabecera p { margin: 2px 0 0; font-size: 11px; color: var(--texto-secundario); }

.s-tarjeta { background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; }
.s-filtros { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--borde); }
.s-filtros-der { margin-left: auto; display: flex; gap: 8px; }

.s-tabla { width: 100%; border-collapse: collapse; font-size: 14px; }
.s-tabla th { background: var(--fondo-encabezado); text-align: left; font-weight: 500;
  font-size: 14px; padding: 9px 12px; color: var(--texto-principal); }
.s-tabla td { padding: 0 12px; height: 34px; border-top: 1px solid var(--borde); }
.s-tabla tbody tr.hover { background: var(--fondo-fila-hover); }

.s-paginacion { display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-top: 1px solid var(--borde); font-size: 12px; color: var(--texto-secundario); }
.s-pag-btns { display: flex; gap: 4px; }
.pag { min-width: 26px; height: 26px; display: grid; place-items: center; border-radius: 4px;
  font-size: 12px; border: 1px solid var(--borde); }
.pag.activa { background: var(--accion); color: var(--accion-texto); border-color: var(--accion); }

/* ── Maqueta MÓVIL ───────────────────────────────────────────────────────── */
.lienzo-movil { max-width: 375px; position: relative; }
.m-marco { background: var(--marco-fondo); color: var(--marco-texto); }
.m-marco-fila1 { display: flex; align-items: center; gap: 8px; padding: 9px 12px; }
.m-nombre { font-size: 12px; font-weight: 600; flex: 1; }
.m-avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--marco-acento);
  color: var(--marco-fondo); display: grid; place-items: center; font-size: 10px; font-weight: 600; }
.m-marco-fila2 { display: flex; gap: 16px; padding: 0 12px; font-size: 12px; }
.m-marco-fila2 span { padding: 6px 0 8px; opacity: .85; }
.m-marco-fila2 .activo { opacity: 1; color: var(--marco-acento); font-weight: 500;
  border-bottom: 4px solid var(--marco-acento); }
.m-hamb { background: transparent; border: 0; cursor: pointer; padding: 3px;
  color: var(--marco-texto); display: grid; place-items: center; }
.m-filtros-movil { display: flex; gap: 8px; margin-bottom: 12px; }
.m-filtros-movil .campo { flex: 1; min-width: 0; font-size: 14px; }
.m-cuerpo { padding: 14px; background: var(--fondo-pagina); }
.m-cabecera h3 { font-size: 21px; font-weight: 600; }
.m-cabecera p { margin: 2px 0 12px; font-size: 11px; color: var(--texto-secundario); }
.m-cuerpo .campo { width: 100%; margin-bottom: 12px; font-size: 16px; }
.m-tarjeta { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 11px 12px; margin-bottom: 9px; }
.m-nom { font-size: 15px; font-weight: 500; }
.m-meta { font-size: 12px; color: var(--texto-secundario); margin-top: 1px; }
.m-linea { height: 1px; background: var(--borde); margin: 9px 0; }
.m-pie { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
.m-tarjeta .enlace { display: inline-block; margin-top: 9px; }
.m-flotante { position: absolute; right: 16px; bottom: 16px; width: 56px; height: 56px;
  border-radius: 50%; border: 0; cursor: pointer; font-size: 26px;
  background: var(--accion); color: var(--accion-texto);
  box-shadow: 0 4px 14px rgba(0,0,0,.28); }

/* ── Tipografía ──────────────────────────────────────────────────────────── */
.tipo-nota { background: var(--exito-fondo); color: var(--exito-texto);
  border-left: 3px solid var(--exito-acento); padding: 12px 15px;
  border-radius: 4px; font-size: 13px; margin-bottom: 20px; }
.tipo-nota code { background: rgba(0,0,0,.07); padding: 1px 4px; border-radius: 3px; }

.tabla-escala { width: 100%; border-collapse: collapse; font-size: 13px;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; }
.tabla-escala th { background: var(--fondo-encabezado); text-align: left;
  padding: 8px 12px; font-weight: 500; font-size: 12px; }
.tabla-escala td { padding: 10px 12px; border-top: 1px solid var(--borde); vertical-align: middle; }
.tabla-escala .num { font-family: 'IBM Plex Mono', monospace; text-align: right; }
.esc-muestra { width: 45%; overflow: hidden; }
.esc-muestra span { display: block; }

.pesos { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 8px; }
.peso { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 11px 13px; display: flex; flex-direction: column; gap: 2px; }
.peso-mal { background: var(--error-fondo); border-color: var(--error-acento); }
.peso-muestra { font-size: 19px; }
.peso-mal .peso-muestra { color: var(--error-texto); }
.peso-meta { font-size: 11px; color: var(--texto-secundario); }
.peso-mal .peso-meta, .peso-mal .peso-uso { color: var(--error-texto); }
.peso-uso { font-size: 11px; color: var(--texto-pista); }

.mono-comp { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
.mono-caja { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 13px; }
.mono-et { font-size: 11px; color: var(--texto-secundario); margin-bottom: 8px; }
.mono-lista { font-size: 18px; line-height: 1.6; }
.mono-lista.sans { font-family: 'IBM Plex Sans', sans-serif; }
.mono-lista.mono { font-family: 'IBM Plex Mono', monospace; }

.anchos { display: grid; gap: 11px; }
.ancho-caja { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 13px; }
.ancho-et { font-size: 11px; color: var(--texto-secundario); display: block; margin-bottom: 5px; }
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
.op-cab strong { display: block; font-size: 14px; }
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

.rejilla-vis { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 16px; }
.rej { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.rej-barra { height: 24px; background: var(--accion); border-radius: 2px; }
.rej span { font-size: 10px; font-family: 'IBM Plex Mono', monospace; color: var(--texto-secundario); }

/* Tabla de contrastes */
.tabla-contraste { width: 100%; border-collapse: collapse; font-size: 12px;
  background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; }
.tabla-contraste th { background: var(--fondo-encabezado); text-align: left;
  padding: 8px 10px; font-weight: 500; font-size: 12px; }
.tabla-contraste td { padding: 6px 10px; border-top: 1px solid var(--borde); }
.tabla-contraste .num { font-family: 'IBM Plex Mono', monospace; text-align: right; }
.tabla-contraste .ok { color: var(--exito-texto); font-weight: 500; }
.tabla-contraste .mal { color: var(--error-texto); font-weight: 600; }
.tabla-contraste .motivo { color: var(--texto-secundario); }

/* ── Casos de uso ────────────────────────────────────────────────────────── */
.sub-seccion { font-size: 17px; font-weight: 600; margin: 40px 0 4px; }
.casos { display: grid; gap: 16px; }
.caso { background: var(--fondo-tarjeta); border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
.caso-cab { padding: 13px 16px; border-bottom: 1px solid var(--borde); background: var(--fondo-encabezado); }
.caso-cab h4 { font-size: 14px; font-weight: 600; }
.caso-cab p { margin: 3px 0 0; font-size: 12px; color: var(--texto-secundario); }
.caso-cab code { background: var(--fondo-tarjeta); padding: 1px 4px; border-radius: 3px; font-size: 11px; }
.caso-lienzo { padding: 18px 16px; }
.caso-tokens { margin-top: 14px; padding-top: 11px; border-top: 1px dashed var(--borde);
  font-size: 11px; color: var(--texto-secundario); }
.caso-tokens code { background: var(--fondo-encabezado); padding: 2px 6px;
  border-radius: 3px; margin-right: 4px; font-size: 11px; }
.fila-demo { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.mensajes { display: grid; gap: 7px; margin-top: 14px; }
.msj { font-size: 13px; padding: 9px 13px; border-radius: 4px; border-left: 3px solid; }
.msj-exito { background: var(--exito-fondo); color: var(--exito-texto); border-color: var(--exito-acento); }
.msj-aviso { background: var(--aviso-fondo); color: var(--aviso-texto); border-color: var(--aviso-acento); }
.msj-error { background: var(--error-fondo); color: var(--error-texto); border-color: var(--error-acento); }
.msj-info  { background: var(--info-fondo);  color: var(--info-texto);  border-color: var(--info-acento); }
.chip-info { background: var(--info-fondo); color: var(--info-texto); border-color: var(--info-acento); }

.campos-demo { align-items: flex-start; }
.campo-grupo { display: flex; flex-direction: column; gap: 4px; }
.campo-etiqueta { font-size: 13px; font-weight: 500; }
.campo-ayuda { font-size: 12px; color: var(--texto-pista); }
.campo-error { font-size: 12px; color: var(--error-texto); font-weight: 500; }
.campo-mal { border-color: var(--error-acento); border-width: 2px; }

.foco-demo { outline: 2px solid var(--foco); outline-offset: 2px; }
.foco-marco { background: var(--marco-fondo); padding: 12px 14px; border-radius: 6px; display: inline-block; }
.btn-marco { background: transparent; color: var(--marco-texto); border-color: var(--marco-acento); }
.foco-demo-marco { outline: 2px solid var(--foco-en-marco); outline-offset: 2px; }

.demo-tabla { border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; }
.demo-tabla td { height: 34px; }

.estados-demo { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px,1fr)); gap: 11px; }
.estado-caja { border: 1px dashed var(--borde-fuerte); border-radius: 6px; padding: 15px;
  min-height: 116px; display: flex; flex-direction: column; gap: 8px; position: relative; }
.estado-caja.centrado { align-items: center; justify-content: center; text-align: center; }
.estado-txt { font-size: 13px; color: var(--texto-secundario); margin: 0; }
.estado-txt em { font-style: normal; font-weight: 600; color: var(--texto-principal); }
.estado-et { position: absolute; top: -9px; left: 11px; background: var(--fondo-tarjeta);
  padding: 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: .07em;
  color: var(--texto-pista); font-weight: 500; }
.esqueleto { height: 11px; border-radius: 3px; background: var(--fondo-encabezado); }
.esqueleto.corto { width: 62%; }

/* Usos incorrectos */
.mal-rejilla { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px,1fr)); gap: 13px; }
.mal-par { display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  border: 1px solid var(--borde); border-radius: 6px; overflow: hidden; background: var(--fondo-tarjeta); }
.mal-caja { padding: 16px 14px 30px; position: relative; display: flex;
  align-items: center; justify-content: center; min-height: 92px; }
.mal-caja.mal { background: var(--error-fondo); }
.mal-caja.bien { background: var(--exito-fondo); border-left: 1px solid var(--borde); }
.mal-et, .bien-et { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center;
  font-size: 10px; padding: 0 8px; }
.mal-et { color: var(--error-texto); font-weight: 500; }
.bien-et { color: var(--exito-texto); font-weight: 500; }
.mal-et code, .bien-et code { font-size: 10px; }
.emoji-demo { font-size: 19px; letter-spacing: 5px; }
.iconos-demo { display: flex; gap: 11px; color: var(--exito-texto); }
.filas-boton { display: flex; gap: 5px; }
.filas-boton.col { flex-direction: column; gap: 7px; align-items: center; }
.btn.mini { font-size: 11px; padding: 4px 9px; }
.sin-foco { outline: none; }

.aviso { background: var(--info-fondo); color: var(--info-texto);
  border-left: 3px solid var(--info-acento); padding: 12px 15px;
  border-radius: 4px; font-size: 13px; margin: 16px 0; }
.aviso strong { font-weight: 600; }

@media (max-width: 820px) {
  .w-hero { grid-template-columns: 1fr; }
  .w-panel { padding: 26px 0; }
}
</style>
</head>
<body>

<div class="app app-cascaron">

  <aside class="lat" id="lateral">
    <div class="lat-marca">
      ${escudo(30)}
      <div class="lat-id"><span class="lat-colegio">COLEGIO</span><span class="lat-nombre">ALBERT EINSTEIN</span></div>
    </div>
    <nav class="lat-nav">${menuCatalogo}</nav>
    <div class="lat-usuario">
      <span class="lat-av">JP</span>
      <div class="lat-user-txt">
        <span class="lat-user-nom">JOSE ISIDRO PINEDA</span>
        <span class="lat-user-mail">jose.pineda@ae.edu.pe</span>
      </div>
    </div>
  </aside>

  <div class="app-main">
    <div class="top top-cascaron">
      <button class="top-plegar" id="plegar-cat" aria-label="Plegar menú">${ICONOS.panelIzq}</button>
      <div class="top-filtros">
        <label class="filtro"><span class="filtro-et">Sistema</span>
          <select class="campo"><option>Colegio Albert Einstein</option></select></label>
        <label class="filtro"><span class="filtro-et">Versión</span>
          <select class="campo"><option>v${VERSION}</option></select></label>
        <label class="filtro"><span class="filtro-et">Fase</span>
          <select class="campo"><option>2 · Tipografía</option></select></label>
      </div>
      <div class="top-acciones">
        <div class="conmutador" role="group" aria-label="Modo de color">
          <button id="b-claro" aria-pressed="true">Claro</button>
          <button id="b-oscuro" aria-pressed="false">Oscuro</button>
        </div>
        <button class="top-btn" aria-label="Mensajes">${ICONOS.sobre}</button>
        <button class="top-btn" aria-label="Notificaciones">${ICONOS.campana}<span class="badge">1</span></button>
        <span class="top-avatar">JP</span>
      </div>
    </div>
    <main class="cat-cuerpo">${paginasCatalogo}</main>
  </div>
</div>

<script>
(function () {
  var raiz = document.documentElement;
  var bClaro = document.getElementById('b-claro');
  var bOscuro = document.getElementById('b-oscuro');

  var hex = ${JSON.stringify(
    Object.fromEntries(Object.entries(semanticos).map(([k, v]) => [k, { claro: v.claro, oscuro: v.oscuro }]))
  )};

  function aplicar(modo) {
    raiz.setAttribute('data-tema', modo);
    bClaro.setAttribute('aria-pressed', String(modo === 'claro'));
    bOscuro.setAttribute('aria-pressed', String(modo === 'oscuro'));
    // El hex mostrado bajo cada muestra sigue al modo.
    document.querySelectorAll('[data-hex-de]').forEach(function (el) {
      var t = hex[el.getAttribute('data-hex-de')];
      if (t) el.textContent = t[modo];
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
  var enlaces = document.querySelectorAll('.nav-hijo');

  // Chevron de grupo: despliega y pliega, como en la aplicación.
  document.querySelectorAll('[data-desplegar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.closest('.nav-grupo');
      var cerrado = g.hasAttribute('data-cerrado');
      if (cerrado) g.removeAttribute('data-cerrado');
      else g.setAttribute('data-cerrado', '');
      b.setAttribute('aria-expanded', String(cerrado));
    });
  });

  // Plegado de la lateral del cascarón. Tiene su propio manejador y el
  // genérico de las maquetas lo salta: si los dos actúan sobre el mismo botón
  // se anulan entre sí, y el ancho queda un clic por detrás de la clase.
  document.getElementById('plegar-cat').addEventListener('click', function () {
    document.getElementById('lateral').classList.toggle('colapsado');
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
      // Si el elegido está en un grupo plegado, se despliega solo.
      if (act) a.closest('.nav-grupo').removeAttribute('data-cerrado');
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

      // Paginación
      var pag = document.getElementById('tb-pag');
      if (paginas <= 1) { pag.innerHTML = ''; }
      else {
        var botones = [];
        botones.push('<button class="tb-p" data-pag="' + (cfg.pag - 1) + '"' + (cfg.pag === 1 ? ' disabled' : '') + '>‹</button>');
        for (var p = 1; p <= paginas; p++) {
          if (p === 1 || p === paginas || Math.abs(p - cfg.pag) <= 1) {
            botones.push('<button class="tb-p' + (p === cfg.pag ? ' activa' : '') + '" data-pag="' + p + '">' + p + '</button>');
          } else if (Math.abs(p - cfg.pag) === 2) botones.push('<span class="tb-elip">…</span>');
        }
        botones.push('<button class="tb-p" data-pag="' + (cfg.pag + 1) + '"' + (cfg.pag === paginas ? ' disabled' : '') + '>›</button>');
        pag.innerHTML = botones.join('');
      }
      selTam.value = String(cfg.tam);
    }

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

    document.getElementById('tb-pag').addEventListener('click', function (e) {
      var b = e.target.closest('.tb-p'); if (!b || b.disabled) return;
      cfg.pag = Number(b.dataset.pag); pintar();
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
})();
</script>
</body>
</html>
`;

mkdirSync(SALIDA, { recursive: true });
writeFileSync(join(SALIDA, 'index.html'), html);

const kb = (html.length / 1024).toFixed(0);
console.log(`\n  cascaron/index.html  ${kb} KB, autocontenido`);
console.log(`  ${Object.keys(semanticos).length} semánticos · ${Object.keys(primitivas).length} escalas · 3 maquetas · 2 modos\n`);
