'use strict'

const Jamb = require('../')

const cfg = {
  pages: 'test/fixtures/content/*.md',
  posts: 'test/fixtures/content/posts/*.md'
}
new Jamb(cfg)
  .then(console.log)
