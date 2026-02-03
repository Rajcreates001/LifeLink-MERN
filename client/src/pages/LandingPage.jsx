// client/src/pages/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="gradient-background-universal min-h-screen">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <a href="#" className="text-xl font-bold text-slate-800 hover:opacity-80">
              <i className="fas fa-heart-pulse mr-2 text-sky-500"></i>LifeLink
            </a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-4">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold leading-6 text-gray-700 hover:text-sky-600">
              Log in <span aria-hidden="true">&rarr;</span>
            </button>
            <button onClick={() => navigate('/signup')} className="rounded-md bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:scale-105 transition-transform">
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="isolate">
        <div className="relative h-screen flex items-center justify-center">
          <div className="mx-auto max-w-3xl text-center px-6 z-10 animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-7xl animate-slide-in-up">
              Connecting Lives, Saving Lives
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-700 animate-slide-in-up delay-200">
              A unified platform for public health emergencies, connecting citizens, hospitals, and government for a safer tomorrow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 animate-slide-in-up delay-300">
              <button onClick={() => navigate('/signup')} className="rounded-md bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-3 text-base font-semibold text-white shadow-xl hover:scale-105 transition-transform animate-pulse-cta">
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="pb-24 -mt-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { icon: 'fa-triangle-exclamation', title: 'Emergency Alerts', desc: 'Instantly notify the nearest hospital with your location.' },
                { icon: 'fa-droplet', title: 'Blood Donation', desc: 'Find available donors or see urgent blood requests.' },
                { icon: 'fa-chart-pie', title: 'Health Analytics', desc: 'AI-driven insights to predict and manage outbreaks.' }
              ].map((feature, i) => (
                <div key={feature.title} className="bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-white/50 hover:-translate-y-2 transition-transform duration-300">
                  <div className="text-sky-500 text-4xl mb-4"><i className={`fas ${feature.icon}`}></i></div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-700">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;