var contentHelper = require('./content');
var solrClient = require('./solrClient');
var repo = require('./repoMongoDB');
var _ = require('underscore');
var async = require('async');
var moment= require('moment');
//var winston = require('winston');
var logger=require('./log.js').logger;
var fs = require('fs');

//var mimeType="text/html";
//var mimeType="text/plain";
var mimeType="application/pdf";
var startId=0;
var size=500;
var counter=0;
var finished=false;

var start=moment();
var middle=moment();
loop(startId);
var saveDirectory="Z:/projects/CMSTools/content/";
function loop(cursor) {
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
                loop(startId);
            });
        }
    });
}
function stopWatch(start,counter){
    var end = moment().valueOf();
    var duration=moment.duration(end-start);
    var speed=Math.round(counter/duration*1000);
    logger.info("total:"+counter+" speed: "+speed +"/seconds");
}
