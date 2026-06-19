import { CTA } from "@/components/landing/cta";
import { FAQ } from "@/components/landing/faq";
import { FeaturedHouses } from "@/components/landing/featured-houses";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { Stats } from "@/components/landing/stats";
import { Testimonials } from "@/components/landing/testimonials";
import { Universities } from "@/components/landing/universities";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Universities />
      <Stats />
      <FeaturedHouses />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
