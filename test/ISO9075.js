/**
 * Created by tuanzhang on 20/4/2016.
 */
/**
 * Created by user1 on 2/12/2015.
 */
var assert = require('assert');
var ISO9075 = require('../ISO9075');

describe('ISO9075', function() {
    describe('decode()', function () {
        var result=ISO9075.decode("/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:_x0032_0140120_x0020_DU_R657/cm:B26074919E.pdf");

        it('Path should exist', function () {
            assert.equal('/app:company_home/cm:NLB_Project/cm:BookSG/cm:eBooks/cm:type1/cm:20140120 DU_R657/cm:B26074919E.pdf',
                result);
        });

    });
});
