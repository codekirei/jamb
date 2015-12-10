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

//----------------------------------------------------------
// global constants
//----------------------------------------------------------
const enc = 'utf8'

//----------------------------------------------------------
// promisification
//----------------------------------------------------------
const read = path => P.promisify(fs.readFile)(path, enc)
const write = P.promisify(fs.outputFile)

//----------------------------------------------------------
// shortcuts
//----------------------------------------------------------
const buf = str => new Buffer(str, enc)

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
    console.log(posts)
    // posts = this.ert(posts)
    // const content = this.merge(
    //   this.sort(yield this.content(this._paths.pages)),
    //   this.sort(posts)
    // )
    // const templates = yield this.templates(this._paths.templates)
    // const html = this.render(content, posts, templates)
    // yield this.write(html)
    // return Object.keys(html).map(this.url)
  }

  errs(err) {
    console.log(err.stack)
    throw new Error(err)
  }

  //----------------------------------------------------------
  // util methods
  //----------------------------------------------------------
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
    return yield P.all(paths.map(read))
      .map(frontmatter(this._yamlDelim))
      .map(preview(this._previewDelim))
      .map(markdown)
      .map(out)
  }

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

function frontmatter(delim) {
  return function(string) {
    const strings = string.split(delim)
    const dataObj = yaml.load(strings[1])
    dataObj.content = buf(strings.slice(2).join(delim))
    return dataObj
  }
}

function preview(delim) {
  return function(data) {
    const str = data.content.toString()
    if (str.includes(delim)) {
      const split = str.split(delim)
      data.preview = buf(split[0])
      data.content = buf(split[1])
      return data
    }
    return data
  }
}

/**
  Shallow merge two objects with array values.
  @param {Object} to - merge to
  @param {Object} from - merge from
  @returns {Object} merged object
  */
function shallowMerge(to, from) {
  Object.keys(from).map(key => to[key]
    ? from[key].map(data => to[key].push(data))
    : to[key] = from[key]
  )
  return to
}

// TODO jsdoc
function bufTransform(data, fn) {
  ['preview', 'content'].map(key => {
    if (data[key]) data[key] = buf(fn(data[key].toString()).trim())
  })
  return data
}

/**
  Render markdown data fields.
  @param {Object} data - data object
  @returns {Object} data object
  */
const markdown = data => bufTransform(data, val => md.render(val))

// TODO jsdoc
function out(data) {
  const url = data.url
  data.out = url === 'index' ? `${url}.html` : `${url}${p.sep}index.html`
  return data
}
