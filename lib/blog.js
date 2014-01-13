var _ 			= require('underscore'),
		fs 			= require('fs'),
		path    = require('path'),
		yfm     = require('yaml-front-matter'),
		moment  = require('moment'),
		marked  = require('marked'),
		jade    = require('jade'),
		mkdirp  = require('mkdirp');

var defaultOptions = {
  baseUrl: 'http://rossipedia.com',
	srcDir: 'posts/',
	destDir: 'build/',
	srcPattern: /^(\d{4})-(\d{2})-(\d{2})-(.*?)\.(md|markdown)$/,
	replaceStr: 'blog/$1/$2/$4/index.html',

	// used to get the post date when one isn't supplied in the
	// YAML front matter
	postDateFallback: function(filename, options) {
		var match = path.basename(filename).match(options.srcPattern);
		return moment(match[1] + '-' + match[2] + '-' + match[3]);
	},

	summary: 'index.html', // file rel to destDir
	archives: 'blog/archives/index.html', // dir rel to destDir
	// TODO: turn archives into urlpath

	author: {
		name: 'Bryan J. Ross',
		email: 'bryan@rossipedia.com'
	},

	// Allow comments by default
	// (can be overwritten on a post-by-post basis)
	comments: true,

	// Jade stuff
	postTemplate:     'src/layouts/_post.jade',
	summaryTemplate:  'src/layouts/_summary.jade',
	archivesTemplate: 'src/layouts/_archives.jade'
};

/**
 * Helpers
 */
function endsWith(s, suffix) {
  return s.indexOf(suffix, s.length - suffix.length) !== -1;
}

/**
 * converts a path to something that can be used
 * as a relative url
 */
function toUrlPath(s) {
	var normalized = path.basename(s) === 'index.html'
		? (path.dirname(s) + '/')
		: s;

	if (normalized.charAt(0) !== '/') {
		normalized = '/' + normalized;
	}

	return normalized.replace('\\', '/'); // handle windows
}

/**
 * The Blog class
 *
 * @constructor
 */
function Blog(options) {
	options = options || {};
  _.defaults(options, Blog.options);
	this.options = options;
	this.posts = [];
	initialize.call(this);
}

/**
 * set the default options witch
 * can be overridden
 */
Blog.options = defaultOptions;

/**
 * Gets the latest n blog post metas
 */
Blog.prototype.getLatest = function(n) {
	return _.chain(this.posts)
				  .pluck('meta')
					.last(n)
					.value();
};

/**
 * The Post class
 *
 * @constructor
 */
function Post(blog, filename) {
	this.blog = blog;

	var meta = yfm.loadFront(filename);

	// Set some defaults
	_.defaults(meta, {
		author: blog.options.author.name,
		coments: blog.options.comments
	});

	// Pull content out
	var content = meta.__content;
	delete meta.__content;

  // Make date useful
	meta.date = normalizeDate(filename, meta.date, blog.options);

  // Add some useful information
  meta.filename = path.basename(filename);

  var destPath = meta.filename.replace(blog.options.srcPattern, blog.options.replaceStr);
  meta.destFile = path.join(blog.options.destDir, destPath);
	meta.urlpath = toUrlPath(destPath);

  // this.destFile = ;

	this.meta = meta;
	this.content = content.trim();
	this.next = null;
	this.prev = null;
}

/**
 * Returns true if the post is published currently
 */
Post.prototype.isPublished = function() {
  return this.date.isBefore();
}

/**
 * Generates the content for the post
 */
Post.prototype.getContent = function() {
	return marked(this.content);
};

/**
 * Initializes the blog
 *
 * @this {Blog}
 */
function initialize() {
	loadPosts.call(this);
};

/**
 * Loads blog posts
 */
function loadPosts() {
	var allFiles = fs.readdirSync(this.options.srcDir);
	allFiles.forEach(loadPost, this);
	this.posts.sort(postSorter);

	initializePostLinks.call(this);
}

/**
 * Initializes the next/previous links between posts
 */
function initializePostLinks() {
	for(var i = 0, l = this.posts.length; i < l; ++i) {
		var post = this.posts[i];
		if (i > 0) {
			post.prev = this.posts[i - 1].meta;
		}
		if (i < l - 1) {
			post.next = this.posts[i + 1].meta;
		}
	}
}

/**
 * Loads an individual post from a files
 */
function loadPost(filename) {
	var filePath = path.join(this.options.srcDir, filename);
	if(!fs.statSync(filePath).isFile()) {
		console.log('Non file found: ' + filename);
	} else if(!this.options.srcPattern.test(filename)) {
		console.log('Non-post file found: ' + filePath);
	} else {
		this.posts.push(new Post(this, filePath));
	}
}

/**
 * Sorts posts by date
 */
function postSorter(a,b) {
	if (a.meta.date.isBefore(b.meta.date)) {
		return -1;
	} else if(a.meta.date.isAfter(b.meta.date)) {
		return 1;
	}
	return 0;
}

/**
 * Tries to get a workable moment instance from the given date
 * using the fallback defined in options if necessary
 */
function normalizeDate(filename, date, options) {
	// turn date into something useful
	if (date) {
		date = moment(date);
	} else if (options.postDateFallback) {
		date = options.postDateFallback(filename, options);
	} else {
		throw new Error('Post ' + filename + ' has no date!');
	}

	// Validate it
	if(!date.isValid()) {
		throw new Error('Post ' + filename + ' has invalid date: ' + meta.date);
	}

	return date;
}

/**
 * The GruntJS task
 */
Blog.prototype.build = function(options) {
	var templatePath = this.options.postTemplate;
	var templateContents = fs.readFileSync(templatePath, {encoding: 'utf-8'});
	var postTemplate = jade.compile(templateContents, _.extend(options.jade, {
		filename: templatePath
	}));

  // Post pages
	this.posts.forEach(function(post) {
		mkdirp.sync(path.dirname(post.meta.destFile));
		var rendered = postTemplate(_.extend(options.data, {
			target: options.target,
			post: post,
			blog: this
		}));

		fs.writeFileSync(post.meta.destFile, rendered);
		console.log('Wrote ' + post.meta.destFile);
	}, this);

  // Archives pages
  var byYear = _.chain(this.posts).pluck('meta').groupBy(function(post) {
    return post.date.year();
  }).value();

  _.each(byYear, function(year, posts) {

  });
};

/**
 * Exported stuff
 */
 module.exports = Blog;
