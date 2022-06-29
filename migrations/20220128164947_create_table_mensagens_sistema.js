exports.up = function(knex) {
    return knex.schema.createTable('vivazul_api.mensagens_sistema', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('mensagem').comment("Mensagem")
        table.string('expira').comment("Prazo validade")
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('vivazul_api.mensagens_sistema')
};