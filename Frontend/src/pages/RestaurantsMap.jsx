import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styled from "styled-components";

import { useGlobalContext } from "../App";
import { Loading } from "../components/index";

// Center on Bangkok when there is no user location or pins to frame.
const DEFAULT_CENTER = [13.7563, 100.5018];
const DEFAULT_ZOOM = 14;

// Custom pin drawn as inline SVG in the app's orange so there is no image file
// to load (Leaflet's default PNG marker breaks under Vite's bundler).
const restaurantIcon = L.divIcon({
  className: "restaurant-pin",
  html: `<svg width="28" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ff5252"/>
    <circle cx="12" cy="12" r="5" fill="#ffffff"/>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -36],
});

// Recenter the map once the user's location is known; otherwise fall back to
// framing all pins (or the default center if there are none).
const RecenterMap = ({ userLocation, points }) => {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, DEFAULT_ZOOM);
    } else if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 16 });
    }
  }, [userLocation, points, map]);
  return null;
};

const RestaurantsMap = () => {
  const { restaurants, isLoading } = useGlobalContext();
  const [userLocation, setUserLocation] = useState(null);

  const mapped = useMemo(
    () =>
      restaurants.filter(
        (res) =>
          typeof res.location?.lat === "number" &&
          typeof res.location?.lng === "number"
      ),
    [restaurants]
  );

  const points = useMemo(
    () => mapped.map((res) => [res.location.lat, res.location.lng]),
    [mapped]
  );

  // Ask the browser for the user's location so the map opens near them instead
  // of zooming out to cover far-apart pins. Silently keep the fallback view if
  // the user denies the prompt or geolocation is unavailable.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  return (
    <MapWrapper>
      <div className="page-wrapper">
        <h1 className="heading">Map</h1>
        <p className="subtitle">Where you have dined</p>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {mapped.length === 0 && (
              <div className="empty-hint">
                No restaurants mapped yet.{" "}
                <Link to="/create">Add a restaurant</Link> to see it here.
              </div>
            )}
            <div className="map-box">
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <RecenterMap userLocation={userLocation} points={points} />
                {mapped.map((res) => (
                  <Marker
                    key={res._id}
                    position={[res.location.lat, res.location.lng]}
                    icon={restaurantIcon}
                  >
                    <Popup>
                      <strong>{res.name}</strong>
                      {res.location.address && (
                        <div>{res.location.address}</div>
                      )}
                      <Link to={`/restaurant/${res._id}`}>View details</Link>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </>
        )}
      </div>
    </MapWrapper>
  );
};
export default RestaurantsMap;

const MapWrapper = styled.div`
  padding-right: var(--container-padding);
  padding-bottom: var(--container-padding);
  width: 100%;

  .heading {
    margin-bottom: 4px;
  }

  .subtitle {
    color: var(--text-third-color);
    margin-bottom: 50px;
  }

  .empty-hint {
    margin-bottom: 16px;
    color: var(--text-third-color);

    a {
      color: var(--orange);
    }
  }

  .map-box {
    height: calc(100vh - 340px);
    min-height: 400px;
    border-radius: var(--card-radius);
    overflow: hidden;
    box-shadow: var(--card-shadow);
    /* Contain Leaflet's high internal z-index (its controls sit at 1000) so the
       map cannot render on top of the mobile sidebar's dark backdrop. */
    isolation: isolate;
  }

  /* Strip the white box Leaflet puts behind div-based markers so only the pin
     SVG shows. */
  .leaflet-div-icon {
    background: transparent;
    border: none;
  }

  @media (max-width: 1024px) {
    padding-left: var(--container-padding);
    padding-top: var(--container-padding);
  }
`;
