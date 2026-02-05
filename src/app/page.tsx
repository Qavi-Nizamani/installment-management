export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 md:px-12">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IM</span>
          </div>
          <span className="text-xl font-bold text-gray-900">InstallmentManager</span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="/auth/login"
            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            Login
          </a>
          <a
            href="/auth/signup"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-sm"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-16 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
            Coming Soon
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Streamline Your
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block md:inline md:ml-4">
              Installment Management
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The all-in-one SaaS platform for businesses to manage installment plans,
            track payments, and provide seamless financing solutions to customers.
          </p>

          {/* Features List */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Tracking</h3>
              <p className="text-gray-600 text-center">Monitor and manage all installment payments in real-time</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Automated Billing</h3>
              <p className="text-gray-600 text-center">Set up recurring payments and automated reminders</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-gray-600 text-center">Comprehensive insights and financial reporting</p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mt-8 mb-16 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Pricing Tiers
              </h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-center mb-4">
                  <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                    Free (Trial / Small Shop)
                  </span>
                </div>
                <p className="text-gray-600 mb-4 text-center">Start fast and validate your workflow.</p>
                <ul className="space-y-2 text-gray-700 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 15 active plans
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    1 owner account
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Core tracking and reminders
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Share plans via WhatsApp
                  </li>
                </ul>
                <div className="mt-auto text-center pt-6">
                  <div className="text-2xl font-bold text-gray-900 mb-3">PKR 0</div>
                  <a
                    href="/auth/signup"
                    className="inline-flex items-center justify-center bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Start Free
                  </a>
                </div>
              </div>

              <div className="flex flex-col bg-white rounded-2xl shadow-md border border-blue-200 p-6 ring-1 ring-blue-100">
                <div className="flex justify-center mb-4">
                  <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                    Starter
                  </span>
                </div>
                <p className="text-gray-600 mb-4 text-center">Built for busy shops that need structure.</p>
                <ul className="space-y-2 text-gray-700 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 150 active plans
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 5 staff accounts
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Automated reminders
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Reports and exports
                  </li>
                </ul>
                <div className="mt-auto text-center pt-6">
                  <div className="text-2xl font-bold text-gray-900 mb-3">PKR 2,999/mo</div>
                  <a
                    href="/auth/signup"
                    className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Choose Starter
                  </a>
                </div>
              </div>

              <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-center mb-4">
                  <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                    Pro
                  </span>
                </div>
                <p className="text-gray-600 mb-4 text-center">Scale confidently with advanced control.</p>
                <ul className="space-y-2 text-gray-700 mb-6 text-left">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited active plans
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited users
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>
                <div className="mt-auto text-center pt-6">
                  <div className="text-2xl font-bold text-gray-900 mb-3">PKR 6,000/mo</div>
                  <a
                    href="/auth/signup"
                    className="inline-flex items-center justify-center bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Go Pro
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Email Signup */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Early Access</h2>
            <p className="text-gray-600 mb-6">Be the first to know when we launch and get exclusive early access.</p>

            <form className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Notify Me When Ready
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              No spam, unsubscribe at any time. We respect your privacy.
            </p>
          </div>

          {/* Timeline */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-8">Development Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Q3 2025 - MVP foundation and onboarding flow</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Q4 2025 - Private beta with partner shops</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span className="text-gray-600">Q1 2026 - Public launch and payment automation</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 px-6 md:px-12 border-t border-gray-200 bg-white/50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">IM</span>
            </div>
            <span className="text-gray-600">
              © {new Date().getFullYear()} InstallmentManager. All rights reserved.
            </span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
