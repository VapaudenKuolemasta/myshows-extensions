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

	var episodesList = document.querySelectorAll('.seasonBlockBody > table > tbody > tr');

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
				{
					id : 3,
					status : 1,
					name : 'Kickass Torrents',
					href : 'https://kat.cr/usearch/%_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_%/',
					desc : 'Искать субтитры к %_SERIAL_NAME_% %_SEASON_EPISODE_% на Addic7ed',
					icon : 'https://kastatic.com/images/favicon.ico',
					data : {
						desc_t : 'Нашел',
						desc_f : 'Не нашел',
						icon_t : 'data:image/gif;base64,R0lGODlhDAAMALMPAOXl5ewvErW1tebm5oocDkVFRePj47a2ts0WAOTk5MwVAIkcDesuEs0VAEZGRv///yH5BAEAAA8ALAAAAAAMAAwAAARB8MnnqpuzroZYzQvSNMroUeFIjornbK1mVkRzUgQSyPfbFi/dBRdzCAyJoTFhcBQOiYHyAABUDsiCxAFNWj6UbwQAOw==',
						icon_f : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALAQMAAACTYuVlAAAABlBMVEX/////AP/GWAgeAAAAAXRSTlMAQObYZgAAACRJREFUCNdjkGdgsG9g0GtgsG4AMUQZGO4nMDx4wAAUTzgARAB1OAh6LxmZMAAAAABJRU5ErkJggg==',
					}
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
			value = typeof value == 'object' ? JSON.stringify(value) : value;
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

	dropDawnMenu = {
		const_list : [ 
			"%_SERIAL_NAME_%",
			"%_SERIAL_NAME_RUS_%",
			"%_SEASON_%",
			"%_SEASON_0_%",
			"%_EPISODE_%",
			"%_EPISODE_0_%",
			"%_REQUEST_PARAM_%"
		],

		style : ''+			
			'.buttonPopup.red img{padding-right:5px;height:16px;}'+
			'.buttonPopup.red{background-color:red;}'+
			'.seasonBlockBody td:last-child{width:24px;padding:0px;}'+
			'',

		replace : function(search, replace, subject) {
			for(var i=0; i<search.length; i++) {
				subject = subject.replace(new RegExp(search[i], 'g'), replace[i]);
			}
			return subject;
		},

		menuHtml : function( menu ){
			var tdInnerHtml = '<div class="buttonPopup _download _compact red"><ul>';
			for( i=0; i<menu.length; i++ ){
				var obj = menu[i];
				mgnt = obj.data !== undefined ? ' data-desc_t="'+obj.data.desc_t+'" data-desc_f="'+obj.data.desc_f+'" data-icon_t="'+obj.data.icon_t+'" data-icon_f="'+obj.data.icon_f+'" ' : '';
				tdInnerHtml += '<li><a target="_blank" href="'+(obj.href)+'"><img '+mgnt+'alt="img" src="'+obj.icon+'">'+(obj.desc)+'</a></li>';
			}
			tdInnerHtml += '</ul></div>';
			return tdInnerHtml;
		},

		render : function( html, listElement ){
			var showId = listElement;
			while( !showId.hasAttribute('data-show-id') ){
				showId = showId.parentElement;
			}
			showId = showId.getAttribute('data-show-id');

			var serial_name = document.getElementById('s'+showId).children[0].children[1].textContent;
			var serial_name_rus = document.getElementById('s'+showId).children[0].children[0].textContent;

			var tmp = listElement.childNodes[1].textContent.split('x');				
			var replace = [ serial_name==''?serial_name_rus:serial_name, serial_name_rus, tmp[0], tmp[0]>9?tmp[0]:'0'+tmp[0], tmp[1], tmp[0]>9?tmp[0]:'0'+tmp[0], settings.getVar('param') ]; 

			return this.replace( this.const_list, replace, html ); ;
		},

		run : function( list ){
			var tdInnerHtml = this.menuHtml(typeof settings.getVar('hrefList')=='object'?settings.getVar('hrefList'):JSON.parse(settings.getVar('hrefList')));
			for( i=0; i<list.length; i++ ){
				var td = document.createElement('td');
				td.innerHTML = this.render( tdInnerHtml, list[i] ); 
				list[i].appendChild(td);
			}
			GM_addStyle( this.style );
		},
	}

	dropDawnMenu.run(episodesList);


	ajaxHandler = {

		list : {}, // заменить на инит

		getPage : function( episode ){
			GM_xmlhttpRequest({
				method : "GET",
				url : 'https://kat.cr/usearch/'+this.list[ episode ],
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
