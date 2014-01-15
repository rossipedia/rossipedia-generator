var path = require('path'),
    util = require('util'),
    _    = require('underscore'),
    lib  = require('./lib');

module.exports = function(grunt) {
  "use strict";

  var config = {
    clean: {
      basic: ['build/*', '!build/blog/*'],
      blog: ['build/blog/*']
    },
    blog: {
      dev: {
        jade: { pretty: true },
        data: {}
      }
    },
    ender: {
      options: {
        output: 'build/scripts/ender',
        dependencies: ['jeesh', 'reqwest', 'jar', 'underscore']
      }
    },
    copy: {
      dev: {
        expand: true,
        cwd: 'src/',
        src: [ 'scripts/**/*.js', 'styles/**/*.css', '*.ico', 'CNAME', 'robots.txt', '**/*.html' ],
        dest: 'build/'
      }
    },
    jade: {
      dev: {
        options: {
          pretty: true,
          data: function() {
            return {
              // TODO: This is horribly inefficient. Don't need to
              // load the whole blog for _every_ page
              blog: new lib.Blog(),
              _: _
            };
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
        tasks:['blog:dev', 'jade:dev'],
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

  grunt.registerMultiTask('blog', 'Process posts into html files', function() {
    var options = _.extend(this.data, { target: this.target }),
        blog = new lib.Blog();

    return blog.build(options);
  });

  grunt.registerTask('build', ['clean', 'copy', 'ender', 'jade', 'less', 'blog']);
  grunt.registerTask('serve', ['build', 'express', 'watch']);

};
