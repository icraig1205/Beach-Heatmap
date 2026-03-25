// ------------------------------------------------------------
// 1. Create the map
// ------------------------------------------------------------
var map = L.map('map').setView([44.0, -79.5], 6);

// Basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

// Layers
var heatLayer;
var pointLayer;
var layerControl;

// Data storage
var fullYearData = null;
var currentWeek = 1;


// ------------------------------------------------------------
// 2. Legend
// ------------------------------------------------------------
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


// ------------------------------------------------------------
// 3. Load a year of data
// ------------------------------------------------------------
function loadYear(year) {
    fetch(`data/${year}.geojson`)
        .then(response => response.json())
        .then(data => {

            fullYearData = data;

            // Extract available weeks
            const weeks = [...new Set(
                data.features.map(f => f.properties.week)
            )].sort((a, b) => a - b);

            // Update slider
            const slider = document.getElementById("weekSlider");
            slider.min = weeks[0];
            slider.max = weeks[weeks.length - 1];
            slider.value = weeks[0];

            document.getElementById("weekLabel").textContent = weeks[0];

            currentWeek = weeks[0];

            updateMapForWeek(currentWeek);
        });
}


// ------------------------------------------------------------
// 4. Update map for selected week
// ------------------------------------------------------------
function updateMapForWeek(week) {

    week = Number(week);
    currentWeek = week;

    // --- 1. Detect active layer BEFORE removing anything ---
    const wasUsingPoints = pointLayer && map.hasLayer(pointLayer);
    const wasUsingHeat = heatLayer && map.hasLayer(heatLayer);

    // --- 2. Filter data ---
    const filtered = {
        type: "FeatureCollection",
        features: fullYearData.features.filter(f => f.properties.week === week)
    };

    // --- 3. Remove old layers ---
    if (heatLayer) map.removeLayer(heatLayer);
    if (pointLayer) map.removeLayer(pointLayer);

    // --- 4. Build heatmap ---
    const heatPoints = filtered.features.map(f => {
        const lat = f.geometry.coordinates[1];
        const lon = f.geometry.coordinates[0];
        let weight = f.properties.rate_postings_percent || 0;
        if (weight === 0) weight = 0.001;
        return [lat, lon, weight];
    });

    heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 10
    });

    // --- 5. Build point layer ---
    pointLayer = L.geoJSON(filtered, {
        pointToLayer: function (feature, latlng) {
            const rate = feature.properties.rate_postings_percent;

            const color =
                rate < 5 ? "#006400" :
                rate <= 20 ? "#00A000" :
                rate <= 30 ? "#FFA500" :
                "#FF0000";

            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: color,
                color: "#000",
                weight: 1,
                fillOpacity: 0.85
            });
        }
    });

    // --- 6. Restore whichever layer the user was viewing ---
    if (wasUsingPoints) {
        pointLayer.addTo(map);
    } else if (wasUsingHeat) {
        heatLayer.addTo(map);
    } else {
        heatLayer.addTo(map); // first load
    }

    // --- 7. Rebuild layer toggle ---
    if (layerControl) layerControl.remove();

    layerControl = L.control.layers(
        { "Heatmap": heatLayer, "Points": pointLayer },
        null,
        { collapsed: false }
    ).addTo(map);
}


// ------------------------------------------------------------
// 5. Event listeners
// ------------------------------------------------------------

// Year dropdown
document.getElementById("yearSelect").addEventListener("change", function () {
    loadYear(this.value);
});

// Week slider
document.getElementById("weekSlider").addEventListener("input", function () {
    const week = Number(this.value);
    document.getElementById("weekLabel").textContent = week;
    updateMapForWeek(week);
});


// ------------------------------------------------------------
// 6. Initial load
// ------------------------------------------------------------
loadYear("2025");
