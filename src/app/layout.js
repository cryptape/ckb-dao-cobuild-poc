import "./globals.css";

export const metadata = {
  title: "CKB DAO (PoC)",
  description: "An Papp to manage CKB DAO assets",
};

export default function RootLayout({ children, modal }) {
  return (
    <html lang="en">
      <body className="max-w-5xl mx-auto p-3 md:p-6 prose dark:prose-invert">
        {children}
      </body>
    </html>
  );
}
