# node-stats-collector
Collector for runtime stats of a task

## Usage

```js
const StatsCollector = require('@vanioinformatika/stats-collector')

const maxErrorCount = 10 // if more than 10 errors occur, a maxErrorCountReached event will be emitted
const timeWindowMillis = 60 * 1000 // error occurences are counted in a 60 sec time window
const errorHistorySize = 100 // the last 100 errors are kept

const statCollector = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
statsCollector.on('maxErrorCountReached', () => {
  console.log('Maximum error count reached, something should be done...')
})

...

try {
  doSomeProcessing()
  statsCollector.success() // processing was successful
} catch (err) {
  statsCollector.error(err) // an error occured during processing
}

...

// publish runtime stats via HTTP
app.get('/stats', (req, res) => {
  res.json(statsCollector.toJSON(true) // return error history in the response too
})

```

## API

### Constructor

```js
StatsCollector(maxErrorCount: integer, timeWindowMillis: integer, errorHistorySize: integer): StatsCounter
```

Parameters:
* maxErrorCount: The maximum number of errors before a `maxErrorCountReached` event is emitted
* timeWindowMillis: The time window in milliseconds in which the number of errors are counted
* errorHistorySize: The size of the error history

### success

```js
success(): void
```

Registers processing success. Increases `totalCounter` and `totalSuccessCounter`.

### success

```js
error(error: Error | errors: Array<Error>): void
```

Registers processing failure. Increases `totalCounter` and `totalErrorCounter`. 
Saves the error(s) in the errorHistory and recentErrors stores. 

If the number of collected errors is greater than `maxErrorCount`, a `maxErrorCountReached` event is emitted.
The `recentErrors` collector only stores the last `maxErrorCount` number of errors.

See also `resetRecentErrors()`.

### resetRecentErrors

```js
resetRecentErrors(): void
```

Resets the `recentErrors` collector.

### getRecentErrors

```js
getRecentErrors(): Array<Error>
```

Returns the recently occured errors (the contents of the `recentErrors` collector). 


### getErrorHistory

```js
getErrorHistory(): Array<Error>
```

Returns all errors from the error history. 
The error history stores the last `errorHistorySize` number of errors since the StatsCollector instance is created.

### getTotalCounter

```js
getTotalCounter(): integer
```

Returns the number of `success()` and `error()` calls together since the StatsCollector instance is created.

### getTotalSuccessCounter

```js
getTotalSuccessCounter(): integer
```

Returns the number of successful processing (i.e. the number of `success()` calls) since the StatsCollector instance is created.

### getTotalErrorCounter

```js
getTotalErrorCounter(): integer
```

Returns the number of errors since the StatsCollector instance is created. 
Note that this may not equal to the number of `error()` calls, since an `error()` call may register multiple errors.

### toJSON

```js
toJSON (showErrorHistory: boolean): Object
```

Returns an object with the properties of the StatsCollector. 
If `showErrorHistory` is true the error history is returned as well. This can be useful e.g. 
if you want to publish stats through an HTTP endpont.

### toString

```js
toString (showErrorHistory: boolean): Object
```

Returns some basic info about the StatsCollector object.
