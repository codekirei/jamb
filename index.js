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
const errHandler    = u.errHandler
const flatAr        = u.flatAr
const flatOb        = u.flatOb
const arToOb        = u.arToOb
const readContent   = u.readContent
const readTemplates = u.readTemplates
const write         = u.write
const write2D       = u.write2D
const x = require('./lib/transformers')
const addAuthor       = x. addAuthor
const addCanonical    = x.addCanonical
const addPath         = x.addPath
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

  /**
    Main logic loop:
      - call methods (pages/posts/templates)
      - render content
      - write output

    @returns {String[]} array of all paths written to
   */
  * main() {
    const pages = yield this.pages(this.paths.pages)
    console.log(pages)
    const posts = yield this.posts(this.paths.posts)

    const content = flatAr([pages, posts])
    const injectedContent = injectPostData(this.needPosts, content, posts)

    const templates = yield this.templates(this.paths.templates)
    const html = render(injectedContent, templates)

    yield write2D(html)

    return html.map(_ => _[0])
  }

  /**
    Read and parse page content.

    @param {String|String[]} glob - glob of paths to page content
    @returns {Object[]} array of page data objects
   */
  * pages(glob) {
    return P.resolve(yield readContent(glob))
      .map(fm(this.delims.yaml))
      .map(splitPreview(this.delims.preview))
      .map(markdown)
      .map(addAuthor(this.defaultAuthor))
      .map(defaultTemplate(this.defaultTemplate))
      .map(addCanonical(this.hostname))
      .map(addPath(this.paths.dist))
  }

  /**
    Read and parse post content.

    @param {String|String[]} glob - glob of paths to post content
    @returns {Object[]} array of post data objects
   */
  * posts(glob) {
    return P.resolve(yield this.pages(glob))
      .map(ert(this.wpm))
  }

  /**
    Read and compile templates.

    @param {String|String[]} glob - glob of paths to templates
    @returns {Object} templates: {foo: renderFn, bar: renderFn}
   */
  * templates(glob) {
    return P.resolve(yield readTemplates(glob))
      .map(compile(this.opts.jade))
      .map(arToOb)
      .reduce(flatOb)
  }
}
