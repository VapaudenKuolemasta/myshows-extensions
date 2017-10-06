// ==UserScript==
// @id              myshows
// @name            Myshows Extensions
// @version         3
// @description     Для каждой серии добавляет меню с ссылками на торенты и субтитры и пытается найти магнет.
// @include         https://myshows.me/*
// @match           https://myshows.me/*
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// ==/UserScript==
 
(function myshows_extension(){
    settings = {
        param : '720p',
        trackers : [
            {
                magnet : 'td > a:first-of-type',
                table : 'table#searchResult',
                name : '.detName a',
                size : 'font.detDesc',
                link : 'https://thepiratebay.org/search/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/0/7/',
                tr : 'tbody tr'
            }
        ]
    }

    dropDawnMenu = {

        options : [
            {
                link : 'https://thepiratebay.org/search/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/0/7/',
                desc : 'Искать %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% %_REQUEST_PARAM_% на ThePirateBay',
                icon : 'https://thepiratebay.org/static/img/tpblogo_sm_ny.gif'
            },
            {
                link : 'http://www.addic7ed.com/search.php?search=%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/',
                desc : 'Искать субтитры к %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% на Addic7ed',
                icon : 'http://cdn.addic7ed.com/favicon.ico'
            },
            {
                link : settings.trackers[0].link,
                desc : 'Ищу магнет для %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_%',
                icon : '/shared/img/vfs/ajax-loader.gif',
                data : {
                    icon_t : 'data:image/gif;base64,R0lGODlhDAAMALMPAOXl5ewvErW1tebm5oocDkVFRePj47a2ts0WAOTk5MwVAIkcDesuEs0VAEZGRv///yH5BAEAAA8ALAAAAAAMAAwAAARB8MnnqpuzroZYzQvSNMroUeFIjornbK1mVkRzUgQSyPfbFi/dBRdzCAyJoTFhcBQOiYHyAABUDsiCxAFNWj6UbwQAOw==',
                    icon_f : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALAQMAAACTYuVlAAAABlBMVEX/////AP/GWAgeAAAAAXRSTlMAQObYZgAAACRJREFUCNdjkGdgsG9g0GtgsG4AMUQZGO4nMDx4wAAUTzgARAB1OAh6LxmZMAAAAABJRU5ErkJggg==',
                }
            }
        ],

        constList : [
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

        closest : function( startElem, destElem ){
            while( !startElem.matches(destElem) ){
                startElem = startElem.parentElement;
            }
            return startElem;
        },

        getMenuDummy : function(){
            var menu = '<div class="buttonPopup _download _compact red"><ul>';
            for( var i=0; i<this.options.length; i++ ){
                var opt = this.options[i];
                menu += ''+
                    '<li><a target="_blank" href="'+opt.link+'">'+
                        '<img alt="img" src="'+opt.icon+'">'+opt.desc+
                    '</a></li>';
            }
            menu += '</ul></div>';
            return menu;
        },

        getShowMenu : function( listElement ){
            var menu = this.getMenuDummy();
            var data = this.getShowData(listElement);

            for( var i=0; i<this.constList.length; i++) {
                menu = menu.replace(new RegExp(this.constList[i], 'g'), data[i]);
            }
            return menu;
        },

        getShowData : function( listElement ){
            var showId = this.closest( listElement, '[data-show-id]' ).getAttribute('data-show-id');

            var serial_name = document.getElementById('s'+showId).children[0].children[1].textContent;
            var serial_name_rus = document.getElementById('s'+showId).children[0].children[0].textContent;

            var data = listElement.childNodes[1].textContent.split('x');
            return [
                (serial_name==''?serial_name_rus:serial_name),
                serial_name_rus,
                data[0],
                (data[0]>9?data[0]:'0'+data[0]),
                data[1],
                (data[1]>9?data[1]:'0'+data[1]),
                settings.param
            ];
        },

        add : function(){
            var list = document.querySelectorAll('.seasonBlockBody > table > tbody > tr');

            for( var i=0; i<list.length; i++ ){
                var td = document.createElement('td');
                td.innerHTML = this.getShowMenu( list[i] );
                list[i].appendChild(td);
            }

            GM_addStyle( this.style );
        },
    }

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
                value = +res[1] * ( (/(Gi?B)/).exec( res[2] ) ? 1000 : ( (/(Ki?B)/).exec( res[2] ) ? 0.001 : 1 ) );
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

        error : function( a, text ){
            a.childNodes[0].setAttribute('src', settings.getMenuObjById( +li.getAttribute('data-menu-id') ).data.icon_f );
            a.childNodes[1].textContent = text;
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

        getMagnets : function(){
            var list = document.querySelectorAll('.seasonBlockBody > table > tbody > tr');
            this.list = [].slice.call(list);

            for( var i=0; i<1; i++ ){
                this.getPage();
            }
        }
    }

    dropDawnMenu.add();
    // ajaxHandler.getMagnets();

})();
