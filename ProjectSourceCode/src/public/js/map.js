let map;
let infoWindow;
const markers = [];
const labelMarkers = [];
let allFeatures = []; //store for filtering

async function initMap() {
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const universityOfColorado = { lat: 40.0076, lng: -105.2659 };

  map = new Map(document.getElementById("map"), {
    center: universityOfColorado,
    zoom: 15,
    mapId: "DEMO_MAP_ID",
    gestureHandling: "greedy",
  });

  infoWindow = new InfoWindow();

  try {
    await drawLotsFromAPI('/parking-lots.js');
  } catch (e) {
    console.warn('Failed to load polygons from server, falling back to Places', e);
    const { Place } = await google.maps.importLibrary("places");
    await findParking(Place, AdvancedMarkerElement);
  }

  const toggleButton = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('sidebar');

  toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    if (sidebar.classList.contains('hidden')) {
        toggleButton.textContent = 'Show List';
    } else {
        toggleButton.textContent = 'Hide List';
    }
  });
  
  const filterCheckboxes = document.querySelectorAll('.type-filter');
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  const selectedTypes = Array.from(document.querySelectorAll('.type-filter:checked'))
    .map(cb => cb.value);

  const filteredFeatures = allFeatures.filter(feature => {
    const types = feature.properties.Types || [];
    return selectedTypes.some(selectedType => types.includes(selectedType));
  });

  drawFeatures(filteredFeatures);
}

// fetch GeoJSON from the server and render polygons
async function drawLotsFromAPI(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch parking lots from server');
  const geojson = await res.json();
  if (!geojson || !geojson.features || geojson.features.length === 0) throw new Error('No features returned');

  // Store all features for filtering
  allFeatures = geojson.features;

  // Initial draw
  drawFeatures(allFeatures);
}

function drawFeatures(features) {
  // Clear existing
  map.data.forEach(f => map.data.remove(f));
  labelMarkers.forEach(m => m.setMap(null));
  labelMarkers.length = 0;

  // Add filtered features
  map.data.addGeoJson({ type: 'FeatureCollection', features });

  // style polygons
  map.data.setStyle({
    fillColor: '#1a73e8',
    strokeColor: '#0b5ed7',
    strokeWeight: 1,
    fillOpacity: 0.45
  });

  const placeList = document.getElementById('place-list');
  placeList.innerHTML = '';

  const bounds = new google.maps.LatLngBounds();

  features.forEach(feature => {
    const props = feature.properties || {};
    const name = props.lot_location || props.LotNumber || `Lot ${props.lot_id || ''}`;
    const lotNumber = props.LotNumber || props.lot_id || '?';
    const types = props.Types || [];
    
    const listItem = document.createElement('div');
    listItem.className = 'place-item';
    listItem.innerHTML = `<h3>${name}</h3>
                          <p>Type: ${types.join(', ')}</p>
                          <p>Capacity: ${props.capacity ?? 'n/a'}</p>`;
    placeList.appendChild(listItem);

    const centroid = computeCentroid(feature.geometry);

    const openInfoWindowForLot = () => {
      const content = document.createElement('div');
      content.className = 'info-window-content';
      content.innerHTML = `<h3>${name}</h3>
                           <p>Type: ${types.join(', ')}</p>
                           <p>Capacity: ${props.capacity ?? 'n/a'}</p>
                           <p>Occupancy: ${props.current_occupancy ?? 'n/a'}</p>`;
      infoWindow.setContent(content);

      if (centroid) {
        infoWindow.setPosition(centroid);
        infoWindow.open(map);
        map.panTo(centroid);
      }
    };

    listItem.addEventListener('click', openInfoWindowForLot);

    const geom = feature.geometry;
    if (geom.type === 'Polygon') {
      geom.coordinates[0].forEach(([lng, lat]) => bounds.extend({ lat, lng }));
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(poly => poly[0].forEach(([lng, lat]) => bounds.extend({ lat, lng })));
    }

    if (centroid) {
      const labelDiv = document.createElement('div');
      labelDiv.className = 'lot-label';
      labelDiv.textContent = lotNumber;

      const labelMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: centroid,
        content: labelDiv,
      });

      labelMarker.addListener('click', openInfoWindowForLot);
      labelMarkers.push(labelMarker);
    }
  });

  map.data.addListener('click', event => {
    const feature = event.feature;
    const name = feature.getProperty('lot_location') || feature.getProperty('LotNumber') || 'Parking Lot';
    const capacity = feature.getProperty('capacity');
    const occupancy = feature.getProperty('current_occupancy');
    const types = feature.getProperty('Types') || [];

    const content = document.createElement('div');
    content.className = 'info-window-content';
    content.innerHTML = `<h3>${name}</h3>
                         <p>Type: ${types.join(', ')}</p>
                         <p>Capacity: ${capacity ?? 'n/a'}</p>
                         <p>Occupancy: ${occupancy ?? 'n/a'}</p>`;
    infoWindow.setContent(content);
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
  });

  if (features.length > 0) {
    map.fitBounds(bounds);
  }
}

function computeCentroid(geometry) {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0]; // outer ring
    if (!coords || coords.length === 0) return null;
    let sumLat = 0, sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
  } else if (geometry.type === 'MultiPolygon') {
    // use the first polygon's centroid
    const firstPoly = geometry.coordinates[0];
    if (!firstPoly || !firstPoly[0]) return null;
    const coords = firstPoly[0];
    let sumLat = 0, sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
  }
  return null;
}

async function findParking(Place, AdvancedMarkerElement) {
  const request = {
    textQuery: "parking at University of Colorado Boulder",
    fields: ["displayName", "location", "formattedAddress", "businessStatus"],
    locationBias: map.getCenter(),
  };

  try {
    const { places } = await Place.searchByText(request);

    if (places.length) {
      const bounds = new google.maps.LatLngBounds();
      const placeList = document.getElementById("place-list");
      placeList.innerHTML = ''; // Clear previous results

      places.forEach((place) => {
        const marker = new AdvancedMarkerElement({
          map,
          position: place.location,
          title: place.displayName
        });

        markers.push(marker);

        const listItem = document.createElement("div");
        listItem.className = "place-item";
        listItem.innerHTML = `
          <h3>${place.displayName}</h3>
          <p>${place.formattedAddress}</p>
        `;
        placeList.appendChild(listItem);

        const openInfoWindow = () => {
          infoWindow.close();

          const content = document.createElement('div');
          content.className = 'info-window-content';
          content.innerHTML = `
            <h3>${place.displayName}</h3>
            <p><strong>Address:</strong> ${place.formattedAddress}</p>
            <p><strong>Status:</strong> ${place.businessStatus}</p>
          `;
          infoWindow.setContent(content);

          infoWindow.open({
            anchor: marker,
            map: map
          });
        };

        marker.addListener("click", openInfoWindow);
        listItem.addEventListener("click", openInfoWindow);

        bounds.extend(place.location);
      });

      map.fitBounds(bounds);
    } else {
      console.log("No parking places found");
    }
  } catch (error) {
    console.error("Error searching for parking:", error);
  }
}

window.onload = initMap;