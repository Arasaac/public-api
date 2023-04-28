import dotenvExtended from 'dotenv-extended'
import dotenvParseVariables from 'dotenv-parse-variables'

const env = dotenvExtended.load({
  path: process.env.ENV_FILE,
  defaults: './config/.env.defaults',
  schema: './config/.env.schema',
  includeProcessEnv: true,
  silent: false,
  errorOnMissing: true,
  errorOnExtra: true,
})

const parsedEnv = dotenvParseVariables(env)

// Define log levels type (silent + Winston default npm)
type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'

interface Config {
  mongo: {
    url: string
    useCreateIndex: boolean
    autoIndex: boolean
    user: string
    pwd: string
    host: string
    port: number
  }

  morganLogger: boolean
  morganBodyLogger: boolean
  devLogger: boolean
  loggerLevel: LogLevel
  MATERIAL_DIR: string
  IMAGE_DIR: string
  SVG_DIR: string
  IMAGE_URL: string
  NODE_ENV: string
}

const config: Config = {
  mongo: {
    url: parsedEnv.MONGO_URL as string,
    useCreateIndex: parsedEnv.MONGO_CREATE_INDEX as boolean,
    autoIndex: parsedEnv.MONGO_AUTO_INDEX as boolean,
    user: parsedEnv.MONGO_DB_USER as string,
    pwd: parsedEnv.MONGO_DB_PWD as string,
    host: parsedEnv.MONGO_DB_HOST as string,
    port: parsedEnv.MONGO_DB_PORT as number,
  },

  morganLogger: parsedEnv.MORGAN_LOGGER as boolean,
  morganBodyLogger: parsedEnv.MORGAN_BODY_LOGGER as boolean,
  devLogger: parsedEnv.DEV_LOGGER as boolean,
  loggerLevel: parsedEnv.LOGGER_LEVEL as LogLevel,
  MATERIAL_DIR: parsedEnv.MATERIAL_DIR as string,
  IMAGE_DIR: parsedEnv.IMAGE_DIR as string,
  SVG_DIR: parsedEnv.SVG_DIR as string,
  IMAGE_URL: parsedEnv.IMAGE_URL as string,
  NODE_ENV: parsedEnv.NODE_ENV as string,
}

export default config
