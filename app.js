var contentHelper = require('./content');
var solrClient = require('./solrClient');
var repo = require('./repoMongoDB');

//contentHelper.getByNodeId(1616, function (data) {
//    var content=data;
//    solrClient.updateContent(1616,content);
//
//});

repo.getNodeIdByMimeType("text/html", function (data) {
    data.forEach(function (nodeId) {
        contentHelper.getByNodeId(nodeId, function (data2) {
            solrClient.updateContent(nodeId,data2);
        });
    });
});