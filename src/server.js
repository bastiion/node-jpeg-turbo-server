var express = require('express');
var exif = require('exif-parser');
var app = express();
var fs = require('fs');
var Q = require('q');
var _ = require('lodash');
var jpegturbo = require('jpeg-turbo');

var l = function(){};//console.log;

var isImage = function (path) {
    var ext = path.substr(-4, 4).toLowerCase();
    return (ext == '.jpg' || ext == '.jpeg' || ext == '.jpe');
};

var getTurboImage =  function(path, scale, quality) {
    var deffered = Q.defer();
    fs.readFile(path, function (err, data) {
        l('Will decompress image');
        var buffer, buffer2;
        var result = jpegturbo.decompressSync(data, {
            format: 'FORMAT_RGB',
            out: buffer,
            scalenum: scale
        });
        l('Finish decompress ');
        l(result);
        var result2 = jpegturbo.compressSync(result.data, {
            format: 'FORMAT_RGB',
            out: buffer2,
            width: result.width,
            height: result.height,
            quality: quality
        });
        l(result2);
        deffered.resolve(result2.data);
    });
    return deffered.promise;
};

var getExifThumbnail = function (path) {
    var deffered = Q.defer();
    try {
        var i = 0;
        fs.readFile(path, function (err, data) {
            if (err) {
                l('Could not read from file %s : %s', path, err.message);
                deffered.resolve({err: err});
                return;
            }
            i++;
            l('Read called %d times', i);
            var parser = exif.create(data);
            var result = parser.parse();
            if(result.hasThumbnail('image/jpeg')) {
                var buffer = result.getThumbnailBuffer();
                l(result.getThumbnailSize());
                deffered.resolve(buffer);
            } else {
                deffered.resolve({err: {message: "No thumbnail"}});
            }

        });
    } catch (err) {
        l('Error creating ExifImage Object: ' + err.message);
        deffered.resolve({err: err});
    }
    return deffered.promise;

};

app.get('/thumb/*', function (req, res) {
    var path = req.params[0];
    if (!isImage(path))
        res.send('This might not be an image');

    var promise = getExifThumbnail(path);
    promise.then(function(data) {
        if (!_.isUndefined(data.err)) {
            res.send(data.err.message);
        } else {
            //res.append('Content-Type', 'image/jpeg');
            res.type('jpeg').send(data);
        }
    });
    //res.send('Finished ' + path);

});

app.get('/turbo/*', function (req, res) {
    var path = req.params[0];
    if (!isImage(path))
        return res.send('This might not be an image');
    if(path.startsWith('file://')) {
        path = path.substring(7);
    }
    var scale = parseInt(req.query.scale) || 1;
    var quality = parseInt(req.query.quality) || 100;
    var trythumb = !_.isUndefined(req.query.trythumb);
    var turboImage = function() {
        var promise = getTurboImage(path, scale, quality);
        promise.then(function (data) {
            if (!_.isUndefined(data.err)) {
                res.send(data.err.message);
            } else {
                //res.append('Content-Type', 'image/jpeg');
                res.type('jpeg').send(data);
            }
        });
    };
    if(trythumb === true) {
        var promise = getExifThumbnail(path);
        promise.then(function(data) {
            if (_.isUndefined(data.err)) {
                res.type('jpeg').send(data);
            } else {
                turboImage();
            }
        });
    } else {
        turboImage();
    }

});

app.get('/scalefactors', function(req, res) {
   var factors = jpegturbo.scaleFactors();
    l(factors);
    res.json(factors);
});

var server = app.listen(7002, function () {
    var address = server.address();
    console.log('Listening at http://%s:%s', address.host, address.port);
});
