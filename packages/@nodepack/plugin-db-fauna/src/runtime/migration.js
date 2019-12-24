const DEFAULT_MIGRATION_TABLE = 'nodepack_migration_records'

const { query: q } = require('faunadb')

/** @typedef {import('../index').FaunaContext} FaunaContext */

/**
 * @param {FaunaContext} ctx
 */
export async function readMigrationRecords (ctx) {
  await ensureTable(ctx)
  const { data } = await ctx.fauna.query(
    q.Get(q.Collection(getTableName(ctx))),
  )
  if (!data.files || !data.plugins) {
    return {
      files: [],
      plugins: [],
    }
  } else {
    return data
  }
}

/**
 * @param {FaunaContext} ctx
 * @param {any} data
 */
export async function writeMigrationRecords (ctx, data) {
  await ensureTable(ctx)
  const tableName = getTableName(ctx)
  await ctx.fauna.query(
    q.Update(q.Collection(tableName), {
      data,
    }),
  )
}

/**
 * @param {FaunaContext} ctx
 */
async function ensureTable (ctx) {
  const tableName = getTableName(ctx)
  await ctx.fauna.query(
    q.If(
      q.Not(q.Exists(q.Collection(tableName))),
      q.CreateCollection({
        name: tableName,
        data: {
          files: [],
          plugins: [],
        },
      }),
      false,
    ),
  )
}

/**
 * @param {any} ctx
 */
function getTableName (ctx) {
  let table = ctx.config.dbMigrationTable || ctx.config.migrationCollection
  if (ctx.config.fauna) {
    table = ctx.config.fauna.migrationTable || ctx.config.fauna.migrationCollection
  }
  return table || DEFAULT_MIGRATION_TABLE
}
