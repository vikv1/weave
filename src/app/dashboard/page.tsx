'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {createClient} from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Generate realistic mock data for charts with positive trending
const generateChartData = (points: number, base: number, variance: number) => {
  return Array.from({ length: points }, (_, i) => {
    // Create upward trend with some natural variation
    const trend = (i / points) * base * 0.8; // Linear growth component
    const oscillation = Math.sin(i * 0.2) * variance * 0.3; // Reduced oscillation
    const noise = (Math.random() - 0.5) * variance * 0.2; // Small random variation

    return {
      time: `Day ${i + 1}`,
      value: Math.max(0, base + trend + oscillation + noise)
    };
  });
};

const requestData = generateChartData(14, 150, 60);
const costData = generateChartData(14, 45, 20);

// Calculate accurate percentages for display
const requestChange = requestData.length > 1 ?
  ((requestData[requestData.length - 1].value - requestData[0].value) / requestData[0].value * 100).toFixed(1) : '0.0';

const costChange = costData.length > 1 ?
  ((costData[costData.length - 1].value - costData[0].value) / costData[0].value * 100).toFixed(1) : '0.0';

interface UploadedModel {
  id: string;
  name: string;
  size: string;
  type: string;
  status: 'uploading' | 'processing' | 'deployed' | 'failed';
  uploadTime: string;
  endpoint?: string;
}

export default function Dashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'upload' | 'home'>('home');
  const [isDragging, setIsDragging] = useState(false);
  const [models, setModels] = useState<UploadedModel[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<UploadedModel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInferenceModal, setShowInferenceModal] = useState(false);
  const [inferenceInput, setInferenceInput] = useState('');
  const [inferenceOutput, setInferenceOutput] = useState('');


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
  }, []);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!cancelled) {
        setUser(data?.user ?? null);
        // console.log(data?.user?.id);
      }
    }
    fetchUser();
    return () => { cancelled = true; };
  }, [supabase]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);

    const newModel: UploadedModel = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.name.split('.').pop() || 'unknown',
      status: 'uploading',
      uploadTime: new Date().toLocaleString(),
    };

    setModels((prev) => [newModel, ...prev]);

    // Simulate upload process
    setTimeout(() => {
      setModels((prev) =>
        prev.map((m) =>
          m.id === newModel.id ? { ...m, status: 'processing' } : m
        )
      );
    }, 1500);

    setTimeout(() => {
      setModels((prev) =>
        prev.map((m) =>
          m.id === newModel.id
            ? {
                ...m,
                status: 'deployed',
                endpoint: `https://api.weave.ai/v1/models/${newModel.id}`,
              }
            : m
        )
      );
    }, 4000);
  };

  const handleModelClick = (model: UploadedModel) => {
    setSelectedModel(model);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedModel(null);
  };

  const handleDeleteModel = () => {
    if (selectedModel) {
      setModels((prev) => prev.filter((m) => m.id !== selectedModel.id));
      handleCloseModal();
    }
  };

  const handleInference = () => {
    if (selectedModel) {
      setShowInferenceModal(true);
      setInferenceInput('');
      setInferenceOutput('');
    }
  };

  const handleRunInference = () => {
    if (!inferenceInput.trim()) {
      alert('Please enter input data');
      return;
    }
    
    // Simulate inference processing
    setInferenceOutput('Processing...');
    
    setTimeout(() => {
      // Mock inference result
      const mockResult = {
        model: selectedModel?.name,
        input: inferenceInput,
        prediction: Math.random() > 0.5 ? 'positive' : 'negative',
        confidence: (Math.random() * 0.3 + 0.7).toFixed(3),
        latency: `${Math.floor(Math.random() * 200 + 100)}ms`
      };
      
      setInferenceOutput(JSON.stringify(mockResult, null, 2));
    }, 1500);
  };

  const handleCloseInferenceModal = () => {
    setShowInferenceModal(false);
    setInferenceInput('');
    setInferenceOutput('');
  };

  const getStatusColor = (status: UploadedModel['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'deployed':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: UploadedModel['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        );
      case 'processing':
        return (
          <svg
            className="animate-pulse w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'deployed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">Weave</span>
            </Link>

            <div className="flex items-center space-x-4">
              {/* Tab Navigation */}
              <div className="glass-card rounded-lg p-1 flex space-x-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-4 py-2 rounded-md text-sm font-light transition-all duration-300 ${
                    activeTab === 'home'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-md text-sm font-light transition-all duration-300 ${
                    activeTab === 'upload'
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Upload
                </button>
              </div>

              <button className="text-gray-400 hover:text-white transition-colors text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-semibold text-sm">{user?.user_metadata.full_name.split(" ")[0][0] + user?.user_metadata.full_name.split(" ")[1][0] || 'TU'}</span>
              </div>  
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {activeTab === 'home' ? (
            <div>
              {/* Home Tab */}
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-light text-white mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-400 font-light">
                  Monitor your ML deployments and costs
                </p>
              </div>

              {/* Charts Section */}
              <div className="grid lg:grid-cols-2 gap-8 mb-12">
                {/* Requests Chart */}
                <div className="glass-card rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-light text-white">API Requests</h3>
                    <div className="text-right">
                      <p className="text-2xl font-light text-white">{Math.round(requestData[requestData.length - 1]?.value || 0).toLocaleString()}</p>
                      <p className={`text-sm ${parseFloat(requestChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(requestChange) >= 0 ? '+' : ''}{requestChange}% this week
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={requestData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
                      <defs>
                        <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: '300' }}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: '300' }}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: '1px solid rgba(75, 85, 99, 0.3)',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        labelStyle={{ color: '#f9fafb' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#requestsGradient)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Cost Chart */}
                <div className="glass-card rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-light text-white">Forecasted Cost</h3>
                    <div className="text-right">
                      <p className="text-2xl font-light text-white">${(costData[costData.length - 1]?.value || 0).toFixed(2)}</p>
                      <p className={`text-sm ${parseFloat(costChange) >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {parseFloat(costChange) >= 0 ? '+' : ''}{costChange}% projected
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={costData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
                      <defs>
                        <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: '300' }}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: '300' }}
                        tickMargin={8}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.9)',
                          border: '1px solid rgba(75, 85, 99, 0.3)',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        labelStyle={{ color: '#f9fafb' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#costGradient)"
                        fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Model Rankings */}
              <div className="glass-card rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
                <h2 className="text-2xl font-light text-white mb-6">Models by Usage</h2>
                <div className="space-y-4">
                  {[
                    { name: 'sentiment-analysis-v2.pt', requests: 1247, cost: 23.45, trend: '+15%', size: '45.2 MB', type: 'pt', uploadTime: '2024-01-15, 3:24 PM' },
                    { name: 'image-classifier-prod.pt', requests: 892, cost: 18.72, trend: '+8%', size: '128.5 MB', type: 'pt', uploadTime: '2024-01-18, 10:15 AM' },
                    { name: 'text-summarizer-beta.pt', requests: 634, cost: 12.18, trend: '+22%', size: '67.8 MB', type: 'pt', uploadTime: '2024-01-20, 2:45 PM' },
                    { name: 'fraud-detector-v1.pt', requests: 423, cost: 8.91, trend: '-3%', size: '32.1 MB', type: 'pt', uploadTime: '2024-01-12, 9:30 AM' },
                    { name: 'recommendation-engine.pt', requests: 298, cost: 6.24, trend: '+5%', size: '89.3 MB', type: 'pt', uploadTime: '2024-01-22, 4:20 PM' },
                  ].map((model, index) => (
                    <div 
                      key={index} 
                      onClick={() => handleModelClick({
                        id: `mock-${index}`,
                        name: model.name,
                        size: model.size,
                        type: model.type,
                        status: 'deployed' as const,
                        uploadTime: model.uploadTime,
                        endpoint: `https://api.weave.ai/v1/models/mock-${index}`
                      })}
                      className="glass-strong rounded-xl p-4 border border-gray-700/30 hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="text-lg font-light text-white">{model.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-light ${
                              model.trend.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {model.trend}
                            </span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-400">
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span>{model.requests.toLocaleString()} requests</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>${model.cost}</span>
                            </span>
                          </div>
                        </div>
                        <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${(model.requests / 1247) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Upload Tab */}
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-light text-white mb-2">
                  Deploy Your Model
                </h1>
                <p className="text-gray-400 font-light">
                  Drag and drop your model file to get started
                </p>
              </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group glass-card rounded-2xl p-12 mb-12 transition-all duration-500 border cursor-pointer ${
              isDragging
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20'
                : 'border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/30 hover:shadow-lg hover:shadow-indigo-500/10'
            }`}
          >
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-2xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-indigo-600/20 ${
                isDragging ? 'animate-bounce scale-110 bg-indigo-600/30' : ''
              }`}>
                <svg
                  className={`w-10 h-10 text-gray-400 transition-all duration-500 group-hover:text-white group-hover:scale-110 ${
                    isDragging ? 'text-indigo-400 animate-pulse' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <h3 className={`text-2xl font-light text-white mb-3 transition-all duration-300 ${
                isDragging ? 'text-indigo-300' : 'group-hover:text-indigo-200'
              }`}>
                {isDragging
                  ? 'Drop your model here'
                  : 'Drag & drop your model file'}
              </h3>
              <p className="text-gray-400 text-sm mb-8 transition-all duration-300 group-hover:text-gray-300">
                Supports PyTorch, TensorFlow, ONNX, scikit-learn
              </p>

              <div className="flex items-center justify-center space-x-4">
                <label htmlFor="file-upload" className="cursor-pointer group">
                  <span className={`inline-block bg-white text-black px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group-hover:bg-gray-100 group-hover:scale-105 ${
                    isDragging ? 'bg-indigo-100 text-indigo-800 scale-105' : ''
                  }`}>
                    Choose File
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pt,.pth,.h5,.pb,.onnx,.pkl"
                  />
                </label>
                <button className={`glass-card px-6 py-2.5 rounded-lg text-sm font-light text-gray-300 transition-all duration-300 group-hover:bg-white/5 group-hover:text-white group-hover:scale-105 ${
                  isDragging ? 'bg-indigo-800/30 text-indigo-200 scale-105' : ''
                }`}>
                  Connect Git Repo
                </button>
              </div>

              {selectedFile && (
                <div className={`mt-6 inline-block px-4 py-2 rounded-lg border transition-all duration-300 ${
                  isDragging
                    ? 'bg-indigo-800/30 border-indigo-500 text-indigo-200'
                    : 'bg-gray-800 border-gray-700 text-gray-300 group-hover:bg-gray-700/50 group-hover:border-gray-600'
                }`}>
                  <p className="text-sm">
                    Selected: <span className="font-medium text-white">{selectedFile.name}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Deployed Models */}
          {models.length > 0 && (
            <div className="glass-card rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
              <h2 className="text-2xl font-light text-white mb-6">Your Models</h2>

              <div className="space-y-4">
                {models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelClick(model)}
                    className="glass-strong rounded-xl p-6 hover:bg-white/5 transition-all duration-300 border border-gray-700/30 hover:border-gray-600/50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {model.name}
                          </h3>
                          <span
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              model.status
                            )}`}
                          >
                            {getStatusIcon(model.status)}
                            <span className="capitalize">{model.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <span className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{model.size}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{model.uploadTime}</span>
                          </span>
                          <span className="uppercase text-xs font-mono bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                            {model.type}
                          </span>
                        </div>
                        {model.endpoint && model.status === 'deployed' && (
                          <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-500 mb-1">API Endpoint</p>
                            <code className="text-sm text-indigo-400 font-mono">
                              {model.endpoint}
                            </code>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-6">
                        {model.status === 'deployed' && (
                          <>
                            <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                            </button>
                            <button className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </button>
                          </>
                        )}
                        <button className="p-2 bg-gray-800 rounded-lg hover:bg-red-900/20 hover:border-red-500/50 transition-colors border border-gray-700 group">
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="glass-card rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-light">Total Deployments</p>
                  <p className="text-3xl font-light text-white">
                    {models.filter((m) => m.status === 'deployed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 backdrop-blur-sm">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-light">Processing</p>
                  <p className="text-3xl font-light text-white">
                    {models.filter(
                      (m) => m.status === 'uploading' || m.status === 'processing'
                    ).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 backdrop-blur-sm">
                  <svg
                    className="w-6 h-6 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-light">Total Models</p>
                  <p className="text-3xl font-light text-white">{models.length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 backdrop-blur-sm">
                  <svg
                    className="w-6 h-6 text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
            </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedModel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="glass-strong rounded-2xl p-8 max-w-2xl w-full border border-gray-700/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light text-white mb-2">{selectedModel.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>{selectedModel.size}</span>
                  </span>
                  <span className="uppercase text-xs font-mono bg-gray-700 px-2 py-0.5 rounded">
                    {selectedModel.type}
                  </span>
                  <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    selectedModel.status === 'deployed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    selectedModel.status === 'processing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    selectedModel.status === 'uploading' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    <span className="capitalize">{selectedModel.status}</span>
                  </span>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Model Details */}
            <div className="mb-8 space-y-4">
              <div className="glass rounded-lg p-4 border border-gray-700/30">
                <p className="text-xs text-gray-500 mb-1">Upload Time</p>
                <p className="text-sm text-gray-300">{selectedModel.uploadTime}</p>
              </div>
              
              {selectedModel.endpoint && selectedModel.status === 'deployed' && (
                <div className="glass rounded-lg p-4 border border-gray-700/30">
                  <p className="text-xs text-gray-500 mb-2">API Endpoint</p>
                  <code className="text-sm text-indigo-400 font-mono break-all">
                    {selectedModel.endpoint}
                  </code>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleInference}
                disabled={selectedModel.status !== 'deployed'}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedModel.status === 'deployed'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Inference</span>
              </button>
              
              <button
                onClick={handleDeleteModel}
                className="px-6 py-3 rounded-lg font-medium border-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all duration-300 hover:scale-105"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inference Modal */}
      {showInferenceModal && selectedModel && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseInferenceModal}
        >
          <div 
            className="glass-strong rounded-2xl p-8 max-w-4xl w-full border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-light text-white mb-2">Run Inference</h2>
                <p className="text-gray-400 text-sm">
                  Model: <span className="text-indigo-400 font-mono">{selectedModel.name}</span>
                </p>
              </div>
              <button 
                onClick={handleCloseInferenceModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Input Data
              </label>
              <textarea
                value={inferenceInput}
                onChange={(e) => setInferenceInput(e.target.value)}
                placeholder='Enter your input data (e.g., "This is a great product!" or JSON format)'
                className="w-full h-40 bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunInference}
              disabled={!inferenceInput.trim()}
              className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 mb-6 ${
                inferenceInput.trim()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Run Inference</span>
            </button>

            {/* Output Section */}
            {inferenceOutput && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Output
                </label>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 relative">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                    {inferenceOutput}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inferenceOutput);
                      alert('Copied to clipboard!');
                    }}
                    className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* API Example */}
            <div className="mt-6 glass rounded-lg p-4 border border-gray-700/30">
              <p className="text-xs text-gray-500 mb-2">API Endpoint</p>
              <code className="text-sm text-indigo-400 font-mono break-all">
                POST {selectedModel.endpoint}
              </code>
              <p className="text-xs text-gray-500 mt-3 mb-2">cURL Example</p>
              <pre className="text-xs text-gray-400 font-mono bg-gray-900/50 p-3 rounded overflow-x-auto">
{`curl -X POST ${selectedModel.endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"input": "your input data here"}'`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
