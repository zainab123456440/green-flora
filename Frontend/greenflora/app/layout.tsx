import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/Hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <head>
        {/* REACT DOM CRASH FIX: Monkey Patch for Google Translate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof Node === 'function' && Node.prototype) {
                const originalRemoveChild = Node.prototype.removeChild;
                Node.prototype.removeChild = function (child) {
                  if (child.parentNode !== this) {
                    if (console) console.warn('React Crash Prevented: Cannot remove a child from a different parent.', child, this);
                    return child;
                  }
                  return originalRemoveChild.apply(this, arguments);
                };

                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function (newNode, referenceNode) {
                  if (referenceNode && referenceNode.parentNode !== this) {
                    if (console) console.warn('React Crash Prevented: Cannot insert before a reference node from a different parent.', referenceNode, this);
                    return newNode;
                  }
                  return originalInsertBefore.apply(this, arguments);
                };
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-gray-50 text-gray-900">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>

        {/* Hidden Google Translate Mount Point */}
        <div id="google_translate_element" style={{ display: "none" }} />

        {/* Google Translate Init Script */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'ur',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}