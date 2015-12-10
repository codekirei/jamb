'use strict'

const Jamb = require('../')

const cfg = {
  pages: 'test/fixtures/content/*.md',
  posts: 'test/fixtures/content/posts/*.md',
  templates: 'test/fixtures/templates/*.jade',
  dist: 'test/dist'
}
new Jamb(cfg)
  .then(console.log)
