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
});