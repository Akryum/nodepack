import { SequelizeContext, UUIDV4, STRING } from '@nodepack/plugin-db-sequelize'

export default (ctx: SequelizeContext) => ctx.sequelize.define('user', {
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
