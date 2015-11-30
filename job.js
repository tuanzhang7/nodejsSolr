/**
 * Created by user1 on 25/11/2015.
 */
var _ = require('underscore');
var async = require('async');
var moment= require('moment');
var fs = require('fs');

var repo = require('./repoMongoDB');
var logger=require('./log.js').logger;

var start=moment();
var middle=moment();
var saveDirectory="Z:/projects/CMSTools/content/";
var finished=false;
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
            return;
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
                                    contentHelper.getByNodeId(nodeId, function (data2) {
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
            return;
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

function stopWatch(start,counter){
    var end = moment().valueOf();
    var duration=moment.duration(end-start);
    var speed=Math.round(counter/duration*1000);
    logger.info("total:"+counter+" speed: "+speed +"/seconds");
}