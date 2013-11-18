(function( $ ) {
	$.fn.dividedByPages = function (data, renders) {
		var maxRows = parseInt($("#nrowonpage").val());

		var cData = data;
		var cTable = $(this);
		var cRowCount = data.length;
		var cPage = 1;

		cTable.off("refresh");
		cTable.on("refresh", function (event, data) {

			cData = data['data'];
			cRowCount = cData.length;
			if(getCountPages() < parseInt($('#page_selector').val())){
				cPage=getCountPages();
			}
			updatePageState();
			$(this).trigger("changepage", cPage);

		});

		cTable.off("changepage");
		cTable.on("changepage", function (event, npage) {
			var page = parseInt(npage);
			var count = getCountPages();
			if ($.isNumeric(npage) && (page > 0) && (page <= count)) {
				cPage = page + 1;
				prev(null, true);
			} else {
				$("#page_selector").val(cPage);
			}
		});

		cTable.off("changerowonpage");
		cTable.on("changerowonpage", function (event, nrow) {
			if (maxRows !== parseInt(nrow)) {
				maxRows = parseInt(nrow);
				var pcount = getCountPages();
				cTable.trigger("changepage", cPage < pcount? cPage : pcount);
			}
		});

		function getCountPages () {
			var count = parseInt(cRowCount / maxRows);
			if ((cRowCount % maxRows) !== 0 || count === 0)
				count++;
			return count;
		};

		function added (rows, sindex) {
			cTable.children("tbody").empty();
			renders(sindex, rows);
			updatePageState();
			var names = $(".unitName");
			var max_width=0;
			var cur_width=0;
			for(var i=0;i<names.length;i++){
				cur_width = $(names[i]).width();
				if(cur_width > max_width) {
					max_width = cur_width;
				}
			}
			$("#units-col-head").css("width",max_width + 50);
		};

		function updatePageState () {
			var ifrom = cPage * maxRows - maxRows + 1;
			var ito = cPage * maxRows;
			if (ito > cRowCount)
				ito = cRowCount;
			if(typeof $.localise != "undefined"){
				$("#pagestat").html($.localise.tr("Displaying") + ifrom + $.localise.tr("to") + ito + $.localise.tr("of") + cRowCount + $.localise.tr("items"));
			} else {
				$("#pagestat").text("Displaying " + ifrom + " to " + ito + " of " + cRowCount + " items");
			}

			$("#page_selector").val(parseInt(ifrom / maxRows + 1));
			$("#cpages").text(getCountPages());
		};

		var cPrev = $('#prev');
		var cNext = $('#next');
		var cEnd = $('#last');
		var cStart = $('#top');

		cNext.removeClass('disabled');
		cEnd.removeClass('disabled');

		if (cRowCount < maxRows) {
			cPrev.addClass('disabled');
			cNext.addClass('disabled');
			cEnd.addClass('disabled');
			cStart.addClass('disabled');
			added(data, 0);
			return;
		} else {
			added(cData.slice(0, maxRows), 0);
		}

		cPrev.addClass('disabled');
		cStart.addClass('disabled');

		function prev (event, isforcibly) {
			if (!isforcibly)
				if (cPrev.hasClass('disabled'))
					return false;

			var ndata = null;
			var prevPage = cPage - 1;
			var sindex = 0;
			if (cPage > 1) {
				sindex = (prevPage-1)*maxRows;
				ndata = cData.slice(sindex, prevPage*maxRows);
			} else {
				sindex = prevPage*maxRows;
				ndata = cData.slice(sindex, cPage*maxRows);
			}

			if (prevPage < 2) {
				cPrev.addClass('disabled');
				cStart.addClass('disabled');
				cPage = 1;
			} else {
				cPrev.removeClass('disabled');
				cStart.removeClass('disabled');
				cPage = prevPage;
			}

			var count = getCountPages();
			if (prevPage < count) {
				cNext.removeClass('disabled');
				cEnd.removeClass('disabled');
			} else {
				cNext.addClass('disabled');
				cEnd.addClass('disabled');
			}

			added(ndata, sindex);
			return false;
		}
		cPrev.off("click");
		cPrev.click(prev);

		function next () {
			if (cNext.hasClass('disabled'))
				return false;

			var nextPage = cPage + 1;
			var sindex = cPage*maxRows;
			var ndata = cData.slice(sindex, nextPage*maxRows);
			var nnlen = cData.length - nextPage*maxRows;
			if (ndata.length < maxRows || nnlen < 1) {
				cNext.addClass('disabled');
				cEnd.addClass('disabled');
			}

			cPrev.removeClass('disabled');
			cStart.removeClass('disabled')
			cPage = nextPage;

			added(ndata, sindex);
			return false;
		}
		cNext.off("click");
		cNext.click(next);

		function end () {
			if (cEnd.hasClass('disabled'))
				return false;

			cPage = parseInt(cRowCount / maxRows) + 1;
			var sindex = maxRows*(cPage-1)
			var ndata = cData.slice(sindex);
			if (ndata.length < 1) {
				sindex = maxRows*(cPage-2);
				ndata = cData.slice(sindex);
				cPage--;
			}

			cNext.addClass('disabled');
			cPrev.removeClass('disabled');
			cEnd.addClass('disabled');
			cStart.removeClass('disabled');

			added(ndata, sindex);
			return false;
		}
		cEnd.off("click");
		cEnd.click(end);

		function start () {
			if (cStart.hasClass('disabled'))
				return false;

			cPage = 1;
			cNext.removeClass('disabled');
			cPrev.addClass('disabled');
			cEnd.removeClass('disabled');
			cStart.addClass('disabled');

			added(cData.slice(0, maxRows), 0);
			return false;
		}
		cStart.off("click");
		cStart.click(start);
	}
}) ( jQuery );
