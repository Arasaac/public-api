import request from 'supertest'
import { Express } from 'express-serve-static-core'
import { createServer } from '@arasaac/utils/server'

let server: Express

beforeAll(async () => {
  server = await createServer()
})

describe('OpenAPI specification endpoints', () => {
  it('should return 200 and valid JSON for /arasaac_v1.json', async () => {
    const response = await request(server).get('/arasaac_v1.json')
    expect(response.status).toEqual(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.openapi).toBeDefined()
    expect(response.body.info).toBeDefined()
  })

  it('should return 200 and valid JSON for /arasaac_v2.json', async () => {
    const response = await request(server).get('/arasaac_v2.json')
    expect(response.status).toEqual(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.openapi).toBeDefined()
    expect(response.body.info).toBeDefined()
  })

  it('should return 200 and valid JSON for /arasaac_1.json alias', async () => {
    const response = await request(server).get('/arasaac_1.json')
    expect(response.status).toEqual(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.openapi).toBeDefined()
  })

  it('should return 200 and valid JSON for /arasaac_2.json alias', async () => {
    const response = await request(server).get('/arasaac_2.json')
    expect(response.status).toEqual(200)
    expect(response.headers['content-type']).toMatch(/json/)
    expect(response.body.openapi).toBeDefined()
  })
})
