﻿// console.time("loading-requireds");
var prompt = require('prompt');
var moment= require('moment');
var async = require('async');
var readlineSync = require('readline-sync');

// console.time("loading-requireds-local");
//var solrClient = require('./solrClient');
var logger=require('./log.js').logger;
var job=require('./job.js');
var repoMongoDB = require('./repoMongoDB');
var textFileHelper = require('./textFileHelper');
var xmlhelper =require('./xmlhelper.js');
var config = require('./config.js');
// console.timeEnd("loading-requireds-local");

// console.timeEnd("loading-requireds");

// console.time("prompt-start");
prompt.start();
// console.timeEnd("prompt-start");

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
    console.log('Alfresco Host:'+config.alfresco.host);
    console.log(' ');
    console.log('================ ');
    //console.log('1. Index Content');
    //console.log('2. Index Metadata');
    console.log('1. Synchronize from Alfresco');
    console.log('2. ReIndex from Alfresco');
    console.log('3. Dump metadata by path');
    console.log('4. Dump metadata by NodeId List');
    console.log('5. Update by NodeIds');
    console.log(' ');
    console.log('q. Quit');
}
function getOption(){
    var indexCommitTimeInterval=config.alfresco.indexCommitTimeInterval;
    var chunksSize=config.alfresco.chunksSize;
    var getMetadataThreads=config.alfresco.getMetadataThreads;
    var maxTxnsResults=config.alfresco.maxTxnsResults;
    var TYPE=config.alfresco.TYPE;
    var skipNodeIds=config.alfresco.skipNodeId;
    var skipArchiveSpace=config.alfresco.skipArchiveSpace;

    var options={
        getMetadataThreads:getMetadataThreads,
        maxResults:maxTxnsResults,
        indexCommitTimeInterval:indexCommitTimeInterval,
        chunksSize:chunksSize,
        TYPE:TYPE,
        skipNodeIds:skipNodeIds,
        skipArchiveSpace:skipArchiveSpace,
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

        case "1-":
            console.log('Show Status......');
            async.series([
                    function(callback){
                        repoMongoDB.getMaxTxnTime(function(maxTxnTime) {
                            if (maxTxnTime) {
                                console.log('Last DB Txn Time:'+maxTxnTime);
                            }
                            else{
                                console.log('Blank database');
                            }
                            callback();
                        });
                    },
                    function(callback){
                        callback();
                    }
                ],
                function(err, results){
                    callback();
                }
            );
            break;
        case "1":

            var fromCommitTime;
            var isFullIndex=false;
            repoMongoDB.getMaxTxnTime(function(maxTxnTime){
                if(maxTxnTime){
                    fromCommitTime=maxTxnTime+1;
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
        case "2":
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
                            fromCommitTime=maxTxnTime+1;
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
        case "3":
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
        case "4":

            var prompt_dumpPath = {
                name: 'dumpPath',
                message: 'dump xml to path',
                required: true,
                default:defaultDumppath
            };
            var prompt_textpath = {
                name: 'textpath',
                message: 'Id list csv file path',
                required: true
            };
            prompt.get([prompt_textpath,prompt_dumpPath], function (err, result) {
                var textpath = result.textpath;
                var dumpPath = result.dumpPath;
                var excludeFields = config.xml.excludeFields;
                var delimiter = config.xml.delimiter;

                textFileHelper.readCSV(textpath,',',function (result) {
                    async.each(result, function(row, callback) {
                        //console.log(row);
                        var keys=Object.keys(row);

                        var key_name=keys[0];
                        var key_value=row[key_name];
                        //console.log(key_name+ "--"+key_value);
                        repoMongoDB.getNodeByKey(key_name,key_value,'workspace',function (doc) {
                            // console.log(doc);
                            if(doc){
                                xmlhelper.saveMetadataFile(doc,dumpPath,excludeFields,delimiter,function (err) {
                                    callback();
                                });
                            }
                            else{
                                callback();
                            }

                        });
                    }, function(err){
                        // if any of the file processing produced an error, err would equal that error
                        if( err ) {
                            console.log('A file failed to process:'+err);
                        } else {
                            //console.log('All files have been processed successfully');
                            callback();
                        }
                    });
                });
                
            });
            break;
        case "5":
            var prompt_nodeIds = {
                name: 'nodeIds',
                message: 'key in nodeIds separate by ,',
                required: true
            };
            prompt.get([prompt_nodeIds], function (err, result) {
                var nodeIds = result.nodeIds;
                var getMetadataThreads = getOption().getMetadataThreads;
                if(!nodeIds){
                    console.log('nodeIds should not blank');
                    callback(null);
                }
                else{
                    var nodeIdList=nodeIds.split(",");
                    job.getStoreArrays(nodeIdList,1,getMetadataThreads,function (err,workspaceArray,archiveArray) {
                        var upsert=true;
                        if(err){
                            console.log("error getStoreArrays:"+err);
                        }
                        console.log("saving to db:"+workspaceArray.length+' records');
                        job.saveToDB(workspaceArray,archiveArray,null,upsert,function () {
                             callback();
                        });
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






