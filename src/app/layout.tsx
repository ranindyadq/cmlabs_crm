import "./globals.css";
import { Poppins } from "next/font/google";
import { ThemeProvider } from '@/lib/context/ThemeContext'
import { Toaster } from "react-hot-toast";
import NextTopLoader from 'nextjs-toploader';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "CRM App",
  description: "CRM project",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ThemeProvider>
          {/* 1. Loader di paling atas */}
          <NextTopLoader
            color="#5A4FB5"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #5A4FB5,0 0 5px #5A4FB5"
            zIndex={1600}
          />
          
          {/* 2. Toaster Notification */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#5A4FB5",
                color: "#fff",
                fontSize: "14px",
              },
            }}
          />

          {/* 3. Konten Aplikasi */}
          {children}
          
        </ThemeProvider>
      </body>
    </html>
  );
}
