import { createRequire }  from 'module'
import { dirname, join }  from 'path'
import { fileURLToPath }  from 'url'
import { homedir }        from 'os'

// __dirname equivalente em ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Raiz do pacote instalado (onde dist/ está)
// dist/cli/index.js → ../../  =  raiz do pacote
export const PKG_ROOT      = join(__dirname, '..', '..')
export const API_JS        = join(PKG_ROOT, 'dist', 'api.js')
export const FRONTEND_DIR  = join(PKG_ROOT, 'dist', 'frontend')
export const FRONTEND_SERVER = join(FRONTEND_DIR, 'server.js')

// Diretório do usuário
export const HOME_DIR   = join(homedir(), '.studydash')
export const CONFIG_FILE = join(HOME_DIR, 'config.json')
export const PIDS_FILE   = join(HOME_DIR, 'pids.json')
export const DB_FILE     = join(HOME_DIR, 'studydash.db')
