var ssbKeys = require('ssb-keys')
var FlumeQueryLinks = require('flumeview-query/links')
var explain = require('explain-error')
var pull = require('pull-stream')

var toUrlFriendly = require('base64-url').escape

var indexes = [
  { key: 'TSP', value: ['timestamp'] },
  { key: 'ATY', value: [['value', 'author'], ['value', 'content', 'type'], 'timestamp'] }
]

var indexVersion = 2

exports.name = 'share'
exports.version = require('./package.json').version
exports.manifest = {
  publish: 'async',
  unbox: 'sync',
  read: 'source'
}

exports.init = function (ssb, config) {
  var index = ssb._flumeUse(
    `share-${toUrlFriendly(ssb.id.slice(1, 10))}`,
    FlumeQueryLinks(indexes, (msg, emit) => {
      if (msg.value.share === true)
        emit(msg)
    }, indexVersion)
  )

  return {
    read: function (opts) {
      opts.unlinkedValues = true
      return index.read(opts)
    },

    unbox: function (msgOrData) {
      if (typeof msgOrData === 'string') {
        try {
          var data = ssbKeys.unbox(msgOrData, ssb.keys.private)
          data = JSON.parse(data)
        } catch (e) {
          throw explain(e, 'failed to decrypt')
        }
        return data
      } else if (msgOrData && msgOrData.value && typeof msgOrData.value.content === 'string') {
        var value = unboxValue(msgOrData.value)
        if (value) {
          return {
            key: msgOrData.key, value: value, timestamp: msgOrData.timestamp
          }
        }
      }
    },

    publish: function (content, links, recps, cb) {
      try {
        var plainJson = JSON.stringify({
          content: content,
          links: links
        })
        var ciphertext = ssbKeys.box(plainJson, recps)
      } catch (e) {
        return cb(explain(e, 'failed to encrypt'))
      }
      ssb.publish(ciphertext, cb)
    }
  }

  function unboxValue (value) {
    var jsonData = null
    try {
      jsonData = ssbKeys.unbox(value.content, ssb.keys.private)
    } catch (ex) {
      explain(ex, 'failed to decrypt')
    }
    if (!jsonData) return null
    return {
      previous: value.previous,
      author: value.author,
      sequence: value.sequence,
      timestamp: value.timestamp,
      hash: value.hash,
      content: jsonData.content,
      links: jsonData.links,
      share: true
    }
  }
}
