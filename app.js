﻿var prompt = require('prompt');
var contentHelper = require('./content');
var solrClient = require('./solrClient');
var logger=require('./log.js').logger;
var job=require('./job.js');
var repo = require('./repoMongoDB');

prompt.start();

loop();

function printMenu(){
    console.log('================ ');
    console.log('1. Index Content');
    console.log('2. Index Metadata');
    console.log('10.Show Status');
    console.log(' ');
    console.log('x. Exit');
}

function loop(){
    printMenu();
    prompt.get(['task'], function (err, result) {
        var select=result.task;
        console.log(' ');
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
                console.log('Index Metadata......');
                //job.indexMetadata(startId);
                break;
            case "10":
                console.log('Show Status......');
                solrClient.getMaxTransactionId(function(maxId){
                    console.log('Solr Max TransactionId:'+maxId);
                    printMenu();
                });
                break;
            case "x":
                console.log('exit......');
                break;
            default:
                console.log('wrong selection:'+select);
                break;
        }
        if(result.task=="x"){
            return;
        }
        else{
            loop();
        }
    });
}



