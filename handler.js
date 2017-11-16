require('babel-polyfill')

const fs = require('fs')
const cert = fs.readFileSync('.data/private-key.pem', 'utf8')
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'] + '/bin'
// Probot setup
const createProbot = require('./probot')
const probot = createProbot({
  id: process.env.APP_ID,
  secret: process.env.WEBHOOK_SECRET,
  cert: cert,
  port: 0
})

// Load Probot plugins from the `./plugin` folder
// You can specify plugins in an `index.js` file or your own custom file by providing
// a primary entry point in the "main" field of `./plugin/package.json`
// https://docs.npmjs.com/files/package.json#main
probot.load(require('./index.build.js'))

// Lambda Handler
module.exports.probotHandler = function (event, context, callback) {
  // Determine incoming webhook event type
  // Checking for different cases since node's http server is lowercasing everything
  const e = event.headers['x-github-event'] || event.headers['X-GitHub-Event']

  // Convert the payload to an Object if API Gateway stringifies it
  event.body = (
    typeof event.body === 'string'
  ) ? JSON.parse(event.body) : event.body

  try {
    if (!e || !event.body) {
      throw new Error('Payload not present or malformed.')
    }
    // Do the thing
    probot.receive({
      event: e,
      payload: event.body
    })
      .then((err) => {
        const res = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Executed'
          })
        }
        callback(null, res)
      })

  } catch (err) {
    callback(err)
  }

}
