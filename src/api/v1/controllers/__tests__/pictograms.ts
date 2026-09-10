import request from 'supertest'
import { Express } from 'express-serve-static-core'
import db from '@arasaac/utils/db'
import { createServer } from '@arasaac/utils/server'
import { seedDatabase } from '@arasaac/tests/seed'

let server: Express

beforeAll(async () => {
  await db.open()
  await seedDatabase()
  server = await createServer()
})

afterAll(async () => {
  await db.close()
})

describe('Pictograms API v1', () => {
  describe('GET /v1/pictograms/{language}/{idPictogram}', () => {
    it('should return 200 and pictogram data for valid id', async () => {
      const response = await request(server).get('/v1/pictograms/es/2317')
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('_id', 2317)
      expect(response.body).toHaveProperty('keywords')
      expect(response.body.keywords.some((k: any) => k.keyword === 'casa')).toBe(true)
    })

    it('should return 404 for non-existent pictogram id', async () => {
      const response = await request(server).get('/v1/pictograms/es/999999')
      expect(response.status).toBe(404)
    })
  })

  describe('GET /v1/pictograms/{language}/bestsearch/{searchText}', () => {
    it('should return best matching pictograms in Spanish', async () => {
      const response = await request(server).get('/v1/pictograms/es/bestsearch/casa')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('_id', 2317)
    })

    it('should return best matching pictograms in English', async () => {
      const response = await request(server).get('/v1/pictograms/en/bestsearch/house')
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('_id', 2317)
    })
  })

  describe('GET /v1/pictograms/{language}/search/{searchText}', () => {
    it('should return search results for keyword "comer"', async () => {
      const response = await request(server).get('/v1/pictograms/es/search/comer'); 
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should return 404 if no pictograms match search text', async () => {
      const response = await request(server).get('/v1/pictograms/es/search/inexistentexyz999')
      expect(response.status).toBe(404)
    })
  })
})
