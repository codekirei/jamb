import t from 'ava'
import p from 'path'
import s from 'sinon'
import f from 'faker'
import jade from 'jade'

import { addAuthor
       , addCanonical
       , addDate
       , addDateOb
       , addDateNum
       , addNav
       , addPath
       , assignSplits
       , byReverseDate
       , compile
       , defaultTemplate
       , ert
       , ertCalc
       , injectPostData
       , makeCanonical
       , markdown
       , parseDate
       , render
       , splitPreview
       } from '../lib/transformers'

t('addAuthor', _ => {
  const ob = {foo: 'bar'}
  const bob =
    { name: 'Bob Loblaw'
    , link: 'http://bobloblawlawblog.com'
    , email: 'bobloblaw@bobloblawlawblog.com'
    }
  _.same(
    addAuthor(bob)(ob)
    , {foo: 'bar', author: bob}
  )
})

t('addCanonical', _ => {
  const ob = {slug: '/about'}
  const host = 'http://test.com'
  _.same(
    addCanonical(host)(ob).canonical
    , makeCanonical(host, ob.slug)
  )
})

t('addDate', _ => {
  const date = '2015-12-18T13:37-08:00'
  const ob = {dateOb: new Date(date)}
  _.same(
    addDate(ob).date
    , parseDate(ob.dateOb)
  )
})

t('addDateOb', _ => {
  const date = '2015-12-18T13:37-08:00'
  const ob = {posted: date}
  _.same(
    addDateOb(ob).dateOb
    , new Date(date)
  )
})

t.skip('addOutPath', _ => {
  const ob = {sitemapUrl: 'foo/bar'}
  const dist = 'a/path'
  addOutPath(dist)(ob)
  _.same(
    ob
    , {sitemapUrl: 'foo/bar', out: p.join(dist, 'foo/bar')}
  )
})

t.skip('addSitemapUrl', _ => {
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
    , new Buffer('foo', 'utf8')
    , 'preview'
  )
  _.same(
    ob.content
    , new Buffer('bar', 'utf8')
    , 'content'
  )
})

t('compile', _ => {
  const spy = s.spy(jade, 'compile')
  const opts = {pretty: true}
  const template = ['foo/bar/index.jade', '<div>hello world</div>']
  const res = compile(opts)(template)
  _.is(res[0], 'index', 'basename')
  _.true(spy.calledOnce, 'called')
  _.true(spy.calledWith(template[1], opts), 'called with')
})

t('defaultTemplate', _ => {
  const def = 'index'
  const has = {template: 'blog'}
  const needs = {};
  [has, needs].map(defaultTemplate(def))
  _.is(has.template, 'blog', 'does nothing')
  _.is(needs.template, 'index', 'assigns default')
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
  const mins = 5
  const buf = new Buffer('word '.repeat(wpm * mins - 1), 'utf8')
  _.is(ertCalc(buf, wpm), mins)
})
