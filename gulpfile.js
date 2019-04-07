'use strict';

/**
 * Watch & compile changes to SCSS files
 *
 */

var gulp = require('gulp');
var cleanCss = require('gulp-clean-css');
var concat = require('gulp-concat');
var sass = require('gulp-sass');

gulp.task('styles', function() {
    gulp.src(['src/styles/**/*.scss'])
    	.pipe(sass().on('error', sass.logError))
    	.pipe(concat('style.css'))
    	.pipe(cleanCss())
        .pipe(gulp.dest('./public/assets/'));
});

gulp.task('default',function() {
    gulp.watch('src/styles/*.scss',['styles']);
});