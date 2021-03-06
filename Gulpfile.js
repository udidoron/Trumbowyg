var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    path = require('path'),
    spritesmith = require('gulp.spritesmith');

var paths = {
    scripts: ['src/trumbowyg.js'],
    langs: ['src/langs/**.js', '!src/langs/en.js'],
    plugins: ['plugins/*/**.js'],
    sprites: {
        'icons': 'src/ui/images/icons/**.png',
        'icons-2x': 'src/ui/images/icons-2x/**.png'
    },
    mainStyle: 'src/ui/sass/trumbowyg.scss',
    styles: {
        sass: 'src/ui/sass',
        includePaths: ['src/ui/sass']
    }
};

var pkg = require('./package.json');
var banner = ['/**',
    ' * <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>',
    ' * <%= description %>',
    ' * ------------------------',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' * @author <%= pkg.author.name %>',
    ' *         Twitter : @AlexandreDemode',
    ' *         Website : <%= pkg.author.url.replace("http://", "") %>',
    ' */',
    '\n'].join('\n');
var bannerLight = ['/** <%= pkg.title %> v<%= pkg.version %> - <%= pkg.description %>',
    ' - <%= pkg.homepage.replace("http://", "") %>',
    ' - License <%= pkg.license %>',
    ' - Author : <%= pkg.author.name %>',
    ' / <%= pkg.author.url.replace("http://", "") %>',
    ' */',
    '\n'].join('');




gulp.task('clean', function(){
    return gulp.src(['dist/*', 'src/ui/sass/_sprite*.scss'])
        .pipe($.clean());
});

gulp.task('test', ['test-scripts', 'test-langs', 'test-plugins']);
gulp.task('test-scripts', function(){
    return gulp.src(paths.scripts)
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});
gulp.task('test-langs', function(){
    return gulp.src(paths.langs)
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});
gulp.task('test-plugins', function(){
    return gulp.src(paths.plugins)
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('scripts', ['test-scripts'], function(){
    return gulp.src(paths.scripts)
        .pipe($.header(banner, { pkg: pkg, description: 'Trumbowyg core file' }))
        .pipe($.newer('dist/trumbowyg.js'))
        .pipe($.concat('trumbowyg.js', { newLine: '\r\n\r\n' }))
        .pipe(gulp.dest('dist/'))
        .pipe($.size({ title: 'trumbowyg.js' }))
        .pipe($.rename({ suffix: ".min" }))
        .pipe($.uglify())
        .pipe($.header(bannerLight, { pkg: pkg }))
        .pipe(gulp.dest('dist/'))
        .pipe($.size({ title: 'trumbowyg.min.js' }))
});

gulp.task('langs', ['test-langs'], function(){
    return gulp.src(paths.langs)
        .pipe($.rename({ suffix: ".min" }))
        .pipe($.uglify({
            preserveComments: 'all'
        }))
        .pipe(gulp.dest('dist/langs/'))
});

gulp.task('plugins', ['test-plugins'], function(){
    return gulp.src(paths.plugins)
        .pipe(gulp.dest('dist/plugins/'))
        .pipe($.rename({ suffix: ".min" }))
        .pipe($.uglify())
        .pipe(gulp.dest('dist/plugins/'))
});



gulp.task('sprites', function(){
    return makeSprite() && makeSprite('-2x');
});
function makeSprite(resolution){
    if(!resolution)
        resolution = '';

    var sprite = gulp.src(paths.sprites['icons' + resolution])
        .pipe(spritesmith({
            imgName: 'icons' + resolution + '.png',
            cssName: '_sprite' + resolution + '.scss',
            cssTemplate: function(params){
                var output = '', e;
                for(var i in params.items){
                    e = params.items[i];
                    output += '$' + e.name + resolution + ': ' + e.px.offset_x + ' ' + e.px.offset_y + ';\n';
                }
                if(params.items.length > 0){
                    output += '\n\n';
                    output += '$sprite-height' + resolution + ': ' + params.items[0].px.total_height + ';\n';
                    output += '$sprite-width' + resolution + ': ' + params.items[0].px.total_width + ';\n';
                    output += '$icons' + resolution + ': "./images/icons' + resolution + '.png";';
                }

                return output;
            }
        }));
    sprite.img.pipe(gulp.dest('dist/ui/images/'));
    sprite.css.pipe(gulp.dest(paths.styles.sass));
    return sprite.css;
}



gulp.task("styles", ["sprites"], function(){
  return gulp.src(paths.mainStyle)
    .pipe($.sass({
      sass: paths.styles.sass,
      includePaths: paths.styles.includePaths
    }))
    .pipe($.autoprefixer(["last 1 version", "> 1%", "ff >= 20", "ie >= 8", "opera >= 12", "Android >= 2.2"], { cascade: true }))
    .pipe($.header(banner, { pkg: pkg, description: "Default stylesheet for Trumbowyg editor" }))
    .pipe(gulp.dest("dist/ui/"))
    .pipe($.size({ title: "trumbowyg.css" }))
    .pipe($.rename({ suffix: ".min" })) // génère une version minimifié
    .pipe($.minifyCss())
    .pipe($.header(bannerLight, { pkg: pkg }))
    .pipe(gulp.dest("dist/ui/"))
    .pipe($.size({ title: "trumbowyg.min.css" }));
});



gulp.task('watch', function(){
    gulp.watch(paths.scripts, ['scripts']);
    gulp.watch(paths.langs, ['langs']);
    gulp.watch(paths.plugins, ['plugins']);
    gulp.watch(paths.mainStyle, ['styles']);

    gulp.watch(['dist/**', 'dist/*/**'], function(file){
        $.livereload.changed(file);
    });

    $.livereload.listen();
});

gulp.task('build', ['scripts', 'langs', 'plugins', 'styles']);

gulp.task('default', ['build', 'watch']);