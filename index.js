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
    this._opts = {
      jade: {
        basedir: './test/fixtures/templates',
        pretty: true
      }
    }
    // globby opts
    // jade opts
    // markdown-it opts
    return co(
      function* () {
        const posts = yield this.content(cfg.posts)
        const content = this.merge(
          this.sort(yield this.content(cfg.pages)),
          this.sort(posts)
        )
        const templates = yield this.templates(cfg.templates)
        // return content
        return templates
      }.bind(this)
    ).catch(err => {
      console.log(err.stack)
      throw new Error(err)
    })
  }

  //----------------------------------------------------------
  // util fns
  //----------------------------------------------------------
  /**
    Shallow merge two objects with array values.
    @param {Object} to - merge to
    @param {Object} from - merge from
    @returns {Object} merged object
   */
  merge(to, from) {
    Object.keys(from).map(key =>
      to[key]
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
      if (data.template) delete data.template
      accum[template]
        ? accum[template].push(data)
        : accum[template] = [data]
      return accum
    }, {})
  }

  //----------------------------------------------------------
  // content fns
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
      const halves = data.content.split(this._previewDelim)
      data.preview = halves[0]
      data.content = halves[1]
      return data
    }
    return data
  }

  /**
    Render markdown data fields.
    @param {Object} data - data object
    @returns {Object} data object
   */
  markdown(data) {
    ['preview', 'content'].map(field => {
      if (data[field]) data[field] = md.render(data[field]).trim()
    })
    return data
  }

  //----------------------------------------------------------
  // template fns
  //----------------------------------------------------------
  * templates(glob) {
    const paths = yield globby(glob)
    return yield P.all(paths.map(path => read(path, 'utf8')))
      .map(string => jade.compile(string, this._opts.jade))
      .reduce((accum, fn, i) => {
        accum[p.basename(paths[i], '.jade')] = fn
        return accum
      }, {})
  }
}

// function render(content, posts, templates) {
//   const pages = {}
//   Object.keys(content).map(template => {
//     content[template].map(data => {
//       data.posts = posts
//       pages[data.url] = templates[template]({data})
//     })
//   })
//   return pages
// }

// function write(html) {
//   return Object.keys(html).map(url => {
//     const path = url === 'index'
//       ? `${url}.html`
//       : `${url}${p.sep}index.html`
//     fs.outputFileSync(p.join('dist', path), html[url])
//   })
// }

// function blog(cb) {
//   const content = merge(
//     getContentByTemplate('src/content'),
//     getContentByTemplate('src/content/posts')
//   )
//   const posts = getContent('src/content/posts')
//   const templates = getTemplates('src/templates')
//   const html = render(content, posts, templates)
//   write(html)
//   return cb()
// }
