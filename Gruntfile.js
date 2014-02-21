//This is the Gruntjs build file for ng-node-foundation.
//The intent of this Gruntjs build file is to put into place all the
//build plumbing for a new project using nodejs and angularjs.

module.exports = function(grunt){

    //tasked used in this grunt build script
    grunt.loadNpmTasks('grunt-conventional-changelog');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-html2js');
    grunt.loadNpmTasks('grunt-wrap');
    grunt.loadNpmTasks('grunt-karma');

    //Load the build.config.js file. This file contains build specific information that will replace
    //tokens in the taskConfig object. Also load other grunt tasks.
    var config = extend(['./grunt/config/build.local.config.js',
                         './grunt/jsmin.task.js',
                         './grunt/copy.task.js',
                         './grunt/less.task.js',
                         './grunt/index.task.js',
                         './grunt/misc.task.js',
                         './grunt/clean.task.js',
                         './grunt/karma.task.js']);

    grunt.initConfig(config);

    //Define Grunt tasks.

    //Copies the files javascript files from the src folder into the build directory and then combines, minifies and
    //copies them into the bin/assets folder.
    grunt.registerTask( 'jsmin', ['html2js',
                                  'uglify:local_javascript',
                                  'wrap:wrap_local_javascript',
                                  'uglify:compile_all_files' ]);

    grunt.registerTask('runtests',['karmaconfig', 'karma'])


    grunt.registerTask('debug',['clean:all',
                                'copy:app_styles_to_build_styles',
                                'less:lint_concat',
                                'copy:local_assets_to_build',
                                'copy:app_styles_to_build_styles',
                                'copy:dependencies_assets_to_build_assets',
                                'copy:app_javascript_to_build_javascript',
                                'copy:dependencies_javascript_to_build_javascript',
                                'index:debug',
                                'copy:copy_all_to_bin',
                                'clean:emptydirectories',
                                'clean:build']);

    grunt.registerTask('release',['clean:all',
        'less:lint_compile_concat',
        'jsmin',
        'copy:copy_assets_to_bin',
        'copy:copy_common_to_bin',
        'index:release',
        'clean:emptydirectories',
        'clean:build']);

    /**
     * In order to make it safe to just compile or copy *only* what was changed,
     * we need to ensure we are starting from a clean, fresh build. So we rename
     * the `watch` task to `delta` (that's why the configuration var above is
     * `delta`) and then add a new task called `watch` that does a clean build
     * before watching for changes.
     */
   // grunt.renameTask( 'watch', 'delta' );
   // grunt.registerTask( 'watch', [ 'build', 'karma:unit', 'delta' ] );

    /**
     * In order to avoid having to specify manually the files needed for karma to
     * run, we use grunt to manage the list for us. The `karma/*` files are
     * compiled as grunt templates for use by Karma. Yay!
     */
    grunt.registerMultiTask( 'karmaconfig', 'Process karma config templates', function () {
        var jsFiles = this.filesSrc.filter( function ( file ) {return file.match( /\.js$/ );});

        processTemplateAndCopyToDestination('karma/karma-unit.tpl.js', grunt.config( 'build_directory' ) + '/karma-unit.js',
        {
            scripts: jsFiles
        });
    });

    /**
     * The index.html template includes the stylesheet and javascript sources
     * based on dynamic names calculated in this Gruntfile. This task assembles
     * the list into variables for the template to use and then runs the
     * compilation.
     */
    grunt.registerMultiTask( 'index', 'Process index.html template', function () {
        var dirRE = new RegExp( '^('+grunt.config('build_directory')+'|'+grunt.config('bin_directory')+')\/', 'g' );

        var jsFiles = filterByFileExtension(this.filesSrc, /\.js$/, dirRE);
        var cssFiles = filterByFileExtension(this.filesSrc, /\.css$/, dirRE);

        processTemplateAndCopyToDestination('src/index.html', this.data.dir + '/index.html',
        {
            scripts: jsFiles,
            styles: cssFiles,
            version: grunt.config( 'pkg.version' )
        });
    });

    function extend(tasks) {
        var _ = require('lodash');
        var config = {pkg: grunt.file.readJSON("package.json")};

        for(var i=0; i< tasks.length; i++) {
            config = _.extend(config, require(tasks[i]));
        }
        return config;
    };

    function processTemplateAndCopyToDestination(src, dest, data){
        grunt.file.copy(src, dest, {
            process: function ( contents, path ) {
                return grunt.template.process( contents, {
                    data: data
                });
            }
        });
    }

    function filterByFileExtension(files, extension, dirRE) {
        return files.filter(function (file) {
            return file.match(extension);
        }).map( function ( file ) {
                return file.replace( dirRE, '' );
            });
    }
};
