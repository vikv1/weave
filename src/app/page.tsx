'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-gray-800/50' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-medium text-white">Weave</span>
            </div>

            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">
                Pricing
              </a>
              <Link href="/dashboard">
                <button className="bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight animate-fade-in-up">
              Deploy ML Models
              <br />
              <span className="italic font-normal text-gray-400 animate-fade-in-up animation-delay-100">in seconds</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in-up animation-delay-200">
              The simplest way to deploy machine learning models. <em className="text-white not-italic">Drag, drop, and scale</em> — no DevOps required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Link href="/dashboard">
                <button className="bg-white text-black px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-300">
                  Start Deploying Free
                </button>
              </Link>
              <button className="border border-gray-600 text-white px-8 py-3 rounded-lg text-base font-light hover:bg-gray-800/50 transition-all duration-300">
                Watch Demo
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-6 font-light animate-fade-in-up animation-delay-400">
              No credit card required • Free for up to 3 models
            </p>
          </div>

        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up animation-delay-500">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Are you still deploying ML models <em className="italic">like it's 2015?</em>
            </h2>
            <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Hours wasted on complex infrastructure — but enterprise ML deployment breaks down due to YAML configs, Docker complexity, and manual scaling headaches.
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
              <h3 className="text-xl font-light text-white mb-3">Upload Your Model</h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">
                Drag and drop your model file or connect to your Git repository. We support PyTorch, TensorFlow, scikit-learn, and more.
              </p>
            </div>

            <div className="text-center animate-fade-in-up animation-delay-800">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-light text-lg">
                02
              </div>
              <h3 className="text-xl font-light text-white mb-3">Configure (Optional)</h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">
                Smart defaults work for most cases. Customize scaling, endpoints, and monitoring as needed.
              </p>
            </div>

            <div className="text-center animate-fade-in-up animation-delay-900">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-light text-lg">
                03
              </div>
              <h3 className="text-xl font-light text-white mb-3">Deploy & Scale</h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">
                Get your API endpoint instantly. We handle scaling from zero to millions of requests automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 lg:px-8 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up animation-delay-1000">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Built for <em className="italic">ML Teams</em>
            </h2>
            <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto font-light">
              Everything you need to deploy, scale, and monitor your ML models with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up animation-delay-1100">
            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1200 hover:bg-gray-900/30 transition-all duration-300">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">Drag & Drop Deploy</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Upload your model file and deploy instantly. No YAML configs, no Docker files, no headaches.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1300 hover:bg-gray-900/30 transition-all duration-300">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">Auto-Scaling</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Handle 10 requests or 10 million. We automatically scale your models based on demand.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1400 hover:bg-gray-900/30 transition-all duration-300">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">Real-Time Monitoring</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Track latency, throughput, and accuracy with beautiful, intuitive dashboards.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1500 hover:bg-gray-900/30 transition-all duration-300">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">Enterprise Security</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                SOC 2 compliant with end-to-end encryption. Your models and data stay secure.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1600 hover:bg-gray-900/30 transition-all duration-300">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">Any Framework</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                PyTorch, TensorFlow, scikit-learn, ONNX, or custom—we support them all.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-gray-900/20 rounded-xl border border-gray-800/30 animate-fade-in-up animation-delay-1700 hover:bg-gray-900/30 transition-all duration-300">
              <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-light text-white">Transparent Pricing</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Pay only for what you use. No hidden fees, no surprise bills. Start free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 lg:px-8 border-t border-gray-800/50 animate-fade-in-up animation-delay-1800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up animation-delay-1900">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base md:text-lg text-gray-400 font-light">
              Pay only for what you use. Scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800/30">
              <h3 className="text-lg font-light text-white mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-4xl font-light text-white">$0</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  3 models
                </li>
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  1K requests/month
                </li>
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Community support
                </li>
              </ul>
              <Link href="/dashboard">
                <button className="w-full bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  Get Started
                </button>
              </Link>
            </div>

            <div className="bg-gray-900/30 rounded-xl p-6 border-2 border-indigo-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-light text-white mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-light text-white">$49</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Unlimited models
                </li>
                <li className="text-gray-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  1M requests/month
                </li>
                <li className="text-gray-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Priority support
                </li>
                <li className="text-gray-300 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Advanced analytics
                </li>
              </ul>
              <Link href="/dashboard">
                <button className="w-full bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  Start Pro Trial
                </button>
              </Link>
            </div>

            <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800/30">
              <h3 className="text-lg font-light text-white mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-4xl font-light text-white">Custom</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Everything in Pro
                </li>
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Custom limits
                </li>
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Dedicated support
          </li>
                <li className="text-gray-400 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  SLA guarantee
          </li>
              </ul>
              <button className="w-full bg-gray-800/50 text-white py-2.5 rounded-lg text-sm font-light hover:bg-gray-800/70 transition-colors">
                Contact Sales
              </button>
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
            Join thousands of ML engineers who've simplified their deployment workflow.
          </p>
          <Link href="/dashboard">
            <button className="bg-white text-black px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-100 transform hover:scale-105 transition-all duration-300">
              Start Free Trial
            </button>
          </Link>
          <p className="text-gray-500 text-sm mt-4 font-light">
            No credit card required • Free forever for up to 3 models
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-10 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-light text-white">Weave</span>
            </div>

            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Terms</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Docs</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">Twitter</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors font-light">GitHub</a>
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
  );
}
