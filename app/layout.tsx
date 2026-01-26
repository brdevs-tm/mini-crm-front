import "./globals.css";
import "./ui.css";
import { ThemeProvider } from "@/components/theme-provider";
import ToastProvider from "@/components/toast-provider";

export const metadata = {
  title: "Mini CRM",
  description: "Mini CRM Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
