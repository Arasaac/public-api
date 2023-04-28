import { faker } from '@faker-js/faker'
import Keyword, { IKeyword } from '@arasaac/api/models/Keywords'

export interface BBDDKeyword extends IKeyword {
  _id: string
}

export function createKeyword(): IKeyword {
  const language = faker.helpers.arrayElement(['en', 'es', 'fr'])
  const words = faker.lorem.words(10).split(' ')

  return {
    language,
    words,
  }
}

export async function loadKeyword(): Promise<BBDDKeyword> {
  const keyword = createKeyword()
  const dbKeyword = new Keyword(keyword)
  await dbKeyword.save()
  return { ...keyword, _id: dbKeyword._id.toString() }
}
