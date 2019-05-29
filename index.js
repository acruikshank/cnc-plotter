const express = require('express');
const app = express();
const Worker = require('tiny-worker')
const fs = require('fs')
const gcode = require('./gcode')
const boundedPlotter = require('./public/bounded_plotter')

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/scripts/:script.svg', function (req, res) {
  res.set('Content-Type', 'image/svg+xml')
  process.chdir(__dirname + '/public')
  var worker = new Worker(req.params.script+'.js')
  var points = [], penDown = false;

  worker.onmessage = function(e) {
    var commands = e.data;
    commands.forEach(function(c,i) {
      switch (c.code) {
        case 1: points.push((penDown ? 'L' : 'M') + c.x.toFixed(3)
                  + ',' + c.y.toFixed(3));                break;
        case 2: penDown = c.x > 0;                        break;
        case 3: penDown = false;                          break;
      }
    })
    if (commands.length)
      worker.postMessage({count:1000})
    else
      res.render('svg', {path: points.join('')})
  }
  worker.postMessage({count:1000})
});

app.get('/scripts/:script.gcode', function (req, res) {
  let file = `${__dirname}/gcode/${req.params.script}.gcode` // not for public consuption

  let ws = fs.createWriteStream(file)
  const config = readConfig()
  const gcodeWriter = gcode(config, ws)
  const plotter = boundedPlotter.create(config, gcodeWriter)
  plotter.header()

  process.chdir(__dirname + '/public')

  let worker = new Worker(req.params.script+'.js')
  let points = [], penDown = false;

  worker.onmessage = function(e) {
    let commands = e.data;
    let movement = gcodeWriter.quick
    commands.forEach(function(c,i) {
      switch (c.code) {
        case 1: plotter.move(c.x, c.y); break;
        case 2: plotter.pendown();      break;
        case 3: plotter.penup();        break;
      }
    })
    if (commands.length) {
      worker.postMessage({count:1000})
    } else {
      plotter.footer();
      ws.close();
      res.send(`rendered to ${file} at ${new Date()}`)
    }
  }
  worker.postMessage({count:1000})
});

app.get('/scripts/:script', function (req, res) {
  const config = readConfig()
  res.render('preview', {script: req.params.script, config: config})
});

app.listen(9090, function () {
  console.log('listening on port 9090');
});

function readConfig() {
  let configFile = fs.readFileSync(`${__dirname}/config.json`)
  return JSON.parse(configFile)
}
