/**
 * Created by user1 on 25/11/2015.
 */
var _ = require('underscore');
var async = require('async');
var moment= require('moment');
var fs = require('fs');

var repo = require('./repoMongoDB');
var repoAlfresco = require('./repoAlfresco');
var logger=require('./log.js').logger;
var config = require('./config.json');

var start;
var middle=moment();
var saveDirectory=config.alfresco.contentCachePath;

var counter=0;

exports.indexContent = function indexContent(cursor,mimeType,size) {
    repo.getNodeIdByMimeType(mimeType,cursor,size, function (data) {
        logger.info('processing:'+startId);
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

exports.indexMetadataFromAlf = function indexMetadataFromAlf(options,fromCommitTime) {

    var getMetadataThreads = options.getMetadataThreads || 6;
    var maxResults = options.maxResults || 500;

    if(typeof start==="undefined"){start=moment();}
    var toCommitTime=moment(fromCommitTime).add(2, 'hours');

    repoAlfresco.getTxnsByTime(fromCommitTime,toCommitTime,maxResults,function (err,data) {
        if(err){
            logger.error('getTxnsByTime error', err);
        }
        else if(data){
            var txns=JSON.parse(data);
            var maxTxnCommitTime=txns.maxTxnCommitTime;
            var maxTxnId=txns.maxTxnId;

            var txnsSize=txns.transactions.length;
            if(txnsSize>0){
                //logger.info('processing time:'+fromCommitTime+"-"+toCommitTime+"  "+moment(fromCommitTime).format()+" txnsSize:"+txnsSize);
            }
            if(txnsSize==maxResults){
                //toCommitTime=_.max(txns.transactions, function(t){ return t.commitTimeMs; }).commitTimeMs;
                toCommitTime=txns.transactions[maxResults-1].commitTimeMs;
            }
            if(toCommitTime>txns.maxTxnCommitTime){
                logger.info("no more data after date "+moment(toCommitTime).format());
                stopWatch(start,counter);
                //return;
            }else{
                var size=0;
                if(txnsSize>0){
                    async.series([
                        function(callback){
                            var updateArray=[];
                            //txns id and commitTimeMS not in same order in some case
                            //var firstTxnId=txns.transactions[0].id;
                            //var lastTxnId=txns.transactions[txns.transactions.length-1].id;

                            var firstTxnId =_.min(txns.transactions, function(t){ return t.id; }).id;
                            var lastTxnId =_.max(txns.transactions, function(t){ return t.id; }).id;

                            repoAlfresco.getNodesByTxnId(firstTxnId,lastTxnId, function (err,nodesResult) {
                                if(err){
                                    logger.error('getNodesByTxnId error', err);
                                    callback();
                                }
                                else if(nodesResult){
                                    var nodesArray=JSON.parse(nodesResult).nodes;
                                    size+=nodesArray.length;
                                    //logger.info("txns from-to:"+firstTxnId+"-"+lastTxnId);

                                    //_.sortBy(nodesArray.nodes, 'txnId').forEach(function(node) {
                                    //    logger.info(" txnsId:"+node.txnId+ " nodesId:"+node.id);
                                    //});

                                    async.eachLimit(nodesArray,getMetadataThreads , function (node,callback) {
                                        repoAlfresco.getMetadataByNodeId(node.id, function (err,data2) {
                                            if(err){
                                                logger.error('getMetadataByNodeId error', err);
                                                callback();
                                            }
                                            if(data2){
                                                var metadata=JSON.parse(data2);
                                                if(metadata.nodes[0]){
                                                    if(metadata.nodes[0].type=="NCMS:NCMSFields"
                                                        ||metadata.nodes[0].type=="cm:content"){

                                                        //logger.info(metadata.nodes[0].id);
                                                        var result=repoAlfresco.convertAlfNodeJson(JSON.stringify(metadata.nodes[0]));
                                                        updateArray.push(result);
                                                    }
                                                    else{
                                                        //logger.info("Other Type:"+ metadata.nodes[0].type);
                                                    }
                                                }
                                                else{
                                                    //logger.warn("No node metadata:"+node.id);
                                                }
                                                callback();
                                            }
                                            else{
                                                logger.info("No Metadata ??:"+node.id);
                                                callback();
                                            }
                                            //callback();
                                        });
                                    }, function(done) {
                                        logger.info("solr indexed:"+updateArray.length+
                                            " lastTxnId:"+lastTxnId+ " ("+moment(toCommitTime).format()+")");
                                        //solrClient.updateContents(updateArray,function (err) {
                                        //    if (err) throw err;
                                        //    callback();
                                        //});
                                        callback();
                                    });
                                }
                                else{
                                    callback();
                                }

                            });
                            //Performance not that good
                            //async.eachLimit(txns.transactions,1, function (transaction,callback) {
                            //    if(transaction.updates>0){
                            //        repoAlfresco.getNodesByTxnId(transaction.id,transaction.id, function (nodesResult) {
                            //            var nodesArray=JSON.parse(nodesResult);
                            //            size+=nodesArray.nodes.length;
                            //
                            //            nodesArray.nodes.forEach(function(node) {
                            //                logger.info(" txnsId:"+node.txnId+ " nodesId:"+node.id);
                            //            });
                            //
                            //            //logger.info("transaction.id:"+transaction.id+ " contains nodes:"+nodesArray.nodes.length);
                            //
                            //            //async.eachLimit(nodesArray,5, function (node,callback) {
                            //            //    repoAlfresco.getMetadataByNodeId(node.id, function (data2) {
                            //            //        //logger.info("got file from alf:"+nodeId);
                            //            //        if(data2){
                            //            //            //solrClient.updateContent(nodeId,data2, function (err) {
                            //            //            //    if (err) throw err;
                            //            //            //    callback();
                            //            //            //});
                            //            //            updateArray.push(data2);
                            //            //            callback();
                            //            //        }
                            //            //        else{
                            //            //            callback();
                            //            //        }
                            //            //    });
                            //            //}, function(done) {
                            //            //    callback();
                            //            //});
                            //            callback()
                            //        });
                            //    }
                            //    else{
                            //        callback();
                            //    }
                            //}, function(done) {
                            //    console.log("solr indexed:"+updateArray.length);
                            //    //too large for 500 pdf files
                            //    //solrClient.updateContents(updateArray,function (err) {
                            //    //    if (err) throw err;
                            //    //    callback();
                            //    //});
                            //
                            //    callback();
                            //});
                        }
                        ],
                        function(err, results){
                            counter+=size;
                            stopWatch(middle,size);
                            middle=moment().valueOf();
                            indexMetadataFromAlf(options,toCommitTime);
                        }
                    );
                }
                else{
                    indexMetadataFromAlf(options,toCommitTime);
                }
            }
        }
    });
};

function stopWatch(start,counter){
    var end = moment().valueOf();
    var duration=moment.duration(end-start);
    var speed=Math.round(counter/duration*1000);
    logger.info("total:"+counter+" time used:"+duration+"ms"+" speed: "+speed +"/seconds");
}