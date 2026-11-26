import request from 'supertest'
import { Express } from 'express-serve-static-core'
import { validate } from '@arasaac/utils/auth'
import db from '@arasaac/utils/db'
import { seedDatabase } from '@arasaac/tests/seed'

jest.mock('@arasaac/utils/auth')
const validateMock = validate as jest.MockedFunction<typeof validate>
validateMock.mockImplementation(async () => Promise.resolve(true))

import { createServer } from '@arasaac/utils/server'

let server: Express

beforeAll(async () => {
  await db.open()
  await seedDatabase()
  server = await createServer()
})

afterAll(async () => {
  await db.close()
})

describe('v2 GET/HEAD /pictograms/all/{language} caching', () => {
  it('uses private Cache-Control (authenticated responses) and answers 304', async () => {
    const first = await request(server).get('/v2/pictograms/all/es')
    expect(first.status).toBe(200)
    expect(first.headers['cache-control']).toBe('private, max-age=3600, stale-while-revalidate=86400')
    expect(first.headers.etag).toMatch(/^W\/"\d+-\d+"$/)

    const second = await request(server).get('/v2/pictograms/all/es').set('If-None-Match', first.headers.etag)
    expect(second.status).toBe(304)
  })

  it('HEAD goes through the security handler', async () => {
    validateMock.mockClear()
    const response = await request(server).head('/v2/pictograms/all/es')
    expect(response.status).toBe(200)
    expect(validateMock).toHaveBeenCalled()
  })
})
