import { Sequelize, Model, ModelCtor } from 'sequelize'

export default interface SequelizeContext {
  sequelize: Sequelize
  models: {
    [key: string]: ModelCtor<Model>
  }
}
