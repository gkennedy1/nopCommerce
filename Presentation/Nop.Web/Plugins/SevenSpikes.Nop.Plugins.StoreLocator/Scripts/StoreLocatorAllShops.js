var mapWrapperId = 'all-shops-map-holder';
var shopCoordinatesElementClass = '.shop-coordinates';
var allShops = [];

var directionsService;
var directionsDisplay;

var map;
var markers = [];
var userMarker;
var bounds;

var searchResultCoords;

var shopX = 0;
var shopY = 0;
var patternCoords = new RegExp(/^-?\d+\.?\d*$/);
var isUserMarkerCreated = false;

$(document).ready(function () {
    if ($(shopCoordinatesElementClass).length > 0 && document.getElementById(mapWrapperId) != null) {

        $(shopCoordinatesElementClass).each(function (index) {
            var lat = $(this).attr('data-latitude');
            var lng = $(this).attr('data-longitude');

            var shop = {
                index: index,
                lat: lat,
                lng: lng,
                title: $(this).attr('data-shop-title')
            };

            allShops.push(shop);
        });

        loadMapScript();

        $('#backToResults').on('click', function () {
            directionsDisplay.setMap(null);
            $('#directions-panel, .map-wrapper, #backToResults').removeClass('directions-shown');
        });
        
        $('#searchForFilteredShops').on('click', function (e) {
            e.preventDefault();

            searchForShopsMatchingTheSearchCriteria();

            $('#clearShopFilters').show();
        });

        $('.shops-list').on('click', '.show-directions', function (e) {
            e.preventDefault();

            if (!isUserMarkerCreated) {
                return;
            }

            var ind = parseInt($(this).parents('li.shops-item').attr('data-ind'));
            ind >= 0 && showDirectionsToShop(ind);
        });

        $('.shops-list').on('mouseenter', 'li', function () {
            var currentMarker = markers[$(this).attr('data-ind')];
            if (currentMarker != null) {
                currentMarker.setAnimation(google.maps.Animation.BOUNCE);
            }
        }).on('mouseleave', 'li', function () {
            var currentMarker = markers[$(this).attr('data-ind')];
            if (currentMarker != null) {
                currentMarker.setAnimation(null);
            }
        });

        $('#clearShopFilters').on('click', function () {
            showMarkers();
            $('.shops-list > li').show();
            $('#searchByTagsInput').val('');
            $('#searchRadius').val('');
            $(this).hide();
        });

        $('#sortingSelect').on('change', sortShopsBySelectedMethod);

        $('.align-map-button').on('click', function() {
            map.fitBounds(bounds);
        });
    }
});

function loadMapScript() {
    var script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&sensor=false&callback=initializeMap";
    document.body.appendChild(script);
}

function initializeMap() {
    var map_canvas = document.getElementById(mapWrapperId);
    var map_options = {
        center: new google.maps.LatLng(shopX, shopY),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(map_canvas, map_options);

    google.maps.event.addListenerOnce(map, 'idle', function () {
        onMapLoad();
        createMapSearchBox();
    });
}

function onMapLoad() {
    bounds = new google.maps.LatLngBounds();

    for (var a = 0; a < allShops.length; a++) {
        addMarker(allShops[a], false);
    }

    if (allShops.length > 1) {
        map.fitBounds(bounds);
    }

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setPanel(document.getElementById('directions-panel'));

    $('.getUserGeoLocation').on('click', function (e) {
        e.preventDefault();

        getUserGeoLocation();
    });
}

function addMarker(shopInfo, isDraggable) {

    if (shopInfo.lat == null || shopInfo.lng == null || !patternCoords.test(shopInfo.lat) || !patternCoords.test(shopInfo.lng)) {
        return;
    }

    var googleMapsLatLng = new google.maps.LatLng(shopInfo.lat, shopInfo.lng);

    var marker = new google.maps.Marker({
        position: googleMapsLatLng,
        map: map,
        title: shopInfo.title,
        draggable: isDraggable
    });

    bounds.extend(googleMapsLatLng);

    map.setCenter(googleMapsLatLng);
    marker.setMap(map);
    markers.push(marker);

    var infowindow = new google.maps.InfoWindow({
        maxWidth: 400,
        content: '<h5>' + shopInfo.title + '</h5>' + '<div>' + $('.shops-list > li:eq(' + shopInfo.index + ') .short-description').html() + '</div>'
    });

    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
        $('.shops-list > li').removeClass('active');
        $('.shops-list > li[data-ind="' + shopInfo.index + '"]').addClass('active');
    });

    //return markers.length-1;
}

// Sets the map on all markers in the array.
function setAllMap(mapa) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(mapa);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setAllMap(null);
}

// Shows any markers currently in the array.
function showMarkers() {
    setAllMap(map);
}

// Deletes all markers in the array by removing references to them.
function deleteMarkers() {
    clearMarkers();
    markers = [];
}

function createMapSearchBox() {
    var input = document.getElementById("shop-address-input");
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var searchBox = new google.maps.places.SearchBox(input);
    input.style.display = "block";

    google.maps.event.addListener(searchBox, 'places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        createUserMarker(places[0].geometry.location);
        userMarker.setPosition(places[0].geometry.location);
        map.setCenter(places[0].geometry.location);

        searchResultCoords = places[0].geometry.location;

        showDistancesFromShopsToUser();
    });
}

function createUserMarker(location) {
    if (!isUserMarkerCreated) {
        var image = $('.shop-resources').attr('data-pathtoimages') + '/squat_marker_green_thumb.png';

        var marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: image,
            animation: google.maps.Animation.DROP,
            title: $('.shop-resources').attr('data-youarehere'),
            draggable: true
        });

        marker.setMap(map);
        userMarker = marker;

        bounds.extend(location);

        $('.distanceAndDirections').show();
        $('#sortingSelect option[value="sortbydistance"]').removeAttr('disabled');
        
        isUserMarkerCreated = true;

        google.maps.event.addListener(marker, 'dragend', function () {
            showMarkers();
            $('.shops-list > li').show();
            showDistancesFromShopsToUser();
        });
    }
}

function getUserGeoLocation() {
    var message = 'Geolocation is not supported by this browser.';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            message = 'Now we use your current position. ( Maybe a confirmation is required by the browser to use it. )';
            //message = "Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude;

            var userCoords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            createUserMarker(userCoords);
            userMarker.setPosition(userCoords);
            map.setCenter(userCoords);

            showDistancesFromShopsToUser();
        });
    }

    return message;
}

function showDirectionsToShop(ind) {
    if (markers[ind] != null) {
        var areUnitsImperial = $('.shop-resources').attr('data-units') == 'Imperial';

        var request = {
            origin: new google.maps.LatLng(userMarker.position.lat(), userMarker.position.lng()),
            destination: new google.maps.LatLng(markers[ind].position.lat(), markers[ind].position.lng()),
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: areUnitsImperial ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC
        };

        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setMap(map);
                directionsDisplay.setDirections(response);
            }
            $('#directions-panel, .map-wrapper, #backToResults').addClass('directions-shown');
        });
    }
}

function showDistancesFromShopsToUser() {
    $('.shops-list > li').each(function () {
        var shop = $(this);
        var ind = shop.attr('data-ind');

        if (markers[ind] != null) {
            getDistanceToPosition(markers[ind].position, shop);
        }
    });

    $('#sortingSelect option[value="sortbydistance"]').attr('selected', 'selected');
    sortShopsByDistance();
}

// Converts from degrees to radians.
Math.toRadians = function (degrees) {
    return degrees * Math.PI / 180;
};

function getDistanceToPosition(destination, shop) {

    // Code taken from http://www.movable-type.co.uk/scripts/latlong.html

    // Google says:
    // 1 kilometer = 0.621371192 miles
    // 1 mile = 1.609344 kilometers
    var areUnitsImperial = $('.shop-resources').attr('data-units') == 'Imperial';

    var radius = 6371e3;
    var lat1 = Math.toRadians(userMarker.position.lat());
    var lng1 = Math.toRadians(userMarker.position.lng());
    var lat2 = Math.toRadians(destination.lat());
    var lng2 = Math.toRadians(destination.lng());
    var deltaLat = lat2 - lat1;
    var delatLng = lng2 - lng1;

    var a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(delatLng / 2) * Math.sin(delatLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = radius * c / 1000;

    if (areUnitsImperial) {
        shop.find('.distance-value').html(Math.round((d * 0.621371192)) + ' mi.');
        shop.find('.distanceToShopValue').val((d * 0.621371192));
    } else {
        shop.find('.distance-value').html(Math.round(d) + ' km.');
        shop.find('.distanceToShopValue').val(d);
    }
}

// Sorting and Filtering

function sortShopsBySelectedMethod() {
    var sortMethod = $('#sortingSelect').val();

    if (sortMethod == 'sortbydistance') {
        sortShopsByDistance();
    } else if (sortMethod == 'sortbyname') {
        sortShopsByName();
    } else if (sortMethod == 'sortbyid') {
        sortShopsById();
    }
}

function sortShopsByName() {
    var shops = $('.shops-list > li');
    shops.sort(function (a, b) {
        var aName = $(a).find('.shop-name').html();
        var bName = $(b).find('.shop-name').html();

        return aName.localeCompare(bName);
    });

    $('.shops-list').html(shops);
}

function sortShopsByDistance() {
    if (!isUserMarkerCreated) {
        return;
    }

    var shops = $('.shops-list > li');
    shops.sort(function (a, b) {
        var aDist = parseFloat($(a).find('.distanceToShopValue').val());
        var bDist = parseFloat($(b).find('.distanceToShopValue').val());

        return aDist - bDist;
    });

    $('.shops-list').html(shops);
}

function sortShopsById() {
    if (!isUserMarkerCreated) {
        return;
    }

    var shops = $('.shops-list > li');
    shops.sort(function (a, b) {
        var aId = parseInt($(a).attr('data-ind'));
        var bId = parseInt($(b).attr('data-ind'));

        return aId - bId;
    });

    $('.shops-list').html(shops);
}

function searchForShopsMatchingTheSearchCriteria() {
    var shouldSearchByDistanceCriteria = isUserMarkerCreated;
    var searchedTag = $('#searchByTagsInput').val();
    var shouldSearchByTagsCriteria = searchedTag.length > 2;

    var radius = parseFloat($('#searchRadius').val());
    if (isNaN(radius)) {
        shouldSearchByDistanceCriteria = false;
    }

    if (!shouldSearchByDistanceCriteria && !shouldSearchByTagsCriteria) {
        return;
    }

    $('.shops-list > li').each(function () {
        var shop = $(this);
        var ind = parseInt(shop.attr('data-ind'));

        var doesDistanceCriteriaMatch = true;
        var doesTagsCriteriaMatch = true;

        if (shouldSearchByDistanceCriteria) {
            var distanceToShop = parseFloat(shop.find('.distanceToShopValue').val());
            if (distanceToShop > radius) {
                doesDistanceCriteriaMatch = false;
            }
        }

        if (shouldSearchByTagsCriteria) {
            var shopTags = shop.find('.shop-tags-hidden-field').val();

            if (shopTags == undefined || shopTags.indexOf(searchedTag) == -1) {
                doesTagsCriteriaMatch = false;
            }
        }

        if (doesDistanceCriteriaMatch && doesTagsCriteriaMatch) {
            shop.show();
            if (markers[ind] != null) {
                markers[ind].setMap(map);
            }
        } else {
            shop.hide();
            if (markers[ind] != null) {
                markers[ind].setMap(null);
            }
        }
    });

    if ($('.shops-list > li:visible').length == 0) {
        $('.no-shops-after-filtering').show();
    }
    else {
        $('.no-shops-after-filtering').hide();
    }

    sortShopsBySelectedMethod();
}
