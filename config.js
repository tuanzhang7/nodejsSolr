module.exports = {
  "alfresco": {
    "host": "10.14.244.184",//localhost
    "port":"80",
    "contentCachePath":"C:/projects/content/",
    "maxSockets":20,
    "startDateDefault":"2012-01-01",
    "indexCommitTimeInterval":"2",
    "chunksSize":30,
    "getMetadataThreads":6,
    "maxTxnsResults":1000,
    "TYPE":"cm:content",
    "skipNodeId":[11],
    "skipArchiveSpace":true
  },
  "mongodb": {
    "host": "172.30.11.195",//localhost,172.30.11.195
    "port":"3306",//27017,3306
    "db":"cms"
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