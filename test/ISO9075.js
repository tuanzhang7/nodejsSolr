
var assert = require('assert');
var ISO9075 = require('../ISO9075');

describe('ISO9075', function() {
    describe('decode()', function () {
        
        it('decode path', function () {
            var result=ISO9075.decode("/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x0032_0140120_x0020_DU_R657/cm:B26074919E.pdf");

            assert.equal('/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:20140120 DU_R657/cm:B26074919E.pdf',
                result);
        });
        it('_x but not Hex', function () {
            var result=ISO9075.decode("/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x00DU_R657/cm:B26074919E.pdf");

            assert.equal('/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x00DU_R657/cm:B26074919E.pdf',
                result);
        });
        it('null value', function () {
            var result=ISO9075.decode("");

            assert.equal(result,'');
        });
    });
});
