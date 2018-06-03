const chai = require('chai')
chai.use(require('chai-eventemitter'))
const expect = chai.expect

const StatsCollector = require('./StatsCollector')

describe('StatsCollector', () => {
  //
  const maxErrorCount = 10
  const timeWindowMillis = 1000
  const errorHistorySize = 100

  describe('error', function () {
    it('should emit maxErrorCountReached after 10 errors have been added', function () {
      const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      const errorCtr = 15
      expect(() => {
        for (let i = 0; i < errorCtr; i++) {
          statistics.error(new Error('dummy'))
        }
      }).to.emitFrom(statistics, 'maxErrorCountReached')
      expect(statistics.getRecentErrors().length).to.equal(maxErrorCount)
      expect(statistics.getErrorHistory().length).to.equal(errorCtr)
      expect(statistics.getTotalCounter()).to.equal(errorCtr)
      expect(statistics.getTotalErrorCounter()).to.equal(errorCtr)
      expect(statistics.getTotalSuccessCounter()).to.equal(0)
    })
    it('should accept multiple error objects', function () {
      const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      const errors = [new Error('dummy1'), new Error('dummy2'), new Error('dummy3')]
      statistics.error(errors)
      expect(statistics.getRecentErrors().length).to.equal(errors.length)
      expect(statistics.getErrorHistory().length).to.equal(errors.length)
      expect(statistics.getTotalCounter()).to.equal(errors.length)
      expect(statistics.getTotalErrorCounter()).to.equal(errors.length)
      expect(statistics.getTotalSuccessCounter()).to.equal(0)
    })
    it('should not emit maxErrorCountReached', function () {
      this.timeout(3000)
      const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      const errorCtr = 15
      expect(() => {
        for (let i = 0; i < errorCtr; i++) {
          sleep(105)
          statistics.error(new Error('dummy'))
        }
      }).to.not.emitFrom(statistics, 'maxErrorCountReached')
      expect(statistics.getRecentErrors().length).to.equal(maxErrorCount)
      expect(statistics.getErrorHistory().length).to.equal(errorCtr)
      expect(statistics.getTotalCounter()).to.equal(errorCtr)
      expect(statistics.getTotalErrorCounter()).to.equal(errorCtr)
      expect(statistics.getTotalSuccessCounter()).to.equal(0)
    })
    it('should not store more object in the error history than specified', function () {
      this.timeout(3000)
      const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      const errorCtr = 150
      for (let i = 0; i < errorCtr; i++) {
        statistics.error(new Error('dummy'))
      }
      expect(statistics.getErrorHistory().length).to.equal(errorHistorySize)
      expect(statistics.getRecentErrors().length).to.equal(maxErrorCount)
      expect(statistics.getTotalCounter()).to.equal(errorCtr)
      expect(statistics.getTotalErrorCounter()).to.equal(errorCtr)
      expect(statistics.getTotalSuccessCounter()).to.equal(0)
    })
  })

  describe('success', function () {
    it('should set all counters properly', function () {
      const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      const total = 15
      for (let i = 0; i < total; i++) {
        statistics.success()
      }
      expect(statistics.getTotalCounter()).to.equal(total)
      expect(statistics.getTotalSuccessCounter()).to.equal(total)
      expect(statistics.getTotalErrorCounter()).to.equal(0)
      expect(statistics.getRecentErrors().length).to.equal(0)
    })
  })
  describe('counters', function () {
    it('should return the correct values', function () {
      const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      expect(statistics.getTotalCounter()).to.equal(0)
      expect(statistics.getTotalSuccessCounter()).to.equal(0)
      expect(statistics.getTotalErrorCounter()).to.equal(0)
      expect(statistics.getRecentErrors().length).to.equal(0)
      expect(statistics.getErrorHistory().length).to.equal(0)
      const successCtr = 32
      const errorCtr = 17
      for (let i = 0; i < successCtr; i++) {
        statistics.success()
      }
      const errors = []
      for (let i = 0; i < errorCtr; i++) {
        const err = new Error('error ' + i)
        statistics.error(err)
        errors.push(err)
      }
      expect(statistics.getTotalCounter()).to.equal(successCtr + errorCtr)
      expect(statistics.getTotalSuccessCounter()).to.equal(successCtr)
      expect(statistics.getTotalErrorCounter()).to.equal(errorCtr)
      expect(statistics.getRecentErrors().length).to.equal(maxErrorCount)
      expect(statistics.getErrorHistory().length).to.equal(errorCtr)
      expect(statistics.getErrorHistory().map(errObj => errObj.error)).to.deep.equal(errors)
      statistics.resetRecentErrors()
      expect(statistics.getTotalCounter()).to.equal(successCtr + errorCtr)
      expect(statistics.getTotalSuccessCounter()).to.equal(successCtr)
      expect(statistics.getTotalErrorCounter()).to.equal(errorCtr)
      expect(statistics.getRecentErrors().length).to.equal(0)
      expect(statistics.getErrorHistory().length).to.equal(errorCtr)
    })
  })
  describe('toJSON', function () {
    it('should return the correct JSON object', function () {
      const statistics = createFilledStatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      const expected = {
        maxErrorCount,
        timeWindowMillis,
        totalCounter: statistics.getTotalCounter(),
        totalSuccessCounter: statistics.getTotalSuccessCounter(),
        totalErrorCounter: statistics.getTotalErrorCounter(),
        recentErrors: statistics.getRecentErrors(),
        errorHistorySize
      }
      expect(statistics.toJSON(false)).to.deep.equal(expected)
      expect(statistics.toJSON(true)).to.deep.equal(Object.assign({}, expected, {errorHistory: statistics.getErrorHistory()}))
    })
  })
  describe('toString', function () {
    it('should return the correct string', function () {
      const statistics = createFilledStatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
      expect(statistics.toString()).to.equal(`StatsCollector { maxErrorCount: ${maxErrorCount}, timeWindowMillis: ${timeWindowMillis}, errorHistorySize: ${errorHistorySize} }`)
    })
  })
})

function createFilledStatsCollector (maxErrorCount, timeWindowMillis, errorHistorySize) {
  const statistics = new StatsCollector(maxErrorCount, timeWindowMillis, errorHistorySize)
  const successCtr = 32
  const errorCtr = 17
  for (let i = 0; i < successCtr; i++) {
    statistics.success()
  }
  for (let i = 0; i < errorCtr; i++) {
    statistics.error(new Error('error ' + i))
  }
  return statistics
}

function sleep (amount) {
  const waitTill = new Date(new Date().getTime() + amount)
  while (waitTill > new Date()) { }
}
