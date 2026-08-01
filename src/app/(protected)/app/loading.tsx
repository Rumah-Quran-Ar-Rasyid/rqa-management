export default function AppLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-7 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
        <span>Memuat halaman…</span>
      </div>
    </main>
  );
}
