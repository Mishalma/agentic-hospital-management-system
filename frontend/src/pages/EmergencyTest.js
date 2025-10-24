import React from 'react';

const EmergencyTest = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🚨 Emergency System Test</h1>
      <p>If you can see this page, the emergency routing is working!</p>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => window.location.href = '/emergency'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          Go to Emergency Dashboard
        </button>
        
        <button 
          onClick={() => window.location.href = '/enterprise-dashboard'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          Go to Enterprise Dashboard
        </button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '600px', margin: '30px auto' }}>
        <h3>Emergency System Status:</h3>
        <ul>
          <li>✅ Emergency Dashboard Component Created</li>
          <li>✅ Emergency Case Form Created</li>
          <li>✅ Emergency Case Details Created</li>
          <li>✅ Backend Routes Configured</li>
          <li>✅ Database Models Ready</li>
          <li>✅ Enterprise Dashboard Integration</li>
        </ul>
      </div>
    </div>
  );
};

export default EmergencyTest;