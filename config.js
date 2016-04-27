module.exports = {
  "alfresco": {
    "host": "10.14.244.184",
    "contentCachePath":"Z:/projects/CMSTools/content/",
    "maxSockets":20,
    "startDateDefault":"2011-11-01",
    "indexCommitTimeInterval":"2",
    "chunksSize":30,
    "getMetadataThreads":6,
    "maxTxnsResults":1000,
    "TYPE":"NCMS:NCMSFields",
    "skipNodeId":[11]
  },
  "mongodb": {
    "host": "172.30.11.195",//localhost
    "port":"3306",//27017
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