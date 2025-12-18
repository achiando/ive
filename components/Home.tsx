"use client";
// import { EventsList } from "@/components/events/events-list";
import { Button } from "@/components/ui/button";
// import { useEventStore } from "@/lib/store/event-store";
import { Mail, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";



export default function Home() {
    // const { events, loading, error, fetchEvents } = useEventStore();
    
    // useEffect(() => {
    //   fetchEvents();
    // }, [fetchEvents]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="CDIE IMS Logo" 
              width={80} 
              height={80} 
              className="h-20 w-20 object-contain" 
              priority
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#about" className="text-sm font-medium transition-colors hover:text-blue-600">
              About
            </Link>
            <Link href="#contact" className="text-sm font-medium transition-colors hover:text-blue-600">
              Contact
            </Link>
          </nav>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* About Section */}
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">About CDIE IMS</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                    The CDIE Inventory Management System is a comprehensive platform designed to streamline laboratory operations, enhance research productivity, and foster innovation within Kenyatta University.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Our Mission</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    To provide a centralized, efficient, and user-friendly system for managing laboratory resources, facilitating seamless research workflows, and promoting collaboration among students, researchers, and staff.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Key Benefits</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-500 dark:text-gray-400">
                    <li>Centralized resource tracking and management.</li>
                    <li>Simplified booking and scheduling of equipment.</li>
                    <li>Real-time data analytics for informed decision-making.</li>
                    <li>Enhanced collaboration and knowledge sharing.</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg space-y-6">
                <h3 className="text-2xl font-bold text-center">CDIE Innovation Hub</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Your one-stop center for innovation, research, and development.
                </p>
             
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                  <Link href="/login">Access CDIE</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Get in Touch Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Get in Touch</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Have questions or need support? We're here to help. Reach out to us through any of the channels below.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Our Location</h3>
                      <p className="text-gray-500 dark:text-gray-400">Kenyatta University, Thika Superhighway, Nairobi, Kenya</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Email Us</h3>
                      <p className="text-gray-500 dark:text-gray-400">ive@ku.ac.ke</p>
                    </div>
                  </div>
                  {/* <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Call Us</h3>
                      <p className="text-gray-500 dark:text-gray-400">+254 700 000 000</p>
                    </div>
                  </div> */}
                </div>
                <Button asChild variant="outline">
                  <Link href="/support">Contact Support</Link>
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold mb-6">Quick Contact</h3>
                <div className="space-y-4">
                  <form className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Message</label>
                      <textarea 
                        rows={4} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="How can we help you?"
                      ></textarea>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      
        <section id="events" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          {/* {
          events.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Upcoming Events
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join us for our upcoming workshops, hackathons, and innovation challenges.
                </p>
              </div>
            </div>
          
                <EventsList maxItems={3} />
                <div>

                </div>
            
            <div className="mt-12 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/events">View All Events</Link>
              </Button>
            </div>
          </div>
          )} */}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="CDIE IMS Logo" 
                  width={24} 
                  height={24} 
                  className="h-6 w-6"
                />
                <span className="font-bold">CDIE IMS</span>
              </div>
              <p className="text-sm text-gray-400">
                Smart Laboratory Management System for Kenyatta University
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="#about" className="text-sm text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="#contact" className="text-sm text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Contact</h4>
              <ul className="space-y-2">
                <li className="text-sm text-gray-400">Kenyatta University</li>
                <li className="text-sm text-gray-400">Nairobi, Kenya</li>
                <li className="text-sm text-gray-400">ive@ku.ac.ke</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-400">© 2025 Kenyatta University CDIE. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="https://wanailabs.org" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white transition-colors">Built with Passion for Innovation!</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

