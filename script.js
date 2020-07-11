let coll = document.getElementsByClassName("collapsible");

for (let i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    let content = this.nextElementSibling;
    content.style.maxHeight ? content.style.maxHeight = null: content.style.maxHeight = content.scrollHeight + "px";
  });
}

mapboxgl.accessToken =
  "pk.eyJ1IjoiYnJhZGxleTIzODciLCJhIjoiY2pnMTk0ZTk2NmJzOTJxbnZpMjl1ZGsxbiJ9.L-BSY_VjUrkHL3ov0OciKQ";
let map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/bradley2387/ckc9v7p5q3el91immy8mnucgv", // /draft', // stylesheet location
  center: [-104.9, 39.75], // starting position [lng, lat]
  zoom: 10, // starting zoom
  hash: true,
});
let geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  flyTo: {
    zoom: 16,
    speed: 19,
  },
  collapsed: true,
});
// // Create dollar sign number formatter.
let formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});
map.addControl(geocoder);
map.addControl(new mapboxgl.NavigationControl(), "top-right");
map.addControl(new mapboxgl.FullscreenControl());
// Add geolocate control to the map.
let geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
  fitBoundsOptions: {
    maxZoom: 16.7,
  },
  trackUserLocation: true,
});

//Function that will take a point and return the neighborhood info
function nbhood_display(point) {
  let nbhood = map.queryRenderedFeatures(point, {
    layers: ["neighborhoods_fill"],
  });
  if (nbhood.length < 1) {
    return;
  }
  document.querySelector("#nbhd_name").innerHTML = `
        <h3 style="margin:7px 0 1px 0">${nbhood[0].properties.nbhd_name}</h3>`;

  document.querySelector(".content").innerHTML = `
        <p><b>Price Avg:</b> ${formatter.format(
          nbhood[0].properties.total_valu_avg
        )}</p>
        <p><b>Land Value Avg:</b> ${formatter.format(
          nbhood[0].properties.land_value_avg
        )}</p>
        <p><b>Improvement Avg:</b> ${formatter.format(
          nbhood[0].properties.improvemen_avg
        )}</p>
        <p><b>Total Value Min:</b> ${formatter.format(
          nbhood[0].properties.total_valu_min
        )}</p>
        <p><b>Total Value Max:</b> ${formatter.format(
          nbhood[0].properties.total_valu_max
        )}</p>
        <p><b># of Homes:</b> ${nbhood[0].properties.num_of_houses}</p>
        <p><b>Avg Lot Size:</b> ${
          nbhood[0].properties.average_lot_acreage
        } acre</p>
    `;
}
geocoder.on("result", function (e) {
  // wait until the map has finished flying to the searched point
  map.once("moveend", function () {
    // add the result as a point in the 'search_point' layer to show up as marker
    let geocoder_result = e.result.geometry;
    //project to use (pixel xy coordinates instead of lat/lon for WebGL)
    let geocoder_point = map.project([e.result.center[0], e.result.center[1]]);
    nbhood_display(geocoder_point);
  });
});
map.addControl(geolocate);
geolocate.on("geolocate", function (e) {
  let geocoder_result = [e.coords.longitude, e.coords.latitude];
  //project to use (pixel xy coordinates instead of lat/lon for WebGL)
  let geolocate_point = map.project(geocoder_result);
  nbhood_display(geolocate_point);
});

map.on("load", function () {
  geolocate.trigger();

  map.on("click", function (e) {
    // let features = map.queryRenderedFeatures(e.point);
    // console.log(features)
    map.removeFeatureState({
      source: "composite",
      sourceLayer: "parcels",
    });
    map.removeFeatureState({
      source: "composite",
      sourceLayer: "neighborhoods",
    });
  });

  //Parcels
  map.on("click", "parcels_fill", function (e) {
    let p = e.features[0].properties;
    let description = `
            <table class="table_color" style="margin-top:10px;">
            <tr><td style="font-size:15px;">Total Value</td>
                <td id="studentid" style="font-weight:500;font-size:15px;">${formatter.format(
                  p.total_valu_og
                )}</td>
            </tr>
            <tr><td>Name</td><td> ${p.owner_name} </td></tr>
            <tr><td>Address</td><td> ${p.situs_ad_1} </td></tr>
            <tr><td>Year Built</td><td> ${p.ccyrblt} </td></tr>
            <tr><td>Class</td><td> ${p.d_class_cn} </td></tr>
            <tr><td>Schedum</td><td> ${p.schednum} </td></tr>
            </table>
            <a style="text-align:center;" target="_blank" href="https://www.denvergov.org/property/realproperty/summary/${
              p.pin
            }">More Info</a>
            `;
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(description).addTo(map);
    map.removeFeatureState({
      source: "composite",
      sourceLayer: "parcels",
    });
    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "parcels",
        id: e.features[0].id,
      },
      {
        hover: true,
      }
    );
  });

  map.on("mouseenter", "parcels_fill", function () {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "parcels_fill", function () {
    map.getCanvas().style.cursor = "";
  });

  //Neighborhoods
  map.on("click", "neighborhoods_fill", function (e) {
    //console.log(e.features)
    if (map.getZoom() > 15) {
      return;
    }
    let p = e.features[0].properties;
    let description = `
        <table class="table_color" style="margin-top:10px;">
            <h4 style="text-align:center; margin:0 0 0 0;">${p.nbhd_name}</h4>
            <tr><td>Price Avg</td><td> ${formatter.format(
              p.total_valu_avg
            )} </td></tr>
            <tr><td>Land Value</td><td> ${formatter.format(
              p.land_value_avg
            )} </td></tr>
            <tr><td>Improvement Avg</td><td> ${formatter.format(
              p.improvemen_avg
            )} </td></tr>
            <tr><td>Total Value Min</td><td>  ${formatter.format(
              p.total_valu_min
            )} </td></tr>
            <tr><td>Total Value Max</td><td> ${formatter.format(
              p.total_valu_max
            )} </td></tr>
            <tr><td># of Homes</td><td> ${p.num_of_houses} </td></tr>
            <tr><td>Avg Lot Size</td><td>  ${p.average_lot_acreage} </td></tr>
        </table>
        `;
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(description).addTo(map);
    map.removeFeatureState({
      source: "composite",
      sourceLayer: "neighborhoods",
    });
    map.setFeatureState(
      {
        source: "composite",
        sourceLayer: "neighborhoods",
        id: e.features[0].id,
      },
      {
        hover: true,
      }
    );
  });
});
