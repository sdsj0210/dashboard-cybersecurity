import { Link } from "react-router-dom";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-5">
          <Link to="/" className="text-xl font-semibold">
            CVE Monitor
          </Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-56 border-r bg-card p-4 md:block">
          <nav>
            <Link
              to="/"
              className="block w-full rounded-md bg-accent px-3 py-2 text-sm font-medium hover:bg-accent/80"
            >
              CVEs
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 w-full p-5">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
