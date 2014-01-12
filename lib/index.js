var fs      = require('fs'),
    async   = require('async'),
		marked  = require('marked'),
    yfm     = require('yaml-front-matter'),
    grunt   = require('grunt'),
		path    = require('path'),
    util    = require('util'),
		jade    = require('jade'),
		moment  = require('moment'),
    _       = require('underscore');

var normalizeLang = function(lang) {
  if(lang === undefined) return 'none';
  switch(lang) {
    case 'c#': return 'csharp';
    default: return lang;
  }
};

var renderer = new marked.Renderer();
renderer.code = function(code, lang) {
  var langAttr = 'class="language-' + normalizeLang(lang) + '"';
  return '<pre><code ' + langAttr + '>' +
         code +
         '</code></pre>';
};

renderer.codespan = function(code) {
  return '<code class="span">' + code + '</code>';
};

marked.setOptions({renderer:renderer});

/**
 * Performs any conversion of markdown needed
 * before processing
 */
var treatMarkdown = function(md) {
  // handle code blocks
  var ex = /^```[ \t]*(\S+)[ \t]+(.*?)$/gm;
  return md.replace(ex, function(match, lang, rest) {
    return '<div class="code-desc">\n' +
           '  ' + rest + '\n' +
           '</div>\n\n' +
           '```' + lang
  });
};

/**
 * Constructed from parsing an octopress-style
 * markdown post
 */
function Post(filepath, options, headonly) {
  var contents = fs.readFileSync(filepath, {encoding:'utf-8'});
  var meta = yfm.loadFront(contents);
  var content = meta.__content.trim();
  delete meta.__content;

	var namedata = new FileNameMeta(filepath);

	// Let's get something useful out of date
	var pubDate = meta.date
		? moment(meta.date)
		: namedata.toPubDate();

	if (!pubDate.isValid()) {
		throw new Error('Unknown date for ' + filepath + ' (' + meta.date + ')');
	}

	meta.date = pubDate;
  meta.href = namedata.toHref(options.baseUrl);
  meta.slug = namedata.slug;
  meta.path = namedata.postPath();

  meta.srcFile = filepath;

  _.defaults(meta, options);

	this.meta = _.pick(meta, 'title', 'date', 'author', 'comments', 'tags',
                     'categories', 'slug', 'href', 'path', 'srcFile');

  if(!headonly) {
    this.content = marked(treatMarkdown(content));
  }
}

Post.prototype.isPublished = function() {
	if (!this.meta.data) {
		return true;
	}
	var pubDate = moment(this.meta.date);
	return pubDate.isBefore();
};

function FileNameMeta(filename) {
	var ex = FileNameMeta.exp,
	    match = path.basename(filename).match(ex, '$2');

	if(!match) {
		throw new Error('Invalid post filename format.');
	}

  this.filename = filename;

	this.year = parseInt(match[1],10);
	this.month = parseInt(match[2], 10) - 1;
	this.day = parseInt(match[3], 10);
	this.slug = match[4];
}

FileNameMeta.exp = /^(\d{4})-(\d{2})-(\d{2})-(.*?)\.md$/;

FileNameMeta.prototype.toPubDate = function() {
	return moment({year:this.year,month:this.month,day:this.day});
};

FileNameMeta.prototype.toHref = function(prefix) {
  return prefix + this.postPath();
};

FileNameMeta.prototype.postPath = function() {
  return path.basename(this.filename).replace(FileNameMeta.exp, '$1/$2/$4');
};

exports.FileNameMeta = FileNameMeta;

var loadPostMetas = function(files, options) {
  var srcOnly = files.map(function(f) {
    return f.src[0];
  });

  var latest = srcOnly.sort().reverse();
  var metas = latest.map(function(f) {
    var post = new Post(f, options, true);
    delete post.content;
    return post;
  });


  // Don't bother with unpublished posts
  metas = metas.filter(function(meta) {
    return meta.isPublished();
  });

  // Sort the metas by actual date
  metas.sort(function(a,b) {
    console.log([a.meta,b.meta]);
    return a.meta.date.isBefore(b.meta.data)
      ? -1
      : b.meta.data.isBefore(a.meta.data)
      ? 1
      : 0;
  });

  return metas.map(function(p) { return p.meta; });
};


exports.postsTask = function() {
  var done = this.async();
  var options = this.options();

	// compile the jade template
	var templateSource = grunt.file.read(this.data.template);
	var template = jade.compile(templateSource, {
		// jade options
		filename: this.data.template,
		pretty: true
	});


  // filter all files by existing
  this.files.forEach(function (f) {
    var files = f.src.filter(function(filepath) {
      if(!grunt.file.exists(filepath)) {
        grunt.log.warn('Source file "' + filepath + '" not found.');
        return false;
      } else {
        return true;
      }
    });

    f.src = files;
  });

  var metas = loadPostMetas(this.files, options);

  // Let's just check here:
  metas.forEach(function(m) {
    console.log(m.srcFile);
  });

  async.forEachSeries(this.files, function(f, nextFileObj) {
    var destFile = f.dest;
    if (f.src.length === 0) {
      grunt.log.error('Error writing ' + destFile);
      grunt.log.warn('Destination not written because no source files were found.');
      return nextFileObj();
    }

    if (f.src.length > 1) {
      grunt.log.error('Error writing ' + destFile);
      grunt.log.error('Destination not written because more than one source file specified.');
      return nextFileObj();
    }

		var post = new Post(f.src[0], options);
		if (!post.isPublished()) {
			// Don't bother generating, it hasn't been published
			return nextFileObj();
		}

    var html = template({
      post: post,
      allposts: metas
    });
    grunt.file.write(destFile, html);
    nextFileObj();
  }, done);
};

