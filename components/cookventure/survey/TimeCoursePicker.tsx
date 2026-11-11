// components/cookventure/survey/TimeCoursePicker.tsx
// Survey step: how much time you have, and what kind of dish you want.
import React from 'react';
import { motion } from 'framer-motion';

export const TIME_OPTIONS: Array<{ minutes: number; label: string; hi: string; emoji: string }> = [
  { minutes: 15, label: '15 min', hi: '१५ मिनट', emoji: '⚡' },
  { minutes: 30, label: '30 min', hi: '३० मिनट', emoji: '⏱️' },
  { minutes: 45, label: '45 min', hi: '४५ मिनट', emoji: '🍳' },
  { minutes: 60, label: '60+ min', hi: '६०+ मिनट', emoji: '🫕' },
];

export const COURSE_OPTIONS: Array<{ id: string; label: string; hi: string; emoji: string }> = [
  { id: 'breakfast', label: 'Breakfast', hi: 'नाश्ता', emoji: '🌅' },
  { id: 'main', label: 'Main', hi: 'मुख्य', emoji: '🍛' },
  { id: 'side', label: 'Side', hi: 'साथ में', emoji: '🥗' },
  { id: 'soup', label: 'Soup', hi: 'सूप', emoji: '🍲' },
  { id: 'snack', label: 'Snack', hi: 'स्नैक', emoji: '🥨' },
  { id: 'dessert', label: 'Dessert', hi: 'मिठाई', emoji: '🍮' },
  { id: 'beverage', label: 'Drink', hi: 'पेय', emoji: '☕' },
];

interface TimeCoursePickerProps {
  timeLimit?: number;
  courses: string[];
  onChangeTime: (minutes: number | undefined) => void;
  onToggleCourse: (course: string) => void;
}

const chipClass = (selected: boolean) =>
  `flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-3 py-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
    selected ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 bg-white hover:border-orange-300'
  }`;

const TimeCoursePicker: React.FC<TimeCoursePickerProps> = ({ timeLimit, courses, onChangeTime, onToggleCourse }) => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">How much time, and what for?</h2>
      <p className="text-xs text-gray-500">Both are optional · skip to see everything</p>
    </div>

    <section>
      <h3 className="text-sm font-bold text-gray-700 mb-3">
        ⏰ Time you have <span className="font-normal text-gray-500">समय</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="group" aria-label="Time you have">
        {TIME_OPTIONS.map((option) => {
          const selected = timeLimit === option.minutes;
          return (
            <motion.button
              key={option.minutes}
              type="button"
              whileTap={{ scale: 0.97 }}
              aria-pressed={selected}
              onClick={() => onChangeTime(selected ? undefined : option.minutes)}
              className={chipClass(selected)}
            >
              <span className="text-2xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-sm font-bold text-gray-800">{option.label}</span>
              <span className="text-[10px] text-gray-500" lang="hi">
                {option.hi}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-500">
        Counts prep and cooking. Idli, dosa and appam batters need overnight soaking, so they suit 60+.
      </p>
    </section>

    <section>
      <h3 className="text-sm font-bold text-gray-700 mb-3">
        🍽️ Course <span className="font-normal text-gray-500">व्यंजन</span>
        <span className="ml-2 text-xs font-normal text-gray-500">pick any</span>
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3" role="group" aria-label="Course">
        {COURSE_OPTIONS.map((option) => {
          const selected = courses.includes(option.id);
          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              aria-pressed={selected}
              onClick={() => onToggleCourse(option.id)}
              className={chipClass(selected)}
            >
              <span className="text-2xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-xs font-bold text-gray-800">{option.label}</span>
              <span className="text-[10px] text-gray-500" lang="hi">
                {option.hi}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  </div>
);

export default TimeCoursePicker;
