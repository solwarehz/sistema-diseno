/**
 * HORARIO
 *
 * Rejilla de día por hora. Es una TABLA de verdad, no una rejilla dibujada: con
 * `th scope` declarado, cada bloque se anuncia con su día y su franja. Una
 * rejilla de divs con posiciones absolutas se ve igual y no dice nada.
 *
 * Rotar NO reordena datos: intercambia los ejes de la misma tabla.
 */

export type BloqueHorario = {
  /** Índice del día dentro de `dias`. */
  dia: number;
  /** «07:30» */
  de: string;
  /** «08:15» */
  a: string;
  titulo: string;
  detalle?: string;
  tono?: 'info' | 'exito' | 'aviso' | 'error' | 'oro' | 'neutro';
};

export type HorarioProps = {
  titulo: string;
  dias: string[];
  /** «07:30» */
  inicio: string;
  /** «13:30» */
  fin: string;
  /** Minutos por franja. 30 para clases, 60 para turnos. */
  paso: number;
  bloques: BloqueHorario[];
  /** vertical = día en columna. horizontal = día en fila. */
  eje?: 'vertical' | 'horizontal';
  formato?: '24' | '12';
};

const aMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/** El formato es SOLO cómo se escribe: el dato es un minuto del día. */
export function escribirHora(min: number, formato: '24' | '12'): string {
  const h = Math.floor(min / 60);
  const mm = String(min % 60).padStart(2, '0');
  if (formato === '24') return `${String(h).padStart(2, '0')}:${mm}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  // Con espacio y con puntos: es la forma correcta en español.
  return `${h12}:${mm} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

export function Horario({
  titulo, dias, inicio, fin, paso, bloques, eje = 'vertical', formato = '24',
}: HorarioProps) {
  const ini = aMin(inicio);
  const n = Math.round((aMin(fin) - ini) / paso);

  // Qué bloque empieza en cada franja, y cuáles quedan tapadas por un span.
  const empieza: Record<number, Record<number, { b: BloqueHorario; largo: number }>> = {};
  const tapada: Record<number, Record<number, boolean>> = {};
  dias.forEach((_, d) => { empieza[d] = {}; tapada[d] = {}; });
  bloques.forEach((b) => {
    const i = Math.round((aMin(b.de) - ini) / paso);
    const largo = Math.round((aMin(b.a) - aMin(b.de)) / paso);
    // Un bloque desalineado o fuera de rango se descarta en vez de romper la
    // tabla en silencio.
    if (i < 0 || largo < 1 || i + largo > n || !empieza[b.dia]) return;
    empieza[b.dia][i] = { b, largo };
    for (let k = 1; k < largo; k++) tapada[b.dia][i + k] = true;
  });

  const vertical = eje === 'vertical';
  const filas = vertical ? n : dias.length;
  const cols = vertical ? dias.length : n;

  return (
    // tabindex para que el desplazamiento horizontal también se alcance con
    // teclado: un área que solo se mueve con el ratón deja fuera a quien no lo usa.
    <div className="hor-env" tabIndex={0} role="region" aria-label={titulo}>
      <table className="hor">
        <thead>
          <tr>
            <th className="hor-esq" scope="col">{vertical ? 'Hora' : 'Día'}</th>
            {vertical
              ? dias.map((d) => <th key={d} scope="col">{d}</th>)
              : Array.from({ length: n }, (_, c) => (
                  <th key={c} scope="col">{escribirHora(ini + c * paso, formato)}</th>
                ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: filas }, (_, f) => (
            <tr key={f}>
              <th scope="row" className={`hor-eje ${vertical ? 'hor-eje-v' : 'hor-eje-h'}`}>
                {vertical ? escribirHora(ini + f * paso, formato) : dias[f]}
              </th>
              {Array.from({ length: cols }, (_, g) => {
                const dia = vertical ? g : f;
                const ranura = vertical ? f : g;
                if (tapada[dia]?.[ranura]) return null;
                const e = empieza[dia]?.[ranura];
                if (!e) return <td key={g} className="hor-c hor-vacia" />;
                const rango = `${escribirHora(aMin(e.b.de), formato)} – ${escribirHora(aMin(e.b.a), formato)}`;
                return (
                  <td
                    key={g}
                    className="hor-c"
                    {...(vertical ? { rowSpan: e.largo } : { colSpan: e.largo })}
                  >
                    <span className={`hor-b hor-${e.b.tono ?? 'neutro'}`} title={`${dias[dia]}, ${rango}`}>
                      <b>{e.b.titulo}</b>
                      {e.b.detalle && <span>{e.b.detalle}</span>}
                      {/* El bloque SIEMPRE dice su franja en texto: deducirla de
                          la altura de la celda no es leerla. */}
                      <span className="hor-rango">{rango}</span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
