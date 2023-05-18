import axios, { AxiosError } from 'axios'
import passport from 'passport'

const BearerStrategy = require('passport-http-bearer').Strategy
const AnonymousStrategy = require('passport-anonymous').Strategy
import jwt from 'jsonwebtoken'
import logger from '@arasaac/utils/logger'
import express from 'express'

type User = {
  id: string
  role: 'admin' | 'translator' | 'user'
  scope: string[]
  iss: string
  aud: string
  exp: number
  targetLanguages: string[]
}

// see https://gist.github.com/fgilio/230ccd514e9381fafa51608fcf137253 for axios catch errors

/*
 We verify our token with our auth server endpoint
*/

passport.use(
  new BearerStrategy(async (token: string, cb: any) => {
    const url = `http://services_auth/api/tokeninfo?access_token=${token}`
    // const url = `http://auth.arasaac.org/api/tokeninfo?access_token=${token}`
    try {
      if (!token) {
        logger.debug('Auth failed: No token!!')
        return cb(null, false)
      }

      const { iss, sub, aud, role, exp, scope, targetLanguages } = jwt.decode(token) as any
      const user = { id: sub, role, scope, iss, aud, exp, targetLanguages }
      logger.debug(`Auth ok. Token valid for user ${sub}`)
      return cb(null, user)
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.debug(`Auth failed ${error.message}`)
        if (error.response) {
          const { status } = error.response
          // const { data, status, headers } = error.response
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (status === 400) return cb(null, false) // bad request, invalid token
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          return cb(error)
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        return cb(error)
      }
    }
  }),
)

passport.use(new AnonymousStrategy())

export const validate = (req: express.Request, scopes: String[], schema: any): Promise<true | false> => {
  return new Promise((resolve, reject) => {
    passport.authenticate('bearer', { session: false }, (err, user) => {
      if (err) {
        logger.error(err)
        resolve(false)
      }
      if (!user) {
        resolve(false)
      }
      req.user = user
      console.log(user)
      resolve(true)
    })(req)
  })
}

export const getUserData = (req: express.Request) => req.user as User
