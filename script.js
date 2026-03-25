// Create the map centered on Ontario
var map = L.map('map').setView([44.0, -79.5], 6);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

var heatLayer;

// Load GeoJSON and build heatmap
function loadYear(year) {
    fetch(`data/${year}.geojson`)
        .then(response => response.json())
        .then(data => {
            if (heatLayer) {
                map.removeLayer(heatLayer);
            }

            // Convert GeoJSON to heatmap points
            var heatPoints = data.features.map(f => {
                var lat = f.geometry.coordinates[1];
                var lon = f.geometry.coordinates[0];
                var weight = f.properties.rate_postings;
                if (weight === 0) weight = 0.1;   // give zero values a tiny weight
                return [lat, lon, weight];
            });

            heatLayer = L.heatLayer(heatPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 10
            }).addTo(map);
        });
}

// Load default year
loadYear("2025");

// Dropdown listener
document.getElementById("yearSelect").addEventListener("change", function () {
    loadYear(this.value);
});
