import RealtimeDispatcher from './components/realtime_dispatcher';
import { getCookie } from './helpers/cookie_helper';

export const startRealtime = ({ sessionCookieName, url, events }) => {
  window.Realtime = new RealtimeDispatcher({ url, events });

  const socketSessionCookie = getCookie(sessionCookieName);

  if (socketSessionCookie) {
    window.Realtime.subscribeToTopic(`session:${socketSessionCookie}`);
  }
};

export const stopRealtime = ({ sessionCookieName }) => {
  const socketSessionCookie = getCookie(sessionCookieName);

  if (socketSessionCookie) {
    window.Realtime.unsubscribeFromTopic(`session:${socketSessionCookie}`);
  }
};