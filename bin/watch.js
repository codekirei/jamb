'use strict'

// modules
//----------------------------------------------------------
const chokidar = require('chokidar')
const spawn = require('child_process').spawn
const clor = require('clor')

// state
//----------------------------------------------------------
let running = false
let count = 0

// fns
//----------------------------------------------------------
const log = data => console.log(data.toString())
const clear = () => spawn('clear').stdout.on('data', log)
const scale = num => num > 12 ? num - 12 : num
const prepend = num => num.length === 1 ? `0${num}` : num

// TODO add duration/elapsed field
// TODO cooler header box (see multispinner example)

function time() {
  const now = new Date()
  const h = scale(now.getHours())
  const m = prepend(now.getMinutes().toString())
  const s = prepend(now.getSeconds().toString())
  return `${h}:${m}:${s}`
}

function header(ct) {
  const delim = `||${'-'.repeat(58)}`
  const bars = '|| '
  clor
    .blue(delim).line
    .blue(bars).blue(`Time: ${time()}`).line
    .blue(bars).blue(`Count: ${ct}`).line
    .blue(delim).log()
}

function run() {
  header(count)
  const script = spawn('ava', {stdio: 'inherit'})
}

function debounce() {
  if (!running) {
    running = true
    count += 1
    clear().on('close', run)
    setTimeout(() => running = false, 50)
  }
}

chokidar.watch([
  'index.js',
  'test/**/*.js',
  'lib/**/*.js'
]).on('all', debounce)
