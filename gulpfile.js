// 'use strict';

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var del = require('del');
var webpack = require('webpack-stream');
var named = require('vinyl-named');
var webserver = require('gulp-webserver');
var path = require('path');
var eslint = require('gulp-eslint');
var minifyHtml = require('gulp-minify-html');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var concatCss = require('gulp-concat-css');
var cssbeautify = require('gulp-cssbeautify');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge2');
var imagemin = require('gulp-imagemin');
// var browserSync = require('browser-sync');
// var modRewrite = require('connect-modrewrite');
var runSequence = require('run-sequence');
// var karma = require('gulp-karma');
var opn = require('opn');
var rename = require("gulp-rename");
// var webpackStatsHelper = require('./webpack.stats.helper');
// var replace = require('gulp-replace-task');
// var proxy = require('proxy-middleware');
// var url = require('url');

var conf = {
  dist: {
    dir:'dist',
    webpackConfig: './webpack.dev.config.js',
  },
  dev: {
    dir: 'dev',
    webpackConfig: './webpack.dev.config.js',
  }
};

var autoprefixerBrowsers = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];


gulp.task('serve', function (callback) {
  runSequence('clean:dev', 'webpack:dev', 'html:dev', 'styles:dev', 'images:dev', 'fonts:dev', 'webserver', 'webpack:watch', callback);
});

gulp.task('build', function (callback) {
  runSequence('clean:dist', 'webpack:dist', 'html:dist', 'styles:dist', 'images:dist', 'fonts:dist', callback);
});


gulp.task('clean', ['clean:dev', 'clean:dist']);

gulp.task('clean:dev', function () {
  del.sync([conf.dev.dir + '/*']);
});

gulp.task('clean:dist', function () {
  del.sync([conf.dist.dir + '/*']);
});

gulp.task('html:dev', function () {
  gulp.watch('app/*.html', ['html:dev']);
  
  return gulp.src('app/*.html')
    .pipe(gulp.dest(conf.dev.dir));
});

gulp.task('html:dist', function () {
  return gulp.src('app/*.html')
    .pipe(minifyHtml())
    .pipe(gulp.dest(conf.dist.dir));
});

gulp.task('webpack:dev', function () {
  var webpackConfig = require(conf.dev.webpackConfig);
  webpackConfig.quiet = true;
  return gulp.src(['app/*.{js,jsx}'])
    .pipe(named())
    .pipe(eslint())
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(conf.dev.dir));
});

gulp.task('webpack:dist', function () {
  var webpackConfig = require(conf.dist.webpackConfig);
  webpackConfig.quiet = true;
  return gulp.src(['app/*.{js,jsx}'])
    .pipe(named())
    .pipe(eslint())
    .pipe(webpack(webpackConfig))
    .pipe(uglify())
    .pipe(gulp.dest(conf.dist.dir));
});

gulp.task('webpack:watch', function () {
  var webpackConfig = require(conf.dev.webpackConfig);
  webpackConfig.watch = true;
  return gulp.src('app/*.{js,jsx}')
    .pipe(named())
    .pipe(eslint())
    .pipe(webpack(webpackConfig, null, handleWebpack))
    .pipe(gulp.dest(conf.dev.dir));
});


gulp.task('webserver', function() {
  return gulp.src([conf.dev.dir])
    .pipe(webserver({
      host: 'localhost', //change to 'localhost' to disable outside connections
      port: 3000,
      livereload: true,
      open: true
    }));
}); 

gulp.task('styles:dev', function () {
  gulp.watch('app/css/*.{css,scss}', ['styles:dev']);
  return merge (
      // gulp.src('app/css/*.css'),
      // gulp.src('app/css/*.scss')
      gulp.src('app/css/app.scss')
        .pipe(sass())
    )
    .pipe(sourcemaps.init())
    .pipe(concatCss("app.css"))
    .pipe(autoprefixer(autoprefixerBrowsers))
    .pipe(csso())
    .pipe(cssbeautify({indent: '  ', openbrace: 'end-of-line', autosemicolon: true,}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(conf.dev.dir));
});



gulp.task('styles:dist', function () {
  return merge (
      // gulp.src('app/css/*.css'),
      // gulp.src('app/css/*.scss')
      gulp.src('app/css/app.scss')
        .pipe(sass())
    )
    .pipe(concatCss("app.css"))
    .pipe(autoprefixer(autoprefixerBrowsers))
    .pipe(csso())
    .pipe(gulp.dest(conf.dist.dir));
});


gulp.task('images:dev', function () {
  gulp.watch('app/img/*.{png,jpg,gif}', ['images:dev']);
  return gulp.src('app/img/*.{png,jpg,gif}')
    .pipe(imagemin({ optimizationLevel: 3, interlaced: true }))
    .pipe(gulp.dest(path.join(conf.dev.dir, 'img')));
});

gulp.task('images:dist', function () {
  return gulp.src('app/img/*.{png,jpg,gif}')
    .pipe(imagemin({ optimizationLevel: 3, interlaced: true }))
    .pipe(gulp.dest(path.join(conf.dist.dir, 'img')));
});


gulp.task('fonts:dev', function () {
  gulp.watch('app/font/**/*.{ttf,eot,svg,woff,woff2}', ['fonts:dev']);
  return gulp.src('app/font/**/*.{ttf,eot,svg,woff,woff2}')
    .pipe(rename({dirname:""}))
    .pipe(gulp.dest(path.join(conf.dev.dir, 'font')));
});

gulp.task('fonts:dist', function () {
  return gulp.src('app/font/**/*.{ttf,eot,svg,woff,woff2}')
    .pipe(rename({dirname:""}))
    .pipe(gulp.dest(path.join(conf.dist.dir, 'font')));
});

var isOpenApp = false;
function openApp() {
  if (!isOpenApp) {
    opn('http://localhost:3000', null, function () {
      isOpenApp = true;
    });
  }
}

function handleWebpack(error, stats) {
  var webpackStatsOptions = {
    colors: gulpUtil.colors.supportsColor,
    hash: false,
    timings: false,
    chunks: false,
    chunkModules: false,
    modules: false,
    children: false,
    version: true,
    cached: false,
    cachedAssets: false,
    reasons: false,
    source: false,
    errorDetails: false
  };

  if (error) {
    gulpUtil.log(error.toString());
  } else {
    gulpUtil.log(stats.toString(webpackStatsOptions));
    openApp();
  }
}


// var proxyOptions = [
//   //{
//   //  endpoint: 'http://localhost:8000/api',
//   //  route: '/api'
//   //}
// ];


// function handleWebpack(error, stats) {
//   if (error) {
//     gulpUtil.log(error.toString());
//   } else {
//     gulpUtil.log(stats.toString(webpackStatsOptions));
//     openApp();
//   }
// }

// function createProxyOption(endpoint, route) {
//   var proxyOption = url.parse(endpoint);
//   proxyOption.route = route;
//   proxyOption.rejectUnauthorized = false;
//   return proxyOption;
// }




// gulp.task('webpack:build', function () {
//   var webpackConfigs = require('./webpack.build.config.js');
//   return gulp.src(['app/*.{js,jsx}'])
//     .pipe(named())
//     .pipe(webpack(webpackConfigs))
//     .pipe(gulp.dest('.tmp'));
// });

// gulp.task('html', ['webpack:build'], function () {
//   var patterns = webpackStatsHelper.getReplacePatterns();
//   return gulp.src('app/*.html')
//     .pipe(replace({
//       patterns: patterns,
//       usePrefix: false
//     }))
//     .pipe(minifyHtml({empty: true, cdata: true, conditionals: true}))
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('scripts', function () {
//   return gulp.src('.tmp/*.js')
//     .pipe(uglify())
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('styles', function () {
//   return gulp.src('.tmp/*.css')
//     .pipe(autoprefixer(autoprefixerBrowsers))
//     .pipe(csso())
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('images', function () {
//   return gulp.src('.tmp/*.{png,jpg,gif}')
//     .pipe(imagemin({
//       optimizationLevel: 3,
//       interlaced: true
//     }))
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('fonts', function () {
//   return gulp.src('.tmp/*.{ttf,eot,svg,woff,woff2}')
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('copy', function () {
//   return gulp.src(['app/*.*', '!app/*.{html,js}'], {dot: true})
//     .pipe(gulp.dest('dist'));
// });

// gulp.task('browserSync', function (callback) {
//   var middleware = proxyOptions.map(function (proxyOption) {
//     return proxy(createProxyOption(proxyOption.endpoint, proxyOption.route));
//   });
//   middleware.push(modRewrite([
//     '!\\.\\w+$ /index.html [L]'
//   ]));
//   browserSync({
//     files: ['app/*.html', '.tmp/**/*', '!.tmp/**/*.css'],
//     server: {
//       baseDir: ['.tmp', 'app'],
//       middleware: middleware
//     },
//     port: 3000,
//     reloadOnRestart: false,
//     open: false
//   });
//   callback();
// });


// gulp.task('test', function () {
//   return gulp.src('test/spec/**/*.js')
//     .pipe(karma({
//       configFile: 'karma.conf.js',
//       action: 'run'
//     }));
// });

// gulp.task('build', function (callback) {
//   runSequence('clean', 'html', 'scripts', 'styles', 'images', 'fonts', 'copy', callback);
// });

// gulp.task('serve:dist', ['build'], function () {
//   var middleware = proxyOptions.map(function (proxyOption) {
//     return proxy(createProxyOption(proxyOption.endpoint, proxyOption.route));
//   });
//   middleware.push(modRewrite([
//     '!\\.\\w+$ /index.html [L]'
//   ]));
//   browserSync({
//     server: {
//       baseDir: 'dist',
//       middleware: middleware
//     }
//   });
// });

// gulp.task('default', function () {
//   gulp.start('build');
// });
