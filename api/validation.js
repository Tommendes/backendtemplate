const { cpf, cnpj } = require('cpf-cnpj-validator')

module.exports = app => {
    function cpfOrError(value, msg) {
        if (!cpf.isValid(value)) throw msg ? msg : "CPF inválido"
    }

    function cnpjOrError(value, msg) {
        if (!cnpj.isValid(value)) throw msg ? msg : "CNPJ inválido"
    }

    function lengthOrError(value, lengthCompare, msg) {
        if (value.length != lengthCompare) throw msg
    }

    function existsOrError(value, msg) {
        if (!value) throw msg
        if (Array.isArray(value) && value.length === 0) throw msg
        if (typeof value === 'string' && !value.trim()) throw msg
    }

    function booleanOrError(value, msg) {
        if (typeof value === 'boolean' && !(value === true || value === false)) throw msg
    }

    function valueOrError(value, msg) {
        if (!value) throw msg
        if (value.isNan) throw msg
        if (value < 0.01) throw msg
    }

    function IntegerOrError(value, msg) {
        if (!value) throw msg
        if (value.isNan) throw msg
        if (!Number.isInteger(value)) throw msg
    }

    function valueMinorOrError(valueMinor, value, msg) {
        valueOrError(value, msg)
        valueOrError(valueMinor, msg)
        IntegerOrError(value, msg)
        if (valueMinor > value) throw msg
    }

    function valueMajorOrError(valueMajor, value, msg) {
        valueOrError(value, msg)
        valueOrError(valueMajor, msg)
        IntegerOrError(value, msg)
        if (valueMajor < value) throw msg
    }

    function notExistsOrError(value, msg) {
        try {
            existsOrError(value, msg)
        } catch (error) {
            return
        }
        throw msg
    }

    function equalsOrError(valueA, valueB, msg) {
        if (valueA !== valueB) throw msg
    }

    function diffOrError(valueA, valueB, msg) {
        if (valueA == valueB) throw msg
    }

    function isMatchOrError(valueMatch, msg) {
        if (!valueMatch) throw msg
    }

    function emailOrError(valueA) {
        const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegexp.test(valueA)
    }

    const noAccessMsg = 'Ops!!! Parece que seu perfil não dá acesso a essa operação'

    return {
        cpfOrError, cnpjOrError, lengthOrError, existsOrError, booleanOrError, valueOrError, IntegerOrError,
        valueMinorOrError, valueMajorOrError,
        notExistsOrError, equalsOrError, diffOrError, isMatchOrError, emailOrError, noAccessMsg
    }
}