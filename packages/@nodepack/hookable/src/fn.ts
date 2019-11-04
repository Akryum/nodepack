export function sequence (tasks: Function[], mapper: (task: Function) => any) {
  return tasks.reduce(
    (promise, task) => promise.then(() => mapper(task)),
    Promise.resolve(),
  )
}

export function parallel (tasks: Function[], mapper: (task: Function) => any) {
  return Promise.all(tasks.map(mapper))
}
