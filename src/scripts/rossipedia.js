var contentLinks = document.querySelectorAll('.content a');
for(var i=0, l=contentLinks.length;i < l;++i) {
	var a = contentLinks[i];
	var href = a.getAttribute('href');
	if (!/^http:\/\/(www\.)?rossipedia.com/.test(href)) {
		a.setAttribute('target', '_blank');
	}
}

if(hljs && hljs.initHighlightingOnLoad) {
	hljs.initHighlightingOnLoad();
}
