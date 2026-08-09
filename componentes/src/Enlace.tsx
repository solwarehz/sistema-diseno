/**
 * ENLACE
 *
 * En prosa va SUBRAYADO, y no es opcional: sin subrayar, un enlace se distingue
 * del texto solo por color, que es SC 1.4.1. En una tabla o una barra —donde el
 * sitio ya lo identifica— puede ir sin subrayar.
 */

export type EnlaceProps = {
  /** `prosa` subraya siempre. `interfaz` no, y solo vale donde el contexto ya
   *  dice que es un enlace: celda de tabla, barra de acciones. */
  contexto?: 'prosa' | 'interfaz';
  /** Abre fuera. Añade el indicador y avisa al lector, porque cambiar de sitio
   *  sin avisar desorienta. */
  externo?: boolean;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function Enlace({ contexto = 'prosa', externo = false, className = '', children, ...resto }: EnlaceProps) {
  const clases = ['enlace', contexto === 'prosa' ? 'enl-sub' : 'enl-nosub'];
  if (externo) clases.push('enl-ext');
  if (className) clases.push(className);
  return (
    <a
      className={clases.join(' ')}
      {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...resto}
    >
      {children}
      {externo && <span className="sr-solo"> (se abre en una pestaña nueva)</span>}
    </a>
  );
}
