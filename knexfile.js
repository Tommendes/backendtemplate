const { db, client } = require('./.env')

module.exports = {
	client: client,
	connection: db,
	pool: {
		min: 2,
		max: 10
	},
	migrations: {
		tableName: 'knex_migrations'
	}
};
