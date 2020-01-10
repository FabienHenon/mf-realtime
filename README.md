# mf-realtime

Realtime package to use with mf-maestro

## Example

### Starting realtime

```js
startRealtime({
    sessionCookieName: "session_cookie_name",
    url: `/socket`,
    events: events      // on, emit, removeListener
});
```

### Stopping realtime

```js
stopRealtime({
    sessionCookieName: "session_cookie_name"
});
```