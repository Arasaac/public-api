import request from 'supertest'
import { Express } from 'express-serve-static-core'
import { validate } from '@arasaac/utils/auth'

import db from '@arasaac/utils/db'

export function mockFunction<T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> {
  return fn as jest.MockedFunction<T>
}

jest.mock('@arasaac/utils/auth')
const validateMock = mockFunction(validate)
validateMock.mockImplementation(async (req)=> Promise.resolve(true))



import { createServer } from '@arasaac/utils/server'
import { loadKeyword } from '@arasaac/tests/keyword'

let server: Express

beforeAll(async () => {
  await db.open()
  server = await createServer()
})

afterAll(async () => {
  await db.close()
})




describe('v2 GET /keywords/', () => {
  it('should return 404 if url language parameter is empty', async () => {

    const response = await request(server).get(`/api/v2/keywords`).set('Accept', 'application/json')

    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.status).toEqual(404)
    expect(response.body).toMatchObject({
      error: {
        type: 'request_validation',
        message: 'not found',
        errors: [
          {
            message: 'not found',
          },
        ],
      },
    })
  })
  it('should return 200 & valid response for an available language', async () => {
    const keyword = await loadKeyword()
    const response = await request(server).get(`/api/v2/keywords/${keyword.language}`).set('Accept', 'application/json')
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.status).toEqual(200)
    expect(response.body).toMatchObject(keyword)
  })

  it('should return 404 for an unavailable language', async () => {
    const response = await request(server).get(`/api/v2/keywords/kk`).set('Accept', 'application/json')
    const errMessage = {
      error: {
        type: 'request_validation',
        errors: [
          {
            path: '.params.language',
            errorCode: 'enum.openapi.validation',
          },
        ],
      },
    }
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.status).toEqual(400)
    expect(response.body).toMatchObject(errMessage)
  })
})
