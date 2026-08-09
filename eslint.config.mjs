// Configuración de ESLint del propio repositorio del sistema.
// Consume el candado tal como lo consumiría un proyecto: importándolo.
import candado from './sistema/candado/candado.eslint.config.mjs';

export default [
  { ignores: ['node_modules/**', 'cascaron/**', 'componentes/node_modules/**', 'pruebas/**'] },
  ...candado,
];
