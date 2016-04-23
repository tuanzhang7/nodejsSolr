
var assert = require('assert');
var repoAlfresco = require('../repoAlfresco');
var fs = require('fs');

var obj = fs.readFileSync('./test/node.json', 'utf8');
describe('repoAlfresco', function() {
    describe('#convertAlfNodeJson()', function () {
        var result=repoAlfresco.convertAlfNodeJson(obj);
        it('tenantDomain should not exit', function () {
            assert.equal(undefined, result.tenantDomain);
        });


        it('NCMS key should with underscore _', function () {
            assert.equal('B26074919E', result['NCMS:dc_source_m']);
        });
        it('NCMS key should with underscore _ multifield', function () {
            assert.equal(2, result['NCMS:dc_type_m'].length);
        });
        it('cm key should with underscore _', function () {
            assert.equal('2015-11-24T08:19:20.406+08:00', result['cm:modified']);
        });

        it('facet key should with underscore _', function () {
            assert.equal('Adults', result['facet:audience']);
            assert.equal('1', result['BookSG_eBook:bookType']);
        });

        it('NCMS_Subject with Braket value', function () {
            assert.equal('6', result['NCMS:Subject'].length);
            assert.equal('_SingHeritage:Genealogy {18336113}', result['NCMS:Subject'][1]);
        });

        it('Path should exist', function () {
            assert.equal('/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x0032_0140120_x0020_DU_R657/cm:B26074919E.pdf', result.PATH);
        });

        it('id should exist and is nodeId', function () {
            assert.equal('1239704', result.id);
        });

        it('txnId should exist and is txnId', function () {
            assert.equal('1976521', result.txnId);
        });
    });
    
});
