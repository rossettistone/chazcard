var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var refresh = require('gulp-livereload');
var lr = require('tiny-lr');
var server = lr();
var minifyCSS = require('gulp-minify-css');
var embedlr = require('gulp-embedlr');

gulp.task('scripts', function() {
    gulp.src(['./src/js/**/*.js'])
        .pipe(concat('footer.min.js'))
        .pipe(gulp.dest('./build'))
        .pipe(refresh(server))
})

gulp.task('styles', function() {
    gulp.src(['./src/css/*.less'])
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest('./build'))
        .pipe(refresh(server))
    gulp.src(['./src/css/*.css'])
        .pipe(minifyCSS())
        .pipe(gulp.dest('./build'))
        .pipe(refresh(server))
})

gulp.task('lr-server', function() {
    server.listen(35729, function(err) {
        if(err) return console.log(err);
    });
})

gulp.task('html', function() {
    gulp.src("*.html")
        .pipe(embedlr())
        .pipe(gulp.dest('build'))
        .pipe(refresh(server));
})

gulp.task('default', function() {
    gulp.run('lr-server', 'scripts', 'styles', 'html');

    gulp.watch('./src/js/**', function(event) {
        gulp.run('scripts');
    })

    gulp.watch('./src/css/**', function(event) {
        gulp.run('styles');
    })

    gulp.watch('./**/*.html', function(event) {
        gulp.run('html');
    })
})