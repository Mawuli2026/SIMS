const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-2 text-sm text-gray-500 md:flex-row">
        <p>
          © {currentYear} Sales & Inventory Management System. All rights
          reserved.
        </p>

        <div className="flex items-center gap-4">
          <span>CSE 499</span>

          <span className="hidden md:inline">|</span>

          <span>Developed by CHARLES HEMEDI-MAWULI AYIKPA</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;