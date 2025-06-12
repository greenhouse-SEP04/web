import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      <pre className="bg-muted p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
