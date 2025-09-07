'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Star, 
  Share2, 
  RotateCcw, 
  Play,
  Users,
  Zap,
  Shield,
  Compass,
  Award,
  Crown,
  Brain,  
  Heart,
  Eye,
  Lightbulb
} from 'lucide-react';
import { PersonalityAnalysis, StockRecommendation } from '../types';

interface PersonalityResultsProps {
  analysis: PersonalityAnalysis;
  onRetakeQuiz: () => void;
  onStartDemo: () => void;
}

const PersonalityResults: React.FC<PersonalityResultsProps> = ({
  analysis,
  onRetakeQuiz,
  onStartDemo
}) => {
  const [shareEnabled, setShareEnabled] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'stocks' | 'traits'>('overview');

  // Icon mapping for archetypes
  const archetypeIcons: Record<string, React.ComponentType<any>> = {
    explorer: Compass,
    guardian: Shield,
    opportunist: Zap,
    contrarian: Eye
  };

  const IconComponent = archetypeIcons[analysis.primaryArchetype.id] || Compass;

  // Badge calculations based on confidence and archetype
  const badges = [
    { id: 'confidence', name: 'High Confidence', icon: Trophy, earned: analysis.confidence > 70 },
    { id: 'balanced', name: 'Balanced Investor', icon: Star, earned: analysis.confidence < 60 },
    { id: 'decisive', name: 'Decisive Profile', icon: Target, earned: analysis.confidence > 80 },
    { id: 'explorer_spirit', name: 'Innovation Spirit', icon: Lightbulb, earned: analysis.primaryArchetype.id === 'explorer' },
    { id: 'guardian_wisdom', name: 'Wisdom Keeper', icon: Crown, earned: analysis.primaryArchetype.id === 'guardian' },
    { id: 'opportunist_timing', name: 'Perfect Timing', icon: TrendingUp, earned: analysis.primaryArchetype.id === 'opportunist' },
    { id: 'contrarian_vision', name: 'Independent Vision', icon: Brain, earned: analysis.primaryArchetype.id === 'contrarian' }
  ];

  const earnedBadges = badges.filter(badge => badge.earned);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            You're {analysis.primaryArchetype.name}!
          </h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full">
              <span className="text-green-800 dark:text-green-200 font-semibold">
                {analysis.confidence}% Confidence Match
              </span>
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {analysis.personalizedMessage}
          </p>
        </motion.div>

        {/* Achievement Badges */}
        {earnedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
              🏆 Your Investment Badges
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {earnedBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-md border-2 border-yellow-400"
                >
                  <badge.icon className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {badge.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
            {[
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'stocks', label: 'Stock Picks', icon: TrendingUp },
              { id: 'traits', label: 'Your Traits', icon: Star }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                  selectedTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Archetype Description */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    {analysis.primaryArchetype.name} Profile
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {analysis.primaryArchetype.description}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                        💪 Your Strengths:
                      </h4>
                      <ul className="space-y-1">
                        {analysis.primaryArchetype.strengths.map((strength: string, index: number) => (
                          <li key={index} className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                        ⚠️ Watch Out For:
                      </h4>
                      <ul className="space-y-1">
                        {analysis.primaryArchetype.weaknesses?.map((weakness: string, index: number) => (
                          <li key={index} className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Archetype Visual */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {analysis.primaryArchetype.name}
                  </h3>
                  <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                    Investment Archetype
                  </p>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {analysis.confidence}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Confidence Match
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'stocks' && (
            <div className="grid gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  Your Personalized Stock Picks
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.recommendations.slice(0, 6).map((stock: any, index: number) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-white">
                            {stock.symbol}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {stock.company}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {(stock.matchScore * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">match</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {stock.reason}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-1 rounded ${
                          stock.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                          stock.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stock.riskLevel} Risk
                        </span>
                        <span className="text-gray-500">{stock.sector}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'traits' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Your Investment Personality Breakdown
              </h3>
              <div className="space-y-6">
                {Object.entries(analysis.scores).map(([archetype, score], index) => {
                  const scoreValue = score as number;
                  const archetypeData = Object.values({
                    explorer: { name: 'Explorer', color: 'blue', icon: Compass },
                    guardian: { name: 'Guardian', color: 'green', icon: Shield },
                    opportunist: { name: 'Opportunist', color: 'orange', icon: Zap },
                    contrarian: { name: 'Contrarian', color: 'purple', icon: Eye }
                  })[index];
                  
                  return (
                    <motion.div
                      key={archetype}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <archetypeData.icon className={`w-5 h-5 text-${archetypeData.color}-500`} />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {archetypeData.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                          {(scoreValue * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${scoreValue * 100}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                          className={`h-3 rounded-full bg-gradient-to-r from-${archetypeData.color}-400 to-${archetypeData.color}-600`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 mt-8"
        >
          <button
            onClick={onStartDemo}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Play className="w-5 h-5" />
            Start Trading Demo
          </button>
          
          <button
            onClick={() => setShareEnabled(!shareEnabled)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all"
          >
            <Share2 className="w-5 h-5" />
            Share Results
          </button>
          
          <button
            onClick={onRetakeQuiz}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Quiz
          </button>
        </motion.div>

        {/* Share Modal */}
        {shareEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShareEnabled(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Share Your Investment Personality
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Show your friends what type of investor you are!
              </p>
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                  <Users className="w-4 h-4 mx-auto" />
                </button>
                <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                  Share Link
                </button>
                <button
                  onClick={() => setShareEnabled(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PersonalityResults;
