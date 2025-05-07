  "use client";

  import { useEffect, useRef, useState } from 'react';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import '@/lib/plugins/L.Icon.Pulse.js';
  import '@/lib/plugins/L.Icon.Pulse.css';

  import { MapFeature, ProvinceProperties, ProvinceStyle } from "@/types/map";
  import LocationMarkers from "./LocationMarkers";

  const VietnamMap = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const [geojsonLayer, setGeojsonLayer] = useState<L.GeoJSON | null>(null);
    const [clickedLayer, setClickedLayer] = useState<string | null>(null);
    const [clickedLayerGid, setClickedLayerGid] = useState<number | null>(null);
    const originalStylesRef = useRef<Record<string, ProvinceStyle>>({});
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const lockMapInteraction = (map: L.Map) => {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.touchZoom.disable();
    };

    const unlockMapInteraction = (map: L.Map) => {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.touchZoom.enable();
    };

    const handleProvinceClick = (
      layer: L.Layer,
      feature: MapFeature,
      mapObj: L.Map,
      gjLayer: L.GeoJSON
    ) => {
      const polygon = layer as unknown as L.Polygon;
      const layerAsPath = layer as L.Path;

      if (polygon.getBounds) {
        const bounds = polygon.getBounds();
        const center = bounds.getCenter();
        setClickedLayer(feature.properties.ten_tinh);
        if (feature.properties.gid !== undefined) {
          setClickedLayerGid(feature.properties.gid);
        }
        mapObj.setView(center, 8);
        lockMapInteraction(mapObj);

        gjLayer.eachLayer((l) => {
          if (l !== layer) {
            (l as L.Path).off("click");
            (l as L.Path).setStyle({ fillColor: "#ffffff", color: "#ffffff" });
          }
        });

        layerAsPath.setStyle({
          fillColor: "#ff0000",
          color: "#ff7800",
        });

        layer.openPopup();
      }
    };

    const filterSuggestions = (query: string): string[] => {
      if (!geojsonLayer) return [];

      // Get all features from the GeoJSON layer
      const allFeatures = Object.values(geojsonLayer.getLayers());

      // Filter features where the province name includes the query (case insensitive)
      const filtered = allFeatures
        .map((layer: L.Layer) => {
          const feature = (layer as L.Layer & { feature?: MapFeature }).feature;
          return feature ? feature.properties.ten_tinh : null;
        })
        .filter((name): name is string => name !== null && name.toLowerCase().includes(query.toLowerCase()));

      return filtered;
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (query) {
        const filtered = filterSuggestions(query);
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    };

    const handleProvinceSuggestionClick = (provinceName: string) => {
      if (!geojsonLayer || !map) return;

      const targetLayer = Object.values(geojsonLayer.getLayers()).find((layer: L.Layer) => {
        const feature = (layer as L.Layer & { feature?: MapFeature }).feature;
        return feature && feature.properties.ten_tinh === provinceName;
      });

      if (targetLayer) {
        const layer = targetLayer as L.Layer & { feature: MapFeature };
        handleProvinceClick(layer, layer.feature, map, geojsonLayer);
      }

      setSuggestions([]);
    };

    useEffect(() => {
      setIsMounted(true);

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/images/marker-icon-2x.png",
        iconUrl: "/images/marker-icon.png",
        shadowUrl: "/images/marker-shadow.png",
      });
    }, []);

    useEffect(() => {
      if (!isMounted || !mapRef.current || map) return;

      const initMap = () => {
        const mapInstance = L.map(mapRef.current!).setView(
          [14.0583, 108.2772],
          5
        );
      L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=RCfpOibQtfADVJ8TBhgS#0.7/2.63872/-12.32731', {
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> contributors',
        tileSize: 256,
        zoomOffset: 0,
      }).addTo(mapInstance);

        setMap(mapInstance);

        fetch("/province.json")
          .then((res) => res.json())
          .then(
            (
              data: GeoJSON.FeatureCollection<
                GeoJSON.Geometry,
                ProvinceProperties
              >
            ) => {
              const gjLayer = L.geoJSON(data, {
                onEachFeature: (feature: MapFeature, layer: L.Layer) => {
                  const layerAsPath = layer as L.Path;

                  originalStylesRef.current[feature.properties.ten_tinh] = {
                    color: layerAsPath.options.color || "#ff7800",
                    fillColor: layerAsPath.options.fillColor || "#ff0000",
                    fillOpacity: layerAsPath.options.fillOpacity || 0.4,
                  };

                  const popupContent = `
                    <div style="font-family: Arial, sans-serif; padding: 8px; max-width: 250px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #333;">${feature.properties.ten_tinh}</h3>
                      ${
                        feature.properties.gid
                          ? `<p style="margin: 4px 0 12px 0; font-size: 14px; color: #555;"><strong>Mã tỉnh:</strong> ${feature.properties.gid}</p>`
                          : ""
                      }
                      <div style="text-align: center;">
                        <a href="/province/${feature.properties.gid}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #28a745; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                          Xem thông tin và tham quan
                        </a>
                      </div>
                    </div>
                  `;



                  layer.bindPopup(popupContent);

                  layer.on("click", () =>
                    handleProvinceClick(layer, feature, mapInstance, gjLayer)
                  );
                },
                style: () => ({
                  color: "#ff7800",
                  weight: 2,
                  opacity: 0.6,
                  fillColor: "#ff0000",
                  fillOpacity: 0.4,
                }),
              }).addTo(mapInstance);

              setGeojsonLayer(gjLayer);
            }
          );
      };

      setTimeout(initMap, 100);
    }, [isMounted, map]);

    const handleBackClick = () => {
      if (!map || !geojsonLayer) return;

      map.setView([14.0583, 108.2772], 6);
      unlockMapInteraction(map);

      geojsonLayer.eachLayer((layer) => {
        const layerAsPath = layer as L.Path;
        const feature = (layer as L.Layer & { feature?: MapFeature }).feature;
        if (!feature) return;

        const featureName = feature.properties.ten_tinh;
        const originalStyle = originalStylesRef.current[featureName];
        if (originalStyle) {
          layerAsPath.setStyle({
            color: originalStyle.color,
            fillColor: originalStyle.fillColor,
            fillOpacity: originalStyle.fillOpacity,
          });
        }

        const popupContent = `
        <div style="font-family: Arial, sans-serif; padding: 8px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #333;">${feature.properties.ten_tinh}</h3>
          ${
            feature.properties.gid
              ? `<p style="margin: 4px 0 12px 0; font-size: 14px; color: #555;"><strong>Mã tỉnh:</strong> ${feature.properties.gid}</p>`
              : ""
          }
          <div style="text-align: center;">
            <a href="/province/${feature.properties.gid}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #28a745; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
              Xem thông tin và tham quan
            </a>
          </div>
        </div>
      `;
        layer.bindPopup(popupContent);

        layer.on("click", () =>
          handleProvinceClick(layer, feature, map, geojsonLayer)
        );
        // 👉👉 Thêm dòng này để đóng popup lại
    layer.closePopup();
      });
    
      // ✅ Reset state
      setClickedLayer(null);
      setClickedLayerGid(null); 
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <input
    type="text"
    value={searchQuery}
    onChange={handleSearchChange}
    placeholder="Tìm kiếm tỉnh"
    style={{
      position: 'absolute',
      top: '60px',
      left: '20px',
      zIndex: 1000,
      padding: '12px 20px', // Tăng kích thước padding cho cảm giác thoải mái hơn
      fontSize: '16px', // Giữ kích thước chữ dễ đọc
      borderRadius: '8px', // Bo tròn góc cho mềm mại
      border: '1px solid #ddd', // Border nhẹ nhàng, dễ chịu
      backgroundColor: '#f9f9f9', // Màu nền nhẹ nhàng
      color: '#333', // Màu chữ đậm dễ đọc
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Thêm shadow nhẹ để tạo chiều sâu
      transition: 'all 0.3s ease', // Thêm hiệu ứng chuyển tiếp khi người dùng focus vào
    }}
    onFocus={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0, 112, 255, 0.2)'} // Focus hiệu ứng sáng hơn
    onBlur={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'} // Blur hiệu ứng trở lại
  />

        {suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '130px',
              left: '20px',
              zIndex: 1000,
              backgroundColor: 'white',
              width: 'calc(100% - 40px)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleProvinceSuggestionClick(suggestion)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: '#f7f7f7',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        <button
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 1000,
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "18px",
            boxShadow: "0 6px 14px rgba(0, 123, 255, 0.6)",
            display: clickedLayer ? "block" : "none",
          }}
          onClick={handleBackClick}
        >
          Back
        </button>

        <div ref={mapRef} style={{
          height: '100vh',
          width: '100%',
          border: '0',
          borderRadius: '10px',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }} />

        {map && (
          <LocationMarkers
            provinceGid={clickedLayerGid}
            map={map}
            shouldClear={clickedLayer === null}
          />
        )}
      </div>
    );
  };

  export default VietnamMap;
