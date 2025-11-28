let map;
let infoWindow;
const markers = [];
const labelMarkers = [];
let allFeatures = []; //store for filtering
let currentSelectedLotId = null;
let sessionBtn;

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
    console.warn('Failed to load polygons from server', e);
  }

  sessionBtn = document.querySelector('#parking-session .start-session-btn');

  // Add handler for modal button to redirect if not logged in
  const modalBtn = document.getElementById('modal-btn');
  if (modalBtn) {
    modalBtn.addEventListener('click', function(e) {
      if (!window.isLoggedIn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = '/login?message=' + encodeURIComponent('Please log in first.') + '&error=true';
        return;
      }
      // If logged in, allow the modal to open normally
    });
  }

  // Initialize session button text based on DB
  try {
    const res = await fetch('/api/users/current-session');
    const data = await res.json();
    if (data.current_session) {
      sessionBtn.textContent = 'End Parking Session';
    } else {
      sessionBtn.textContent = 'Start Parking Session Here';
    }
  } catch (err) {
    console.error('Failed to fetch current session', err);
  }

  sessionBtn.addEventListener('click', async () => {
    if (!window.isLoggedIn) {
      window.location.href = '/login?message=' + encodeURIComponent('Please log in first.') + '&error=true';
      return;
    }
    if (!currentSelectedLotId) {
      alert('Please select a parking lot first');
      return;
    }

    const isEnding = sessionBtn.textContent.includes('End');

    const endpoint = isEnding ? '/api/parking-sessions/end' : '/api/parking-sessions/start';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotId: currentSelectedLotId })
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        alert(data.error);
        return;
      }

      // Toggle button text based on DB
      sessionBtn.textContent = isEnding ? 'Start Parking Session Here' : 'End Parking Session';

      // Update map occupancy using DB value
      const lotFeature = allFeatures.find(f => {
        const pid = (f.properties !== undefined && f.properties !== null) ? f.properties.lot_id : undefined;
        return pid === currentSelectedLotId;
      });
      if (lotFeature) {
        const props = (lotFeature.properties !== undefined && lotFeature.properties !== null) ? lotFeature.properties : {};
        props.current_occupancy = Math.max(
          0,
          (props.current_occupancy !== undefined && props.current_occupancy !== null ? props.current_occupancy : 0) + (isEnding ? -1 : 1)
        );
        drawFeatures(allFeatures);
      }

      alert(data.message || (isEnding ? 'Parking session ended!' : 'Parking session started!'));
    } catch (err) {
      console.error(err);
      alert('Error updating parking session');
    }
  });
}

function applyFilters() {
  const checked = Array.from(document.querySelectorAll('.type-filter:checked'));
  const selectedTypes = checked.map(cb => cb.value);

  const filteredFeatures = allFeatures.filter(feature => {
    const props = (feature.properties !== undefined && feature.properties !== null) ? feature.properties : {};
    let types = props.Types;
    if (types === undefined || types === null) types = [];
    if (!Array.isArray(types)) types = [types];
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

  // style polygons by type
const typeColors = {
  'Permit':         { fill: '#1E88E5', stroke: '#0D47A1' },
  'Short-term Pay': { fill: '#FF6D00', stroke: '#E65100' },
  'Res-hall Permit':{ fill: '#D81B60', stroke: '#880E4F' },
  'Covered':        { fill: '#00BFA5', stroke: '#00695C' },
  'default':        { fill: '#455A64', stroke: '#263238' }
};

  // style polygons
  const typePriority = ['Covered', 'Res-hall Permit', 'Short-term Pay', 'Permit'];

  map.data.setStyle(feature => {
    let types = feature.getProperty('Types');
    if (types === undefined || types === null) types = [];
    if (!Array.isArray(types)) types = [types];

    // choose first type that appears in the priority list, otherwise use the first type, otherwise 'default'
    let selectedType = types.find(t => typePriority.includes(t));
    if (selectedType === undefined) selectedType = (types.length > 0 ? types[0] : 'default');
    if (!typeColors[selectedType]) selectedType = 'default';
    const cols = typeColors[selectedType];

    return {
      fillColor: cols.fill,
      strokeColor: cols.stroke,
      strokeWeight: 1,
      fillOpacity: 0.45
    };
  });

  const placeList = document.getElementById('place-list');
  placeList.innerHTML = '';

  const bounds = new google.maps.LatLngBounds();

  features.forEach(feature => {
    const props = (feature.properties !== undefined && feature.properties !== null) ? feature.properties : {};
    const name = (props.lot_id !== undefined && props.lot_id !== null) ? props.lot_id : (props.LotNumber !== undefined && props.LotNumber !== null ? props.LotNumber : 'Parking Lot');
    const lotNumber = (props.LotNumber !== undefined && props.LotNumber !== null) ? props.LotNumber : ((props.lot_id !== undefined && props.lot_id !== null) ? props.lot_id : '?');
    let types = props.Types;
    if (types === undefined || types === null) types = [];
    if (!Array.isArray(types)) types = [types];
    
    const listItem = document.createElement('div');
    listItem.className = 'place-item';
    listItem.innerHTML = `<h3>${name}</h3>
                          <p>Type: ${types.join(', ')}</p>
                          <p>Capacity: ${ (props.capacity !== undefined && props.capacity !== null) ? props.capacity : 'n/a' }</p>`;

    listItem.addEventListener('click', () => {
      currentSelectedLotId = (props.lot_id !== undefined && props.lot_id !== null) ? props.lot_id : null;
      openInfoWindowForLot();
    });

    placeList.appendChild(listItem);

    const centroid = computeCentroid(feature.geometry);

    const openInfoWindowForLot = () => {
      const content = document.createElement('div');
      content.className = 'info-window-content';
      content.innerHTML = `<h3>${name}</h3>
                           <p>Type: ${types.join(', ')}</p>
                           <p>Capacity: ${ (props.capacity !== undefined && props.capacity !== null) ? props.capacity : 'n/a' }</p>
                           <p>Occupancy: ${ (props.current_occupancy !== undefined && props.current_occupancy !== null) ? props.current_occupancy : 'n/a' }</p>`;
      infoWindow.setContent(content);

      if (centroid) {
        infoWindow.setPosition(centroid);
        infoWindow.open(map);
        map.panTo(centroid);
      }
    };

    const geom = feature.geometry;
    if (geom && geom.type === 'Polygon') {
      const ring = geom.coordinates[0] || [];
      ring.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
    } else if (geom && geom.type === 'MultiPolygon') {
      (geom.coordinates || []).forEach(poly => (poly[0] || []).forEach(([lng, lat]) => bounds.extend({ lat, lng })));
    }

    if (centroid) {
      // compute label color based on same type logic used for polygons
      let labelTypes = types;
      if (!Array.isArray(labelTypes)) labelTypes = [labelTypes];
      let labelSelectedType = labelTypes.find(t => typePriority.includes(t));
      if (labelSelectedType === undefined) labelSelectedType = (labelTypes.length > 0 ? labelTypes[0] : 'default');
      if (!typeColors[labelSelectedType]) labelSelectedType = 'default';
      const labelCols = typeColors[labelSelectedType];

      const labelDiv = document.createElement('div');
      labelDiv.className = 'lot-label';
      labelDiv.textContent = lotNumber;
      labelDiv.style.color = labelCols.stroke;
      labelDiv.style.borderColor = labelCols.stroke;
      labelDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';

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
    let name = feature.getProperty('lot_id');
    if (name === undefined || name === null) name = feature.getProperty('LotNumber') || 'Parking Lot';
    let capacity = feature.getProperty('capacity');
    if (capacity === undefined || capacity === null) capacity = 'n/a';
    let occupancy = feature.getProperty('current_occupancy');
    if (occupancy === undefined || occupancy === null) occupancy = 'n/a';
    let types = feature.getProperty('Types');
    if (types === undefined || types === null) types = [];
    if (!Array.isArray(types)) types = [types];

    const content = document.createElement('div');
    content.className = 'info-window-content';
    content.innerHTML = `<h3>${name}</h3>
                         <p>Type: ${types.join(', ')}</p>
                         <p>Capacity: ${capacity}</p>
                         <p>Occupancy: ${occupancy}</p>`;
    infoWindow.setContent(content);
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
  });

  if (features.length > 0) {
    map.fitBounds(bounds);
  }
}

function computeCentroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates && geometry.coordinates[0] ? geometry.coordinates[0] : []; // outer ring
    if (!coords || coords.length === 0) return null;
    let sumLat = 0, sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return { lat: sumLat / coords.length, lng: sumLng / coords.length };
  } else if (geometry.type === 'MultiPolygon') {
    // use the first polygon's centroid
    const firstPoly = geometry.coordinates && geometry.coordinates[0] ? geometry.coordinates[0] : null;
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

function saveEvent() {
  if (!window.isLoggedIn) {
    window.location.href = '/login?message=' + encodeURIComponent('Please log in first.') + '&error=true';
    return;
  }
  
  // Get the selected lot ID from the dropdown
  const lotId = document.getElementById('lot-id').value;
  if (!lotId) {
    alert('Please select a parking lot.');
    return;
  }
  
  // TODO: Add report submission logic here (e.g., send to server with lotId, report type, etc.)
  console.log('Selected Lot ID:', lotId);
  alert('Report submission not yet implemented');
}

window.onload = initMap;