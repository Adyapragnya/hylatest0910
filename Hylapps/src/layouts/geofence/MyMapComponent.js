import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import MapWithGeofences from './MapWithGeofences';
import MapWithMarkers from './MapWithMarkers';
import MapWithFullscreen from './MapWithFullscreen';
import MapWithDraw from './MapWithDraw';
import * as turf from '@turf/turf';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon, lineString } from '@turf/turf';
import 'leaflet.markercluster';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MapWithPolylineGeofences from './MapWithPolylineGeofences';
import MapWithCircleGeofences from './MapWithCircleGeofences';
import './MyMapComponent.css'; // Import CSS file for styling

const MyMapComponent = ({ vessels, selectedVessel, setVesselEntries }) => {
  const [polygonGeofences, setPolygonGeofences] = useState([]);
  const [polylineGeofences, setPolylineGeofences] = useState([]);
  const [circleGeofences, setCircleGeofences] = useState([]);
  const [buttonControl, setButtonControl] = useState(false);
  const [vesselTableData, setVesselTableData] = useState([]);

  const handleButtonControl = () => {
    setButtonControl(prev => !prev);
  };

  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const baseURL = process.env.REACT_APP_API_BASE_URL;
        const [polygonRes, polylineRes, circleRes] = await Promise.all([
          axios.get(`${baseURL}/api/polygongeofences`),
          axios.get(`${baseURL}/api/polylinegeofences`),
          axios.get(`${baseURL}/api/circlegeofences`),
        ]);
        setPolygonGeofences(polygonRes.data);
        setPolylineGeofences(polylineRes.data);
        setCircleGeofences(circleRes.data);
      } catch (error) {
        console.error('Error fetching geofences:', error);
      }
    };
    fetchGeofences();
  }, []);

  const ensureClosedPolygon = (coordinates) => {
    if (coordinates.length > 0) {
      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([firstPoint[0], firstPoint[1]]);
      }
    }
    return coordinates;
  };

  useEffect(() => {
   const checkVesselsInGeofences = () => {
  const updatedVesselEntries = {};
  vessels.forEach((vessel) => {
    const vesselPoint = point([vessel.lng, vessel.lat]);

    let isInsideAnyGeofence = false;

    // Polygon geofences
    polygonGeofences.forEach((geofence) => {
      let geofenceCoordinates = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
      geofenceCoordinates = ensureClosedPolygon(geofenceCoordinates);
      const geofencePolygon = polygon([geofenceCoordinates]);
      const isInside = booleanPointInPolygon(vesselPoint, geofencePolygon);

      if (isInside) {
        const geofenceInsideTime = new Date().toISOString(); // Use this for entryTime
        updatedVesselEntries[vessel.name] = {
          entryTime: vesselTableData[vessel.name]?.status === 'Outside' ? geofenceInsideTime : vesselTableData[vessel.name]?.entryTime,
          geofence: geofence.geofenceName,
          status: 'Inside',
          exitTime: null
        };
        isInsideAnyGeofence = true;
        updateGeofenceInDB(vessel.name, 'Inside', geofenceInsideTime); // Use geofenceInsideTime here
      }
    });

    // Circle geofences
    circleGeofences.forEach((geofence) => {
      const { lat, lng, radius } = geofence.coordinates[0];
      const distance = turf.distance(vesselPoint, point([lng, lat]), { units: 'meters' });
      const isInsideCircle = distance <= radius;

      if (isInsideCircle) {
        const geofenceInsideTime = new Date().toISOString(); // Use this for entryTime
        updatedVesselEntries[vessel.name] = {
          entryTime: vesselTableData[vessel.name]?.status === 'Outside' ? geofenceInsideTime : vesselTableData[vessel.name]?.entryTime,
          geofence: geofence.geofenceName,
          status: 'Inside',
          exitTime: null
        };
        isInsideAnyGeofence = true;
        updateGeofenceInDB(vessel.name, 'Inside', geofenceInsideTime); // Use geofenceInsideTime here
      }
    });

    // Polyline geofences
    polylineGeofences.forEach((geofence) => {
      const geofenceLine = lineString(geofence.coordinates.map(coord => [coord.lng, coord.lat]));
      const distanceToPolyline = turf.pointToLineDistance(vesselPoint, geofenceLine, { units: 'meters' });
      const isNearPolyline = distanceToPolyline <= 3000;

      if (isNearPolyline) {
        const geofenceInsideTime = new Date().toISOString(); // Use this for entryTime
        updatedVesselEntries[vessel.name] = {
          entryTime: vesselTableData[vessel.name]?.status === 'Outside' ? geofenceInsideTime : vesselTableData[vessel.name]?.entryTime,
          geofence: geofence.geofenceName,
          status: `Near ${Math.round(distanceToPolyline)} meters`,
          exitTime: null
        };
        isInsideAnyGeofence = true;
        updateGeofenceInDB(vessel.name, 'Near', geofenceInsideTime); // Use geofenceInsideTime here
      }
    });

    if (!isInsideAnyGeofence && (vesselTableData[vessel.name]?.status === 'Inside' || vesselTableData[vessel.name]?.status.includes('Near'))) {
      updatedVesselEntries[vessel.name] = {
        status: 'Outside',
        exitTime: new Date().toISOString()
      };
    }
  });
  setVesselEntries((prevEntries) => ({
    ...prevEntries,
    ...updatedVesselEntries
  }));
  
};


    if (vessels.length && (polygonGeofences.length || circleGeofences.length || polylineGeofences.length)) {
      checkVesselsInGeofences();
    }
  }, [vessels, polygonGeofences, circleGeofences, polylineGeofences, setVesselEntries]);

  const updateGeofenceInDB = async (vesselName, geofenceStatus, geofenceInsideTime) => {
    try {
      const baseURL = process.env.REACT_APP_API_BASE_URL;
      await axios.post(`${baseURL}/api/updateGeofence`, {
        name: vesselName,
        geofenceStatus,
        geofenceInsideTime,
      });
    } catch (error) {
      console.error('Error updating geofence status in DB:', error);
    }
  };

  return (
    <>
      <div className="checkbox-container">
        <label className="checkbox-label">
          <input type="checkbox" checked={buttonControl} onChange={handleButtonControl} />
          Draw Mode
        </label>
      </div>

      <MapContainer center={[0, 0]} minZoom={1.5} zoom={1.5} maxZoom={18} 
                    maxBounds={[[85, -180], [-85, 180]]} // Strict world bounds to prevent panning
                    maxBoundsViscosity={8} // Makes the map rigid
                   style={{ height: '55vh', width: '100%', backgroundColor: 'rgba(170,211,223,255)'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" noWrap={true} />
        <MapWithMarkers vessels={vessels} selectedVessel={selectedVessel} />
        <MapWithFullscreen />
        {buttonControl && <MapWithDraw />}
        <MapWithGeofences geofences={polygonGeofences} />
        <MapWithPolylineGeofences geofences={polylineGeofences} />
        <MapWithCircleGeofences geofences={circleGeofences} />
      </MapContainer>
    </>
  );
};

MyMapComponent.propTypes = {
  vessels: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      name: PropTypes.string,
      imo: PropTypes.number,
      heading: PropTypes.number,
      eta: PropTypes.string,
      destination: PropTypes.string,
    }).isRequired
  ).isRequired,
  selectedVessel: PropTypes.shape({
    name: PropTypes.string.isRequired,
    imo: PropTypes.number,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    heading: PropTypes.number,
  }),
  setVesselEntries: PropTypes.func.isRequired,
};

export default MyMapComponent;


