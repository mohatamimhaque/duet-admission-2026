import "./globals.css";

export const metadata = {
  title: "DUET Admission Test Portal 2026 - Seat Plan & Selection Locator",
  description: "Check your DUET Admission Test seat allocations, shift timings, building location maps, and status checks with Quranic references. Session 2025-2026.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
