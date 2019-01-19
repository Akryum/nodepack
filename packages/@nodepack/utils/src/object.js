exports.set = function (target, path, value) {
  const fields = path.split('.')
  let obj = target
  const l = fields.length
  for (let i = 0; i < l - 1; i++) {
    const key = fields[i]
    if (!obj[key]) {
      obj[key] = {}
    }
    obj = obj[key]
  }
  obj[fields[l - 1]] = value
}

exports.get = function (target, path) {
  const fields = path.split('.')
  let obj = target
  const l = fields.length
  for (let i = 0; i < l - 1; i++) {
    const key = fields[i]
    if (!obj[key]) {
      return undefined
    }
    obj = obj[key]
  }
  return obj[fields[l - 1]]
}

exports.unset = function (target, path) {
  const fields = path.split('.')
  let obj = target
  const l = fields.length
  const objs = []
  for (let i = 0; i < l - 1; i++) {
    const key = fields[i]
    if (!obj[key]) {
      return
    }
    objs.splice(0, 0, { obj, key, value: obj[key] })
    obj = obj[key]
  }
  delete obj[fields[l - 1]]
  // Clear empty objects
  for (const { obj, key, value } of objs) {
    if (!Object.keys(value).length) {
      delete obj[key]
    }
  }
}

/**
 * @param {Object} obj
 * @param {string []?} keyOrder
 */
exports.sortObject = function (obj, keyOrder = null, dontSortByUnicode = false) {
  if (!obj) return
  const res = {}

  if (keyOrder) {
    keyOrder.forEach(key => {
      res[key] = obj[key]
      delete obj[key]
    })
  }

  const keys = Object.keys(obj)

  !dontSortByUnicode && keys.sort()
  keys.forEach(key => {
    res[key] = obj[key]
  })

  return res
}

/**
 * @param {Array} array
 * @param {string []?} keyOrder
 */
exports.sortArray = function (array, keyOrder = null, dontSortByUnicode = false) {
  let res = []

  if (keyOrder) {
    if (!dontSortByUnicode) {
      keyOrder = keyOrder.slice().sort()
    }
    res = res.concat(keyOrder)
  }

  if (!dontSortByUnicode) {
    array = array.slice().sort()
  }
  res = res.concat(array)

  return res
}
