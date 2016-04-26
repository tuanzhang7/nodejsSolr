
var logger = require('./log.js').logger;
var utility=require('./utility.js');
var xmlhelper =require('./xmlhelper.js');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config.json');
var host = config.mongodb.host;
var port = config.mongodb.port;
var db = config.mongodb.db;
//var collection=config.mongodb.collection;
var async = require('async');
var fs = require('fs');
var _ = require('underscore');
var path=require('path');
var mkdirp = require('mkdirp');
var url = 'mongodb://' + host + ':' + port + '/' + db;


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

};

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
            col.insertMany(docs,function(err, r) {
                db.close();
                callback(err, r);
            });
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
            //console.log(docs);
            var maxTxnTime = docs[0].commitTimeMs;
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
                function (callback) {
                    db.collection('workspace').createIndex(
                        {"id":1,"PATH": 1}, null, function (err, results) {
                            console.log(results);
                            callback(null);
                        }
                    );
                }
            ],
// optional callback
            function (err, results) {
                callback();
            });
    });
};

exports.dumpByPath = function(alfpath,dumpPath,callback) {
    if(fs.existsSync(dumpPath)=== false){
        logger.info('dumpPath not exist:'+dumpPath);
        callback();
    }
    //logger.info('dumpByPath:'+alfpath);

    var begin=Date.now();
    MongoClient.connect(url, function (err, db) {
        var workspace = db.collection('workspace');
        
        var projection = {_id: 0};
        var sort = {id: 1};

        var finished=false;
        var maxId=0;
        var counter=0;

        async.whilst(
            function () { return !finished; },
            function (callback) {
                var query = { "id" : { "$gt" : maxId },PATH:{ '$regex': '^'+alfpath }};
                //logger.info(query);
                if(counter%1000===0){
                    var timeSpent=parseInt(counter/((Date.now()-begin)/1000));
                    logger.info('speed:'+timeSpent+ '/sec,  counter:'+counter);
                    // if(counter>10000) {
                    //     finished=true;
                    //     callback();
                    // }
                }
                workspace.find(query, projection).sort(sort).limit(100).toArray(function (err, docs) {
                    if(docs!== undefined && docs!== null && docs.length>0){
                        maxId=_.max(docs, function(d){ return d.id; }).id;

                        counter+=docs.length;
                        //logger.info('maxId:'+maxId+ ' counter:'+counter);
                        if(maxId!== undefined){
                            async.each(docs, function(doc, callback) {

                                var relpath=utility.convertAlfPath2Path(doc.PATH);
                                var xmlFile=utility.getMetadataFileName(relpath);
                                var fullpath=path.join(dumpPath,xmlFile);
                                var dir = path.dirname(fullpath);
                                var xml=xmlhelper.getMetadataXML(doc);
                                //logger.info('each:'+dir);
                                //logger.debug(xml);

                                fs.stat(dir, function(err, stat) {
                                    if(err !== null) {
                                        mkdirp(dir, function (err) {
                                            if (err){
                                                console.error(err);
                                                callback("mkdirp error:"+ err);
                                            }
                                            else{
                                                fs.writeFile(fullpath, xml,'utf8', function(err) {
                                                    if(err) {
                                                        logger.error("writeFileError:"+ err);
                                                        callback("writeFileError:"+ err);
                                                    }
                                                    callback();
                                                });
                                            }
                                        });
                                    }
                                    else{
                                        callback();
                                    }
                                });
                                //if (fs.existsSync(dir)===false) {
                                //    mkdirp.sync(dir);
                                //}
                                //fs.writeFile(fullpath, xml,'utf8', function(err) {
                                //    if(err) {
                                //        return logger.error("writeFileError:"+ err);
                                //    }
                                //});
                            }, function(err){
                                // if any of the file processing produced an error, err would equal that error
                                if( err ) {
                                    // One of the iterations produced an error.
                                    // All processing will now stop.
                                    console.log('A file failed to process:'+err);
                                } else {
                                    //console.log('All files have been processed successfully');
                                    callback();
                                }
                            });
                        }
                        else{
                            logger.info('could not get maxid');
                            finished=true;
                            callback();
                        }

                    }
                    else{
                        logger.info('total counter:'+counter);
                        finished=true;
                        callback();
                    }
                });
            },
            function (err, n) {
                db.close();
                var timeSpent=parseInt(counter/((Date.now()-begin)/1000));
                logger.info('Speed:'+timeSpent+ '/sec,  Total:'+counter);
                callback();
            }
        );
    });
};

exports.dropDB = function (callback) {
    MongoClient.connect(url, function (err, db) {
        db.dropDatabase(function(err, result) {
            db.close();
            callback();
        });

    });
};
