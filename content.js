/**
 * Created by user1 on 18/11/2015.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var http = require('http');

var mongodbURL = 'mongodb://172.30.11.195:3306/cmsreports';

var alfHost="http://172.30.11.215";

exports.getByNodeId = function getByNodeId(nodeId,callback){
    var alfGetContentURL="/alfresco/service/api/solr/textContent?nodeId="+nodeId+"&propertyQName=%7Bhttp%3A%2F%2Fwww.alfresco.org%2Fmodel%2Fcontent%2F1.0%7Dcontent";
    var url=alfHost+alfGetContentURL;
    //console.log("get content from url:" + url);
    http.get(url, function(res) {
        //console.log("Got response: " + res.statusCode);
        var result='';
        res.on('data', function (chunk) {
            result+=chunk;
        });
        res.on('end', function() {
            //console.log("Got response end: " + result);
            return callback(result);
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
};