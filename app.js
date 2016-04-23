var prompt = require('prompt');
var moment= require('moment');
var repoAlfresco = require('./repoAlfresco');
var solrClient = require('./solrClient');
var logger=require('./log.js').logger;
var job=require('./job.js');
var repoMongoDB = require('./repoMongoDB');
var readlineSync = require('readline-sync');
var config = require('./config.json');
var async = require('async');

prompt.start();

//loop();
var finished=false;
async.whilst(
    function () { return !finished; },
    function (callback) {
        printMenu()
        prompt.get(['task'], function (err, result) {
            selection = result.task;
            if(selection == "q"){
                finished = true;
                callback(null);
            }
            else{
                processSelection(selection,function(){
                    callback(null);
                });
            }

        });
    },
    function (err, n) {
    }
);

function printMenu(){
    console.log(' ');
    console.log(' ');
    console.log('================ ');
    //console.log('1. Index Content');
    //console.log('2. Index Metadata');
    console.log('1. Show Status');
    console.log('3. Sync from Alfresco');
    console.log('4. ReIndex');
    console.log('5. Dump metadata by path');
    console.log('6. Dump metadata by NodeId List');

    console.log(' ');
    console.log('q. Quit');
}
function processSelection(select,callback){
    switch(select)
    {
        //case "1":
        //    console.log('Index Content......');
        //    //var mimeType="text/plain";
        //    //var mimeType="text/html";
        //    var mimeType="application/pdf";
        //    var startId=0;
        //    var size=500;
        //    //job.indexContent(startId,mimeType,size);
        //
        //    break;

        //case "2":
        //    console.log('Index Metadata from DB......');
        //    repoAlfresco.getMetadataByNodeId(219820,function(data){
        //        logger.info("get metadata:"+data);
        //    });
        //    //job.indexMetadata(startId);
        //    break;

        case "1":
            console.log('Show Status......');
            solrClient.getMaxTransactionId(function(maxId){
                console.log('Solr Max TransactionId:'+maxId);
                callback();
            });
            break;
        case "3":
            var indexCommitTimeInterval=config.alfresco.indexCommitTimeInterval;
            var chunksSize=config.alfresco.chunksSize;
            var getMetadataThreads=config.alfresco.getMetadataThreads;
            var maxTxnsResults=config.alfresco.maxTxnsResults;
            var TYPE=config.alfresco.TYPE;

            var options={
                getMetadataThreads:getMetadataThreads,
                maxResults:maxTxnsResults,
                indexCommitTimeInterval:indexCommitTimeInterval,
                chunksSize:chunksSize,
                TYPE:TYPE
            };
            console.log('Index Metadata from alf Host:'+config.alfresco.host);

            var fromCommitTime;
            var isFullIndex=false;
            repoMongoDB.getMaxTxnTime(function(maxTxnTime){
                if(maxTxnTime){
                    fromCommitTime=maxTxnTime;
                }
                else{
                    var startDateDefault=config.alfresco.startDateDefault||"2012-01-01";
                    var startDate = readlineSync.question('start date('+startDateDefault+'):');
                    if(startDate===""){
                        startDate=startDateDefault;
                    }
                    fromCommitTime=moment(startDate);
                    isFullIndex=true;
                }
                console.log('start data:'+moment(fromCommitTime).format());

                job.indexMetadataFromAlf(options,fromCommitTime,isFullIndex,function() {
                    callback();
                });
            });
            break;
        case "4":
            console.log('Create Indexs to db......');
            repoMongoDB.createIndexs(function(){
                logger.info("Index created:");
                callback();
            });
            //job.indexMetadata(startId);
            break;
        case "5":
            console.log('Dump metadata by path .e.g /app:company_home/cm:site1/cm:folder1');
            prompt.get(['path'], function (err, result) {
                path = result.path;
                if(!path){
                    console.log('Path should not blank');
                    callback(null);
                }
                else{
                    repoMongoDB.dumpByPath(path,function(){
                        callback();
                    });
                }
            });
            break;
        case "q":
            console.log('exit......');
            callback();
            break;
        default:
            console.log('wrong selection:'+select);
            callback();
            break;
    }

}






