const DEFAULT_MIGRATION_TABLE = 'nodepack_migration_records'

/** @typedef {import('../..').KnexContext} KnexContext */

/**
 * @param {KnexContext} ctx
 */
export async function readMigrationRecords (ctx) {
  await ensureTable(ctx)
  const row = await ctx.knex.table(getTableName(ctx))
    .first('data')
  if (!row) {
    return {
      files: [],
      plugins: [],
    }
  } else {
    return JSON.parse(row.data)
  }
}

/**
 * @param {KnexContext} ctx
 * @param {any} data
 */
export async function writeMigrationRecords (ctx, data) {
  await ensureTable(ctx)
  const tableName = getTableName(ctx)
  await ctx.knex.transaction(async trx => {
    await trx.table(tableName).delete()
    await trx.table(tableName).insert({
      data: JSON.stringify(data),
    })
  })
}

/**
 * @param {KnexContext} ctx
 */
async function ensureTable (ctx) {
  await ctx.knex.schema.createTableIfNotExists(getTableName(ctx), builder => {
    builder.text('data')
  })
}

/**
 * @param {any} ctx
 */
function getTableName (ctx) {
  let table = ctx.config.dbMigrationTable
  if (ctx.config.db) {
    table = ctx.config.db.migrationTable
  }
  return table || DEFAULT_MIGRATION_TABLE
}
