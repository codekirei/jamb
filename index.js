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

// local
const u = require('./lib/utils')
const errHandler     = u.errHandler
const flatAr         = u.flatAr
const flatOb         = u.flatOb
const genSitemap     = u.genSitemap
const obFrom2DAr     = u.obFrom2DAr
const readContent    = u.readContent
const readTemplates  = u.readTemplates
const write          = u.write
const write2D        = u.write2D
const x = require('./lib/transformers')
const addPaths        = x.addPaths
const compile         = x.compile
const defaultTemplate = x.defaultTemplate
const ert             = x.ert
const markdown        = x.markdown
const splitPreview    = x.splitPreview
const render          = x.render

//----------------------------------------------------------
// logic
//----------------------------------------------------------
module.exports = class Jamb {
  constructor(cfg) {
    this._previewDelim = '--MORE--'
    this._yamlDelim = '---'
    this._defaultTemplate = 'page'
    this._dist = cfg.dist
    this._needPosts = ['index']
    this._hostname = 'http://example.com'
    this._wpm = 225
    this._paths =
      { pages: cfg.pages
      , posts: cfg.posts
      , templates: cfg.templates
      , dist: cfg.dist
      }
    this._opts =
      { jade:
        { basedir: './test/fixtures/templates'
        , pretty: true
        }
        // TODO globby opts?
        // TODO markdown-it opts?
      }

    return co(() => this.main()).catch(errHandler)
  }

  // TODO - JSDOC
  * main() {
    const pages = yield this.pages(this._paths.pages)
    const posts = yield this.posts(this._paths.posts)
    const content = flatAr([pages, posts])

    const templates = yield this.templates(this._paths.templates)

    const html = render(this._needPosts)(content, posts, templates)
    yield write2D(html)

    const sitemapPath = p.join(this._paths.dist, 'sitemap.xml')
    const sitemap = genSitemap(content, this._hostname)
    yield write(sitemapPath, sitemap)

    return flatAr([html.map(_ => _[0]), [sitemapPath]])
  }

  // TODO - JSDOC
  * pages(glob) {
    return P.resolve(yield readContent(glob))
      .map(fm(this._yamlDelim))
      .map(splitPreview(this._previewDelim))
      .map(markdown)
      .map(defaultTemplate(this._defaultTemplate))
      .map(addPaths(this._paths.dist))
  }

  // TODO - jsdoc
  * posts(glob) {
    return P.resolve(yield this.pages(glob))
      .map(ert(this._wpm))
  }

  // TODO jsdoc
  * templates(glob) {
    return P.resolve(yield readTemplates(glob))
      .map(compile(this._opts.jade))
      .map(obFrom2DAr)
      .reduce(flatOb)
  }
}
