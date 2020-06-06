import RealtimeDispatcher from './components/realtime_dispatcher';

export const startRealtime = ({ socketSessionId, url, events }) => {
  window.Realtime = new RealtimeDispatcher({ socketSessionId, url, events });

  if (window.Realtime.getSocketSessionTopic()) {
    window.Realtime.subscribeToTopic(window.Realtime.getSocketSessionTopic());
  }
};

export const updateSocketSessionId = (socketSessionId) => {
  if (window.Realtime.getSocketSessionTopic()) {
    window.Realtime.unsubscribeFromTopic(window.Realtime.getSocketSessionTopic());
  }

  window.Realtime.setSocketSessionId(socketSessionId);

  if (window.Realtime.getSocketSessionTopic()) {
    window.Realtime.subscribeToTopic(window.Realtime.getSocketSessionTopic());
  }
};

export const stopRealtime = () => {
  if (window.Realtime.getSocketSessionTopic()) {
    window.Realtime.unsubscribeFromTopic(window.Realtime.getSocketSessionTopic());
  }
};
