/** @typedef {import('./lib/Maintenance').MaintenanceOptions} MaintenanceOptions */

const Maintenance = require('./lib/Maintenance')

/**
 * @param {MaintenanceOptions} options
 */
exports.runMaintenance = async (options) => {
  const maintenance = new Maintenance(options)
  await maintenance.run()
}
