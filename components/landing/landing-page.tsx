"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  Zap,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">TeamChat</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-foreground hover:text-primary"
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">
              Real-time Team Communication
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in-up">
            Connect Your Team
            <span className="block text-primary mt-2">Instantly</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Experience seamless real-time messaging with powerful channel
            management, user presence tracking, and a beautiful modern
            interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90 text-lg px-8"
              >
                Start Chatting Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-border hover:bg-accent cursor-pointer"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground">
              Powerful features to enhance your team collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Real-time Messaging
              </h3>
              <p className="text-muted-foreground">
                Instant message delivery using Server-Sent Events. See messages
                appear in real-time without delays.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                User Presence
              </h3>
              <p className="text-muted-foreground">
                Know who's online instantly. Real-time presence tracking shows
                active team members.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Channel Management
              </h3>
              <p className="text-muted-foreground">
                Create unlimited channels. Organize conversations by topics,
                projects, or teams.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Secure Authentication
              </h3>
              <p className="text-muted-foreground">
                JWT-based authentication with HTTP-only cookies. Your data is
                always protected.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Message History
              </h3>
              <p className="text-muted-foreground">
                Infinite scroll with smart pagination. Access your entire
                conversation history anytime.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Modern UI
              </h3>
              <p className="text-muted-foreground">
                Beautiful dark theme with smooth animations. Responsive design
                that works everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why Choose TeamChat?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Lightning Fast
                    </h3>
                    <p className="text-muted-foreground">
                      Optimized performance with SWR caching and efficient
                      database queries
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Always Available
                    </h3>
                    <p className="text-muted-foreground">
                      Built with Next.js for reliability and automatic
                      reconnection support
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Privacy First
                    </h3>
                    <p className="text-muted-foreground">
                      End-to-end encryption ready with secure password hashing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Mobile Friendly
                    </h3>
                    <p className="text-muted-foreground">
                      Fully responsive design that works perfectly on all
                      devices
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-32 w-32 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold text-foreground">
                    Start Chatting Today
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Join thousands of teams already using TeamChat
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-12 border border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join TeamChat today and experience the future of team communication
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-border hover:bg-accent"
              >
                Sign In to Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold text-foreground">
                    TeamChat
                  </span>
                </div>
                <p className="text-muted-foreground mb-4">
                  Modern real-time team communication platform built with
                  Next.js, React, and MongoDB.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Product</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link
                      href="/signup"
                      className="hover:text-primary transition-colors"
                    >
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="hover:text-primary transition-colors"
                    >
                      Login
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Connect</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <a
                      href="https://github.com/git-dhanji"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://linkedin.com/in/web-d-dhanji"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center text-muted-foreground">
              <p>
                © 2024 TeamChat. Built with ❤️ by{" "}
                <a
                  href="https://github.com/git-dhanji"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Dhanji
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
