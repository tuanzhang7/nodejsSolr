/**
 * Created by user1 on 18/11/2015.
 */
var solr = require('solr-client');
var logger=require('./log.js').logger;

var client = solr.createClient(
    {
        host :  '172.30.11.196',//'127.0.0.1',
        port :  '80',//'8983',
        core :  'cms',
        path :  '/solr410',//'/solr',
        bigint: true,
        solrVersion: '4.0'
    });
client.autoCommit = true;

exports.updateContent = function updateContent(nodeId,content,callback){

    var updateDoc = {
        id : nodeId,
        Dc_location : {"set" :JSON.stringify(content)}
    };
    client.add(updateDoc,function(err,obj){
        if(err){
            logger.error("update solr index error:"+err);
            return callback(err);
        }else{

            return callback();
        }

    });
};

exports.updateContents = function updateContents(docs,callback){
    client.add(docs,function(err,obj){
        if(err){
            logger.error("update solr index error:"+err);
            return callback(err);
        }else{
            //console.log("doc updated:"+obj);
            //client.softCommit(function(err,res){
            //    if(err){
            //        console.log(err);
            //    }else{
            //        console.log("softCommit:"+res);
            //    }
            //});
            return callback();
        }
    });
};

exports.getMaxTransactionId = function getMaxTransactionId(callback){
    var query = client.createQuery()
        .q('*:*')
        .set("stats=true")
        .set("stats.field=sys_transaction_id")
        .start(0)
        .rows(0);
    client.search(query,function(err,obj){
        logger.info(obj);
        if(err){
            logger.error("update solr index error:"+err);
            return callback(err);
        }else{
            var maxId=obj.stats.stats_fields["sys_transaction_id"].max;
            return callback(maxId);
        }
    });
};

