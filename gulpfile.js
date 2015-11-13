var gulp = require('gulp'),
    browserSync = require('browser-sync'),

    $ = require('gulp-load-plugins')(),

    jsFiles = ['lib/**/*.js'],
    lintFiles = ['gulpfile.js', 'lib/**/*.js'],
    testFiles = ['test/**/*.js'];


/**
 * Linting
 *
 * Tests for code quality and source standards.
 */
gulp.task('jshint', function() {
    return gulp.src(lintFiles)
        .pipe(browserSync.reload({
            stream : true,
            once   : true
        }))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});


/**
 * Code Style
 *
 * Tests for code style accuracy.
 */
gulp.task('eslint', function() {
    return gulp.src(lintFiles)
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failOnError());
});


/**
 * Test
 *
 * Tests the application.
 */
gulp.task('test', ['jshint', 'eslint'], function() {
    return gulp.src(testFiles)
        .pipe($.mocha());
});


/**
 * Setup-Coverage
 *
 * Sets up istanbul for watching tests.
 */
gulp.task('setup-coverage', function() {
    return gulp.src(jsFiles)
        .pipe($.istanbul({
            includeUntested : true
        }))
        .pipe($.istanbul.hookRequire())
        .pipe(gulp.dest('coverage/'));
});


/**
 * Coverage
 *
 * Runs a coverage report for the tests.
 */
gulp.task('coverage', ['setup-coverage'], function() {
    return gulp.src(testFiles)
        .pipe($.mocha())
        .pipe($.istanbul.writeReports());
});


/**
 * Changelog
 *
 * Outputs a markdown version of the changelog between the previous two tags.
 */
gulp.task('changelog', function() {
    var tagString;
    
    function printChangeLog(err, stdout) {
        if (err) {
            throw err;
        }
        
        process.stdout.write('\nChangelog between tags ' + tagString + ':\n\n');
        process.stdout.write(stdout + '\n');
    }
    
    function getPrevTag(err, stdout) {
        if (!err) {
            tagString = stdout.trim() + '..' + tagString;
        }
        
        $.git.exec({args : 'log ' + tagString + ' --no-merges --reverse --pretty=format:\'- [view](https://github.com/slackrpg/slack-orm/commit/%H) &bull; %s\''}, printChangeLog);
    }
    
    function getLatestTag(err, stdout) {
        if (err) {
            throw err;
        }
        
        tagString = stdout.trim();
        
        $.git.exec({args : 'describe --abbrev=0 --tags ' + tagString + '~1'}, getPrevTag);
    }
    
    
    // Fire off our chain
    $.git.exec({args : 'describe --abbrev=0 --tags'}, getLatestTag);
    
});
