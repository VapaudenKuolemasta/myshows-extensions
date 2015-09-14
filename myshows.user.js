// ==UserScript==
// @id 				myshows
// @name 			Myshows Extentions
// @version 		2.0
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

		currentValues : {},

		defaultValues : {
			prior : 'size',
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
			if( this.currentValues[ param ] === undefined || this.currentValues[ param ] === null ){
				if( this.ls.getItem( param ) === undefined || this.ls.getItem( param ) === null ){
					this.currentValues[ param ] = this.defaultValues[ param ];
				}else{
					this.currentValues[ param ] = typeof this.defaultValues[ param ]=='object'?JSON.parse(this.ls.getItem( param )):this.ls.getItem( param );
				}
			}
			return this.currentValues[ param ];
		},

		setVar : function( param, value ){
			this.currentValues[ param ] = value;
			value = typeof value == 'object' ? JSON.stringify(value) : value;
			this.ls.setItem( param , value );
		},

		getMenuObjById : function( menuId ){
			var list = this.getVar('hrefList');
			for(var t=0; t<list.length; t++ ){
				if( list[t].id == +menuId ){
					return list[t];
				}
			}
			return false;
		},
	}
	// console.info(settings.getMenuObjById( '2' ));


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
			for( var i=0; i<search.length; i++) {
				subject = subject.replace(new RegExp(search[i], 'g'), replace[i]);
			}
			return subject;
		},

		menuHtml : function( menu ){
			var tdInnerHtml = '<div class="buttonPopup _download _compact red"><ul>';
			for( var i=0; i<menu.length; i++ ){
				var obj = menu[i];
				tdInnerHtml += '<li data-menu-id="'+obj.id+'"><a target="_blank" href="'+obj.href+'"><img alt="img" src="'+obj.icon+'">'+obj.desc+'</a></li>';
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
			var tdInnerHtml = this.menuHtml( settings.getVar('hrefList') );
			for( var i=0; i<list.length; i++ ){
				var td = document.createElement('td');
				td.innerHTML = this.render( tdInnerHtml, list[i] ); 
				list[i].appendChild(td);
			}
			GM_addStyle( this.style );
		},
	}
	dropDawnMenu.run(episodesList);


	ajaxHandler = {

		prepare : function( value ){
			if( settings.getVar('prior') == 'size' ){
				var res = (/(\d+\.\d+)\s+([MKG]B)/).exec( value );
				if( null == res ) return 0;
				value = +res[1] * ( res[2] == 'GB' ? 1000 : ( res[2] == 'GB' ? 0.001 : 1 ) );
			}
			return value;
		},

		parse : function( nodeList ){
			var kat = {
				magnet : 'div.iaconbox a:nth-child(4)',
				name : '.cellMainLink',
				size : 'td:nth-child(2)',
				seed : 'td:nth-child(5)',
			}

			var tr = nodeList.querySelectorAll('tr:not(.firstr)');
			var tmp = tr[0];
			console.info( this.prepare( tmp.querySelector( kat['size'] ).textContent ) );
			for ( var i=1; i<tr.length; i++ ) {
			// 	if( this.prepare( tmp.querySelector( kat[ settings.getVar('prior') ] ) )<this.prepare( tr[i].querySelector( kat[ settings.getVar('prior') ] ) ) ){

			// 	}

			};
		},

		getPage : function( li, data ){
			var _this = this;
			GM_xmlhttpRequest({
				method : "GET",
				url : li.children[0].getAttribute('href'),
				responseType : 'document',
				onload : function( msg ){
					// console.info(msg.responseXML);
					if( msg.responseXML !== null ){
						_this.parse( msg.responseXML.documentElement.querySelector('.data') );
					}
				}
			});
		},

		run : function( list, threadsCount ){
			for( var i=0; i<list.length; i++ ){
				var li = list[i].querySelectorAll('.buttonPopup.red li');
				for( var j=0; j<li.length; j++ ){
					var dt = settings.getMenuObjById( +li[j].getAttribute('data-menu-id') );
					if( dt.data !== undefined ){
						this.getPage( li[j], dt );
						threadsCount--;
						continue;
					}
				}
				if( threadsCount == 0 ){
					break;
				}
			}
		}
	}
	ajaxHandler.run(episodesList, settings.getVar('threads'));

})();
