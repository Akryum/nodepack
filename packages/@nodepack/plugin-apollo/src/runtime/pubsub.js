import { PubSub } from 'apollo-server-express'
import events from 'events'

export function createDefaultPubsub () {
  const eventEmitter = new events.EventEmitter()
  eventEmitter.setMaxListeners(Infinity)
  return new PubSub({
    eventEmitter,
  })
}
