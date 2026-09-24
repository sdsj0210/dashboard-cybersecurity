function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-5">
          <h1 className="text-xl font-semibold">Dashboard de Ciberseguridad</h1>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-56 border-r bg-card p-4 md:block">
          <nav className="space-y-2">
            <button className="w-full rounded-md bg-accent px-3 py-2 text-left text-sm font-medium">
              Dashboard
            </button>

            <button className="w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent">
              CVEs
            </button>
          </nav>
        </aside>

        <main className="w-full p-5">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
