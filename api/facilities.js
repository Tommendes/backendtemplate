module.exports = app => {
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function titleCase(str) {
        let splitStr = str.toLowerCase().split(' ');
        const pular = ['de', 'da', 'dos']
        for (var i = 0; i < splitStr.length; i++) {
            if (!(pular.includes(splitStr[i])))
                splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        return splitStr.join(' ');
    }
    
    function numbersOrZero(value) {
        let ret = value || "0"
        ret = ret.toString().replace(/([^\d])+/gim, "")
        if (ret.length = 0) ret = "0"
        return ret
    }

    function removeAccents(value) {
        let ret = value || ""
        ret = ret.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        ret = ret.replace('/[áàãâä]/ui', 'a');
        ret = ret.replace('/[éèêë]/ui', 'e');
        ret = ret.replace('/[íìîï]/ui', 'i');
        ret = ret.replace('/[óòõôö]/ui', 'o');
        ret = ret.replace('/[úùûü]/ui', 'u');
        ret = ret.replace('/[ç]/ui', 'c');
        ret = ret.replace('/[^a-z0-9]/i', '_');
        ret = ret.replace('/_+/', '_');
        // ret = ret.replaceAll('º', 'o')
        return ret
    }

    function removeAccentsObj(key, value) {
        return key != 'email' && typeof value === 'string'
            ? Array.from(value, removeAccents).join('')
            : value
    }

    function uc(objeto) {
        return objeto >= 'a' && objeto <= 'z'
            ? String.fromCharCode(objeto.charCodeAt() - 32)
            : objeto
    }
    
    function changeUpperCase(key, value) {
        return key != 'email' && typeof value === 'string'
            ? Array.from(value, uc).join('')
            : value
    }

    return { capitalizeFirstLetter, titleCase, removeAccents, removeAccentsObj, numbersOrZero, changeUpperCase }
}