mapboxgl.accessToken = 'pk.eyJ1Ijoia2FpMTU2NzIiLCJhIjoiY21ibGJneTNlMHh4YjJsb2lmaWE3d2lvZSJ9.loXTJLQsuyE93k2E80zCVw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-98.5, 35.5],
  zoom: 7,
  minZoom: 6
});

// This function runs once the base map has finished loading
map.on('load', () => {
  console.log("Map loaded. Fetching geology data...");

  fetch('data/okgeol_dd_polygon.json')
    .then(response => response.json())
    .then(geologyData => {

      console.log("Geology data loaded successfully:", geologyData);

      // Color Palette for polygon fill color
      const colorPalette = [
        '#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', 
        '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec'
      ];
      // Collects a set of all unique ages and rock types from geojson data
      const uniqueAges = new Set();
      const uniqueRockTypes = new Set();
      for (const feature of geologyData.features) {
        uniqueAges.add(feature.properties.UNIT_AGE);
        uniqueRockTypes.add(feature.properties.ROCKTYPE1);
        uniqueRockTypes.add(feature.properties.ROCKTYPE2);
      }

      // Builds fill-color attribute for geography layer
      let rockTypeFillColor = ['match', ['get', 'ROCKTYPE1']];
      let i = 0;
      uniqueRockTypes.forEach(rockType => {
        rockTypeFillColor.push(rockType, colorPalette[i % colorPalette.length]);
        i++;
      })
      rockTypeFillColor.push('#cccccc')

      map.addSource('geology-data-source', {
        'type': 'geojson',
        'data': geologyData
      });

      map.addLayer({
        'id': 'geology-polygons-layer',
        'type': 'fill',
        'source': 'geology-data-source',
        'paint': {
          'fill-color': rockTypeFillColor,
          'fill-opacity': 0.7,
          'fill-outline-color': [
            'interpolate', ['linear'], ['zoom'],
            6, 'rgba(0, 0, 0, 0)',
            15, 'rgba(0, 0, 0, 1)'
          ]
        }
      });

      console.log("Geology layer has been added to the map.");

    })
    .catch(error => {
      console.error('Error loading the geology data:', error);
    });

  let curMarker = null;
  map.on('click', 'geology-polygons-layer', (e) => {
    // Creates marker and deletes all previous ones
    if (curMarker != null) { curMarker.remove(); }
    curMarker = new mapboxgl.Marker()
      .setLngLat(e.lngLat)
      .addTo(map)

    const infoTab = document.getElementById("info-tab");
    const featureProperties = e.features[0].properties;
    const infoTabHTML = `
      <p><strong>Main Rock Type:</strong> ${featureProperties.ROCKTYPE1}</p>
      <p><strong>Age:</strong> ${featureProperties.UNIT_AGE}</p>
      `
    infoTab.innerHTML = infoTabHTML;
    infoTab.className = '';
  });

  map.on('mouseenter', 'geology-polygons-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  })

  map.on('mouseleave', 'geology-polygons-layer', () => {
    map.getCanvas().style.cursor = '';
  })

  const coordBox = document.getElementById("cursorCoordBox");
  map.on('mousemove', (e) => {
    let cursorCoords = e.lngLat.wrap();
    coordBox.innerHTML = `
    <p>Lng: ${cursorCoords.lng.toFixed(4)}</p>
    <p>Lat: ${cursorCoords.lat.toFixed(4)}</p>
    `;
  })
});