import React from 'react';
import { motion } from 'motion/react';
import { BeamsBackground } from '@/components/kokonutui/beams-background';
import { GlitchText } from '@/components/kokonutui/glitch-text';
import { MatrixText } from '@/components/kokonutui/matrix-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Users, Zap, Shield, Globe } from 'lucide-react';

const LumeLandingPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white overflow-hidden">
      
      {/* Hero Section with Beams Background */}
      <section className="relative min-h-screen flex items-center justify-center">
        <BeamsBackground intensity="medium" className="absolute inset-0" />
        <div className="relative z-10 max-w-7xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Powered by Advanced AI
            </Badge>
            
            <GlitchText 
              text="NodeBench AI"
              size="4xl"
              color="gradient-orange"
              glitchIntensity="medium"
              className="mb-6"
            />
            
            <h2 className="text-2xl md:text-3xl font-light text-neutral-600 dark:text-neutral-300 mb-8 max-w-3xl mx-auto">
              AI models that understand context and work seamlessly across conversations. 
              Accelerate your productivity with AI that thinks, does, and gets results for you.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="border-neutral-300 dark:border-neutral-600">
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>5,000+ users</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">5.0</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Enterprise Security</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <MatrixText 
              text="Powerful Features"
              initialDelay={500}
              letterInterval={50}
              className="text-4xl font-bold mb-4"
            />
            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto">
              Everything you need to build and deploy AI-powered workflows at scale
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-blue-600" />,
                title: "Lightning Fast",
                description: "Process thousands of documents and conversations in seconds with our optimized AI engine"
              },
              {
                icon: <Shield className="w-8 h-8 text-green-600" />,
                title: "Enterprise Security",
                description: "Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA standards"
              },
              {
                icon: <Globe className="w-8 h-8 text-purple-600" />,
                title: "Global Scale",
                description: "Deploy worldwide with 99.9% uptime and automatic scaling for any workload"
              },
              {
                icon: <Users className="w-8 h-8 text-orange-600" />,
                title: "Team Collaboration",
                description: "Work together seamlessly with real-time collaboration and shared workspaces"
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-cyan-600" />,
                title: "Smart Automation",
                description: "Automate repetitive tasks and workflows with intelligent AI agents"
              },
              {
                icon: <Star className="w-8 h-8 text-pink-600" />,
                title: "Premium Support",
                description: "Get help 24/7 from our expert team and comprehensive documentation"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-neutral-600 dark:text-neutral-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-8 bg-neutral-100 dark:bg-neutral-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <GlitchText 
              text="Pricing that scales with you"
              size="3xl"
              color="blue"
              glitchIntensity="light"
              className="mb-4"
            />
            <p className="text-xl text-neutral-600 dark:text-neutral-300">
              Choose your plan and adjust anytime. All plans include a 14-day free trial.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Free",
                price: "Free",
                description: "Perfect for individuals exploring AI",
                features: [
                  "1 AI Agent",
                  "5K API calls/mo",
                  "Community support",
                  "Basic templates",
                  "Email notifications"
                ],
                buttonText: "Get Started",
                popular: false
              },
              {
                name: "Pro",
                price: "$49/month",
                description: "For teams scaling AI workflows",
                features: [
                  "5 AI Agents",
                  "Unlimited API calls",
                  "Priority support 24/7",
                  "Advanced analytics",
                  "Custom workflows",
                  "Team collaboration",
                  "Premium templates",
                  "Webhook integrations"
                ],
                buttonText: "Start Free Trial",
                popular: true
              },
              {
                name: "Enterprise",
                price: "$299/month",
                description: "Custom solutions for enterprises",
                features: [
                  "Unlimited Agents",
                  "Dedicated support",
                  "Custom AI training",
                  "99.9% SLA guarantee",
                  "Advanced security",
                  "White-label options",
                  "On-premise deployment",
                  "Custom integrations"
                ],
                buttonText: "Contact Sales",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <Card className={`h-full ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-neutral-200 dark:border-neutral-700'}`}>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold mt-2">{plan.price}</div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    <Button 
                      className={`w-full mt-6 ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <MatrixText 
              text="Ready to transform your workflow?"
              initialDelay={1000}
              letterInterval={30}
              className="text-3xl font-bold mb-6"
            />
            <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8">
              Join thousands of teams already using NodeBench AI to accelerate their productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-700 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <GlitchText 
                text="NodeBench AI"
                size="lg"
                color="gradient-orange"
                glitchIntensity="light"
                isStatic={true}
              />
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                AI-powered workspace for modern teams
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li><a href="#" className="hover:text-blue-600">Features</a></li>
                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-600">API</a></li>
                <li><a href="#" className="hover:text-blue-600">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li><a href="#" className="hover:text-blue-600">About</a></li>
                <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600">Terms</a></li>
                <li><a href="#" className="hover:text-blue-600">Security</a></li>
                <li><a href="#" className="hover:text-blue-600">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-700 mt-8 pt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
            <p>&copy; 2025 NodeBench AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LumeLandingPage;