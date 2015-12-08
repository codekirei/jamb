'use strict'

const Jamb = require('../')

new Jamb({content: 'test/fixtures/content/**/*.md'})
  .then(console.log)
