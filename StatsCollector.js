const EventEmitter = require('events')

/**
 * Event for signaling that the maximum number of errors reached within a specified time window.
 *
 * @event StatsCollector#maxErrorCountReached
 * @type {undefined}
 */

/**
 * Runtime stats collector for tasks. Keeps track of successful and failed executions of a task through
 * error() and success() and emits a maxErrorCountReached event if the maximum number of errors reached
 * in a specified time window.
 *
 * @fires StatsCollector#maxErrorCountReached
 */
class StatsCollector extends EventEmitter {
  /**
   * Constructor
   * @param {integer} maxErrorCount The maximum number of errors before a maxErrorCountReached event is emitted
   * @param {integer} timeWindowMillis The time window in milliseconds in which the number of errors are counted
   * @param {integer} errorHistorySize The size of the error history
   */
  constructor (maxErrorCount, timeWindowMillis, errorHistorySize) {
    super()
    this.maxErrorCount = maxErrorCount
    this.timeWindowMillis = timeWindowMillis
    this.errorHistorySize = errorHistorySize
    this.recentErrors = []
    this.errorHistory = []
    this.totalCounter = 0
    this.totalSuccessCounter = 0
    this.totalErrorCounter = 0
  }

  /**
   * Signals failed processing with one ore more errors
   * @param {Object|Array.<Object>} errors One ore more errors that occured during execution
   */
  error (errors) {
    if (!Array.isArray(errors)) {
      errors = [errors]
    }
    this.totalErrorCounter += errors.length
    this.totalCounter += errors.length
    const ts = new Date()
    const tsStr = ts.toISOString()
    const errorObjs = errors.map(error => ({ ts: ts.valueOf(), tsStr, error }))
    this.recentErrors.push(...errorObjs)
    this.errorHistory.push(...errorObjs)
    if (this.errorHistory.length > this.errorHistorySize) {
      this.errorHistory.splice(0, this.errorHistory.length - this.errorHistorySize)
    }
    this.recentErrors = this.recentErrors.filter(errObj => ts - errObj.ts < this.timeWindowMillis)
    if (this.recentErrors.length > this.maxErrorCount) {
      this.emit('maxErrorCountReached')
      this.recentErrors.splice(0, this.recentErrors.length - this.maxErrorCount)
    }
  }

  /**
   * Signals successful processing
   */
  success () {
    this.totalCounter++
    this.totalSuccessCounter++
  }

  resetRecentErrors () {
    this.recentErrors = []
  }

  getRecentErrors () {
    return this.recentErrors
  }

  getErrorHistory () {
    return this.errorHistory
  }

  getTotalCounter () {
    return this.totalCounter
  }

  getTotalSuccessCounter () {
    return this.totalSuccessCounter
  }

  getTotalErrorCounter () {
    return this.totalErrorCounter
  }

  toJSON (showErrorHistory) {
    const val = {
      maxErrorCount: this.maxErrorCount,
      timeWindowMillis: this.timeWindowMillis,
      totalCounter: this.totalCounter,
      totalSuccessCounter: this.totalSuccessCounter,
      totalErrorCounter: this.totalErrorCounter,
      recentErrors: this.recentErrors,
      errorHistorySize: this.errorHistorySize
    }
    if (showErrorHistory) val.errorHistory = this.errorHistory
    return val
  }

  toString () {
    return `StatsCollector { maxErrorCount: ${this.maxErrorCount}, timeWindowMillis: ${this.timeWindowMillis}, errorHistorySize: ${this.errorHistorySize} }`
  }
}

module.exports = StatsCollector
