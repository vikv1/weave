import Link from "next/link";
import Navbar from "./components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.15), transparent 50%, rgba(168, 85, 247, 0.1))',
            animation: 'gradient-shift 15s ease infinite'
          }}
        ></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(to top left, rgba(236, 72, 153, 0.12), transparent 50%, rgba(59, 130, 246, 0.08))',
            animation: 'gradient-shift 20s ease-in-out infinite reverse'
          }}
        ></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Navigation */}
        <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight animate-fade-in-up">
              Deploy ML Models
              <br />
              <span className="italic font-normal bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent animate-fade-in-up animation-delay-100 inline-block px-1 pb-1">
                in seconds
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in-up animation-delay-200">
              The simplest way to deploy machine learning models.{" "}
              <em className="text-white not-italic">Drag, drop, and scale</em> —
              no DevOps required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Link href="/dashboard">
                <button className="animate-pulse bg-white text-black px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.8)] hover:cursor-pointer">
                  Deploy Your Model
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up animation-delay-500">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Are you still deploying ML models{" "}
              <em className="italic">like it's 2024?</em>
            </h2>
            <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Hours wasted on complex infrastructure — but enterprise ML
              deployment breaks down due to YAML configs, Docker complexity, and
              manual scaling headaches.
            </p>
            <p className="text-base md:text-lg text-white mt-4 font-light">
              <em className="italic">It doesn't have to be this way.</em>
            </p>
          </div>

          {/* How it Works */}
          <div className="grid md:grid-cols-3 gap-12 mb-16 animate-fade-in-up animation-delay-600">
            <div className="text-center animate-fade-in-up animation-delay-700">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-light text-lg">
                01
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Upload Your Model
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">
                Drag and drop your model file or connect to your Git repository.
                We support PyTorch, TensorFlow, scikit-learn, and more.
              </p>
            </div>

            <div className="text-center animate-fade-in-up animation-delay-800">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-light text-lg">
                02
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Configure (Optional)
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">
                Smart defaults work for most cases. Customize scaling,
                endpoints, and monitoring as needed.
              </p>
            </div>

            <div className="text-center animate-fade-in-up animation-delay-900">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-light text-lg">
                03
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Deploy & Scale
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">
                Get your API endpoint instantly. We handle scaling from zero to
                millions of requests automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800/50 select-none">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up animation-delay-1000">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Built for <em className="italic">Everyone</em>
            </h2>
            <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto font-light">
              Everything you need to deploy, scale, and monitor your ML models
              with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up animation-delay-1100">
            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1200 hover:bg-gray-900/30 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">
                Drag & Drop Deploy
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Upload your model file and deploy instantly. No YAML configs, no
                Docker files, no headaches.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1300 hover:bg-gray-900/30 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              <h3 className="text-lg font-light text-white">Auto-Scaling</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Handle 10 requests or 10 million. We automatically scale your
                models based on demand.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1400 hover:bg-gray-900/30 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <h3 className="text-lg font-light text-white">
                Real-Time Monitoring
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Track latency, throughput, and accuracy with beautiful,
                intuitive dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Ready to deploy <em className="italic">smarter?</em>
          </h2>
          <p className="text-base md:text-lg text-gray-400 mb-8 font-light">
            Join thousands of ML engineers who've simplified their deployment
            workflow.
          </p>
          <Link href="/dashboard">
            <button className="animate-pulse bg-white text-black px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.8)] hover:cursor-pointer">
              Deploy Your Model
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-10 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-black"
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
              <span className="text-lg font-light text-white">Weave</span>
            </div>
          </div>
          <div className="border-t border-gray-800/50 mt-8 pt-6 text-center">
            <p className="text-gray-500 text-sm font-light">
              © 2025 Weave. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
