import db from '@arasaac/utils/db'
import logger from '@arasaac/utils/logger'
import { createServer } from '@arasaac/utils/server'

db.open()
  .then(() => createServer())
  .then((server) => {
    server.listen(3000, () => {
      logger.info(`Listening on http://localhost:3000`)
      process.on('SIGINT', function () {
        console.log('\nGracefully shutting down from SIGINT (Ctrl+C)')
        process.exit(1)
      })
    })
  })
  .catch((err) => {
    logger.error(`Error: ${err}`)
  })
