module.exports = middleware => {
    return (req, res, next) => {
        if (req.user.gestor == 1) {
            middleware(req, res, next)
        } else {
            res.status(401).send('Usuário não é gestor.')
        }
    }
}