import type { Metadata } from "next";
import "./globals.css";
import "./motion.css";
export const metadata: Metadata = {
  title: "Signal Lost — Un’avventura a tempo",
  description: "Un piccolo robot. Una stazione fuori controllo. Un istante per scegliere. Prototipo sci-fi interattivo.",
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="it"><body>{children}</body></html>;
}
