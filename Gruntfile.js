var path = require('path');

module.exports = function(grunt) {
  "use strict";

  var config = {
    less: {
      dev: {
        options: { cleancss: true },
        expand: true,
        cwd: 'src/styles/',
        src: ['**/*.less'],
        dest: 'build/styles/',
        ext: '.css'
      }
    },
    jade: {
      dev: {
        options: { pretty: true },
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
    cacheBreak: {
      dev: {
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
        files:['src/**/*.jade', '!**/_*.jade'],
        tasks:['jade:dev'],
        options: {
          spawn: false,
          livereload: true
        }
      }
    }
  };

  grunt.initConfig(config);

  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  var tasks = Object.keys(config).filter(function(a) { return a !== 'watch'; });
  var devTasks = tasks.map(function(task) { return task + ':dev'; });
  // watch is dev only
  devTasks.push('watch');
  // var prodTasks = tasks.map(function(task) { return task + ':prod'; });

  grunt.registerTask('dev', devTasks);
  grunt.registerTask('cacheBreak', 'Cache breaks static files', function() {
    grunt.log.writeln('[TO BE IMPLEMENTED]');
  });
  grunt.registerTask('default', ['dev']);
};
