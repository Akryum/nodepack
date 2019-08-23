import { UUIDV4, STRING } from '@nodepack/plugin-db-sequelize'

/** @typedef {import('@nodepack/plugin-db-sequelize').SequelizeContext} SequelizeContext */

/**
 * @param {SequelizeContext} ctx
 */
export default (ctx) => ctx.sequelize.define('user', {
  id: {
    type: UUIDV4,
    primaryKey: true,
  },
  email: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  username: {
    type: STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: STRING,
    allowNull: false,
  },
})
