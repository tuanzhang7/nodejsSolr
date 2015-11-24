/**
 * Created by user1 on 18/11/2015.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var http = require('http');
var logger=require('./log.js').logger;


var mongodbURL = 'mongodb://172.30.11.195:3306/cmsreports';

var alfHost="http://10.14.244.84";

exports.getByNodeId = function getByNodeId(nodeId,callback){
    var alfGetContentURL="/alfresco/service/api/solr/textContent?nodeId="+nodeId+"&propertyQName=%7Bhttp%3A%2F%2Fwww.alfresco.org%2Fmodel%2Fcontent%2F1.0%7Dcontent";
    var url=alfHost+alfGetContentURL;
    var options = {
        hostname: '10.14.244.84',
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
function formatBytes(bytes,decimals) {
    if(bytes == 0) return '0 Byte';
    var k = 1000;
    var dm = decimals + 1 || 3;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
}
