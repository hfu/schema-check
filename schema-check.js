const config = require('config')
const { Pool, Query } = require('pg')
const wkx = require('wkx')

let pools = {}
for (const database of config.get('databases')) {
  pools[database] = new Pool({
    host: config.get('host'), user: config.get('user'),
    password: config.get('password'), database: database, max: 1000
  })
}

const dump = (value, type) => {
  if (type === 'USER-DEFINED') {
    return wkx.Geometry.parse(Buffer.from(value), 'hex').toGeoJSON().type
  } else {
    return value
  }
}
const inspect = async (database) => {
  const client = await pools[database].connect()
  const tables = await client.query(
    `SELECT * FROM information_schema.tables WHERE ` +
    `table_schema='public' AND table_type='BASE TABLE' ` + 
    `ORDER BY table_name`
  )
  for (let table of tables.rows) {
    if (table.table_name === 'spatial_ref_sys') continue
    const counts = await client.query(
      `SELECT count(*) FROM ${table.table_name}`
    )
    const count = counts.rows[0].count
    console.log(`${table.table_catalog}::${table.table_name}(${count})`)
    if (count === '0') continue
    const columns = await client.query(
      `SELECT * FROM information_schema.columns WHERE ` +
      `table_name='${table.table_name}' ` +
      `ORDER BY column_name`
    )
    const instances = await client.query(
      `SELECT * FROM ${table.table_name} LIMIT 1`
    )
    const instance = instances.rows[0]
    for (let column of columns.rows) {
      console.log(`  ${column.column_name}(${column.data_type})`)
      console.log(`    ${dump(instance[column.column_name], column.data_type)}`)
    }
  }
  await client.end()
}

const main = async () => {
  for (const database of config.get('databases')) {
    await inspect(database)
  }
}
main()

