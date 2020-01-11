import RealtimeDispatcher from './components/realtime_dispatcher';

export const startRealtime = ({ socketSessionId, url, events }) => {
  window.Realtime = new RealtimeDispatcher({ url, events });

  if (socketSessionId) {
    window.Realtime.subscribeToTopic(`session:${socketSessionId}`);
  }
};

export const stopRealtime = ({ socketSessionId }) => {
  if (socketSessionId) {
    window.Realtime.unsubscribeFromTopic(`session:${socketSessionId}`);
  }
};
