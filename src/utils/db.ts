/* istanbul ignore file */

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

import config from '@arasaac/config'
import logger from '@arasaac/utils/logger'

mongoose.Promise = global.Promise
mongoose.set('debug', process.env.DEBUG !== undefined)

const opts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: config.mongo.useCreateIndex,
  keepAlive: true,
  keepAliveInitialDelay: 300000,
  autoIndex: config.mongo.autoIndex,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}

class MongoConnection {
  private static _instance: MongoConnection

  private _mongoServer?: MongoMemoryServer

  static getInstance(): MongoConnection {
    if (!MongoConnection._instance) {
      MongoConnection._instance = new MongoConnection()
    }
    return MongoConnection._instance
  }

  public async open(): Promise<void> {
    try {
      if (config.mongo.host === 'inmemory') {
        logger.debug('connecting to inmemory mongo db')
        this._mongoServer = new MongoMemoryServer()
        const mongoUrl = await this._mongoServer.getConnectionString()
        await mongoose.connect(mongoUrl, opts)
      } else {
        const databaseUrl = `mongodb://${config.mongo.user}:${config.mongo.pwd}@${config.mongo.host}:${config.mongo.port}/arasaac?authSource=admin`
        logger.debug(`connecting to mongo db: ${databaseUrl}`)
        mongoose.connect(databaseUrl, opts)
      }

      mongoose.connection.on('connected', () => {
        logger.info('Mongo: connected')
      })

      mongoose.connection.on('disconnected', () => {
        logger.error('Mongo: disconnected')
      })

      mongoose.connection.on('error', (err) => {
        logger.error(`Mongo:  ${String(err)}`)
        if (err.name === 'MongoNetworkError') {
          setTimeout(function () {
            mongoose.connect(config.mongo.url, opts).catch(() => {})
          }, 5000)
        }
      })
    } catch (err) {
      logger.error(`db.open: ${err}`)
      throw err
    }
  }

  public async close(): Promise<void> {
    try {
      await mongoose.disconnect()
      if (config.mongo.host === 'inmemory') {
        await this._mongoServer!.stop()
      }
    } catch (err) {
      logger.error(`db.open: ${err}`)
      throw err
    }
  }
}

export default MongoConnection.getInstance()
