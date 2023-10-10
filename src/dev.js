#!/usr/bin/env node

const ngrok = require('ngrok')
const nodemon = require('nodemon')

if (process.env.NODE_ENV === 'production') {
  console.error('Do not use nodemon in production, run bin/www directly instead.')
  process.exitCode = 1
  return
}

;(async function () {
  try {
    const url = await ngrok.connect({
      proto: 'http',
      addr: '3000',
    })
    console.log(`ngrok tunnel opened at: ${url}`)
    console.log('Open the ngrok dashboard at: http://localhost:4040/inspect/http\n')

    nodemon({
      watch: ['src'],
      ext: 'ts, js, json',
      ignore: ['src/**/__tests__/*'],
      exec: 'NGROK_URL=${url} ts-node -r tsconfig-paths/register ./src/app.ts',
    })
      .on('start', () => {
        console.log('The application has started')
      })
      .on('restart', (files) => {
        console.group('Application restarted due to:')
        files.forEach((file) => console.log(file))
        console.groupEnd()
      })
      .on('quit', () => {
        console.log('The application has quit, closing ngrok tunnel')
        ngrok.kill().then(() => process.exit(0))
      })
  } catch (error) {
    console.error('Error opening ngrok tunnel: ', error)
    process.exitCode = 1
  }
})()
