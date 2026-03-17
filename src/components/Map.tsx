import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Map() {

    const pickup: [number, number] = [17.3850, 78.4867];      // Sender
    const delivery: [number, number] = [16.5062, 80.6480];    // Receiver

    return (
        <MapContainer center={pickup} zoom={7} style={{ height: "500px" }}>

            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={pickup}>
                <Popup>Pickup Location</Popup>
            </Marker>

            <Marker position={delivery}>
                <Popup>Delivery Location</Popup>
            </Marker>

        </MapContainer>
    );
}

export default Map;
