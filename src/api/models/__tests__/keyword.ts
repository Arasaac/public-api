import faker from 'faker'

import Keyword from '@arasaac/api/models/Keywords'
import { createKeyword } from '@arasaac/tests/keyword'
import db from '@arasaac/utils/db'

beforeAll(async () => {
  await db.open()
})

afterAll(async () => {
  await db.close()
})

describe('save', () => {
  it('should create a category', async () => {
    const keyword = createKeyword()
    const item = new Keyword(keyword)
    await item.save()

    const fetched = await Keyword.find({ language: keyword.language })

    expect(fetched).not.toBeNull()
    expect(fetched).toHaveLength(1)
    expect(new Set(fetched[0]!.words)).toEqual(new Set(keyword.words))
  })
})
