var path = require('path'),
    util = require('util'),
    lib = require('./lib');

module.exports = function(grunt) {
  "use strict";

  var config = {
    clean: {
			basic: ['build/*', '!build/blog/*'],
			posts: ['build/blog/*']
		},
    posts: {
      dev: {
        options: {
          author: 'Bryan J. Ross' ,
          baseUrl: 'http://rossipedia.com/blog',
          comments: true
        },
        expand: true,
        cwd: 'posts/',
        src: '**/*.md',
        template: 'src/layouts/_post.jade',
        summary: 'build/index.html',
        dest: 'build/blog/',
        rename: function(dest, src) {
          /**
           * dest: folder
           * src:  filename
           */
           var namedata;
           try {
             namedata = new lib.FileNameMeta(src);
           } catch(e) {
             return path.join(dest, src);
           }

           var out = path.join(dest, namedata.postPath(),'index.html');
           return out;
        }
      }
    },
    copy: {
      dev: {
        expand: true,
        cwd: 'src/',
        src: [ '**/*.css', '**/*.js' ],
        dest: 'build/'
      }
    },
    jade: {
      dev: {
        options: {
          pretty: true,
          data: function (src, dest) {
            return lib.pageData;
          }
        },
        expand: true,
        cwd: 'src/',
        src: ['**/*.jade', '!**/_*.jade'],
        dest: 'build/',
        ext: '.html',
        rename: function(dstDir, outName, opts) {
          if(outName == 'index.html') return path.join(dstDir, outName);
          return path.join(dstDir, path.basename(outName, '.html'), 'index.html');
        }
      }
    },
    less: {
      dev: {
        options: { cleancss: false },
        expand: true,
        cwd: 'src/styles/',
        src: ['**/*.less', '!**/_*.less'],
        dest: 'build/styles/',
        ext: '.css'
      }
    },

    // -- for dev --
    express: {
      dev: {
        options: {
          port: 9000,
          hostname: "0.0.0.0",
          bases: [ __dirname + '/build'],
          livereload: true
        }
      }
    },
    watch: {
      less: {
        files:['src/styles/**/*.less'],
        tasks:['less:dev'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      jade: {
        files:['posts/**/*.md', 'src/**/*.jade'],
        tasks:['posts:dev', 'jade:dev'],
        options: {
          spawn: false,
          livereload: true
        }
      },
      static: {
        files:['src/styles/**/*.css','src/scripts/**/*.js'],
        tasks:['copy:dev'],
        options: {
          spawn: false,
          livereload: true
        }
      }
    }
  };

  grunt.initConfig(config);

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.registerMultiTask('posts', 'Process posts into jade files', lib.postsTask);

  grunt.registerTask('build', ['clean:basic', 'posts', 'copy', 'jade', 'less']);
  grunt.registerTask('serve', ['build', 'express', 'watch']);

};
