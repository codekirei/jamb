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
    // default template
    // jade opts
    // frontmatter delimiter
    // markdown-it opts
    // return co(this.content(cfg.content))
    return co(
      function* () {
        return yield this.content(cfg.content)
      }.bind(this)
    ).catch(err => {
      console.log(err.stack)
      throw new Error(err)
    })
  }
  /**
    Split data.body by preview separator.
    @param {Object} data - data object
    @returns {Object} data object
   */
  preview(data) {
    if (data.body.includes(this.previewSep)) {
      const split = data.body.split(this.previewSep)
      data.preview = split[0]
      data.body = split[1]
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
    Array.from('preview', 'body').map(key => {
      if (data[key]) data[key] = md.render(data[key]).trim()
    })
    return data
  }
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
    Parse YAML frontmatter.
    @param {String} rawString - raw string from file
    @returns {Object} object with frontmatter and content
   */
  frontmatter(rawString) {
    const strings = rawString.split('---')
    const dataObj = yaml.load(strings[1])
    dataObj.content = strings.slice(2).join('---')
    return dataObj
  }
  // TODO - JSDOC
  * content(glob, opts) {
    const paths = yield globby(glob, opts)
    const raws = yield P.all(paths.map(path => read(path, 'utf8')))
    return raws.map(this.frontmatter)
    // return raws
    //   .map(this)
    // return P.all(globby(glob, opts)
    //   .then(res => res.map(path => read(path, 'utf8'))))
        // .map(this.frontmatter)
        // .map(this.preview)
        // .map(this.markdown)
    // )
  }
  /**
    Sort and group data by template.
    @param {Object[]} dataArr - array of data objects
    @returns {Object} object with template keys and data array values
   */
  group(dataArr) {
    return dataArr.reduce((accum, data) => {
      const template = data.template || this.defaultTemplate
      if (data.template) delete data.template
      accum[template]
        ? accum[template].push(data)
        : accum[template] = [data]
      return accum
    }, {})
  }
  templates(glob, opts) {
    return globby(glob, opts).then(res => res
      .map
    )
  }
}

function getTemplates(dir) {
  return fs.readdirSync(dir)
    .filter(path => p.extname(path) === '.jade')
    .map(path => [p.basename(path, '.jade'), p.join(dir, path)])
    .map(_ => [_[0], fs.readFileSync(_[1], 'utf8')])
    .map(_ => [_[0], jade.compile(_[1], jadeOpts)])
    .reduce(toTemplatesObj, {})
}

const jadeOpts = {
  basedir: './src/templates',
  pretty: true
}

// shouldn't need this -> use custom front-matter parser with js-yaml
function unwrapAttrs(obj) {
  Object.keys(obj.attributes).map(key => {
    obj[key] = obj.attributes[key]
  })
  delete obj.attributes
  return obj
}

// function getContent(dir) {
//   return fs.readdirSync(dir)
//     .filter(path => p.extname(path) === '.md')
//     .map(path => fs.readFileSync(p.join(dir, path), 'utf8'))
//     .map(fm)
//     .map(split)
//     .map(renderMd)
//     .map(unwrapAttrs)
// }

// function getContentByTemplate(dir) {
//   return getContent(dir)
//     .reduce(groupByTemplate, {})
// }

// -- TODO --

// function toTemplatesObj(accum, pair) {
//   accum[pair[0]] = pair[1]
//   return accum
// }

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
