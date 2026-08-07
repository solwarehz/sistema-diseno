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

// ── Página ──────────────────────────────────────────────────────────────────

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

/* Navegación de secciones */
.secnav { display: flex; gap: 4px; flex-wrap: wrap; padding: 16px 0 4px; }
.secnav a {
  font-size: 13px; font-weight: 500; text-decoration: none;
  color: var(--texto-secundario); padding: 6px 12px; border-radius: 4px;
  border: 1px solid var(--borde);
}
.secnav a:hover { color: var(--accion); border-color: var(--accion); }

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
.btn-2 { background: transparent; color: var(--accion-2); border-color: var(--accion-2); }
.btn-oro { background: transparent; color: var(--accion-2); border-color: var(--accion-2); }
.btn-neutro { background: transparent; color: var(--texto-principal); border-color: var(--borde-campo); }
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

.lat { width: 236px; flex: none; background: var(--marco-fondo); color: var(--marco-texto);
  display: flex; flex-direction: column; transition: width .18s ease; }
.lat.colapsado { width: 58px; }
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

<header class="cab">
  <h1>Sistema de diseño · Colegio Albert Einstein</h1>
  <span class="ver">v${VERSION} · cascarón</span>
  <span class="sep"></span>
  <div class="conmutador" role="group" aria-label="Modo de color">
    <button id="b-claro" aria-pressed="true">Claro</button>
    <button id="b-oscuro" aria-pressed="false">Oscuro</button>
  </div>
</header>

<div class="envoltorio">

<nav class="secnav">
  <a href="#maquetas">Maquetas</a>
  <a href="#casos">Casos de uso</a>
  <a href="#semanticos">Tokens semánticos</a>
  <a href="#primitivas">Primitivas</a>
  <a href="#marca">Marca</a>
  <a href="#contraste">Contrastes</a>
</nav>

<div class="aviso">
  <strong>Esto es un cascarón.</strong> Estructura y color para decidir la paleta.
  No son los componentes reales. Conmuta claro/oscuro arriba a la derecha:
  el modo oscuro está <strong>calculado pero sin aprobar</strong> — esta página existe
  para que lo apruebes o lo rechaces.
  El escudo aparece como marcador punteado porque <strong>el activo no existe</strong>
  (MMI-DS §10 y §8.6): no se recorta del lockup.
</div>

<h2 class="seccion" id="maquetas">Maquetas</h2>
<p class="seccion-sub">Los tres contextos. Landing y sistema comparten valores, no proporciones.</p>

<div class="maquetas">
  <div><div class="maqueta-tit">Web — landing</div>${maquetaWeb}</div>
  <div><div class="maqueta-tit">Sistema — escritorio, lateral desplegada</div>${maquetaSistema}</div>
  <div><div class="maqueta-tit">Sistema — lateral plegada, solo iconos</div>${maquetaColapsada}</div>
  <div><div class="maqueta-tit">App — móvil, 375px</div>${maquetaMovil}</div>
</div>

<h2 class="seccion" id="casos">Casos de uso</h2>
<p class="seccion-sub">Cada color en el sitio donde trabaja. Los roles que el documento describe, aquí se ven.</p>
${casosDeUso}

<h2 class="seccion" id="semanticos">Tokens semánticos</h2>
<p class="seccion-sub">${Object.keys(semanticos).length} tokens. Es lo único que un componente consume.</p>
${Object.entries(GRUPOS).map(grupoMuestras).join('')}

<h2 class="seccion" id="primitivas">Primitivas</h2>
<p class="seccion-sub">Las escalas completas. Existen para que los semánticos elijan. <strong>Prohibido usarlas en un componente.</strong></p>
${Object.entries(primitivas).map(([n, p]) => escala(n, p)).join('')}

<h2 class="seccion" id="marca">Marca — fuera del sistema</h2>
<p class="seccion-sub">Viven en el escudo, la landing y los impresos. No en la interfaz.</p>
<div class="marca-rejilla">
${Object.entries(marca)
  .map(
    ([k, v]) => `
  <div class="marca-item">
    <div class="marca-tapa" style="background: var(--${k})"></div>
    <div class="marca-cuerpo">
      <code>${k}</code>
      <p>${v.uso}</p>
      <div class="marca-prohibido">Prohibido en: ${v.prohibidoEn}</div>
    </div>
  </div>`
  )
  .join('')}
</div>

<h2 class="seccion" id="contraste">Contrastes verificados</h2>
<p class="seccion-sub">
  ${lock.resumen.paresBloqueantes} pares bloqueantes en los dos modos ·
  ${lock.resumen.fallos} fallos · ${lock.norma}
</p>

<h3 style="font-size:14px;margin:18px 0 8px">Modo claro</h3>
<table class="tabla-contraste">
  <thead><tr><th>Frente</th><th>Fondo</th><th class="num">Medido</th><th class="num">Mínimo</th><th>Estado</th><th>Motivo</th></tr></thead>
  <tbody>${filasContraste('claro')}</tbody>
</table>

<h3 style="font-size:14px;margin:26px 0 8px">Modo oscuro</h3>
<table class="tabla-contraste">
  <thead><tr><th>Frente</th><th>Fondo</th><th class="num">Medido</th><th class="num">Mínimo</th><th>Estado</th><th>Motivo</th></tr></thead>
  <tbody>${filasContraste('oscuro')}</tbody>
</table>

<h2 class="seccion">Correcciones aplicadas</h2>
<p class="seccion-sub">Sobre los valores del documento original. Cada una con su medición.</p>
<table class="tabla-contraste">
  <thead><tr><th>Token</th><th>Antes</th><th>Ahora</th><th>Medido</th><th>Norma</th><th>Razón</th></tr></thead>
  <tbody>
  ${correcciones
    .map(
      (c) => `<tr>
      <td><code>${c.token}</code></td>
      <td class="mono">${c.antes}</td>
      <td class="mono">${c.despues}</td>
      <td class="num">${c.medido}</td>
      <td>${c.criterio}</td>
      <td class="motivo">${c.razon}</td>
    </tr>`
    )
    .join('')}
  </tbody>
</table>

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

  // El botón de plegar es real: pliega la lateral de SU maqueta.
  document.querySelectorAll('.top-plegar').forEach(function (b) {
    b.addEventListener('click', function () {
      var lat = b.closest('.app').querySelector('.lat');
      lat.classList.toggle('colapsado');
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
