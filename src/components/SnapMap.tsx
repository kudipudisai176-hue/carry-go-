import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Navigation, 
  Map as MapIcon, 
  Layers, 
  Settings, 
  Compass, 
  Search, 
  Star, 
  Clock, 
  Users,
  Filter,
  Maximize2
} from "lucide-react";

// ─── Mapbox token — set VITE_MAPBOX_TOKEN in your env ───────────────────────
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string || "pk.eyJ1IjoicmFtc2FpMTIzIiwiYSI6ImNtOHJlbGNuejBiaXUybW9tYm1pZ3FwazMifQ.i9P9T_W_P-2_fJ0l_N37A";

interface SnapMapProps {
  from?: string;
  to?: string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  travellers?: any[];
  onSelectUser?: (user: any) => void;
}

// ─── Geocode city name → [lng, lat] ──────────────────────────────────────────
async function geocode(place: string): Promise<[number, number] | null> {
  try {
      const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0)
          return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
  } catch (e) {
      console.error("Geocoding failed:", e);
  }
  return null;
}

export default function SnapMap({ 
  from,
  to,
  center = [82.229, 16.989], // Ramannapeta Default
  zoom = 15,
  pitch = 60,
  bearing = -20,
  travellers = [
    { id: 1, name: "Mani", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mani", pos: [82.229, 16.989], status: "Heading to Hyderabad" },
    { id: 2, name: "Sai", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sai", pos: [82.235, 16.995], status: "Resting" },
    { id: 3, name: "Rahul", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul", pos: [82.215, 16.975], status: "Picking up parcel" },
  ],
  onSelectUser
}: SnapMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeFilter, setActiveFilter] = useState("Popular");
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: center,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      antialias: true,
    });

    map.current.on("load", async () => {
      if (!map.current) return;
      
      // Force an immediate size check once style loaded
      map.current.resize();

      // Geocode locations if provided
      let startCoords = center;
      let endCoords: [number, number] | null = null;

      if (from && to) {
        const [fc, tc] = await Promise.all([geocode(from), geocode(to)]);
        if (fc && tc) {
          startCoords = fc;
          endCoords = tc;
          map.current.setCenter(fc);
        }
      }

      // 🏙️ Add 3D Buildings
      map.current.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "height"],
            0, "#ffffff",
            50, "#f97316",
            100, "#ea580c"
          ],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.4,
        },
      });

      // 📍 Add Destination Pin if available
      if (endCoords) {
        const pin = document.createElement("div");
        pin.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg mb-1 uppercase tracking-widest">${to}</div>
            <div class="h-4 w-4 bg-emerald-500 border-2 border-white rounded-full shadow-md"></div>
          </div>
        `;
        new mapboxgl.Marker(pin).setLngLat(endCoords).addTo(map.current);
      }

      // 📍 Add Custom Avatar Markers
      travellers.forEach((user) => {
        const el = document.createElement("div");
        el.className = "group cursor-pointer";
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <!-- 🌟 Premium Pulse Effect -->
            <div class="absolute inset-0 -m-2">
               <div class="h-16 w-16 rounded-full bg-orange-500/20 animate-ping absolute"></div>
               <div class="h-16 w-16 rounded-full bg-orange-500/10 animate-pulse absolute"></div>
            </div>
            
            <div class="absolute -top-12 bg-white px-3 py-1.5 rounded-2xl shadow-xl min-w-max border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-20">
               <p class="text-[10px] font-black text-slate-800">${user.name}</p>
               <p class="text-[8px] font-bold text-orange-500">${user.status}</p>
            </div>
            <div class="h-12 w-12 rounded-full border-4 border-white bg-orange-50 overflow-hidden shadow-2xl transition-transform hover:scale-110 active:scale-95 ring-4 ring-orange-500/20 relative z-10">
              <img src="${user.avatar}" class="h-full w-full object-cover" />
            </div>
            <div class="h-3 w-3 bg-white border-2 border-orange-500 rounded-full mt-[-6px] shadow-sm relative z-10"></div>
          </div>
        `;

        new mapboxgl.Marker(el)
          .setLngLat(user.pos)
          .addTo(map.current!);
      });

      // 🛤️ Draw Route Line
      if (startCoords && endCoords) {
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [startCoords, endCoords],
            },
            properties: {},
          },
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#f97316",
            "line-width": 4,
            "line-opacity": 0.8,
            "line-dasharray": [2, 2],
          },
        });
      }
    });

    // 🌊 Resize observer to fix rendering in dynamic containers (expanding accordions)
    const resizeObserver = new ResizeObserver(() => {
        map.current?.resize();
    });

    if (mapContainer.current) {
        resizeObserver.observe(mapContainer.current);
    }

    return () => {
        resizeObserver.disconnect();
        map.current?.remove();
    };
  }, []);

  const handleToggle3D = () => {
    setIs3D(!is3D);
    map.current?.easeTo({
      pitch: is3D ? 0 : 60,
      duration: 1000
    });
  };

  return (
    <div className="relative w-full h-[500px] rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl bg-slate-50">
      {/* 🗺️ MAP CONTAINER */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* 🔘 TOP FILTERS (Snap Style) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {["Memories", "Visited", "Popular", "Favorites"].map((label) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(label)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl backdrop-blur-md transition-all ${
              activeFilter === label 
                ? "bg-slate-900 text-white" 
                : "bg-white/80 text-slate-600 border border-white/50"
            }`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {/* 📍 FLOATING CONTROLS */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          onClick={handleToggle3D}
          className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 text-slate-700"
        >
          <Layers className={`h-5 w-5 ${is3D ? 'text-orange-500' : 'text-slate-400'}`} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 text-slate-700">
          <Compass className="h-5 w-5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} className="h-12 w-12 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 text-slate-700">
          <Settings className="h-5 w-5" />
        </motion.button>
      </div>

      {/* 👥 BOTTOM AVATAR BAR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] z-10">
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-4 border border-white shadow-2xl flex items-center gap-6 overflow-x-auto custom-scrollbar">
           {travellers.map((user) => (
             <motion.button
               key={user.id}
               whileHover={{ y: -5 }}
               className="flex flex-col items-center gap-2 min-w-[70px]"
               onClick={() => onSelectUser?.(user)}
             >
                <div className="relative">
                   <div className="h-16 w-16 rounded-[1.5rem] bg-orange-100 overflow-hidden border-2 border-white shadow-lg p-1">
                      <img src={user.avatar} className="h-full w-full object-cover rounded-[1rem]" />
                   </div>
                   <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                </div>
                <span className="text-[10px] font-black tracking-tight text-slate-800">{user.name}</span>
             </motion.button>
           ))}
           
           {/* Add Friend Button */}
           <motion.button whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="h-16 w-16 rounded-[1.5rem] border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50/50">
                 <Users className="h-6 w-6 text-slate-400" />
              </div>
              <span className="text-[10px] font-black text-slate-400">Discover</span>
           </motion.button>
        </div>
      </div>

      {/* 🚀 QUICK SEARCH OVERLAY */}
      <div className="absolute top-6 left-6 z-10">
         <div className="h-12 w-64 bg-white shadow-2xl rounded-2xl border border-slate-100 flex items-center px-4 gap-3 focus-within:ring-4 ring-orange-500/10 transition-all">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search explorers..." 
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-800 w-full"
            />
         </div>
      </div>

      {/* Ambient Gradient Overlays */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
    </div>
  );
}
