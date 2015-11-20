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
var mimeType="application/pdf";
var startId=0;
var size=100;
var counter=0;
var finished=false;

var start=moment();
var middle=moment();
loop(startId);

function loop(cursor) {
    repo.getNodeIdByMimeType(mimeType,cursor,size, function (data) {
        logger.info('startId:'+startId);
        if(counter>1000){
            stopWatch(start,counter);
            return;
        }
        if(data.length==0){
            stopWatch(start,counter);
            return;
        }else{
            startId=_.max(data);
            async.series([
                function(callback){

                    async.eachLimit(data,2, function (nodeId,callback) {
                        //logger.info("process:"+nodeId);
                        var digit = (''+nodeId).slice(0,3);
                        var path="content/"+digit;
                        var fileName=path+"/"+nodeId+".txt";
                        fs.exists(fileName, function (exists) {
                            if(exists){
                                fs.readFile(fileName, function (err, data) {
                                    if (err) throw err;
                                    //logger.info("read from local."+nodeId);
                                    callback();
                                });
                            }
                            else{
                                contentHelper.getByNodeId(nodeId, function (data2) {
                                    if (fs.existsSync(path)===false) {
                                        fs.mkdirSync(path);
                                    }
                                    fs.writeFile(fileName, data2, function(err) {
                                        //logger.info("save to local."+nodeId);
                                        callback();
                                        if(err) {
                                            return logger.error(err);
                                        }
                                    });
                                    //solrClient.updateContent(nodeId,data2);

                                });
                            }
                        });

                    }, function(done) {
                        //console.log("done");
                        callback();
                    });
                }
            ],
            function(err, results){
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
