/**
 * @param {function[]} tasks
 * @param {(task: function) => any} mapper
 */
exports.sequence = function (tasks, mapper) {
  return tasks.reduce(
    (promise, task) => promise.then(() => mapper(task)),
    Promise.resolve()
  )
}

/**
 * @param {function[]} tasks
 * @param {(task: function) => any} mapper
 */
exports.parallel = function (tasks, mapper) {
  return Promise.all(tasks.map(mapper))
}
