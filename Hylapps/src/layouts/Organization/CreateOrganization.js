import React, { useState } from 'react';
import Swal from 'sweetalert2';
import CryptoJS from 'crypto-js';
import './Organization.css';

const CreateOrganization = () => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminContactNumber, setAdminContactNumber] = useState('');
  const [assignShips, setAssignShips] = useState('');
  const [files, setFiles] = useState([]);

  const encryptionKey = 'mysecretkey';

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const isValidType = 
          file.type === 'application/pdf' || 
          file.type.startsWith('image/') || 
          file.type === 'video/mp4' || // Add other video formats if needed
          file.type === 'application/msword' || // .doc
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // .docx
          file.type === 'application/vnd.ms-excel' || // .xls
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
          file.type === 'text/plain' || // .txt
          file.type === 'text/csv' || // .csv
          file.type === 'image/svg+xml'; // .svg

      const isValidSize = file.size <= 100 * 1024 * 1024; // Limit size to 50MB
      if (!isValidType) {
        Swal.fire('Error', `Invalid file type: ${file.name}. Only images, videos, PDFs, Word documents, text files, Excel sheets, and CSVs are allowed.`, 'error');
      }
      if (!isValidSize) {
        Swal.fire('Error', `File too large: ${file.name}. Maximum size is 50MB.`, 'error');
      }
      return isValidType && isValidSize;
    });

    setFiles(validFiles);
  };
  
  const handleViewFile = (file) => {
    const fileURL = URL.createObjectURL(file);
    // Open the file in a new window/tab
    window.open(fileURL, '_blank');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Input validation
    if (!validateEmail(contactEmail) || !validateEmail(adminEmail)) {
      Swal.fire('Error', 'Please enter valid email addresses.', 'error');
      return;
    }
  
    if (!validatePhoneNumber(adminContactNumber)) {
      Swal.fire('Error', 'Please enter a valid contact number.', 'error');
      return;
    }
  
    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('address', address);
    formData.append('contactEmail', contactEmail);
    formData.append('adminFirstName', adminFirstName);
    formData.append('adminLastName', adminLastName);
    formData.append('adminEmail', adminEmail);
    formData.append('adminContactNumber', adminContactNumber);
    formData.append('assignShips', assignShips);
  
    // Append all selected files
    files.forEach(file => formData.append('files', file));
  
    try {
      const baseURL = process.env.REACT_APP_API_BASE_URL;
      const response = await fetch(`${baseURL}/api/organizations/create`, {
        method: 'POST',
        body: formData,
        headers: {
          // No need to add 'Content-Type' header for FormData; browser sets it automatically.
          'Accept': 'application/json',
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        Swal.fire('Success', 'Organization created and mail sent successfully!', 'success');
      } else {
        Swal.fire('Error', data.message || 'Failed to create organization', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to save organization. Please try again later.', 'error');
    }
  };
  
  
  

  
  const handleCancel = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to cancel?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, go back!',
      customClass: {
        popup: 'custom-swal',
      },
    });

    if (result.isConfirmed) {
      setCompanyName('');
      setAddress('');
      setContactEmail('');
      setAdminFirstName('');
      setAdminLastName('');
      setAdminEmail('');
      setAdminContactNumber('');
      setAssignShips('');
      setFiles([]);

      Swal.fire({
        title: 'Cancelled!',
        text: 'Your action has been cancelled.',
        icon: 'info',
        customClass: {
          popup: 'custom-swal',
        },
      });
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhoneNumber = (phone) => {
    const indiaPattern = /^[6-9]\d{9}$/;
    const usaPattern = /^(\+1-?)?\d{10}$/;
    return indiaPattern.test(phone) || usaPattern.test(phone);
  };

  return (
    <div className="alert-form-container">
      <form className="alert-form" onSubmit={handleSubmit}>
        <h2 className="text-center" style={{ color: '#0F67B1' }}>Create Organization</h2>
        <hr />

        <div className="two-column">
          <label>
            Company Name:
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter Company Name" />
          </label>

          <label>
            Contact Email:
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Enter Contact Email" />
          </label>
        </div>

        <div className="two-column">
          <label>
            Address:
            <textarea 
              value={address} 
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 150) {
                  setAddress(value);
                }
              }} 
              placeholder="Enter Address" 
              rows={1}
            />
          </label>

          <label>
            Assign Ships:
            <input 
              type="number" 
              value={assignShips} 
              onChange={(e) => setAssignShips(e.target.value)} 
              placeholder="Enter Number of Ships" 
            />
          </label>
        </div>

        <div style={{ width: "100%" }}>
          <label>
            Attach Files:
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* File display table */}
        {files.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>Attached Files</h4>
            <table className="file-table" >
              <thead 
              >
                <tr>
                  <th>File Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={index}>
                    <td>{file.name}</td>
                   <td>
                    <button type="button" className="view-button" onClick={() => handleViewFile(file)}>
                      View <i className='fa fa-eye'></i>
                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <hr />

        <h4>Admin Details</h4>

        <div className="two-column">
          <label>
            Admin First Name:
            <input type="text" value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} placeholder="Enter Admin First Name" />
          </label>

          <label>
            Admin Last Name:
            <input type="text" value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} placeholder="Enter Admin Last Name" />
          </label>
        </div>

        <div className="two-column">
          <label>
            Admin Email:
            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Enter Admin Email" />
          </label>

          <label>
            Admin Contact Number:
            <input 
              type="text" 
              value={adminContactNumber} 
              onChange={(e) => setAdminContactNumber(e.target.value)} 
              placeholder="Enter Admin Contact Number" 
            />
          </label>
        </div>
        <hr></hr>
        <div className="form-buttons button-group">
          <button type="submit" className="save-button">Save</button>
          <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrganization;
