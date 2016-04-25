
var http = require('http');
var logger=require('./log.js').logger;
var config = require('./config.json');
var utlity=require('./utility.js');

var alfHostName=config.alfresco.host;//"localhost";//"ncmsr.nlb.gov.sg";//"10.14.244.84";
var maxSockets=config.alfresco.maxSockets;
exports.getContentByNodeId = function getContentByNodeId(nodeId,callback){
    var alfGetContentURL="/alfresco/service/api/solr/textContent?nodeId="+nodeId+"&propertyQName=%7Bhttp%3A%2F%2Fwww.alfresco.org%2Fmodel%2Fcontent%2F1.0%7Dcontent";

    var options = {
        hostname: alfHostName,
        port: 80,
        path: alfGetContentURL,
        method: 'GET'
        //agent:false
    };
    var keepAliveAgent = new http.Agent({ keepAlive: true });
    options.agent = keepAliveAgent;

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
    var keepAliveAgent = new http.Agent({ keepAlive: false,maxSockets:maxSockets });
    options.agent = keepAliveAgent;
    var request = http.request(options, function(res) {
        if (res.statusCode === 200) {
            var result='';
            res.on('data', function (chunk) {
                result+=chunk;
            });
            res.on('end', function() {
                return callback(null,result);
            });
        }else if(res.statusCode === 500) {
            return callback(new Error("Erro Code 500, no nodes in txns : " +  nodeId));
        }else if(res.statusCode === 204) {
            return callback(new Error("no nodes in txns 204: " +  nodeId));
        }
    }).on('error', function(e) {
        return callback(new Error("Get metadata error: " + nodeId +"--"+e.message));
    });
    request.end(body);
    request.setTimeout( 20000, function( ) {
        logger.error("timeout: will abort,check if is folder:" + nodeId );
        request.abort();
    });
};

exports.getMetadataByNodeIds= function getMetadataByNodeIds(nodeIdList,callback){

    var body = JSON.stringify({
        "nodeIds": nodeIdList,
        "maxResults": 0
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
    var keepAliveAgent = new http.Agent({ keepAlive: false,maxSockets:maxSockets });
    options.agent = keepAliveAgent;
    var request = http.request(options, function(res) {
        if (res.statusCode === 200) {
            var result='';
            res.on('data', function (chunk) {
                result+=chunk;
            });
            res.on('end', function() {
                return callback(null,result);
            });
        }else if(res.statusCode === 500) {
            return callback(new Error("no nodes in txns 500: "+nodeIdList[0]  ));
        }else if(res.statusCode === 204) {
            return callback(new Error("no nodes in txns 204: "+nodeIdList[0]  ));
        }
    }).on('error', function(e) {
        return callback(new Error("Get metadata error: " +nodeIdList[0]+  "--"+e.message));
    });
    request.end(body);
    request.setTimeout( 180000, function( ) {
        logger.error("timeout: will abort,check if is large folder:"+nodeIdList.toString()  );
        request.abort();
    });
};

exports.getNodesByTxnId= function getNodesByTxnId(fromTxnId,toTxnId,callback){

    var body = JSON.stringify({
        "fromTxnId": fromTxnId,
        "toTxnId": toTxnId,
        "maxResults": 0
    });
    var options = {
        hostname: alfHostName,
        port: 80,
        path: "/alfresco/service/api/solr/nodes",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };
    var keepAliveAgent = new http.Agent({ keepAlive: false,maxSockets:maxSockets });
    options.agent = keepAliveAgent;
    var request = http.request(options, function(res) {
        if (res.statusCode === 200) {
            var result='';
            res.on('data', function (chunk) {
                result+=chunk;
            });
            res.on('end', function() {
                return callback(null,result);
            });
        }else if(res.statusCode === 500) {
            return callback(new Error("getNodesByTxnId error 500: " +  fromTxnId+"-"+toTxnId));
        }else if(res.statusCode === 204) {
            return callback(new Error("no nodes in txns 204: " +  fromTxnId+"-"+toTxnId));
        }
    }).on('error', function(e) {
        //logger.error("getNodesByTxnId error: " +  fromTxnId+"-"+toTxnId  +"--"+e.message);
        return callback(new Error("getNodesByTxnId error: " + fromTxnId+"-"+toTxnId  +"--"+e.message));

    });
    request.end(body);
    //request.setTimeout( 30000, function( ) {
    //    logger.error("timeout: will abort" + fromTxnId+"-"+toTxnId );
    //    request.abort();
    //});
};

exports.getTxnsByTime= function getTxnsByTime(fromCommitTime,toCommitTime,maxResults,callback){
    //1325347200000 2012/01/01
    var alfURL="/alfresco/service/api/solr/transactions?fromCommitTime="+fromCommitTime+"&toCommitTime="+toCommitTime+"&maxResults="+maxResults;
    var options = {
        hostname: alfHostName,
        port: 80,
        path: alfURL,
        method: 'GET'//,
        //agent: false
    };

    var keepAliveAgent = new http.Agent({ keepAlive: false,maxSockets:maxSockets });
    options.agent = keepAliveAgent;

    var request = http.get(options, function(res) {
        //logger.info("Got response: " + res.statusCode);
        if (res.statusCode === 200) {
            var result='';
            res.on('data', function (chunk) {
                result+=chunk;
            });
            res.on('end', function() {
                return callback(null,result);
            });
        }else if(res.statusCode === 500) {
            return callback(new Error("Got Txns error 500: " + fromCommitTime));
        }else if(res.statusCode === 204) {
            return callback(new Error("Got Txns error 204: " + fromCommitTime));
        }
    }).on('error', function(e) {
        //logger.error("Got Txns error: " + fromCommitTime +"--"+e.message);
        callback(new Error("Got Txns error: " + fromCommitTime +"--"+e.message));
        //return callback();
    });
    //request.setTimeout( 10000, function( ) {
    //    logger.error("timeout: will abort" + fromCommitTime );
    //    request.abort();
    //});
};

exports.convertAlfNodeJson= function convertAlfNodeJson(node){
    var nodeJson = JSON.parse(node, function(key, value) {
        //if (value && typeof value === 'object')
            //for (var k in value) {
            //    if(k=='cm:title'||k=='cm:modifier'||k=='cm:creator'
            //        ||k=='sys:locale'||k=='cm:content'||k=='sys:store-identifier'||k=='sys:store-protocol'){
            //        delete value[k];
            //    }
            //    else if (k.indexOf(':')>0 && Object.hasOwnProperty.call(value, k)) {
            //        value[k.replace(':','_')] = value[k];
            //        delete value[k];
            //    }
            //}
        return value;
    });

    //var nodeJson=JSON.parse(node)
    var obj=nodeJson.properties;
    obj.PATH=utlity.formatAlfPath(nodeJson.paths[0].path);
    obj.id=nodeJson.id;
    obj.txnId=nodeJson.txnId;
    obj.type=nodeJson.type;
    obj.nodeRef=nodeJson.nodeRef;
    obj.aspects=nodeJson.aspects;
    //logger.info(JSON.stringify(obj));
    //delete obj["cm_title"];
    //delete obj["cm_modifier"];
    //delete obj["cm_creator"];
    //delete obj["sys_locale"];
    return obj;
};

