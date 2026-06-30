import { SiteConfig } from '../../content/siteContent';

interface FooterProps {
  content: SiteConfig;
}

const Footer = ({ content }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gold-400/20 bg-dark-800 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Coluna 1 - Marca */}
          <div>
            <h3 className="text-xl font-serif font-bold text-gold-400 mb-4">
              {content.siteName}
            </h3>

            <p className="text-gray-400 text-sm leading-relaxed">
              {content.footerDescription}
            </p>
          </div>

          {/* Coluna 2 - Links Rápidos */}
          <div>
            <h4 className="text-gray-200 font-semibold mb-6 uppercase tracking-wide text-sm">
              {content.footer.quickLinksTitle}
            </h4>

            <ul className="space-y-3">
              <li>
                <a
                  href="#home"
                  className="text-gray-400 hover:text-gold-400 text-sm transition-colors duration-200"
                >
                  {content.footer.quickHome}
                </a>
              </li>

              <li>
                <a
                  href="#professionals"
                  className="text-gray-400 hover:text-gold-400 text-sm transition-colors duration-200"
                >
                  {content.footer.quickProfessionals}
                </a>
              </li>

              <li>
                <a
                  href="#services"
                  className="text-gray-400 hover:text-gold-400 text-sm transition-colors duration-200"
                >
                  {content.footer.quickServices}
                </a>
              </li>

              <li>
                <a
                  href="#booking"
                  className="text-gray-400 hover:text-gold-400 text-sm transition-colors duration-200"
                >
                  {content.footer.quickBooking}
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Contato */}
          <div>
            <h4 className="text-gray-200 font-semibold mb-6 uppercase tracking-wide text-sm">
              {content.footer.contactTitle}
            </h4>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gold-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>

                <span className="text-gray-400">{content.contactEmail}</span>
              </li>

              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gold-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>

                <span className="text-gray-400">{content.contactPhone}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divisor e Copyright */}
        <div className="border-t border-gold-400/10 mt-12 pt-8">
          <p className="text-center text-gray-500 text-sm">
            © {currentYear} {content.siteName}. {content.footer.copyrightSuffix}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
