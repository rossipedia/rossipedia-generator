var contentLinks = document.querySelectorAll('.content a');

var host = location.host;

for(var i=0, l=contentLinks.length;i < l;++i) {
	var a = contentLinks[i];
	if (a.host != location.host) {
		a.setAttribute('target', '_blank');
	}
}

if(hljs && hljs.initHighlightingOnLoad) {
	hljs.initHighlightingOnLoad();
}
