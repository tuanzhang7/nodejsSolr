
var _ = require('underscore');
var async = require('async');
var moment= require('moment');
var fs = require('fs');

var repo = require('./repoMongoDB');
var repoAlfresco = require('./repoAlfresco');
var logger=require('./log.js').logger;
var configs = require('./config.js');
var utility=require('./utility.js');

var start;
var middle=moment();
var saveDirectory=configs.alfresco.contentCachePath;

var counter=0;
var txnsCounter=0;
var excludeTypes=["cm:category","sys:container","cm:folder","cm:thumbnail"];
exports.indexContent = function indexContent(cursor,mimeType,size) {
    repo.getNodeIdByMimeType(mimeType,cursor,size, function (data) {
        logger.info('processing:');
        //if(counter>=1000){
        //    stopWatch(start,counter);
        //    return;
        //}
        if(data.length==0){
            logger.info("no more data in database");
            stopWatch(start,counter);
            //return;
        }else{
            startId=_.max(data);
            //logger.info('next:'+startId);
            async.series([
                    function(callback){
                        var updateArray=[];
                        async.eachLimit(data,5, function (nodeId,callback) {
                            //logger.info("process:"+nodeId);
                            var digit = (''+nodeId).slice(0,3);
                            var path=saveDirectory+digit;
                            var fileName=path+"/"+nodeId+".txt";
                            fs.exists(fileName, function (exists) {
                                if(exists){
                                    fs.readFile(fileName,'utf8', function (err, data) {
                                        if (err) throw err;
                                        //logger.info("read from local."+nodeId);
                                        //var updateDoc = {
                                        //    id : nodeId,
                                        //    Dc_location : {"set" :JSON.stringify(data)}
                                        //};
                                        //updateArray.push(updateDoc);
                                        solrClient.updateContent(nodeId,data, function (err) {
                                            if (err) throw err;
                                            callback();
                                        });
                                    });
                                }
                                else{
                                    //logger.info("before save to local:"+nodeId);
                                    contentHelper.getContentByNodeId(nodeId, function (data2) {
                                        //logger.info("got file from alf:"+nodeId);
                                        if(data2){
                                            if (fs.existsSync(path)===false) {
                                                fs.mkdirSync(path);
                                            }
                                            fs.writeFile(fileName, data2, function(err) {
                                                //logger.info("save to local."+nodeId);
                                                //callback();
                                                if(err) {
                                                    return logger.error(err);
                                                }
                                                solrClient.updateContent(nodeId,data2, function (err) {
                                                    if (err) throw err;
                                                    callback();
                                                });
                                            });
                                        }
                                        else{
                                            callback();
                                        }
                                    });
                                }
                            });
                        }, function(done) {
                            //console.log("done"+updateArray.length);
                            //too large for 500 pdf files
                            //solrClient.updateContents(updateArray,function (err) {
                            //    if (err) throw err;
                            //    callback();
                            //});
                            callback();
                        });
                    }
                ],
                function(err, results){
                    //logger.info('processed:'+startId);
                    counter+=size;
                    if(counter%1000==0){
                        stopWatch(middle,1000);
                        middle=moment().valueOf();
                    }
                    indexContent(startId,mimeType,size);
                });
        }
    });
};

exports.indexMetadata = function indexMetadata(startTransId) {

    repo.getBatchTransactionIds(startTransId,function (data) {
        logger.info('processing TransId:'+startTransId);
        //if(counter>=50000){
        //    stopWatch(start,counter);
        //    return;
        //}
        if(data.length==0){
            logger.info("no more data in database");
            stopWatch(start,counter);
            //return;
        }else{
            var size=0;
            var endTransId=_.max(data);
            //logger.info('next:'+startId);
            async.series([
                function(callback){
                    repo.getByTransactionIds(startTransId,endTransId,function (docs) {
                        if(docs){
                            size=docs.length;
                            logger.info('batch size:'+size);
                            //solrClient.updateContents(docs, function (err) {
                            //    if (err) throw err;
                                callback();
                            //});
                        }
                        else{
                            callback();
                        }
                    });
                }
            ],
            function(err, results){
                //logger.info('processed:'+startId);
                counter+=size;
                if(counter%1000==0){
                    stopWatch(middle,1000);
                    middle=moment().valueOf();
                }
                indexMetadata(endTransId);
            });
        }
    });
};

exports.indexMetadataFromAlf = function indexMetadataFromAlf(options,startCommitTime,isFullIndex, callback) {

    var getMetadataThreads = options.getMetadataThreads || 6;
    var maxResults = options.maxResults || 500;
    var chunksSize = options.chunksSize || 100;
    var indexCommitTimeInterval = options.indexCommitTimeInterval || 2;
    var TYPE = options.TYPE || "cm:content";
    if(typeof start==="undefined"){start=moment();}
    var finished=false;

    var _fromCommitTime=startCommitTime;
    var skipNodeIds=configs.alfresco.skipNodeId;

    async.whilst(
        function () { return !finished; },
        function (callback) {
            var _toCommitTime=moment(_fromCommitTime).add(indexCommitTimeInterval, 'hours');
            var size=0;
            async.waterfall([
                function(callback) {
                    //console.log("first waterfall");
                    repoAlfresco.getTxnsByTime(_fromCommitTime,_toCommitTime,maxResults,function (err,data) {
                        if(err){
                            logger.error('getTxnsByTime error', err);
                            return callback(err);
                        }
                        else if(data){
                            var txns=JSON.parse(data);
                            var maxTxnCommitTime=txns.maxTxnCommitTime;
                            var maxTxnId=txns.maxTxnId;

                            //Time more than maxTxnCommitTime, exit
                            if(_toCommitTime>txns.maxTxnCommitTime){
                                logger.info("=== No more data after date "+moment(_toCommitTime).format());
                                logger.info('==Total txns:'+txnsCounter+ ' maxTxnCommitTime:'+maxTxnCommitTime);
                                finished=true;
                                return callback("finished");
                            }
                            else{
                                var txnsSize=txns.transactions.length;

                                //set next round start time
                                if(txnsSize === maxResults){
                                    _fromCommitTime=_.max(txns.transactions, function(t){ return t.commitTimeMs; }).commitTimeMs;
                                }
                                else{
                                    _fromCommitTime=_toCommitTime;
                                }

                                var size=0;
                                if(txnsSize>0) {
                                    txnsCounter = txnsCounter + txnsSize;
                                    //logger.info(' Total txns:'+txnsCounter);
                                    logger.info('time:' + _fromCommitTime + "-" + _toCommitTime + "  " + moment(_fromCommitTime).format() + " txnsSize:" + txnsSize);

                                    var firstTxnId = _.min(txns.transactions, function (t) {
                                        return t.id;
                                    }).id;
                                    var lastTxnId = _.max(txns.transactions, function (t) {
                                        return t.id;
                                    }).id;

                                    callback(null, firstTxnId, lastTxnId,txns.transactions);
                                }
                                else{
                                    callback("no txns");
                                }
                            }
                        }
                    });
                },
                function(firstTxnId, lastTxnId,transactionsArray, callback) {
                    //console.log("second waterfall: firstTxnId: "+firstTxnId+" lastTxnId:"+lastTxnId);

                    repoAlfresco.getNodesByTxnId(firstTxnId,lastTxnId, function (err,nodesResult) {
                        if (err) {
                            logger.error('getNodesByTxnId error', err);
                            callback(err);
                        }
                        else if (nodesResult) {
                            var nodesArray=JSON.parse(nodesResult).nodes;
                            size+=nodesArray.length;
                            var nodeIdList=_.pluck(nodesArray, 'id');

                            if(skipNodeIds){
                                nodeIdList=_.difference(nodeIdList, skipNodeIds);
                            }
                            callback(null, nodeIdList,transactionsArray);
                        }
                        else{
                            logger.info("No Metadata:" + JSON.parse(nodesResult).nodes);
                            callback();
                        }
                    });

                },
                function(nodeIdList,transactionsArray, callback) {
                    // arg1 now equals 'three'
                    //console.log("third waterfall nodeIdList.length:"+ nodeIdList.length);
                    var workspaceArray=[];
                    var archiveArray=[];
                    var chunks=utility.chunk(nodeIdList,chunksSize);
                    async.eachLimit(chunks,getMetadataThreads, function (chunkArray,callback) {
                        repoAlfresco.getMetadataByNodeIds(chunkArray, function (err,data2) {
                            if(err){
                                logger.error('getMetadataByNodeIds error', err);
                                callback();
                            }
                            else if(data2){
                                var metadata=JSON.parse(data2);

                                for (var i = 0; i < metadata.nodes.length; i++) {
                                    var obj = metadata.nodes[i];

                                    if((obj.owner!=="System" && obj.owner!==undefined)){//obj.type==TYPE||obj.type=="cm:content"
                                        if( obj.type!=="cm:thumbnail" && obj.type!=="cm:folder"&&
                                            obj.type!=="cm:failedThumbnail"&& obj.type!=="cm:person"){
                                            //logger.info("owner:"+obj.owner + " obj.type:"+obj.type+ " obj.ID:"+obj.id);
                                            //logger.info(metadata.nodes[0].id);
                                            var result=repoAlfresco.convertAlfNodeJson(JSON.stringify(obj));
                                            //logger.info(result);

                                            if(result["sys:store-protocol"]==="workspace" ){
                                                workspaceArray.push(result);
                                            }
                                            if(result["sys:store-protocol"]==="archive" ){
                                                archiveArray.push(result);
                                            }
                                        }
                                    }
                                }
                                callback();
                            }

                        });
                    }, function(error) {
                        callback(null, workspaceArray,archiveArray,transactionsArray);
                    });

                },
                function(workspaceArray,archiveArray,transactionsArray, callback) {
                    //console.log("last waterfall");

                    var upsert=!isFullIndex;
                    async.series([
                        function(callback){
                            if(workspaceArray&&workspaceArray.length>0){
                                logger.error('insert to workspace DB:'+workspaceArray.length);
                                repo.bulkWrite(workspaceArray,"workspace",upsert,function(err,result){
                                    if(err){
                                        logger.error('error bulk insert to workspace DB:'+err);
                                    }
                                    callback(null, 'one');
                                });
                            }else{
                                callback(null, 'two');
                            }
                        },
                        function(callback){
                            if(archiveArray&&archiveArray.length>0){
                                repo.bulkWrite(archiveArray,"archive",upsert,function(err,result){
                                    if(err){
                                        logger.error('error bulk insert to archive DB:'+err);
                                    }
                                    callback(null, 'two');
                                });
                            }else{
                                callback(null, 'two');
                            }
                        },
                        function(callback){
                            repo.bulkWrite(transactionsArray,"transactions",false,function(err,result){
                                if(err){
                                    logger.error('error bulk insert to transactions DB:'+err);
                                }
                                callback(null, 'three');
                            });
                        }
                    ],
                    function(err, results){
                        //callback();
                    });
                    callback();
                    callback(null, 'done');
                }
            ], function (err, result) {
                if(err==='finished'){
                    console.log("waterfall finished");
                    counter+=size;
                    stopWatch(middle,size);
                    middle=moment().valueOf();
                }
                else if(err==='no txns'){
                    //console.log("no txns, continue");
                }
                else{
                    counter+=size;
                    stopWatch(middle,size);
                    middle=moment().valueOf();
                }
                // result now equals 'done'

                callback();
            });
        },
        function (err, n) {
            stopWatch(start,counter);
            console.log("End Wilist");
            callback();
        }
    );
};

exports.indexMetadataFromAlf_temp = function indexMetadataFromAlf(options,startCommitTime,isFullIndex, callback) {

    var getMetadataThreads = options.getMetadataThreads || 6;
    var maxResults = options.maxResults || 500;
    var chunksSize = options.chunksSize || 100;
    var indexCommitTimeInterval = options.indexCommitTimeInterval || 2;
    var TYPE = options.TYPE || "cm:content";
    if(typeof start==="undefined"){start=moment();}
    var finished=false;

    var _fromCommitTime=startCommitTime;

    async.whilst(
        function () { return !finished; },
        function (callback) {
            var _toCommitTime=moment(_fromCommitTime).add(indexCommitTimeInterval, 'hours');

            repoAlfresco.getTxnsByTime(_fromCommitTime,_toCommitTime,maxResults,function (err,data) {
                if(err){
                    logger.error('getTxnsByTime error', err);
                    callback(err);
                }
                else if(data){
                    var txns=JSON.parse(data);
                    var maxTxnCommitTime=txns.maxTxnCommitTime;
                    var maxTxnId=txns.maxTxnId;

                    //Time more than maxTxnCommitTime, exit
                    if(_toCommitTime>txns.maxTxnCommitTime){
                        logger.info("=== No more data after date "+moment(_toCommitTime).format());
                        logger.info('==Total txns:'+txnsCounter+ ' maxTxnCommitTime:'+maxTxnCommitTime);
                        finished=true;
                        callback(null);
                    }

                    var txnsSize=txns.transactions.length;

                    //set next round start time
                    if(txnsSize == maxResults){
                        _fromCommitTime=_.max(txns.transactions, function(t){ return t.commitTimeMs; }).commitTimeMs;
                        //toCommitTime=txns.transactions[maxResults-1].commitTimeMs;
                    }
                    else{
                        _fromCommitTime=_toCommitTime;
                    }

                    var size=0;
                    if(txnsSize>0){
                        txnsCounter=txnsCounter+txnsSize;
                        //logger.info(' Total txns:'+txnsCounter);
                        logger.info('time:'+_fromCommitTime+"-"+_toCommitTime+"  "+moment(_fromCommitTime).format()+" txnsSize:"+txnsSize);

                        var firstTxnId =_.min(txns.transactions, function(t){ return t.id; }).id;
                        var lastTxnId =_.max(txns.transactions, function(t){ return t.id; }).id;

                        async.series([
                                function(callback){
                                    var workspaceArray=[];
                                    var archiveArray=[];
                                    //txns id and commitTimeMS not in same order in some case
                                    //var firstTxnId=txns.transactions[0].id;
                                    //var lastTxnId=txns.transactions[txns.transactions.length-1].id;

                                    repoAlfresco.getNodesByTxnId(firstTxnId,lastTxnId, function (err,nodesResult) {
                                        if(err){
                                            logger.error('getNodesByTxnId error', err);
                                            callback();
                                        }
                                        else if(nodesResult){
                                            var nodesArray=JSON.parse(nodesResult).nodes;
                                            size+=nodesArray.length;
                                            var nodeIdList=_.pluck(nodesArray, 'id');
                                            var skipNodeIds=configs.alfresco.skipNodeId;
                                            if(skipNodeIds){
                                                nodeIdList=_.difference(nodeIdList, skipNodeIds);
                                            }

                                            //logger.info("txns from-to:"+firstTxnId+"-"+lastTxnId);
                                            //callback();
                                            //_.sortBy(nodesArray.nodes, 'txnId').forEach(function(node) {
                                            //    logger.info(" txnsId:"+node.txnId+ " nodesId:"+node.id);
                                            //});
                                            var chunks=utility.chunk(nodeIdList,chunksSize);
                                            async.eachLimit(chunks,getMetadataThreads, function (chunkArray,callback) {
                                                repoAlfresco.getMetadataByNodeIds(chunkArray, function (err,data2) {
                                                    if(err){
                                                        logger.error('getMetadataByNodeIds error', err);
                                                        callback();
                                                    }
                                                    else if(data2){
                                                        var metadata=JSON.parse(data2);

                                                        for (var i = 0; i < metadata.nodes.length; i++) {
                                                            var obj = metadata.nodes[i];

                                                            if((obj.owner!=="System" && obj.owner!==undefined)){//obj.type==TYPE||obj.type=="cm:content"
                                                                if( obj.type!=="cm:thumbnail" && obj.type!=="cm:folder"&&
                                                                    obj.type!=="cm:failedThumbnail"&& obj.type!=="cm:person"){
                                                                    //logger.info("owner:"+obj.owner + " obj.type:"+obj.type+ " obj.ID:"+obj.id);
                                                                    //logger.info(metadata.nodes[0].id);
                                                                    var result=repoAlfresco.convertAlfNodeJson(JSON.stringify(obj));
                                                                    //logger.info(result);

                                                                    if(result["sys:store-protocol"]==="workspace" ){
                                                                        workspaceArray.push(result);
                                                                    }
                                                                    if(result["sys:store-protocol"]==="archive" ){
                                                                        archiveArray.push(result);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        //logger.info("solr indexed:"+updateArray.length+
                                                        //    " lastTxnId:"+lastTxnId+ " ("+moment(toCommitTime).format()+")");
                                                        //solrClient.updateContents(updateArray,function (err) {
                                                        //    if (err) throw err;
                                                        //    callback();
                                                        //});
                                                        callback();
                                                    }
                                                    else{
                                                        logger.info("No Metadata ??:"+nodesArray);
                                                        callback();
                                                    }
                                                    //callback();
                                                });
                                            }, function(error) {
                                                //save to db
                                                if(error){
                                                    console.log(error);
                                                } else {
                                                    var upsert=!isFullIndex;
                                                    // async.series([
                                                    //     function(callback){
                                                    //         if(workspaceArray&&workspaceArray.length>0){
                                                    //             logger.error('insert to workspace DB:'+workspaceArray.length);
                                                    //             repo.bulkWrite(workspaceArray,"workspace",upsert,function(err,result){
                                                    //                 if(err){
                                                    //                     logger.error('error bulk insert to workspace DB:'+err);
                                                    //                 }
                                                    //                 callback(null, 'one');
                                                    //             });
                                                    //         }else{
                                                    //             callback(null, 'two');
                                                    //         }
                                                    //     },
                                                    //     function(callback){
                                                    //         if(archiveArray&&archiveArray.length>0){
                                                    //             repo.bulkWrite(archiveArray,"archive",upsert,function(err,result){
                                                    //                 if(err){
                                                    //                     logger.error('error bulk insert to archive DB:'+err);
                                                    //                 }
                                                    //                 callback(null, 'two');
                                                    //             });
                                                    //         }else{
                                                    //             callback(null, 'two');
                                                    //         }
                                                    //     },
                                                    //     function(callback){
                                                    //         repo.bulkWrite(txns.transactions,"transactions",false,function(err,result){
                                                    //             if(err){
                                                    //                 logger.error('error bulk insert to transactions DB:'+err);
                                                    //             }
                                                    //             callback(null, 'three');
                                                    //         });
                                                    //     }
                                                    // ],
                                                    // function(err, results){
                                                    //     //callback();
                                                    // });
                                                    callback();
                                                }
                                            });
                                        }
                                        else{
                                            callback();
                                        }
                                    });
                                }
                            ],
                            function(err, results){
                                counter+=size;
                                stopWatch(middle,size);
                                middle=moment().valueOf();
                                //indexMetadataFromAlf(options,toCommitTime,function(){});

                            });
                    }
                    callback(null);
                }
            });
        },
        function (err, n) {
            stopWatch(start,counter);
        }
    );
    console.log("End Wilist");
    callback();
};
function stopWatch(start,counter){
    var end = moment().valueOf();
    var duration=moment.duration(end-start);
    var speed=Math.round(counter/duration*1000);
    logger.info("total:"+counter+" time used:"+duration+"ms"+" speed: "+speed +"/seconds");
}


