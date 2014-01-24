var _       = require('underscore'),
    fs      = require('fs'),
    path    = require('path'),
    jsYaml  = require('js-yaml'),
    moment  = require('moment'),
    marked  = require('marked'),
    jade    = require('jade'),
    util    = require('util'),
    Feed    = require('feed'),
    sitemap = require('sitemap'),
    mkdirp  = require('mkdirp');

var defaultOptions = {
  siteName: 'Rossipedia',
  hostName: 'rossipedia.com',
  baseUrl: 'http://rossipedia.com',
  srcDir: 'posts/',
  destDir: 'build/',
  postsDir: 'blog/',
  feedUrl: 'atom.xml',
  srcPostPattern: /^(\d{4})-(\d{2})-(\d{2})-(.*?)\.(md|markdown)$/,

  // used to get the post date when one isn't supplied in the
  // YAML front matter
  postDateFallback: function(filename, meta, options) {
    var match = path.basename(filename).match(options.srcPostPattern);
    return moment(match[1] + '-' + match[2] + '-' + match[3]);
  },

  slugFallback: function(filename, meta, options) {
    var match = path.basename(filename).match(options.srcPostPattern);
    return match[4];
  },

  summary: '', // file rel to destDir
  summaryCount: 10, // How many latest posts to show on home page

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
  s = path.basename(s) === 'index.html'
    ? (path.dirname(s) + '/')
    : s;

  if (s.charAt(0) !== '/') {
    s = '/' + s;
  }

  s = path.normalize(s);

  return s.replace(/\\/g, '/'); // handle windows
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
  this.sitemap = sitemap.createSitemap({
    hostname: this.options.baseUrl,
  });
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
  return _.first(this.posts, n);
};

/**
 * Parses YAML front matter
 * Sets remaining content to __content property
 * - adapted from yaml-front-matter in npm
 */
function loadFrontMatter(filename) {
  var re = /^(-{3}(?:\n|\r)([\w\W]+?)-{3})?([\w\W]*)*/,
      contents = fs.readFileSync(filename, 'utf-8'),
      results = re.exec(contents),
      data = {},
      yaml;

  if(yaml = results[2]) {
    try {
      data = jsYaml.safeLoad(yaml, {
        filename: filename,
        strict: true
      });
    } catch (e) {
      e = new Error('Unable to load front matter for: ' + filename + '\n' + e);
      throw e;
    }
  }
  data.__content = results[3] ? results[3] : '';
  return data;
}

/**
 * The Post class
 *
 * @constructor
 */
function Post(blog, filename) {
  this.blog = blog;

  var meta = loadFrontMatter(filename);

  // Set some defaults
  _.defaults(meta, {
    author: blog.options.author.name,
    coments: blog.options.comments
  });

  // Pull content out
  var content = meta.__content.trim();
  delete meta.__content;

  // Add some useful information
  meta.filepath = filename;
  meta.filename = path.basename(filename);

  // Make date useful
  meta.date = normalizeDate(filename, meta, blog.options);
  meta.slug = normalizeSlug(filename, meta, blog.options);


  var destPath = path.join(blog.options.postsDir, meta.date.format('YYYY/MM'), meta.slug);
  meta.destFile = path.join(blog.options.destDir, destPath, 'index.html');
  meta.urlpath = toUrlPath(destPath);
  meta.href = blog.options.baseUrl + meta.urlpath;

  this.meta = meta;
  this.content = marked(content);
  this.next = null;
  this.prev = null;
}

/**
 * Returns true if the post is published currently
 */
Post.prototype.isPublished = function() {
  return this.meta.date.isBefore();
}

/**
 * Generates the content for the post
 */
Post.prototype.getContent = function() {
  return this.content;
};

/**
 * Gets the teaser text for the post
 */
Post.prototype.getTeaser = function() {
  var index = this.content.search(this.blog.options.jumpPattern);
  var teaserContent = index !== -1
    ? this.content.substr(0, index)
    : this.content.split(/\n\s*\n/)[0];

  return teaserContent.trim();
}

/**
 * Gets the last modification time of the post
 * (distinct from pub date)
 */
Post.prototype.getLastModTime = function() {
  var stat = fs.stat(this.filepath);
  return moment(stat.mtime);
};

/**
 * Initializes the blog
 *
 * @this {Blog}
 */
function initializeBlog() {
  loadPosts.call(this);
  initializePostLinks.call(this);
  initializeArchives.call(this);

  this.options.feedFile = path.join(this.options.destDir, this.options.feedUrl);
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
    var post = new Post(this, filePath);
    if (post.isPublished()) {
      this.posts.push(post);
    } else {
      console.log('File ' + filename + ' is not published yet.');
    }
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
  if (meta.slug) {
    return meta.slug;
  } else if (meta.title) {
    return meta.title.replace(/[^\w\s]+/g, '').replace(/\s+/g, '-').toLowerCase();
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
  var templateData = _.extend({}, taskOptions.data, {
    target: taskOptions.target,
    blog: this
  });

  var jadeData = taskOptions.jade;

  var buildFunctions = [
    buildPostPages,
    buildArchivePages,
    buildBlogFrontPage
  ];

  _.each(buildFunctions, function(fn) {
    fn.call(this, jadeData, templateData);
  }, this);

  writeCname.call(this);
  buildAtomFeed.call(this);
  buildSitemap.call(this);
};

/**
 * Writes the CNAME file for GH pages
 */
function writeCname() {
  fs.writeFileSync(path.join(this.options.destDir, 'CNAME'), this.options.hostName + '\n');
}

/**
 * Builds post pages
 */
function buildPostPages(jadeData, templateData) {
  var templatePath = this.options.postTemplate,
      templateContents = fs.readFileSync(templatePath, 'utf-8'),
      postTemplate = jade.compile(templateContents, _.extend({}, jadeData, {
        filename: templatePath
      })),

      builder = _.partial(buildPostPage, postTemplate, templateData);

  // Post pages
  this.posts.forEach(builder, this);
}

/**
 * Builds an individual post page
 */
function buildPostPage(postTemplate, templateData, post) {
  var rendered = postTemplate(_.extend({}, templateData, {
    post: post
  }));

  mkdirp.sync(path.dirname(post.meta.destFile));
  fs.writeFileSync(post.meta.destFile, rendered);

  console.log('Wrote post page ' + post.meta.destFile);

  // Add to sitemap
  this.sitemap.add(post.meta.href);
}

/**
 * Builds the archive pages
 */
function buildArchivePages(jadeData, templateData) {
  var posts = groupByMonthAndYear(this.posts),
      templatePath = this.options.archivesTemplate,
      templateContents = fs.readFileSync(templatePath, 'utf-8'),
      template = jade.compile(templateContents, _.extend({}, jadeData, {
        filename: templatePath
      }));

  renderArchivePage.call(this, template, templateData, '.', posts);

  _.each(posts, function(group) {
    renderArchivePage.call(this, template, templateData, group.path, [group]);

    _.each(group.posts, function(month) {
      var posts = _.extend({}, group, {posts:[month]});
      var destFolder = path.join(group.path, month.path);
      renderArchivePage.call(this, template, templateData, destFolder, [posts]);
    }, this);
  }, this);
}

/**
 * Builds an individual pages
 */
function renderArchivePage(template, templateData, dir, posts) {
  var rendered = template(_.extend({}, templateData, {
    posts: posts,
    util: util,
    archivesRoot: toUrlPath(this.options.postsDir)
  }));

  // Make root archives page
  var destFile = path.join(this.options.destDir, this.options.postsDir, dir, 'index.html');
  mkdirp.sync(path.dirname(destFile));
  fs.writeFileSync(destFile, rendered);

  console.log('Wrote archives page ' + destFile);

  // Add to sitemap
  this.sitemap.add(toUrlPath(path.join(this.options.postsDir, dir)));
}

function numerically(a, b) {
  return a - b;
}

/**
 * Group posts in reverse descenting order
 */
function groupPosts(posts, selector, keyformatter, pathmap, postmap) {
  var grouped = _.groupBy(posts, selector),
      keys = _.keys(grouped);

  keys.sort(numerically);
  keys.reverse();

  if (!_.isFunction(pathmap)) { pathmap = _.identity; }
  if (!_.isFunction(postmap)) { postmap = _.identity; }

  return _.map(keys, function(key) {
    return {
      key: keyformatter(key),
      path: pathmap(key) + '/',
      posts: postmap(grouped[key])
    };
  });
}

function groupByMonth(posts) {
  function selector(post) {
    return post.meta.date.month();
  }

  function formatter(key) {
    return moment({month:key}).format('MMMM');
  }

  function pathmap(key) {
    return moment({month:key}).format('MM');
  }

  return groupPosts(posts, selector, formatter, pathmap);
}

function groupByMonthAndYear(posts) {
  function selector(post) {
    return post.meta.date.year();
  }

  function formatter(key) {
    return key;
  }

  function postmap(posts) {
    return groupByMonth(posts);
  }

  return groupPosts(posts, selector, formatter, null, postmap);
}

/**
 * Front page
 */
function buildBlogFrontPage(jadeData, templateData) {
  var posts = this.getLatest(this.options.summaryCount),
      templatePath = this.options.summaryTemplate,
      templateContents = fs.readFileSync(templatePath, 'utf-8'),
      template = jade.compile(templateContents, _.extend({}, jadeData, {
        filename: templatePath
      }));

  var rendered = template(_.extend({}, templateData, {
    posts: posts
  }));

  var destFile = path.join(this.options.destDir, this.options.summary, 'index.html');
  mkdirp.sync(path.dirname(destFile));
  fs.writeFileSync(destFile, rendered);

  console.log('Wrote front page ' + destFile);

  // add to sitemap
  this.sitemap.add(toUrlPath(this.options.summary));
}

/**
 * Atom feed
 */
function buildAtomFeed() {
  var feed = new Feed({
    title: this.options.siteName,
    link: this.options.baseUrl,
    feed: this.options.feedUrl,
    copyright: moment().year() + ' Bryan Ross. All rights reserved.',
    author: _.clone(this.options.author)
  });

  _.each(this.posts, function(post) {
    feed.item({
      title: post.meta.title,
      link: post.meta.href,
      description: post.getTeaser(),
      date: moment(post.meta.date).toDate()
    });
  }, this);

  var xml = feed.render('atom-1.0');
  var feedFile = this.options.feedFile;
  fs.writeFileSync(feedFile, xml);
  console.log('Wrote feed file ' + feedFile);

  // Add to sitemap
  this.sitemap.add(toUrlPath(this.options.feedUrl));
}

/**
 * build sitemap page
 */
function buildSitemap() {
  var sitemapFile = path.join(this.options.destDir, 'sitemap.xml');
  fs.writeFileSync(sitemapFile, this.sitemap.toString());
  console.log('Write sitemap file ' + sitemapFile);
}

/**
 * Exported stuff
 */
 module.exports = Blog;
