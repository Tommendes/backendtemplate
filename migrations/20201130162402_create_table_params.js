exports.up = function(knex) {
    return knex.schema.createTable('params', table => {
        table.charset('utf8mb4')
        table.engine('InnoDB')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('dominio').notNull().comment("Domínio do cliente")
        table.string('meta').notNull()
        table.string('value').notNull()
        table.string('label').comment("Label do parametro")
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('params')
};