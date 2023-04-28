import request from 'supertest'
import { Express } from 'express-serve-static-core'
import passport from 'passport'
import { validate } from '@arasaac/utils/auth'
import db from '@arasaac/utils/db'
import { createServer } from '@arasaac/utils/server'
import { loadKeyword } from '@arasaac/tests/keyword'
import { OutgoingHttpHeaders } from 'http'

let server: Express

beforeAll(async () => {
  await db.open()
  server = await createServer()
})

afterAll(async () => {
  await db.close()
})


describe('v2 GET /keywords', () => {
  it('should return 401 if no token', async () => {

    const response = await request(server).get(`/api/v2/keywords/en`).set('Accept', 'application/json')

    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.status).toEqual(401)
    expect(response.body).toMatchObject({
      error: {
        type: 'request_validation',
        message: 'unauthorized',
        errors: [
          {
            message: 'unauthorized',
          },
        ],
      },
    })
  })
  
})
