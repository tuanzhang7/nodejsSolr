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
        it('cm:title,modifier,creator,sys:locale should not exit', function () {
            assert.equal(undefined, result["cm:title"]);
            assert.equal(undefined, result["cm:modifier"]);
            assert.equal(undefined, result["cm:creator"]);
            assert.equal(undefined, result["cm:content"]);

            assert.equal(undefined, result["cm_title"]);
            assert.equal(undefined, result["cm_modifier"]);
            assert.equal(undefined, result["cm_creator"]);
            assert.equal(undefined, result["cm_content"]);

            assert.equal(undefined, result["sys_locale"]);

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

    });
});