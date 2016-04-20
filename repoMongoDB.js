/**
 * Created by user1 on 18/11/2015.
 */
var logger = require('./log.js').logger;
var MongoClient = require('mongodb').MongoClient;
var config = require('./config.json');
var host = config.mongodb.host;
var port = config.mongodb.port;
var db = config.mongodb.db;
//var collection=config.mongodb.collection;
var async = require('async');

var url = 'mongodb://' + host + ':' + port + '/' + db;


var _ = require('underscore');
//"text/html"
exports.getNodeIdByMimeType = function getDataByMimeType(mimeType, startId, size, callback) {
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection(collection);
        var query = {$and: [{sys_nodeId: {"$gt": startId}}, {sys_mimetype: mimeType}]};
        var projection = {sys_nodeId: 1};
        var sort = {sys_nodeId: 1};
        cmsnodes.find(query, projection).sort(sort).limit(size).toArray(function (err, docs) {
            var nodeIdArray = [];
            for (var i = 0; i < docs.length; i++) {
                var sys_nodeId = docs[i].sys_nodeId;
                nodeIdArray.push(sys_nodeId);
            }
            db.close();
            return callback(nodeIdArray);
        });
    });
};

exports.getByTransactionId = function getByTransactionId(transId, callback) {
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection(collection);
        var query = {sys_transaction_id: transId};
        var projection = {_id: 0};
        var sort = {sys_transaction_id: 1};
        cmsnodes.find(query, projection).sort(sort).toArray(function (err, docs) {
            var nodeArray = [];
            for (var i = 0; i < docs.length; i++) {

                var id = docs[i].sys_nodeId;
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
exports.getByTransactionIds = function getByTransactionIds(startTransId, endTransId, callback) {

    MongoClient.connect(url, function (err, db) {

        var cmsnodes = db.collection(collection);

        var query = {$and: [{sys_transaction_id: {"$gt": startTransId}}, {sys_transaction_id: {"$lte": endTransId}}]};
        var projection = {_id: 0};
        var sort = {sys_transaction_id: 1};
        cmsnodes.find(query, projection).sort(sort).toArray(function (err, docs) {
            var nodeArray = [];
            for (var i = 0; i < docs.length; i++) {

                var id = docs[i].sys_nodeId;
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

exports.getBatchTransactionIds = function getBatchTransactionIds(startTransId, callback) {
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection(collection);
        //workaround solution , since mongodb distinct sort not working yet for version 3.0
        //limitation: if batch size >$limit(5000), this solution not working
        //hardcode size to 100
        var size = 100;
        cmsnodes.aggregate(
            [
                {
                    $match: {
                        "sys_transaction_id": {"$gt": startTransId}
                    }
                },
                {
                    $sort: {
                        "sys_transaction_id": 1
                    }
                },
                {
                    $limit: 5000
                },
                {
                    $project: {"sys_transaction_id": 1}
                },
                {
                    $group: {"_id": "$sys_transaction_id"}
                },
                {
                    $sort: {"_id": 1}
                },
                {
                    $limit: 100
                }
            ]).toArray(function (err, docs) {
            var transIdArray = [];
            for (var i = 0; i < docs.length; i++) {
                var id = docs[i]._id;
                transIdArray.push(id);
            }
            db.close();
            return callback(transIdArray);

        });
    });

}

exports.bulkWrite = function bulkWrite(docs, collection,upsert, callback) {
    //logger.info('url:'+url+' collection:'+collection);

    MongoClient.connect(url, function (err, db) {
        //console.log("Connected correctly to server");
        var col = db.collection(collection);
        var bulk = col.initializeUnorderedBulkOp();

        if(upsert){
            for (var i = 0; i < docs.length; i++) {
                var obj = docs[i];
                var nodeId = obj['sys:node-dbid'];
                bulk.find({"sys:node-dbid":nodeId}).upsert().updateOne(obj);
                bulk.execute(function (err, r) {
                    console.log(err)
                    // Finish up test
                    db.close();
                    callback(err, r);
                });
            }
        }
        else{
            col.insertMany(docs);
        }


        //// Create ordered bulk, for unordered initializeUnorderedBulkOp()
        //var bulk = col.initializeUnorderedBulkOp();
        //
        //bulk.insertMany(docs);
        //// Execute the bulk with a journal write concern
        //bulk.execute(function(err, result) {
        //    db.close();
        //    return callback(result);
        //});
    });
};

exports.getMaxTxnTime = function getMaxTxnTime(callback) {
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection('transactions');
        var query = {};
        var projection = {_id: 0};
        var sort = {commitTimeMs: -1};
        cmsnodes.find(query, projection).sort(sort).limit(1).toArray(function (err, docs) {
            console.log(docs);
            maxTxnTime = docs[0].commitTimeMs;
            db.close();
            return callback(maxTxnTime);
        });
    });
};

exports.createIndexs = function createIndexs(callback) {
    MongoClient.connect(url, function (err, db) {
        async.series([
                function (callback) {
                    db.collection('transactions').createIndex(
                        {"commitTimeMs": 1}, null, function (err, results) {
                            console.log(results);
                            callback(null);
                        }
                    );
                },
                function (callback) {
                    db.collection('transactions').createIndex(
                        {"id": 1}, null, function (err, results) {
                            console.log(results);
                            callback(null);
                        }
                    );
                },
                function (callback) {
                    db.collection('workspace').createIndex(
                        {"sys:node-dbid": 1}, null, function (err, results) {
                            console.log(results);
                            callback(null);
                        }
                    );
                },
                function (callback) {
                    db.collection('workspace').createIndex(
                        {"cm:name": 1}, null, function (err, results) {
                            console.log(results);
                            callback(null);
                        }
                    );
                },
                function (callback) {
                    db.collection('workspace').createIndex(
                        {"PATH": 1}, null, function (err, results) {
                            console.log(results);
                            callback(null);
                        }
                    );
                },
            ],
// optional callback
            function (err, results) {
                callback()
            });
    });
};