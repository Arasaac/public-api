import bodyParser from 'body-parser'
import express from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { Express } from 'express-serve-static-core'
import morgan from 'morgan'
import morganBody from 'morgan-body'
import yaml from 'js-yaml'
import path from 'path'
import fs from 'fs'
import swaggerUi from 'swagger-ui-express'
import passport from 'passport'
import config from '@arasaac/config'
import { expressDevLogger } from '@arasaac/utils/express_dev_logger'
import logger from '@arasaac/utils/logger'
import * as auth from '@arasaac/utils/auth'
import client, { register } from 'prom-client'
// import routerV1 from '@arasaac/api/v1/routes'
// import routerV2 from '@arasaac/api/v2/routes'

const collectDefaultMetrics = client.collectDefaultMetrics
collectDefaultMetrics()

export async function createServer(): Promise<Express> {
  const server = express()
  const versions = ['1', '2'] as const
  type SwaggerDocs = { [K in typeof versions[number]]: string }

  server.use(bodyParser.json())

  /* istanbul ignore next */
  if (config.morganLogger) {
    server.use(morgan(':method :url :status :response-time ms - :res[content-length]'))
  }

  /* istanbul ignore next */
  if (config.morganBodyLogger) {
    morganBody(server)
  }

  /* istanbul ignore next */
  if (config.devLogger) {
    server.use(expressDevLogger)
  }
  server.use(express.static('public'))
  server.use(passport.initialize())
  const swaggerJSON = {} as SwaggerDocs

  const serverURL = config.NODE_ENV === 'production' ? 'https://beta.api.arasaac.org' : 'http://localhost:3000'
  const baseDir =
    config.NODE_ENV === 'production' ? path.join(process.cwd(), 'bin', 'api') : path.join(process.cwd(), 'src', 'api')

  const options = {
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          url: `${serverURL}/arasaac_v1.json`,
          name: `Version 1`,
        },
        {
          url: `${serverURL}/arasaac_v2.json`,
          name: `Version 2`,
        },
      ],
    },
  }

  for (const v of versions) {
    try {
      const yamlSpecFile = `./config/openapi_v${v}.yml`
      const apiDefinition = yaml.load(fs.readFileSync(yamlSpecFile, 'utf8'))
      swaggerJSON[v] = JSON.stringify(apiDefinition, null, 4)
      const fileName = path.join(`./public/arasaac_v${v}.json`)
      fs.writeFile(fileName, swaggerJSON[v], function (err) {
        if (err) return console.log(err)
        logger.info(`arasaac.json file for version ${v} generated at ${fileName}`)
      })

      server.use(
        '/v' + v,
        OpenApiValidator.middleware({
          apiSpec: yamlSpecFile,
          validateRequests: true, // (default)
          validateResponses: false, // false by default // if true 401 errors work wrong in v2????????
          operationHandlers: path.join(baseDir, `v${v}`, 'controllers'),
          validateSecurity: {
            handlers: {
              oAuth2: auth.validate,
            },
          },
        }),
      )

      if (v === '1') {
        server.use(
          '/api',
          OpenApiValidator.middleware({
            apiSpec: yamlSpecFile,
            validateRequests: true, // (default)
            validateResponses: false, // false by default // if true 401 errors work wrong in v2????????
            operationHandlers: path.join(process.cwd(), 'bin', 'api', `v1`, 'controllers'),
            validateSecurity: {
              handlers: {
                oAuth2: auth.validate,
              },
            },
          }),
        )
      }
    } catch (e) {
      logger.error(e)
    }
  }

  server.use(`/api-docs`, swaggerUi.serve, swaggerUi.setup(undefined, options))

  // Setup server to Prometheus scrapes:

  server.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType)
      res.end(await register.metrics())
    } catch (ex) {
      res.status(500).end(ex)
    }
  })

  // server.use('/api/v1', routerV1)
  // server.use('/api/v2', routerV2)

  // error customization, if request is invalid
  server.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status || 500).json({
      error: {
        type: 'request_validation',
        message: err.message,
        errors: err.errors,
      },
    })
  })
  console.log(process.env)
  return server
}
