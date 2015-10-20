var mapWrapperId = 'shop-map-holder';
var shopCoordinatesElementClass = '.shop-coordinates';
var shopElement;

var directionsService;
var directionsDisplay;

var map;
var markers = [];
var userMarker;
var isUserMarkerCreated = false;

var shopX = 0;
var shopY = 0;

$(document).ready(function () {
    if ($(shopCoordinatesElementClass).length > 0 && document.getElementById(mapWrapperId) != null) {

        shopElement = $(shopCoordinatesElementClass);

        shopX = shopElement.attr('data-latitude');
        shopY = shopElement.attr('data-longitude');

        loadMapScript();

        $('.shop-map-images .main-picture-link, .all-shop-images > li > a').magnificPopup({
            type: 'image',
            removalDelay: 300,
            gallery: {
                enabled: true
            }
        });

        $('.get-directions-to-shop').one('click', function (e) {
            e.preventDefault();

            getUserGeoLocation();
        });
    }
});

function loadMapScript() {
    var script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?sensor=false&sensor=false&callback=initializeMap";
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

    google.maps.event.addListenerOnce(map, 'idle', onMapLoad);
}

function onMapLoad() {

    var shopLatLng = {
        lat: shopX,
        lng: shopY
    };
    addMarker(shopLatLng, shopElement.siblings('h1').text(), false);

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setPanel(document.getElementById('directions-panel'));
}

function addMarker(latLngObject, title, isDraggable) {

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(latLngObject.lat, latLngObject.lng),
        map: map,
        title: title,
        draggable: isDraggable
    });
    markers.push(marker);
    marker.setMap(map);

    map.setCenter(new google.maps.LatLng(latLngObject.lat, latLngObject.lng));

    return markers.length-1;
}

// Sets the map on all markers in the array.
function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
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

function getUserGeoLocation() {
    var message = 'Geolocation is not supported by this browser.';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {//watchPosition
            message = 'Now we use your current position. ( Maybe a confirmation is required by the browser to use it. )';
            //message = "Latitude: " + position.coords.latitude + ", Longitude: " + position.coords.longitude;

            var userCoords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            createUserMarker(userCoords);
            userMarker.setPosition(userCoords);
            map.setCenter(userCoords);

            showDirectionsToShop();
        });
    }

    return message;
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

        isUserMarkerCreated = true;

        google.maps.event.addListener(marker, 'dragend', function () {
            showDirectionsToShop();
        });
    }
}

function showDirectionsToShop() {
    if (isUserMarkerCreated && markers[0] != null) {
        var areUnitsImperial = $('.shop-resources').attr('data-units') == 'Imperial';

        var request = {
            origin: new google.maps.LatLng(userMarker.position.lat(), userMarker.position.lng()),
            destination: new google.maps.LatLng(markers[0].position.lat(), markers[0].position.lng()),
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: areUnitsImperial ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC
        };
        
        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setMap(map);
                directionsDisplay.setDirections(response);
            }
            $('#directions-panel').addClass('directions-shown');
        });
    }
}
