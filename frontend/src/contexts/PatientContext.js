import React, { createContext, useContext, useState, useEffect } from "react";

const PatientContext = createContext();

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
};

export const PatientProvider = ({ children }) => {
  const [currentPatientId, setCurrentPatientId] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedPatientId = localStorage.getItem("currentPatientId");
    if (savedPatientId) {
      setCurrentPatientId(savedPatientId);
    }
  }, []);

  // Save to localStorage whenever currentPatientId changes
  useEffect(() => {
    if (currentPatientId) {
      localStorage.setItem("currentPatientId", currentPatientId);
    } else {
      localStorage.removeItem("currentPatientId");
    }
  }, [currentPatientId]);

  const clearCurrentPatient = () => {
    setCurrentPatientId("");
  };

  const value = {
    currentPatientId,
    setCurrentPatientId,
    clearCurrentPatient,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};
