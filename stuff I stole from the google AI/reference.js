let map;
let infoWindow;
const reportsByLot = {};
let currentLotName = null; // To store the name of the currently selected lot

async function initMap() {
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center: { lat: 34.0522, lng: -118.2437 }, // Centered on a sample campus location
    zoom: 15,
    mapId: 'DEMO_MAP_ID'
  });

  infoWindow = new InfoWindow();

  // Sample GeoJSON data for parking lots. Replace with your own data.
  const parkingLotsGeoJSON = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "name": "Parking Lot A" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-118.246, 34.054], [-118.246, 34.052], [-118.244, 34.052], [-118.244, 34.054], [-118.246, 34.054]]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Parking Lot B" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-118.243, 34.053], [-118.243, 34.051], [-118.241, 34.051], [-118.241, 34.053], [-118.243, 34.053]]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Parking Lot C" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-118.248, 34.051], [-118.248, 34.049], [-118.246, 34.049], [-118.246, 34.051], [-118.248, 34.051]]]
        }
      }
    ]
  };

  map.data.addGeoJson(parkingLotsGeoJSON);

  map.data.setStyle({
    fillColor: 'blue',
    strokeWeight: 1
  });

  map.data.addListener('click', function(event) {
    const lotName = event.feature.getProperty('name');
    currentLotName = lotName; // Update the state to the currently clicked lot.

    // Dynamically create the content for the InfoWindow to prevent DOM errors.
    const content = document.createElement('div');
    content.id = 'info-content';

    const title = document.createElement('h2');
    title.textContent = lotName;
    content.appendChild(title);

    const reportsList = document.createElement('div');
    reportsList.id = 'reports-list';
    reportsList.innerHTML = '<h3>Current Reports</h3>';
    if (reportsByLot[lotName] && reportsByLot[lotName].length > 0) {
      reportsByLot[lotName].forEach(report => {
        const p = document.createElement('p');
        p.textContent = report;
        reportsList.appendChild(p);
      });
    } else {
      reportsList.innerHTML += '<p>No reports yet.</p>';
    }
    content.appendChild(reportsList);

    const reportForm = document.createElement('div');
    reportForm.className = 'report-form';
    reportForm.innerHTML = '<h3>Add a Report</h3>';

    const reportInput = document.createElement('input');
    reportInput.type = 'text';
    reportInput.id = 'report-input';
    reportInput.placeholder = "e.g., 'Lot is full'";

    const submitButton = document.createElement('button');
    submitButton.id = 'submit-report';
    submitButton.textContent = 'Submit';

    reportForm.appendChild(reportInput);
    reportForm.appendChild(submitButton);
    content.appendChild(reportForm);

    // Add the event listener to the dynamically created button.
    submitButton.addEventListener('click', () => {
      const reportText = reportInput.value;
      if (reportText && currentLotName) {
        if (!reportsByLot[currentLotName]) {
          reportsByLot[currentLotName] = [];
        }
        reportsByLot[currentLotName].push(reportText);
        reportInput.value = '';
        infoWindow.close(); // Close the window; it will be regenerated on the next click.
      }
    });

    infoWindow.setContent(content);
    infoWindow.setPosition(event.latLng);
    infoWindow.open(map);
  });
}

initMap();