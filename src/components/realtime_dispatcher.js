import { Socket } from "phoenix";

class RealtimeDispatcher {
  constructor({ url, events, socketSessionId }) {
    this.socket = new Socket(url);
    this.events = events;
    this.socket.connect();
    this.connectedChannels = {};
    this.connectedGroupRefs = {};
    this.socketSessionId = socketSessionId;

    this.events.on("realtime:subscribe-topic", ({ topic }, groupRef) =>
      this.subscribeToTopic(topic, groupRef)
    );
    this.events.on("realtime:unsubscribe-topic", ({ topic }, groupRef) =>
      this.unsubscribeFromTopic(topic, groupRef)
    );
  }

  setSocketSessionId(socketSessionId) {
    this.socketSessionId = socketSessionId;
  }

  getSocketSessionId() {
    return this.socketSessionId;
  }

  getSocketSessionTopic() {
    return this.socketSessionId ? `session:${this.socketSessionId}` : null;
  }

  isSubscribedToChannel(topicName) {
    return this.getConnectedChannel(topicName).refCounter > 0;
  }

  getConnectedChannel(topicName) {
    return (
      this.connectedChannels[topicName] || { refCounter: 0, channel: null }
    );
  }

  incrementRefCounterForChannel(topicName) {
    this.getConnectedChannel(topicName).refCounter++;
  }

  decrementRefCounterForChannel(topicName) {
    this.getConnectedChannel(topicName).refCounter--;
  }

  deleteChannelRef(topicName) {
    delete this.connectedChannels[topicName];
  }

  newChannelRef(topicName, channel) {
    this.connectedChannels[topicName] = {
      refCounter: 1,
      channel: channel,
    };
  }

  getConnectedGroupRef(groupRef) {
    return this.connectedGroupRefs[groupRef];
  }

  addConnectedGroupRef(groupRef, topicName) {
    if (!groupRef) {
      return;
    }

    let group = this.getConnectedGroupRef(groupRef);
    if (group) {
      console.log(`Adding topic ${topicName} to groupRef ${groupRef}`);

      group.topics.push(topicName);
    } else {
      console.log(`Creating new groupRef ${groupRef} with topic ${topicName}`);

      this.newConnectedGroupRef(groupRef, topicName);
      // New groupRef, we listen for groupRef stop event
      this.events.on(`${groupRef}:stop`, () => this.stopGroupRef(groupRef));
    }
  }

  stopGroupRef(groupRef) {
    console.log(`GroupRef ${groupRef}, stops, unsubscribing topics`);

    let group = this.getConnectedGroupRef(groupRef);
    if (group) {
      group.topics.map((topic) => {
        // We give null for groupRef in this following function so that
        // the unsubscribe process does not change connectedGroupRefs
        this.unsubscribeFromTopic(topic, null);
      });
      this.deleteConnectedGroupRef(groupRef);
    }
  }

  deleteConnectedGroupRef(groupRef) {
    delete this.connectedGroupRefs[groupRef];
  }

  newConnectedGroupRef(groupRef, topicName) {
    this.connectedGroupRefs[groupRef] = {
      topics: [topicName],
    };
  }

  sendEventTopicJoined(topicName) {
    this.events.emit(`${topicName}:joined`, { success: true });
  }

  sendEventTopicJoinError(topicName, error) {
    this.events.emit(`${topicName}:joined`, { success: false, error });
  }

  removeTopicForConnectedGroupRef(groupRef, topicName) {
    if (!groupRef) {
      return;
    }

    let group = this.getConnectedGroupRef(groupRef);
    if (group) {
      const index = group.topics.indexOf(topicName);
      if (index > -1) {
        group.topics.splice(index, 1);
      }

      console.log(`Removing topic ${topicName} from groupRef ${groupRef}`);

      // If there is no more topic we stop listening for groupRef stop event
      // And we remove the connectedGroupRef
      if (group.topics.length == 0) {
        console.log(`No more topic for groupRef ${groupRef}, deleting it`);

        this.events.removeListener(`${groupRef}:stop`, function() {});
        this.deleteConnectedGroupRef(groupRef);
      }
    }
  }

  subscribeToTopic(topicName, groupRef) {
    this.addConnectedGroupRef(groupRef, topicName);

    if (this.isSubscribedToChannel(topicName)) {
      this.incrementRefCounterForChannel(topicName);
      this.sendEventTopicJoined(topicName);
      return this.getConnectedChannel(topicName).channel;
    } else {
      let channel = this.socket.channel(topicName, {});
      const this_ = this;

      channel
        .join()
        .receive("ok", () => {
          console.log(`realtime connected to ${topicName}`);
          this_.sendEventTopicJoined(topicName);
        })
        .receive("error", ({ reason }) => {
          console.log(`failed join ${topicName}`, reason);
          this_.sendEventTopicJoinError(topicName, reason);
        })
        .receive("timeout", () => {
          console.log(`Networking issue. Still waiting for topic ${topicName}`);
          this_.sendEventTopicJoinError(topicName, "timeout");
        });

      channel.on("message", (messagePayload) =>
        this.onMessage(topicName, messagePayload)
      );

      this.newChannelRef(topicName, channel);

      return channel;
    }
  }

  unsubscribeFromTopic(topicName, groupRef) {
    this.removeTopicForConnectedGroupRef(groupRef, topicName);
    this.decrementRefCounterForChannel(topicName);

    if (!this.isSubscribedToChannel(topicName)) {
      this.unsubscribeFromChannel(
        this.getConnectedChannel(topicName).channel,
        groupRef
      );
    }
  }

  unsubscribeFromChannel(channel, groupRef, callback) {
    if (!channel) {
      return;
    }

    if (!callback)
      callback = () => {
        console.log(`Left from channel ${channel.topic}`);
        this.deleteChannelRef(channel.topic);
      };
    channel.leave().receive("ok", callback);
  }

  onMessage(topic, messagePayload) {
    const realTopic =
      topic == this.getSocketSessionTopic() ? "session:current-session" : topic;
    console.log("RealtimeDispatcher#onMessage: ", realTopic, messagePayload);
    switch (messagePayload.type) {
      case "welcome":
        break;
      case "notify":
        this.events.emit(realTopic, {
          metadata: messagePayload.metadata,
          event: messagePayload.event,
        });
        break;
      default:
        console.log("Unexpected realtime message: ", messagePayload.metadata);
    }
  }
}

export default RealtimeDispatcher;
