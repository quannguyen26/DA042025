// map class inittialize
nenvn = L.layerGroup()
var Stadia_OSMBright = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    //attribution: '&copy; <a href="">5MTech</a>',
    minZoom: 7,
    maxZoom: 10,
    opacity: 1,
}).addTo(nenvn)

var map = L.map('map',{
    layers:[nenvn],
    maxBounds:[
            [23.3924, 102.1444], // Top-left corner (Northwest)
            [8.1791, 109.4644]   // Bottom-right corner (Southeast)
        ],
    center:[21.33163, 103.90288],
    zoom:9,
    minZoom:8,
    maxZoom:12
})

map.zoomControl.setPosition('topright');

// Add scale map
L.control.scale({position:'bottomright'}).addTo(map);

// var baseMaps = {
//     "Stadia_OSMBright":Stadia_OSMBright,
// };

var overlayMaps = {
};

var layerControl = L.control.layers(null, overlayMaps,{collapsed:false,position:'topleft'}).addTo(map);

map.createPane('paneProvinces');
map.createPane('paneDistricts');

map.getPane('paneProvinces').style.zIndex = 500;
map.getPane('paneDistricts').style.zIndex = 400;

var districts=L.geoJSON(data_districts,{
    pane: 'paneDistricts',
    style: {
            color: 'red',
            weight: 0.5,
            fillColor: 'transparent',
                },
    onEachFeature: (feature, layer) => {
            if (feature.properties) {
                layer.bindPopup(`${feature.properties.TYPE_3} ${feature.properties.NAME_3} <br> (${feature.properties.NAME_2})`);
                 }}
});

var provinces=L.geoJSON(data_provinces,{
    pane: 'paneProvinces',
    style: {
            color: 'black',
            weight: 1.2,
            fillColor: 'transparent',
            fillOpacity: 1
                },
    onEachFeature: (feature, layer) => {
            if (feature.properties) {
                layer.bindPopup(`${feature.properties.ADM2_VI}`);
                }}        
}).addTo(map);

// layerControl.addOverlay(provinces,"Huyện");
layerControl.addOverlay(districts,"Xã");


// ---------------------------------
let activePane = "paneProvinces";


let drawnItemsProvinces = new L.FeatureGroup();
let drawnItemsDistricts = new L.FeatureGroup();

let drawnItems = drawnItemsProvinces ;

let drawControl;

function updateDrawControl() {
    if (drawControl) {
        map.removeControl(drawControl); // Remove the old control
    };
    drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
        },
        position: 'topright',
        draw: {
            polyline: false,
            polygon: {
                shapeOptions: {
                    color: 'blue',
                    weight: 2,
                    fillColor: 'white',
                    pane: activePane
                }
            },
            rectangle: {
                shapeOptions: {
                    color: 'blue',
                    weight: 2,
                    fillColor: 'white',
                    pane: activePane 
                }
            },
            circle: false,
        }
    });

    map.addControl(drawControl); // Add the updated control
}

updateDrawControl();

map.on('overlayadd',function (event){
     if (event.name === "Xã"){
        activePane = "paneDistricts";
        drawnItems = drawnItemsDistricts
        drawnItemsProvinces.remove()
        drawnItemsDistricts.addTo(map)
        provinces.getLayers().forEach(function(layer){layer.setStyle({fillOpacity: 0})});
        // console.log(activePane);
    } else  {
        activePane="paneProvinces";
        drawnItems = drawnItemsProvinces
        drawnItemsDistricts.remove()
        drawnItemsProvinces.addTo(map)
        provinces.getLayers().forEach(function(layer){layer.setStyle({fillOpacity: 1})});
        // console.log(activePane);
    }
    updateDrawControl();
});

map.on('overlayremove',function (event){
    if (event.name === "Xã"){
        activePane="paneProvinces";
        activeColor="black"
        drawnItems = drawnItemsProvinces
        drawnItemsProvinces.addTo(map)
        drawnItemsDistricts.remove()
        provinces.getLayers().forEach(function(layer){layer.setStyle({fillOpacity: 1})});
        // console.log(activePane)   
    } else {
        activePane="paneDistricts"
        activeColor= "red"
        drawnItems = drawnItemsDistricts
        drawnItemsDistricts.addTo(map)
        drawnItemsProvinces.remove()
    }
    updateDrawControl();
});


// Thêm đối tượng mới vào nhóm
map.on(L.Draw.Event.CREATED, function (event) {
    const layer = event.layer;
    let feature=layer.toGeoJSON();
    if (activePane === "paneProvinces"){
        drawnItemsProvinces.addLayer(layer);
        drawnItemsProvinces.addTo(map);
        data_provinces.features.forEach( function(area) {
            if(turf.intersect(feature,area)){
                provinces.getLayers().forEach(function(layer) {
                    if (layer.feature && layer.feature.properties.ADM2_VI === area.properties.ADM2_VI) {
                        layer.setStyle({
                            fillColor: "yellow",
                            fillOpacity: 1,
                            color: "black",
                            opacity: 1,
                        });
                    }
                });
            }
        });
    } else if (activePane == "paneDistricts" ) {
        drawnItemsDistricts.addLayer(layer)
        drawnItemsDistricts.addTo(map);
        
        data_districts.features.forEach( function(area) {
            if(turf.intersect(feature,area)){
                districts.getLayers().forEach(function(layer) {
                    if (layer.feature && layer.feature.properties.NAME_3 === area.properties.NAME_3) {
                        layer.setStyle({
                            fillColor: "yellow",
                            fillOpacity: 1,
                            color: "red",
                            opacity: 1
                        });
                    }
                });
            }
        });
    }
    
});

// map.on('draw:edited', function(event) {
//     // Iterate over each edited layer
//     event.layers.eachLayer(function(editedLayer) {
//       let editedFeature = editedLayer.toGeoJSON();
  
//       if (activePane === "paneProvinces") {
//         data_provinces.features.forEach(function(area) {
//           // Check for intersection or containment
//           if (turf.intersect(editedFeature, area) || turf.booleanWithin(editedFeature, area)) {
//             map.eachLayer(function(mapLayer) {
//               if (mapLayer.feature && mapLayer.feature.properties.ADM2_VI === area.properties.ADM2_VI) {
//                 mapLayer.setStyle({
//                   fillColor: "yellow",
//                   fillOpacity: 1,
//                   color: "red"
//                 });
//               }
//             });
//           }
//         });
//       } else if (activePane === "paneDistricts") {
//         data_districts.features.forEach(function(area) {
//           if (turf.intersect(editedFeature, area) || turf.booleanWithin(editedFeature, area)) {
//             map.eachLayer(function(mapLayer) {
//               if (mapLayer.feature && mapLayer.feature.properties.NAME_3 === area.properties.NAME_3) {
//                 mapLayer.setStyle({
//                   fillColor: "yellow",
//                   fillOpacity: 1,
//                   color: "red",
//                   pane: 'paneDistricts',
//                 });
//               }
//             });
//           }
//         });
//       }
//     });
//   });
  
  

document.querySelector(".get-info").addEventListener("click",logInfors);
function logInfors(){
    intersectedProvinces=[]
    drawnItemsProvinces.eachLayer(function(layer){
        let feature=layer.toGeoJSON();
        data_provinces.features.forEach(function(area){
            if(turf.intersect(feature,area)){
                intersectedProvinces.push(`${area.properties.ADM2_VI}`)
            }
        })
    });
    console.log([... new Set(intersectedProvinces)].join(", "))

};

document.querySelector(".zoom-layer").addEventListener("click", () => map.setView([21.33163, 103.90288], 9))


