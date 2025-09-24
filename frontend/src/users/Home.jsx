import React from 'react'
import { Link } from "react-router-dom"

const Home = () => {
  return (
    <>
      <div className="h-screen w-screen relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1696299337937-453aed8b93af?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          }}
        ></div>

        {/* Overlay (fade from left to right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#70AAB4]/80 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 h-full">
          {/* Navbar */}
          <div className="h-[50px] w-full flex justify-between items-center px-4">
            <div className="flex w-64 justify-between p-4 items-center">
              <h1 className="text-white font-josefin">Services</h1>
              <h1 className="text-white font-josefin">Setting</h1>
              <h1 className="text-white font-josefin">Features</h1>
            </div>

            <div className="flex w-64 justify-between p-4 items-center">
              <h1 className="text-white font-josefin">Contact</h1>
              <h1 className="text-white font-josefin">About</h1>
              <Link to="/login" className="text-white text-2xl">
                <i className="ri-login-circle-line"></i>
              </Link>
              <Link to="/register" className="text-white text-2xl">
                <i className="ri-registered-fill"></i>
              </Link>
            </div>
          </div>

          {/* Navbar1 */}
          <div className="h-[100px] w-full flex justify-around items-center">
            <div className="flex w-32 justify-center items-center capitalize font-josefin text-white">
              <h1 className="text-4xl">HealNest</h1>
            </div>
            <div className="flex w-80 justify-between items-center capitalize font-josefin text-white">
              <h1>Home</h1>
              <h1>Services</h1>
              <h1>Therapists</h1>
              <h1>Resources</h1>
            </div>
            <div className="flex flex-col justify-center">
              <button className="text-white bg-[#70AAB4] w-44 h-10 rounded-full capitalize font-josefin">
                Get Started
              </button>
            </div>
          </div>

          {/* Mainpage1 */}
          <div className="flex-1 flex flex-col gap-4 p-36 justify-center">
            <h1 className="text-6xl text-white font-josefin">
              Mindful And <br /> Embark On Your <br /> Journey
            </h1>
            <p className="text-white font-josefin">
              Discover tools, guidance, and support designed to help you take care of your <br />
              mental well-being every day.
            </p>
            <div className="gap-12 flex">
              <button className="text-white bg-[#70AAB4] w-44 h-10 rounded-full capitalize font-josefin">
                Start Journey
              </button>
              <button className="text-white bg-[#70AAB4] w-44 h-10 rounded-full capitalize font-josefin">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* First Section */}
      <div className="min-h-screen w-full bg-white py-20 px-8">
        <div className="max-w-7xl mx-auto">
          {/* First Card Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-20">
            {/* Left side - Image Card */}
            <div className="lg:w-1/2 relative">
              <div className="bg-gray-100 rounded-3xl p-2 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=870&auto=format&fit=crop"
                  alt="Mental wellness" 
                  className="w-full h-80 object-cover rounded-2xl"
                />
                {/* Floating phone mockup */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="w-24 h-32 bg-gray-50 rounded-xl flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mb-2">
                      <i className="ri-phone-line text-white text-xl"></i>
                    </div>
                    <p className="text-xs text-gray-600 font-medium font-josefin">Telehealth</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-4xl font-bold text-slate-600 font-josefin leading-tight">
                Elevate Your Mental Well-Being With Evidence-Based Techniques
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed font-josefin">
                Transform your mental health journey with scientifically proven methods and personalized support designed to help you thrive in every aspect of life.
              </p>
              
              {/* Feature list */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#70AAB4] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-time-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 font-josefin mb-1">24 Years Of Excellence</h3>
                    <p className="text-gray-600 font-josefin">Decades of proven expertise in mental health care and therapeutic interventions.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#70AAB4] rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-team-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 font-josefin">Exclusive Team Work</h3>
                    <p className="text-gray-600 font-josefin">Collaborative approach with specialized professionals working together for your success.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Card Section */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            {/* Right side - Image Card */}
            <div className="lg:w-1/2 relative">
              <div className="bg-gray-100 rounded-3xl p-2 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=870&auto=format&fit=crop"
                  alt="Mindfulness meditation" 
                  className="w-full h-80 object-cover rounded-2xl"
                />
              </div>
            </div>

            {/* Left side - Content */}
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-4xl font-bold text-gray-600 leading-tight font-josefin">
                Harness The Power Of Mindfulness To Empower Your Mind
              </h2>
              
              {/* Info card */}
              <div className="bg-[#70AAB4] rounded-2xl p-6 text-white">
                <p className="text-sm leading-relaxed font-josefin">
                  Discover the transformative power of mindfulness practices that strengthen mental resilience, 
                  reduce stress, and enhance overall well-being through proven meditation and awareness techniques.
                </p>
              </div>
              
              {/* Feature list */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#70AAB4] rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 font-josefin">Goal Achievement</h3>
                    <p className="text-gray-600 font-josefin">Set and achieve meaningful mental health goals with structured guidance.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#70AAB4] rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 font-josefin">Free Schedule</h3>
                    <p className="text-gray-600 font-josefin">Flexible timing that adapts to your lifestyle and personal needs.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-[#70AAB4] rounded-full mt-3 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 font-josefin">Best Mind Clearing</h3>
                    <p className="text-gray-600 font-josefin">Advanced techniques to clear mental clutter and enhance focus.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="min-h-screen w-full bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-700 font-josefin mb-4">
            Experience Mindfulness Coaches Offer Services
          </h2>
          <p className="text-gray-600 font-josefin mb-16 max-w-3xl mx-auto">
            Our certified mindfulness coaches provide comprehensive support through various therapeutic approaches tailored to your unique needs and journey.
          </p>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-heart-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Therapeutic Counseling</h3>
              <p className="text-gray-600 font-josefin">
                Professional one-on-one therapy sessions designed to address your specific mental health concerns and promote healing.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-group-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Group Sessions</h3>
              <p className="text-gray-600 font-josefin">
                Connect with others on similar journeys through supportive group therapy sessions led by experienced professionals.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-brain-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Mindfulness Programs</h3>
              <p className="text-gray-600 font-josefin">
                Learn evidence-based mindfulness techniques to reduce stress, improve focus, and enhance overall well-being.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-calendar-check-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Stress Reduction</h3>
              <p className="text-gray-600 font-josefin">
                Specialized programs focusing on identifying stress triggers and developing healthy coping mechanisms.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-lightbulb-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Mindfulness Programs</h3>
              <p className="text-gray-600 font-josefin">
                Comprehensive meditation training programs to help you develop a sustainable mindfulness practice.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#70AAB4] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Crisis Support</h3>
              <p className="text-gray-600 font-josefin">
                24/7 crisis intervention and support services for those experiencing mental health emergencies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Section */}
      <div className="min-h-screen w-full bg-white py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-700 font-josefin mb-4">
              Find Your Way From Chaos To Clarity
            </h2>
            <p className="text-gray-600 font-josefin max-w-3xl mx-auto">
              Navigate through life's challenges with our structured approach to mental wellness, designed to guide you from confusion to understanding.
            </p>
          </div>

          {/* Journey Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-[#70AAB4] to-[#5a9ca6] rounded-full mx-auto flex items-center justify-center">
                  <span className="text-white text-4xl font-bold font-josefin">1</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#70AAB4] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Assessment & Discovery</h3>
              <p className="text-gray-600 font-josefin">
                Begin with a comprehensive assessment to understand your unique needs, challenges, and goals for mental wellness.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-[#70AAB4] to-[#5a9ca6] rounded-full mx-auto flex items-center justify-center">
                  <span className="text-white text-4xl font-bold font-josefin">2</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#70AAB4] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Personalized Treatment</h3>
              <p className="text-gray-600 font-josefin">
                Receive a customized treatment plan combining therapy, mindfulness practices, and coping strategies tailored to you.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-[#70AAB4] to-[#5a9ca6] rounded-full mx-auto flex items-center justify-center">
                  <span className="text-white text-4xl font-bold font-josefin">3</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#70AAB4] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-josefin mb-3">Ongoing Support</h3>
              <p className="text-gray-600 font-josefin">
                Continue your journey with regular check-ins, progress monitoring, and adaptive care to maintain lasting wellness.
              </p>
            </div>
          </div>

          {/* Forest Image Section */}
          <div className="mt-20 relative">
            <div className="rounded-3xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1471&auto=format&fit=crop"
                alt="Peaceful forest path" 
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#70AAB4]/70 to-transparent flex items-center">
                <div className="p-12">
                  <h3 className="text-3xl font-bold text-white font-josefin mb-4">
                    Your Path to Mental Wellness Starts Here
                  </h3>
                  <p className="text-white font-josefin mb-6 max-w-lg">
                    Take the first step towards a healthier, more balanced mind. Our compassionate team is ready to support you every step of the way.
                  </p>
                  <button className="bg-white text-[#70AAB4] px-8 py-3 rounded-full font-josefin font-semibold hover:bg-gray-100 transition-colors">
                    Start Your Journey
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="min-h-screen w-full bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-700 font-josefin mb-4">
              What Our Clients Say About Their Journey
            </h2>
            <p className="text-gray-600 font-josefin max-w-3xl mx-auto">
              Read inspiring stories from individuals who have transformed their mental health through our compassionate care and evidence-based approaches.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#70AAB4] rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-josefin font-bold">S</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-josefin">Sarah M.</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill"></i>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 font-josefin">
                "HealNest helped me develop coping strategies that actually work. The mindfulness techniques have become an essential part of my daily routine, and I feel more balanced than ever."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#70AAB4] rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-josefin font-bold">M</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-josefin">Michael R.</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill"></i>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 font-josefin">
                "The group sessions were incredibly supportive. Knowing I wasn't alone in my struggles made all the difference. The therapists are truly compassionate professionals."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#70AAB4] rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-josefin font-bold">E</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-josefin">Emma L.</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="ri-star-fill"></i>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 font-josefin">
                "The 24/7 support gave me confidence knowing help was always available. The personalized treatment plan addressed exactly what I needed to heal and grow."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-3xl font-bold font-josefin mb-4">HealNest</h2>
              <p className="text-gray-300 font-josefin mb-6 max-w-md">
                Empowering individuals to achieve mental wellness through compassionate care, evidence-based treatments, and mindful practices.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-[#70AAB4] rounded-full flex items-center justify-center hover:bg-[#5a9ca6] transition-colors">
                  <i className="ri-facebook-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-[#70AAB4] rounded-full flex items-center justify-center hover:bg-[#5a9ca6] transition-colors">
                  <i className="ri-twitter-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-[#70AAB4] rounded-full flex items-center justify-center hover:bg-[#5a9ca6] transition-colors">
                  <i className="ri-instagram-fill"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-[#70AAB4] rounded-full flex items-center justify-center hover:bg-[#5a9ca6] transition-colors">
                  <i className="ri-linkedin-fill"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold font-josefin mb-4">Quick Links</h3>
              <ul className="space-y-2 font-josefin">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Services</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Therapists</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold font-josefin mb-4">Contact Us</h3>
              <ul className="space-y-2 font-josefin text-gray-300">
                <li className="flex items-center">
                  <i className="ri-phone-line mr-2"></i>
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <i className="ri-mail-line mr-2"></i>
                  <span>support@healnest.com</span>
                </li>
                <li className="flex items-center">
                  <i className="ri-map-pin-line mr-2"></i>
                  <span>123 Wellness St, City, State 12345</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 font-josefin">
              © 2025 HealNest. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home
