"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { LogoutButton } from "../components/logout-button";

// Generate realistic mock data for charts with positive trending
const generateChartData = (points: number, base: number, variance: number) => {
  return Array.from({ length: points }, (_, i) => {
    // Create upward trend with some natural variation
    const trend = (i / points) * base * 0.8; // Linear growth component
    const oscillation = Math.sin(i * 0.2) * variance * 0.3; // Reduced oscillation
    const noise = (Math.random() - 0.5) * variance * 0.2; // Small random variation

    return {
      time: `Day ${i + 1}`,
      value: Math.max(0, base + trend + oscillation + noise),
    };
  });
};

const requestData = generateChartData(14, 150, 60);
const costData = generateChartData(14, 45, 20);

// Calculate accurate percentages for display
const requestChange =
  requestData.length > 1
    ? (
      ((requestData[requestData.length - 1].value - requestData[0].value) /
        requestData[0].value) *
      100
    ).toFixed(1)
    : "0.0";

const costChange =
  costData.length > 1
    ? (
      ((costData[costData.length - 1].value - costData[0].value) /
        costData[0].value) *
      100
    ).toFixed(1)
    : "0.0";

interface UploadedModel {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "uploading" | "processing" | "deployed" | "failed";
  uploadTime: string;
  endpoint?: string;
}

interface S3Item {
  key: string;
  fileName: string;
  url: string | null;
  size?: number | null;
  lastModified?: string | null;
}

export default function Dashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"upload" | "home" | "fabric">("home");
  const [isDragging, setIsDragging] = useState(false);
  const [models, setModels] = useState<UploadedModel[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requestData, setRequestData] = useState<{ time: string; value: number }[]>([]);
  const [costData, setCostData] = useState<{ time: string; value: number }[]>([]);
  const [s3Items, setS3Items] = useState<S3Item[]>([]);
  const [s3Loading, setS3Loading] = useState(true);

  useEffect(() => {
    setRequestData(generateChartData(14, 150, 60));
    setCostData(generateChartData(14, 45, 20));
  }, []);

  const requestChange = useMemo(() => {
    if (requestData.length < 2) return '0.0';
    const first = requestData[0].value;
    const last = requestData[requestData.length - 1].value;
    return (((last - first) / first) * 100).toFixed(1);
  }, [requestData]);

  const costChange = useMemo(() => {
    if (costData.length < 2) return '0.0';
    const first = costData[0].value;
    const last = costData[costData.length - 1].value;
    return (((last - first) / first) * 100).toFixed(1);
  }, [costData]);
  const [selectedModel, setSelectedModel] = useState<UploadedModel | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showInferenceModal, setShowInferenceModal] = useState(false);
  const [inferenceInput, setInferenceInput] = useState("");
  const [inferenceOutput, setInferenceOutput] = useState("");
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!cancelled) {
          if (error || !data?.user) {
            // No user or error occurred, redirect to login
            router.push("/auth/login");
            return;
          }

          setUser(data.user);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching user:", err);
          router.push("/auth/login");
        }
      }
    }

    fetchUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled) {
        if (!session?.user) {
          router.push("/auth/login");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Minimal fetch of models from S3 API
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load(currentUserId: string) {
      try {
        setS3Loading(true);
        const res = await fetch('/api/s3');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setS3Items(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        // swallow for minimal UI
      } finally {
        if (!cancelled) setS3Loading(false);
      }
    }
    load(user.id);
    return () => { cancelled = true; };
  }, [user]);

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

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file);
    setPendingFile(file);
    setShowDeploymentModal(true);
  };

  const handleDeploymentTypeSelected = async (type: "thread" | "fabric") => {
    setShowDeploymentModal(false);
    
    if (!pendingFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing file...");

    try {
      // Step 1: Read file (0-25%)
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(25);
      setUploadStatus("Reading file data...");
      
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(pendingFile);
      });

      // Step 2: Uploading to S3 (25-60%)
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(60);
      setUploadStatus("Uploading to storage...");

      const res = await fetch('/api/s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: pendingFile.name,
          fileContent: fileContent,
          fileType: pendingFile.type,
          deploymentType: type,
        }),
      });
  
      if (!res.ok) {
        const error = await res.json();
        console.error('Upload failed:', error);
        setUploadStatus("Upload failed!");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsUploading(false);
        alert(`Upload failed: ${error.error || 'Unknown error'}`);
        return;
      }
  
      const result = await res.json();

      // Step 3: Deploying (60-90%)
      setUploadProgress(90);
      setUploadStatus(`Deploying as ${type === "thread" ? "Thread" : "Fabric"}...`);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Complete (90-100%)
      setUploadProgress(100);
      setUploadStatus("Deployment successful! 🎉");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsUploading(false);
      setPendingFile(null);
      
      // Reload to show new models
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus("An error occurred");
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsUploading(false);
      setPendingFile(null);
      console.log('Upload successful:', result);
      
      // Show success message
      alert('File uploaded successfully!');
      
      // Refresh the S3 items list
      if (user) {
        setS3Loading(true);
        try {
          const listRes = await fetch('/api/s3');
          if (listRes.ok) {
            const data = await listRes.json();
            setS3Items(Array.isArray(data?.items) ? data.items : []);
          }
        } catch (e) {
          console.error('Failed to refresh list:', e);
        } finally {
          setS3Loading(false);
        }
      }
      
      // Clear selected file
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
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
      setInferenceInput("");
      setInferenceOutput("");
    }
  };

  const handleRunInference = () => {
    if (!inferenceInput.trim()) {
      alert("Please enter input data");
      return;
    }

    // Simulate inference processing
    setInferenceOutput("Processing...");

    setTimeout(() => {
      // Mock inference result
      const mockResult = {
        model: selectedModel?.name,
        input: inferenceInput,
        prediction: Math.random() > 0.5 ? "positive" : "negative",
        confidence: (Math.random() * 0.3 + 0.7).toFixed(3),
        latency: `${Math.floor(Math.random() * 200 + 100)}ms`,
      };

      setInferenceOutput(JSON.stringify(mockResult, null, 2));
    }, 1500);
  };

  const handleCloseInferenceModal = () => {
    setShowInferenceModal(false);
    setInferenceInput("");
    setInferenceOutput("");
  };

  const getStatusColor = (status: UploadedModel["status"]) => {
    switch (status) {
      case "uploading":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "processing":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "deployed":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "failed":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: UploadedModel["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
      case "processing":
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
      case "deployed":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "failed":
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

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
                  onClick={() => setActiveTab("home")}
                  className={`px-4 py-2 rounded-md text-sm font-light transition-all duration-300 ${activeTab === "home"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`px-4 py-2 rounded-md text-sm font-light transition-all duration-300 ${activeTab === "upload"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("fabric")}
                  className={`px-4 py-2 rounded-md text-sm font-light transition-all duration-300 ${activeTab === "fabric"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  Fabric
                </button>
              </div>

              <div className="px-4 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-semibold text-sm">
                  {user?.user_metadata.full_name.split(" ")[0][0] +
                    user?.user_metadata.full_name.split(" ")[1][0] || "TU"}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Content */}
          {activeTab === "fabric" ? (
            <div>
              {/* Fabric Tab - Long-Running Server Deployments */}
              <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-light text-white mb-2">
                  Fabric Deployments
                </h1>
                <p className="text-gray-400 font-light">
                  Manage your containerized ML models on persistent servers
                </p>
              </div>

              {/* Server Stats Grid */}
              <div className="grid md:grid-cols-4 gap-6 mb-12">
                <div className="glass-card rounded-xl p-6 border border-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400 font-light">Active Instances</p>
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-light text-white">12</p>
                  <p className="text-xs text-green-400 mt-1">+3 this week</p>
                </div>

                <div className="glass-card rounded-xl p-6 border border-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400 font-light">Avg Uptime</p>
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-light text-white">99.8%</p>
                  <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
                </div>

                <div className="glass-card rounded-xl p-6 border border-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400 font-light">Total CPU</p>
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-light text-white">48</p>
                  <p className="text-xs text-gray-400 mt-1">vCPUs allocated</p>
                </div>

                <div className="glass-card rounded-xl p-6 border border-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400 font-light">Total Memory</p>
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-light text-white">192GB</p>
                  <p className="text-xs text-gray-400 mt-1">Across all instances</p>
                </div>
              </div>

              {/* Running Models */}
              <div className="glass-card rounded-2xl p-8 border border-gray-800/50 mb-8">
                <h2 className="text-2xl font-light text-white mb-6">Running Models</h2>
                <div className="space-y-4">
                  {[
                    {
                      name: "GPT-Style Text Generator",
                      instances: 3,
                      uptime: "45d 12h",
                      requests: "2.4M",
                      avgLatency: "125ms",
                      cpu: "78%",
                      memory: "32GB / 48GB",
                      status: "healthy",
                      container: "ml-gpt-prod-v2.3",
                    },
                    {
                      name: "Image Classification ResNet",
                      instances: 5,
                      uptime: "23d 8h",
                      requests: "5.1M",
                      avgLatency: "45ms",
                      cpu: "62%",
                      memory: "28GB / 40GB",
                      status: "healthy",
                      container: "ml-resnet-prod-v1.8",
                    },
                    {
                      name: "Recommendation Engine",
                      instances: 2,
                      uptime: "67d 3h",
                      requests: "8.2M",
                      avgLatency: "89ms",
                      cpu: "45%",
                      memory: "18GB / 32GB",
                      status: "healthy",
                      container: "ml-recsys-prod-v3.1",
                    },
                    {
                      name: "Sentiment Analysis BERT",
                      instances: 1,
                      uptime: "12d 19h",
                      requests: "892K",
                      avgLatency: "210ms",
                      cpu: "91%",
                      memory: "15GB / 16GB",
                      status: "warning",
                      container: "ml-bert-prod-v1.2",
                    },
                  ].map((deployment, idx) => (
                    <div
                      key={idx}
                      className="glass-strong rounded-xl p-6 border border-gray-700/30 hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-light text-white">
                              {deployment.name}
                            </h3>
                            <span
                              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                deployment.status === "healthy"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  deployment.status === "healthy"
                                    ? "bg-green-400 animate-pulse"
                                    : "bg-yellow-400 animate-pulse"
                                }`}
                              ></span>
                              <span className="capitalize">{deployment.status}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 font-mono mb-3">
                            {deployment.container}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="glass rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-500 mb-1">Instances</p>
                          <p className="text-lg font-light text-white">
                            {deployment.instances}
                          </p>
                        </div>
                        <div className="glass rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-500 mb-1">Uptime</p>
                          <p className="text-lg font-light text-white">
                            {deployment.uptime}
                          </p>
                        </div>
                        <div className="glass rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-500 mb-1">Requests</p>
                          <p className="text-lg font-light text-white">
                            {deployment.requests}
                          </p>
                        </div>
                        <div className="glass rounded-lg p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-500 mb-1">Avg Latency</p>
                          <p className="text-lg font-light text-white">
                            {deployment.avgLatency}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">CPU Usage</span>
                            <span className="text-white">{deployment.cpu}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                parseInt(deployment.cpu) > 85
                                  ? "bg-red-500"
                                  : parseInt(deployment.cpu) > 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: deployment.cpu }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">Memory</span>
                            <span className="text-white">{deployment.memory}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{
                                width: `${
                                  (parseInt(deployment.memory.split("/")[0]) /
                                    parseInt(
                                      deployment.memory.split("/")[1].replace("GB", "")
                                    )) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mt-4">
                        <button className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                          Scale
                        </button>
                        <button className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                          Logs
                        </button>
                        <button className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                          Metrics
                        </button>
                        <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20">
                          Stop
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cluster Info */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card rounded-2xl p-8 border border-gray-800/50">
                  <h3 className="text-xl font-light text-white mb-6">Cluster Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Kubernetes Version</span>
                      <span className="text-white font-mono text-sm">v1.28.3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Nodes</span>
                      <span className="text-white">8 (6 active, 2 standby)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Pods</span>
                      <span className="text-white">42 running</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Network Traffic</span>
                      <span className="text-white">2.4 TB/day</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Storage Used</span>
                      <span className="text-white">1.2 TB / 5 TB</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-8 border border-gray-800/50">
                  <h3 className="text-xl font-light text-white mb-6">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      {
                        action: "Scaled up",
                        model: "Image Classification",
                        time: "2 minutes ago",
                      },
                      {
                        action: "Deployed",
                        model: "New sentiment model v1.2",
                        time: "1 hour ago",
                      },
                      {
                        action: "Auto-healed",
                        model: "Text Generator pod-3",
                        time: "3 hours ago",
                      },
                      {
                        action: "Updated",
                        model: "Recommendation Engine v3.1",
                        time: "5 hours ago",
                      },
                    ].map((activity, idx) => (
                      <div
                        key={idx}
                        className="glass rounded-lg p-3 border border-gray-700/30 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-sm">
                            <span className="text-indigo-400">{activity.action}</span>{" "}
                            {activity.model}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "home" ? (
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
                    <h3 className="text-xl font-light text-white">
                      API Requests
                    </h3>
                    <div className="text-right">
                      <p className="text-2xl font-light text-white">
                        {Math.round(
                          requestData[requestData.length - 1]?.value || 0
                        ).toLocaleString()}
                      </p>
                      <p
                        className={`text-sm ${parseFloat(requestChange) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                          }`}
                      >
                        {parseFloat(requestChange) >= 0 ? "+" : ""}
                        {requestChange}% this week
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={requestData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient
                          id="requestsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "#9ca3af",
                          fontWeight: "300",
                        }}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "#9ca3af",
                          fontWeight: "300",
                        }}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.9)",
                          border: "1px solid rgba(75, 85, 99, 0.3)",
                          borderRadius: "8px",
                          color: "#f9fafb",
                        }}
                        labelStyle={{ color: "#f9fafb" }}
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
                    <h3 className="text-xl font-light text-white">
                      Forecasted Cost
                    </h3>
                    <div className="text-right">
                      <p className="text-2xl font-light text-white">
                        $
                        {(costData[costData.length - 1]?.value || 0).toFixed(2)}
                      </p>
                      <p
                        className={`text-sm ${parseFloat(costChange) >= 0
                          ? "text-yellow-400"
                          : "text-red-400"
                          }`}
                      >
                        {parseFloat(costChange) >= 0 ? "+" : ""}
                        {costChange}% projected
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={costData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient
                          id="costGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "#9ca3af",
                          fontWeight: "300",
                        }}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "#9ca3af",
                          fontWeight: "300",
                        }}
                        tickMargin={8}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(17, 24, 39, 0.9)",
                          border: "1px solid rgba(75, 85, 99, 0.3)",
                          borderRadius: "8px",
                          color: "#f9fafb",
                        }}
                        labelStyle={{ color: "#f9fafb" }}
                        formatter={(value: number) => [
                          `$${value.toFixed(2)}`,
                          "Cost",
                        ]}
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
                <h2 className="text-2xl font-light text-white mb-6">
                  Models
                </h2>
                <div className="space-y-4">
                  {s3Loading && (
                    <div className="text-sm text-gray-400">Loading models...</div>
                  )}
                  {!s3Loading && s3Items.length === 0 && (
                    <div className="text-sm text-gray-400">No models found.</div>
                  )}
                  {!s3Loading && s3Items.length > 0 && (
                    s3Items.map((item) => (
                      <div
                        key={item.key}
                        className="glass-strong rounded-xl p-4 border border-gray-700/30 hover:bg-white/5 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-light text-white">
                              {item.fileName || item.key}
                            </h4>
                            <p className="text-xs text-gray-500 break-all">{item.key}</p>
                          </div>
                          {item.url ? (
                            <button
                              onClick={() => {
                                setSelectedModel({
                                  id: item.key,
                                  name: item.fileName || item.key,
                                  size: item.size != null ? `${(item.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
                                  type: item.fileName?.split('.').pop()?.toUpperCase() || 'FILE',
                                  status: 'deployed',
                                  uploadTime: item.lastModified || '',
                                  endpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.weave.ai'}/v1/models/${encodeURIComponent(item.fileName || item.key)}`,
                                });
                                setShowModal(true);
                              }}
                              className="inline-block bg-transparent text-white px-3 py-1.5 rounded border border-gray-700/50 text-xs font-medium hover:bg-white/10 transition-colors"
                            >
                              Actions
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">No URL</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
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
                className={`group glass-card rounded-2xl p-12 mb-12 transition-all duration-500 border cursor-pointer ${isDragging
                  ? "border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20"
                  : "border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/30 hover:shadow-lg hover:shadow-indigo-500/10"
                  }`}
              >
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-2xl mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-indigo-600/20 ${isDragging
                      ? "animate-bounce scale-110 bg-indigo-600/30"
                      : ""
                      }`}
                  >
                    <svg
                      className={`w-10 h-10 text-gray-400 transition-all duration-500 group-hover:text-white group-hover:scale-110 ${isDragging ? "text-indigo-400 animate-pulse" : ""
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

                  <h3
                    className={`text-2xl font-light text-white mb-3 transition-all duration-300 ${isDragging
                      ? "text-indigo-300"
                      : "group-hover:text-indigo-200"
                      }`}
                  >
                    {isDragging
                      ? "Drop your model here"
                      : "Drag & drop your model file"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-8 transition-all duration-300 group-hover:text-gray-300">
                    Supports PyTorch, TensorFlow, ONNX, scikit-learn
                  </p>

                  <div className="flex items-center justify-center space-x-4">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer group"
                    >
                      <span
                        className={`inline-block bg-white text-black px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group-hover:bg-gray-100 group-hover:scale-105 ${isDragging
                          ? "bg-indigo-100 text-indigo-800 scale-105"
                          : ""
                          }`}
                      >
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
                    <button
                      className={`glass-card px-6 py-2.5 rounded-lg text-sm font-light text-gray-300 transition-all duration-300 group-hover:bg-white/5 group-hover:text-white group-hover:scale-105 ${isDragging
                        ? "bg-indigo-800/30 text-indigo-200 scale-105"
                        : ""
                        }`}
                    >
                      Connect Git Repo
                    </button>
                  </div>

                  {selectedFile && (
                    <div
                      className={`mt-6 inline-block px-4 py-2 rounded-lg border transition-all duration-300 ${isDragging
                        ? "bg-indigo-800/30 border-indigo-500 text-indigo-200"
                        : "bg-gray-800 border-gray-700 text-gray-300 group-hover:bg-gray-700/50 group-hover:border-gray-600"
                        }`}
                    >
                      <p className="text-sm">
                        Selected:{" "}
                        <span className="font-medium text-white">
                          {selectedFile.name}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deployed Models */}
              {models.length > 0 && (
                <div className="glass-card rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
                  <h2 className="text-2xl font-light text-white mb-6">
                    Your Models
                  </h2>

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
                                <span className="capitalize">
                                  {model.status}
                                </span>
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
                            {model.endpoint && model.status === "deployed" && (
                              <div className="mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-500 mb-1">
                                  API Endpoint
                                </p>
                                <code className="text-sm text-indigo-400 font-mono">
                                  {model.endpoint}
                                </code>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-6">
                            {model.status === "deployed" && (
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
                      <p className="text-sm text-gray-400 mb-1 font-light">
                        Total Deployments
                      </p>
                      <p className="text-3xl font-light text-white">
                        {models.filter((m) => m.status === "deployed").length}
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
                      <p className="text-sm text-gray-400 mb-1 font-light">
                        Processing
                      </p>
                      <p className="text-3xl font-light text-white">
                        {
                          models.filter(
                            (m) =>
                              m.status === "uploading" ||
                              m.status === "processing"
                          ).length
                        }
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
                      <p className="text-sm text-gray-400 mb-1 font-light">
                        Total Models
                      </p>
                      <p className="text-3xl font-light text-white">
                        {s3Items.length}
                      </p>
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
                <h2 className="text-2xl font-light text-white mb-2">
                  {selectedModel.name}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                    <span>{selectedModel.size}</span>
                  </span>
                  <span className="uppercase text-xs font-mono bg-gray-700 px-2 py-0.5 rounded">
                    {selectedModel.type}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${selectedModel.status === "deployed"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : selectedModel.status === "processing"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : selectedModel.status === "uploading"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                  >
                    <span className="capitalize">{selectedModel.status}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Model Details */}
            <div className="mb-8 space-y-4">
              <div className="glass rounded-lg p-4 border border-gray-700/30">
                <p className="text-xs text-gray-500 mb-1">Upload Time</p>
                <p className="text-sm text-gray-300">
                  {selectedModel.uploadTime}
                </p>
              </div>

              {selectedModel.endpoint &&
                selectedModel.status === "deployed" && (
                  <div className="glass rounded-lg p-4 border border-gray-700/30 relative">
                    <p className="text-xs text-gray-500 mb-2">API Endpoint</p>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selectedModel.endpoint!);
                        } catch (e) {
                          // no-op
                        }
                      }}
                      className="absolute top-2 right-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded border border-gray-700/50 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                      title="Copy endpoint"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2" />
                      </svg>
                      <span>Copy</span>
                    </button>
                    <code className="text-sm text-indigo-400 font-mono break-all block pr-20">
                      {selectedModel.endpoint}
                    </code>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleInference}
                disabled={selectedModel.status !== "deployed"}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${selectedModel.status === "deployed"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <h2 className="text-3xl font-light text-white mb-2">
                  Run Inference
                </h2>
                <p className="text-gray-400 text-sm">
                  Model:{" "}
                  <span className="text-indigo-400 font-mono">
                    {selectedModel.name}
                  </span>
                </p>
              </div>
              <button
                onClick={handleCloseInferenceModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
              className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 mb-6 ${inferenceInput.trim()
                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
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
                      alert("Copied to clipboard!");
                    }}
                    className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
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

      {/* Deployment Type Selection Modal */}
      {showDeploymentModal && pendingFile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowDeploymentModal(false);
            setPendingFile(null);
          }}
        >
          <div
            className="glass-strong rounded-2xl p-8 max-w-2xl w-full border border-gray-700/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-light text-white mb-2">
                Choose Deployment Type
              </h2>
              <p className="text-gray-400 text-sm">
                Select how you want to deploy{" "}
                <span className="text-indigo-400 font-mono">{pendingFile.name}</span>
              </p>
            </div>

            {/* Deployment Options */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Thread Option */}
              <button
                onClick={() => handleDeploymentTypeSelected("thread")}
                className="group relative glass-card rounded-xl p-6 border border-gray-700/50 hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  {/* Help Icon with Tooltip */}
                  <div className="relative group/tooltip">
                    <div className="w-5 h-5 rounded-full border border-gray-600 text-gray-400 flex items-center justify-center text-xs cursor-help hover:border-indigo-400 hover:text-indigo-400 transition-colors">
                      ?
                    </div>
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10">
                      <p className="text-xs text-gray-300">
                        <strong className="text-white">Serverless Architecture:</strong> Deploy
                        on our event-driven infrastructure. Automatically scales from zero to millions
                        of requests. Pay only for actual compute time. Ideal for variable workloads.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-light text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  Thread
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Serverless inference engine
                </p>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Elastic scaling</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Usage-based pricing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Cold-start optimization</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500">
                    Best for: <span className="text-white">On-demand APIs, dynamic workloads</span>
                  </p>
                </div>
              </button>

              {/* Fabric Option */}
              <button
                onClick={() => handleDeploymentTypeSelected("fabric")}
                className="group relative glass-card rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 hover:bg-white/5 transition-all duration-300 text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                  </div>
                  {/* Help Icon with Tooltip */}
                  <div className="relative group/tooltip">
                    <div className="w-5 h-5 rounded-full border border-gray-600 text-gray-400 flex items-center justify-center text-xs cursor-help hover:border-purple-400 hover:text-purple-400 transition-colors">
                      ?
                    </div>
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10">
                      <p className="text-xs text-gray-300">
                        <strong className="text-white">Persistent Containers:</strong> Deploy on
                        dedicated servers with Kubernetes. Always-on instances, predictable latency,
                        full control. Ideal for high-traffic production workloads.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-light text-white mb-2 group-hover:text-purple-300 transition-colors">
                  Fabric
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Long-running server deployment
                </p>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Dedicated instances</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Consistent latency</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Full observability</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500">
                    Best for: <span className="text-white">High-traffic apps, real-time</span>
                  </p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowDeploymentModal(false);
                  setPendingFile(null);
                }}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full border border-gray-700/50 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                  {uploadProgress === 100 ? (
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
              </div>
              
              <h3 className="text-xl font-light text-white mb-2">
                {uploadStatus}
              </h3>
              <p className="text-sm text-gray-400">
                {uploadProgress < 100 ? "Please wait..." : "Redirecting..."}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="h-full w-full bg-white/20 animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Percentage */}
              <div className="mt-2 text-center">
                <span className="text-sm font-mono text-gray-400">
                  {uploadProgress}%
                </span>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-6 space-y-2">
              <div className={`flex items-center space-x-2 text-xs ${uploadProgress >= 25 ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 25 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                <span>Reading file data</span>
              </div>
              <div className={`flex items-center space-x-2 text-xs ${uploadProgress >= 60 ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 60 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                <span>Uploading to storage</span>
              </div>
              <div className={`flex items-center space-x-2 text-xs ${uploadProgress >= 90 ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${uploadProgress >= 90 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                <span>Configuring deployment</span>
              </div>
              <div className={`flex items-center space-x-2 text-xs ${uploadProgress === 100 ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${uploadProgress === 100 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                <span>Deployment complete</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
