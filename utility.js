var escapeStringRegexp = require('escape-string-regexp');
var ISO9075 = require('./ISO9075');

function formatAlfPath(alfPath){
    var regCm = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/content/1.0}'),'g');
    var regApp = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/application/1.0}'),'g');

    return alfPath.replace(regCm,'cm:')
        .replace(regApp,'app:');
}

exports.toSimplePrefix=function(str){
    // <cm:content xmlns="" xmlns:rn="http://www.alfresco.org/model/rendition/1.0" xmlns:sys="http://www.alfresco.org/model/system/1.0" xmlns:lnk="http://www.alfresco.org/model/linksmodel/1.0" xmlns:ver="http://www.alfresco.org/model/versionstore/1.0" xmlns:cmiscustom="http://www.alfresco.org/model/cmis/custom" xmlns:emailserver="http://www.alfresco.org/model/emailserver/1.0" xmlns:fm="http://www.alfresco.org/model/forum/1.0" xmlns:ia="http://www.alfresco.org/model/calendar" xmlns:rule="http://www.alfresco.org/model/rule/1.0"  xmlns:dl="http://www.alfresco.org/model/datalist/1.0" xmlns:st="http://www.alfresco.org/model/site/1.0" xmlns:usr="http://www.alfresco.org/model/user/1.0" xmlns:custom="custom.model" xmlns:exif="http://www.alfresco.org/model/exif/1.0" xmlns:app="http://www.alfresco.org/model/application/1.0" xmlns:module="http://www.alfresco.org/system/modules/1.0" xmlns:d="http://www.alfresco.org/model/dictionary/1.0" xmlns:blg="http://www.alfresco.org/model/blogintegration/1.0" xmlns:alf="http://www.alfresco.org" xmlns:cmis="http://www.alfresco.org/model/cmis/1.0/cs01" xmlns:bpm="http://www.alfresco.org/model/bpm/1.0" xmlns:inwf="http://www.alfresco.org/model/workflow/invite/nominated/1.0" xmlns:imap="http://www.alfresco.org/model/imap/1.0" xmlns:cm="http://www.alfresco.org/model/content/1.0" xmlns:reg="http://www.alfresco.org/system/registry/1.0" xmlns:ver2="http://www.alfresco.org/model/versionstore/2.0" xmlns:stcp="http://www.alfresco.org/model/sitecustomproperty/1.0" xmlns:view="http://www.alfresco.org/view/repository/1.0" xmlns:imwf="http://www.alfresco.org/model/workflow/invite/moderated/1.0" xmlns:act="http://www.alfresco.org/model/action/1.0" xmlns:wf="http://www.alfresco.org/model/workflow/1.0" xmlns:trx="http://www.alfresco.org/model/transfer/1.0" view:childName="cm:notify_user_email.html.ftl">

    var regCm = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/content/1.0}'),'g');
    var regApp = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/application/1.0}'),'g');
    var regSYS = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/system/1.0}'),'g');
    var regST = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/site/1.0}'),'g');
    var regexif = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/exif/1.0}'),'g');
    var ver2=new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/versionstore/2.0}'),'g');
    var lnk=new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/linksmodel/1.0}'),'g');

    return str.replace(regCm,'cm:')
        .replace(regApp,'app:')
        .replace(regSYS,'sys:')
        .replace(regST,'st:')
        .replace(regexif,'exif:')
        .replace(ver2,'ver2:')
        .replace(lnk,'lnk:');
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
