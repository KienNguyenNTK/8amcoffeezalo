import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchInput = () => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <div className="relative">
      <input
        placeholder="Bạn muốn tìm cà phê gì?"
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 h-12"
        onClick={handleSearchClick}
        readOnly
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default SearchInput; 