import request from "supertest"
import { Express } from "express-serve-static-core"
import db from "@arasaac/utils/db"
import { createServer } from "@arasaac/utils/server"
import { seedDatabase } from "@arasaac/tests/seed"

let server: Express

beforeAll(async () => {
  await db.open()
  await seedDatabase()
  server = await createServer()
})

afterAll(async () => {
  await db.close()
})

describe("Synsets API v1", () => {
  describe("GET /v1/pictograms/{language}/wordnet/{wordnet}/id/{synset}", () => {
    it("should return pictograms for WordNet 3.1 synset", async () => {
      const res = await request(server)
        .get("/v1/pictograms/es/wordnet/3.1/id/07951744-n")
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      const ids = res.body.map((p: any) => p._id)
      expect(ids).toContain(2248)
    })

    it("should resolve older WordNet 3.0 synset and return pictograms", async () => {
      const res = await request(server)
        .get("/v1/pictograms/es/wordnet/3.0/id/07935504-n")
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      const ids = res.body.map((p: any) => p._id)
      expect(ids).toContain(2248)
    })

    it("should return 404 for unknown WordNet 3.0 synset", async () => {
      const res = await request(server)
        .get("/v1/pictograms/es/wordnet/3.0/id/99999999-n")
        .expect(404)

      expect(res.body).toHaveProperty("error")
    })

    it("should return empty array if no pictograms match WordNet 3.1 synset", async () => {
      const res = await request(server)
        .get("/v1/pictograms/es/wordnet/3.1/id/99999999-n")
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(0)
    })
  })
})
