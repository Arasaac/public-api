import * as express from 'express'
import logger from '@arasaac/utils/logger'
import Keyword from '@arasaac/api/models/Keywords'
import { writeJsonResponse } from '@arasaac/utils/express'
import { addMetricAPI } from '@arasaac/utils/metrics'
import axios from 'axios'

export async function getFlex(req: express.Request, res: express.Response): Promise<void> {
  const { phrase } = req.params
  try {
    const url = `http://arasaac_freeling:5000/flexionar?frase=${phrase}`
    // get data from url using axios:
    const { data } = await axios.get(url)
    writeJsonResponse(res, 200, data)
  } catch (err) {
    logger.error(`Error getting getFlex for phrase ${phrase}. See error: ${err}`)
    writeJsonResponse(res, 500, {
      message: 'Error getting keywords. See error field for detail',
      error: err,
    })
  }
}
