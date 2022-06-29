const moment = require('moment')
const { dbPrefix, jasperServerUrl, jasperServerU, jasperServerK } = require("../.env")
const { baseFrontendUrl } = require("../config/params")
const JSIntegration = require('../config/jSIntegration')
const { cnpj } = require('cpf-cnpj-validator')
const path = require('path')
const fs = require('fs')

module.exports = app => {
    const { isMatchOrError, noAccessMsg, existsOrError } = app.api.validation
    const { capitalizeFirstLetter, removeAccents } = app.api.facilities
    const STATUS_ACTIVE = 10
    const tabelaOrgao = 'orgao'

    const getByFunction = async(req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gfo':
                getReportFolha(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    const getReportFolha = async(req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && uParams.financeiro >= 1, `${noAccessMsg} "Impressão de relatório da folha de pagamentos"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = {...req.body }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        const complementar = body.complementar || uParams.f_complementar
        const complementarTitle = complementar != "000" ? ` - Complementar: ${complementar}` : ""
        moment.locale('pt-br');
        const defaultTitle = `Relatorio Geral da Folha de Pagamento ${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM/YYYY"))}${complementarTitle}`
        const fileName = body.fileName || `Relatorio_Folha_Pagamento_${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM_YYYY"))}`

        const optionParameters = {
                "orgao": removeAccents(orgao.orgao),
                // Encaminhar parâmetros abaixo pelo body
                "logoUrl": body.logo_url || orgao.url_logo || `${baseFrontendUrl}/assets/imgs/logo_vivazul.png`,
                "titulo": removeAccents(body.titulo || defaultTitle),
                "descricao": removeAccents(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
                "dbSchema": dbSchema,
                "id_cad_servidores": body.id_cad_servidores || "ff.id_cad_servidores IS NOT NULL",
                "id_cad_centros": body.id_cad_centros || "ff.id_cad_centros IS NOT NULL",
                "id_cad_departamentos": body.id_cad_departamentos || "ff.id_cad_departamentos IS NOT NULL",
                "id_cad_cargos": body.id_cad_cargos || "ff.id_cad_cargos IS NOT NULL",
                "id_cad_locais_trabalho": body.id_local_trabalho || "ff.id_local_trabalho IS NOT NULL",
                "resumo": body.resumo || "1",
                "geral": body.geral || "1",
                "agrupar": body.agrupar || "0",
                "grupo": body.grupo || "",
                "resumirGrupo": body.resumirGrupo || "0",
                "groupBy": body.groupBy || "cs.nome, cs.matricula",
                "orderBy": body.orderBy || "cs.nome, cs.matricula",
            }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Vivazul/folha_de_pagamento/folha', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else res.send(data)
            })
            .catch((error) => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }


    return { getByFunction }
}