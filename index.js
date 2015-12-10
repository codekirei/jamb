'use strict'

//----------------------------------------------------------
// modules
//----------------------------------------------------------
// node
const p = require('path')

// npm
const P = require('bluebird')
const fs = require('fs-extra')
const md = require('markdown-it')()
  .use(require('markdown-it-highlightjs'))
const jade = require('jade')
const globby = require('globby')
const co = require('co')
const yaml = require('js-yaml')

// promisification
const read = P.promisify(fs.readFile)
const write = P.promisify(fs.outputFile)

//----------------------------------------------------------
// logic
//----------------------------------------------------------
module.exports = class Jamb {
  constructor(cfg) {
    this._previewDelim = '--MORE--'
    this._yamlDelim = '---'
    this._defaultTemplate = 'page'
    this._dist = cfg.dist
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

    return co(() => this.main()).catch(this.errs)
  }

  * main() {
    let posts = yield this.content(this._paths.posts)
    posts = this.ert(posts)
    const content = this.merge(
      this.sort(yield this.content(this._paths.pages)),
      this.sort(posts)
    )
    const templates = yield this.templates(this._paths.templates)
    const html = this.render(content, posts, templates)
    yield this.write(html)
    return Object.keys(html).map(this.url)
  }

  errs(err) {
    console.log(err.stack)
    throw new Error(err)
  }

  //----------------------------------------------------------
  // util methods
  //----------------------------------------------------------
  /**
    Shallow merge two objects with array values.
    @param {Object} to - merge to
    @param {Object} from - merge from
    @returns {Object} merged object
   */
  merge(to, from) {
    Object.keys(from).map(key => to[key]
      ? from[key].map(data => to[key].push(data))
      : to[key] = from[key]
    )
    return to
  }

  /**
    Sort data by template.
    @param {Object[]} dataArr - array of data objects
    @returns {Object} object with template keys and data array values
   */
  sort(dataArr) {
    return dataArr.reduce((accum, data) => {
      const template = data.template || this._defaultTemplate
      accum[template]
        ? accum[template].push(data)
        : accum[template] = [data]
      return accum
    }, {})
  }

  // TODO jsdoc
  url(page) {
    return page === 'index'
      ? `${page}.html`
      : `${page}${p.sep}index.html`
  }

  // TODO jsdoc
  markup(data, fn) {
    ['preview', 'content'].map(field => {
      if (data[field]) data[field] = fn(data[field]).trim()
    })
    return data
  }

  // TODO jsdoc
  write(out) {
    return Object.keys(out).map(page =>
      write(p.join(this._dist, this.url(page)), out[page])
    )
  }

  //----------------------------------------------------------
  // content methods
  //----------------------------------------------------------
  // TODO - JSDOC
  * content(glob) {
    const paths = yield globby(glob)
    return yield P.all(paths.map(path => read(path, 'utf8')))
      .map(strings => this.frontmatter(strings))
      .map(obj => this.preview(obj))
      .map(obj => this.markdown(obj))
  }

  /**
    Parse YAML frontmatter.
    @param {String} rawString - raw string from file
    @returns {Object} object with frontmatter and content
   */
  frontmatter(rawString) {
    const strings = rawString.split(this._yamlDelim)
    const dataObj = yaml.load(strings[1])
    dataObj.content = strings.slice(2).join(this._yamlDelim)
    return dataObj
  }

  /**
    Split content by preview separator.
    @param {Object} data - data object
    @returns {Object} data object
   */
  preview(data) {
    if (data.content.includes(this._previewDelim)) {
      const split = data.content.split(this._previewDelim)
      data.preview = split[0]
      data.content = split[1]
      return data
    }
    return data
  }

  /**
    Render markdown data fields.
    @param {Object} data - data object
    @returns {Object} data object
   */
  markdown(data) {return this.markup(data, val => md.render(val))}

  /**
    Generate estimated reading time from content wordcount.
    @param {Object[]} posts - array of post objects
    @returns {Object[]} mutated array of post objects
   */
  ert(posts) {
    posts.map(post => {
      post.ert = Math.ceil(post.content.split(' ').length / this._wpm)
    })
    return posts
  }

  //----------------------------------------------------------
  // template methods
  //----------------------------------------------------------
  // TODO jsdoc
  * templates(glob) {
    const paths = yield globby(glob)
    return yield P.all(paths.map(path => read(path, 'utf8')))
      .map(string => jade.compile(string, this._opts.jade))
      .reduce((accum, fn, i) => {
        accum[p.basename(paths[i], '.jade')] = fn
        return accum
      }, {})
  }

  // TODO jsdoc
  render(content, posts, templates) {
    const html = {}
    Object.keys(content).map(template => {
      content[template].map(data => {
        data.posts = posts
        html[data.url] = templates[template]({data})
      })
    })
    return html
  }
}
