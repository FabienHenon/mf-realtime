# mf-realtime

Realtime package to use with mf-maestro

## Example

### Starting realtime

```js
startRealtime({
    socketSessionId: "socketSessionId",
    url: `/socket`,
    events: events      // on, emit, removeListener
});
```

### Stopping realtime

```js
stopRealtime({
    socketSessionId: "socketSessionId"
});
```

## Build

```
$ npm run build
```
