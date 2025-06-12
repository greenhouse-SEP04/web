import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-gray-800 mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-600 mb-4">Oops! Page not found.</p>
        <p className="mb-6 text-gray-500">The page you are looking for doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="inline-block px-6 py-2 bg-primary text-white font-medium rounded hover:bg-primary-dark transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}