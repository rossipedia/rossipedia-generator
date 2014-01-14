var _       = require('underscore'),
    fs      = require('fs'),
    path    = require('path'),
    yfm     = require('yaml-front-matter'),
    moment  = require('moment'),
    marked  = require('marked'),
    jade    = require('jade'),
    util    = require('util'),
    mkdirp  = require('mkdirp');

var defaultOptions = {
  baseUrl: 'http://rossipedia.com',
  srcDir: 'posts/',
  destDir: 'build/',
  postsDir: 'blog/',
  srcPostPattern: /^(\d{4})-(\d{2})-(\d{2})-(.*?)\.(md|markdown)$/,

  // used to get the post date when one isn't supplied in the
  // YAML front matter
  postDateFallback: function(filename, meta, options) {
    var match = path.basename(filename).match(options.srcPostPattern);
    return moment(match[1] + '-' + match[2] + '-' + match[3]);
  },

  summary: '', // file rel to destDir

  archivesGroupByFormat: 'MMMM YYYY', // eg: January 2012

  jumpPattern: /<!--[ \t]*more[ \t]*-->/i,

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
  initializeBlog.call(this);
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
          .last(n)
          .pluck('meta')
          .sortBy(function(post) {
            return -post.date.valueOf();
          })
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
  var content = meta.__content.trim();
  delete meta.__content;

  // Add some useful information
  meta.filename = path.basename(filename);

  // Make date useful
  meta.date = normalizeDate(filename, meta, blog.options);
  meta.slug = normalizeSlug(filename, meta, blog.options);


  var destPath = path.join(blog.options.postsDir, meta.date.format('YYYY/MM'), meta.slug);
  meta.destFile = path.join(blog.options.destDir, destPath, 'index.html');
  meta.urlpath = toUrlPath(destPath);
	meta.href = blog.options.baseUrl + meta.urlpath;

  this.meta = meta;
  this.content = content;
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
 * Gets the teaser text for the post
 */
Post.prototype.getTeaser = function() {
  var index = this.content.search(this.blog.options.jumpPattern);
  return index !== -1
    ? marked(this.content.substr(0, index).trim())
    : null;
}

/**
 * Initializes the blog
 *
 * @this {Blog}
 */
function initializeBlog() {
  loadPosts.call(this);
  initializePostLinks.call(this);
  initializeArchives.call(this);
  return this;
};

/**
 * Initializes the archive data
 */
function initializeArchives() {
  this.options.archivesUrl = toUrlPath(this.options.postsDir);
}

/**
 * Loads blog posts
 */
function loadPosts() {
  var allFiles = fs.readdirSync(this.options.srcDir);
  allFiles.forEach(loadPost, this);
  this.posts.sort(postSorter);
}

/**
 * Initializes the next/previous links between posts
 *
 * If this seems backwards, it's because posts are
 * always newest -> oldest
 */
function initializePostLinks() {
  for(var i = 0, l = this.posts.length; i < l; ++i) {
    var post = this.posts[i];
    if (i > 0) {
      post.next = this.posts[i - 1].meta;
    }
    if (i < l - 1) {
      post.prev = this.posts[i + 1].meta;
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
  } else if(!this.options.srcPostPattern.test(filename)) {
    console.log('Non-post file found: ' + filePath);
  } else {
    this.posts.push(new Post(this, filePath));
  }
}

/**
 * Sorts posts by date, in reverse order
 */
function postSorter(a,b) {
  if (a.meta.date.isBefore(b.meta.date)) {
    return 1;
  } else if(a.meta.date.isAfter(b.meta.date)) {
    return -1;
  }
  return 0;
}

/**
 * Tries to get a workable moment instance from the given date
 * using the fallback defined in options if necessary
 */
function normalizeDate(filename, meta, options) {
  // turn date into something useful
  var date = meta.date;
  if (date) {
    date = moment(date);
  } else if (options.postDateFallback) {
    date = options.postDateFallback(filename, meta, options);
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
 * Returns a slug for the post
 *
 * @this {Post}
 */
function normalizeSlug(filename, meta, content, options) {
  if (meta.title) {
    return meta.title.replace(/\W/g, '-').toLowerCase();
  } else if(options.slugFallback) {
    return options.slugFallback(filename, meta, options);
  } else if(content) {
    // 1st line of content
    return content.split('\n')[0].trim();
  } else {
    throw new Error('Post ' + filename + ' does not have any valid slug');
  }
}

/**
 * The GruntJS task
 */
Blog.prototype.build = function(taskOptions) {
  var templatePath = this.options.postTemplate;
  var templateContents = fs.readFileSync(templatePath, {encoding: 'utf-8'});
  var postTemplate = jade.compile(templateContents, _.extend(taskOptions.jade, {
    filename: templatePath
  }));

  // Post pages
  this.posts.forEach(_.partial(buildPostPage, taskOptions, postTemplate), this);

  // Archives pages
  buildArchivePages.call(this, taskOptions);
};

/**
 * Support build functions
 */
function buildPostPage(taskOptions, postTemplate, post) {
  var rendered = postTemplate(_.extend(taskOptions.data, {
    target: taskOptions.target,
    post: post,
    blog: this,
    _: _
  }));

  mkdirp.sync(path.dirname(post.meta.destFile));
  fs.writeFileSync(post.meta.destFile, rendered);
  console.log('Wrote ' + post.meta.destFile);
}

function groupByMonth(posts) {
  var byMonth = _.groupBy(posts, function(post) {
    return post.meta.date.month();
  });

  var months = _.keys(byMonth);
  months.sort();
  months.reverse();

  return _.map(months, function(month) {
    return {
      month: moment({month:month}).format('MMMM'),
      posts: byMonth[month]
    };
  });
}

function groupByMonthAndYear(posts) {
  var byYear = _.groupBy(posts, function(post) {
    return post.meta.date.year();
  });

  var years = _.keys(byYear);
  years.sort();
  years.reverse();

  return _.map(years, function(year) {
    return {
      year: year,
      posts: groupByMonth(byYear[year])
    }
  });
}

function buildArchivePages(taskOptions) {
  var posts = groupByMonthAndYear(this.posts);

  var templatePath = this.options.archivesTemplate;
  var templateContents = fs.readFileSync(templatePath, {encoding: 'utf-8'});
  var template = jade.compile(templateContents, _.extend(taskOptions.jade, {
    filename: templatePath
  }));

  var rendered = template(_.extend(taskOptions.data, {
    target: taskOptions.target,
    posts: posts,
    util: util,
    _: _ // why not
  }));

  var destFile = path.join(this.options.destDir, this.options.postsDir, 'index.html');
  // Make root archives page
  mkdirp.sync(path.dirname(destFile));
  fs.writeFileSync(destFile, rendered);
  console.log('');
  console.log('Wrote archives page ' + destFile);

	// Make year/month archive pages
	_.each(posts, function(byYear) {

	});
}

/**
 * Exported stuff
 */
 module.exports = Blog;
