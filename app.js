console.time("loading-requireds");
var prompt = require('prompt');
var moment= require('moment');
var async = require('async');
var readlineSync = require('readline-sync');

console.time("loading-requireds-local");
//var solrClient = require('./solrClient');
var logger=require('./log.js').logger;
var job=require('./job.js');
var repoMongoDB = require('./repoMongoDB');
var config = require('./config.json');
console.timeEnd("loading-requireds-local");

console.timeEnd("loading-requireds");

console.time("prompt-start");
prompt.start();
console.timeEnd("prompt-start");

//loop();
var finished=false;
async.whilst(
    function () { return !finished; },
    function (callback) {
        printMenu();
        prompt.get(['task'], function (err, result) {
            var selection = result.task;
            if(selection === "q"){
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
function getOption(){
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
    return options;
}
function processSelection(select,callback){
    var options=getOption();
    var defaultDumppath=config.xml.dumppath;
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
            var isFullIndex=true;
            var startDateDefault=config.alfresco.startDateDefault||"2012-01-01";

            console.log('ReIndex Metadata from alf Host:'+config.alfresco.host);

            var prompt_dropDB = {
                name: 'IsDropDB',
                message: 'Do you want to Drop DB?',
                type: 'boolean',
                required: true,
                default: false

            };
            var prompt_startDate = {
                name: 'startDate',
                message: 'Transaction Start Date',
                required: true,
                default: startDateDefault
            };
            prompt.get([prompt_dropDB], function (err, result) {
                var IsDropDB = result.IsDropDB;

                if(IsDropDB){
                    console.log('Drop db if exist......');
                    prompt.get([prompt_startDate], function (err, result) {
                        var startDate = result.startDate;
                        fromCommitTime=moment(startDate);
                        console.log('start date:'+moment(fromCommitTime).format());

                        repoMongoDB.dropDB(function(){
                            job.indexMetadataFromAlf(options,fromCommitTime,isFullIndex,function() {
                                logger.info("creating index....");
                                repoMongoDB.createIndexs(function(){
                                    logger.info("index created:");
                                    callback();
                                });
                            });
                        });
                    });
                }
                else{
                    repoMongoDB.getMaxTxnTime(function(maxTxnTime){
                        if(maxTxnTime){
                            fromCommitTime=maxTxnTime;
                        }
                        else{
                            prompt.get([prompt_startDate], function (err, result) {
                                var startDate = result.startDate;
                                fromCommitTime=moment(startDate);
                            });
                        }
                        console.log('start date:'+moment(fromCommitTime).format());

                        job.indexMetadataFromAlf(options,fromCommitTime,isFullIndex,function() {
                            logger.info("creating index....");
                            repoMongoDB.createIndexs(function(){
                                logger.info("index created:");
                                callback();
                            });
                        });
                    });
                }
            });
            break;
        case "5":
            var prompt_dumpPath = {
                name: 'dumpPath',
                message: 'dump xml to path',
                required: true,
                default:defaultDumppath
            };
            var prompt_alfpath = {
                name: 'alfpath',
                message: 'Dump metadata by path .e.g /app:company_home/cm:site1/cm:folder1',
                required: true,
                default:'/app:company_home'
            };
            prompt.get([prompt_alfpath,prompt_dumpPath], function (err, result) {
                var alfpath = result.alfpath;
                var dumpPath = result.dumpPath;
                if(!alfpath){
                    console.log('Path should not blank');
                    callback(null);
                }
                else{
                    repoMongoDB.dumpByPath(alfpath,dumpPath,function(){
                        callback();
                    });
                }
            });
            break;
        case "6":

            var prompt_dumpPath = {
                name: 'dumpPath',
                message: 'dump xml to path',
                required: true,
                default:defaultDumppath
            };
            var prompt_textpath = {
                name: 'textpath',
                message: 'Id list text file path',
                required: true
            };
            prompt.get([prompt_textpath,prompt_dumpPath], function (err, result) {
                var textpath = result.textpath;
                var dumpPath = result.dumpPath;

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






