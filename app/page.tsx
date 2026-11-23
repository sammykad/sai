import Navbar from "@/components/Navbar"
import KineticHero from "@/components/KineticHero"
import EditorialMarquee from "@/components/EditorialMarquee"
import AboutFounder from "@/components/AboutFounder"
import StudioPrinciples from "@/components/StudioPrinciples"
import PortfolioGallery from "@/components/PortfolioGallery"
import ContactSection from "@/components/ContactSection"
import WhatsAppButton from "@/components/WhatsAppButton"

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <KineticHero />
        <EditorialMarquee />
        <AboutFounder />
        <StudioPrinciples />
        <PortfolioGallery />
        <ContactSection />
      </main>
      <WhatsAppButton />
    </>
  )
}
