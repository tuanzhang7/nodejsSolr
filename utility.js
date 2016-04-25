var escapeStringRegexp = require('escape-string-regexp');
var ISO9075 = require('./ISO9075');

function formatAlfPath(alfPath){
    var regCm = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/content/1.0}'),'g');
    var regApp = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/application/1.0}'),'g');

    return alfPath.replace(regCm,'cm:')
        .replace(regApp,'app:');
}

exports.convertAlfPath2Path=function (alfPath){
    var regCm = new RegExp(escapeStringRegexp('cm:'),'g');
    var regApp = new RegExp(escapeStringRegexp('app:'),'g');
    var path=alfPath.replace(regCm,'').replace(regApp,'');
    return ISO9075.decode(path);
}

function formatBytes(bytes,decimals) {
    if(bytes == 0){
        return '0 Byte';
    } 
    var k = 1000;
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
}
exports.chunk=function chunk (arr, len) {

    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
};
exports.getMetadataFileName=function (filename) {
    return filename+".metadata.properties.xml";
};

exports.formatAlfPath=formatAlfPath;
exports.formatBytes=formatBytes;
