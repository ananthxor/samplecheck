const footerLinks = [
  { label: 'Help & Support', href: '#' },
  { label: 'Showcase', href: '#' },
  { label: 'Creative Policy', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
]

export function AppFooter() {
  return (
    <footer className="mt-auto bg-sidebar px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-sidebar-foreground/50">
          &copy; {new Date().getFullYear()} ScrollToday. All rights reserved.
        </p>
        <nav className="flex flex-wrap gap-6">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs text-sidebar-foreground/60 transition-colors duration-150 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
