import React, { useState } from "react";

const LanguageSwitcher = () => {
  const [language, setLanguage] = useState("EN");

  const handleChange = (e) => {
    setLanguage(e.target.value);
    // Add logic for language i18n later
  };

  return (
    <select
      value={language}
      onChange={handleChange}
      className="bg-gray-900 text-white border border-gray-600 rounded-md px-3 py-1 text-sm shadow-lg"
    >
      <option value="EN">English</option>
      
      
    </select>
  );
};

export default LanguageSwitcher;
