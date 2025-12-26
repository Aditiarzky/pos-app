import Link from "next/link";

export default async function Home() {

  return (
    <div className="font-sans">
      List user
      <ul>
        <Link href="/users">Users</Link>
      </ul>
    </div>
  );
}
