import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription - Installment Management",
  description: "Upgrade your plan and manage subscription limits",
};

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Review pricing tiers and upgrade when you reach your limits. Payment
          integration is coming soon.
        </p>
      </div>

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
            <p className="text-gray-600 mb-4 text-center">
              Start fast and validate your workflow.
            </p>
            <ul className="space-y-2 text-gray-700 mb-6 text-left">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
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
                Up to 10 active plans
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
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
                1 owner account
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
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
                No credit card required
              </li>
            </ul>
            <div className="mt-auto text-center pt-6">
              <div className="text-2xl font-bold text-gray-900 mb-3">
                PKR 0
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Stay on Free
              </button>
            </div>
          </div>

          <div className="flex flex-col bg-white rounded-2xl shadow-md border border-blue-200 p-6 ring-1 ring-blue-100">
            <div className="flex justify-center mb-4">
              <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                Starter
              </span>
            </div>
            <p className="text-gray-600 mb-4 text-center font-medium">
              Built for busy shops that need structure.
            </p>
            <ul className="space-y-2 text-gray-700 mb-6 text-left">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
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
                Up to 100 active plans
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
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
                Up to 3 staff accounts
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
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
                Reports and exports
              </li>
            </ul>
            <div className="mt-auto text-center pt-6">
              <div className="text-2xl font-bold text-gray-900 mb-3">
                PKR 2,500/mo
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Upgrade to Starter
              </button>
            </div>
          </div>

          <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-center mb-4">
              <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                Pro
              </span>
            </div>
            <p className="text-gray-600 mb-4 text-center">
              Scale confidently with advanced control.
            </p>
            <ul className="space-y-2 text-gray-700 mb-6 text-left">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-purple-600 mt-0.5"
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
                Unlimited active plans
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-purple-600 mt-0.5"
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
                Unlimited users
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-purple-600 mt-0.5"
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
                Priority support
              </li>
            </ul>
            <div className="mt-auto text-center pt-6">
              <div className="text-2xl font-bold text-gray-900 mb-3">
                PKR 6,000/mo
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
