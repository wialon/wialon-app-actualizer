// Global event handlers
var callbacks = {};
// Execute callback
function exec_callback(id) {
	if (!callbacks[id])
		return;
	callbacks[id].call();
}

function getHtmlParameter (name) {
	if (!name) {
		return null;
	}
	var pairs = decodeURIComponent(document.location.search.substr(1)).split("&");
	for (var i = 0; i < pairs.length; i++) {
		var pair = pairs[i].split("=");
		if (pair[0] === name) {
			pair.splice(0, 1);
			return pair.join("=");
		}
	}
	return null;
}

(function( $ ) {
	var resources = [];
	var units = [];
	var formatTime = ''; 

	/// IE check
	function ie() {
		return (navigator.appVersion.indexOf("MSIE 6") != -1 || navigator.appVersion.indexOf("MSIE 7") != -1 || navigator.appVersion.indexOf("MSIE 8") != -1);
	}

	/// Wrap callback
	function wrap_callback(callback) {
		var id = (new Date()).getTime();
		callbacks[id] = callback;
		return id;
	}
	/// Fetch varable from 'GET' request
	function get_html_var(name) {
		if (!name)
			return null;
		var pairs = decodeURIComponent(document.location.search.substr(1)).split("&");
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=");
			if (pair[0] == name) {
				pair.splice(0, 1);
				return pair.join("=");
			}
		}
		return null;
	}
	/// Load script
	function load_script(src, callback) {
		var script = document.createElement("script");
		script.setAttribute("type","text/javascript");
		script.setAttribute("charset","UTF-8");
		script.setAttribute("src", src);
		if (callback && typeof callback == "function") {
			var id = wrap_callback(callback);
			if (ie())
				script.onreadystatechange = function () {
					if (this.readyState == 'complete' || this.readyState == 'loaded')
						callback();
				}
			else
				script.setAttribute("onLoad", "exec_callback(" + wrap_callback(callback) + ")");
		}
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	/// Login result
	function login(code) {
		if (code) {
			alert("Login error");
			return;
		}

		loadUnits();
	}

	function loadUnits (isrefresh) {
		isrefresh = isrefresh || false;
		var spec_unit = {itemsType: "avl_unit", propName: "sys_name", propValueMask: "*", sortType: "sys_last_message"};
		var flags_unit = wialon.item.Item.dataFlag.base | 1024;
		wialon.core.Session.getInstance().searchItems(spec_unit, true, flags_unit, 0, 0, function (code, data) {

            // get string of time format
            wialon.core.Session.getInstance().getCurrUser().getLocale(function(arg, locale){

                var fd = (locale && locale.fd) ? locale.fd : '%Y-%m-%E_%H:%M:%S'; // check for users who have never changed the parameters of the metric

                formatTime = wialon.util.DateTime.convertFormat(fd,true).replace(/_/, '&nbsp;&nbsp;').replace(/ /, '&nbsp;');
	            setLocaleDateTime();

                if (code || !data) {
                    alert("List of units empty.");
                } else if (!data.items || data.items.length < 1) {
                    alert("List of units empty.");
                } else {
                    units = data.items;
                    units.sort(minmaxmes);
                    var curTime = (new Date().getTime())/1000;
                    for(var i = 0;i<units.length;i++){
                        units[i].days = (units[i].getLastMessage())?parseInt((curTime-units[i].getLastMessage().t)/(60*60*24)):0;
                    }

                    if (!isrefresh) {
                        $("#messages-col").toggleClass("desc");
                        $("#paginated-table").dividedByPages(units, fill_table);
                    } else {
                        // $("#paginated-table").trigger("refresh", {data: units});
                        daysFilter(units, parseInt($("#days").text() || 0));
                    }
                }
            });
		});
	}

	/// Init SDK
	function init_sdk() {
		var url = get_html_var("baseUrl");
		if (!url)
			url = get_html_var("hostUrl");
		if (!url)
			return;

		var user = get_html_var("user");
		user = (user) ? user : "";
		// if(!user)
			// return null;
		
		wialon.core.Session.getInstance().initSession(url, "", 0x800);
		wialon.core.Session.getInstance().duplicate(get_html_var("sid"), user, true, login);

	}
	function ltranslate () {
		$("#app-name").html($.localise.tr("Actualizer"));
		$("#units-col").html($.localise.tr("Unit"));
		$("#messages-col").html($.localise.tr("Last Message"));
		$("#page").html($.localise.tr("Page"));
		$("#of").html($.localise.tr("of"));
		$("#refresh-btn").prop("alt",$.localise.tr("Refresh"));
		$("#days-head").text($.localise.tr("Days"));
	}
	function daysFilter (units, days) {
		var tmpunits=[];
		for(var i=0;i<units.length;i++){
			if(units[i].days >= days){
				tmpunits.push(units[i]);
			}
		}
		$("#paginated-table").trigger("refresh", {data: tmpunits});
	}
	/// We are ready now
	window.onload = function() {
		var url = get_html_var("baseUrl");
		if (!url)
			url = get_html_var("hostUrl")
		if (!url)
			return;
		url += "/wsdk/script/wialon.js" ;
		load_script(url, init_sdk);

		var lang = getHtmlParameter("lang");
		if ((!lang) || ($.inArray(lang, ["en", "ru"]) == -1))
			lang = "en";
		$.localise('lang/', {language: lang});
		ltranslate();

		$("#slider-button").click(function(){
			$('#days-filter').toggle();
		});
		$("body").click(function(ev){
			if($(ev.target).attr("id") != "slider-button" && $(ev.target).attr("id") != "days-filter"){
				$('#days-filter').hide();
			}
		});
		$("#units-col").click(sortByNames);
		$("#refresh-btn").click(function(){
			$("#units-col").removeClass('desc');
			$("#messages-col").addClass("desc");
			loadUnits(true);
		});
		$("#messages-col").click(sortByMessages)
		$("#nrowonpage").change(change_nrowonpage);
		$("#page_selector").keypress(change_npage);
		$('#table-wrap').css({height:($(window).height()-$("#header").height()-$("#table-footer").height())});
		var days = $('#days');
		var days_head = $('#days-head');
		var days_text = days_head.text();
		$( "#slider" ).slider({
			min:0,
			max:100,
			values: [ 0 ],
			orientation: "vertical",
			change: function(ev, ui){

			},
			slide: function( ev, ui ) {
				days.text(ui.value?ui.value:'');
				if(ui.value){
					days_head.text(days_head.text().toLowerCase());
					days.text(ui.value);
				}else{
					days_head.text(days_text);
					days.text('');
				}
				daysFilter(units, ui.value)
			}
		});

	}

	function minmaxmes(a,b) {
		var desc = $("#messages-col").hasClass("desc")?1:-1;

		if(!a.getLastMessage()){
			return 1*desc;
		}
		if(!b.getLastMessage()){
			return -1*desc;
		}
		if (a.getLastMessage().t < b.getLastMessage().t){
			return -1*desc;
		}
		if (a.getLastMessage().t > b.getLastMessage().t){
			return 1*desc;
		}
		return 0;
	}
	function nameSort (a,b) {
		var desc = $("#units-col").hasClass("desc")?1:-1;

		if (a.getName().toLowerCase() < b.getName().toLowerCase()){
			return -1*desc;
		}
		if (a.getName().toLowerCase() > b.getName().toLowerCase()){
			return 1*desc;
		}
		return 0;
	}

	function sortByNames(){
		units.sort(nameSort);
		$("#messages-col").removeClass("desc");
		$("#units-col").toggleClass("desc");
		daysFilter(units, parseInt($("#days").text() || 0));
		// $("#paginated-table").trigger("refresh", {data: units});
	}

	function sortByMessages(){
		units.sort(minmaxmes);
		$("#units-col").removeClass('desc');
		$("#messages-col").toggleClass("desc");
		daysFilter(units, parseInt($("#days").text() || 0));
		// $("#paginated-table").trigger("refresh", {data: units});
	}

	window.onresize = function(event) {
		$('#table-wrap').css({height:($(window).height()-$("#header").height()-$("#table-footer").height())});
	}

	function change_nrowonpage () {
		var table = $("#paginated-table");
		table.trigger("changerowonpage", $(this).val());
	}

	function change_npage (event) {
		if (event.which === 13) {
			var table = $("#paginated-table");
			table.trigger("changepage", $(this).val());
		}
	}

	function fill_table (sindex, data) {
		for (var i=0, len=data.length; i<len; i++) {
			var unit = data[i];
			if (!unit) {
				continue;
			}
			sindex = _unit_to_table(sindex, unit);
		}
	}

	function _unit_to_table (sindex, item) {
		var row = "<tr id='unit_" + item.getId() + "' class='" + (sindex%2?'odd':'') + "'><td><span class='number'>" + (sindex++ +1) + ".</span></td><td><span class='unitName'>" + item.getName() + "</span></td><td>" + ((item.getLastMessage())?(wialon.util.DateTime.formatTime(item.getLastMessage().t, 0, formatTime)):('<span class="no-mess">' + $.localise.tr('No messages') + '</span>')) + "</td><td><span class='cnt'>" + (item.days?item.days:(item.getLastMessage()?0:'-')) + "</span></td></tr>";
		$("#paginated-table").children("tbody").append(row);
		return sindex;
	}


	/// set Locale Date Time
	function setLocaleDateTime () {
	    var days = [
	            $.localise.tr("Sunday"),
	            $.localise.tr("Monday"),
	            $.localise.tr("Tuesday"),
	            $.localise.tr("Wednesday"),
	            $.localise.tr("Thursday"),
	            $.localise.tr("Friday"),
	            $.localise.tr("Saturday")
	        ],
	        months = [
	            $.localise.tr("January"),
	            $.localise.tr("February"),
	            $.localise.tr("March"),
	            $.localise.tr("April"),
	            $.localise.tr("May"),
	            $.localise.tr("June"),
	            $.localise.tr("July"),
	            $.localise.tr("August"),
	            $.localise.tr("September"),
	            $.localise.tr("October"),
	            $.localise.tr("November"),
	            $.localise.tr("December")
	        ],
	        days_abbrev = [
	            $.localise.tr("Sun"),
	            $.localise.tr("Mon"),
	            $.localise.tr("Tue"),
	            $.localise.tr("Wed"),
	            $.localise.tr("Thu"),
	            $.localise.tr("Fri"),
	            $.localise.tr("Sat")
	        ],
	        months_abbrev = [
	            $.localise.tr("Jan"),
	            $.localise.tr("Feb"),
	            $.localise.tr("Mar"),
	            $.localise.tr("Apr"),
	            $.localise.tr("May"),
	            $.localise.tr("Jun"),
	            $.localise.tr("Jul"),
	            $.localise.tr("Aug"),
	            $.localise.tr("Sep"),
	            $.localise.tr("Oct"),
	            $.localise.tr("Nov"),
	            $.localise.tr("Dec")
	        ];
	    wialon.util.DateTime.setLocale(days, months, days_abbrev, months_abbrev);
	}
}) ( jQuery );