import { Twitter, Github, MessageCircle } from "lucide-react";
import { Icon } from "lucide-react";
import { mustache } from "@lucide/lab";
import LogoHeader from "./LogoHeader";

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="relative container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <LogoHeader />
            <p className="text-muted-foreground mb-4 max-w-md leading-relaxed">
              A term deposit for the impatient.
              <br />
              Get your interest upfront and feel the delight of instant
              gratification.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/JackLandonX"
                className="w-10 h-10 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/jack-landon/dapper-app"
                target="_blank"
                className="w-10 h-10 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 Dapper. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
