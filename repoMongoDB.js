/**
 * Created by user1 on 18/11/2015.
 */
var logger=require('./log.js').logger;
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var url = 'mongodb://172.30.11.195:3306/cmsreports';
var collection='cmsnodes';
//"text/html"
exports.getNodeIdByMimeType = function getDataByMimeType(mimeType,startId,size,callback){
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection(collection);
        var query={ $and: [ {sys_nodeId:{"$gt":startId}},{sys_mimetype:mimeType} ] };
        var projection={ sys_nodeId: 1 };
        var sort={sys_nodeId:1};
        cmsnodes.find(query,projection).sort(sort).limit(size).toArray(function (err, docs) {
            var nodeIdArray=[];
            for(var i=0;i<docs.length;i++){
                var sys_nodeId=docs[i].sys_nodeId;
                nodeIdArray.push(sys_nodeId);
            }
            db.close();
            return callback(nodeIdArray);
        });
    });
};

exports.getByTransactionId = function getByTransactionId(transId,callback){
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection(collection);
        var query={sys_transaction_id:transId};
        var projection={ _id: 0};
        var sort={sys_transaction_id:1};
        cmsnodes.find(query,projection).sort(sort).toArray(function (err, docs) {
            var nodeArray=[];
            for(var i=0;i<docs.length;i++){

                var id=docs[i].sys_nodeId;
                docs[i]["id"] = id;
                delete docs[i]["sys_nodeId"];

                //logger.info('id:'+id+" title:"+docs[i].title);
                nodeArray.push(docs[i]);
            }
            db.close();
            return callback(nodeArray);
        });
    });
};