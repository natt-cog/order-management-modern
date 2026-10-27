import Link from "next/link";

/** O11 InvalidPermissions と同じ文言（メニューなし・Login リンクのみ） */
export default function InvalidPermissions() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <p>You don&apos;t have permissions to view the required screen.</p>
        <Link href="/login">Login</Link>
      </div>
    </div>
  );
}
