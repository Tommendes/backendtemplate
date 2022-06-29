const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'params'
    const STATUS_ACTIVE = 10
    const STATUS_TRASH = 20

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gcl':
                getClientes(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    const get = (req, res) => {
        const body = { ...req.body }
        const first = body.first && body.first == true
        const forceDominio = body.forceDominio && body.forceDominio === true
        const order = body.order || 'created_at'
        try {
            existsOrError(body.dominio, 'Domínio não informado')
            existsOrError(body.meta, 'Meta de retorno não informado')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } });
            return res.status(400).send(error)
        }
        const meta = body.meta
        let sql = app.db(`${tabela}`)
            .where({ meta: meta })
            .where(app.db.raw(req.user.admin && !forceDominio ? '1=1' : `${tabela}.dominio = '${body.dominio}'`))
            .where(app.db.raw(body.value ? `${tabela}.value = '${body.value}'` : '1=1'))
            .where(app.db.raw(`${tabela}.value != 'root'`))
            .orderBy(order)
        if (first) sql.first()
        result = app.db.raw(sql.toString())
            .then(ret => res.status(200).send({ data: ret[0] }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getClientes = (req, res) => {
        let sql = app.db(`${tabela}`)
            .select('id', { 'cliente': 'dominio' }, { 'dominio': 'value' }, 'label')
            .where({ 'meta': 'domainName' })
            .orderBy('label')
            .then(ret => res.status(200).send({ data: ret }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } });
                res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        const ret = app.db(tabela)
            .where({ id: req.params.id })
            .first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getPonteId = async (req, res) => {
        const ret = app.db(tabela)
            .where({ dominio: 'root', meta: 'ponte' })
            .first()
            .then(body => {
                return res.json({ data: body.value })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByField = async (req, res) => {
        const body = { ...req.body }
        const field = req.params.field
        const dominio = body.dominio
        const meta = body.meta
        const value = body.value
        const ret = app.db({ tabela })
            .select(app.db.raw(`${field} as field`))
            .where({ dominio: dominio, meta: meta, value: value })
            .then(fields => res.json({ data: fields }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { get, getById, getPonteId, getByField, getByFunction }
}