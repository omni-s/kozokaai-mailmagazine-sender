export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Resend Mail. All rights reserved.</p>
        <p>v{process.env.npm_package_version || '0.1.0'}</p>
      </div>
    </footer>
  );
}
