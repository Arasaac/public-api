import { Request, Response } from 'express'
import logger from '@arasaac/utils/logger'
import User from '@arasaac/api/models/User'

export const getProfile = async (req: Request, res: Response) => {
    const {id} = req.user as any
    logger.debug(`Getting user profile with id ${id}`)
    try {
      const user = await User.findOne(
        { _id: id },
        {
          verifyToken: 0,
          verifyDate: 0,
          password: 0,
          __v: 0
        }
      )
      if (!user) {
        return res.status(404).json({
          message: `User does not exist. User Id:  ${id}`
        })
      }
      return res.status(200).json(user)
    } catch (err) {
      logger.debug(`Error getting user profile:  ${err}`)
      return res.status(500).json({
        message: `Error getting user profile:  ${err}`
      })
    }
  }
