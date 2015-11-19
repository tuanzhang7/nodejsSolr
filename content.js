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
                result+=chunk;
            });
            res.on('end', function() {
                //logger.info("Got response end: " + result);
                return callback(result);
            });
        }else if(res.statusCode === 500) {
            logger.error("nodeId  does not exist: " + nodeId );
        }
    }).on('error', function(e) {
        logger.error("Got error: " + nodeId +"--"+e.message);
    });
    request.setTimeout( 20000, function( ) {
        logger.error("timeout: " + nodeId );
    });

};
