// Configuración de ESLint del propio repositorio.
// Consume el candado tal como lo consumiría un proyecto: importándolo.
import tseslint from 'typescript-eslint';
import candado from './sistema/candado/candado.eslint.config.mjs';

export default [
  { ignores: ['node_modules/**', 'cascaron/**', 'componentes/node_modules/**', 'pruebas/**'] },
  // El analizador de TypeScript. Sin él, ESLint no sabe leer `.tsx` y falla con
  // «Parsing error» ANTES de llegar a las reglas del candado: el candado
  // parecía roto cuando lo que faltaba era quién leyera el archivo.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  ...candado,
];
