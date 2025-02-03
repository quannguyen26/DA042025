// map class inittialize
let nenvn = L.layerGroup()
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

var geoserverLayer = L.tileLayer.wms("http://localhost:8080/geoserver/radar/wms?", {
    layers: 'radar:output_cropped_3857_test2', // Thay workspace và layer của bạn
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: "GeoServer"
}).addTo(map);

map.zoomControl.setPosition('topright');

// Add scale map
L.control.scale({position:'bottomleft'}).addTo(map);

// var baseMaps = {
//     "Stadia_OSMBright":Stadia_OSMBright,
// };

var overlayMaps = {
};

var layerControl = L.control.layers(null, overlayMaps,
    {collapsed:false,position:'topleft'}).addTo(map);

map.createPane('paneProvinces');
map.createPane('paneDistricts');
map.createPane('paneDraw');

map.getPane('paneProvinces').style.zIndex = 500;
map.getPane('paneDistricts').style.zIndex = 400;
map.getPane('paneDraw').style.zIndex = 550;

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



// layerControl.addOverlay(provinces,"Huyện");
layerControl.addOverlay(districts,"Cấp xã");


// ---------------------------------
let activePane = "paneProvinces";


let drawnItemsProvinces = new L.FeatureGroup();
let drawnItemsDistricts = new L.FeatureGroup();

let drawnItems = drawnItemsProvinces ;


let drawControl;
L.EditToolbar.Delete.include({
    removeAllLayers: false
});

function updateDrawControl() {
    if (drawControl) {
        map.removeControl(drawControl); // Remove the old control
    };
    drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
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
            rectangle: false,
            circle: false,
        }
    });

    map.addControl(drawControl); // Add the updated control
}

updateDrawControl();

map.on('overlayadd',function (event){
    map.closePopup();
     if (event.layer.options.pane === "paneDistricts"){
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
    if (event.layer.options.pane === "paneDistricts"){
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
    layer.options.pane = "paneDraw"
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
                        });   
                    }
        });
        logInfors()
    } 
});


// ------------------------- Edit layers (draw)
function reEditPain(drawnItemsGroup,data_GJSON,data_area,color){
    let itemIndex=[]
    drawnItemsGroup.eachLayer(function(layer){
        let feature=layer.toGeoJSON()
        data_GJSON.features.forEach(function(area,index) {
            if(turf.intersect(area,feature)){
                data_area.getLayers()[index].setStyle({
                            fillColor: "yellow",
                            fillOpacity: 1,
                            color: color,
                        });
                itemIndex.push(index)    
            } else if (!itemIndex.includes(index)) {
                data_area.getLayers()[index].setStyle({
                    fillColor: "transparent",
                    fillOpacity: 1,
                    color: color,
                });
            }
        });
    });
    logInfors()
}

map.on('draw:editvertex', function() {
    if (activePane === "paneProvinces"){
        reEditPain(drawnItemsProvinces,data_provinces,provinces,"black")
    } else if (activePane == "paneDistricts") {
        reEditPain(drawnItemsDistricts,data_districts,districts,"red")
    }
});

let isSaved = false;
map.on('draw:edited', function() {
    isSaved = true; 
});

map.on('draw:editstop', function() {
    if (!isSaved) {
        if (activePane === "paneProvinces"){
            reEditPain(drawnItemsProvinces,data_provinces,provinces,"black")
        } else if (activePane == "paneDistricts") {
            reEditPain(drawnItemsDistricts,data_districts,districts,"red")
        }
    }
    isSaved = false; 
});

//----------------------- Delete layers (draw)
var deletedLayers = [[],[]];
map.on('draw:deletestart', function() {
    if (activePane === "paneProvinces"){
        drawnItemsProvinces.eachLayer(function(drawnItemslayer){
            drawnItemslayer.off("click").on("click",function(event){
                deletedLayers[0].push(drawnItemsProvinces.getLayer(event.target._leaflet_id))
                drawnItemsProvinces.removeLayer(event.target._leaflet_id)
                if (Object.keys(drawnItemsProvinces._layers).length === 0){
                    provinces.getLayers().forEach(function(provinceLayer) {
                        provinceLayer.setStyle({
                            fillColor: "transparent",
                            fillOpacity: 1,
                            color: "black"});
                    });
                } else {
                    reEditPain(drawnItemsProvinces,data_provinces,provinces,"black")
                }
            }) 
        });
    } else if (activePane == "paneDistricts"){
        drawnItemsDistricts.eachLayer(function(drawnItemslayer){
            drawnItemslayer.off("click").on("click",function(event){
                deletedLayers[1].push(drawnItemsDistricts.getLayer(event.target._leaflet_id))
                drawnItemsDistricts.removeLayer(event.target._leaflet_id)
                if (Object.keys(drawnItemsDistricts._layers).length === 0){
                    districts.getLayers().forEach(function(districtLayer) {
                        districtLayer.setStyle({
                            fillColor: "transparent",
                            fillOpacity: 1,
                            color: "red"});
                    });
                } else {
                    reEditPain(drawnItemsDistricts,data_districts,districts,"red")
                }
             }) 
        });
    }
});

var deleteConfirmed = false;
// Sự kiện khi xóa thành công (nhấn "Save")
map.on('draw:deleted', function(e) {
    deleteConfirmed = true;
});

// Sự kiện khi thoát chế độ xóa (dù là "Save" hay "Cancel")
map.on('draw:deletestop', function(e) {
    if (!deleteConfirmed) {
        if (activePane === "paneProvinces"){
            if (deletedLayers[0].length > 0) {
                deletedLayers[0].forEach(function(layer) {
                    drawnItemsProvinces.addLayer(layer);
                });
                reEditPain(drawnItemsProvinces,data_provinces,provinces,"black")
            };
            deletedLayers[0] = [];
        } else if (activePane === "paneDistricts" ){
            if (deletedLayers[1].length > 0) {
                deletedLayers[1].forEach(function(layer) {
                    drawnItemsDistricts.addLayer(layer);
                });
                reEditPain(drawnItemsDistricts,data_districts,districts,"red")   
            };
            deletedLayers[1] = [];       
        };  
    } else {
        deletedLayers= [[],[]];
    }; 
    deleteConfirmed = false;
    logInfors()
});


function logInfors(){
    let intersectedDistricts=[]
    drawnItemsDistricts.eachLayer(function(layer){
        let feature=layer.toGeoJSON();
        data_districts.features.forEach(function(area){
            if(turf.intersect(feature,area)){
                intersectedDistricts.push({type: area.properties.TYPE_3, nameCommune: area.properties.NAME_3, district: area.properties.NAME_2});
            }
        })
    });
    
    const grouped = intersectedDistricts.reduce((acc, { type, nameCommune, district }) => {
        if (!acc[district]) acc[district] = { communes: [], typeWard: [] }
        acc[district].communes.push(nameCommune);
        if (district === 'TP. Sơn La') acc[district].typeWard.push(type)
        return acc;
    }, {});
    
    let formattedText = '';
    for (const [district, { communes, typeWard }] of Object.entries(grouped)) {
        if (district === 'TP. Sơn La'){
            if (communes.length === 1){
                label = typeWard[0] === "Phường" ? "Phường" : "Xã";
            } else {
            label = "Các xã, phường";
            }
        } else {
            label = communes.length === 1 ? "Xã" : "Các xã";
        }
        formattedText += `- ${district}: ${label} ${communes.join(', ')}.<br>`;
    }
    
    document.getElementsByClassName('contentNews')[0].innerHTML=formattedText;
};

document.querySelector(".zoom-layer").addEventListener("click", () => map.setView([21.33163, 103.90288], 9))

function copyContent() {
    const content = document.getElementsByClassName('contentNews')[0].innerText;
    navigator.clipboard.writeText(content)
  }


function toggleBox() {
    const box = document.getElementById('contentBox');
    const btn = document.getElementById('toggleBtn');
    L.DomEvent.disableClickPropagation(box);
    L.DomEvent.disableScrollPropagation(box);
    if (box.classList.contains('open')) {
      box.classList.remove('open');
      btn.textContent = '◀';
      map.setView([21.33163, 103.90288], 9);
    } else {
      box.classList.add('open');
      btn.style.margin="0px"
      btn.textContent = '▶';
      const currentCenter = map.getCenter();
        const newLatLng = [currentCenter.lat, currentCenter.lng + 0.5];
        map.setView(newLatLng, 9);
  }   
}

