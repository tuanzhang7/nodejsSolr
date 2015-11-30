/**
 * Created by user1 on 18/11/2015.
 */
var logger=require('./log.js').logger;
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var url = 'mongodb://172.30.11.195:3306/cmsreports';
var collection='cmsnodes';
var _ = require('underscore');
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

//hardcode to 100 or less transactionIds
exports.getByTransactionIds = function getByTransactionIds(startTransId,endTransId,callback){

    MongoClient.connect(url, function (err, db) {

        var cmsnodes = db.collection(collection);

        var query={$and: [ {sys_transaction_id:{"$gt":startTransId}},{sys_transaction_id:{"$lte":endTransId}} ]};
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

exports.getBatchTransactionIds = function getBatchTransactionIds(startTransId,callback){
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection(collection);
        //workaround solution , since mongodb distinct sort not working yet for version 3.0
        //limitation: if batch size >$limit(5000), this solution not working
        //hardcode size to 100
        var size=100;
        cmsnodes.aggregate(
            [
                {
                    $match: {
                        "sys_transaction_id" : {"$gt" : startTransId}
                    }
                },
                {
                    $sort: {
                        "sys_transaction_id" : 1
                    }
                },
                {
                    $limit: 5000
                },
                {
                    $project: {"sys_transaction_id" : 1}
                },
                {
                    $group: {"_id" : "$sys_transaction_id"}
                },
                {
                    $sort: {"_id" : 1}
                },
                {
                    $limit: 100
                }
            ]).toArray(function (err, docs) {
                var transIdArray=[];
                for(var i=0;i<docs.length;i++){
                    var id=docs[i]._id;
                    transIdArray.push(id);
                }
                db.close();
                return callback(transIdArray);

            });
    });

}