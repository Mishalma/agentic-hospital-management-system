import React from 'react';

const EmergencyDashboardSimple = () => {
  const mockStats = {
    today: { total: 15, critical: 2, high: 4, medium: 6, low: 3, completed: 8 },
    active: { total: 7, critical: 2, high: 2, medium: 2, low: 1 },
    averageWaitTime: 25,
    bedOccupancy: 78
  };

  const mockQueue = {
    critical: [
      { _id: '1', patientId: { name: 'John Smith', age: 65, gender: 'Male' }, 
        chiefComplaint: 'Chest pain', waitTime: 5, 
        vitals: { systolicBP: 180, diastolicBP: 100, heartRate: 120, oxygenSaturation: 88 } }
    ],
    high: [
      { _id: '2', patientId: { name: 'Sarah Johnson', age: 45, gender: 'Female' }, 
        chiefComplaint: 'Severe abdominal pain', waitTime: 20,
        vitals: { systolicBP: 140, diastolicBP: 90, heartRate: 100, oxygenSaturation: 95 } }
    ],
    medium: [
      { _id: '3', patientId: { name: 'Mike Davis', age: 28, gender: 'Male' }, 
        chiefComplaint: 'Ankle injury', waitTime: 45,
        vitals: { systolicBP: 120, diastolicBP: 80, heartRate: 85, oxygenSaturation: 98 } }
    ],
    low: [
      { _id: '4', patientId: { name: 'Lisa Brown', age: 32, gender: 'Female' }, 
        chiefComplaint: 'Minor cut', waitTime: 65,
        vitals: { systolicBP: 110, diastolicBP: 70, heartRate: 75, oxygenSaturation: 99 } }
    ]
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const StatCard = ({ title, value, subtitle, color = '#007bff', icon }) => (
    <div style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{ fontSize: '2rem', color, marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: '5px' }}>{value}</div>
      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#2c3e50', marginBottom: '3px' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>{subtitle}</div>}
    </div>
  );

  const PriorityQueue = ({ title, cases, priority }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: `2px solid ${getPriorityColor(priority)}30`
    }}>
      <h3 style={{ 
        color: getPriorityColor(priority), 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🏥 {title} ({cases.length})
      </h3>
      {cases.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic', padding: '20px' }}>
          No {priority.toLowerCase()} priority cases
        </div>
      ) : (
        cases.map((caseItem) => (
          <div key={caseItem._id} style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>#{caseItem._id}</span>
              <span style={{
                background: getPriorityColor(priority),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {formatWaitTime(caseItem.waitTime)}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{caseItem.patientId?.name || 'Unknown Patient'}</strong>
              <span style={{ color: '#7f8c8d', marginLeft: '10px' }}>
                {caseItem.patientId?.age}y, {caseItem.patientId?.gender}
              </span>
            </div>
            <div style={{ color: '#34495e', marginBottom: '10px' }}>
              {caseItem.chiefComplaint}
            </div>
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#7f8c8d' }}>
              <span>BP: {caseItem.vitals?.systolicBP}/{caseItem.vitals?.diastolicBP}</span>
              <span>HR: {caseItem.vitals?.heartRate}</span>
              <span>O2: {caseItem.vitals?.oxygenSaturation}%</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '25px 30px',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '700' }}>
            🚨 Emergency Department Dashboard
          </h1>
          <p style={{ color: '#7f8c8d', margin: 0 }}>Real-time emergency case management and monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #3498db, #2980b9)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            🆕 New Case
          </button>
          <button style={{
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #95a5a6, #7f8c8d)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '25px',
        marginBottom: '40px'
      }}>
        <StatCard
          title="Total Cases Today"
          value={mockStats.today.total}
          subtitle={`${mockStats.today.completed} completed`}
          color="#007bff"
          icon="📊"
        />
        <StatCard
          title="Active Cases"
          value={mockStats.active.total}
          subtitle="Currently in ED"
          color="#28a745"
          icon="🏥"
        />
        <StatCard
          title="Critical Cases"
          value={mockStats.active.critical}
          subtitle="Immediate attention"
          color="#dc3545"
          icon="🚨"
        />
        <StatCard
          title="Average Wait Time"
          value={`${mockStats.averageWaitTime}m`}
          subtitle="Door to doctor"
          color="#ffc107"
          icon="⏱️"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${mockStats.bedOccupancy}%`}
          subtitle="Current utilization"
          color="#17a2b8"
          icon="🛏️"
        />
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '25px' }}>📋 Priority Queue</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px'
        }}>
          <PriorityQueue title="Critical Priority" cases={mockQueue.critical} priority="Critical" />
          <PriorityQueue title="High Priority" cases={mockQueue.high} priority="High" />
          <PriorityQueue title="Medium Priority" cases={mockQueue.medium} priority="Medium" />
          <PriorityQueue title="Low Priority" cases={mockQueue.low} priority="Low" />
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '25px' }}>📈 Performance Metrics</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '25px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>🎯 Performance Indicators</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Door-to-Doctor Time</span>
              <span style={{ fontWeight: 'bold' }}>{mockStats.averageWaitTime}m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Left Without Being Seen</span>
              <span style={{ fontWeight: 'bold' }}>2.3%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Patient Satisfaction</span>
              <span style={{ fontWeight: 'bold' }}>4.2/5</span>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>🏥 Resource Utilization</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Trauma Bays</span>
              <span style={{ fontWeight: 'bold' }}>3/4 (75%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Acute Beds</span>
              <span style={{ fontWeight: 'bold' }}>12/15 (80%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Standard Beds</span>
              <span style={{ fontWeight: 'bold' }}>18/20 (90%)</span>
            </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)' }}>
            <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>✅ Quality Metrics</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Triage Accuracy</span>
              <span style={{ fontWeight: 'bold' }}>94.2%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Readmission Rate (72h)</span>
              <span style={{ fontWeight: 'bold' }}>1.8%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mortality Rate</span>
              <span style={{ fontWeight: 'bold' }}>0.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDashboardSimple;