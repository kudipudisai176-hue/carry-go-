import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Volume2, VolumeX, Maximize2, Navigation, MapPin } from "lucide-react";

// ─── Mapbox token — add VITE_MAPBOX_TOKEN=<your_token> to your .env file ─────
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string ?? "";

interface RouteMap3DProps {
    from: string;
    to: string;
    animate?: boolean;
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

// ─── Interpolate between two coords ──────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

// ─── Build a smooth curved path between two points ───────────────────────────
function buildCurvedPath(
    from: [number, number],
    to: [number, number],
    steps = 120
): [number, number][] {
    const mid: [number, number] = [
        (from[0] + to[0]) / 2 + (to[1] - from[1]) * 0.15,
        (from[1] + to[1]) / 2 + (to[0] - from[0]) * 0.08,
    ];
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lerp(lerp(from[0], mid[0], t), lerp(mid[0], to[0], t), t);
        const y = lerp(lerp(from[1], mid[1], t), lerp(mid[1], to[1], t), t);
        pts.push([x, y]);
    }
    return pts;
}

// ─── SVG truck icon used as animated marker ───────────────────────────────────
function makeTruckEl() {
    const el = document.createElement("div");
    el.style.cssText = `
    width:52px;height:52px;border-radius:50%;display:flex;align-items:center;
    justify-content:center;background:linear-gradient(135deg,#ff7c2a,#e85d04);
    box-shadow:0 0 0 4px rgba(255,124,42,0.35),0 0 24px rgba(255,124,42,0.6);
    animation:pulse3d 1.6s ease-in-out infinite;cursor:pointer;
  `;
    el.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="white" stroke-width="1.8" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/>
    <circle cx="5.5" cy="18.5" r="2.5" stroke="white" stroke-width="1.8" fill="rgba(255,255,255,0.2)"/>
    <circle cx="18.5" cy="18.5" r="2.5" stroke="white" stroke-width="1.8" fill="rgba(255,255,255,0.2)"/>
  </svg>`;
    return el;
}

// ─── Pin marker ───────────────────────────────────────────────────────────────
function makePinEl(color: string, label: string) {
    const el = document.createElement("div");
    el.style.cssText = `
    display:flex;flex-direction:column;align-items:center;cursor:pointer;
  `;
    el.innerHTML = `
    <div style="
      background:${color};color:white;font-size:11px;font-weight:700;
      padding:4px 10px;border-radius:20px;white-space:nowrap;
      box-shadow:0 4px 14px ${color}80;margin-bottom:4px;
      font-family:system-ui,sans-serif;letter-spacing:0.4px;
    ">${label}</div>
    <div style="
      width:16px;height:16px;border-radius:50%;background:${color};border:3px solid white;
      box-shadow:0 2px 8px ${color}80;
    "></div>
    <div style="
      width:2px;height:10px;background:${color};opacity:0.7;
    "></div>
  `;
    return el;
}

export default function RouteMap3D({ from, to, animate }: RouteMap3DProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const truckMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const pathRef = useRef<[number, number][]>([]);
    const stepRef = useRef(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [progress, setProgress] = useState(0); // 0-100
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const speak = useCallback(
        (text: string) => {
            if (!isVoiceEnabled || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
        },
        [isVoiceEnabled]
    );

    // ─── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainer.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [78.9629, 20.5937], // center of India as default
            zoom: 4,
            pitch: 55,        // 3D tilt angle
            bearing: -15,     // slight rotation for cinematic feel
            antialias: true,
        });

        mapRef.current = map;

        map.on("load", () => {
            // ── 3D Buildings layer ────────────────────────────────────────────────
            const layers = map.getStyle().layers;
            let labelLayerId: string | undefined;
            for (const layer of layers) {
                if (layer.type === "symbol" && (layer.layout as any)?.["text-field"]) {
                    labelLayerId = layer.id;
                    break;
                }
            }

            if (!map.getLayer("3d-buildings")) {
                map.addLayer(
                    {
                        id: "3d-buildings",
                        source: "composite",
                        "source-layer": "building",
                        filter: ["==", "extrude", "true"],
                        type: "fill-extrusion",
                        minzoom: 10,
                        paint: {
                            "fill-extrusion-color": [
                                "interpolate",
                                ["linear"],
                                ["get", "height"],
                                0, "#1a1a2e",
                                50, "#16213e",
                                100, "#0f3460",
                                200, "#533483",
                            ],
                            "fill-extrusion-height": [
                                "interpolate",
                                ["linear"],
                                ["zoom"],
                                10, 0,
                                15, ["get", "height"],
                            ],
                            "fill-extrusion-base": ["get", "min_height"],
                            "fill-extrusion-opacity": 0.85,
                        },
                    },
                    labelLayerId
                );
            }

            // ── Route source (empty initially) ────────────────────────────────────
            if (!map.getSource("route")) {
                map.addSource("route", {
                    type: "geojson",
                    data: { type: "FeatureCollection", features: [] },
                });
            }

            // ── Glow outer line ───────────────────────────────────────────────────
            if (!map.getLayer("route-glow")) {
                map.addLayer({
                    id: "route-glow",
                    type: "line",
                    source: "route",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: {
                        "line-color": "#ff7c2a",
                        "line-width": 12,
                        "line-opacity": 0.25,
                        "line-blur": 6,
                    },
                });
            }

            // ── Core animated dashed route line ───────────────────────────────────
            if (!map.getLayer("route-line")) {
                map.addLayer({
                    id: "route-line",
                    type: "line",
                    source: "route",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: {
                        "line-color": "#ff7c2a",
                        "line-width": 4,
                        "line-dasharray": [2, 2],
                    },
                });
            }

            // ── Travelled portion (bright) ────────────────────────────────────────
            if (!map.getSource("route-done")) {
                map.addSource("route-done", {
                    type: "geojson",
                    data: { type: "FeatureCollection", features: [] },
                });
            }
            if (!map.getLayer("route-done-line")) {
                map.addLayer({
                    id: "route-done-line",
                    type: "line",
                    source: "route-done",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: {
                        "line-color": "#ff9f43",
                        "line-width": 5,
                        "line-opacity": 0.9,
                    },
                });
            }

            setLoading(false);
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // ─── Geocode & draw route when from/to change ─────────────────────────────
    useEffect(() => {
        if (loading) return;
        setProgress(0);
        stepRef.current = 0;

        Promise.all([geocode(from), geocode(to)]).then(([fcRaw, tcRaw]) => {
            if (!mapRef.current) return;
            // Graceful fallback to default coordinates so the map never breaks the UI
            const fc = fcRaw || [78.4867, 17.3850]; // Hyderabad Default
            const tc = tcRaw || [77.2090, 28.6139]; // New Delhi Default
            setError(false);

            const map = mapRef.current;

            // Build curved path
            const path = buildCurvedPath(fc, tc);
            pathRef.current = path;

            // Draw full route
            const routeGeoJSON: GeoJSON.FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: path,
                        },
                        properties: {},
                    },
                ],
            };
            (map.getSource("route") as mapboxgl.GeoJSONSource)?.setData(routeGeoJSON);
            (map.getSource("route-done") as mapboxgl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [],
            });

            // ── From pin ──────────────────────────────────────────────────────────
            new mapboxgl.Marker({ element: makePinEl("#ff7c2a", `📦 ${from}`) })
                .setLngLat(fc)
                .addTo(map);

            // ── To pin ────────────────────────────────────────────────────────────
            new mapboxgl.Marker({ element: makePinEl("#22c55e", `🏠 ${to}`) })
                .setLngLat(tc)
                .addTo(map);

            // ── Truck marker ──────────────────────────────────────────────────────
            if (truckMarkerRef.current) truckMarkerRef.current.remove();
            const truckEl = makeTruckEl();
            const truckMarker = new mapboxgl.Marker({ element: truckEl, anchor: "center" })
                .setLngLat(fc)
                .addTo(map);
            truckMarkerRef.current = truckMarker;

            // ── Fit bounds with cinematic padding ─────────────────────────────────
            const bounds = new mapboxgl.LngLatBounds(fc, fc).extend(tc);
            map.fitBounds(bounds, {
                padding: { top: 100, bottom: 100, left: 80, right: 80 },
                pitch: 55,
                bearing: -15,
                duration: 1800,
            });

            if (animate) {
                speak(`Starting journey from ${from} to ${to}. Follow the glowing orange route.`);
                startAnimation(path, map);
            }
        });
    }, [from, to, animate, loading]);

    // ─── Animate truck along route ────────────────────────────────────────────
    const startAnimation = useCallback(
        (path: [number, number][], map: mapboxgl.Map) => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            stepRef.current = 0;

            const totalSteps = path.length;
            const speed = 1; // steps per frame

            const tick = () => {
                const idx = Math.min(stepRef.current, totalSteps - 1);
                const pos = path[idx];

                // Move truck
                truckMarkerRef.current?.setLngLat(pos);

                // Update done portion
                const donePath = path.slice(0, idx + 1);
                (map.getSource("route-done") as mapboxgl.GeoJSONSource)?.setData({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: { type: "LineString", coordinates: donePath },
                            properties: {},
                        },
                    ],
                });

                const pct = Math.round((idx / (totalSteps - 1)) * 100);
                setProgress(pct);

                // Smooth camera follow
                if (idx % 8 === 0 && idx < totalSteps - 10) {
                    map.easeTo({
                        center: pos,
                        duration: 800,
                        easing: (t) => t,
                    });
                }

                if (idx === Math.floor(totalSteps / 2)) {
                    speak("Halfway there! Keep going.");
                }

                if (idx >= totalSteps - 1) {
                    speak(`You have arrived at ${to}! Delivery complete.`);
                    // Zoom into destination
                    map.flyTo({
                        center: pos,
                        zoom: 14,
                        pitch: 60,
                        bearing: 30,
                        duration: 2000,
                    });
                    return;
                }

                stepRef.current += speed;
                animFrameRef.current = requestAnimationFrame(tick);
            };

            animFrameRef.current = requestAnimationFrame(tick);
        },
        [speak, to]
    );

    // ─── Fullscreen toggle ────────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen((v) => !v);
    };

    // ─── Add CSS keyframes for pulse ──────────────────────────────────────────
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
      @keyframes pulse3d {
        0%, 100% { box-shadow: 0 0 0 4px rgba(255,124,42,0.35), 0 0 24px rgba(255,124,42,0.6); }
        50%       { box-shadow: 0 0 0 10px rgba(255,124,42,0.12), 0 0 40px rgba(255,124,42,0.9); }
      }
    `;
        document.head.appendChild(style);
        return () => style.remove();
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            style={{ background: "#0d1117" }}
        >
            {/* ── Map container ─────────────────────────────────────────────────── */}
            <div
                ref={mapContainer}
                style={{ height: "380px", width: "100%", borderRadius: "inherit" }}
            />

            {/* ── Loading overlay ───────────────────────────────────────────────── */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] rounded-2xl gap-3">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-2 border-t-orange-300/60 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
                    </div>
                    <p className="text-sm text-orange-300/80 font-medium animate-pulse">Loading 3D Map…</p>
                </div>
            )}

            {/* ── Error state ───────────────────────────────────────────────────── */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117]/90 rounded-2xl gap-2">
                    <MapPin className="h-10 w-10 text-red-400" />
                    <p className="text-red-400 text-sm font-semibold">Could not locate cities on map</p>
                </div>
            )}

            {/* ── HUD overlay ───────────────────────────────────────────────────── */}
            {!loading && !error && (
                <>
                    {/* Route info badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-2 border border-white/10">
                        <Navigation className="h-4 w-4 text-orange-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {from}
                        </span>
                        <span className="text-orange-400 text-xs">→</span>
                        <span className="text-xs font-bold text-green-400 truncate max-w-[200px]">
                            {to}
                        </span>
                    </div>

                    {/* Voice + Fullscreen controls */}
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                        <button
                            onClick={() => {
                                setIsVoiceEnabled((v) => !v);
                                if (isVoiceEnabled) window.speechSynthesis?.cancel();
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-orange-500/20 transition-colors"
                            title={isVoiceEnabled ? "Mute voice" : "Enable voice"}
                        >
                            {isVoiceEnabled ? (
                                <Volume2 className="h-4 w-4 text-orange-400" />
                            ) : (
                                <VolumeX className="h-4 w-4 text-white/50" />
                            )}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
                            title="Fullscreen"
                        >
                            <Maximize2 className="h-4 w-4 text-white/70" />
                        </button>
                    </div>

                    {/* Progress bar */}
                    {animate && (
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                            <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                                        Journey Progress
                                    </span>
                                    <span className="text-xs font-bold text-white">{progress}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${progress}%`,
                                            background: "linear-gradient(90deg, #ff7c2a, #ffbe76)",
                                            boxShadow: "0 0 10px rgba(255,124,42,0.8)",
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[9px] text-white/50 font-medium">{from}</span>
                                    <span className="text-[9px] text-white/50 font-medium">{to}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Static legend when not animating */}
                    {!animate && (
                        <div className="absolute bottom-3 left-3 z-10">
                            <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-8 rounded-full bg-orange-400 opacity-80" />
                                    <span className="text-[10px] text-white/70 font-medium">Route</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-orange-400" />
                                    <span className="text-[10px] text-white/70 font-medium">Pickup</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-400" />
                                    <span className="text-[10px] text-white/70 font-medium">Dropoff</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
