
module.exports = app => {
    const tabela = 'cidades'

    const getListaCidades = async (req, res) => {
        const uf = req.params.uf
        let sql = app.db({ c: 'cidades' })
            .select('id', 'municipio')
            .where({ uf: uf }).orderBy('municipio')
        sql.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { getListaCidades }
}