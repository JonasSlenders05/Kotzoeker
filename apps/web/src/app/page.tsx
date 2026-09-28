import { HeroBanner } from "@/components/landing/hero-banner";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CampusSection } from "@/components/landing/campus-section";
import { LandlordSection } from "@/components/landing/landlord-section";
import { CtaSection } from "@/components/landing/cta-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main id="top" className="flex-1">
      <HeroBanner />
      <Hero />
      <HowItWorks />
      <CampusSection />
      <LandlordSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
