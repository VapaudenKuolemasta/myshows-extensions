// ==UserScript==
// @id 				myshows
// @name 			Myshows Extentions
// @version 		1.0
// @description 	Ссылки
// @include 		http://myshows.me/*
// @match 			http://myshows.me/*
// @grant 			GM_addStyle
// @grant 			GM_xmlhttpRequest
// ==/UserScript==
 
(function myshows_extention(){

	settings = {
		ls : window.localStorage,

		defaultValues : {
			param : '720p',
			threads : 5,
			hrefList : [
				{
					id : 1,
					status : 1,
					name : 'ThePirateBay',
					href : 'https://piratebay.to/search/%_SERIAL_NAME_%+%_SEASON_EPISODE_%+%_REQUEST_PARAM_%/0/3/0',
					desc : 'Искать %_SERIAL_NAME_% %_SEASON_EPISODE_% %_REQUEST_PARAM_% на ThePirateBay',
					icon : 'https://piratebay.to/static/img/tpblogo_sm_ny.gif',
				},
				{
					id : 2,
					status : 1,
					name : 'Addic7ed',
					href : 'http://www.addic7ed.com/search.php?search=%_SERIAL_NAME_%+%_SEASON_EPISODE_%',
					desc : 'Искать субтитры к %_SERIAL_NAME_% %_SEASON_EPISODE_% на Addic7ed',
					icon : 'http://cdn.addic7ed.com/favicon.ico',
				},
			],
		},

		getVar : function( param ){
			if( this.ls.getItem( param ) === undefined || this.ls.getItem( param ) === null ){
				return this.defaultValues[ param ];
			}
			return this.ls.getItem( param );
		},

		setVar : function( param, value ){
			this.ls.setItem( param , value );
		},

		getVarsList : function(){
			var list = {}
			for( param in this.defaultValues){
				list[ param ] = this.getVar( param );
			}
			return list;
		},

		setDefaults : function(){
			for( param in this.defaultValues){
				this.ls.setItem( param , this.defaultValues[ param ] );
			}
		},
	}

	function getEpisodesList(){
		var list = document.querySelectorAll('.seasonBlockBody > table > tbody > tr');

		var menu = settings.getVar('hrefList');
		console.info(menu);

		var tdInnerHtml = '<div class="buttonPopup _download _compact red"><ul>';
		for( i=0; i<menu.length; i++ ){
			var obj = menu[i];
			tdInnerHtml += '<li><a target="_blank" href="'+(obj.href)+'"><img alt="img" class="fv_icon" src="'+obj.icon+'">'+(obj.desc)+'</a></li>';
		}
		tdInnerHtml += '</ul></div>';


		for( i=0; i<list.length; i++ ){
			var td = document.createElement('td');
			td.innerHTML = tdInnerHtml
			list[i].appendChild(td);
		}
	}
	getEpisodesList();


	// var ll = settings.getVarsList()
	// console.info( ll.threads );

	queue = {
		2677896 : 'Community+s06e09',
	}

	ajaxHandler = {

		list : queue, // заменить на инит

		getPage : function( episode ){
			GM_xmlhttpRequest({
				method : "GET",
				url : 'https://kickass.to/usearch/'+this.list[ episode ],
				onload : function( msg ){
					if( msg ){
						console.info(msg);
					}
				}
			});
		},

		run : function(){
			for( id in this.list ){
				this.getPage( id );
			}
		}
	}

	ajaxHandler.run();


})();
