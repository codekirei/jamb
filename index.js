'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const P = require('bluebird')
const co = require('co')
const fm = require('yaml-fm')
const merge = require('lodash.merge')

// local
const defaults = require('./lib/defaults')
const u = require('./lib/utils')
const errHandler     = u.errHandler
const flatAr         = u.flatAr
const flatOb         = u.flatOb
const genSitemap     = u.genSitemap
const arToOb     = u.arToOb
const readContent    = u.readContent
const readTemplates  = u.readTemplates
const write          = u.write
const write2D        = u.write2D
const x = require('./lib/transformers')
const addOutPath      = x.addOutPath
const addSitemapUrl   = x.addSitemapUrl
const compile         = x.compile
const defaultTemplate = x.defaultTemplate
const ert             = x.ert
const injectPostData  = x.injectPostData
const markdown        = x.markdown
const splitPreview    = x.splitPreview
const render          = x.render

//----------------------------------------------------------
// logic
//----------------------------------------------------------
module.exports = class Jamb {
  constructor(custom) {
    const opts = merge({}, defaults, custom)
    Object.keys(opts).map(k => this[k] = opts[k])
    return co(() => this.main()).catch(errHandler)
  }

  // TODO - JSDOC
  * main() {
    const pages = yield this.pages(this.paths.pages)
    const posts = yield this.posts(this.paths.posts)

    const content = flatAr([pages, posts])
    const injectedContent = injectPostData(this.needPosts, content, posts)

    const templates = yield this.templates(this.paths.templates)
    const html = render(injectedContent, templates)

    const sitemapPath = p.join(this.paths.dist, 'sitemap.xml')
    const sitemap = genSitemap(content, this.hostname)

    yield write2D(html)
    yield write(sitemapPath, sitemap)

    return flatAr([html.map(_ => _[0]), [sitemapPath]])
  }

  // TODO - JSDOC
  * pages(glob) {
    return P.resolve(yield readContent(glob))
      .map(fm(this.delims.yaml))
      .map(splitPreview(this.delims.preview))
      .map(markdown)
      .map(defaultTemplate(this.defaultTemplate))
      .map(addSitemapUrl)
      .map(addOutPath(this.paths.dist))
  }

  // TODO - jsdoc
  * posts(glob) {
    return P.resolve(yield this.pages(glob))
      .map(ert(this.wpm))
  }

  // TODO jsdoc
  * templates(glob) {
    return P.resolve(yield readTemplates(glob))
      .map(compile(this.opts.jade))
      .map(arToOb)
      .reduce(flatOb)
  }
}
