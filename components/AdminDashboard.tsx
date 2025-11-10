// components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/Icons';
import {
  getNutrientChallengeAttempts,
  getNutrientChallengeSessions,
  getNutriServeRoundAttempts,
  getNutriServeSessions,
  getNutrientChallengeMastery,
  getNutriServeProblemNutrients,
} from '../services/supabaseLogger';
import { trackAdminAccess, trackAdminTabChange } from '../lib/analytics';

interface AdminDashboardProps {
  onExit: () => void;
  userId?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit, userId = 'dad' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrient-challenge' | 'nutriserve'>('overview');
  const [loading, setLoading] = useState(true);

  // Nutrient Challenge Data
  const [ncSessions, setNcSessions] = useState<any[]>([]);
  const [ncAttempts, setNcAttempts] = useState<any[]>([]);
  const [ncMastery, setNcMastery] = useState<any[]>([]);

  // NutriServe Data
  const [nsSessions, setNsSessions] = useState<any[]>([]);
  const [nsRoundAttempts, setNsRoundAttempts] = useState<any[]>([]);
  const [nsProblemNutrients, setNsProblemNutrients] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    // Track admin access
    trackAdminAccess(userId);
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        ncSessionsData,
        ncAttemptsData,
        ncMasteryData,
        nsSessionsData,
        nsRoundAttemptsData,
        nsProblemNutrientsData,
      ] = await Promise.all([
        getNutrientChallengeSessions(userId),
        getNutrientChallengeAttempts(userId),
        getNutrientChallengeMastery(userId),
        getNutriServeSessions(userId),
        getNutriServeRoundAttempts(userId),
        getNutriServeProblemNutrients(userId),
      ]);

      setNcSessions(ncSessionsData);
      setNcAttempts(ncAttemptsData);
      setNcMastery(ncMasteryData);
      setNsSessions(nsSessionsData);
      setNsRoundAttempts(nsRoundAttemptsData);
      setNsProblemNutrients(nsProblemNutrientsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-xl text-emerald-800">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const totalSessions = ncSessions.length + nsSessions.length;
  const avgNcScore = ncSessions.length > 0
    ? Math.round(ncSessions.reduce((sum, s) => sum + s.final_score, 0) / ncSessions.length)
    : 0;
  const avgNsScore = nsSessions.length > 0
    ? Math.round(nsSessions.reduce((sum, s) => sum + s.final_score, 0) / nsSessions.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900">Analytics Dashboard</h1>
            <p className="text-emerald-700">Tracking progress for user: <span className="font-semibold">{userId}</span></p>
          </div>
          <button
            onClick={onExit}
            className="p-2 rounded-full text-gray-500 hover:bg-white hover:shadow-md transition-all"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">Total Sessions</h3>
            <p className="text-4xl font-bold text-emerald-900">{totalSessions}</p>
            <p className="text-sm text-gray-500 mt-2">
              NC: {ncSessions.length} | NS: {nsSessions.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">Nutrient Challenge Avg</h3>
            <p className="text-4xl font-bold text-blue-900">{avgNcScore}</p>
            <p className="text-sm text-gray-500 mt-2">
              Best: {ncSessions.length > 0 ? Math.max(...ncSessions.map(s => s.final_score)) : 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-gray-600 text-sm font-semibold uppercase mb-2">NutriServe Avg</h3>
            <p className="text-4xl font-bold text-purple-900">{avgNsScore}</p>
            <p className="text-sm text-gray-500 mt-2">
              Best: {nsSessions.length > 0 ? Math.max(...nsSessions.map(s => s.final_score)) : 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('overview');
                trackAdminTabChange('overview', userId);
              }}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-emerald-700 border-b-2 border-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('nutrient-challenge');
                trackAdminTabChange('nutrient-challenge', userId);
              }}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'nutrient-challenge'
                  ? 'text-emerald-700 border-b-2 border-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Nutrient Challenge Analysis
            </button>
            <button
              onClick={() => {
                setActiveTab('nutriserve');
                trackAdminTabChange('nutriserve', userId);
              }}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'nutriserve'
                  ? 'text-emerald-700 border-b-2 border-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              NutriServe Analysis
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab
                ncSessions={ncSessions}
                nsSessions={nsSessions}
                ncMastery={ncMastery}
                nsProblemNutrients={nsProblemNutrients}
              />
            )}

            {activeTab === 'nutrient-challenge' && (
              <NutrientChallengeTab
                sessions={ncSessions}
                attempts={ncAttempts}
                mastery={ncMastery}
              />
            )}

            {activeTab === 'nutriserve' && (
              <NutriServeTab
                sessions={nsSessions}
                roundAttempts={nsRoundAttempts}
                problemNutrients={nsProblemNutrients}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  ncSessions: any[];
  nsSessions: any[];
  ncMastery: any[];
  nsProblemNutrients: any[];
}> = ({ ncSessions, nsSessions, ncMastery, nsProblemNutrients }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Concept Mastery (Nutrient Challenge)</h3>
        {ncMastery.length === 0 ? (
          <p className="text-gray-500 italic">No data available yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ncMastery.map((concept) => (
              <div key={concept.metric} className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-emerald-900 capitalize">
                    {concept.metric.replace(/_/g, ' ')}
                  </h4>
                  <span className={`text-2xl font-bold ${
                    concept.accuracy_pct >= 80 ? 'text-green-600' :
                    concept.accuracy_pct >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {concept.accuracy_pct.toFixed(0)}%
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{concept.correct} correct out of {concept.attempts} attempts</p>
                  <p>Avg time: {concept.avg_time_taken?.toFixed(1) || 'N/A'}s remaining</p>
                </div>
                <div className="mt-2 bg-white rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      concept.accuracy_pct >= 80 ? 'bg-green-500' :
                      concept.accuracy_pct >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${concept.accuracy_pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Problem Nutrients (NutriServe)</h3>
        {nsProblemNutrients.length === 0 ? (
          <p className="text-gray-500 italic">No data available yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {nsProblemNutrients.map((nutrient) => (
              <div key={nutrient.nutrient} className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 capitalize mb-2">{nutrient.nutrient}</h4>
                <p className="text-3xl font-bold text-orange-700">{nutrient.times_off_target}</p>
                <p className="text-sm text-gray-600">times off target</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg score: {nutrient.avg_score_when_off?.toFixed(0) || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Nutrient Challenge Tab Component
const NutrientChallengeTab: React.FC<{
  sessions: any[];
  attempts: any[];
  mastery: any[];
}> = ({ sessions, attempts, mastery }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 italic">No sessions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Correct</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.slice(0, 10).map((session, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{session.final_score}</td>
                    <td className="px-4 py-3 text-sm">
                      {session.questions_correct}/{session.questions_total}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {((session.questions_correct / session.questions_total) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Attempts (Last 20)</h3>
        {attempts.length === 0 ? (
          <p className="text-gray-500 italic">No attempts yet</p>
        ) : (
          <div className="space-y-2">
            {attempts.slice(0, 20).map((attempt, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  attempt.was_correct ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">
                      {attempt.metric.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600 italic">"{attempt.challenge_text}"</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Selected: <span className="font-medium">{attempt.selected_recipe_name}</span>
                      {!attempt.was_correct && (
                        <span className="text-red-600"> (Correct: {attempt.correct_recipe_name})</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${attempt.was_correct ? 'text-green-600' : 'text-red-600'}`}>
                      {attempt.was_correct ? '✓' : '✗'}
                    </p>
                    <p className="text-sm text-gray-600">{attempt.points_earned} pts</p>
                    <p className="text-xs text-gray-500">{attempt.time_taken_seconds}s left</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// NutriServe Tab Component
const NutriServeTab: React.FC<{
  sessions: any[];
  roundAttempts: any[];
  problemNutrients: any[];
}> = ({ sessions, roundAttempts, problemNutrients }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 italic">No sessions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Rounds</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Avg/Round</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Perfect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.slice(0, 10).map((session, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{session.final_score}</td>
                    <td className="px-4 py-3 text-sm">{session.rounds_completed}</td>
                    <td className="px-4 py-3 text-sm">
                      {session.average_round_score?.toFixed(1) || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">{session.perfect_rounds || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Round Attempts (Last 15)</h3>
        {roundAttempts.length === 0 ? (
          <p className="text-gray-500 italic">No rounds yet</p>
        ) : (
          <div className="space-y-3">
            {roundAttempts.slice(0, 15).map((round, idx) => (
              <div key={idx} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-purple-900">
                      Round {round.round_number} - {round.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(round.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-700">
                      {round.round_score}/{round.max_possible_score}
                    </p>
                    <p className="text-xs text-gray-600">XP: {round.xp_awarded}</p>
                  </div>
                </div>

                {round.nutrients_off_target && round.nutrients_off_target.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-700 font-medium">
                      Off-target nutrients: {round.nutrients_off_target.join(', ')}
                    </p>
                  </div>
                )}

                <details className="mt-2">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    View foods selected
                  </summary>
                  <div className="mt-2 pl-4 text-sm text-gray-700">
                    {round.foods_selected?.map((food: any, foodIdx: number) => (
                      <p key={foodIdx}>
                        • {food.foodName} ({food.grams}g)
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
