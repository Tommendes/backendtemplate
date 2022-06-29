const bcrypt = require('bcrypt-nodejs')
const randomstring = require("randomstring")
const { baseFrontendUrl, emailAdmin, appName } = require("../config/params")
const { dbPrefix, jasperServerUrl, jasperServerU, jasperServerK } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { transporter } = app.api.mailer
    const tabela = `users`
    const STATUS_INACTIVE = 0
    const STATUS_ACTIVE = 10
    const STATUS_SUSPENDED = 90
    const STATUS_DELETE = 99

    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    const save = async (req, res) => {
        const body = { ...req.body }
        const user = { ...req.user }

        body.cpf = body.cpf.replace(/([^\d])+/gim, "")

        if (req.params.id) body.id = req.params.id

        if (!req.originalUrl.startsWith('/users')) {
            body.admin = 0
            body.gestor = 0
        }

        try {
            // Apenas admins podem editar outros admins, gestores e se o usuário pode ser multiCliente
            if (!(user.admin >= 1 || user.gestor == 1)) {
                delete body.admin
                delete body.gestor
                delete body.multiCliente
            }
            existsOrError(body.name, 'Nome não informado')
            existsOrError(body.cpf, 'CPF não informado')
            existsOrError(body.email, 'E-mail não informado')
            existsOrError(body.telefone, 'Telefone não informado')
            if ((body.password || body.confirmPassword) && body.password != body.confirmPassword) {
                existsOrError(body.password, 'Senha não informada')
                existsOrError(body.confirmPassword, 'Confirmação de Senha inválida')
                equalsOrError(body.password, body.confirmPassword, 'Senhas não conferem')
            } else if (!body.password) {
                delete body.password
            }

            if (!body.id) {
                const userFromDB = await app.db(tabela)
                    .where({ email: body.email })
                    .orWhere({ cpf: body.cpf })
                    .first()
                notExistsOrError(userFromDB, 'Email ou CPF já registrado')
            }
        } catch (error) {
            return res.status(400).send(error)
        }

        if (!emailOrError(body.email))
            return res.status(400).send('E-mail inválido')

        if (body.password && body.confirmPassword)
            body.password = encryptPassword(body.password)

        delete body.clientName
        delete body.confirmPassword
        delete body.reload

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password_reset_token', 'evento'],
                "last": await app.db(tabela).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de perfil de usuário`,
                    "tabela_bd": "user",
                }
            })

            app.api.logger.logInfo({ log: { line: `Alteração de perfil de usuário! Usuário: ${body.name}`, sConsole: true } })

            body.evento = evento
            body.updated_at = new Date()
            const rowsUpdated = await app.db(tabela)
                .update(body)
                .where({ id: body.id })
                .then(_ => {
                    return res.json(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } });
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Usuário não foi encontrado')
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.status = STATUS_INACTIVE
            body.created_at = new Date()
            app.db(tabela)
                .insert(body)
                .then(async (ret) => {
                    mailyNew(body)
                    body.id = ret[0]
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                        "next": body,
                        "request": req,
                        "evento": {
                            "evento": `Novo perfil de usuário`,
                            "tabela_bd": "user",
                        }
                    })

                    app.api.logger.logInfo({ log: { line: `Novo de perfil de usuário! Usuário: ${body.name}`, sConsole: true } })
                    return res.json(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const unlock = async (req, res) => {
        const user = { ...req.body }
        if (req.params.id) user.id = req.params.id

        if (user.id && req.params.token) {
            // Utilizado para autorizar o usuário
            const userFromDB = await app.db(tabela)
                .select('id', 'status', 'email', 'name')
                .where({ id: req.params.id }).first()

            if (!(userFromDB))
                return res.status(400).send('Usuário não encontrado!')

            if (!(req.params.token === Buffer.from(`${userFromDB.id}_${userFromDB.status}_${userFromDB.email}`).toString('base64')))
                return res.status(200).send('Tokn inválido ou já utilizado!')

            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                "last": userFromDB,
                "next": user,
                "request": req,
                "evento": {
                    "evento": `Liberação de perfil de usuário`,
                    "tabela_bd": "user",
                }
            })
            user.evento = evento
            user.status = STATUS_ACTIVE
            user.updated_at = new Date()
            app.db(tabela)
                .update(user)
                .where({ id: user.id })
                .then(_ => {
                    mailyUnlocked(userFromDB)
                    app.api.logger.logInfo({ log: { line: `Usuário autorizado a usar o sistema! Usuário: ${userFromDB.name}`, sConsole: true } })
                    return res.status(200).send('Usuário autorizado a usar o sistema!<br>Obrigado por sua confirmação')
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const passwordReset = async (req, res) => {
        if (req.params.token != null) {
            const user = { ...req.body }
            const userFromDB = await app.db(tabela).where({ password_reset_token: req.params.token }).first()

            if (!userFromDB) return res.status(400).send('Token inválido!')
            if (!user.password) return res.status(400).send('Senha não informada')
            if (!user.confirmPassword) return res.status(400).send('Confirmação de Senha inválida')
            if (user.password != user.confirmPassword) return res.status(400).send('Senhas não conferem')


            // verifica se é válido em relação ao tempo de criação
            const now = Math.floor(Date.now() / 1000)
            if (userFromDB.password_reset_token.substring(28, 10) < now)
                return res.status(400).send('Token inválido!')
            // return

            user.password = encryptPassword(user.password)
            delete user.confirmPassword

            // registrar o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            const evento = await createEvent({
                "request": req,
                "evento": {
                    "ip": req.ip,
                    "id_user": !(req.user && req.user.id) ? userFromDB.id : req.user.id,
                    "evento": `Alteração de senha do usuário ${userFromDB.id} ${userFromDB.email}`,
                    "classevento": `password-reset`,
                    "id_registro": userFromDB.id,
                    "tabela_bd": "user"
                }
            })

            user.evento = evento
            user.status = STATUS_ACTIVE
            user.password_reset_token = null
            app.db(tabela)
                .update({
                    evento: user.evento,
                    status: user.status,
                    updated_at: new Date(),
                    password_reset_token: user.password_reset_token,
                    password: user.password
                })
                .where({ id: userFromDB.id })
                .then(_ => {
                    return res.status(200).send('Senha alterada com sucesso!')
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const requestPasswordReset = async (req, res) => {
        let user = { ...req.body }
        const thisUser = await app.db(tabela).where({ email: user.email }).first()
        try {
            existsOrError(thisUser, 'Email de usuário não foi encontrado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const now = Math.floor(Date.now() / 1000)
        // Editar perfil de um usuário inserindo um token de renovação e um time
        // registrar o evento na tabela de eventos
        const { createEvent } = app.api.sisEvents
        const evento = await createEvent({
            "request": req,
            "evento": {
                "ip": req.ip,
                "id_user": thisUser.id,
                "evento": `Criação de token de troca de senha de usuário`,
                "classevento": `requestPasswordReset`,
                "id_registro": null
            }
        })

        thisUser.evento = evento
        const password_reset_token = randomstring.generate(27) + '_' + now + 10 // 10 minutos de validade
        // try {
        app.db(tabela)
            .update({
                evento: evento,
                updated_at: new Date(),
                password_reset_token: password_reset_token
            })
            .where({ email: thisUser.email })
            .then(_ => {
                mailyPasswordReset(thisUser)
                existsOrError(thisUser, 'Usuário não foi encontrado')
                return res.status(200).send('Verifique seu email para concluir a operação!')
            })
            .catch(msg => {
                res.status(400).send(error)
            })
    }

    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        // O controle de acesso a esta requisição passou a ser feito pelo frontend 1/6/21
        // if (req.user.id != req.params.id || (!uParams.gestor > 0 && !uParams.admin >= 1)) return res.status(401).send('Unauthorized')
        const ret = app.db(tabela)
            .select("id", "status", "name", "cpf", "email", "telefone",
                "cliente", "dominio", "admin", "gestor", "multiCliente",
                "siap", "orgao", "cadastros", "patrimonio", "obras",
                "cpl", "cpl_editais"
            )
            .where(app.db.raw(`users.status = ${STATUS_ACTIVE}`))
            .andWhere(app.db.raw(uParams.multiCliente >= 2 ? '1=1' : `users.cliente = '${uParams.cliente}'`))
            .andWhere(app.db.raw(uParams.gestor ? '1=1' : `${tabela}.id = '${req.user.id}'`))
        ret.then(users => {
            return res.json(users)
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (req.user.id != req.params.id && uParams.gestor < 1) return res.status(401).send('Unauthorized')
        app.db(tabela)
            .select("id", "status", "name", "cpf", "email", "telefone",
            "cliente", "dominio", "admin", "gestor", "multiCliente",
            "siap", "orgao", "cadastros", "patrimonio", "obras",
            "cpl", "cpl_editais")
            .where(app.db.raw(`users.id = ${req.params.id}`))
            .first()
            .then(users => {
                users.j_user = jasperServerU
                users.j_paswd = jasperServerK
                delete users.password
                return res.json(users)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByToken = async (req, res) => {
        if (!req.params.token) return res.status(401).send('Unauthorized')
        const sql = app.db(tabela)
            .select('users.id', app.db.raw('REPLACE(users.name, " de", "") as name'))
            .where(app.db.raw(`users.password_reset_token = '${req.params.token}'`))
            .first()
        sql.then(user => {
            const username = user.name.split(" ")
            user.name = `${username[0]}${username[1] ? ` ${username[1]}` : ''}`
            return res.json(user)
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        const user = { status: STATUS_DELETE }
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabela).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                "last": last,
                "next": user,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de usuário`,
                    "tabela_bd": "user",
                }
            })
            const rowsUpdated = await app.db(tabela)
                .update({
                    status: user.status,
                    evento: evento
                })
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Usuário não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const mailyNew = async (req, res) => {
        try {
            const user = await app.db(tabela).where({ email: req.email }).first()
            existsOrError(user, 'Usuário não foi encontrado')
            const confirmString = Buffer.from(`${user.id}_${user.status}_${user.email}`).toString('base64')
            await transporter.sendMail({
                from: `"${appName}" <noreply@vivazul.app.br>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: `Bem-vindo ao ${appName}`, // Subject line
                text: `Olá ${user.name}!\n
                Estamos confirmando sua inscrição✔
                Para liberar seu acesso, por favor acesse o link abaixo.\n
                ${baseFrontendUrl}/user-unlock/${user.id}/${confirmString}\n
                Atenciosamente,\nTime ${appName}`,
                html: `<p><b>Olá ${user.name}!</b></p>
                <p>Estamos confirmando sua inscrição✔</p>
                <p>Para liberar seu acesso, por favor acesse o link abaixo ou clique <a href="${baseFrontendUrl}/user-unlock/${user.id}/${confirmString}">aqui</a>.</p>
                <p>${baseFrontendUrl}/user-unlock/${user.id}/${confirmString}<\p>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
            await transporter.sendMail({
                from: `"${appName}" <noreply@vivazul.app.br>`, // sender address
                to: `${emailAdmin}`, // list of receivers
                subject: `Novo usuário ${appName}`, // Subject line
                text: `Estamos confirmando a inscrição de um novo usuário\n
                ${user.name}: ${user.email}✔\n
                Atenciosamente,\n
                Time ${appName}`,
                html: `<p>Estamos confirmando a inscrição de um novo usuário</p>
                <p>${user.name}: ${user.email}✔</p>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const mailyPasswordReset = async (req, res) => {
        try {
            const user = await app.db(tabela)
                .where({ email: req.email }).first()
            existsOrError(user, 'Usuário não foi encontrado')
            await transporter.sendMail({
                from: `"${appName}" <noreply@vivazul.app.br>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: `Alteração de senha ${appName}`, // Subject line
                text: `Olá ${user.name}!\n
                Para atualizar sua senha, por favor acesse o link abaixo.\n
                Lembre-se de que esse link tem validade de dez minutos.\n
                ${baseFrontendUrl}/password-reset/${user.password_reset_token}\n
                Atenciosamente,\nTime ${appName}`,
                html: `<p><b>Olá ${user.name}!</b></p>
                <p>Para atualizar sua senha, por favor acesse o link abaixo.</p>
                <p>Lembre-se de que esse link tem validade de dez minutos.</p>
                <a href="${baseFrontendUrl}/password-reset/${user.password_reset_token}">${baseFrontendUrl}/password-reset/${user.password_reset_token}</a>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const mailyUnlocked = async (req, res) => {
        try {
            const user = await app.db(tabela)
                .where({ email: req.email }).first()
            existsOrError(user, 'Usuário não foi encontrado')
            await transporter.sendMail({
                from: `"${appName}" <noreply@vivazul.app.br>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: `Usuário liberado`, // Subject line
                text: `Olá ${user.name}!\n
                Estamos felizes que conseguiu liberar seu acesso.\n
                A partir de agora poderá acessar e utilizar o sistema.\n
                Caso seja necessário, por favor, solicite ao seu administrador para liberar acesso aos dados.\n
                Atenciosamente,\nTime ${appName}`,
                html: `<p><b>Olá ${user.name}!</b></p>
                <p>Estamos felizes que conseguiu liberar seu acesso.</p>
                <p>A partir de agora poderá acessar e utilizar o sistema.</p>
                <p>Caso seja necessário, por favor, solicite ao seu administrador para liberar acesso aos dados.</p>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
        } catch (error) {
            res.status(400).send(error)
        }
    }

    return { save, get, getById, remove, getByToken, requestPasswordReset, passwordReset, unlock }
}