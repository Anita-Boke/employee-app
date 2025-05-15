// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./global.css";  // Import the global CSS for styles

// Load Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define metadata for the page
export const metadata = {
  title: "Employee Management System",
  description: "Manage employees with add, view, edit, and delete functionality.",
};

// RootLayout wraps around all pages and renders them
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header>
          <h1>Employee Management System</h1>
        </header>
        {children} {/* All page content will be rendered here */}
      </body>
    </html>
  );
}
