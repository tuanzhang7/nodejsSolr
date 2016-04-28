
var assert = require('assert');
var xmlhelper = require('../xmlhelper');
var fs = require('fs');
var config = require('../config.js');

describe('xmlhelper', function() {
    
    var excludeFields = config.xml.excludeFields;
    describe('#getMetadataXML()', function () {
        it('simple doc', function () {
            var jsondoc=fs.readFileSync('./test/doc.json', 'utf8');
            var doc = JSON.parse(jsondoc);
            var metadata=fs.readFileSync('./test/doc.xml', 'utf8');
            var result=xmlhelper.getMetadataXML(doc,excludeFields,",");
            var expect=metadata;
            assert.equal(result,expect);
        });
        it('ncms doc', function () {
            var jsondoc=fs.readFileSync('./test/ncms.json', 'utf8');
            var doc = JSON.parse(jsondoc);
            var metadata=fs.readFileSync('./test/ncms.xml', 'utf8');
            var result=xmlhelper.getMetadataXML(doc,excludeFields,",");
            var expect=metadata;
            assert.equal(result,expect);
        });
    });
    describe('#getPropertyValue()', function () {
        it('cm:title', function () {
            var obj=[
                {
                    "locale": "en_",
                    "value": "Workshop on Chaos in Brain"
                }
            ];
            var result=xmlhelper.getPropertyValue(obj,',');
            var expect='Workshop on Chaos in Brain';
            assert.equal(result,expect);
        });
        it('single filed', function () {
            var obj="Workshop on Chaos in Brain";
            var result=xmlhelper.getPropertyValue(obj,',');
            var expect='Workshop on Chaos in Brain';
            assert.equal(result,expect);
        });
        it('single filed blank value', function () {
            var obj="";
            var result=xmlhelper.getPropertyValue(obj,',');
            var expect='';
            assert.equal(result,expect);
        });
        it('multi filed multi value', function () {
            var obj=[
                "Workshop on Chaos in Brain1 ",
                "Workshop on Chaos in Brain2 ",
                "Workshop on Chaos in Brain3 "
            ];
            var result=xmlhelper.getPropertyValue(obj,',');
            var expect='Workshop on Chaos in Brain1 ,Workshop on Chaos in Brain2 ,Workshop on Chaos in Brain3 ';
            assert.equal(result,expect);
        });
        it('multi filed single value', function () {
            var obj=[
                "Workshop on Chaos in Brain1"
            ];
            var result=xmlhelper.getPropertyValue(obj,',');
            var expect='Workshop on Chaos in Brain1';
            assert.equal(result,expect);
        });
        it('multi filed blank value', function () {
            var obj=[];
            var result=xmlhelper.getPropertyValue(obj,',');
            var expect='';
            assert.equal(result,expect);
        });
    });
    describe('#getAspects()', function () {
        it('getAspects 1 aspect', function () {
            var obj=[
                "cm:auditable",
                "myascect1:myascectFields1",
                "sys:referenceable",
                "cm:titled",
                "sys:localized"
            ];
            var result=xmlhelper.getAspects(obj,',');
            var expect='myascect1:myascectFields1';
            assert.equal(result,expect);
        });
        it('getAspects multi aspect', function () {
            var obj=[
                "cm:auditable",
                "myascect1:myascectFields1",
                "myascect2:myascectFields2",
                "sys:referenceable",
                "cm:titled",
                "sys:localized"
            ];
            var result=xmlhelper.getAspects(obj,',');
            var expect='myascect1:myascectFields1,myascect2:myascectFields2';
            assert.equal(result,expect);
        });
        it('undefined', function () {
            var obj;
            var result=xmlhelper.getAspects(obj,',');
            var expect=null;
            assert.equal(result,expect);
        });
    });
});
