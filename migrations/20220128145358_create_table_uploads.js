exports.up = function(knex) {
    return knex.schema.createTable('vivazul_api.uploads', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.boolean('file_permission').notNull().default(1)
        table.string('file_name').notNull()
        table.string('file_caption').notNull()
        table.string('file_size').notNull()
        table.string('file_ext').notNull()
        table.string('file_wd').notNull()
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('vivazul_api.uploads')
};