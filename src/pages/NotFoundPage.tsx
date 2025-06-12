import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404 – Not Found</h1>
      <Link to="/" className="text-primary underline">Go home</Link>
    </div>
  );
}
