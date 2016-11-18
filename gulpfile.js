var gulp = require('gulp');
var express = require('gulp-express');

gulp.task('server', function() {
    express.run(['src/server.js']);
    gulp.watch(['src/server.js'], [express.notify]);
});