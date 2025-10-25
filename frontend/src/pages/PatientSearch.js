import React, { useState } from "react";
import axios from "axios";
import "./PatientSearch.css";

const PatientSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError("Please enter a name to search");
      return;
    }

    if (searchQuery.trim().length < 2) {
      setError("Search query must be at least 2 characters long");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await axios.get("/api/patients/search", {
        params: { name: searchQuery.trim() },
      });

      if (response.data.success) {
        setResults(response.data.patients);
      } else {
        setError(response.data.message || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.response?.data?.message || "Failed to search patients");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setError("");
    setSearched(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="patient-search">
      <div className="search-header">
        <h1>Patient Search</h1>
        <p>Search for patients by name (Admin Only)</p>
      </div>

      <div className="search-form-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter patient name (e.g., John Smith, Smith, John)"
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="search-button" disabled={loading || !searchQuery.trim()}>
              {loading ? "🔍 Searching..." : "🔍 Search"}
            </button>
            {searched && (
              <button type="button" onClick={clearSearch} className="clear-button" disabled={loading}>
                ✕ Clear
              </button>
            )}
          </div>
        </form>

        {error && <div className="error-message">⚠️ {error}</div>}
      </div>

      {searched && (
        <div className="search-results">
          {loading ? (
            <div className="loading-results">
              <p>Searching patients...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="results-header">
                <h2>
                  Found {results.length} patient{results.length !== 1 ? "s" : ""}
                </h2>
              </div>

              <div className="results-grid">
                {results.map((patient) => (
                  <div key={patient.id} className="patient-card">
                    <div className="patient-header">
                      <h3>{patient.name}</h3>
                      <div className="patient-id">{patient.uniqueId}</div>
                    </div>

                    <div className="patient-details">
                      <div className="detail-row">
                        <span className="label">Phone:</span>
                        <span className="value">{patient.phone}</span>
                      </div>

                      {patient.email && (
                        <div className="detail-row">
                          <span className="label">Email:</span>
                          <span className="value">{patient.email}</span>
                        </div>
                      )}

                      <div className="detail-row">
                        <span className="label">Registered:</span>
                        <span className="value">{formatDate(patient.createdAt)}</span>
                      </div>
                    </div>

                    <div className="patient-actions">
                      <button
                        className="action-button primary"
                        onClick={() => (window.location.href = `/consultation/new?patientId=${patient.uniqueId}`)}
                        title="Start new consultation"
                      >
                        📝 New Consultation
                      </button>

                      <button
                        className="action-button secondary"
                        onClick={() => (window.location.href = `/medical-history/${patient.uniqueId}`)}
                        title="View medical history"
                      >
                        🩺 Medical History
                      </button>

                      <button
                        className="action-button outline"
                        onClick={() => navigator.clipboard.writeText(patient.uniqueId)}
                        title="Copy Patient ID"
                      >
                        📋 Copy ID
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>👤 No patients found matching "{searchQuery}"</p>
              <p className="suggestion">Try searching with a different name or check the spelling</p>
            </div>
          )}
        </div>
      )}

      <div className="search-info">
        <div className="info-box">
          <h3>💡 Search Tips</h3>
          <ul>
            <li>Enter at least 2 characters to search</li>
            <li>Search is case-insensitive (e.g., "john" finds "John")</li>
            <li>Partial matches work (e.g., "Smith" finds "John Smith")</li>
            <li>Results are limited to 20 patients for performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PatientSearch;
