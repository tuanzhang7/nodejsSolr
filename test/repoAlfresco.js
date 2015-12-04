/**
 * Created by user1 on 2/12/2015.
 */
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
        it('cm:title,modifier,creator,sys:locale,sys:store-identifier,sys:store-protocol should not exit', function () {
            assert.equal(undefined, result["cm:title"]);
            assert.equal(undefined, result["cm:modifier"]);
            assert.equal(undefined, result["cm:creator"]);
            assert.equal(undefined, result["cm:content"]);

            assert.equal(undefined, result["cm_title"]);
            assert.equal(undefined, result["cm_modifier"]);
            assert.equal(undefined, result["cm_creator"]);
            assert.equal(undefined, result["cm_content"]);

            assert.equal(undefined, result["sys_locale"]);
            assert.equal(undefined, result["sys_store-identifier"]);
            assert.equal(undefined, result["sys_store-protocol"]);

        });

        it('NCMS key should with underscore _', function () {
            assert.equal('B26074919E', result.NCMS_dc_source_m);
        });
        it('NCMS key should with underscore _ multifield', function () {
            assert.equal(2, result.NCMS_dc_type_m.length);
        });
        it('cm key should with underscore _', function () {
            assert.equal('2015-11-24T08:19:20.406+08:00', result.cm_modified);
        });

        it('facet key should with underscore _', function () {
            assert.equal('Adults', result.facet_audience);
            assert.equal('1', result.BookSG_eBook_bookType);
        });

        it('NCMS_Subject with Braket value', function () {
            assert.equal('6', result.NCMS_Subject.length);
            assert.equal('_SingHeritage:Genealogy {18336113}', result.NCMS_Subject[1]);
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

describe('repoAlfresco', function() {
    describe('#__formatAlfPath()', function () {
        var result=repoAlfresco.__formatAlfPath("/{http://www.alfresco.org/model/application/1.0}company_home/{http://www.alfresco.org/model/content/1.0}NLB_Project/{http://www.alfresco.org/model/content/1.0}BookSG/{http://www.alfresco.org/model/content/1.0}eBooks/{http://www.alfresco.org/model/content/1.0}type1/{http://www.alfresco.org/model/content/1.0}_x0032_0140120_x0020_DU_R657/{http://www.alfresco.org/model/content/1.0}B26074919E.pdf");

        it('Path should exist', function () {
            assert.equal('/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x0032_0140120_x0020_DU_R657/cm:B26074919E.pdf',
                result);
        });

    });
});