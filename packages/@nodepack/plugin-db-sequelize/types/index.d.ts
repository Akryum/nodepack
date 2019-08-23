import { Sequelize, Model, ModelCtor } from 'sequelize'

export * from 'sequelize'

export interface SequelizeContext {
  sequelize: Sequelize
  models: {
    [key: string]: ModelCtor<Model>
  }
}
