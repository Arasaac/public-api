import client from 'prom-client'
import logger from '@arasaac/utils/logger'

type ApiMetric = {
  apiVersion: number,
  method: 'PUT' | 'GET' | 'POST' | 'DELETE' | 'UPDATE',
  statusCode: number,
  client?: string,
  url: string,
  locale: string
}

const counter = new client.Counter({
  name: 'publicapi_http_requests_total',
  help: 'Public Api requests',
  labelNames: ['apiVersion', 'method', 'statusCode', 'client', 'url', 'locale'] as const,
})

export const addMetricAPI = (data: ApiMetric) => {
  counter.inc(data)
  logger.debug(`Metric data added: ${JSON.stringify(data)}`)
}
