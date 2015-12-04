/**
 * Created by user1 on 18/11/2015.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var http = require('http');
var logger=require('./log.js').logger;
var escapeStringRegexp = require('escape-string-regexp');

var mongodbURL = 'mongodb://172.30.11.195:3306/cmsreports';

var alfHostName="10.14.244.84";

exports.getContentByNodeId = function getContentByNodeId(nodeId,callback){
    var alfGetContentURL="/alfresco/service/api/solr/textContent?nodeId="+nodeId+"&propertyQName=%7Bhttp%3A%2F%2Fwww.alfresco.org%2Fmodel%2Fcontent%2F1.0%7Dcontent";

    var options = {
        hostname: alfHostName,
        port: 80,
        path: alfGetContentURL,
        method: 'GET',
        agent:false
    };
    //var keepAliveAgent = new http.Agent({ keepAlive: true });
    //options.agent = keepAliveAgent;

    var request = http.get(options, function(res) {
        //logger.info("Got response: " + res.statusCode);
        if (res.statusCode === 200) {
            var result='';
            res.on('data', function (chunk) {
                //dlprogress += chunk.length;
                result+=chunk;
            });
            res.on('end', function() {
                //logger.info("Got response end: " + result);
                //>100mb
				logger.info("Downloaded: " + nodeId+" size:"+formatBytes(result.length));
                if(result.length>13107200){
                    logger.info("Downloaded Large file: " + nodeId+" size:"+formatBytes(result.length));
                }
                return callback(result);
            });
        }else if(res.statusCode === 500) {
            logger.error("nodeId  does not exist: " + nodeId );
            return callback();
        }else if(res.statusCode === 204) {
            logger.info("no content: " + nodeId );
            return callback();
        }
    }).on('error', function(e) {
        logger.error("Got error: " + nodeId +"--"+e.message);
    });
    request.setTimeout( 50000, function( ) {
        logger.error("timeout: " + nodeId );
    });

};

exports.getMetadataByNodeId= function getMetadataByNodeId(nodeId,callback){

    var body = JSON.stringify({
        "fromNodeId": nodeId,
        "toNodeId": nodeId,
        "maxResults": 1
    });
    var options = {
        hostname: alfHostName,
        port: 80,
        path: "/alfresco/service/api/solr/metadata",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    var request = http.request(options, function(res) {
        logger.info("Got response: " + res.statusCode);
        if (res.statusCode === 200) {
            var result='';
            res.on('data', function (chunk) {
                result+=chunk;
            });
            res.on('end', function() {

                return callback(result);
            });
        }else if(res.statusCode === 500) {
            logger.error("nodeId does not exist: " + nodeId );
            return callback();
        }else if(res.statusCode === 204) {
            logger.error("no metadata???: " + nodeId );
            return callback();
        }
    }).on('error', function(e) {
        logger.error("Got metadata error: " + nodeId +"--"+e.message);
    });
    request.end(body);
    request.setTimeout( 10000, function( ) {
        logger.error("timeout: will abort" + nodeId );
        request.abort();
    });
};

exports.convertAlfNodeJson= function convertAlfNodeJson(node){

    //node=node.replace('"NCMS:','"');
    //node = node.replace(/"NCMS:/g, '"');
    var nodeJson = JSON.parse(node, function(key, value) {
        if (value && typeof value === 'object')
            for (var k in value) {
                if(k=='cm:title'||k=='cm:modifier'||k=='cm:creator'
                    ||k=='sys:locale'||k=='cm:content'||k=='sys:store-identifier'||k=='sys:store-protocol'){
                    delete value[k];
                }
                else if (k.indexOf(':')>0 && Object.hasOwnProperty.call(value, k)) {
                    value[k.replace(':','_')] = value[k];
                    delete value[k];
                }
            }
        return value;
    });

    //var nodeJson=JSON.parse(node)
    var obj=nodeJson.properties;
    obj.PATH=formatAlfPath(nodeJson.paths[0].path);
    obj.id=nodeJson.id;
    obj.txnId=nodeJson.txnId;

    logger.info(JSON.stringify(obj));
    //delete obj["cm_title"];
    //delete obj["cm_modifier"];
    //delete obj["cm_creator"];
    //delete obj["sys_locale"];



    return obj;
};

function formatAlfPath(alfPath){
    var regCm = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/content/1.0}'),'g');
    var regApp = new RegExp(escapeStringRegexp('{http://www.alfresco.org/model/application/1.0}'),'g');

    return alfPath.replace(regCm,'cm:')
        .replace(regApp,'app:');
}

function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Byte';
    var k = 1000;
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
}

exports.__formatAlfPath=formatAlfPath;