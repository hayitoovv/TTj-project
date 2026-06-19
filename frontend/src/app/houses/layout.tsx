import { Navbar } from "@/components/landing/navbar";

export default function HousesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
