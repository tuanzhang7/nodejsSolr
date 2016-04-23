
var assert = require('assert');
var utility = require('../utility');
var fs = require('fs');


describe('repoAlfresco', function() {

    describe('#formatAlfPath()', function () {
        var result=utility.formatAlfPath("/{http://www.alfresco.org/model/application/1.0}company_home/{http://www.alfresco.org/model/content/1.0}NLB_Project/{http://www.alfresco.org/model/content/1.0}BookSG/{http://www.alfresco.org/model/content/1.0}eBooks/{http://www.alfresco.org/model/content/1.0}type1/{http://www.alfresco.org/model/content/1.0}_x0032_0140120_x0020_DU_R657/{http://www.alfresco.org/model/content/1.0}B26074919E.pdf");

        it('Path should exist', function () {
            assert.equal('/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x0032_0140120_x0020_DU_R657/cm:B26074919E.pdf',
                result);
        });

    });
    describe('#convertAlfPath2Path()', function () {
        var result=utility.convertAlfPath2Path("/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x0032_0140120_x0020_DU_R657/cm:B26074919E.pdf");

        it('convertAlfPath2Path', function () {
            assert.equal(result,
                '/company_home/NLB_Project/BookSG/eBooks/type1/_x0032_0140120_x0020_DU_R657/B26074919E.pdf');
        });

    });
    describe('#formatBytes()', function () {

        it('bytes', function () {
            var result=utility.formatBytes("100");
            assert.equal('100 Bytes',result);
        });
        it('MB', function () {
            var result=utility.formatBytes("1000000");
            assert.equal('1.00 MB',result);
        });
        it('0 Byte', function () {
            var result=utility.formatBytes("0");
            assert.equal('0 Byte',result);
        });

    });
});
