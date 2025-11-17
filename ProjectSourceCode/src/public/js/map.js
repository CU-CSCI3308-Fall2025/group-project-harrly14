let map;
let infoWindow;
const markers = [];

const customParkingLots = [
  {
    lotId: 1,
    displayName: 'Euclid Garage',
    formattedAddress: "1725 Euclid Ave Euclid Parking Garage, Boulder, CO 80309",
    location: { lat: 40.006, lng: -105.2706 },
    availability: null,
    businessStatus: "Operational"
  }
];

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

  loadCustomParking(AdvancedMarkerElement);

  const toggleButton = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('sidebar');

  toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');

    toggleButton.textContent = sidebar.classList.contains('hidden')
      ? 'Show List'
      : 'Hide List';
  });
}

function loadCustomParking(AdvancedMarkerElement) {
  const placeList = document.getElementById("place-list");
  placeList.innerHTML = '';

  const bounds = new google.maps.LatLngBounds();

  customParkingLots.forEach((place) => {
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

    const openInfoWindow = async() => {
      infoWindow.close();

      const response = await fetch(`/api/availability/${place.lotId}`);
      const data = await response.json();
      const availability = data.available ?? "Unknown";

      const content = document.createElement('div');
      content.className = 'info-window-content';
      content.innerHTML = `
        <h3>${place.displayName}</h3>
        <p><strong>Address:</strong> ${place.formattedAddress}</p>
        <p><strong>Status:</strong> ${place.businessStatus}</p>
        <p><strong>Availability:</strong> ${availability}</p>
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
}

window.onload = initMap;
