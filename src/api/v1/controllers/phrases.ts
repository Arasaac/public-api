import * as express from 'express'
import logger from '@arasaac/utils/logger'
import Keyword from '@arasaac/api/models/Keywords'
import { writeJsonResponse } from '@arasaac/utils/express'
import { addMetricAPI } from '@arasaac/utils/metrics'
import axios from 'axios'

export async function getFlex(req: express.Request, res: express.Response): Promise<void> {
  const { phrase } = req.params
  const { tense, idPictograms } = req.query
  let tenseParam = ''
  // [PP] pretérito perfecto simple,  [PI] pretérito imperfecto, [F] Futuro

  if (tense === 'future') tenseParam = '[F]'
  else if (tense === 'past') tenseParam = '[PP]'
  else if (tense === 'present') tenseParam = '[P]'
  console.log(`idPittograms received: ${idPictograms}`)

  try {
    const url = `http://backend_freeling:5000/flexionar?frase=${tenseParam}${phrase}`
    // get data from url using axios:
    const { data } = await axios.get(url)
    writeJsonResponse(res, 200, { msg: data.toString() })
  } catch (err) {
    logger.error(`Error getting getFlex for phrase ${phrase}. See error: ${err}`)
    writeJsonResponse(res, 500, {
      message: 'Error getting getFlex. See error field for detail',
      error: err,
    })
  }
}

export async function postReport(req: express.Request, res: express.Response): Promise<void> {
  const { originalPhrase, returnedPhrase, expectedPhrase } = req.query
  try {
    console.log(`originalPhrase: ${originalPhrase}`)
    console.log(`returnedPrase: ${returnedPhrase}`)
    console.log(`expectedPhrase: ${expectedPhrase}`)
    writeJsonResponse(res, 200, { msg: 'received!' })
  } catch (err) {
    logger.error(`Error getting postReport for phrase ${originalPhrase}. See error: ${err}`)
    writeJsonResponse(res, 500, {
      message: 'Error getting postReport. See error field for detail',
      error: err,
    })
  }
}
