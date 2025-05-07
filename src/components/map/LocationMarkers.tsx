  "use client";

  import { useEffect, useState } from 'react';
  import L from 'leaflet';
  import { useRouter } from 'next/navigation';



  interface Location {
    _id: string;
    name: string;
    description?: string;
    slug: string; // 🛠 THÊM DÒNG NÀY
    coordinates: {
      lat: number;
      lng: number;
    };
  }


  interface PulseIconOptions extends L.DivIconOptions {
    heartbeat?: number;
    animate?: boolean;
    color?: string;
    fillColor?: string;
  }

  declare global {
    interface LIconExtended {
      pulse: (options: PulseIconOptions) => L.Icon;
    }
  }

  interface LocationMarkersProps {
    provinceGid: number | null;
    map: L.Map;
    shouldClear?: boolean;
  }

  const LocationMarkers = ({
    provinceGid,
    map,
    shouldClear,
  }: LocationMarkersProps) => {
    const [markers, setMarkers] = useState<L.Marker[]>([]);
    const router = useRouter();  // Hook để điều hướng trang

    useEffect(() => {
      if (!map || !provinceGid) return;

      const fetchLocations = async () => {
        try {
          const res = await fetch(`/api/locations?gid=${provinceGid}`);
          const json = await res.json();
          const locations: Location[] = json.data;

          // Clear existing markers
          markers.forEach((marker) => map.removeLayer(marker));

          const newMarkers = locations.map((loc) => {
            const pulseIcon = (L.icon as unknown as LIconExtended).pulse({
              iconSize: [20, 20],
              color: "black",
              heartbeat: 1,
            }) as L.Icon;

            const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], {
              icon: pulseIcon,
            }).addTo(map);
              
            // Khi tạo popupContent
                const popupContent = `
                <div style="font-family: Arial, sans-serif; padding: 8px; max-width: 250px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #333;">${loc.name}</h3>
                  ${
                    loc.description
                      ? `<p style="margin: 4px 0 12px 0; font-size: 14px; color: #555;">${loc.description}</p>`
                      : ""
                  }
                  <div style="display: flex; justify-content: center; gap: 8px;">
                    <a href="/location/post/${loc._id}?provinceGid=${provinceGid}" style="padding: 6px 12px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
                      Xem và tạo bài viết
                    </a>
                    <a href="/attractions/${loc._id}?tab=streetview" target="_blank" style="padding: 6px 12px; background-color: #28a745; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
                      Ảnh 360
                    </a>
                  </div>
                </div>
                `;

            marker.bindPopup(popupContent);

            marker.on('popupopen', () => {
              const button = document.getElementById(`view-post-${loc._id}`);
              if (button) {
                button.addEventListener('click', () => {
                  router.push(`/location/post/${loc._id}?provinceGid=${provinceGid}`);
                });
              }
            });


            return marker;
          });

          setMarkers(newMarkers);
        } catch (error) {
          console.error("Error loading locations:", error);
        }
      };

      fetchLocations();

      return () => {
        markers.forEach((marker) => map.removeLayer(marker));
        setMarkers([]);
      };
    }, [provinceGid, map]);

    useEffect(() => {
      if (shouldClear && markers.length > 0) {
        markers.forEach((marker) => map.removeLayer(marker));
        setMarkers([]);
      }
    }, [shouldClear]);

    return null;
  };

  export default LocationMarkers;
