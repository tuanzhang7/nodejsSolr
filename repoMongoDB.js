/**
 * Created by user1 on 18/11/2015.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var url = 'mongodb://172.30.11.195:3306/cmsreports';

//"text/html"
exports.getNodeIdByMimeType = function getDataByMimeType(mimeType,startId,size,callback){
    MongoClient.connect(url, function (err, db) {
        var cmsnodes = db.collection('cmsnodes');
        var query={ $and: [ {sys_nodeId:{"$gt":startId}},{sys_mimetype:mimeType} ] };
        var projection={ sys_nodeId: 1 };
        var sort={sys_nodeId:1};
        cmsnodes.find(query,projection).sort(sort).limit(size).toArray(function (err, docs) {
            var nodeIdArray=[];
            for(var i=0;i<docs.length;i++){
                var sys_nodeId=docs[i].sys_nodeId;
                nodeIdArray.push(sys_nodeId);
            }
            db.close();
            return callback(nodeIdArray);
        });
    });
};