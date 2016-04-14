var prompt = require('prompt');
var moment= require('moment');
var repoAlfresco = require('./repoAlfresco');
var solrClient = require('./solrClient');
var logger=require('./log.js').logger;
var job=require('./job.js');
var repo = require('./repoMongoDB');
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

            processSelection(selection,function(){
                if(selection == "x"){
                    finished = true;
                    callback(null);
                }
                else{
                    callback(null);
                }

            });
        });
    },
    function (err, n) {
    }
);

function printMenu(){
    console.log(' ');
    console.log(' ');
    console.log('================ ');
    console.log('1. Index Content');
    console.log('2. Index Metadata');
    console.log('3. Index Metadata From alf');
    console.log('10.Show Status');
    console.log(' ');
    console.log('x. Exit');
}
function processSelection(select,callback){
    switch(select)
    {
        case "1":
            console.log('Index Content......');
            //var mimeType="text/plain";
            //var mimeType="text/html";
            var mimeType="application/pdf";
            var startId=0;
            var size=500;
            //job.indexContent(startId,mimeType,size);

            break;
        case "2":
            console.log('Index Metadata from DB......');
            repoAlfresco.getMetadataByNodeId(219820,function(data){
                logger.info("get metadata:"+data);
            });
            //job.indexMetadata(startId);
            break;
        case "3":
            var indexCommitTimeInterval=config.alfresco.indexCommitTimeInterval;
            var chunksSize=config.alfresco.chunksSize;
            var getMetadataThreads=config.alfresco.getMetadataThreads;
            var maxTxnsResults=config.alfresco.maxTxnsResults;

            var options={
                getMetadataThreads:getMetadataThreads,
                maxResults:maxTxnsResults,
                indexCommitTimeInterval:indexCommitTimeInterval,
                chunksSize:chunksSize,
            };
            var startDateDefault=config.alfresco.startDateDefault||"2012-01-01";
            var startDate = readlineSync.question('start date('+startDateDefault+'):');
            if(startDate===""){
                startDate=startDateDefault;
            }
            var fromCommitTime=moment(startDate);
            console.log('Index Metadata from alf......'+startDate);

            job.indexMetadataFromAlf(options,fromCommitTime,function() {
                callback()
            });

            break;

        case "10":
            console.log('Show Status......');
            solrClient.getMaxTransactionId(function(maxId){
                console.log('Solr Max TransactionId:'+maxId);
                callback();
            });
            break;
        case "x":
            console.log('exit......');
            callback()
            break;
        default:
            console.log('wrong selection:'+select);
            callback();
            break;
    }

}






