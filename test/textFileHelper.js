
var assert = require('assert');
var textFileHelper = require('../textFileHelper');

describe('textFileHelper', function() {

    describe('#readCSV()', function () {

        it('simple csv', function (done) {

            var csvfile='./test/test-csv.csv';

            textFileHelper.readCSV(csvfile,',',function (result) {
                // var expect=[
                //     {"sys:node-dbid":'11111',"cm:modifier":'admin'},
                //     {"sys:node-dbid":'22222',"cm:modifier":'user'}
                // ];
                assert.equal("11111",result[0]["sys:node-dbid"]);
                assert.equal("admin",result[0]["cm:modifier"]);

                assert.equal("22222",result[1]["sys:node-dbid"]);
                assert.equal("user",result[1]["cm:modifier"]);

                done();
            });

        });
    });

});
