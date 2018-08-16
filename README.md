# ssb-share

[scuttlebot](http://scuttlebutt.nz/) plugin for indexing private "share" messages.

## API

### `share.publish(content, links, recipients, callback)` (async)

Publish encrypted private messages to one or more recipients. Behaves similar to Scuttlesbot's `publish` method, but also takes an array of recipients (ssb public keys) and an array of links to send.

### `share.unbox(message)` (sync)

Decrypt a share message using your private key. Returns the decrypted message.

### `read(opts)` (sync)

Returns a stream of "share" messages. Takes query options similar to [ssb-query](https://github.com/dominictarr/ssb-query).

## License

This plugin is heavily based on ssb-private

MIT
