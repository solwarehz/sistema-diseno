// Configuración mínima para probar el candado contra el archivo de
// infracciones. Aparte de la del repositorio a propósito: la del repositorio
// excluye `pruebas/`, porque ese archivo infringe todo adrede.
import candado from '../sistema/candado/candado.eslint.config.mjs';
export default [...candado];
