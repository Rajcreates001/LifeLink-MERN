// client/src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Common';

const API_BASE_URL = '${import.meta.env.VITE_API_URL}'; // Ensure this matches your backend port

const AuthPage = ({ isSignup }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // State for Login
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'public' });
  
  // State for Signup
  const [formData, setFormData] = useState({ 
    role: 'public', name: '', email: '', phone: '', password: '', confirmPassword: '', 
    age: '', gender: '',
    hospital_name: '', registration_id: '', contact_number: '', 
    is_donor: false, blood_group: 'A+', organ_donor: false, location: '', 
    department: '', designation: '', official_id_number: '', jurisdiction: '' 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handlers
  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  
  const handleSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      login(data.user); // Save to context
      
      // Redirect based on role
      if (data.user.role === 'public') navigate('/dashboard/public');
      else if (data.user.role === 'hospital') navigate('/dashboard/hospital');
      else if (data.user.role === 'government') navigate('/dashboard/government');
      else navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) return setError("Passwords don't match");
    
    setLoading(true);
    // Construct payload to match Backend expectations
    const payload = { 
        name: formData.name, email: formData.email, phone: formData.phone, password: formData.password, role: formData.role,
        age: formData.age, gender: formData.gender,
        hospitalData: formData.role === 'hospital' ? { hospital_name: formData.hospital_name, registration_id: formData.registration_id, contact_number: formData.contact_number } : null, 
        publicDonorData: formData.role === 'public' ? { is_donor: formData.is_donor, blood_group: formData.blood_group, organ_donor: formData.organ_donor, location: formData.location } : null, 
        governmentData: formData.role === 'government' ? { department: formData.department, designation: formData.designation, official_id_number: formData.official_id_number, jurisdiction: formData.jurisdiction } : null 
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert('Signup Successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 gradient-background-universal">
      <div className="w-full max-w-md animate-zoom-in">
        <div className="relative">
          <button onClick={() => navigate('/')} className="absolute -top-12 -left-2 text-gray-600 hover:text-sky-600 bg-white/50 p-2 rounded-full shadow transition hover:scale-110">
            <i className="fas fa-arrow-left"></i> Back
          </button>
          
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-700 mt-2">
                {isSignup ? 'Join LifeLink today.' : 'Sign in to your dashboard.'}
              </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm font-bold">{error}</div>}

            {isSignup ? (
              // --- SIGN UP FORM ---
              <form className="space-y-4" onSubmit={handleSignupSubmit}>
                <select name="role" value={formData.role} onChange={handleSignupChange} className="block w-full rounded-lg border-gray-300 py-3 px-2 bg-gray-50">
                    <option value="public">Public User</option>
                    <option value="hospital">Hospital Staff</option>
                    <option value="government">Government Official</option>
                </select>
                <Input name="name" type="text" placeholder="Full Name" icon="fa-user" value={formData.name} onChange={handleSignupChange} required />
                <Input name="email" type="email" placeholder="Email" icon="fa-envelope" value={formData.email} onChange={handleSignupChange} required />
                <Input name="phone" type="tel" placeholder="Phone" icon="fa-phone" value={formData.phone} onChange={handleSignupChange} required />
                
                <div className="grid grid-cols-2 gap-2">
                    <Input name="age" type="number" placeholder="Age" icon="fa-calendar" value={formData.age} onChange={handleSignupChange} required />
                    <select name="gender" value={formData.gender} onChange={handleSignupChange} className="rounded-lg border-gray-300 bg-gray-50 px-2">
                        <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                    </select>
                </div>

                {/* Role Specific Fields */}
                {formData.role === 'hospital' && (
                    <div className="space-y-3 border-t pt-3">
                        <Input name="hospital_name" type="text" placeholder="Hospital Name" icon="fa-hospital" value={formData.hospital_name} onChange={handleSignupChange} />
                        <Input name="registration_id" type="text" placeholder="Reg ID" icon="fa-id-card" value={formData.registration_id} onChange={handleSignupChange} />
                        <Input name="contact_number" type="tel" placeholder="Contact" icon="fa-headset" value={formData.contact_number} onChange={handleSignupChange} />
                    </div>
                )}
                
                {formData.role === 'public' && (
                    <div className="space-y-3 border-t pt-3">
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" name="is_donor" checked={formData.is_donor} onChange={handleSignupChange} />
                            <span>Register as Donor?</span>
                        </label>
                        {formData.is_donor && (
                            <>
                                <select name="blood_group" value={formData.blood_group} onChange={handleSignupChange} className="w-full p-2 rounded bg-gray-50 border">
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                                <Input name="location" type="text" placeholder="City, State" icon="fa-map-marker-alt" value={formData.location} onChange={handleSignupChange} />
                            </>
                        )}
                    </div>
                )}

                {/* Gov fields omitted for brevity, add similarly if needed */}

                <Input name="password" type="password" placeholder="Password" icon="fa-lock" value={formData.password} onChange={handleSignupChange} required />
                <Input name="confirmPassword" type="password" placeholder="Confirm Password" icon="fa-lock" value={formData.confirmPassword} onChange={handleSignupChange} required />

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-violet-500 text-white py-3 rounded-lg font-bold shadow-md hover:scale-105 transition-transform">
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            ) : (
              // --- LOGIN FORM ---
              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <select name="role" value={loginData.role} onChange={handleLoginChange} className="block w-full rounded-lg border-gray-300 py-3 px-2 bg-gray-50">
                    <option value="public">Public User</option>
                    <option value="hospital">Hospital Staff</option>
                    <option value="government">Government Official</option>
                </select>
                <Input name="email" type="email" placeholder="Email Address" icon="fa-envelope" value={loginData.email} onChange={handleLoginChange} />
                <Input name="password" type="password" placeholder="Password" icon="fa-lock" value={loginData.password} onChange={handleLoginChange} />
                
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-500 to-violet-500 text-white py-3 rounded-lg font-bold shadow-md hover:scale-105 transition-transform">
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate(isSignup ? '/login' : '/signup')} 
                className="text-sm font-semibold text-sky-600 hover:text-sky-500"
              >
                {isSignup ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;