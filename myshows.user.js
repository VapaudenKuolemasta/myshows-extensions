// ==UserScript==
// @id 				myshows
// @name 			Myshows Extentions
// @version 		2.3
// @description 	Для каждой серии добавляет меню с ссылками на торенты и субтитры и пытается найти магнет.
// @include 		https://myshows.me/*
// @match 			https://myshows.me/*
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
					href : 'https://piratebay.to/search/0/800/0/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/0/DSeeder/1/',
					desc : 'Искать %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% %_REQUEST_PARAM_% на ThePirateBay',
					icon : 'https://piratebay.to/static/img/tpblogo_sm_ny.gif',
				},
				{
					id : 2,
					status : 1,
					name : 'Addic7ed',
					href : 'http://www.addic7ed.com/search.php?search=%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/',
					desc : 'Искать субтитры к %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% на Addic7ed',
					icon : 'http://cdn.addic7ed.com/favicon.ico',
				},
				{
					id : 3,
					status : 1,
					name : 'Kickass Torrents',
					href : 'https://kat.cr/usearch/%_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/',
					desc : 'Искать %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% на Kickass Torrents',
					icon : 'https://kastatic.com/images/favicon.ico',
				},
				{
					id : 4,
					status : 1,
					name : 'New-rutor',
					href : 'http://new-rutor.org/search/%_SERIAL_NAME_%+%_REQUEST_PARAM_%/',
					desc : 'Искать %_SERIAL_NAME_% на New-rutor',
					icon : 'http://new-rutor.org/parse/s.rutor.org/favicon.ico',
				},
				{
					id : 5,
					status : 1,
					name : 'Magnet Finder',
					desc : 'Ищу магнет для %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_%',
					icon : '/shared/img/vfs/ajax-loader.gif',
					data : {
						icon_t : 'data:image/gif;base64,R0lGODlhDAAMALMPAOXl5ewvErW1tebm5oocDkVFRePj47a2ts0WAOTk5MwVAIkcDesuEs0VAEZGRv///yH5BAEAAA8ALAAAAAAMAAwAAARB8MnnqpuzroZYzQvSNMroUeFIjornbK1mVkRzUgQSyPfbFi/dBRdzCAyJoTFhcBQOiYHyAABUDsiCxAFNWj6UbwQAOw==',
						icon_f : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALAQMAAACTYuVlAAAABlBMVEX/////AP/GWAgeAAAAAXRSTlMAQObYZgAAACRJREFUCNdjkGdgsG9g0GtgsG4AMUQZGO4nMDx4wAAUTzgARAB1OAh6LxmZMAAAAABJRU5ErkJggg==',
					}
				},
			],
			trackers : {
				kat : {
					magnet : 'div.iaconbox a:nth-child(4)',
					table : '.data',
					name : '.cellMainLink',
					size : 'td:nth-child(2)',
					seed : 'td:nth-child(5)',
					href : 'https://kat.cr/usearch/%_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% %_REQUEST_PARAM_%/',
					tr : 'tr:not(.firstr)',
				},
                tpb : {
                    magnet : 'td > a:first-of-type',
                    table : 'table#searchResult',
                    name : '.detName a',
                    size : 'font.detDesc',
                    href : 'https://thepiratebay.cr/search/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/0/7/',
                    tr : 'tbody tr',
                },
			},
            curTracker : 'kat',
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

		replace : function( search, replace, subject ) {
			for( var i=0; i<search.length; i++) {
				subject = subject.replace(new RegExp(search[i], 'g'), replace[i]);
			}
			return subject;
		},

		closest : function( startElem, destElem ){
			while( !startElem.matches(destElem) ){
				startElem = startElem.parentElement;
			}
			return startElem;
		},

		menuHtml : function( menu ){
			var tdInnerHtml = '<div class="buttonPopup _download _compact red"><ul>';
			for( var i=0; i<menu.length; i++ ){
				var obj = menu[i];
				if( obj.status != 0 ){
					// Add data attrs with trackers info for magnet links 
					var trackerData = ( obj.data!==undefined?'data-cur-tracker="'+settings.getVar('curTracker')+'" data-used-trackers="'+settings.getVar('curTracker')+'"':'' );
					// Choose href attribute wisely
					var trackerHref = ( obj.href!==undefined?obj.href:settings.getVar('trackers')[ settings.getVar('curTracker') ].href );

					tdInnerHtml += '<li '+trackerData+' data-menu-id="'+obj.id+'"><a target="_blank" href="'+trackerHref+'"><img alt="img" src="'+obj.icon+'">'+obj.desc+'</a></li>';
				}
			}
			tdInnerHtml += '</ul></div>';
			return tdInnerHtml;
		},

		render : function( html, listElement ){
			showId = this.closest( listElement, '[data-show-id]' ).getAttribute('data-show-id');

			var serial_name = document.getElementById('s'+showId).children[0].children[1].textContent;
			var serial_name_rus = document.getElementById('s'+showId).children[0].children[0].textContent;

			var tmp = listElement.childNodes[1].textContent.split('x');
			var replace = [ (serial_name==''?serial_name_rus:serial_name), serial_name_rus, tmp[0], (tmp[0]>9?tmp[0]:'0'+tmp[0]), tmp[1], (tmp[1]>9?tmp[1]:'0'+tmp[1]), settings.getVar('param') ]; 

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

		haveVisible : true,

		list : [],

		getNextTr : function(){
			if( this.haveVisible ){
				for( var i=0; i<this.list.length; i++ ){
					if( +dropDawnMenu.closest(this.list[i], 'div.seasonBlockBody').offsetHeight !== 0 ){
						return this.list.splice(i,1)[0];
					}
				}
				this.haveVisible = false;
			};
			if( this.list.length > 0 ){
				return this.list.shift();
			}
			return false;
		},

		getLi : function(){
			if( ( tr = this.getNextTr() ) !== false ){ // tr - global ai-ai-ai
				var li = tr.querySelectorAll('.buttonPopup.red li');
				for( var i=0; i<li.length; i++ ){
					if( settings.getMenuObjById( +li[i].getAttribute('data-menu-id') ).data !== undefined ){
						return li[i];
					}
				}
			}
			return false;
		},

		prepare : function( value ){
			if( settings.getVar('prior') == 'size' ){
				var res = (/(\d+\.\d+).+([MKG]i?B)/).exec( value.outerHTML );
				if( null == res ){
					res = (/(\d+\.{0,1}\d{0,2}).+([MKG]i?B)/).exec( value.textContent );
				} 
				if( null == res ) return 0;
				value = +res[1] * ( res[2] == 'GB' ? 1000 : ( res[2] == 'KB' ? 0.001 : 1 ) );
			}
			return value;
		},

		parse : function( nodeList, tracker ){
			if( nodeList === null || nodeList === undefined ){
				return false;
			}
			// var tracker = settings.getVar('trackers')[ settings.getVar('curTracker') ];
			var tr = nodeList.querySelectorAll( tracker.tr );
			if( tr === null || tr === undefined || tr.length === 0 ){
				return false;
			}
			var tmp = tr[0]; 
			var t1 = this.prepare( tmp.querySelector( tracker[ settings.getVar('prior') ] ) );
			for ( var i=1; i<tr.length; i++ ) {
				var t2 = this.prepare( tr[i].querySelector( tracker[ settings.getVar('prior') ] ) );
				if( t1 < t2 ){
					tmp = tr[i];
					t1 = t2;
				}
			};
			return tmp;
		},

		hasNextTracker : function( a ){
			var arr = a.parentElement.getAttribute('data-used-trackers').split(',');
			for( tracker in settings.getVar('trackers') ){
				if( arr.indexOf( tracker ) === -1 ){
					a.parentElement.setAttribute('data-used-trackers', (a.parentElement.getAttribute('data-used-trackers')+','+tracker) );
					a.parentElement.setAttribute('data-cur-tracker', tracker );
					a.setAttribute('href', dropDawnMenu.render( settings.getVar('trackers')[ tracker ].href, dropDawnMenu.closest( a, 'tr' ) ) );
					this.haveVisible = true;
					this.list.push( dropDawnMenu.closest(a, 'tr') );
					return true;
				}
			}
			return false;
		},

		error : function( a, text ){
			if( !this.hasNextTracker( a ) ){
				a.childNodes[0].setAttribute('src', settings.getMenuObjById( +li.getAttribute('data-menu-id') ).data.icon_f );
				a.childNodes[1].textContent = text;
			}
		},

		getPage : function(){
			var _this = this;
			if( ( li = this.getLi() ) === false ){
				return false;
			}
			var a = li.children[0];
			var tracker = settings.getVar('trackers')[ a.parentElement.getAttribute('data-cur-tracker') ];
			GM_xmlhttpRequest({
				method : "GET",
				url : a.getAttribute('href'),
				responseType : 'document',
				timeout : 60*1000,
				onload : function( msg ){
					if( msg !== null && msg.responseXML !== null ){
						var tmp = _this.parse( msg.responseXML.documentElement.querySelector( tracker.table ), tracker );
						if( tmp !== false ){
							a.setAttribute('href', tmp.querySelector( tracker.magnet ) );
							a.childNodes[0].setAttribute('src', settings.getMenuObjById( +li.getAttribute('data-menu-id') ).data.icon_t );
							a.childNodes[1].textContent = '('+
								+_this.prepare( tmp.querySelector( tracker.size ) )+
								' MB) '+tmp.querySelector( tracker.name ).textContent;
						}else{
							_this.error(a, "Магнет не найден");
						}
					}else{
						_this.error(a, "Сайт вернул пустой ответ");
					}
					_this.getPage();
				},
				onerror : function(){
					_this.error(a, "Ошибка доступа к сайту");
				},
				ontimeout : function(){
					_this.error(a, "Время ожидания ответа сайта закончилось");
				},
			});
		},

		run : function( list ){
			this.list = [].slice.call(list);

			for( var i=0; i<1; i++ ){
				this.getPage();
			}
		}
	}
	ajaxHandler.run(episodesList);

})();
