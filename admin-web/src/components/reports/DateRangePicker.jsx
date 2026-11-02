// npm install html2canvas jspdf date-fns

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const DateRangePicker = ({ onRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState('Last 30 Days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef(null);

  const ranges = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Last Month',
    'Custom Range'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeSelect = (selectedRange) => {
    setRange(selectedRange);
    if (selectedRange !== 'Custom Range') {
      setIsOpen(false);
      const dates = calculateDateRange(selectedRange);
      onRangeChange(dates);
    }
  };

  const calculateDateRange = (selectedRange) => {
    const end = new Date();
    const start = new Date();
    
    switch(selectedRange) {
      case 'Today':
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        break;
      case 'Yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0,0,0,0);
        end.setDate(end.getDate() - 1);
        end.setHours(23,59,59,999);
        break;
      case 'Last 7 Days':
        start.setDate(start.getDate() - 7);
        break;
      case 'Last 30 Days':
        start.setDate(start.getDate() - 30);
        break;
      case 'This Month':
        start.setDate(1);
        start.setHours(0,0,0,0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23,59,59,999);
        break;
      case 'Last Month':
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        start.setHours(0,0,0,0);
        end.setDate(0);
        end.setHours(23,59,59,999);
        break;
    }
    
    return { start, end };
  };

  const handleCustomRangeApply = () => {
    if (customStart && customEnd) {
      setIsOpen(false);
      onRangeChange({
        start: new Date(customStart),
        end: new Date(customEnd)
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Calendar size={16} className="text-gray-500" />
        <span>{range}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => handleRangeSelect(r)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  range === r ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
            
            {range === 'Custom Range' && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200"
                  />
                  <button
                    onClick={handleCustomRangeApply}
                    disabled={!customStart || !customEnd}
                    className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;