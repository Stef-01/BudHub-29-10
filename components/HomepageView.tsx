// components/HomepageView.tsx
import React, { useRef, useState } from 'react';
import { useUserGarden } from '../contexts/UserGardenContext';
import { useWeather } from '../contexts/WeatherContext';
import { useTasks } from '../contexts/TasksContext';
import { useUserCookbook } from '../contexts/UserCookbookContext';
import { useGamification } from '../contexts/GamificationContext';
import { useGameScores } from '../contexts/GameScoresContext';
import { useHomepageData, useWeeklyGameProgress, useCurrentStreak } from '../hooks/useLoganData';
import ResourceModal from './ResourceModal';
import EnhancedHeroSection from './EnhancedHeroSection';
import ProduceCard, { mapProduceToFruitType } from './ProduceCard';
import type { GameMode } from '../types';
import type { Resource } from '../types/logan';

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

  // Logan-specific data
  const { prices, markets, resources, loading: loganDataLoading, lastUpdated, refreshPrices, pricesAreStale, oldestPriceDate } = useHomepageData();

  // Game progress data - Get userId from URL parameter or default to 'demo_user'
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('user') || 'demo_user';
  const { progress: dailyProgress, improvement: improvementTrend } = useWeeklyGameProgress(userId, 7);
  const { streak: currentStreak } = useCurrentStreak(userId);

  const produceCarouselRef = useRef<HTMLDivElement>(null);
  const recipeCarouselRef = useRef<HTMLDivElement>(null);

  // Resource modal state
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedResource(null), 300);
  };

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

  // Transform daily progress into chart data points
  // If we have real Supabase data, use it; otherwise fall back to mock pattern
  const useRealData = dailyProgress && dailyProgress.length >= 2;

  const chartPoints = useRealData
    ? dailyProgress.map((day, index) => {
        // Normalize scores to fit chart height (0-200, with higher scores at top)
        // Assuming scores range from 0-100, we invert for chart display (higher = lower y)
        const normalizedScore = Math.max(20, Math.min(180, 200 - (day.average_score * 1.8)));
        return { x: 20 + index * 60, y: normalizedScore };
      })
    : [
        { x: 20, y: 150 },
        { x: 80, y: 130 },
        { x: 140, y: 120 },
        { x: 200, y: 100 },
        { x: 260, y: 90 },
        { x: 320, y: 70 },
        { x: 380, y: 50 }
      ];

  // Get day labels based on data availability
  const dayLabels = useRealData
    ? dailyProgress.map(day => {
        const date = new Date(day.date);
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      })
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Use real improvement trend or fallback to +12%
  const displayImprovement = useRealData ? `${improvementTrend > 0 ? '+' : ''}${improvementTrend}%` : '+12%';

  // Display indicator if using real data
  const dataSource = useRealData ? `Based on ${dailyProgress.length} days of game play` : 'Demo data - play games to see your progress';

  return (
    <div className="pb-20 min-h-screen">
      {/* Enhanced Hero Section with Parallax */}
      <EnhancedHeroSection
        loganDiabeticsCount={loganDiabeticsCount}
        mockHbA1c={mockHbA1c}
        currentStreak={currentStreak}
        uniqueGameDays={uniqueGameDays}
        averageVegServings={averageVegServings}
        weather={weather}
        level={level}
        xp={xp}
        xpForNextLevel={xpForNextLevel}
      />

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
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-gray-900">Today's Best Deals</h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={refreshPrices}
                disabled={loganDataLoading}
                className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Refresh prices"
              >
                <span className={loganDataLoading ? 'animate-spin' : ''}>↻</span>
                Refresh
              </button>
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
          {lastUpdated && (
            <p className="text-xs text-gray-500 mb-4">
              Last updated: {lastUpdated.toLocaleTimeString()} {lastUpdated.toLocaleDateString()}
            </p>
          )}

          {/* Price staleness warning */}
          {pricesAreStale && oldestPriceDate && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                    Price data may be outdated
                  </h4>
                  <p className="text-xs text-yellow-700">
                    Some prices haven't been updated since {new Date(oldestPriceDate).toLocaleDateString()}.
                    Click the refresh button or check with the market for current pricing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loganDataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-gray-600">Loading fresh prices...</p>
              </div>
            </div>
          ) : (
            <div
              ref={produceCarouselRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100"
            >
              {prices.length > 0 ? prices.map((priceData) => (
                <ProduceCard
                  key={priceData.id}
                  name={priceData.produce_name}
                  price={`$${priceData.price_per_kg?.toFixed(2)}/kg`}
                  market={priceData.market_name}
                  fruitType={mapProduceToFruitType(priceData.produce_name)}
                  isIndianStaple={priceData.is_indian_staple}
                  isLowGI={priceData.gi_rating === 'low'}
                  onClick={() => {
                    console.log('Clicked produce:', priceData.produce_name);
                  }}
                />
              )) : (
                <div className="text-center py-8 text-gray-600">
                  No price data available yet. Check back soon!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Markets List */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Your Local Markets</h3>
          {markets.map((market) => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = market.day_of_week !== null ? dayNames[market.day_of_week] : 'Daily';
            const timeStr = market.start_time && market.end_time
              ? `${dayName} ${market.start_time.slice(0, 5)}-${market.end_time.slice(0, 5)}`
              : 'Daily 9am-6pm';
            const today = new Date().getDay();
            const isOpenToday = market.day_of_week === null || market.day_of_week === today;
            const icon = market.type === 'market' ? '🏪' : market.type === 'indian_grocery' ? '🥬' : '🧺';

            return (
              <div
                key={market.id}
                className="bg-white rounded-2xl p-5 mb-3 flex items-center gap-4 shadow-md hover:translate-x-2 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-500"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-lg flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{market.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2 flex-wrap">
                    <span>📍 {market.suburb || 'Logan'}</span>
                    <span>⏰ {timeStr}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {market.has_indian_produce && (
                      <span className="inline-flex px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Indian Produce
                      </span>
                    )}
                    {isOpenToday && (
                      <span className="inline-flex px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-full">
                        Open Today
                      </span>
                    )}
                    {market.type === 'market' && (
                      <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        Farmers Market
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                  →
                </div>
              </div>
            );
          })}
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
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
                  📊 Progress Tracking
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Your Weekly Performance
                </h2>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${useRealData ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {dataSource}
              </div>
            </div>
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
                  points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {chartPoints.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={i === chartPoints.length - 1 ? "8" : "6"}
                    fill="#5CA963"
                  />
                ))}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: '#C1E5C5', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#5CA963', stopOpacity: 1}} />
                  </linearGradient>
                </defs>

                {/* Day labels */}
                {dayLabels.map((day, i) => (
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
                  {displayImprovement}
                </div>
                <p className="text-gray-600 mt-2">
                  {useRealData ? 'Average improvement this week' : 'Average improvement this week (demo)'}
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

      {/* Indian Dietary Resources Section */}
      <section className="mb-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-2">
            📚 Health Resources
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Indian dietary and cultural resources
          </h2>
          <p className="text-gray-600">Trusted information for healthy eating and diabetes management</p>
        </div>

        {loganDataLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-3xl mb-2">📖</div>
              <p className="text-gray-600">Loading resources...</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.length > 0 ? resources.map((resource) => {
              // Format icon
              const formatIcon = resource.format === 'pdf' ? '📄' : resource.format === 'video' ? '🎥' : '🌐';

              // Topic color scheme
              const topicColors: Record<string, string> = {
                'Indian food culture': 'from-orange-500 to-orange-600',
                'healthy eating': 'from-green-500 to-green-600',
                'diabetes management': 'from-red-500 to-red-600',
                'healthy cooking': 'from-yellow-500 to-yellow-600',
                'lifestyle program': 'from-blue-500 to-blue-600',
                'medical services': 'from-purple-500 to-purple-600',
              };

              const topicGradient = topicColors[resource.topic] || 'from-gray-500 to-gray-600';

              return (
                <button
                  key={resource.id}
                  onClick={() => handleResourceClick(resource)}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-purple-300 text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${topicGradient} rounded-lg flex items-center justify-center text-xl text-white flex-shrink-0`}>
                      {formatIcon}
                    </div>
                    {resource.is_local && (
                      <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        Local
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm group-hover:text-purple-600 transition-colors">
                    {resource.title}
                  </h3>

                  <p className="text-xs text-gray-500 mb-3">
                    {resource.organization}
                  </p>

                  <div className="flex items-center text-purple-600 text-xs font-medium group-hover:translate-x-1 transition-transform">
                    <span>Learn more</span>
                    <span className="ml-1">→</span>
                  </div>
                </button>
              );
            }) : (
              <div className="md:col-span-2 lg:col-span-4 text-center py-8 text-gray-600">
                No resources available yet. Check back soon!
              </div>
            )}
          </div>
        )}
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

      {/* Resource Modal */}
      <ResourceModal
        resource={selectedResource}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default HomepageView;
