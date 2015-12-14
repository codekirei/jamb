import t from 'ava'
import s from 'sinon'
import f from 'faker'
import p from 'path'
import fs from 'fs-extra'

import { arsTo2DAr
       , arToOb
       , bufTransform
       , errHandler
       , flatAr
       , flatOb
       , genSitemap
       , read
       , readContent
       , readTemplates
       , write
       , write2D
       } from '../lib/utils'

t('arsTo2DAr', _ => _.same(
  arsTo2DAr(['a', 'b'], [1, 2])
  , [['a', 1], ['b', 2]]
))

t('arToOb', _ => _.same(
  arToOb(['a', 1])
  , {a: 1}
))

t('bufTransform', _ => {
  const str = f.fake('{{lorem.paragraph}}')
  const ob = {content: new Buffer(str)}
  const stub = s.stub().returns(`${str}123\n`)
  bufTransform(ob, stub)
  _.true(stub.calledOnce)
  _.true(stub.calledWith(str))
  _.same(
    ob
    , {content: new Buffer(`${str}123`)}
  )
})

t('errHandler', _ => {
  const err = new Error()
  const stub = s.stub(console, 'log')
  _.throws(() => errHandler(err))
  _.true(stub.called)
  stub.restore()
})

t('flatAr', _ => _.same(
  flatAr([[1, 2], [3, 4]])
  , [1, 2, 3, 4]
))

t('flatOb', _ => _.same(
  [{foo: ['a', 1]}, {bar: ['b', 2]}].reduce(flatOb)
  , {foo: ['a', 1], bar: ['b', 2]}
))

t.skip('read', async _ => {
  // use mock-fs
  const spy = s.spy(fs, 'readFile')
  await read(__filename)
  _.true(spy.calledOnce, 'called')
  _.true(spy.calledWith(__filename, 'utf8'), 'called with')
})

t.skip('readContent', async _ => {
  // use mock-fs
})

