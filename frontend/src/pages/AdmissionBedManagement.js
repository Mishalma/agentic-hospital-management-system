import React, { useState, useEffect } from "react";
import mockData from "../mockAdmissionData.json";
import "./AdmissionBedManagement.css";

const AdmissionBedManagement = () => {
  const [beds, setBeds] = useState([]);
  const [admissions, setAdmissions] = useState([]);

  useEffect(() => {
    setBeds(mockData.beds);
    setAdmissions(mockData.admissions);
  }, []);

  const getBedStatusColor = (status) => {
    switch (status) {
      case "available":
        return "green";
      case "occupied":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div className="admission-bed-management">
      <h2>Admission and Bed Management</h2>

      <div className="bed-mapping">
        <h3>Bed Mapping</h3>
        <div className="bed-grid">
          {beds.map((bed) => (
            <div key={bed.id} className="bed-item" style={{ backgroundColor: getBedStatusColor(bed.status) }}>
              <div>Ward: {bed.ward}</div>
              <div>Room: {bed.room}</div>
              <div>Bed: {bed.bedNumber}</div>
              <div>Status: {bed.status}</div>
              {bed.patientId && (
                <div>Patient: {admissions.find((adm) => adm.patientId === bed.patientId)?.patientName}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="admission-tracking">
        <h3>Admission Tracking</h3>
        <table>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Category</th>
              <th>Bed</th>
              <th>Admission Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((admission) => (
              <tr key={admission.id}>
                <td>{admission.patientName}</td>
                <td>{admission.category}</td>
                <td>{beds.find((bed) => bed.id === admission.bedId)?.bedNumber}</td>
                <td>{admission.admissionDate}</td>
                <td>{admission.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="patient-categories">
        <h3>Patient Categories</h3>
        <ul>
          {[...new Set(admissions.map((adm) => adm.category))].map((category) => (
            <li key={category}>{category}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdmissionBedManagement;
