var github = (function(){
  function escapeHtml(str) {
    return $('<div/>').text(str).html();
  }
  function render(target, repos){
    console.log(repos);

    var i = 0, fragment = '', t = $(target)[0];
		var desc;

    for(i = 0; i < repos.length; i++) {
			desc = escapeHtml(repos[i].description||'');
      fragment += '<li><a href="'+repos[i].html_url+'" title="' + desc + '">'+repos[i].name+'<br />' +
										'<span class="desc">'+desc+'</span></li>';
    }
    t.innerHTML = fragment;
  }
  return {
    showRepos: function(options){
      var repos = $.cookie('gh:repos');
      if(repos != null) {
        render(options.target, repos);
        return;
      }

      $.ajax.compat({
          url: "https://api.github.com/users/"+options.user+"/repos?sort=pushed&callback=?"
        , dataType: 'jsonp'
        , error: function (err) {
						$(options.target + ' li.loading').addClass('error').text("Error loading feed");
						$(options.target).hide();
					}
        , success: function(data) {
          if (!data || !data.data) { return; }
					if (data.meta && data.meta.status !== 200) {
						$(options.target + ' li.loading').addClass('error').html("<a>Error loading repos</a>");
						$(options.target).hide();
						return;
					}

          var query = $.chain(data.data)
                       .reject(function(item) {
                         return options.skip_forks && item.fork;
                       })
                       .map(function(item) {
                         var min = $.pick(item, 'html_url', 'description', 'name');
                         min.description = min.description
                            ? min.description.substr(0, 100)
                            : null;
                         return min;
                       });

          if(options.count) {
            query = query.first(options.count);
          }
          repos = query.value();

          // cache for 1 hour
          $.cookie('gh:repos', repos, {expires:60*60});

          render(options.target, repos);
        }
      });
    }
  };
})();
