// Global event handlers
var callbacks = {};
// Execute callback
function exec_callback(id) {
	if (!callbacks[id])
		return;
	callbacks[id].call();
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
	/// Fetch variable from 'GET' request
	function get_html_var(name, def) {
		if (!name) {
			return def || null;
		}
		var pairs = document.location.search.substr(1).split("&");
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=");
			if (decodeURIComponent(pair[0]) === name) {
				return decodeURIComponent(pair[1]);
			}
		}
		return def || null;
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
				};
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

		var session = wialon.core.Session.getInstance();
		session.loadLibrary('resourceZones');

		wialon.core.Remote.getInstance().remoteCall('core/set_session_property', { prop_name:'skip_nonactive_items', prop_value:1 }, function () {});

		updateDataFlags(function(code) {
			if (!code) {
				return loadUnits()
			}
			alert('Error');
		});
	}

	function updateDataFlags(callback) {
		var spec = [
			{ type: 'type', data: "user", flags: 1, mode: 0 },
			{ type: 'type', data: "avl_resource", flags: 1 | 0x00001000, mode: 0 }
		];
		wialon.core.Session.getInstance().updateDataFlags(spec, bind(callback));
	}

	function getGeoByPoints(zoneId, pos, callback) {
		wialon.util.Helper.getZonesInPoint({
			zoneId: zoneId,
			lat: pos.y,
			lon: pos.x
		}, function (code, data) {
			if (code || !Object.keys(data).length) {
				return console.log("Error getting point in zones: ", code);
			}

			callback(data);
		});
	}

	function finishData(isrefresh) {
		if (!isrefresh) {
			$("#messages-col").toggleClass("desc");
			$("#paginated-table").dividedByPages(units, fill_table);
		} else {
			daysFilter(units, parseInt($("#days").text() || 0));
		}
	}

	function loadUnits (isrefresh) {
		qx.Class.include(wialon.core.Session, wialon.util.MDataFlagsHelper);

		isrefresh = isrefresh || false;
		var spec_unit = {itemsType: "avl_unit", propName: "sys_name", propValueMask: "*", sortType: "sys_last_message"};
		var flags_unit = wialon.item.Item.dataFlag.base | wialon.item.Item.dataFlag.billingProps| 1024;
		var session = wialon.core.Session.getInstance();

		session.searchItems(spec_unit, true, flags_unit, 0, 0, function (code, data) {

			if (code || !data) {
				return alert("List of units empty.");
			} else if (!data.items || data.items.length < 1) {
				return alert("List of units empty.");
			}

			units = data.items;
			units.sort(minmaxmes);
			var curTime = (new Date().getTime()) / 1000;
			for (var i = 0; i < units.length; i++) {
				units[i].days = (units[i].getLastMessage()) ? parseInt((curTime - units[i].getLastMessage().t) / (60 * 60 * 24)) : 0;
			}
			// get string of time format
			session.getCurrUser().getLocale(function(arg, locale){

				var fd = (locale && locale.fd) ? locale.fd : '%Y-%m-%E_%H:%M:%S'; // check for users who have never changed the parameters of the metric

				formatTime = wialon.util.DateTime.convertFormat(fd,true).replace(/_/, '&nbsp;&nbsp;').replace(/ /, '&nbsp;');
				setLocaleDateTime();

				session = wialon.core.Session.getInstance();
				var resources = session.getItems('avl_resource');
				var zoneId = {};
				resources.forEach(function (resource) {
					zoneId[resource.getId()] = [];
				});
				if (Object.keys(zoneId).length) {
					wialon.core.Remote.getInstance().startBatch("getUnitsResources");
					units.forEach(function (unit) {
						var pos = unit.getPosition();
						if (pos && pos.x && pos.y) {
							getGeoByPoints(zoneId, pos, function (data) {
								if (!cached_units[unit.getId()]) {
									cached_units[unit.getId()] = {};
								}
								var store = cached_units[unit.getId()]
								Object.keys(data).forEach(function (resourceId) {
									var resource = session.getItem(resourceId);
									data[resourceId].forEach(function (id) {
										store[[resourceId,id].join('_')] = resource.getZone(id);
									});
								});
							});
						}
					});
					wialon.core.Remote.getInstance().finishBatch(function () {
						finishData(true);
					}, "getUnitsResources");
				}
				finishData(isrefresh);
			});
		});
	}

	/// Init SDK
	function init_sdk() {
		var url = get_html_var("baseUrl","https://hst-api.wialon.com");
		if (!url)
			url = get_html_var("hostUrl","https://hosting.wialon.com");
		if (!url)
			return;

		var user = get_html_var("user");
		user = (user) ? user : "";

		wialon.core.Session.getInstance().initSession(url, "gapp_actualizer", 0x800);

		var sid = get_html_var("sid");
		var authHash = get_html_var("authHash");

		if (authHash) {
			wialon.core.Session.getInstance().loginAuthHash(authHash, login);
		} else if (sid) {
			wialon.core.Session.getInstance().duplicate(sid, user, true, login);
		}
	}

	function ltranslate () {
		var title = decodeURIComponent(APP_CONFIG.alias || "Actualizer");
		$("#app-name").html(title);

		$("#units-col").html($.localise.tr("Unit"));
		$("#account-col").text($.localise.tr("Account"));
		$("#messages-col").html($.localise.tr("Last Message"));
		$("#lastposition-col").html($.localise.tr("Last Position"));
		$("#page").html($.localise.tr("Page"));
		$("#of").html($.localise.tr("of"));
		$("#refresh-btn").prop("alt",$.localise.tr("Refresh"));
		$("#days-head").text($.localise.tr("Days"));
		$("#geofences-head").text($.localise.tr("Geofences"));
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
		var url = get_html_var("baseUrl","https://hst-api.wialon.com");
		if (!url)
			url = get_html_var("hostUrl","https://hosting.wialon.com");
		if (!url)
			return;
		url += "/wsdk/script/wialon.js" ;
		load_script(url, init_sdk);

		var lang = get_html_var("lang", "en");
		if (availableLanguages && ($.inArray(lang, availableLanguages) == -1)){
			lang = "en";
		}
		if (documentationLink) {
			$("#help").html("<a class='help' target='_blank' href='"+ documentationLink +"'><img src='img/help.png'/></a>");
		}

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
		$("#messages-col").click(sortByMessages);
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

	};

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
	}

	function sortByMessages(){
		units.sort(minmaxmes);
		$("#units-col").removeClass('desc');
		$("#messages-col").toggleClass("desc");
		daysFilter(units, parseInt($("#days").text() || 0));
	}

	window.onresize = function(event) {
		$('#table-wrap').css({height:($(window).height()-$("#header").height()-$("#table-footer").height())});
	};

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
		var last_message = item.getLastMessage();
		var unitId = item.getId();
		var geos = cached_units[unitId] ? Object.values(cached_units[unitId]) : [];
		var geoNames = geos.length ? geos.map(function (geo) {
			var color = '#' + ('000000' + parseInt(geo.c, 10).toString(16)).substr(-6);
			return '<span class="geo-item"><i class="geo-color" style="color:' + color + ';" />' + geo.n + '</span>';
		}).join(', ') : '';
		var row = "<tr id='unit_" + unitId + "' class='" + (sindex%2?'odd':'') + "'>";
		row += "<td><span class='number'>" + (sindex++ +1) + ".</span></td>";
		row += "<td><span class='unitName'>" + item.getName() + "</span></td>";
		var creator = item.getCreatorId();
		creator = wialon.core.Session.getInstance().getItem(creator);
		if (creator)
			creator = creator.getName();

		row += "<td><span class='accountName'>" + (creator ? creator :"-") + "</span></td>";
		row += "<td>" + (( last_message )
				? (wialon.util.DateTime.formatTime(last_message.t, 0, formatTime))
				:('<span class="no-mess">' + $.localise.tr('No messages') + '</span>')) + "</td>";

		row += "<td class='actualizer-units-location' ><div>";
		row += "<span id='actualizer_units_location_" + unitId + "' class='position'>";
		row += _retrive_position(item);
		row += "</span></div></td>";

		row += "<td><span class='cnt'>" + (item.days?item.days:(last_message ? 0 : '-')) + "</span></td>";
		row += "<td><span class='geo-cell' id='units_geo" + unitId + "'>" + geoNames + "</span></td>";
		row += "</tr>";
		$("#paginated-table").children("tbody").append(row);
		return sindex;
	}

	var cached_units = {};
	var coords = [];
	var gis_timeout;
	var gis_in_progress;
	var arr_coords = new Array,
		arr_coords_uniq = new Array;
	var arr_cb = new Array;

	function bind(func, context) {
		return function() {
			return func.apply(context, arguments);
		};
	}

	function  _retrive_position(unit) {
		if (!unit.getPosition())
			return $.localise.tr('N/A');

		var pos = unit.getPosition();
		setTimeout(function() {
			if (!pos)
				_update_location_callback(0, $.localise.tr('N/A'), unit);
			if (pos.location) {
				_update_location_callback(0, [unit.getPosition().location], unit);
			} else {
				var cb =  bind( _update_location_callback, this);
				_gis_getLocations({
					value: {
						lat: pos.y,
						lon: pos.x
					},
					cb: cb,
					unit: unit
				});
			}
		}, 300);
		jQuery("#actualizer_units_location_" + unit.getId()).attr('title', '');
		return $.localise.tr('Resolving...');
	}
	/// Update location callback
	function _update_location_callback (code, location, unit) {
		var uid = unit.getId();
		if (typeof location !== "object")
			return;
		if (typeof location === "object") {
			if (unit && location && location[0])
				unit.getPosition().location = location[0];
		}
		if (code) jQuery("#actualizer_units_location_" + uid).html($.localise.tr('N/A'));
		else if (location) {
			jQuery("#actualizer_units_location_" + uid)
				.html(location)
				.attr('title', location);
		}
	}
	function _check_unit_geofences (uid) {
		var finded = false;
		for (var geo_id in cached_units[uid]) {
			if (cached_units[uid][geo_id])
				finded = true;
		}
		return finded;
	}
	function _get_gis_flags () {
		var flags = parseInt(wialon.core.Session.getInstance().getCurrUser().getCustomProperty("us_addr_ordr", ""));
		return flags;
	}
	function _gis_getLocations_check () {
		if (coords.length && !gis_in_progress) {
			gis_in_progress = true;
			arr_coords = [];
			arr_coords_uniq = [];

			var arr_uniq = new Object, key_uniq, p;

			for (var k = 0; k < coords.length; k++) {
				arr_coords.push(coords[k].value);
				if (typeof coords[k].value.lat == "undefined" || typeof coords[k].value.lon == "undefined")
					continue;
				key_uniq = coords[k].value.lat.toString() + coords[k].value.lon.toString();
				if (arr_uniq[key_uniq]) {
					continue;
				}
				arr_uniq[key_uniq] = k;
			}
			var count = 0;
			for (p in arr_uniq) {
				arr_coords_uniq.push(arr_coords[arr_uniq[p]]);
				arr_uniq[p] = count++;
			}

			wialon.util.Gis.getLocations(arr_coords_uniq, bind(function(code, locations) {

				var ids = arr_uniq;
				var crds = arr_coords_uniq;
				var len = coords.length;

				gis_in_progress = false;
				clearTimeout(gis_timeout);
				if (!code) {
					var key_c, id_uniq;
					if (locations && crds && locations.length == crds.length) {
						var i = 0, j = 0;
						for (; i < len; i++) {
							if (typeof coords[i].value.lat == "undefined" || typeof coords[i].value.lon == "undefined")
								continue;
							key_c = coords[i].value.lat.toString() + coords[i].value.lon.toString();
							// get necessary unique id
							id_uniq = ids[key_c];
							// get necessary location through unique id
							var location = locations[id_uniq] ? locations[id_uniq] : (crds[id_uniq].lat + ", " + crds[id_uniq].lon);
							// call cb
							coords[i].cb(code, [location], coords[i].unit);
							coords[i] = null;
						}
						// clear array
						coords.splice(0,len);

						if (coords.length) {
							gis_timeout = setTimeout(_gis_getLocations_check, 3000);
						}
					}
				} else {
					for (var i = 0; i < coords.length; i++) {
						// call cb
						coords[i].cb(code);
					}
				}
			}, this));
		} else {
			gis_in_progress = false;
		}
	}

	function _gis_getLocations (data) {
		if (!coords) coords = new Array;
		coords.push(data);
		if (coords && coords.length === 1) {
			gis_timeout = setTimeout(_gis_getLocations_check, 3000);
		}
	}

	function _on_items_loaded (param) {
		// call callbacks
		if (param && param.length)
			for (var i = 0; i < param.length; i++)
				param[i]();
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
