import Link from "next/link";

export default function InvalidPermissions() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Invalid permissions</h1>
      <p className="text-slate-600">You don&apos;t have permissions to access this screen.</p>
      <Link href="/" className="text-sky-700 underline">Back to the application</Link>
    </main>
  );
}
