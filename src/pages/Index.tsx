import { Navigation } from "@/components/Navigation";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Projects } from "@/components/Projects";
import { TechStack } from "@/components/TechStack";
import { Certifications } from "@/components/Certifications";
import { Connect } from "@/components/Connect";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

const Index = () => (
  <ThemeProvider>
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <About />
        <Experience />
        <Projects />
        <TechStack />
        <Certifications />
        <Connect />
      </main>
      <Footer />
    </div>
  </ThemeProvider>
);

export default Index;
