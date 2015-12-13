import t from 'ava'
import p from 'path'
import s from 'sinon'
import f from 'faker'
import jade from 'jade'

import { addOutPath
       , addSitemapUrl
       , assignSplits
       , compile
       , defaultTemplate
       , ert
       , ertCalc
       , injectPostData
       , markdown
       , render
       , splitPreview
       , urlToPath
       } from '../lib/transformers'

t('addOutPath', _ => {
  const ob = {sitemapUrl: 'foo/bar'}
  const dist = 'a/path'
  addOutPath(dist)(ob)
  _.same(
    ob
    , {sitemapUrl: 'foo/bar', out: p.join(dist, 'foo/bar')}
  )
})

t('addSitemapUrl', _ => {
  const ob = {url: 'posts/post1'}
  addSitemapUrl(ob)
  _.ok(ob.sitemapUrl, 'key exists')
  _.same(
    ob.sitemapUrl
    , urlToPath(ob.url)
    , 'val is correct'
  )
})

t('assignSplits', _ => {
  const strs = ['foo', 'bar']
  const ob = {}
  assignSplits(strs, ob)
  _.same(
    ob.preview
    , new Buffer('foo', 'utf8'), 'preview'
  )
  _.same(
    ob.content
    , new Buffer('bar', 'utf8'), 'content'
  )
})

t('compile', _ => {
  const spy = s.spy(jade, 'compile')
  const opts = {pretty: true}
  const template = ['foo/bar/index.jade', '<div>hello world</div>']
  const res = compile(opts)(template)
  _.true(spy.calledOnce, 'called')
  _.true(spy.calledWith(template[1], opts), 'called with')
  _.is(res[0], 'index', 'basename')
})

t('defaultTemplate', _ => {
  const def = 'index'
  const has = {template: 'blog'}
  const needs = {};
  [has, needs].map(defaultTemplate(def))
  _.is(has.template, 'blog', 'does nothing when not needed')
  _.is(needs.template, 'index', 'assigns default when needed')
})

t('ert', _ => {
  const content = new Buffer(f.fake('{{lorem.paragraph}}'), 'utf8')
  const wpm = 225
  const ob = {content}
  ert(225)(ob)
  _.is(ob.ert, ertCalc(content, 225))
})

t('ertCalc', _ => {
  const wpm = 225
  const buf = new Buffer('t '.repeat(wpm * 3 - 1), 'utf8')
  _.is(ertCalc(buf, wpm), 3)
})
