const Header = ({ title = "Dashboard" }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center bg-white dark:bg-[#1E1E1E] border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl px-6 py-3 mb-4 transition-all">      
      <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h1>
    </header>
  );
};

export default Header;
