/**
 * Created by user1 on 18/11/2015.
 */
var solr = require('solr-client');

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

exports.updateContent = function updateContent(nodeId,content){
    var updateDoc = {
        id : nodeId,
        Dc_location : {"set" :content}
    };
    client.add(updateDoc,function(err,obj){
        if(err){
            console.log(err);
        }else{
            //console.log("doc updated:"+obj);
            //client.softCommit(function(err,res){
            //    if(err){
            //        console.log(err);
            //    }else{
            //        console.log("softCommit:"+res);
            //    }
            //});
        }
    });
};

function addMetadata(){
    var docs = [];
    for(var i = 0; i <= 1000 ; i++){
        var doc = {
            id : 12345 + i,
            title_t : "Title "+ i,
            description_t : "Text"+ i + "Alice"
        };
        docs.push(doc);
    }

// Add documents
    client.add(docs,function(err,obj){
        if(err){
            console.log(err);
        }else{
            console.log(obj);
        }
    });
}
