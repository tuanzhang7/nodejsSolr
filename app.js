var contentHelper = require('./content');
var solrClient = require('./solrClient');
var logger=require('./log.js').logger;
var job=require('./job.js');
//var winston = require('winston');
var repo = require('./repoMongoDB');
solrClient.getMaxTransactionId(function (maxId) {
    logger.info('getMaxTransactionId:'+maxId);
    repo.getByTransactionId(maxId,function (docs) {
        for(var i=0;i<docs.length;i++){
            logger.info('id:'+docs[i].id);
        }
    });
});
//var mimeType="text/html";
//var mimeType="text/plain";
var mimeType="application/pdf";
var startId=0;
var size=500;
//job.indexContent(startId,mimeType,size);



