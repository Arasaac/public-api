#!/usr/bin/env node

const nodemon = require('nodemon')

if (process.env.NODE_ENV === 'production') {
  console.error('Do not use nodemon in production, run bin/www directly instead.')
  process.exitCode = 1
  return
}

nodemon({
  watch: ['src'],
  ext: 'ts, js, json',
  ignore: ['src/**/__tests__/*'],
  exec: 'ts-node -r tsconfig-paths/register ./src/app.ts',
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
    console.log('The application has quit')
    process.exit(0)
  })
