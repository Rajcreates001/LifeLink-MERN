import React, { useState, useEffect } from 'react';
import './HospitalCommunications.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HospitalCommunications Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hospital-communications" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="comm-header" style={{ textAlign: 'center', width: '100%' }}>
            <h2>Hospital Communications</h2>
            <p className="comm-subtitle" style={{color: 'red', fontSize: '16px', margin: '20px 0'}}>
              ❌ Error loading Communications
            </p>
            <p style={{color: '#666', marginBottom: '20px'}}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              style={{padding: '10px 20px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px'}}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const HospitalCommunicationsContent = ({ currentHospitalId, currentHospitalName }) => {
  const [view, setView] = useState('list');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Reply states
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('approved');

  // Form states
  const [messageType, setMessageType] = useState('staff');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [staffCount, setStaffCount] = useState(1);
  const [specialization, setSpecialization] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceQuantity, setResourceQuantity] = useState(1);
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [preferredDate, setPreferredDate] = useState('');
  const [duration, setDuration] = useState('1 day');

  // Main useEffect - Fetch data when component mounts
  useEffect(() => {
    console.log('[HospitalCommunications] Component mounted');
    console.log('[HospitalCommunications] currentHospitalId:', currentHospitalId);
    console.log('[HospitalCommunications] currentHospitalName:', currentHospitalName);
    
    if (!currentHospitalId) {
      console.error('[HospitalCommunications] No hospital ID provided');
      setError('Hospital ID is missing. Please ensure you are logged in.');
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    
    // Create a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('[HospitalCommunications] Request timeout after 10 seconds');
      setError('Request timed out. Please check your connection and refresh.');
      setLoading(false);
    }, 10000);
    
    // Fetch both hospitals and messages in parallel
    Promise.all([
      fetchHospitals(currentHospitalId),
      fetchMessages(currentHospitalId)
    ])
    .then(() => {
      clearTimeout(timeoutId);
      console.log('[HospitalCommunications] Data loaded successfully');
      setLoading(false);
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      console.error('[HospitalCommunications] Error loading data:', err);
      setError(`Failed to load communications data: ${err.message}`);
      setLoading(false);
    });

    return () => clearTimeout(timeoutId);

  }, [currentHospitalId]);

  const fetchHospitals = async (hospitalId) => {
    try {
      console.log('[fetchHospitals] Starting with ID:', hospitalId);
      
      if (!hospitalId) {
        throw new Error('Hospital ID is missing');
      }

      const url = `http://localhost:3001/api/hospital-communication/list/${hospitalId}`;
      console.log('[fetchHospitals] URL:', url);
      
      console.log('[fetchHospitals] Sending fetch request...');
      
      // Create an AbortController with 8-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[fetchHospitals] Fetch timeout - aborting request');
        controller.abort();
      }, 8000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      console.log('[fetchHospitals] Response received, status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          console.error('[fetchHospitals] Could not parse error response:', e);
        }
        throw new Error(`Server error: ${errorMsg}`);
      }

      const data = await response.json();
      console.log('[fetchHospitals] Response data received:', data);
      
      // Support two response shapes: an array, or { data: [...] }
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data?.data)) {
        items = data.data;
      } else {
        console.warn('[fetchHospitals] Unexpected data structure:', data);
        items = [];
      }
      
      console.log('[fetchHospitals] Success! Hospitals count:', items.length);
      setHospitals(items);
      return items;
    } catch (error) {
      console.error('[fetchHospitals] Error:', error.message);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - server not responding. Check that localhost:3001 is running.');
      }
      setHospitals([]);
      throw error;
    }
  };

  const fetchMessages = async (hospitalId) => {
    try {
      console.log('[fetchMessages] Starting with ID:', hospitalId);
      
      if (!hospitalId) {
        throw new Error('Hospital ID is missing');
      }

      const url = `http://localhost:3001/api/hospital-communication/messages/${hospitalId}`;
      console.log('[fetchMessages] URL:', url);
      
      // Create an AbortController with 8-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[fetchMessages] Fetch timeout - aborting request');
        controller.abort();
      }, 8000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      console.log('[fetchMessages] Response status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[fetchMessages] Success! Messages count:', data?.length || 0);
      setMessages(Array.isArray(data) ? data : []);
      return data;
    } catch (error) {
      console.error('[fetchMessages] Error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Messages request timed out');
      }
      setMessages([]);
      throw error;
    }
  };

  const fetchHospitalDetails = async (hospitalId) => {
    try {
      console.log('[fetchHospitalDetails] Starting with ID:', hospitalId);
      setLoading(true);
      setError(null);
      
      if (!hospitalId) {
        throw new Error('Hospital ID is missing');
      }

      const url = `http://localhost:3001/api/hospital-communication/details/${hospitalId}`;
      console.log('[fetchHospitalDetails] URL:', url);
      
      const response = await fetch(url);
      console.log('[fetchHospitalDetails] Response status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[fetchHospitalDetails] Success! Data:', data);
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error('Received empty hospital data');
      }

      setHospitalDetails(data);
      setSelectedHospital(data);
      setView('detail');
      setLoading(false);
    } catch (error) {
      console.error('[fetchHospitalDetails] Error:', error);
      setError(`Failed to load hospital details: ${error.message}`);
      setLoading(false);
      // Set view to 'list' on error so user sees error message but not blank page
      setView('list');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !details.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      console.log('[handleSendMessage] Sending to hospital:', selectedHospital?._id);
      setLoading(true);

      const payload = {
        fromHospitalId: currentHospitalId,
        toHospitalId: selectedHospital?._id,
        messageType,
        subject,
        details,
        requestDetails: {
          staffCount: messageType === 'staff' ? staffCount : 0,
          specialization: messageType === 'staff' ? specialization : '',
          resourceName: messageType === 'resource' ? resourceName : '',
          resourceQuantity: messageType === 'resource' ? resourceQuantity : 0,
          urgencyLevel
        },
        urgencyLevel
      };

      console.log('[handleSendMessage] Payload:', payload);

      const response = await fetch('http://localhost:3001/api/hospital-communication/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('[handleSendMessage] Response status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('[handleSendMessage] Success!');
      alert('Message sent successfully!');
      resetForm();
      setView('list');
      fetchMessages(currentHospitalId);
    } catch (error) {
      console.error('[handleSendMessage] Error:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMessage = async (messageId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
      console.log('[handleResolveMessage] Updating message:', messageId, 'to:', newStatus);
      
      const response = await fetch(`http://localhost:3001/api/hospital-communication/message/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          response: true,
          responseMessage: newStatus === 'resolved' ? 'Request resolved' : 'Request reopened'
        })
      });

      console.log('[handleResolveMessage] Response status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      console.log('[handleResolveMessage] Success!');
      fetchMessages(currentHospitalId);
    } catch (error) {
      console.error('[handleResolveMessage] Error:', error);
      alert(`Failed to update message: ${error.message}`);
    }
  };

  const handleSendReply = async (messageId) => {
    try {
      if (!replyMessage.trim()) {
        alert('Please enter a reply message');
        return;
      }

      console.log('[handleSendReply] Sending reply to message:', messageId);
      setLoading(true);

      const response = await fetch(`http://localhost:3001/api/hospital-communication/message/${messageId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: replyStatus,
          responseMessage: replyMessage
        })
      });

      console.log('[handleSendReply] Response status:', response.status);

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      console.log('[handleSendReply] Success!');
      alert('Reply sent successfully!');
      setReplyingTo(null);
      setReplyMessage('');
      setReplyStatus('approved');
      fetchMessages(currentHospitalId);
    } catch (error) {
      console.error('[handleSendReply] Error:', error);
      alert(`Failed to send reply: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setDetails('');
    setStaffCount(1);
    setSpecialization('');
    setResourceName('');
    setResourceQuantity(1);
    setUrgencyLevel('medium');
    setPreferredDate('');
    setDuration('1 day');
  };

  const filteredHospitals = hospitals.filter(h =>
    h?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h?.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const receivedMessages = messages.filter(m => m?.status !== 'resolved');

  const getUrgencyColor = (level) => {
    switch(level) {
      case 'critical': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // RENDER: Error State
  if (error && view === 'list') {
    return (
      <div className="hospital-communications">
        <div className="comm-header">
          <h2>Hospital Communications</h2>
          <p className="comm-subtitle" style={{color: 'red'}}>{error}</p>
          <button 
            style={{padding: '8px 16px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px'}}
            onClick={() => {
              setError(null);
              setLoading(true);
              Promise.all([
                fetchHospitals(currentHospitalId),
                fetchMessages(currentHospitalId)
              ]).catch(() => setError('Failed to reload data'));
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Hospital List View
  if (view === 'list') {
    if (!currentHospitalId) {
      return (
        <div className="hospital-communications">
          <div className="comm-header">
            <h2>Hospital Communications</h2>
            <p className="comm-subtitle" style={{color: 'red'}}>Error: Hospital ID not found. Please refresh the page.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="hospital-communications">
        <div className="comm-header">
          <h2>Hospital Communications</h2>
          <p className="comm-subtitle">Connect with other hospitals to request staff, doctors, or resources</p>
        </div>

        <div className="comm-section">
          <h3>Network of Hospitals</h3>
          <input
            type="text"
            placeholder="Search hospitals by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          {loading ? (
            <div style={{padding: '40px', textAlign: 'center'}}>
              <div className="loading">⏳ Loading hospitals...</div>
              <p style={{fontSize: '12px', color: '#999', marginTop: '10px'}}>
                This is taking longer than expected. <br/>
                Make sure the server is running on localhost:3001
              </p>
            </div>
          ) : filteredHospitals && filteredHospitals.length === 0 ? (
            <div className="empty-state">
              <p>🏥 No other hospitals found in the network</p>
              <p style={{fontSize: '12px', color: '#999'}}>
                When other hospital users sign up, they'll appear here
              </p>
            </div>
          ) : (
            <div className="hospitals-grid">
              {filteredHospitals && filteredHospitals.map((hospital) => (
                <div key={hospital?._id} className="hospital-card-list">
                  <div className="hospital-info">
                    <h4>{hospital?.name}</h4>
                    <p className="location">📍 {hospital?.location}</p>
                    <p className="contact">📧 {hospital?.email}</p>
                    <p className="contact">📞 {hospital?.phone}</p>
                  </div>
                  <button
                    className="btn-view-details"
                    onClick={() => fetchHospitalDetails(hospital?._id)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Received Messages Section */}
        {receivedMessages && receivedMessages.length > 0 && (
          <div className="comm-section">
            <h3>📬 Incoming Requests & Notifications ({receivedMessages.length})</h3>
            <div className="messages-list">
              {receivedMessages.map((msg) => (
                <div key={msg?._id} className="message-card">
                  <div className="message-header">
                    <h4>{msg?.subject}</h4>
                    <span 
                      className="urgency-badge"
                      style={{ backgroundColor: getUrgencyColor(msg?.requestDetails?.urgencyLevel) }}
                    >
                      {msg?.requestDetails?.urgencyLevel}
                    </span>
                  </div>
                  <p className="from-hospital">From: <strong>{msg?.fromHospital?.name}</strong></p>
                  <p className="message-type">Type: <strong>{msg?.messageType?.toUpperCase()}</strong></p>
                  <p className="details">{msg?.details}</p>
                  {msg?.messageType === 'staff' && msg?.requestDetails?.specialization && (
                    <p className="spec">Specialization: {msg?.requestDetails?.specialization}</p>
                  )}
                  {msg?.messageType === 'resource' && msg?.requestDetails?.resourceName && (
                    <p className="spec">Resource: {msg?.requestDetails?.resourceName} (Qty: {msg?.requestDetails?.resourceQuantity})</p>
                  )}
                  {msg?.response?.message && (
                    <div className="response-section">
                      <p className="response-label">Response:</p>
                      <p className="response-message">{msg?.response?.message}</p>
                    </div>
                  )}
                  <div className="message-actions">
                    {!msg?.response?.message ? (
                      <>
                        <button
                          className="btn-reply"
                          onClick={() => setReplyingTo(msg?._id)}
                        >
                          Reply
                        </button>
                      </>
                    ) : (
                      <span className="status-resolved">✓ Replied</span>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === msg?._id && (
                    <div className="reply-form">
                      <div className="form-group">
                        <label>Status *</label>
                        <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Reply Message *</label>
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          rows="3"
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn-send"
                          onClick={() => handleSendReply(msg?._id)}
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyMessage('');
                            setReplyStatus('approved');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty Incoming Requests State */}
        {(!receivedMessages || receivedMessages.length === 0) && (
          <div className="comm-section">
            <h3>📬 Incoming Requests & Notifications</h3>
            <div className="empty-state">
              <p>No incoming requests at this time</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>New requests from other hospitals will appear here</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER: Hospital Detail View Error State (view is detail but no data)
  if (view === 'detail' && !hospitalDetails && !loading) {
    return (
      <div className="hospital-communications">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setView('list')}>← Back to Hospitals</button>
          <h2>Hospital Details</h2>
        </div>
        <div className="comm-section">
          <div className="empty-state">
            <p style={{color: 'red', marginBottom: '20px'}}>Failed to load hospital details</p>
            <button 
              style={{padding: '8px 16px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px'}}
              onClick={() => setView('list')}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Hospital Detail View Loading
  if (view === 'detail' && loading) {
    return (
      <div className="hospital-communications">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setView('list')}>← Back to Hospitals</button>
          <h2>Loading hospital details...</h2>
        </div>
        <div className="loading">Fetching hospital information...</div>
      </div>
    );
  }

  // RENDER: Hospital Detail View
  if (view === 'detail' && hospitalDetails) {
    return (
      <div className="hospital-communications">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setView('list')}>← Back to Hospitals</button>
          <h2>{hospitalDetails?.name}</h2>
        </div>

        <div className="detail-container">
          {/* Hospital Info Card */}
          <div className="hospital-detail-card">
            <div className="detail-section">
              <h3>🏥 Hospital Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Location</label>
                  <p>{hospitalDetails?.location || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{hospitalDetails?.email || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{hospitalDetails?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Beds Info */}
            <div className="detail-section">
              <h3>🛏️ Available Beds</h3>
              <div className="bed-info">
                <div className="stat">
                  <label>Total Beds</label>
                  <p className="stat-value">{hospitalDetails?.beds?.totalBeds || 0}</p>
                </div>
                <div className="stat">
                  <label>Occupied</label>
                  <p className="stat-value">{hospitalDetails?.beds?.occupiedBeds || 0}</p>
                </div>
                <div className="stat available">
                  <label>Available</label>
                  <p className="stat-value">{hospitalDetails?.beds?.availableBeds || 0}</p>
                </div>
              </div>
            </div>

            {/* Doctors Info */}
            <div className="detail-section">
              <h3>👨‍⚕️ Available Doctors ({hospitalDetails?.doctors?.filter(d => d.availability)?.length || 0}/{hospitalDetails?.doctors?.length || 0})</h3>
              {hospitalDetails?.doctors && hospitalDetails?.doctors.length > 0 ? (
                <div className="doctors-list">
                  {hospitalDetails?.doctors?.map((doctor) => (
                    <div key={doctor?._id} className="doctor-item">
                      <div className="doctor-info">
                        <p className="doctor-name">{doctor?.name}</p>
                        <p className="doctor-dept">{doctor?.department}</p>
                        {doctor?.specialization && <p className="doctor-spec">{doctor?.specialization}</p>}
                      </div>
                      <span className={`availability-badge ${doctor?.availability ? 'available' : 'unavailable'}`}>
                        {doctor?.availability ? '✓ Available' : '✗ Unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No doctors available</p>
              )}
            </div>

            {/* Resources Info */}
            <div className="detail-section">
              <h3>📦 Available Resources</h3>
              {hospitalDetails?.resources && hospitalDetails?.resources.length > 0 ? (
                <div className="resources-list">
                  {hospitalDetails?.resources?.map((resource) => (
                    <div key={resource?._id} className="resource-item">
                      <div className="resource-info">
                        <p className="resource-name">{resource?.name}</p>
                        <p className="resource-category">{resource?.category}</p>
                        <p className="resource-units">
                          {resource?.availableUnits} / {resource?.totalUnits} {resource?.unit} available
                        </p>
                      </div>
                      <div className="resource-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{width: `${(resource?.availableUnits / (resource?.totalUnits || 1)) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-text">No resources available</p>
              )}
            </div>
          </div>

          {/* Message Composition Form */}
          <div className="message-compose-card">
            <h3>Send Request</h3>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Request Type *</label>
                <select value={messageType} onChange={(e) => setMessageType(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="doctor">Doctor</option>
                  <option value="resource">Resource</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Emergency ICU Staff Required"
                  required
                />
              </div>

              <div className="form-group">
                <label>Details *</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe your request in detail..."
                  rows="4"
                  required
                />
              </div>

              {messageType === 'staff' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Staff</label>
                      <input
                        type="number"
                        min="1"
                        value={staffCount}
                        onChange={(e) => setStaffCount(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Specialization</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g., ICU, ER, Surgery"
                      />
                    </div>
                  </div>
                </>
              )}

              {messageType === 'resource' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Resource Name</label>
                      <input
                        type="text"
                        value={resourceName}
                        onChange={(e) => setResourceName(e.target.value)}
                        placeholder="e.g., Ventilators, Oxygen"
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={resourceQuantity}
                        onChange={(e) => setResourceQuantity(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Urgency Level</label>
                  <select value={urgencyLevel} onChange={(e) => setUrgencyLevel(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                    <option value="1 day">1 Day</option>
                    <option value="3 days">3 Days</option>
                    <option value="1 week">1 Week</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-send" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => {
                    resetForm();
                    setView('list');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // FALLBACK: If somehow no view matches, show the list view
  return (
    <div className="hospital-communications">
      <div className="comm-header">
        <h2>Hospital Communications</h2>
        <p className="comm-subtitle">Connect with other hospitals to request staff, doctors, or resources</p>
      </div>
      <div className="loading">Loading...</div>
    </div>
  );
};

// Wrap the component with Error Boundary
const HospitalCommunications = (props) => (
  <ErrorBoundary>
    <HospitalCommunicationsContent {...props} />
  </ErrorBoundary>
);

export default HospitalCommunications;
