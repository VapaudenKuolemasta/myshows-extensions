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
		},

		getVar : function( param ){
			if( this.ls.getItem( param ) === undefined || this.ls.getItem( param ) === null ){
				this.ls.setItem( param , this.defaultValues[ param ] );
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
		}
	}

	// var ll = settings.getVarsList()
	// console.info( ll.threads );
	
	queue = {
		2677896 : 'Community+s06e09',
	}

	ajaxHandler = {

		list : queue,

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
