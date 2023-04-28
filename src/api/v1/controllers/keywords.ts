import * as express from 'express'
import logger from '@arasaac/utils/logger'
import Keyword from '@arasaac/api/models/Keywords'
import { writeJsonResponse } from '@arasaac/utils/express'
import { addMetricAPI } from '@arasaac/utils/metrics'

export async function getAll(req: express.Request, res: express.Response): Promise<void> {
  const { language } = req.params
  try {
    const keywords = await Keyword.findOne({ language })
    // console.log(req.route, typeof req.route.methods)

    // const [method] = Object.entries(req.route.methods).some((entry) => entry[1])
    // console.log(method)
    // console.log(req.route.path)

    
    addMetricAPI({apiVersion: 1, method: 'GET', statusCode: 200, url: req.route.path, locale: language})
    writeJsonResponse(res, 200, keywords)
  } catch (err) {
    logger.error(`Error getting keywords for language ${language}. See error: ${err}`)
    writeJsonResponse(res, 500, {
      message: 'Error getting keywords. See error field for detail',
      error: err,
    })
  }
}
