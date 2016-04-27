var builder = require('xmlbuilder');
var fs=require('fs');
var path=require('path');
var utility=require('./utility.js');
var mkdirp = require('mkdirp');

exports.getMetadataXML=function (doc,excludeFields,delimiter) {
    delimiter = delimiter || ",";
    var xml = builder.create('properties',{allowSurrogateChars: true})
        .dec({ version: '1.0', encoding: 'UTF-8' });
    //;
    //var type=doc.type;
    //xml.ele('entry',{'key': 'type'},type);
    //console.log('doc.properties:'+doc);

    var aspects=this.getAspects(doc.aspects);
    if(aspects){
        //console.log('aspects:'+aspects);
        xml.ele('entry',{'key': 'aspects'},aspects);
    }
    for (var k in doc){
        if (doc.hasOwnProperty(k)) {

            if(excludeFields){
                if(excludeFields.indexOf(k)===-1 && k.indexOf("sys:")===-1){

                    var value=this.getPropertyValue(doc[k],delimiter);

                    //console.log("Key is:" + k + ", " + JSON.stringify(value));

                    var strValue=JSON.stringify(value);
                    var strKey=JSON.stringify(k);
                    xml.ele('entry',{'key': k},value);
                }
            }
        }
    }
    xml.doctype( { root:'properties',sysID: 'http://java.sun.com/dtd/properties.dtd' });
    var xmlString = xml.end({
        pretty: true,
        indent: '    ',
        newline: '\r\n',
        allowEmpty: false
    });
    return xmlString;
};

exports.getPropertyValue=function (property,delimiter) {
    var value;
    if(Array.isArray(property)){
        if(typeof property[0] === 'object'){
            value=property[0].value;
        }
        else{
            value=property.join(delimiter);
        }
    }
    else{

        value=property;
    }
    return value;
};

exports.getAspects=function (aspects) {
    if(aspects){
        var array=[];
        aspects.forEach(function (aspect) {
            if(!aspect.startsWith("cm:")&&!aspect.startsWith("sys:")){
                array.push(aspect);
            }
        });
        return array.join(',');
    }
    return null;

};

exports.saveMetadataFile=function (doc,path2save,excludeFields,delimiter,callback) {
    delimiter = delimiter || ",";
    var relpath=utility.convertAlfPath2Path(doc.PATH);
    var xmlFile=utility.getMetadataFileName(relpath);
    var fullpath=path.join(path2save,xmlFile);
    var dir = path.dirname(fullpath);
    var xml=this.getMetadataXML(doc,excludeFields,delimiter);
    //console.log('dir:'+dir);
    //logger.debug(xml);

    fs.stat(dir, function(err, stat) {
        if(err !== null) {
            mkdirp(dir, function (err) {
                if (err){
                    console.error(err);
                    callback("mkdirp error:"+ err);
                }
                else{
                    fs.writeFile(fullpath, xml,'utf8', function(err) {
                        if(err) {
                            logger.error("writeFileError:"+ err);
                            callback("writeFileError:"+ err);
                        }
                        else{
                            callback();
                        }
                    });
                }
            });
        }
        else{
            console.log('dir exist:'+dir);
            fs.writeFile(fullpath, xml,'utf8', function(err) {
                if(err) {
                    logger.error("writeFileError:"+ err);
                    callback("writeFileError:"+ err);
                }
                else{
                    callback();
                }
            });
        }
    });
};