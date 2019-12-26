import { Maintenance, MaintenanceOptions } from './lib/Maintenance'

export * from './lib/Maintenance'

export async function runMaintenance (options: MaintenanceOptions) {
  const maintenance = new Maintenance(options)
  await maintenance.run()
}

export async function preInstall (options: MaintenanceOptions) {
  const maintenance = new Maintenance(options)
  await maintenance.preInstall()
}
