'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// npm
const P = require('bluebird')
const co = require('co')

// local
const u = require('./lib/utils')
const binaryArrToObj = u.binaryArrToObj
const errHandler     = u.errHandler
const readContent    = u.readContent
const readTemplates  = u.readTemplates
const shallowMerge   = u.shallowMerge
const writeObj       = u.writeObj
const x = require('./lib/transformers')
const compile         = x.compile
const defaultTemplate = x.defaultTemplate
const ert             = x.ert
const frontmatter     = x.frontmatter
const groupByTemplate = x.groupByTemplate
const markdown        = x.markdown
const outPath         = x.outPath
const preview         = x.preview
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
    const content = shallowMerge(
      groupByTemplate(pages),
      groupByTemplate(posts)
    )

    const templates = yield this.templates(this._paths.templates)

    const html = render(this._needPosts)(content, posts, templates)

    yield writeObj(html)

    return Object.keys(html)
  }

  // TODO - JSDOC
  * pages(glob) {
    return P.resolve(yield readContent(glob))
      .map(frontmatter(this._yamlDelim))
      .map(preview(this._previewDelim))
      .map(markdown)
      .map(defaultTemplate(this._defaultTemplate))
      .map(outPath(this._paths.dist))
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
      .reduce(binaryArrToObj, {})
  }
}
