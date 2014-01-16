// Load github repos
$.domReady(function() {

	$('label.sidebar-toggle').mousedown(function() {
		var ck = $('#sidebar-checkbox');
		if(ck.attr('checked')) {
			ck.removeAttr('checked');
		} else {
			ck.attr('checked', 'checked');
		}
	});

	// Externalize links
	var host = location.host;
	$('body a').each(function(a) {
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
