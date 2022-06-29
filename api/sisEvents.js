const axios = require('axios')

module.exports = app => {
    const STATUS_ACTIVE = 10
    const STATUS_TRASH = 20
    const { envLocalhost, dbPrefix } = require("../.env")
    const tabelaSisEvents = 'sis_events'

    const createEventUpd = async (req, res) => {
        const evento = req.evento
        const force = req.force
        const last = req.last
        const next = req.next
        const request = req.request
        const notTo = req.notTo
        let eventoDescr = '(Antes => Depois) '
        let fields = ''
        for (older in last) {
            for (newest in next) {
                if (newest === older && next[newest] != last[older] && notTo.indexOf(newest) < 0)
                    if (newest == 'password')
                        fields += `${newest}, `;
                    else
                        fields += `${newest}: ${last[older]} => ${next[newest]}, `;
            }
        }
        // se campos foram alterados então registra
        if (force || (fields.length >= 2 && fields.substr(0, fields.length - 2).length > 0)) {
            // remove a virgula e espaço inseridos ao final da string
            evento.evento = force ? `${evento.evento}` : `${evento.evento} ${eventoDescr}: ${fields.substr(0, fields.length - 2)}`

            evento.id_user = !(request && request.user && request.user.id) ? last.id : request.user.id
            evento.classevento = evento.classevento || "Update"
            evento.ip = request.ip
            evento.id_registro = last.id
            if (envLocalhost) {
                evento.geo_lt = null
                evento.geo_ln = null
            } else {
                const url = `http://api.ipstack.com/${request.ip}?access_key=73ec9b93dcb973e011c965b8a25f08e4`
                const ipstack = await axios.get(url).catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
                evento.geo_lt = ipstack.data.latitude
                evento.geo_ln = ipstack.data.longitude
            }
            evento.created_at = new Date()

            try {
                const dba = await app.db(tabelaSisEvents).insert(evento)
                return dba[0]
            } catch (error) {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } });
                res.status(500).send(error)
            }
        }
    }

    const createEventIns = async (req, res) => {
        const evento = req.evento
        const next = req.next
        const request = req.request
        const notTo = req.notTo
        let eventoDescr = ''
        let fields = ''
        for (newest in next) {
            if (notTo.indexOf(newest) < 0)
                fields += `${newest}: ${next[newest]}, `;
        }
        if (fields.length >= 2 && fields.substr(0, fields.length - 2).length > 0) {
            // remove a virgula e espaço inseridos ao final da string
            eventoDescr += fields.substr(0, fields.length - 2)

            evento.id_user = !(request && request.user && request.user.id) ? next.id : request.user.id
            evento.evento = `${evento.evento}: ${eventoDescr}`
            evento.classevento = "Insert"
            evento.ip = request.ip
            evento.id_registro = next.id

            if (envLocalhost) {
                evento.geo_lt = null
                evento.geo_ln = null
            } else {
                const url = `http://api.ipstack.com/${request.ip}?access_key=73ec9b93dcb973e011c965b8a25f08e4`
                const ipstack = await axios.get(url).catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
                evento.geo_lt = ipstack.data.latitude
                evento.geo_ln = ipstack.data.longitude
            }
            evento.created_at = new Date()

            try {
                const dba = await app.db(tabelaSisEvents).insert(evento)
                return dba[0]
            } catch (error) {
                res.status(500).send(error)
            }
        }
    }

    const createEventRemove = async (req, res) => {
        const evento = req.evento
        const last = req.last
        const request = req.request
        let eventoDescr = '(dados antes da exclusão)'
        let fields = ''
        for (older in last) {
            fields += `${older}: ${last[older]}, `;
        }
        // se campos foram alterados então registra
        if ((fields.length >= 2 && fields.substr(0, fields.length - 2).length > 0)) {
            // remove a virgula e espaço inseridos ao final da string
            evento.evento = `${evento.evento} ${eventoDescr}: ${fields.substr(0, fields.length - 2)}`

            evento.id_user = !(request && request.user && request.user.id) ? last.id : request.user.id
            evento.classevento = "Remove"
            evento.ip = request.ip
            evento.id_registro = last.id
            if (envLocalhost) {
                evento.geo_lt = null
                evento.geo_ln = null
            } else {
                const url = `http://api.ipstack.com/${request.ip}?access_key=73ec9b93dcb973e011c965b8a25f08e4`
                const ipstack = await axios.get(url).catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
                evento.geo_lt = ipstack.data.latitude
                evento.geo_ln = ipstack.data.longitude
            }
            evento.created_at = new Date()

            try {
                const dba = await app.db(tabelaSisEvents).insert(evento)
                return dba[0]
            } catch (error) {
                res.status(500).send(error)
            }
        }
    }

    const createEvent = async (req, res) => {
        const request = req.request
        const evento = req.evento
        if (envLocalhost) {
            evento.geo_lt = null
            evento.geo_ln = null
        } else {
            const url = `http://api.ipstack.com/${request.ip}?access_key=379f7af2dcb3b36d1f4c8b9e8d421dfb`
            const ipstack = await axios.get(url).catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
            evento.geo_lt = ipstack.data.latitude
            evento.geo_ln = ipstack.data.longitude
        }
        evento.created_at = new Date()

        try {

            const dba = await app.db(tabelaSisEvents).insert(evento)
            return dba[0]
        } catch (error) {
            res.status(500).send(error)
        }
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!uParams || !uParams.siap >= 1) return res.status(401).send('Unauthorized')
        const page = req.query.page || 1
        const key = req.query.key ? req.query.key : ''
        let tabelas_bd = req.query.tabelas_bd ? req.query.tabelas_bd : ''
        let arrayOfTabelas = tabelas_bd.split(",")
        let classevento = req.query.classevento ? req.query.classevento : ''
        let arrayOfClasses = classevento.split(",")

        const sql = app.db({ se: tabelaSisEvents }).select(app.db.raw('count(*) as count'))
            .join({ us: 'users' }, 'se.id_user', '=', 'us.id')
            .where({ 'us.dominio': uParams.dominio, 'us.cliente': uParams.cliente })
            .where(function () {
                this.where('se.evento', 'like', `%${key}%`)
                    .orWhere('us.name', 'like', `%${key}%`)
            })
        if (tabelas_bd)
            sql.whereIn("tabela_bd", arrayOfTabelas)
        if (classevento)
            sql.whereIn("classevento", arrayOfClasses)
        const result = await app.db.raw(sql.toString())
        const count = result[0][0] ? parseInt(result[0][0].count) : 0

        const ret = app.db({ se: tabelaSisEvents })
            .select({ id: 'se.id' }, { evento: 'se.evento' }, { created_at: 'se.created_at' }, { classevento: 'se.classevento' }, { tabela_bd: 'se.tabela_bd' }, { id_registro: 'se.id_registro' }, { user: 'us.name' },)
            .join({ us: 'users' }, 'se.id_user', '=', 'us.id')
            .limit(limit).offset(page * limit - limit)
            .where({ 'us.dominio': uParams.dominio, 'us.cliente': uParams.cliente })
            .where(function () {
                this.where('se.evento', 'like', `%${key}%`)
                    .orWhere('us.name', 'like', `%${key}%`)
            })
        if (tabelas_bd)
            ret.whereIn("tabela_bd", arrayOfTabelas)
        if (classevento)
            ret.whereIn("classevento", arrayOfClasses)
        ret.orderBy("se.created_at", "desc")
        ret.then(sis_events => res.json({ data: sis_events, count, limit }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByField = async (req, res) => {
        const field = req.params.field
        const ret = app.db({ se: tabelaSisEvents })
            .select(app.db.raw(`${field} as field`))
            .where(app.db.raw(`length(${field}) > 0`))
            .groupBy(app.db.raw(`${field}`), "desc")
            .orderBy(app.db.raw(`${field}`), "desc")
            .then(fields => res.json({ data: fields }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = (req, res) => {
        app.db(tabelaSisEvents)
            .where({ id: req.params.id })
            .first()
            .then(sis_events => {
                return res.json(sis_events)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { createEventUpd, createEventIns, createEventRemove, createEvent, get, getById, getByField }
}