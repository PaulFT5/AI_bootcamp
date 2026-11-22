import Link from "next/link";

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand">
          Erasmus<span>@</span>UPT
        </div>
      </header>
      <main className="landing-body">
        <h1>Find your UPT courses</h1>
        <p>
          Enter the courses from your home university and get ranked matches from the Automation and Computers
          catalogue, ready for your Learning Agreement.
        </p>
        <Link className="btn btn-primary" href="/matcher">
          Log in
        </Link>
      </main>
    </div>
  );
}
