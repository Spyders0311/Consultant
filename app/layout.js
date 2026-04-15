import './globals.css';

export const metadata = {
  title: 'BMS Portal',
  description: 'Secure financial portal with server-side spreadsheet calculations and PDF output',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
