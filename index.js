/* schulsanierung.tursics.de - JavaScript file */

/*jslint browser: true*/
/*global $,L*/

var map = null;
var layerPopup = null;
var layerGroup = null;
//var budget = null;

// -----------------------------------------------------------------------------

function mapAction() {
	'use strict';

	$('#headerBox').removeClass('big');
	$('#searchBox').removeClass('big');
	map.scrollWheelZoom.enable();
}

// -----------------------------------------------------------------------------

function fixData(val) {
	'use strict';

	function fixComma(item) {
		if (item === '') {
			return 0;
		} else if (item === null) {
			return 0;
		}
		return parseFloat(String(item).replace('.', '').replace(',', '.'));
	}

	function fixEuro(item) {
		if (item === '') {
			return 0;
		} else if (item === null) {
			return 0;
		} else if ('number' === typeof item) {
			return item;
		} else if ('T€' === item.substring(item.length - 2)) {
			return parseInt(item.substring(0, item.length - 2).replace('.', '').replace(',', '.'), 10) * 1000;
		}
		return item;
	}

	val.NGF = parseInt(val.NGF, 10);
	val.BGF = fixComma(val.BGF);
	val.NF = fixComma(val.NF);
	val.Grundstuecksflaeche = fixComma(val.Grundstuecksflaeche);
	val.GebaeudeHoeheInM = fixComma(val.GebaeudeHoeheInM);
	val.GebaeudeUmfangInMAusConject = fixComma(val.GebaeudeUmfangInMAusConject);
	val.FassadenFlaeche = fixComma(val.FassadenFlaeche);
	val.Dachflaeche = fixComma(val.Dachflaeche);
	val.BWCAnzahl = fixComma(val.BWCAnzahl);
	val.RaeumeNutzflaecheBGF = parseInt(val.RaeumeNutzflaecheBGF, 10);
	val.Sanitaerflaeche = fixComma(val.Sanitaerflaeche);
	val.bereitsSanierteFlaecheInProzent = fixComma(val.bereitsSanierteFlaecheInProzent);

	val.FensterKosten = fixEuro(val.FensterKosten);
	val.FassadenKosten = fixEuro(val.FassadenKosten);
	val.DachKosten = fixEuro(val.DachKosten);
	val.AufzugKosten = fixEuro(val.AufzugKosten);
	val.RampeKosten = fixEuro(val.RampeKosten);
	val.EingangKosten = fixEuro(val.EingangKosten);
	val.TuerenKosten = fixEuro(val.TuerenKosten);
	val.BWCKosten = fixEuro(val.BWCKosten);
	val.ZwischensummeBarrierefreiheitKosten = fixEuro(val.ZwischensummeBarrierefreiheitKosten);
	val.zweiterRettungswegKosten = fixEuro(val.zweiterRettungswegKosten);
	val.RaeumeKosten = fixEuro(val.RaeumeKosten);
	val.Raeume2Kosten = fixEuro(val.Raeume2Kosten);
	val.SanitaerKosten = fixEuro(val.SanitaerKosten);
	val.GebaeudeGesamt = fixEuro(val.GebaeudeGesamt);

	if (val.SanitaerSanierungsjahr === 0) {
		val.SanitaerSanierungsjahr = '-';
	} else if (val.SanitaerSanierungsjahr === null) {
		val.SanitaerSanierungsjahr = '-';
	}

	return val;
}

// -----------------------------------------------------------------------------

function formatNumber(txt) {
	'use strict';

	txt = String(parseInt(txt, 10));
	var sign = '',
		pos = 0;
	if (txt[0] === '-') {
		sign = '-';
		txt = txt.slice(1);
	}

	pos = txt.length;
	while (pos > 3) {
		pos -= 3;
		txt = txt.slice(0, pos) + '.' + txt.slice(pos);
	}

	return sign + txt;
}

// -----------------------------------------------------------------------------

function enrichMissingData(data) {
	'use strict';

	try {
		$.each(data, function (key, value) {
			var val = fixData(value),
				sum1 = 0,
				sum2 = 0,
				diff = 0,
				isSport = false,
				isSchool = false;
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				sum1 = val.GebaeudeGesamt;
				sum2 = val.FensterKosten + val.FassadenKosten + val.DachKosten + val.ZwischensummeBarrierefreiheitKosten + val.zweiterRettungswegKosten + val.RaeumeKosten + val.SanitaerKosten;
				diff = sum1 - sum2;
				isSport = val.Bauwerk.startsWith('Sport');
				isSchool = !isSport && (val.Bauwerk.indexOf('chul') !== -1);

				val.Aussenanlagen = 0;
				val.Baukosten = 0;

				if (isSchool && (diff > 1000)) {
					val.Aussenanlagen = diff;
				} else if (isSport && (diff > 1000)) {
					val.Baukosten = diff;
				}
			}
		});
	} catch (e) {
//		console.log(e);
	}

	return data;
}

// -----------------------------------------------------------------------------

function createStatistics(data) {
	'use strict';

	var obj = {
		Bauwerk: 'Bezirk',
		Dachart: 'Diverse',
		Schulart: 'Bezirk',
		Schulname: 'Lichtenberg',
		Schulnummer: '',
		Strasse: '',
		PLZ: '',
		Gebaeudenummer: 1100000,
		lat: 52.515807,
		lng: 13.479470,
		GebaeudeHoeheInM: 0,
		GebaeudeUmfangInMAusConject: 0,
		FensterKostenpauschale: 0,
		FassadenKostenpauschale: 0,
		DachKostenpauschale: 0,
		RaeumeKostenpauschale: 0,
		Raeume2Kostenpauschale: 0,
		SanierungDachNotwendig: 1,
		SanierungFassadenNotwendig: 1,
		SanierungFensterNotwendig: 1,
		SanierungRaeume2Notwendig: 1,
		SanierungRaeumeNotwendig: 1,
		SanierungTuerbreitenNotwendig: 1,
		SanitaerSanierungsjahr: '-'
	},
		sum = [
			'AufzugKosten', 'BGF', 'BWCAnzahl', 'BWCKosten', 'DachKosten', 'EingangAnzahl', 'EingangKosten',
			'FassadenKosten', 'FensterKosten', 'FlaecheNichtSaniert', 'GF', 'GebaeudeGesamt',
			'Grundstuecksflaeche', 'NF', 'NGF', 'Raeume2Kosten', 'RaeumeKosten', 'RampeAnzahl',
			'RampeKosten', 'SanitaerKosten', 'Sanitaerflaeche', 'ZwischensummeBarrierefreiheitKosten',
			'zweiterRettungswegKosten', 'Baukosten', 'Aussenanlagen'
		],
		sumCond = [
			{calc: 'FensterFlaeche', condition: 'FensterKosten' /*'SanierungFensterNotwendig'*/},
			{calc: 'FassadenFlaeche', condition: 'FassadenKosten' /*'SanierungFassadenNotwendig'*/},
			{calc: 'FassadenFlaecheOhneFenster', condition: 'FassadenKosten' /*'SanierungFassadenNotwendig'*/},
			{calc: 'Dachflaeche', condition: 'DachKosten' /*'SanierungDachNotwendig'*/},
			{calc: 'TuerenKosten', condition: 'SanierungTuerbreitenNotwendig'},
			{calc: 'RaeumeNutzflaecheBGF', condition: 'RaeumeKosten' /*'SanierungRaeumeNotwendig'*/},
			{calc: 'Raeume2Nutzflaeche', condition: 'Raeume2Kosten' /*'SanierungRaeume2Notwendig'*/}
		],
		average = [
			'FassadenFaktorFlaechenanteil', 'FensterFaktorFlaechenanteil', 'BauPrioBauwerk', 'BauPrioTGA',
			'BauprioSumme', 'PrioritaetGesamt', 'bereitsSanierteFlaecheInProzent'
		],
		id,
		len = 0;

	for (id in sum) {
		obj[sum[id]] = 0;
	}
	obj.FensterFlaeche = 0;
	obj.FassadenFlaeche = 0;
	obj.FassadenFlaecheOhneFenster = 0;
	obj.Dachflaeche = 0;
	obj.TuerenKosten = 0;
	obj.RaeumeNutzflaecheBGF = 0;
	obj.Raeume2Nutzflaeche = 0;
	for (id in average) {
		obj[average[id]] = 0;
	}

	try {
		$.each(data, function (key, val) {
			val = fixData(val);
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var id,
					cond;
				for (id in val) {
					if (-1 < $.inArray(id, sum)) {
						obj[id] += parseInt(val[id], 10);
					} else if (-1 < $.inArray(id, average)) {
						obj[id] += parseInt(val[id], 10);
					} else {
						for (cond in sumCond) {
							if ((sumCond[cond].calc === id) && (0 !== val[sumCond[cond].condition])) {
								obj[id] += parseInt(val[id], 10);
							}
						}
					}
				}
			}
		});

		len = data.length;
		for (id in obj) {
			if (-1 < $.inArray(id, average)) {
				obj[id] = parseInt(obj[id] / len * 10, 10) / 10;
			}
		}

		obj.FensterKostenpauschale = parseInt(obj.FensterKosten / obj.FensterFaktorFlaechenanteil / obj.FensterFlaeche * 100, 10) / 100;
		obj.FassadenKostenpauschale = parseInt(obj.FassadenKosten / obj.FassadenFaktorFlaechenanteil / obj.FassadenFlaecheOhneFenster * 100, 10) / 100;
		obj.DachKostenpauschale = parseInt(obj.DachKosten / obj.Dachflaeche * 100, 10) / 100;
		obj.RaeumeKostenpauschale = parseInt(obj.RaeumeKosten / obj.RaeumeNutzflaecheBGF * 100, 10) / 100;
		obj.Raeume2Kostenpauschale = parseInt(obj.Raeume2Kosten / obj.Raeume2Nutzflaeche * 100, 10) / 100;
		obj.bereitsSanierteFlaecheInProzent = parseInt(obj.bereitsSanierteFlaecheInProzent, 10);

		data.push(obj);
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function updateMapSelectItem(data) {
	'use strict';

	function setText(key, txt) {
		var item = $('#rec' + key);

		if (item.parent().hasClass('number')) {
			txt = formatNumber(txt);
		} else if (item.parent().hasClass('boolean')) {
			txt = (txt === 1 ? 'ja' : 'nein');
		}

		item.text(txt);
	}

	mapAction();

	var key,
		date = new Date(),
		dateD = date.getDate(),
		dateM = date.getMonth() + 1,
		dateY = date.getFullYear(),
		dateH = date.getHours(),
		dateMin = date.getMinutes(),
		dateSec = date.getSeconds();
//		strThisYear = '',
//		intThisYear = 0,
//		id,
//		item,
//		kosten = 0;

	for (key in data) {
		setText(key, data[key]);
	}

	setText('FensterKosten_', data.FensterFaktorFlaechenanteil * data.FensterFlaeche * data.FensterKostenpauschale);
	setText('DachKosten_', data.Dachflaeche * data.DachKostenpauschale);
	setText('FassadenKosten_', data.FassadenFaktorFlaechenanteil * (data.FassadenFlaecheOhneFenster < 0 ? 0 : data.FassadenFlaecheOhneFenster) * data.FassadenKostenpauschale);
	setText('RaeumeKosten_', data.RaeumeNutzflaecheBGF * data.RaeumeKostenpauschale);
	setText('Raeume2NF_', data.NF - data.Sanitaerflaeche);
	setText('Raeume2Kosten_', data.Raeume2Nutzflaeche * data.Raeume2Kostenpauschale);
	setText('GebaeudeGesamt_', data.FensterKosten + data.FassadenKosten + data.DachKosten + data.ZwischensummeBarrierefreiheitKosten + data.zweiterRettungswegKosten + data.RaeumeKosten + data.SanitaerKosten + data.Baukosten + data.Aussenanlagen);

	setText('zweiterRettungswegKosten_', data.zweiterRettungswegKosten);
	setText('FassadenFlaecheOhneFenster_', data.FassadenFlaecheOhneFenster);
	setText('BGF_', data.BGF);
	setText('Baukosten_', data.Baukosten);

	if (dateD < 10) {
		dateD = '0' + dateD;
	}
	if (dateM < 10) {
		dateM = '0' + dateM;
	}
	if (dateH < 10) {
		dateH = '0' + dateH;
	}
	if (dateMin < 10) {
		dateMin = '0' + dateMin;
	}
	setText('Now_', dateD + '.' + dateM + '.' + dateY + ' ' + dateH + ':' + dateMin);

	switch (data.PrioritaetGesamt) {
	case 1:
		setText('PrioritaetGesamt', 'kurzfrist. Handlungsbedarf');
		break;
	case 2:
		setText('PrioritaetGesamt', 'in den nächsten 3 Jahren');
		break;
	case 3:
		setText('PrioritaetGesamt', 'in den nächsten 10 Jahren');
		break;
	case 4:
		setText('PrioritaetGesamt', 'wünschenswert');
		break;
	case 5:
		setText('PrioritaetGesamt', 'niedrig');
		break;
	case 6:
		setText('PrioritaetGesamt', 'minimal');
		break;
	default:
		setText('PrioritaetGesamt', data.PrioritaetGesamt);
		break;
	}

	$('#receiptBox').css('display', 'block');

//	for (id in budget) {
//		item = budget[id];
//		if (item.Gebaeudenummer === data.Gebaeudenummer) {
//			kosten = parseFloat(String(item.Kostenansatz).replace('.', '').replace('.', '').replace(',', '.'));
//			if (isNaN(kosten)) {
//				kosten = 0;
//			}
//			intThisYear += kosten;
//			strThisYear += '<div class="sub"><span class="fullwrap">' + item.Beschreibung + '</span></div>';
//			strThisYear += '<div class="sub"><span class="half">' + item.Programm + ' ' + item.Jahr + '</span><span class="number">' + formatNumber(kosten) + ' EUR</span></div>';
//		}
//	}
//	if (strThisYear.length > 0) {
//		strThisYear = '<div><span class="half">Bau- und Sanierungsprogramme</span><span class="number">' + formatNumber(intThisYear) + ' EUR</span></div>' + strThisYear;
//	}
//	$('#thisYear').html(strThisYear);
}

// -----------------------------------------------------------------------------

function updateMapHoverItem(coordinates, data, icon) {
	'use strict';

	var options = {
		closeButton: false,
		offset: L.point(0, -32),
		className: 'printerLabel'
	},
		str = '';

	str += '<div class="top ' + icon.options.markerColor + '">' + data.Schulname + '</div>';
	str += '<div class="middle">€' + formatNumber(data.GebaeudeGesamt) + '</div>';
	str += '<div class="bottom ' + icon.options.markerColor + '">' + data.Bauwerk + '</div>';

	layerPopup = L.popup(options)
		.setLatLng(coordinates)
		.setContent(str)
		.openOn(map);
}

// -----------------------------------------------------------------------------

function updateMapVoidItem(data) {
	'use strict';

	if (layerPopup && map) {
		map.closePopup(layerPopup);
		layerPopup = null;
    }
}

// -----------------------------------------------------------------------------

function createMarker(data) {
	'use strict';

	try {
		var markerSchool = L.AwesomeMarkers.icon({
			icon: 'fa-user',
			prefix: 'fa',
			markerColor: 'blue'
		}),
			markerExtension = L.AwesomeMarkers.icon({
				icon: 'fa-user-plus',
				prefix: 'fa',
				markerColor: 'blue'
			}),
			markerSport = L.AwesomeMarkers.icon({
				icon: 'fa-soccer-ball-o',
				prefix: 'fa',
				markerColor: 'orange'
			}),
			markerTraffic = L.AwesomeMarkers.icon({
				icon: 'fa-car',
				prefix: 'fa',
				markerColor: 'purple'
			}),
			markerMulti = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'purple'
			}),
			markerOthers = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'red'
			});

		layerGroup = L.featureGroup([]);
		layerGroup.addTo(map);

		layerGroup.addEventListener('click', function (evt) {
			updateMapSelectItem(evt.layer.options.data);
		});
		layerGroup.addEventListener('mouseover', function (evt) {
			updateMapHoverItem([evt.latlng.lat, evt.latlng.lng], evt.layer.options.data, evt.layer.options.icon);
		});
		layerGroup.addEventListener('mouseout', function (evt) {
			updateMapVoidItem(evt.layer.options.data);
		});

		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var isSchool   = val.Bauwerk.startsWith('Schul') || val.Bauwerk.startsWith('Hauptgebäude') || val.Bauwerk.startsWith('Altbau'),
					isSport    = val.Bauwerk.startsWith('Sport'),
					isExt      = val.Bauwerk.startsWith('MUR') || val.Bauwerk.startsWith('MEB'),
					isMulti    = val.Bauwerk.startsWith('MZG'),
					isDistrict = val.Bauwerk.startsWith('Bezirk'),
					isTraffic  = val.Schulname.indexOf('verkehrsschule') !== -1,
					marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
						data: fixData(val),
						icon: isTraffic ? markerTraffic :
								isSchool ? markerSchool :
										isSport ? markerSport :
												isExt ? markerExtension :
														isMulti ? markerMulti :
																markerOthers,
						opacity: isDistrict ? 0 : 1,
						clickable: isDistrict ? 0 : 1
					});
				layerGroup.addLayer(marker);
			}
		});
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function selectSuggestion(selection) {
	'use strict';

	$.each(layerGroup._layers, function (key, val) {
		if (val.options.data.Gebaeudenummer === selection) {
			map.panTo(new L.LatLng(val.options.data.lat, val.options.data.lng));
			updateMapSelectItem(val.options.data);
		}
	});
}

//-----------------------------------------------------------------------------

function initSearchBox(data) {
	'use strict';

	var schools = [];

	try {
		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var name = val.Schulname;
				if ('' !== val.Schulnummer) {
					name += ' (' + val.Schulnummer + ')';
				}
				schools.push({ value: name, data: val.Gebaeudenummer, color: '', desc: val.Bauwerk });
			}
		});
	} catch (e) {
//		console.log(e);
	}

	schools.sort(function (a, b) {
		if (a.value === b.value) {
			return a.data > b.data ? 1 : -1;
		}

		return a.value > b.value ? 1 : -1;
	});

	$('#autocomplete').focus(mapAction);
	$('#autocomplete').autocomplete({
		lookup: schools,
		onSelect: function (suggestion) {
			selectSuggestion(suggestion.data);
		},
		formatResult: function (suggestion, currentValue) {
			var isSchool   = suggestion.desc.startsWith('Schul') || suggestion.desc.startsWith('Hauptgebäude') || suggestion.desc.startsWith('Altbau'),
				isSport    = suggestion.desc.startsWith('Sport'),
				isExt      = suggestion.desc.startsWith('MUR') || suggestion.desc.startsWith('MEB'),
				isMulti    = suggestion.desc.startsWith('MZG'),
				isDistrict = suggestion.desc.startsWith('Bezirk'),
				isTraffic  = suggestion.value.indexOf('verkehrsschule') !== -1,
				color = isTraffic ? 'purple' :
							isSchool ? 'blue' :
								isSport ? 'orange' :
										isExt ? 'blue' :
												isMulti ? 'purple' :
														isDistrict ? 'gray' :
																'red',
				icon  = isTraffic ? 'fa-car' :
							isSchool ? 'fa-user' :
								isSport ? 'fa-soccer-ball-o' :
										isExt ? 'fa-user-plus' :
												isMulti ? 'fa-building-o' :
														isDistrict ? 'fa-institution' :
																'fa-building-o',
				str = '';

			str += '<div class="autocomplete-icon back' + color + '"><i class="fa ' + icon + '" aria-hidden="true"></i></div>';
			str += '<div>' + suggestion.value.replace(new RegExp(currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gi'), '<strong>' + currentValue + '</strong>') + '</div>';
			str += '<div class="' + color + '">' + suggestion.desc + '</div>';
			return str;
		}
	});
}

// -----------------------------------------------------------------------------

function initMap(elementName, lat, lng, zoom) {
	'use strict';

	if (null === map) {
		var mapboxToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
			mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=' + mapboxToken, {
				attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap-Mitwirkende</a>, <a href="https://www.mapbox.com" target="_blank">Mapbox</a>'
			}),
			dataUrl = 'data/gebaeudescan.json';

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: false})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.once('focus', mapAction);

		$.getJSON(dataUrl, function (data) {
			data = enrichMissingData(data);
			createStatistics(data);
			createMarker(data);
			initSearchBox(data);

//			var budgetUrl = 'data/gebaeudesanierungen.json';
//			$.getJSON(budgetUrl, function (budgetData) {
//				budget = budgetData;
//			});
		});
	}
}

// -----------------------------------------------------------------------------

$(document).on("pagecreate", "#pageMap", function () {
	'use strict';

	// center the city hall
//	initMap( 'mapContainer', 52.515807, 13.479470, 16);
});

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	// center the city hall
	initMap('mapContainer', 52.515807, 13.479470, 16);

	$('#autocomplete').val('');
	$('#receipt .group').on('click', function (e) {
		$(this).toggleClass('groupClosed');
	});
	$('#receiptClose').on('click', function (e) {
		$('#receiptBox').css('display', 'none');
	});
	$('#searchBox .sample a:nth-child(1)').on('click', function (e) {
		$('#autocomplete').val('Obersee-Schule (11G19)');
		selectSuggestion(1111901);
	});
	$('#searchBox .sample a:nth-child(2)').on('click', function (e) {
		$('#autocomplete').val('Lichtenberg');
		selectSuggestion(1100000);
	});
	$('.embedInfo').addClass('shrink');
	$('.embedInfo .showMore').on('click', function (e) {
		e.preventDefault();
		$(this).parent().removeClass('shrink');
	});
});

// -----------------------------------------------------------------------------

$(function () {
	'use strict';

	$('a[href*="#"]:not([href="#"])').click(function () {
		if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && (location.hostname === this.hostname)) {
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
				$('#pageMap').animate({
					scrollTop: parseInt(target.offset().top, 10)
				}, 500);
				return false;
			}
		}
	});
});

// -----------------------------------------------------------------------------
