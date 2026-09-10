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

describe("Materials API v1", () => {
  describe("GET /v1/materials/{id}", () => {
    it("should return material by ID", async () => {
      const res = await request(server)
        .get("/v1/materials/1")
        .expect(200)

      expect(res.body).toHaveProperty("idMaterial", 1)
      expect(res.body).toHaveProperty("translations")
      expect(Array.isArray(res.body.translations)).toBe(true)
    })

    it("should return 404 if material does not exist", async () => {
      const res = await request(server)
        .get("/v1/materials/999999")
        .expect(404)

      expect(res.body).toHaveProperty("message")
    })
  })

  describe("GET /v1/materials/{language}/{searchText}", () => {
    it("should return materials matching search query in Spanish", async () => {
      const res = await request(server)
        .get("/v1/materials/es/TEACCH")
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty("idMaterial")
    })

    it("should return 404 if no material matches search query", async () => {
      await request(server)
        .get("/v1/materials/es/nonexistenttermxyz")
        .expect(404)
    })
  })

  describe("GET /v1/materials/new/{numItems}", () => {
    it("should return the requested number of latest materials", async () => {
      const res = await request(server)
        .get("/v1/materials/new/3")
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeLessThanOrEqual(3)
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("idMaterial")
      }
    })
  })
})
