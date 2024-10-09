import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactDataGrid from '@inovua/reactdatagrid-community';
import '@inovua/reactdatagrid-community/index.css';
import axios from 'axios';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { CSVLink } from 'react-csv'; // CSV export
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // PDF export

const columns = [
  { name: 'NAME', header: 'Name', minWidth: 80 },
  { name: 'TYPE', header: 'Type', minWidth: 80 },
  { name: 'IMO', header: 'IMO', minWidth: 80 },
  { name: 'ETA', header: 'ETA', minWidth: 80 },
  { name: 'DESTINATION', header: 'Destination', minWidth: 80 },
  { name: 'SPEED', header: 'Speed', maxWidth: 80 },
  { name: 'LATITUDE', header: 'Latitude', maxWidth: 80 },
  { name: 'LONGITUDE', header: 'Longitude', maxWidth: 80 },
  { name: 'HEADING', header: 'Heading', maxWidth: 80 },
  { name: 'ZONE', header: 'Zone', maxWidth: 80 },
];

const gridStyle = {
  minHeight: 450,
};

const headerStyle = {
  backgroundColor: 'blue',
  color: 'white',
  textAlign: 'center',
};

// Main component definition
const VesselDetailsTable = ({ highlightRow, onRowClick }) => {
  const [vessels, setVessels] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState(null); // for dropdown menu
  const [page, setPage] = useState(1); // Current page
  const [pageSize, setPageSize] = useState(10); // Number of rows per page

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const baseURL = process.env.REACT_APP_API_BASE_URL;
        const response = await axios.get(`${baseURL}/api/get-tracked-vessels`);
        const formattedData = response.data.map(vessel => ({
          NAME: vessel.AIS?.NAME || '',
          TYPE: vessel.SpireTransportType || '',
          IMO: vessel.AIS?.IMO || 0,
          ETA: vessel.AIS?.ETA || '',
          SPEED: vessel.AIS?.SPEED || 0,
          LATITUDE: vessel.AIS?.LATITUDE || 0,
          LONGITUDE: vessel.AIS?.LONGITUDE || 0,
          DESTINATION: vessel.AIS?.DESTINATION || '',
          HEADING: vessel.AIS?.HEADING || '',
          ZONE: vessel.AIS?.ZONE || '',
          isNew: isNewVessel(vessel),
        }));
        setVessels(formattedData.reverse());
      } catch (error) {
        console.error('Error fetching tracked vessels:', error);
        setError(error.message);
      }
    };

    fetchVessels();
  }, []);

  const isNewVessel = (vessel) => {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    return new Date(vessel.timestamp) > oneMinuteAgo;
  };

  const handleRowClick = (row) => {
    const { NAME, IMO, LATITUDE, LONGITUDE, HEADING, ETA, DESTINATION } = row.data;
    onRowClick({ name: NAME, imo: IMO, lat: LATITUDE, lng: LONGITUDE, heading: HEADING, eta: ETA, destination: DESTINATION });
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const filteredVessels = vessels.filter(vessel =>
    Object.values(vessel).some(value =>
      value.toString().toLowerCase().includes(searchValue.toLowerCase())
    )
  );

  // CSV export
  const csvHeaders = columns.map(c => ({ label: c.header, key: c.name }));
  const csvData = filteredVessels;

  // Generate PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Vessel Details', 20, 10);
    doc.autoTable({
      head: [columns.map(c => c.header)],
      body: filteredVessels.map(vessel => columns.map(c => vessel[c.name] || '')),
    });
    doc.save('vessel-details.pdf');
  };

  // Print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Vessel Details</title>');
    printWindow.document.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" />');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Vessel Details</h2>');
    printWindow.document.write('<table border="1" style="width: 100%; border-collapse: collapse;">');
    printWindow.document.write('<thead><tr>');
    columns.forEach(col => {
      printWindow.document.write(`<th style="background-color: blue; color: white; text-align: center;">${col.header}</th>`);
    });
    printWindow.document.write('</tr></thead><tbody>');
    filteredVessels.forEach(vessel => {
      printWindow.document.write('<tr>');
      columns.forEach(col => {
        printWindow.document.write(`<td>${vessel[col.name] || ''}</td>`);
      });
      printWindow.document.write('</tr>');
    });
    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ position: 'relative', minHeight: 450 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{ color: '#FFFFFF', backgroundColor: '#1976d2', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Export Data&nbsp;<i className="fa fa-database" style={{ color: "white" }}></i>
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem>
              <CSVLink data={csvData} headers={csvHeaders} filename="vessel-details.csv" style={{ textDecoration: 'none', color: '#01204E' }}>
                <i className="fa fa-file-excel-o"></i>&nbsp;Export as CSV 
              </CSVLink>
            </MenuItem>
            <MenuItem onClick={exportPDF} style={{ textDecoration: 'none', color: '#01204E' }}><i className="fa fa-file-pdf" ></i>&nbsp;Export as PDF </MenuItem>
            <MenuItem onClick={handlePrint} style={{ textDecoration: 'none', color: '#01204E' }}><i className="fa fa-print"></i>&nbsp;Print </MenuItem>
          </Menu>
        </Box>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search"
          style={{ height: '30px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </Box>

      <ReactDataGrid
        columns={columns}
        dataSource={filteredVessels}
        idProperty="IMO"
        rowClassName={row =>
          highlightRow?.imo === row.IMO
            ? 'highlight-row'
            : row.isNew
              ? 'blink'
              : ''
        }
        onRowClick={handleRowClick}
        style={gridStyle}
        headerRowHeight={40}
        headerRowStyle={headerStyle}
        enableRowSelection
        pagination
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalCount={filteredVessels.length}
      />
    </div>
  );
};

VesselDetailsTable.propTypes = {
  highlightRow: PropTypes.object,
  onRowClick: PropTypes.func.isRequired,
};

export default VesselDetailsTable;
