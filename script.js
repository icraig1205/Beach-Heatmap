// Create the map centered on Ontario
var map = L.map('map').setView([44.0, -79.5], 6);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

var heatLayer;

// Add legend
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>Water Quality</h4>";
    div.innerHTML += '<i style="background: #006400"></i><span>Excellent (<5%)</span><br>';
    div.innerHTML += '<i style="background: #00A000"></i><span>Good (5–20%)</span><br>';
    div.innerHTML += '<i style="background: #FFA500"></i><span>Fair (20–30%)</span><br>';
    div.innerHTML += '<i style="background: #FF0000"></i><span>Poor (>30%)</span><br>';
    return div;
};

legend.addTo(map);

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
