// Configuración de ESLint del propio repositorio.
// Consume el candado tal como lo consumiría un proyecto: importándolo.
import tseslint from 'typescript-eslint';
import candado from './sistema/candado/candado.eslint.config.mjs';

export default [
  /* `pruebas/**` en flat config casa SOLO el `pruebas/` de la raiz —el fichero
     de infracciones a proposito—, no `componentes/pruebas/`. Por eso las
     pruebas de la formula de color llevaban DIECISEIS errores desde la v1.123.0
     y nadie se enteraba: ESLint no era ninguno de los veinte pasos. Ahora lo es,
     y por eso hubo que decidir el alcance de verdad.

     Las pruebas quedan fuera de la regla del token PORQUE SU TRABAJO ES
     COMPROBAR VALORES: `distancia.test.ts` verifica CIEDE2000 contra los 32
     pares publicados de Sharma, Wu y Dalal, y esos numeros son el dato — un
     token en su lugar probaria otra cosa. Lo que la regla protege es lo que se
     PINTA, y una prueba no maqueta nada. */
  { ignores: [
    'node_modules/**', 'cascaron/**', 'componentes/node_modules/**',
    'pruebas/**', 'componentes/pruebas/**',
  ] },
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
