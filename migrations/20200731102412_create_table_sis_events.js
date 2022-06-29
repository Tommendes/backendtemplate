exports.up = function(knex) {
    return knex.schema.createTable('sis_events', table => {
        table.charset('utf8mb4')
        table.engine('InnoDB')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('id_user').unsigned().notNullable()
        table.string('created_at').notNull()
        table.text('evento')
        table.string('classevento')
        table.string('tabela_bd')
        table.integer('id_registro')
        table.string('ip')
        table.string('geo_lt')
        table.string('geo_ln')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('sis_events')
};