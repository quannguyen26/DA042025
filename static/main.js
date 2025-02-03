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
            [23.3924, 102.1444], 
            [8.1791, 109.4644]   
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
            weight: 1.3,
            fillColor: 'transparent'
                },
    onEachFeature: (feature, layer) => {
            if (feature.properties) {
                layer.bindPopup(`${feature.properties.TYPE_2} ${feature.properties.NAME_2}`);
                }},       
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
    map.closePopup();
     if (event.name === "Xã"){
        activePane = "paneDistricts";
        drawnItems = drawnItemsDistricts;
        drawnItemsProvinces.remove();
        drawnItemsDistricts.addTo(map);
        provinces.getLayers().forEach(function(layer){
            layer.setStyle({fillOpacity: 0});
            layer.on('click', function(e) {
                let clickLatLng = e.latlng;
                let pt = turf.point([clickLatLng.lng, clickLatLng.lat]);
                var foundDistrict = null;
                districts.eachLayer(function(districtLayer) {
                    if (turf.booleanPointInPolygon(pt, districtLayer.feature)) {
                      foundDistrict = districtLayer;
                      foundDistrict.openPopup(clickLatLng);
                    e.originalEvent.stopPropagation();
                    }
                });
              });
    }); 
    } else  {
        activePane="paneProvinces";
        drawnItems = drawnItemsProvinces
        drawnItemsDistricts.remove()
        drawnItemsProvinces.addTo(map)
        provinces.getLayers().forEach(function(layer){layer.setStyle({fillOpacity: 1})});
    }
    updateDrawControl();
});

map.on('overlayremove',function (event){
    map.closePopup();
    if (event.name === "Xã"){
        activePane="paneProvinces";
        activeColor="black"
        drawnItems = drawnItemsProvinces
        drawnItemsProvinces.addTo(map)
        drawnItemsDistricts.remove()
        provinces.getLayers().forEach(function(layer){layer.setStyle({fillOpacity: 1})});
    } else {
        activePane="paneDistricts"
        activeColor= "red"
        drawnItems = drawnItemsDistricts
        drawnItemsDistricts.addTo(map)
        drawnItemsProvinces.remove()
    }
    updateDrawControl();
});

function popInDrawArea(layer,items){
    layer.on('click', function(e) {
        let pt = turf.point([e.latlng.lng, e.latlng.lat]);
        let popupOpened = false
        items.eachLayer(function(layer) {
            if (layer.feature) {
              // Kiểm tra xem điểm có nằm trong feature không
              if (turf.booleanPointInPolygon(pt, layer.feature)) {
                layer.openPopup(e.latlng);
                popupOpened = true;
              }
            }
          });
})
}


map.on(L.Draw.Event.CREATED, function (event) {
    map.closePopup();
    const layer = event.layer;
    let feature=layer.toGeoJSON();
    if (activePane === "paneProvinces"){
        drawnItemsProvinces.addLayer(layer);
        drawnItemsProvinces.addTo(map);
        popInDrawArea(layer,provinces)
        data_provinces.features.forEach( function(area,index) {
            if(turf.intersect(feature,area)){
                provinces.getLayers()[index].setStyle({
                            fillColor: "yellow",
                            fillOpacity: 1,
                            color: "black",
                            opacity: 1,
                        });
                    } 
        });
    } else if (activePane == "paneDistricts" ) {
        drawnItemsDistricts.addLayer(layer)
        drawnItemsDistricts.addTo(map);
        popInDrawArea(layer,districts)
        data_districts.features.forEach( function(area,index) {
            if(turf.intersect(feature,area)){
                districts.getLayers()[index].setStyle({
                            fillColor: "yellow",
                            fillOpacity: 1,
                            color: "red",
                            opacity: 1
                        });   
                    }
        });
    } 
});

function reEditPain(drawnItemsGroup,data_GJSON,data_area){
    let itemIndex=[]
    drawnItemsGroup.eachLayer(function(layer){
        let feature=layer.toGeoJSON()
        data_GJSON.features.forEach(function(area,index) {
            if(turf.intersect(area,feature)){
                data_area.getLayers()[index].setStyle({
                            fillColor: "yellow",
                            fillOpacity: 1,
                            color: "black",
                        });
                itemIndex.push(index)    
            } else if (!itemIndex.includes(index)) {
                data_area.getLayers()[index].setStyle({
                    fillColor: "transparent",
                    fillOpacity: 1,
                    color: "black",
                });
            }
        });
    });
}
// Edit layers (draw)
map.on('draw:editvertex', function() {
    if (activePane === "paneProvinces"){
        reEditPain(drawnItemsProvinces,data_provinces,provinces)
    } else if (activePane == "paneDistricts") {
    reEditPain(drawnItemsDistricts,data_districts,districts)
    }
});



map.on('draw:deletestart', function () {
    console.log('Chế độ xóa được bật');
    console.log(drawnItemsProvinces._layers)
    drawnItemsProvinces.eachLayer(function(drawnItemslayer){
        drawnItemslayer.on("click",function(event){
            console.log("click")
            // delete drawnItemsProvinces._layers[event.target._leaflet_id]
            drawnItemsProvinces.removeLayer(event.target._leaflet_id)
            console.log(drawnItemsProvinces._layers)

            provinces.getLayers().forEach(function(provinceLayer) {
                provinceLayer.setStyle({
                    fillColor: "transparent",
                    fillOpacity: 1,
                    color: "black",
                    opacity: 1
                });
            });
            drawnItemsProvinces.eachLayer(function(lay){
                feature=lay.toGeoJSON()
                // console.log(feature)
                data_provinces.features.forEach(function(area) {
                    if(turf.intersect(feature,area)){
                        provinces.getLayers().forEach(function(layer) {
                            if (layer.feature.properties.NAME_2 === area.properties.NAME_2) {
                                layer.setStyle({
                                    fillColor: "yellow",
                                    fillOpacity: 1,
                                    color: "black",
                                    opacity: 1
                                });
                            }
        
                        });
                    } 
                });
            });


       }) 
    });
});

// Khi thoát khỏi chế độ Delete, sự kiện 'draw:deletestop' được kích hoạt

  
document.querySelector(".get-info").addEventListener("click",logInfors);

function logInfors(){
    intersectedProvinces=[]
    drawnItemsProvinces.eachLayer(function(layer){
        let feature=layer.toGeoJSON();
        data_provinces.features.forEach(function(area){
            if(turf.intersect(feature,area)){
                intersectedProvinces.push(`${area.properties.NAME2}`)
            }
        })
    });
    console.log([... new Set(intersectedProvinces)].join(", "))

};

document.querySelector(".zoom-layer").addEventListener("click", () => map.setView([21.33163, 103.90288], 9))


