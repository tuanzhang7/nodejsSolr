var csv = require('csv');
var fs = require('fs');
// read csv file to list of object e.g.
// csv
// sys:node-dbid
// 101475
// 22222
// [{sys:node-dbid:101475},{sys:node-dbid:22222}]
// sys:node-dbid,cm:modifier
// 101475,admin
// 22222,admin
// [{"sys:node-dbid":101475,"cm:modifier":admin},
// {"sys:node-dbid":22222,"cm:modifier":admin}]
exports.readCSV=function (csvFile,delimiter,callback) {
    delimiter = delimiter || ",";
    fs.readFile(csvFile, function (err, data) { // Read the contents of the file
        if (err){
            console.error( "** ERROR ** ", err);
            callback();
        } else{
            // Finally parse the data
            csv.parse(data, {columns: true}, function(err, output){
                callback(output);
            });
        }
    });

};
