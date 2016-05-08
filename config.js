module.exports = {
  "alfresco": {
    "host": "localhost",
    "port":"8080",
    "contentCachePath":"C:/projects/content/",
    "maxSockets":20,
    "startDateDefault":"2016-05-01",
    "indexCommitTimeInterval":"2",
    "chunksSize":30,
    "getMetadataThreads":6,
    "maxTxnsResults":1000,
    "TYPE":"cm:content",
    "skipNodeId":[11]
  },
  "mongodb": {
    "host": "localhost",//localhost,172.30.11.195
    "port":"27017",//27017,3306
    "db":"alf"
  },
  "xml":{
    "excludeFields":[
      "cm:name",
      "cm:content",
      "cm:modifier",
      "cm:created",
      "cm:creator",
      "PATH",
      "id",
      "txnId",
      "_id",
      "nodeRef",
      "aspects"

    ],
    "delimiter":",",
    "dumppath":"D:/export"
  }
};