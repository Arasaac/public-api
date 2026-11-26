import request from 'supertest'
import mongoose from 'mongoose'
import { Express } from 'express-serve-static-core'
import db from '@arasaac/utils/db'
import { createServer } from '@arasaac/utils/server'
import { seedDatabase } from '@arasaac/tests/seed'
import fs from 'fs'
import path from 'path'

let server: Express

const fixtures = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../../tests/fixtures/pictos_es.json'), 'utf8'),
)
const published = (fixtures as any[]).filter((p) => p.published)
const maxLastUpdated = new Date(
  Math.max(...published.map((p) => new Date(p.lastUpdated).getTime())),
)
const expectedETag = `W/"${published.length}-${maxLastUpdated.getTime()}"`
const URL = '/v1/pictograms/all/es'

beforeAll(async () => {
  await db.open()
  await seedDatabase()
  server = await createServer()
})

afterAll(async () => {
  await db.close()
})

describe('GET /v1/pictograms/all/{language} caching', () => {
  it('returns 200 with ETag, Last-Modified, Cache-Control and exposed headers', async () => {
    const response = await request(server).get(URL)
    expect(response.status).toBe(200)
    expect(response.headers.etag).toBe(expectedETag)
    expect(response.headers['last-modified']).toBe(maxLastUpdated.toUTCString())
    expect(response.headers['cache-control']).toBe('public, max-age=3600, stale-while-revalidate=86400')
    expect(response.headers['access-control-expose-headers']).toBe('ETag, Last-Modified')
    expect(response.body).toHaveLength(published.length)
    expect(response.body[0]).toHaveProperty('keywords')
    expect(response.body[0]).not.toHaveProperty('validated')
    expect(response.body[0]).not.toHaveProperty('desc')
    expect(response.body[0]).not.toHaveProperty('__v')
  })

  it('answers 304 without body when If-None-Match matches', async () => {
    const response = await request(server).get(URL).set('If-None-Match', expectedETag)
    expect(response.status).toBe(304)
    expect(response.text).toBeFalsy()
    expect(response.headers.etag).toBe(expectedETag)
  })

  it('answers 304 when If-Modified-Since equals Last-Modified (second precision)', async () => {
    const response = await request(server).get(URL).set('If-Modified-Since', maxLastUpdated.toUTCString())
    expect(response.status).toBe(304)
  })

  it('answers 200 when If-Modified-Since is older', async () => {
    const older = new Date(maxLastUpdated.getTime() - 60 * 1000).toUTCString()
    const response = await request(server).get(URL).set('If-Modified-Since', older)
    expect(response.status).toBe(200)
  })

  it('If-None-Match takes precedence over If-Modified-Since', async () => {
    const response = await request(server)
      .get(URL)
      .set('If-None-Match', 'W/"stale"')
      .set('If-Modified-Since', maxLastUpdated.toUTCString())
    expect(response.status).toBe(200)
  })

  it('HEAD returns the same validators and no body', async () => {
    const response = await request(server).head(URL)
    expect(response.status).toBe(200)
    expect(response.headers.etag).toBe(expectedETag)
    expect(response.headers['last-modified']).toBe(maxLastUpdated.toUTCString())
    expect(response.text).toBeFalsy()
  })

  it('HEAD answers 304 when If-None-Match matches', async () => {
    const response = await request(server).head(URL).set('If-None-Match', expectedETag)
    expect(response.status).toBe(304)
  })

  it('compresses the JSON when the client accepts gzip', async () => {
    const response = await request(server).get(URL).set('Accept-Encoding', 'gzip')
    expect(response.status).toBe(200)
    expect(response.headers['content-encoding']).toBe('gzip')
    expect(response.headers.vary).toMatch(/Accept-Encoding/)
  })

  it('changes the ETag (but not Last-Modified) when a pictogram is unpublished', async () => {
    // unpublish the pictogram that does NOT hold the max lastUpdated, so only count changes
    const victim = published.find((p) => new Date(p.lastUpdated).getTime() !== maxLastUpdated.getTime())
    const col = mongoose.connection.collection('pictos_es')
    await col.updateOne({ _id: victim._id }, { $set: { published: false } })
    try {
      const response = await request(server).get(URL).set('If-None-Match', expectedETag)
      expect(response.status).toBe(200)
      expect(response.headers.etag).toBe(`W/"${published.length - 1}-${maxLastUpdated.getTime()}"`)
      expect(response.headers['last-modified']).toBe(maxLastUpdated.toUTCString())
      expect(response.body).toHaveLength(published.length - 1)
    } finally {
      await col.updateOne({ _id: victim._id }, { $set: { published: true } })
    }
  })

  it('changes ETag and Last-Modified when a pictogram is updated', async () => {
    const col = mongoose.connection.collection('pictos_es')
    const target = published[0]
    const now = new Date(Math.ceil(Date.now() / 1000) * 1000 + 1000)
    await col.updateOne({ _id: target._id }, { $set: { lastUpdated: now } })
    try {
      const response = await request(server).get(URL).set('If-None-Match', expectedETag)
      expect(response.status).toBe(200)
      expect(response.headers.etag).toBe(`W/"${published.length}-${now.getTime()}"`)
      expect(response.headers['last-modified']).toBe(now.toUTCString())
    } finally {
      await col.updateOne({ _id: target._id }, { $set: { lastUpdated: new Date(target.lastUpdated) } })
    }
  })

  it('returns 200 [] with W/"0-0" and no Last-Modified for a language without pictograms', async () => {
    const response = await request(server).get('/v1/pictograms/all/fr')
    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
    expect(response.headers.etag).toBe('W/"0-0"')
    expect(response.headers['last-modified']).toBeUndefined()

    const cached = await request(server).get('/v1/pictograms/all/fr').set('If-None-Match', 'W/"0-0"')
    expect(cached.status).toBe(304)
  })

  it('does not run the big find() on 304 nor on HEAD, only on 200', async () => {
    const findSpy = jest.spyOn(mongoose.Model, 'find')
    try {
      await request(server).get(URL).set('If-None-Match', expectedETag).expect(304)
      await request(server).head(URL).expect(200)
      await request(server).head(URL).set('If-None-Match', expectedETag).expect(304)
      expect(findSpy).not.toHaveBeenCalled()

      await request(server).get(URL).expect(200)
      expect(findSpy).toHaveBeenCalledTimes(1)
    } finally {
      findSpy.mockRestore()
    }
  })

  it('on database error returns 500 without validators and with Cache-Control: no-store', async () => {
    const countSpy = jest.spyOn(mongoose.Model, 'countDocuments').mockImplementationOnce((() => {
      throw new Error('boom')
    }) as any)
    try {
      const response = await request(server).get(URL)
      expect(response.status).toBe(500)
      // Express may add its own ETag for the error body; it must not be the catalog one
      expect(response.headers.etag).not.toMatch(/^W\/"\d+-\d+"$/)
      expect(response.headers['last-modified']).toBeUndefined()
      expect(response.headers['cache-control']).toBe('no-store')
    } finally {
      countSpy.mockRestore()
    }
  })

  it('also works under the legacy /api prefix', async () => {
    const response = await request(server).get('/api/pictograms/all/es').set('If-None-Match', expectedETag)
    expect(response.status).toBe(304)
  })
})
