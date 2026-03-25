// Create the map centred on Ontario
var map = L.map('map').setView([44.0, -79.5], 6);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Layers
var heatLayer;
var pointLayer;

// Legend
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

//Week slider
var fullYearData = null;  // stores all weekly records for the selected year
var currentWeek = 1;

// Load GeoJSON and build layers
function loadYear(year) {
    fetch(`data/${year}.geojson`)
        .then(response => response.json())
        .then(data => {

            // Remove old layers
            if (heatLayer) map.removeLayer(heatLayer);
            if (pointLayer) map.removeLayer(pointLayer);

            // Build heatmap points
            var heatPoints = data.features.map(f => {
                var lat = f.geometry.coordinates[1];
                var lon = f.geometry.coordinates[0];
                var weight = f.properties.rate_postings_percent || 0;
                if (weight === 0) weight = 0.1; // ensure visibility
                return [lat, lon, weight];
            });

            // Create heatmap layer
            heatLayer = L.heatLayer(heatPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 10
            });

            // Create category-colored point layer
            pointLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    let rate = feature.properties.rate_postings_percent;

                    let color =
                        rate < 5 ? "#006400" :        // Excellent
                        rate <= 20 ? "#00A000" :      // Good
                        rate <= 30 ? "#FFA500" :      // Fair
                        "#FF0000";                    // Poor

                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: color,
                        color: "#000",
                        weight: 1,
                        fillOpacity: 0.85
                    });
                }
            });

            // Default layer (heatmap)
            heatLayer.addTo(map);

            // Update layer control
            layerControl.remove();
            layerControl = L.control.layers(
                { "Heatmap": heatLayer, "Points": pointLayer },
                null,
                { collapsed: false }
            ).addTo(map);
}

// Create an empty layer control (will be populated after loading data)
var layerControl = L.control.layers(null, null, { collapsed: false }).addTo(map);

// Load default year
loadYear("2025");

// Dropdown listener
document.getElementById("yearSelect").addEventListener("change", function () {
    loadYear(this.value);
});
