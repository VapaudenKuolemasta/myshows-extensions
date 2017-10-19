// ==UserScript==
// @id              myshows
// @name            Myshows Extensions
// @version         4.0
// @description     Для каждой серии добавляет меню с ссылками на торенты и субтитры и пытается найти магнет.
// @include         https://myshows.me/*
// @match           https://myshows.me/*
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// ==/UserScript==

(function myshows_extension() {
    settings = {
        param: '720p',
        icon_t: 'data:image/gif;base64,R0lGODlhDAAMALMPAOXl5ewvErW1tebm5oocDkVFRePj47a2ts0WAOTk5MwVAIkcDesuEs0VAEZGRv///yH5BAEAAA8ALAAAAAAMAAwAAARB8MnnqpuzroZYzQvSNMroUeFIjornbK1mVkRzUgQSyPfbFi/dBRdzCAyJoTFhcBQOiYHyAABUDsiCxAFNWj6UbwQAOw==',
        icon_f: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALAQMAAACTYuVlAAAABlBMVEX/////AP/GWAgeAAAAAXRSTlMAQObYZgAAACRJREFUCNdjkGdgsG9g0GtgsG4AMUQZGO4nMDx4wAAUTzgARAB1OAh6LxmZMAAAAABJRU5ErkJggg==',

        trackers: [
            {
                table: 'table#searchResult',
                tr: 'tbody tr',
                magnet: 'td > a:first-of-type',
                name: '.detName a',
                size: 'font.detDesc',
                link: 'https://thepiratebay.org/search/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/0/7/'
            },
            {
                table: 'table.forum_header_border:last-of-type',
                tr: 'tbody tr.forum_header_border',
                magnet: 'a.magnet',
                name: 'a.epinfo',
                size: 'td.forum_thread_post:nth-of-type(4)',
                link: 'https://eztv.ag/search/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%'
            }
        ],

        constList: [
            "%_SERIAL_NAME_%",
            "%_SERIAL_NAME_RUS_%",
            "%_SEASON_%",
            "%_SEASON_0_%",
            "%_EPISODE_%",
            "%_EPISODE_0_%",
            "%_REQUEST_PARAM_%"
        ]
    };

    list = [].slice.call(document.querySelectorAll('.seasonBlockBody > table > tbody > tr'));

    dropDawnMenu = {

        options: [
            {
                link: 'https://thepiratebay.org/search/%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/0/7/',
                desc: 'Искать %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% %_REQUEST_PARAM_% на ThePirateBay',
                icon: 'https://thepiratebay.org/static/img/tpblogo_sm_ny.gif'
            },
            {
                link: 'http://www.addic7ed.com/search.php?search=%_SERIAL_NAME_%+s%_SEASON_0_%e%_EPISODE_0_%+%_REQUEST_PARAM_%/',
                desc: 'Искать субтитры к %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_% на Addic7ed',
                icon: 'http://cdn.addic7ed.com/favicon.ico'
            },
            {
                link: settings.trackers[0].link,
                desc: 'Ищу магнет для %_SERIAL_NAME_% s%_SEASON_0_%e%_EPISODE_0_%',
                icon: '/shared/img/vfs/ajax-loader.gif'
            }
        ],

        style: '' +
        '.buttonPopup.red a{padding-right: 25px;}' +
        '.buttonPopup.red img{padding-right:5px;height:16px;}' +
        '.buttonPopup.red{background-color:red;}' +
        '.seasonBlockBody td:last-child{width:24px;padding:0px;}' +
        '',

        closest: function (startElem, destElem) {
            while (!startElem.matches(destElem)) {
                startElem = startElem.parentElement;
            }
            return startElem;
        },

        getMenuDummy: function () {
            var menu = '<div class="buttonPopup _download _compact red"><ul>';
            for (var i = 0; i < this.options.length; i++) {
                var opt = this.options[i];
                menu += '' +
                    '<li><a target="_blank" href="' + opt.link + '">' +
                    '<img alt="img" src="' + opt.icon + '">' + opt.desc +
                    '</a></li>';
            }
            menu += '</ul></div>';
            return menu;
        },

        getShowMenu: function (listElement) {
            var menu = this.getMenuDummy();
            var data = this.getEpisodeData(listElement);

            for (var i = 0; i < settings.constList.length; i++) {
                menu = menu.replace(new RegExp(settings.constList[i], 'g'), data[i]);
            }
            return menu;
        },

        getEpisodeData: function (listElement) {
            var showId = this.closest(listElement, '[data-show-id]').getAttribute('data-show-id');

            var serial_name = document.getElementById('s' + showId).children[0].children[1].textContent;
            var serial_name_rus = document.getElementById('s' + showId).children[0].children[0].textContent;

            var data = listElement.childNodes[1].textContent.split('x');
            return [
                (serial_name === '' ? serial_name_rus : serial_name),
                serial_name_rus,
                data[0],
                (data[0] > 9 ? data[0] : '0' + data[0]),
                data[1],
                (data[1] > 9 ? data[1] : '0' + data[1]),
                settings.param
            ];
        },

        addDropDawnMenu: function () {
            for (var i = 0; i < list.length; i++) {
                var td = document.createElement('td');
                td.innerHTML = this.getShowMenu(list[i]);
                list[i].appendChild(td);
            }

            GM_addStyle(this.style);
        }
    };

    ajaxHandler = {
        Request: function () {

            if (!list.length) {
                return;
            }

            this.t_id = 0;
            this.tracker = settings.trackers[this.t_id];

            this.listElement = list[0];
            list.shift();

            this.send = function () {
                var _this = this;
                var showOption = this.listElement.lastChild.querySelector('li:last-child a');

                var url = this.tracker.link;
                var episodeData = dropDawnMenu.getEpisodeData(this.listElement);
                for (var i = 0; i < settings.constList.length; i++) {
                    url = url.replace(new RegExp(settings.constList[i], 'g'), episodeData[i]);
                }

                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    responseType: 'document',
                    timeout: 30 * 1000,

                    onload: function (msg) {
                        if (msg == null && msg.responseXML == null) {
                            _this.errorHandler(showOption, "Сайт вернул пустой ответ");
                            return
                        }

                        var magnetData = _this.getMagnetData(msg.responseXML);

                        if (magnetData === false) {
                            _this.errorHandler(showOption, "Магнет не найден");
                            return
                        }

                        _this.updateMenu(showOption, magnetData);

                        var request = new ajaxHandler.Request();
                        request.send();
                    },

                    onerror: function () {
                        _this.errorHandler(showOption, "Ошибка доступа к сайту");
                    },

                    ontimeout: function () {
                        _this.errorHandler(showOption, "Время ожидания ответа сайта закончилось");
                    }
                });
            };

            this.getSizeMB = function (value) {
                var res = (/(\d+\.\d+).+([MKG]i?B)/).exec(value);

                if (null == res) return 0;
                value =
                    +res[1] * ((/(Gi?B)/).exec(res[2]) ?
                        1000 :
                        (
                            (/(Ki?B)/).exec(res[2]) ?
                                0.001 :
                                1)
                    );

                return value;
            };

            this.errorHandler = function (a, text) {
                this.t_id++;
                this.tracker = settings.trackers[this.t_id];

                if (this.tracker) {
                    this.send();
                } else {
                    a.childNodes[0].setAttribute('src', settings.icon_f);
                    a.childNodes[1].textContent = text;

                    var request = new ajaxHandler.Request();
                    request.send();
                }
            };

            this.getMagnetData = function (data) {
                var nodeList = data.documentElement.querySelector(this.tracker.table);
                if (nodeList === null || nodeList === undefined) {
                    return false;
                }

                var rowList = nodeList.querySelectorAll(this.tracker.tr);
                if (rowList === null || rowList === undefined || rowList.length === 0) {
                    return false;
                }

                var magnetData = rowList[0];
                var curSize = 0;
                var maxSize = 0;

                for (var i = 0; i < rowList.length; i++) {
                    curSize = this.getSizeMB(rowList[i].querySelector(this.tracker.size).textContent);
                    if (maxSize < curSize) {
                        magnetData = rowList[i];
                        maxSize = curSize;
                    }
                }

                return magnetData;
            };

            this.updateMenu = function (showOption, magnetData) {
                var href = magnetData.querySelector(this.tracker.magnet);
                var name = magnetData.querySelector(this.tracker.name);
                var size = this.getSizeMB(magnetData.querySelector(this.tracker.size).textContent);

                showOption.setAttribute('href', href);
                showOption.childNodes[0].setAttribute('src', settings.icon_t);
                showOption.childNodes[1].textContent = '(' + size + ' MB) ' + name.textContent;
            };
        },

        getMagnetsLinks: function () {
            for (var i = 0; i < 1; i++) {
                var request = new this.Request();
                request.send();
            }
        }
    };

    dropDawnMenu.addDropDawnMenu();
    ajaxHandler.getMagnetsLinks();

})();
