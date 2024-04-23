import * as log4js from 'log4js'
import * as fs from 'fs-extra'
import { join } from 'path'

const LOG_DIR_NAME = '../../logs'

fs.ensureDirSync(join(__dirname, LOG_DIR_NAME))

void ['error', 'request', 'response'].map((v) => {
  fs.ensureDirSync(join(__dirname, LOG_DIR_NAME, v))
})

const resolvePath = (dir, filename) => join(__dirname, LOG_DIR_NAME, dir, filename)

const commonConfig = {
  type: 'dateFile',
  pattern: '-yyyy-MM--dd.log',
  alwaysIncludePattern: true,
}

log4js.configure({
  appenders: {
    request: {
      ...commonConfig,
      filename: resolvePath('request', 'request.log'),
      category: 'request',
    },
    response: {
      ...commonConfig,
      filename: resolvePath('response', 'response.log'),
      category: 'response',
    },
    info: {
      ...commonConfig,
      filename: resolvePath('info', 'info.log'),
      category: 'info',
    },
    error: {
      ...commonConfig,
      filename: resolvePath('error', 'error.log'),
      category: 'error',
    },
  },
  categories: {
    default: { appenders: ['request'], level: 'info' },
    response: { appenders: ['response'], level: 'info' },
    info: { appenders: ['info'], level: 'info' },
    error: { appenders: ['error'], level: 'info' },
  },
})

export const requestLogger = log4js.getLogger('request')
export const responseLogger = log4js.getLogger('response')
export const infoLogger = log4js.getLogger('info')
export const errorLogger = log4js.getLogger('error')
