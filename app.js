var solr = require('solr-client');

var client = solr.createClient(
    {
    host :  '127.0.0.1',
    port :  '8983',
    core :  'ncms',
    path :  '/solr'
});

client.autoCommit = true;

var docs = [];
for(var i = 0; i <= 1000 ; i++){
    var doc = {
        id : 12345 + i,
        title_t : "Title "+ i,
        description_t : "Text"+ i + "Alice"
    }
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
