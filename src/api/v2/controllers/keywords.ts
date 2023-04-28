import * as express from 'express'
import logger from '@arasaac/utils/logger'
import Keyword from '@arasaac/api/models/Keywords'
import { writeJsonResponse } from '@arasaac/utils/express'
import { addMetricAPI } from '@arasaac/utils/metrics'

export async function getAll(req: express.Request, res: express.Response): Promise<void> {
  const { language } = req.params
  try {
     logger.debug(`EXEC getMaterialById with id**********************`)
    const keywords = await Keyword.findOne({ language })
    addMetricAPI({apiVersion: 2, method: 'GET', statusCode: 200, url: req.route.path, locale: language})
    writeJsonResponse(res, 200, keywords)
  } catch (err) {
    logger.error(`Error getting keywords for language ${language}. See error: ${err}`)
    writeJsonResponse(res, 500, {
      message: 'Error getting keywords. See error field for detail',
      error: err,
    })
  }
}
