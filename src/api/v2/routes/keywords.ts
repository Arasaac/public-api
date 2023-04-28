import * as express from 'express'
import {getAll} from '@arasaac/api/v2/controllers/keywords'

export const router = express.Router()

router.get(
  '/:language',
  (req: express.Request, res: express.Response) => {
    getAll(req, res)
  })

export default router
