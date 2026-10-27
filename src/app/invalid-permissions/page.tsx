import Link from "next/link";

export default function InvalidPermissions() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h2 style={{ marginTop: 0 }}>Invalid Permissions</h2>
        <p>You don&apos;t have permissions to access this screen.</p>
        <Link className="btn" href="/">Go to home</Link>
      </div>
    </div>
  );
}
