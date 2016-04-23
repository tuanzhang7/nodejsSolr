var escapeStringRegexp = require('escape-string-regexp');

function formatAlfPath(alfPath){
    var regCm = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/content/1.0}'),'g');
    var regApp = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/application/1.0}'),'g');

    return alfPath.replace(regCm,'cm:')
        .replace(regApp,'app:');
}

function convertAlfPath2Path(alfPath){
    var regCm = new RegExp(escapeStringRegexp('cm:'),'g');
    var regApp = new RegExp(escapeStringRegexp('app:'),'g');

    return alfPath.replace(regCm,'').replace(regApp,'');
}

function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Byte';
    var k = 1000;
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
}
exports.convertAlfPath2Path=convertAlfPath2Path;
exports.formatAlfPath=formatAlfPath;
exports.formatBytes=formatBytes;
