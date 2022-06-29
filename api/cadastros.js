const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")
const fs = require('fs')

module.exports = app => {
    const { existsOrError, notExistsOrError, cpfOrError, cnpjOrError, lengthOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'cadastros'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        let body = { ...req.body }
        if (req.params.id) body.id = req.params.id
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cadastros >= 3, `${noAccessMsg} "Edição de ${tabela}"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cadastros >= 2, `${noAccessMsg} "Inclusão de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`

        try {
            existsOrError(body.cpf_cnpj, 'CNPJ ou CPF não informado')
            if (body.cpf_cnpj && body.cpf_cnpj.length == 11) cpfOrError(body.cpf_cnpj)
            else if (body.cpf_cnpj && body.cpf_cnpj.length == 14) cnpjOrError(body.cpf_cnpj)
            else throw 'Documento (CNPJ ou CPF) inválido. Favor verificar'
            if (body.tipo_cadastro == 0 && !body.rg_isento) {
                existsOrError(body.rg_ie, 'Rg não informado')
            }
            delete body.rg_isento
            existsOrError(body.cadas_nome, 'Nome não informado')
            existsOrError(body.telefone1, 'Telefone 1 não informado')
            // existsOrError(body.telefone2, 'Telefone 2 não informado')
            existsOrError(body.email, 'email não informado')
            existsOrError(body.pessoa_contato, 'Pessoa contato não informada')
            existsOrError(body.nascimento, 'Data de Fundação/Nascimento não informado')
            // existsOrError(body.qualificacao, 'Qualificação não informada')

            if (body.cpf_cnpj) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ cpf_cnpj: body.cpf_cnpj })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'Combinação de CNPJ/ CPF já cadastrado')
            }
        } catch (error) {
            return res.status(400).send(error)
        }

        delete body.hash; delete body.tblName
        // body.nascimento = moment(body.nascimento).format("DD/MM/YYYY")
        const { changeUpperCase, removeAccentsObj } = app.api.facilities
        body = (JSON.parse(JSON.stringify(body), removeAccentsObj));
        body = (JSON.parse(JSON.stringify(body), changeUpperCase));

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'updated_at', 'evento',],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de cadastro de ${tabela}`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date()
            let rowsUpdated = app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id })
            rowsUpdated.then((ret) => {
                if (ret > 0) res.status(200).send(body)
                else res.status(200).send('Cadastro não foi encontrado')
            })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.status = STATUS_ACTIVE
            body.created_at = new Date()

            app.db(tabelaDomain)
                .insert(body)
                .then(ret => {
                    body.id = ret[0]
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'evento'],
                        "next": body,
                        "request": req,
                        "evento": {
                            "evento": `Novo registro`,
                            "tabela_bd": tabela,
                        }
                    })
                    return res.json(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        let keyCnpj = undefined
        let key = req.query.key
        const tipoCadastro = req.query.ft || 0
        if (key) {
            key = key.trim()
            keyCnpj = (key.replace(/([^\d])+/gim, "").length <= 14) ? key.replace(/([^\d])+/gim, "") : undefined
        }
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cadastros >= 1, `${noAccessMsg} "Exibição de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const page = req.query.page || 1
        let count = app.db({ tbl1: tabelaDomain }).count('* as count')
            .where({ status: STATUS_ACTIVE, tipo_cadastro: tipoCadastro })

        if (key)
            if (keyCnpj) count.where(function () {
                this.where(app.db.raw(`tbl1.cpf_cnpj like '%${keyCnpj}%'`))
                    .orWhere(app.db.raw(`tbl1.cadas_nome regexp('${key.toString().replace(' ', '.+')}')`))
            })
            else count.where(app.db.raw(`tbl1.cadas_nome regexp('${key.toString().replace(' ', '.+')}')`))

        count = await app.db.raw(count.toString())
        count = count[0][0].count

        const ret = app.db({ tbl1: tabelaDomain })
            .select(app.db.raw(`tbl1.*, SUBSTRING(SHA(CONCAT(id,'${tabela}')),8,6) as hash`))
        if (key)
            if (keyCnpj) ret.where(function () {
                this.where(app.db.raw(`tbl1.cpf_cnpj like '%${keyCnpj}%'`))
                    .orWhere(app.db.raw(`tbl1.cadas_nome regexp('${key.toString().replace(' ', '.+')}')`))
            })
            else ret.where(app.db.raw(`tbl1.cadas_nome regexp('${key.toString().replace(' ', '.+')}')`))

        ret.where({ status: STATUS_ACTIVE, tipo_cadastro: tipoCadastro })
            .groupBy('tbl1.id')
            .orderBy('cadas_nome', 'cpf_cnpj')
            .limit(limit).offset(page * limit - limit)

        ret.then(body => {
            return res.json({ data: body, count: count, limit })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
            })
    }

    const getCount = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        let count = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE })
            .then(body => res.json({ count: body.length }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cadastros >= 1, `${noAccessMsg} "Exibição de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db({ tbl1: tabelaDomain })
            .select(app.db.raw(`tbl1.*, TO_BASE64('${tabela}') tblName, SUBSTRING(SHA(CONCAT(tbl1.id,'${tabela}')),8,6) as hash`))
            .where({ 'tbl1.id': req.params.id, 'tbl1.status': STATUS_ACTIVE }).first()
            .then(body => {
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && uParams.cadastros >= 1), `${noAccessMsg} "Exclusão de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        try {
            const tabelaAdjGruposDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.adj_grupos`
            const tabelaAdjPropItensDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.adj_prop_itens`
            const tabelaAdjProponentesDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.adj_proponentes`
            const tabelaAdjRegistrosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.adj_registros`
            const tabelaExecContratosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.exec_contratos`
            const tabelaConveniosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.conv_convenios`
            const tabelaObrasDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.obras`
            const tabelaObrasAcompansDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.obras_acompans`
            const tabelaObrasDrtsDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.obras_drts`
            const tabelaObrasMedicoesDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.obras_medicoes`
            const tabelaObrasOSDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.obras_os`
            const tabelaCadEnderecosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_enderecos`
            const tabelaCadOfc = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_ofc`
            // Antes da exclusão, verifica se existe em tabelas filhas relacionadas
            const baseMessage = 'Item não pode ser excluído pois foi registrado em '
            let adicionalMessages = ''

            const isInAdjGrupos = await app.db(tabelaAdjGruposDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInAdjGrupos) adicionalMessages += 'Grupos Adjudicados(Adjudicação) '

            const isInAdjProponentes = await app.db(tabelaAdjProponentesDomain).where({ id_cad: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInAdjProponentes) adicionalMessages += 'Proponentes(Adjudicação) '

            const isInAdjRegistros = await app.db(tabelaAdjRegistrosDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInAdjRegistros) adicionalMessages += 'Ata Registro de Preço(Adjudicação) '

            const isInExecContratos = await app.db(tabelaExecContratosDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInExecContratos) adicionalMessages += 'Contratos(Execução) '
            
            const isInConvenios = await app.db(tabelaConveniosDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInConvenios) adicionalMessages += 'Convênios '

            const isInObras = await app.db(tabelaObrasDomain).where({ id_cadas_executor: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInObras) adicionalMessages += 'Obras '

            const isInObras2 = await app.db(tabelaObrasDomain).where({ id_cadas_crea: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInObras2) adicionalMessages += 'Obras '

            const isInObrasAcompans = await app.db(tabelaObrasAcompansDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInObrasAcompans) adicionalMessages += 'Acompanhamentos(Obras) '

            const isInObrasDrts = await app.db(tabelaObrasDrtsDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInObrasDrts) adicionalMessages += 'DRTs(Obras) '

            const isInObrasMedicoes = await app.db(tabelaObrasMedicoesDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInObrasMedicoes) adicionalMessages += 'Medições(Obras) '

            const isInObrasOS = await app.db(tabelaObrasOSDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInObrasOS) adicionalMessages += 'Ordem de Serviço(Obras) '

            const isInCadEnderecos = await app.db(tabelaCadEnderecosDomain).where({ id_cadastros: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInCadEnderecos) adicionalMessages += 'Cadastro Endereços '

            const isInCadOfc = await app.db(tabelaCadOfc).where({ id_cadastros: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInCadOfc) adicionalMessages += 'Cadastro Ofc '

            const isInAdjPropItens = await app.db(tabelaAdjPropItensDomain).where({ id_cadastro: req.params.id, status: STATUS_ACTIVE }).first()
            if (isInAdjPropItens) adicionalMessages += (adicionalMessages.length > 0 ? 'e ' : '') + 'Proponentes Itens(Adjudicação) '

            if (adicionalMessages.length > 0) throw baseMessage + adicionalMessages
        } catch (error) {
            return res.status(400).send(error)
        }


        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const registro = { status: STATUS_DELETE }
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabelaDomain).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'updated_at', 'evento'],
                "last": last,
                "next": registro,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de cadastro de ${tabela}`,
                    "tabela_bd": tabela,
                }
            })
            const rowsUpdated = await app.db(tabelaDomain)
                .update({
                    status: registro.status,
                    updated_at: new Date(),
                    evento: evento
                })
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const getListaCadastros = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        let ft
        if (req.params.id) ft = req.params.id
        else delete ft

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        let sql = app.db(tabelaDomain)
            .select('id', 'cpf_cnpj', 'cadas_nome').orderBy('cadas_nome')
            .where({ status: STATUS_ACTIVE }) //, patrimonio: 1
        if (ft) sql.where({ 'tipo_cadastro': ft })
        //console.log(sql.toString());
        sql.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
            })
    }

    return { save, get, getCount, getById, remove, getListaCadastros }
}