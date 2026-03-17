import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
import { Volume2, VolumeX } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface RouteMapProps {
  from: string;
  to: string;
  animate?: boolean;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

async function geocode(place: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (err) {
    console.error("Geocoding failed:", err);
  }
  return null;
}

export default function RouteMap({ from, to, animate }: RouteMapProps) {
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const speak = (text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([geocode(from), geocode(to)]).then(([f, t]) => {
      setFromCoords(f);
      setToCoords(t);
      if (f) setMarkerPos(f);
      setLoading(false);

      if (animate && f && t) {
        speak(`Starting journey from ${from} to ${to}. Please follow the highlighted route.`);
      }
    });
  }, [from, to, animate]);

  useEffect(() => {
    if (!animate || !fromCoords || !toCoords) return;
    let step = 0;
    const totalSteps = 100;
    const interval = setInterval(() => {
      step++;
      const ratio = step / totalSteps;
      const lat = fromCoords[0] + (toCoords[0] - fromCoords[0]) * ratio;
      const lng = fromCoords[1] + (toCoords[1] - fromCoords[1]) * ratio;
      setMarkerPos([lat, lng]);

      if (step === 50) {
        speak("You are halfway to your destination. Keep going!");
      }

      if (step >= totalSteps) {
        clearInterval(interval);
        speak(`You have arrived at ${to}. Journey completed!`);
      }
    }, 200);
    return () => {
      clearInterval(interval);
      window.speechSynthesis?.cancel();
    };
  }, [animate, fromCoords, toCoords]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
          Loading map...
        </div>
      </div>
    );
  }

  if (!fromCoords || !toCoords) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted">
        <p className="text-muted-foreground">Could not find locations on map</p>
      </div>
    );
  }

  const positions: [number, number][] = [fromCoords, toCoords];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border shadow-card">
      <button
        onClick={() => {
          setIsVoiceEnabled(!isVoiceEnabled);
          if (isVoiceEnabled) window.speechSynthesis?.cancel();
        }}
        className={`absolute right-4 top-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-full border border-border shadow-md transition-all ${isVoiceEnabled ? "bg-secondary text-white" : "bg-white text-muted-foreground"
          }`}
        title={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
      >
        {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>

      <MapContainer
        center={fromCoords}
        zoom={6}
        style={{ height: "320px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        <Marker position={fromCoords}>
          <Popup className="font-semibold">
            <div className="text-secondary text-xs uppercase mb-1">Pickup (Sender)</div>
            {from}
          </Popup>
        </Marker>
        <Marker position={toCoords}>
          <Popup className="font-semibold">
            <div className="text-green-600 text-xs uppercase mb-1">Dropoff (Receiver)</div>
            {to}
          </Popup>
        </Marker>
        {markerPos && animate && (
          <Marker position={markerPos} icon={orangeIcon}>
            <Popup className="font-semibold text-secondary">Traveller</Popup>
          </Marker>
        )}
        <Polyline positions={positions} pathOptions={{ color: "hsl(28, 100%, 55%)", weight: 3, dashArray: "8 8" }} />
      </MapContainer>
    </div>
  );
}
