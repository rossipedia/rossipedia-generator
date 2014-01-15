// Load github repos
$.domReady(function() {

	var contentLinks = document.querySelectorAll('body a');

	// Externalize links
	var host = location.host;
	for(var i=0, l=contentLinks.length;i < l;++i) {
		var a = contentLinks[i];
		if (a.host && a.host != location.host) {
			a.setAttribute('target', '_blank');
		}
	}

	// Initialize highlight js
	if(hljs && hljs.initHighlightingOnLoad) {
		hljs.initHighlightingOnLoad();
	}

	// Load github repos
	github.showRepos({
			user: 'rossipedia',
			count: 5,
			skip_forks: true,
			target: '#gh_repos'
	});
});
