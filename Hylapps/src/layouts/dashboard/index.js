import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DetailedStatisticsCard1 from "examples/Cards/StatisticsCards/DetailedStatisticsCard1";
import DetailedStatisticsCard from "examples/Cards/StatisticsCards/DetailedStatisticsCard";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Autocomplete from "@mui/material/Autocomplete";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MyMapComponent from "./MyMapComponent";

function Default() {
  const { vesselId } = useParams(); // Retrieve vesselId from URL
  const [vessels, setVessels] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState(null);

  useEffect(() => {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    fetch(`${baseURL}/api/get-tracked-vessels`)
      .then(response => response.json())
      .then(data => {
        setVessels(data);

        // Find the vessel by name if vesselId is present
        const vessel = data.find(vessel => vessel.AIS.NAME === decodeURIComponent(vesselId));
        setSelectedVessel(vessel || null);
      })
      .catch(error => console.error("Error fetching vessels:", error));
  }, [vesselId]);

  function handleSelect(event, value) {
    if (!value) {
      setSelectedVessel(null);
      return;
    }

    const vesselData = vessels.find(vessel => vessel.AIS.NAME === value.AIS.NAME);
    setSelectedVessel(vesselData || null);
  }

  const destination = selectedVessel?.AIS?.DESTINATION || "Select a vessel";
  const speed = selectedVessel?.AIS?.SPEED || "Select a vessel";
  const eta = selectedVessel?.AIS?.ETA || "Select a vessel";
  const zone = selectedVessel?.AIS?.ZONE || "Select a vessel";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={12}>
            <DetailedStatisticsCard1 vessel={selectedVessel} />
          </Grid>

          {selectedVessel && (
            <>
              <Grid item xs={12} md={6} lg={3}>
                <DetailedStatisticsCard
                  title="Destination"
                  count={destination}
                  icon={{ color: "info", component: <i className="fa fa-ship" /> }}
                  percentage={{ color: "success", count: "+3%", text: "since yesterday" }}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DetailedStatisticsCard
                  title="Speed"
                  count={speed}
                  icon={{ color: "info", component: <i className="fa fa-map-marker" /> }}
                  percentage={{ color: "success", count: "+3%", text: "since last week" }}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DetailedStatisticsCard
                  title="ETA"
                  count={eta}
                  icon={{ color: "info", component: <i className="fa fa-map" /> }}
                  percentage={{ color: "error", count: "-2%", text: "since last quarter" }}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <DetailedStatisticsCard
                  title="Zone"
                  count={zone}
                  icon={{ color: "info", component: <i className="fa fa-crosshairs" /> }}
                  percentage={{ color: "success", count: "+5%", text: "than last month" }}
                />
              </Grid>
            </>
          )}
        </Grid>

        <Card
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: "17px",
            boxShadow: 1,
            padding: 2,
          }}
        >
          <CardContent
            sx={{
              backgroundColor: "#ffffff",
              padding: 0,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Vessel Search
            </Typography>
            <Autocomplete
              options={vessels}
              getOptionLabel={(option) => option.AIS.NAME || ""}
              value={selectedVessel} // Set the selected value
              onChange={handleSelect}
              renderInput={(params) => (
                <TextField {...params} label="" variant="outlined" />
              )}
            />
          </CardContent>
        </Card>
        <Grid container my={0}>
          {/* <Grid item xs={12} md={0} lg={3.5}></Grid>
          <Grid item xs={12} md={0} lg={3.5}></Grid> */}
          <Grid item xs={12} md={0} lg={12} ml={0} mt={3}>
            <MyMapComponent 
              selectedVessel={selectedVessel} // Pass selectedVessel to the map
              style={{ borderRadius: '20px' }} 
            />
          </Grid>
        </Grid>
      </ArgonBox>

      <Footer />
    </DashboardLayout>
  );
}

export default Default;


