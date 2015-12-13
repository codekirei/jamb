import t from 'ava'
import s from 'sinon'
import f from 'faker'
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
