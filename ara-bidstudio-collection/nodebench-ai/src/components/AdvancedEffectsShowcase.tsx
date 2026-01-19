import React from 'react';
import MatrixText from '@/components/kokonutui/matrix-text';
import GlitchText from '@/components/kokonutui/glitch-text';
import BeamsBackground from '@/components/kokonutui/beams-background';

const AdvancedEffectsShowcase = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Hero Section with Beams Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <BeamsBackground intensity="medium" className="absolute inset-0" />
        <div className="relative z-10 text-center">
          <GlitchText 
            text="NodeBench AI" 
            size="3xl"
            color="gradient-orange"
            glitchIntensity="heavy"
            className="mb-8"
          />
          <MatrixText 
            text="Advanced AI Workspace"
            initialDelay={1000}
            letterInterval={50}
            className="text-2xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <GlitchText 
            text="Premium Features"
            size="2xl"
            color="cyan"
            glitchIntensity="medium"
            className="text-center mb-16"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-800 p-8 rounded-lg border border-neutral-700">
              <MatrixText 
                text="AI Chat"
                initialDelay={1500}
                className="text-xl mb-4"
              />
              <p className="text-neutral-300">
                Advanced conversational AI with real-time responses
              </p>
            </div>
            
            <div className="bg-neutral-800 p-8 rounded-lg border border-neutral-700">
              <MatrixText 
                text="Documents"
                initialDelay={2000}
                className="text-xl mb-4"
              />
              <p className="text-neutral-300">
                Intelligent document management and analysis
              </p>
            </div>
            
            <div className="bg-neutral-800 p-8 rounded-lg border border-neutral-700">
              <MatrixText 
                text="Agents"
                initialDelay={2500}
                className="text-xl mb-4"
              />
              <p className="text-neutral-300">
                Multi-agent orchestration for complex tasks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 bg-gradient-to-b from-neutral-900 to-neutral-800">
        <div className="max-w-4xl mx-auto text-center">
          <GlitchText 
            text="Experience the Future"
            size="xl"
            color="purple"
            glitchIntensity="extreme"
            className="mb-8"
          />
          <MatrixText 
            text="Start your AI journey today"
            initialDelay={3000}
            letterInterval={30}
            className="text-lg mb-8"
          />
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdvancedEffectsShowcase;