
var winston = require('winston');
winston.add(winston.transports.File, { filename: 'somefile.log' });
//var logger = new (winston.Logger)({
//    transports: [
//        new (winston.transports.Console)(),
//        new (winston.transports.File)({ filename: 'somefile.log' })
//    ]
//});
exports.logger = winston;