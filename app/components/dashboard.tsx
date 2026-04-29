'use client';

import { useState, useEffect } from 'react';

interface DashboardProps {
  theme: 'light' | 'dark';
}

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'beta' | 'coming-soon';
  usageCount: number;
}

interface CarouselImage {
  id: number;
  url: string;
  title: string;
  description: string;
  name: string;
  role: string;
}

export default function Dashboard({ theme }: DashboardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tools] = useState<Tool[]>([
    {
      id: 'sku',
      name: 'Shopkeep Consolidated Tool',
      description: 'Process and consolidate SKU data efficiently',
      icon: '📦',
      status: 'beta',
      usageCount: 0
    },
    {
      id: 'asin',
      name: 'Multiple Parent ASIN Checker',
      description: 'Check and validate ASIN conflicts across parent products',
      icon: '🔍',
      status: 'active',
      usageCount: 0
    }
  ]);

  // Team member photos with fixed dimensions
  const carouselImages: CarouselImage[] = [
    {
      id: 1,
      url: 'https://cdn.phototourl.com/free/2026-04-28-bac9b7bc-e97d-47da-942d-cd33ecfab89d.png',
      title: 'Listing Ops',
      description: 'No desc',
      name: 'Juday',
      role: 'Data Analyst'
    },
    {
      id: 2,
      url: 'https://i.postimg.cc/25KfQYdg/Screenshot-2026-04-17-041943.png',
      title: 'Listing Ops',
      description: 'No Desc',
      name: 'Jan2x',
      role: 'Data Analyst'
    },
    {
      id: 3,
      url: 'https://cdn.phototourl.com/free/2026-04-28-f315ed86-c7f3-4583-ae7e-fe36ab8690ed.png',
      title: 'Listing Ops',
      description: 'apo',
      name: 'Melvs',
      role: 'Data Analyst'
    },
    {
      id: 4,
      url: 'https://cdn.phototourl.com/free/2026-04-28-0053da24-c3e1-475d-a4ce-f72704342534.png',
      title: 'Listing Ops',
      description: 'No desc',
      name: 'JOns',
      role: 'Data Analyst'
    },
    {
      id: 5,
      url: 'https://cdn.phototourl.com/free/2026-04-29-69da0659-11bc-4ada-a133-71b5843cef46.png',
      title: 'Listing Ops',
      description: 'No desc',
      name: 'Ashlie',
      role: 'Data Analyst'
    },
    {
      id: 6,
      url: 'https://cdn.phototourl.com/free/2026-04-29-930ed2af-75a0-4ace-8e6a-a7de32e5afa2.png',
      title: 'Listing Ops',
      description: 'No desc',
      name: 'lorens',
      role: 'Data Analyst'
    },
    {
      id: 7,
      url: 'https://cdn.phototourl.com/free/2026-04-29-3e0567f4-9afb-4991-a154-bc57a094a4db.png',
      title: 'Listing Ops',
      description: 'No desc',
      name: 'mark',
      role: 'Data Analyst'
    },
    {
      id: 8,
      url: 'https://cdn.phototourl.com/free/2026-04-29-056a0bbf-227c-4a02-b24c-9362410b6273.png',
      title: 'Listing Ops',
      description: 'No desc',
      name: 'Rich Chards',
      role: 'Data Analyst'
    }
  ];

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const handleLaunchTool = (toolId: string) => {
    window.dispatchEvent(new CustomEvent('navigateToTool', { detail: { toolId } }));
  };

  const getToolStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>;
      case 'beta':
        return <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Beta</span>;
      case 'coming-soon':
        return <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">Coming Soon</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Listing Ops Team Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-emerald-600/20' : 'bg-emerald-100'
          }`}>
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Listing Ops Team
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
              Meet the people behind your listing operations
            </p>
          </div>
        </div>
        <p className={`text-sm max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
          Our dedicated team works tirelessly to ensure your listing operations run smoothly and efficiently.
        </p>
      </div>

      {/* Team Member Carousel Section */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Meet Our Team
        </h2>
        
        <div className="relative max-w-md mx-auto">
          {/* Carousel Container - Fixed width container */}
          <div className="relative overflow-hidden rounded-xl shadow-2xl" style={{ maxWidth: '213px', margin: '0 auto' }}>
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselImages.map((image) => (
                <div key={image.id} className="w-full flex-shrink-0 relative">
                  <div className="relative" style={{ width: '213px', height: '345px' }}>
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      style={{ width: '213px', height: '345px', objectFit: 'cover' }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    
                    {/* Team Member Info Card */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-base font-bold mb-1">{image.name}</h3>
                      <p className="text-emerald-400 font-medium text-xs mb-1">{image.role}</p>
                      <p className="text-xs text-gray-200">{image.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-black/50 hover:bg-black/70 text-white'
                  : 'bg-white/50 hover:bg-white/70 text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                theme === 'dark'
                  ? 'bg-black/50 hover:bg-black/70 text-white'
                  : 'bg-white/50 hover:bg-white/70 text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-200 rounded-full ${
                    currentSlide === index
                      ? 'w-6 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className={`flex justify-center p-4 rounded-xl ${
        theme === 'dark' ? 'bg-slate-800/30' : 'bg-gray-100/50'
      }`}>
        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {carouselImages.length}
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>Team Members</p>
        </div>
      </div>

      {/* Tools Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Available Tools
          </h2>
          <div className={`text-xs px-2 py-1 rounded-full ${
            theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'
          }`}>
            {tools.length} tools available
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-[#1E293B]/50 to-[#0F172A]/50 border-slate-700/50 hover:border-emerald-500/30'
                  : 'bg-gradient-to-br from-white/80 to-gray-100/80 border-gray-200/50 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-200/50'}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tool.name}
                    </h3>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                      {tool.description}
                    </p>
                  </div>
                </div>
                {getToolStatusBadge(tool.status)}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>
                    {tool.usageCount.toLocaleString()} uses
                  </span>
                </div>
                <button
                  onClick={() => handleLaunchTool(tool.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                      : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                  }`}
                >
                  Launch Tool →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Values */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t ${
        theme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
      }`}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🤝</div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Collaboration</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Working together for success</p>
        </div>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">⚡</div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Innovation</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Constantly improving our tools</p>
        </div>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🎯</div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Excellence</p>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Delivering quality results</p>
        </div>
      </div>
    </div>
  );
}