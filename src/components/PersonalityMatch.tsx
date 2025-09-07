'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Shield, 
  Search, 
  Zap,
  BarChart3,
  Clock,
  Target,
  Brain
} from 'lucide-react';
import PersonalityResults from './PersonalityResults';
import { PersonalityAnalysis } from '../types';

// Quiz question types and data
interface QuizQuestion {
  id: number;
  question: string;
  subtitle?: string;
  options: {
    text: string;
    value: string;
    points: {
      explorer: number;
      guardian: number;
      opportunist: number;
      contrarian: number;
    };
    emoji: string;
  }[];
  icon: React.ReactNode;
}

interface QuizResponse {
  questionId: number;
  selectedOption: string;
  points: {
    explorer: number;
    guardian: number;
    opportunist: number;
    contrarian: number;
  };
}

interface PersonalityMatchProps {
  userId?: string;
  onComplete?: (result: any) => void;
  onStartDemo?: () => void;
  className?: string;
}

// Quiz questions data
const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Your favorite stock just dropped 15% in one week. What's your first instinct?",
    subtitle: "This reveals your risk tolerance and emotional response to volatility",
    icon: <TrendingUp className="w-6 h-6" />,
    options: [
      {
        text: "Panic sell before it gets worse!",
        value: "panic_sell",
        emoji: "😰",
        points: { explorer: 0, guardian: 1, opportunist: 0, contrarian: 0 }
      },
      {
        text: "Hold steady - this is temporary",
        value: "hold_steady",
        emoji: "🛡️",
        points: { explorer: 1, guardian: 3, opportunist: 1, contrarian: 2 }
      },
      {
        text: "Buy more at this discount!",
        value: "buy_more",
        emoji: "💎",
        points: { explorer: 2, guardian: 1, opportunist: 3, contrarian: 3 }
      },
      {
        text: "Research what caused the drop first",
        value: "research_first",
        emoji: "🔍",
        points: { explorer: 1, guardian: 2, opportunist: 2, contrarian: 2 }
      }
    ]
  },
  {
    id: 2,
    question: "What's your ideal investment timeline?",
    subtitle: "Your time horizon affects which stocks suit your strategy",
    icon: <Clock className="w-6 h-6" />,
    options: [
      {
        text: "Days to weeks - I love quick trades",
        value: "short_term",
        emoji: "⚡",
        points: { explorer: 2, guardian: 0, opportunist: 3, contrarian: 1 }
      },
      {
        text: "Months to a year - medium term growth",
        value: "medium_term",
        emoji: "📈",
        points: { explorer: 3, guardian: 1, opportunist: 2, contrarian: 2 }
      },
      {
        text: "Years to decades - long-term wealth building",
        value: "long_term",
        emoji: "🌳",
        points: { explorer: 1, guardian: 3, opportunist: 0, contrarian: 2 }
      },
      {
        text: "I adjust based on market conditions",
        value: "flexible",
        emoji: "🎯",
        points: { explorer: 2, guardian: 2, opportunist: 2, contrarian: 3 }
      }
    ]
  },
  {
    id: 3,
    question: "Which industry gets your heart racing?",
    subtitle: "Your sector preferences reveal your risk appetite and innovation mindset",
    icon: <Zap className="w-6 h-6" />,
    options: [
      {
        text: "Cutting-edge tech (AI, quantum computing, space)",
        value: "cutting_edge",
        emoji: "🚀",
        points: { explorer: 3, guardian: 0, opportunist: 2, contrarian: 1 }
      },
      {
        text: "Stable essentials (utilities, consumer goods, healthcare)",
        value: "stable_essentials",
        emoji: "🏥",
        points: { explorer: 0, guardian: 3, opportunist: 0, contrarian: 1 }
      },
      {
        text: "Hot trends (whatever's buzzing on social media)",
        value: "hot_trends",
        emoji: "🔥",
        points: { explorer: 1, guardian: 0, opportunist: 3, contrarian: 0 }
      },
      {
        text: "Unloved sectors (energy, mining when everyone hates them)",
        value: "unloved_sectors",
        emoji: "⛏️",
        points: { explorer: 1, guardian: 1, opportunist: 0, contrarian: 3 }
      }
    ]
  },
  {
    id: 4,
    question: "Your investment philosophy is closest to:",
    subtitle: "This reveals your core approach to market opportunities",
    icon: <Brain className="w-6 h-6" />,
    options: [
      {
        text: "\"Innovation changes everything - I want in early!\"",
        value: "innovation_early",
        emoji: "💡",
        points: { explorer: 3, guardian: 0, opportunist: 2, contrarian: 1 }
      },
      {
        text: "\"Slow and steady wins the race\"",
        value: "slow_steady",
        emoji: "🐢",
        points: { explorer: 0, guardian: 3, opportunist: 0, contrarian: 1 }
      },
      {
        text: "\"Strike while the iron is hot!\"",
        value: "strike_hot",
        emoji: "🔨",
        points: { explorer: 1, guardian: 0, opportunist: 3, contrarian: 1 }
      },
      {
        text: "\"Buy when others are selling\"",
        value: "buy_when_selling",
        emoji: "🎭",
        points: { explorer: 1, guardian: 1, opportunist: 1, contrarian: 3 }
      }
    ]
  },
  {
    id: 5,
    question: "How do you prefer to discover new investment ideas?",
    subtitle: "Your research style indicates your investor personality type",
    icon: <Search className="w-6 h-6" />,
    options: [
      {
        text: "Deep research reports and financial analysis",
        value: "deep_research",
        emoji: "📊",
        points: { explorer: 2, guardian: 3, opportunist: 1, contrarian: 2 }
      },
      {
        text: "Social media buzz and trending topics",
        value: "social_buzz",
        emoji: "📱",
        points: { explorer: 1, guardian: 0, opportunist: 3, contrarian: 0 }
      },
      {
        text: "Contrarian articles about undervalued stocks",
        value: "contrarian_articles",
        emoji: "📰",
        points: { explorer: 1, guardian: 1, opportunist: 0, contrarian: 3 }
      },
      {
        text: "Revolutionary product launches and breakthroughs",
        value: "product_launches",
        emoji: "🎉",
        points: { explorer: 3, guardian: 0, opportunist: 2, contrarian: 1 }
      }
    ]
  },
  {
    id: 6,
    question: "Your ideal portfolio would be described as:",
    subtitle: "This shows your overall risk and diversification preferences",
    icon: <Target className="w-6 h-6" />,
    options: [
      {
        text: "A few high-conviction bets on game-changers",
        value: "high_conviction",
        emoji: "🎯",
        points: { explorer: 3, guardian: 0, opportunist: 2, contrarian: 2 }
      },
      {
        text: "Well-diversified blue chips with dividends",
        value: "diversified_blue_chips",
        emoji: "🏛️",
        points: { explorer: 0, guardian: 3, opportunist: 0, contrarian: 1 }
      },
      {
        text: "Momentum stocks riding current trends",
        value: "momentum_trends",
        emoji: "🌊",
        points: { explorer: 1, guardian: 0, opportunist: 3, contrarian: 0 }
      },
      {
        text: "Beaten-down value plays waiting for recovery",
        value: "value_recovery",
        emoji: "💎",
        points: { explorer: 1, guardian: 2, opportunist: 0, contrarian: 3 }
      }
    ]
  },
  {
    id: 7,
    question: "When the market crashes 20%, you:",
    subtitle: "Crisis response reveals your true investor character",
    icon: <BarChart3 className="w-6 h-6" />,
    options: [
      {
        text: "See it as the buying opportunity of a lifetime",
        value: "buying_opportunity",
        emoji: "🛒",
        points: { explorer: 2, guardian: 1, opportunist: 2, contrarian: 3 }
      },
      {
        text: "Stay calm and stick to your plan",
        value: "stick_to_plan",
        emoji: "🧘",
        points: { explorer: 1, guardian: 3, opportunist: 1, contrarian: 2 }
      },
      {
        text: "Look for which sectors will bounce back fastest",
        value: "fastest_bounce",
        emoji: "🏃",
        points: { explorer: 2, guardian: 1, opportunist: 3, contrarian: 1 }
      },
      {
        text: "Wait for the dust to settle before acting",
        value: "wait_and_see",
        emoji: "👀",
        points: { explorer: 1, guardian: 2, opportunist: 1, contrarian: 1 }
      }
    ]
  }
];

export default function PersonalityMatch({ userId, onComplete, onStartDemo, className = "" }: PersonalityMatchProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PersonalityAnalysis | null>(null);

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const canProceed = selectedOption !== "";

  const handleStart = () => {
    setQuizStarted(true);
  };

  const handleOptionSelect = (optionValue: string) => {
    setSelectedOption(optionValue);
  };

  const handleNext = () => {
    if (!canProceed) return;

    const question = quizQuestions[currentQuestion];
    const option = question.options.find(opt => opt.value === selectedOption);
    
    if (option) {
      const response: QuizResponse = {
        questionId: question.id,
        selectedOption: selectedOption,
        points: option.points
      };

      setResponses(prev => [...prev, response]);
    }

    setIsAnimating(true);
    setTimeout(() => {
      if (isLastQuestion) {
        // Calculate results and finish
        completeQuiz();
      } else {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption("");
        setIsAnimating(false);
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev - 1);
        setResponses(prev => prev.slice(0, -1));
        setSelectedOption("");
        setIsAnimating(false);
      }, 300);
    }
  };

  const completeQuiz = () => {
    // Calculate personality scores from responses  
    const scores = responses.reduce((acc, response) => {
      acc.explorer += response.points.explorer;
      acc.guardian += response.points.guardian;
      acc.opportunist += response.points.opportunist;
      acc.contrarian += response.points.contrarian;
      return acc;
    }, { explorer: 0, guardian: 0, opportunist: 0, contrarian: 0 });

    // Normalize scores to percentages
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const normalizedScores = Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [key, value / total])
    );

    // Find dominant personality
    const dominantType = Object.entries(normalizedScores).reduce((max, [key, value]) => 
      value > max.score ? { type: key, score: value } : max
    , { type: 'guardian', score: 0 });

    // Create basic archetype data
    const archetypeData = {
      explorer: { 
        name: 'The Explorer',
        title: 'Innovation-Driven Growth Seeker',
        description: 'You thrive on innovation and growth opportunities.',
        strengths: ['Innovation-focused', 'Risk-tolerant', 'Growth-minded'],
        weaknesses: ['May be too aggressive', 'Volatility sensitive'],
        traits: ['Innovative', 'Forward-thinking', 'Risk-tolerant'],
        idealStocks: ['TSLA', 'NVDA', 'PLTR'],
        emoji: '🚀',
        risks: ['High volatility', 'Tech sector concentration', 'Momentum crashes'],
        idealHolding: '3-5 years',
        riskTolerance: 'High',
        preferredSectors: ['Technology', 'Electric Vehicles', 'AI & Machine Learning'],
        stockCriteria: {
          marketCap: ['Large Cap', 'Mid Cap'],
          volatility: 'High',
          dividendYield: 'Low',
          peRatio: 'High',
          growth: 'High'
        },
        colors: {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)'
        }
      },
      guardian: { 
        name: 'The Guardian',
        title: 'Stability & Preservation Focused',
        description: 'You prioritize stability and long-term wealth preservation.',
        strengths: ['Risk-aware', 'Patient', 'Disciplined'],
        weaknesses: ['May miss growth opportunities', 'Conservative'],
        traits: ['Cautious', 'Long-term focused', 'Stable'],
        idealStocks: ['JNJ', 'KO', 'PG'],
        emoji: '🛡️',
        risks: ['Inflation erosion', 'Missed growth opportunities', 'Low returns'],
        idealHolding: '10+ years',
        riskTolerance: 'Low',
        preferredSectors: ['Healthcare', 'Consumer Staples', 'Utilities'],
        stockCriteria: {
          marketCap: ['Large Cap'],
          volatility: 'Low',
          dividendYield: 'High',
          peRatio: 'Low',
          growth: 'Stable'
        },
        colors: {
          primary: '#10B981',
          secondary: '#047857',
          gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
        }
      },
      opportunist: { 
        name: 'The Opportunist',
        title: 'Market Timing Specialist',
        description: 'You excel at timing markets and capturing momentum.',
        strengths: ['Market timing', 'Adaptable', 'Quick decisions'],
        weaknesses: ['Emotional trading', 'Short-term focus'],
        traits: ['Adaptable', 'Quick-thinking', 'Trend-focused'],
        idealStocks: ['AAPL', 'GOOGL', 'META'],
        emoji: '⚡',
        risks: ['Market timing errors', 'Emotional decisions', 'Transaction costs'],
        idealHolding: '6 months - 2 years',
        riskTolerance: 'Medium-High',
        preferredSectors: ['Technology', 'Communication', 'Momentum Stocks'],
        stockCriteria: {
          marketCap: ['Large Cap', 'Mid Cap'],
          volatility: 'Medium-High',
          dividendYield: 'Medium',
          peRatio: 'Medium',
          growth: 'High'
        },
        colors: {
          primary: '#F59E0B',
          secondary: '#D97706',
          gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
        }
      },
      contrarian: { 
        name: 'The Contrarian',
        title: 'Value & Independent Thinker',
        description: 'You find value where others see risk.',
        strengths: ['Independent thinking', 'Value-focused', 'Patient'],
        weaknesses: ['May be too early', 'Contrarian timing'],
        traits: ['Independent', 'Value-focused', 'Contrarian'],
        idealStocks: ['XOM', 'INTC', 'GOLD'],
        emoji: '🎭',
        risks: ['Value traps', 'Long wait times', 'Market sentiment'],
        idealHolding: '5-10 years',
        riskTolerance: 'Medium',
        preferredSectors: ['Energy', 'Value Stocks', 'Cyclical Industries'],
        stockCriteria: {
          marketCap: ['Large Cap', 'Mid Cap', 'Small Cap'],
          volatility: 'Medium',
          dividendYield: 'Medium-High',
          peRatio: 'Low',
          growth: 'Value'
        },
        colors: {
          primary: '#8B5CF6',
          secondary: '#7C3AED',
          gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
        }
      }
    };

    const primaryArchetype = {
      id: dominantType.type as 'explorer' | 'guardian' | 'opportunist' | 'contrarian',
      ...archetypeData[dominantType.type as keyof typeof archetypeData]
    };

    // Create simplified analysis result
    const analysis: PersonalityAnalysis = {
      primaryArchetype,
      confidence: Math.round(dominantType.score * 100),
      scores: normalizedScores as any,
      recommendations: primaryArchetype.idealStocks.map((symbol: string) => ({
        symbol,
        company: `${symbol} Company`,
        sector: 'Technology',
        matchScore: 0.8 + Math.random() * 0.2,
        reason: `Perfect match for ${primaryArchetype.name} investment style`,
        riskLevel: 'Medium' as const,
        archetypeMatch: [primaryArchetype.id]
      })),
      personalizedMessage: `You're ${primaryArchetype.name}! ${primaryArchetype.description}`,
      traits: primaryArchetype.traits,
      coachingTips: [`Focus on ${primaryArchetype.strengths[0]}`, `Watch out for ${primaryArchetype.weaknesses[0]}`]
    };
    
    setAnalysisResult(analysis);
    setShowResults(true);

    if (onComplete) {
      onComplete(analysis);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0);
    setResponses([]);
    setSelectedOption("");
    setShowResults(false);
    setAnalysisResult(null);
    setQuizStarted(false);
  };

  const handleStartDemo = () => {
    if (onStartDemo) {
      onStartDemo();
    }
  };

  // Show results if quiz is completed
  if (showResults && analysisResult) {
    return (
      <PersonalityResults
        analysis={analysisResult}
        onRetakeQuiz={handleRetakeQuiz}
        onStartDemo={handleStartDemo}
      />
    );
  }

  if (!quizStarted) {
    return (
      <div className={`${className} flex items-center justify-center min-h-[600px]`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-2xl mx-auto p-8"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="text-6xl mb-6"
          >
            🧬
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Your Investment DNA
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Take our personality quiz to find your investor archetype and get personalized stock recommendations that match your style!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { name: "Explorer", emoji: "🚀", desc: "Innovation lover" },
              { name: "Guardian", emoji: "🛡️", desc: "Steady & safe" },
              { name: "Opportunist", emoji: "⚡", desc: "Trend follower" },
              { name: "Contrarian", emoji: "🎭", desc: "Value hunter" }
            ].map((type, index) => (
              <motion.div
                key={type.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md"
              >
                <div className="text-2xl mb-2">{type.emoji}</div>
                <div className="font-semibold text-gray-900 dark:text-white">{type.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{type.desc}</div>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Personality Quiz ✨
          </motion.button>
          
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Takes 3-5 minutes • 7 questions • Get instant results
          </p>
        </motion.div>
      </div>
    );
  }

  const question = quizQuestions[currentQuestion];

  return (
    <div className={`${className} max-w-4xl mx-auto p-6`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: isAnimating ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isAnimating ? -50 : 50 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-400">
              {question.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {question.question}
              </h2>
              {question.subtitle && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {question.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleOptionSelect(option.value)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedOption === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.text}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
        >
          <span>{isLastQuestion ? 'See My Results' : 'Next'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
