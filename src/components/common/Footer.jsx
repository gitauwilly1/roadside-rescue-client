import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </div>
              <h3 className="text-white font-semibold">Roadside Rescue</h3>
            </div>
            <p className="text-sm text-gray-400">
              Connecting stranded drivers with trusted garages for quick roadside assistance.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-gray-400 hover:text-red-400 transition-colors">Home</a></li>
              <li><a href="/login" className="text-gray-400 hover:text-red-400 transition-colors">Login</a></li>
              <li><a href="/register" className="text-gray-400 hover:text-red-400 transition-colors">Register</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">For Garages</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/register" className="text-gray-400 hover:text-red-400 transition-colors">Join as Garage</a></li>
              <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Partner Benefits</a></li>
              <li><a href="#" className="text-gray-400 hover:text-red-400 transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@roadside-rescue.com</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+254 700 000 000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Roadside Rescue. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;