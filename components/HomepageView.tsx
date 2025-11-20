// components/HomepageView.tsx
import React, { useRef } from 'react';
import { useUserGarden } from '../contexts/UserGardenContext';
import { useWeather } from '../contexts/WeatherContext';
import { useTasks } from '../contexts/TasksContext';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { useGamification } from '../contexts/GamificationContext';
import { useGameScores } from '../contexts/GameScoresContext';
import type { GameMode } from '../types';

interface HomepageViewProps {
  onPlayGame?: (gameMode: GameMode) => void;
}

const HomepageView: React.FC<HomepageViewProps> = ({ onPlayGame }) => {
  const { garden = [] } = useUserGarden();
  const { weather } = useWeather();
  const { tasks = [] } = useTasks();
  const { userRecipes = [] } = useUserCookbook();
  const { level, xp, xpForNextLevel } = useGamification();
  const { scores = [] } = useGameScores();

  const produceCarouselRef = useRef<HTMLDivElement>(null);
  const recipeCarouselRef = useRef<HTMLDivElement>(null);

  // Calculate stats - with safe defaults
  const completedTasksThisWeek = tasks.filter(t => t.isCompleted).length;
  const totalPlants = garden.length;
  const averageVegServings = 2.5; // Mock data - could be calculated from actual data

  // Calculate XP percentage - prevent division by zero
  const xpPercentage = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;

  // Mock data for Logan community
  const loganDiabeticsCount = 23017;
  const mockHbA1c = 6.4;

  // Scroll carousel
  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 260;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get recent recipes to display
  const recentRecipes = userRecipes.slice(0, 6);

  // Calculate weekly game activity
  const lastWeekScores = scores.filter(score => {
    const scoreDate = new Date(score.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return scoreDate >= weekAgo;
  });

  const uniqueGameDays = new Set(lastWeekScores.map(score =>
    new Date(score.date).toDateString()
  )).size;

  const daysSinceLastGame = scores.length > 0 ?
    Math.floor((Date.now() - new Date(scores[scores.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)) : 5;

  return (
    <div className="pb-20 min-h-screen">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-white via-green-50 to-white rounded-3xl p-6 sm:p-8 mb-6 shadow-lg border-2 border-green-100 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-200 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              Your Logan Health Journey
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-4">
              <span>📍</span>
              <span className="font-medium">{weather?.location.name || 'Logan'}, QLD • This week</span>
            </div>
            <div className="flex items-baseline justify-center md:justify-start gap-3 mb-4">
              <span className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                {loganDiabeticsCount.toLocaleString()}
              </span>
              <span className="text-lg text-gray-600">people in Logan managing diabetes</span>
            </div>
            <p className="text-gray-600 mb-6 text-base max-w-2xl">
              Together, we're building healthier communities, one family at a time.
            </p>

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📊</div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{mockHbA1c}%</div>
                  <div className="text-xs text-gray-500">HbA1c</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🏃</div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{uniqueGameDays} days</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">🥗</div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{averageVegServings}</div>
                  <div className="text-xs text-gray-500">Veg serves</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-6xl sm:text-7xl shadow-xl animate-pulse">
            ❤️
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-6 bg-white rounded-full p-2 flex items-center gap-4 shadow-md max-w-md mx-auto md:mx-0">
          <span className="text-sm font-bold text-green-600 ml-2">✨ Level {level}</span>
          <div className="flex-1 h-3 bg-green-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${xpPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Local Produce Section */}
      <section className="mb-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
            🌿 Fresh This Week
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Local Indian staples in Logan
          </h2>
          <p className="text-gray-600">Find fresh ingredients for your healthy recipes</p>
        </div>

        {/* Produce Deals Carousel */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Today's Best Deals</h3>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel(produceCarouselRef, 'left')}
                className="w-9 h-9 rounded-full border-2 border-green-600 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all hover:scale-110"
              >
                ←
              </button>
              <button
                onClick={() => scrollCarousel(produceCarouselRef, 'right')}
                className="w-9 h-9 rounded-full border-2 border-green-600 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all hover:scale-110"
              >
                →
              </button>
            </div>
          </div>

          <div
            ref={produceCarouselRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100"
          >
            {[
              { emoji: '🥒', name: 'Bitter Melon', price: '$3.99/kg', tags: ['Global Markets', 'For Sabzi'] },
              { emoji: '🌿', name: 'Fresh Coriander', price: '$2.50/bunch', tags: ['Logan Central', 'Essential'] },
              { emoji: '🫑', name: 'Okra (Bhindi)', price: '$4.99/kg', tags: ['Sunday Fresh', 'For Curry'] },
              { emoji: '🌶️', name: 'Green Chilies', price: '$6.99/kg', tags: ['Spice World', 'Fresh Daily'] },
              { emoji: '🥬', name: 'Spinach', price: '$3.49/bunch', tags: ['Organic', 'Local'] },
              { emoji: '🍅', name: 'Roma Tomatoes', price: '$2.99/kg', tags: ['Fresh', 'Low GI'] },
            ].map((produce, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-60 bg-white rounded-2xl p-5 shadow-md border-2 border-transparent hover:border-green-500 hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-4xl mb-3 animate-bounce">
                  {produce.emoji}
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{produce.name}</h4>
                <div className="text-2xl font-extrabold text-green-600 mb-3">{produce.price}</div>
                <div className="flex flex-wrap gap-2">
                  {produce.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Markets List */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Your Local Markets</h3>
          {[
            {
              icon: '🏪',
              name: 'Global Food Markets',
              location: 'Logan Central',
              time: 'Sun 6am-12pm',
              tags: ['Indian Greens', 'Spices', { text: 'Open Now', isSuccess: true }]
            },
            {
              icon: '🧺',
              name: 'Logan Farmers Market',
              location: 'Beenleigh',
              time: 'Sat 6am-11am',
              tags: ['Local Produce', 'Organic']
            },
            {
              icon: '🥬',
              name: 'Spice World Logan',
              location: 'Springwood',
              time: 'Daily 8am-8pm',
              tags: ['Indian Groceries', 'Fresh Daily']
            },
          ].map((market, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 mb-3 flex items-center gap-4 shadow-md hover:translate-x-2 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-500"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg flex-shrink-0">
                {market.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-900 mb-1">{market.name}</h4>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2 flex-wrap">
                  <span>📍 {market.location}</span>
                  <span>⏰ {market.time}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {market.tags.map((tag, i) => {
                    const isObject = typeof tag === 'object';
                    const tagText = isObject ? tag.text : tag;
                    const isSuccess = isObject && tag.isSuccess;
                    return (
                      <span
                        key={i}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          isSuccess
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {tagText}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recipes Section */}
      <section className="mb-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
            🍳 Kitchen Time
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Cook from your garden
          </h2>
        </div>

        <div
          ref={recipeCarouselRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100"
        >
          {recentRecipes.length > 0 ? recentRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-md hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="relative w-full h-32 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-5xl">
                {recipe.image}
                <div className="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-full text-sm font-bold text-gray-900 shadow-md">
                  ⏱️ {recipe.prep_minutes + recipe.cook_minutes} min
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{recipe.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {recipe.keyIngredients.join(', ')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.diabetic_friendly && (
                    <span className="inline-flex px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-full">
                      Low GI
                    </span>
                  )}
                  {recipe.high_protein && (
                    <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      High Protein
                    </span>
                  )}
                  {recipe.diet_tags.slice(0, 1).map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            // Fallback recipes if user has none
            [
              { emoji: '🍅', name: 'Tomato & Bottle Gourd Curry', time: 30, tags: ['Low GI', 'Logan Friendly'] },
              { emoji: '🥘', name: 'Palak Paneer', time: 45, tags: ['High Protein', 'Diabetic Friendly'] },
              { emoji: '🌶️', name: 'Bhindi Masala', time: 25, tags: ['Low Calorie', 'Quick & Easy'] },
            ].map((recipe, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-md hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="relative w-full h-32 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-5xl">
                  {recipe.emoji}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-full text-sm font-bold text-gray-900 shadow-md">
                    ⏱️ {recipe.time} min
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{recipe.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          i === 0
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Games Section */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-white via-green-50 to-white rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
              🎮 Game Time
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Practice Nutrition Skills
            </h2>
            <p className="text-gray-600">Build healthy habits through fun challenges</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Play Games */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Play Games</h3>
              <div className="flex flex-col gap-3">
                {[
                  { icon: '🍽️', name: 'Nutriserve', mode: 'nutriserve' as GameMode },
                  { icon: '🥗', name: 'Plate Builder', mode: 'unified_nutrient' as GameMode },
                  { icon: '🏪', name: 'Market Quiz', mode: 'diabetic_friendly' as GameMode },
                ].map((game, index) => (
                  <button
                    key={index}
                    onClick={() => onPlayGame?.(game.mode)}
                    className="flex items-center justify-between p-4 bg-green-100 rounded-2xl hover:bg-white hover:border-2 hover:border-green-500 hover:translate-x-1 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-xl text-white shadow-md">
                        {game.icon}
                      </div>
                      <span className="font-bold text-gray-900">{game.name}</span>
                    </div>
                    <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      ▶
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Reminder */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Activity</h3>
              {daysSinceLastGame > 3 ? (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-2xl p-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-2xl mb-3 animate-wiggle">
                    ⚠️
                  </div>
                  <div className="font-bold text-gray-900 mb-2">
                    You haven't played in {daysSinceLastGame} days!
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Keep your streak going to maintain healthy habits
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onPlayGame?.('nutriserve')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-full hover:-translate-y-1 hover:shadow-lg transition-all"
                    >
                      Play Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 rounded-2xl p-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl mb-3">
                    🔥
                  </div>
                  <div className="font-bold text-gray-900 mb-2">
                    Great job! {uniqueGameDays}-day streak!
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    You've played {lastWeekScores.length} games this week
                  </p>
                  <button
                    onClick={() => onPlayGame?.('nutriserve')}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-full hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    Keep Going!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="mb-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
              📊 Progress Tracking
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Your Weekly Performance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Graph visualization */}
            <div className="md:col-span-2 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 h-64">
              <svg className="w-full h-full" viewBox="0 0 400 200">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="400" y2="50" stroke="#E5E8EC" strokeWidth="1" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#E5E8EC" strokeWidth="1" />
                <line x1="0" y1="150" x2="400" y2="150" stroke="#E5E8EC" strokeWidth="1" />

                {/* Progress line */}
                <polyline
                  points="20,150 80,130 140,120 200,100 260,90 320,70 380,50"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {[
                  {x: 20, y: 150},
                  {x: 80, y: 130},
                  {x: 140, y: 120},
                  {x: 200, y: 100},
                  {x: 260, y: 90},
                  {x: 320, y: 70},
                  {x: 380, y: 50}
                ].map((point, i) => (
                  <circle key={i} cx={point.x} cy={point.y} r={i === 6 ? "8" : "6"} fill="#5CA963" />
                ))}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: '#C1E5C5', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#5CA963', stopOpacity: 1}} />
                  </linearGradient>
                </defs>

                {/* Day labels */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <text key={i} x={20 + i * 60} y="190" fontSize="12" fill="#8C8C8C" textAnchor="middle">
                    {day}
                  </text>
                ))}
              </svg>
            </div>

            {/* Stats Panel */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  +12%
                </div>
                <p className="text-gray-600 mt-2">
                  Average improvement this week
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: '🔥', text: `${uniqueGameDays}-day streak this week` },
                  { icon: '🏆', text: `Best: Plate Builder 90%` },
                  { icon: '⭐', text: `${xp} points earned` },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-green-100 rounded-xl hover:translate-x-1 hover:shadow-md transition-all"
                  >
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">{stat.icon} {stat.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex bg-green-100 rounded-full p-1 mt-auto">
                <button className="flex-1 py-2.5 text-sm font-bold rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                  My Progress
                </button>
                <button className="flex-1 py-2.5 text-sm font-bold rounded-full text-gray-600 hover:bg-green-200 transition-colors">
                  Family
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Health Programs Section */}
      <section>
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
            🏥 Community Health
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Logan health programs for you and your family
          </h2>
          <p className="text-gray-600">Free programs to support your health journey</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🚶',
              title: 'My Health for Life',
              description: 'Free program helping prevent diabetes through personalized coaching for healthy eating and active living.',
              tags: ['Free', 'Logan Area', '6-Week Program']
            },
            {
              icon: '👟',
              title: 'Walk & Talk Groups',
              description: 'Join community walking groups for exercise and social connection. All fitness levels welcome.',
              tags: ['Free', 'All Ages', 'Weekly']
            },
            {
              icon: '🍎',
              title: 'Diabetes Education',
              description: 'Learn to manage diabetes with nutrition workshops and cooking classes using local ingredients.',
              tags: ['Free', 'Family Friendly', 'Monthly']
            },
          ].map((program, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-md hover:-translate-y-2 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-200 rounded-full opacity-20 blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">
                    {program.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{program.title}</h3>
                </div>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {program.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {program.tags.map((tag, i) => (
                    <span
                      key={i}
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        i === 0
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-4 rounded-full hover:-translate-y-1 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  {index === 0 ? 'Check Eligibility' : index === 1 ? 'Find a Group' : 'Register Now'} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: #E8F5EA;
          border-radius: 999px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #5CA963 0%, #4A9650 100%);
          border-radius: 999px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4A9650 0%, #3A7A40 100%);
        }
      `}</style>
    </div>
  );
};

export default HomepageView;
