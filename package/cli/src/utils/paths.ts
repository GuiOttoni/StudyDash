import { join }    from 'path'
import { homedir } from 'os'

// Raiz do pacote instalado (onde dist/ está)
// dist/cli/index.js → ../../  =  raiz do pacote
export const PKG_ROOT = join(__dirname, '..', '..')
// Processo único: a API também serve os assets estáticos do frontend (dist/public).
export const API_JS   = join(PKG_ROOT, 'dist', 'api.js')

// Diretório do usuário
export const HOME_DIR   = join(homedir(), '.studydash')
export const CONFIG_FILE = join(HOME_DIR, 'config.json')
export const PIDS_FILE   = join(HOME_DIR, 'pids.json')
export const DB_FILE     = join(HOME_DIR, 'studydash.db')
export const CODE_DIR    = join(HOME_DIR, 'code')
