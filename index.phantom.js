/* This is a phantomjs script and needs to be run with the phantomjs binary */

var system = require('system')
var page = require('webpage').create()
page.viewportSize = { width: 1, height: 1 }

var _timeout = setTimeout(function () {
  phantom.exit(1)
}, 10000)


var interval = system.env.INTERVAL || system.env.interval || 1000 // milliseconds
var channel = system.env.CHANNEL || system.env.channel // milliseconds

if (!channel) throw new Error('Error: Missing enviroment variable CHANNEL=<string>')

var URL_TEMPLATE = "https://www.twitch.tv/$channel/chat?popout"
var url = URL_TEMPLATE.replace('$channel', channel)

function emit (json) {
  console.log(JSON.stringify(json))
}

emit({
  type: 'info',
  text: 'opening page...'
})

page.open(url, function (status) {
  if (status !== 'success') {
    emit({
      type: 'info',
      text: 'failed to open page'
    })
    phantom.exit(1)
  } else {
    emit({
      type: 'info',
      text: 'page opened'
    })
    // start polling the DOM for changes
    setTimeout(tick, interval)
    function tick () {
      var data = page.evaluate(function () {
        var lines = document.querySelectorAll('.chat-messages .tse-content .chat-line')

        var messages = [].map.call(lines, function (line) {
          var from = line.querySelector('.from').textContent
          var text = line.querySelector('.message').textContent
          var html = line.querySelector('.message').innerHTML

          return {
            type: 'chat',
            from: from,
            text: text,
            html: html,
          }
        })

        // remove the parsed messages from the DOM
        ;[].forEach.call(lines, function (line) {
          line.parentNode.removeChild(line)
        })

        // return the data back to our script context
        // (outside of page.evaluate)
        return messages
      })

      // console.log(data)

      // spit out the data
      if (data && data.length > 0) {
        emit({
          type: 'messages',
          messages: data
        })
      }

      emit({
        type: 'info',
        text: 'DOM polled'
      })

      setTimeout(tick, interval)
    }
  }
})
