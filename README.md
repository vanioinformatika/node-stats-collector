# node-stats-collector
Collector for runtime stats of a task

## Usage

```js
const StatsCollector = require('@vanioinformatika/stats-collector')

const maxErrorCount = 10 // if more than 10 errors occur, an event will be fired
const timeWindowMillis = 60 * 1000 // error occurences are counted in a 60 sec time window
const errorHistorySize = 100 // the last 100 errors are kept

const statCollector = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
statsCollector.on('maxErrorCountReached', () => {
  console.log('Maximum error count reached, something should be done...')
})

try {
  doSomeProcessing()
  statsCollector.success() // processing was successful
} catch (err) {
  statsCollector.error(err) // an error occured during processing
}

```
