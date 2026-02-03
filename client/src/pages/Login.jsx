import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    // Default role is public
    const [formData, setFormData] = useState({ email: '', password: '', role: 'public' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Login failed');

        // Validation: Ensure the user object exists from backend
        if (!data.user || !data.user.role) {
            throw new Error("Invalid server response: User profile missing.");
        }

        // Pass both user and token to context
        login(data.user, data.token);

        // Success navigation
        const userRole = data.user.role.toLowerCase();
        if (userRole === 'hospital') navigate('/dashboard/hospital');
        else if (userRole === 'government') navigate('/dashboard/government');
        else navigate('/dashboard/public');

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in border border-white/50">
                
                {/* Top Blue Bar */}
                <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-full"></div>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl shadow-lg mb-4">
                            <i className="fas fa-sign-in-alt"></i>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Welcome Back</h2>
                        <p className="text-gray-500 text-sm mt-1">Select your portal to continue</p>
                    </div>

                    {/* ROLE SELECTOR TABS */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl mb-6">
                        {['public', 'hospital', 'government'].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setFormData({ ...formData, role: r })}
                                className={`py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 ${
                                    formData.role === r
                                        ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Error Box */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100 flex items-center gap-3 animate-shake">
                            <i className="fas fa-exclamation-circle text-lg"></i>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                            <div className="relative">
                                <i className="fas fa-envelope absolute left-4 top-3.5 text-gray-400"></i>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-4 top-3.5 text-gray-400"></i>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2"
                        >
                            {loading ? <><i className="fas fa-spinner fa-spin"></i> Processing...</> : 'Login Securely'}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-slate-100">
                        <p className="text-gray-500 text-sm">
                            New here?{' '}
                            <Link to="/signup" className="text-blue-600 font-bold hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;