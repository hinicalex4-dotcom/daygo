import "./globals.css";
export const metadata = { title: "DAYGO – One Day. One Destination.", description: "Finde deinen nächsten Tagestrip." };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="de"><body>{children}</body></html>;
}
