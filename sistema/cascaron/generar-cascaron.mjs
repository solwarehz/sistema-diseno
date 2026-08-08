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
  <strong>Verificado en esta página:</strong> los diez dígitos de IBM Plex Sans miden
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

<div class="aviso" style="margin-top:22px">
  <strong>Pendiente de decisión tuya:</strong> hoy el cascarón carga IBM Plex desde
  Google Fonts. Para producción hay que <strong>descargar los seis cortes y servirlos
  desde el proyecto</strong> — son unos 600 KB dentro de la carpeta. Gana en privacidad
  (Google deja de ver quién abre tu sistema) y en velocidad. Necesito que lo autorices
  porque implica descargar archivos.
</div>`;

// ── Espaciado — a decidir ───────────────────────────────────────────────────

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
  <strong>Cambio de método que propongo.</strong> No declarar padding vertical en los
  controles. Se fija la <strong>altura</strong> desde la rejilla y el texto se centra.
  El padding solo gobierna el horizontal.
  <br><br>
  Por qué: con padding vertical, la altura del botón depende de la interlínea de la
  fuente. 13px a 1.4 da caja de 18px; con 8+8 y borde salen <strong>36px</strong>, y no
  hay ningún múltiplo de 4 que dé 32px por esa vía —haría falta 6px de padding, que
  se sale de la rejilla. Fijando la altura, 28 · 32 · 40 · 48 salen exactos y todos
  los controles de una fila casan solos.
</div>

<h3 class="sub-seccion">Compara y elige</h3>
<p class="seccion-sub">Cada opción con botones, campo y selector, y debajo la tabla real para ver si pesan o no al lado de las filas.</p>
<div class="opciones">${opciones}</div>

<h3 class="sub-seccion">La rejilla de 4</h3>
<div class="rejilla-vis">
  ${[4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64].map((n) => `<div class="rej"><div class="rej-barra" style="width:${n}px"></div><span>${n}</span></div>`).join('')}
</div>

<h3 class="sub-seccion">Tres valores del sistema se salen de la rejilla</h3>
<p class="seccion-sub">Si adoptamos múltiplos de 4, estos hay que corregirlos. Los tres vienen del documento.</p>
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

<h3 class="sub-seccion">Tamaño — pendiente de decisión</h3>
<p class="seccion-sub">Es lo que estamos decidiendo. Está en <a href="#" data-ir="espaciado" class="enlace">Fundamentos → Espaciado</a>.</p>`;

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
  <strong>Medido en este sistema:</strong> <code>enlace</code> contra <code>texto-principal</code>
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

// ── Elementos aún no construidos ────────────────────────────────────────────

const pendiente = (nombre, fase) => `
<div class="pendiente">
  <div class="pendiente-ic">${ICONOS.configuracion}</div>
  <h3>${nombre}</h3>
  <p>Todavía no está construido. Entra en la <strong>${fase}</strong>.</p>
  <p class="pendiente-nota">El menú lo lista para que se vea el alcance completo del sistema,
  no para fingir que existe.</p>
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

<div class="aviso">
  <strong>Fase 1 aprobada</strong> — color, esquema y casos de uso.
  <strong>Fase 2 en curso</strong> — tipografía lista; falta que decidas el
  <a href="#" data-ir="espaciado" class="enlace">tamaño de los botones</a>.
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
    <span><strong>Espaciado</strong>Las cinco opciones de tamaño, a decidir</span></a>
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
      { id: 'espaciado', t: 'Espaciado', estado: 'decidir', c: espaciado },
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
      { id: 'selector', t: 'Selector', estado: 'pendiente', c: pendiente('Selector con búsqueda', 'fase 4') },
      { id: 'chip', t: 'Chip de estado', estado: 'pendiente', c: pendiente('Chip de estado', 'fase 4') },
      { id: 'tarjeta', t: 'Tarjeta', estado: 'pendiente', c: pendiente('Tarjeta', 'fase 4') },
      { id: 'tabla', t: 'Tabla de datos', estado: 'pendiente', c: pendiente('Tabla de datos', 'fase 5') },
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

const PUNTO = { listo: '', decidir: '<span class="pt pt-decidir" title="Esperando tu decisión"></span>', pendiente: '<span class="pt pt-pend" title="Sin construir"></span>' };

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
      <div class="pag-cab"><span class="pag-ruta">${g.grupo}</span><h2>${i.t}</h2></div>
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
.pag-cab { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid var(--borde); }
.pag-ruta { font-size: 11px; font-weight: 500; text-transform: uppercase;
  letter-spacing: .08em; color: var(--texto-secundario); }
.pag-cab h2 { font-size: 28px; font-weight: 600; margin-top: 3px; }
.pag-intro { font-size: 15px; color: var(--texto-secundario); max-width: 90ch; margin: 0 0 20px; }

.bloque { background: var(--fondo-tarjeta); border: 1px solid var(--borde);
  border-radius: 6px; padding: 20px; margin-bottom: 8px; }
.muestra-fila { display: flex; gap: 28px; flex-wrap: wrap; align-items: flex-start; }
.mf { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.mf-et { font-size: 11px; color: var(--texto-secundario); line-height: 1.45; }
.btn-ic { display: inline-flex; align-items: center; gap: 7px; }
.btn-solo-ic { padding-inline: 8px; }
.movil-btn-demo { max-width: 340px; display: flex; flex-direction: column; gap: 8px; }

/* Campo de texto */
.cg { display: flex; flex-direction: column; gap: 5px; }
.cg-et { font-size: 13px; font-weight: 500; color: var(--texto-principal); }
.cg-et-oculta { visibility: hidden; }
.cg-req { color: var(--error-texto); margin-left: 2px; font-weight: 600; }
.cg-in { width: 100%; }
.cg-in:disabled { background: var(--fondo-encabezado); color: var(--texto-secundario);
  border-color: var(--borde); cursor: not-allowed; }
.cg-in[readonly] { background: var(--fondo-encabezado); border-color: var(--borde); }
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
    <div class="lat-leyenda">
      <div><span class="pt pt-decidir"></span> esperando tu decisión</div>
      <div><span class="pt pt-pend"></span> sin construir</div>
    </div>
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
