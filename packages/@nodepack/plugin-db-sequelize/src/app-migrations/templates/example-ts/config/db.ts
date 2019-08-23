/* import { Options } from '@nodepack/plugin-db-sequelize'

// Sequelize options object
// See https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor

export default {
  dialect: 'mysql',
  host: '127.0.0.1',
  username: 'your_database_user',
  password: 'your_database_password',
  database: 'myapp_test',
} as Options */

// Synchronize models automatically
export const syncModels = process.env.NODE_ENV !== 'production'
