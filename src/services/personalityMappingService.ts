// Investment personality archetypes and mapping service
import { InvestmentArchetype } from '../types';

export interface StockRecommendation {
  ticker: string;
  companyName: string;
  sector: string;
  reasoning: string;
  matchScore: number;
  risk: 'Low' | 'Medium' | 'High';
  timeframe: string;
  keyMetrics: {
    price?: number;
    changePercent?: number;
    marketCap?: string;
    peRatio?: number;
    dividendYield?: number;
    beta?: number;
  };
}

export interface PersonalityResult {
  archetype: InvestmentArchetype;
  scores: {
    explorer: number;
    guardian: number;
    opportunist: number;
    contrarian: number;
  };
  confidence: number;
  secondaryType?: string;
  recommendations: StockRecommendation[];
  personalizedMessage: string;
}

export interface StockRecommendation {
  ticker: string;
  companyName: string;
  sector: string;
  reasoning: string;
  matchScore: number;
  risk: 'Low' | 'Medium' | 'High';
  timeframe: string;
  keyMetrics: {
    price?: number;
    changePercent?: number;
    marketCap?: string;
    peRatio?: number;
    dividendYield?: number;
    beta?: number;
  };
}

// Define the four investment archetypes
export const investmentArchetypes: Record<string, InvestmentArchetype> = {
  explorer: {
    id: 'explorer',
    name: 'The Explorer',
    emoji: '🚀',
    title: 'Innovation Pioneer',
    description: 'You thrive on discovering the next big thing and aren\'t afraid to venture into uncharted territory. You believe innovation changes everything and want to be part of revolutionary companies.',
    traits: [
      'Early adopter of new technologies',
      'High risk tolerance for high rewards',
      'Believes in disruptive innovation',
      'Focused on growth over income',
      'Willing to hold through volatility'
    ],
    strengths: [
      'Excellent at spotting trends early',
      'Comfortable with uncertainty',
      'Strong conviction in breakthrough companies',
      'Not swayed by short-term noise'
    ],
    risks: [
      'May overconcentrate in risky stocks',
      'Can be overly optimistic about timelines',
      'Might ignore fundamental analysis',
      'Susceptible to hype cycles'
    ],
    idealHolding: '1-5 years',
    riskTolerance: 'Very High',
    preferredSectors: ['Technology', 'Biotechnology', 'Clean Energy', 'Space', 'AI/ML', 'Electric Vehicles'],
    stockCriteria: {
      marketCap: ['Small Cap', 'Mid Cap', 'Large Cap'],
      volatility: 'High',
      dividendYield: 'Low/None',
      peRatio: 'High Growth Multiple',
      growth: 'Very High'
    },
    colors: {
      primary: 'text-purple-600',
      secondary: 'text-purple-400',
      gradient: 'from-purple-600 to-pink-600'
    }
  },
  guardian: {
    id: 'guardian',
    name: 'The Guardian',
    emoji: '🛡️',
    title: 'Wealth Protector',
    description: 'You prioritize capital preservation and steady growth. You prefer established companies with proven track records and believe slow and steady wins the race.',
    traits: [
      'Values stability over growth',
      'Prefers dividend-paying stocks',
      'Focus on capital preservation',
      'Long-term wealth building mindset',
      'Risk-averse approach'
    ],
    strengths: [
      'Excellent at avoiding major losses',
      'Patient and disciplined',
      'Strong focus on fundamentals',
      'Good at dollar-cost averaging'
    ],
    risks: [
      'May miss high-growth opportunities',
      'Could be too conservative',
      'Inflation risk with low returns',
      'May exit winners too early'
    ],
    idealHolding: '5+ years',
    riskTolerance: 'Low',
    preferredSectors: ['Utilities', 'Consumer Staples', 'Healthcare', 'Financials', 'REITs'],
    stockCriteria: {
      marketCap: ['Large Cap', 'Mega Cap'],
      volatility: 'Low',
      dividendYield: 'High',
      peRatio: 'Reasonable',
      growth: 'Steady'
    },
    colors: {
      primary: 'text-green-600',
      secondary: 'text-green-400',
      gradient: 'from-green-600 to-emerald-600'
    }
  },
  opportunist: {
    id: 'opportunist',
    name: 'The Opportunist',
    emoji: '⚡',
    title: 'Momentum Rider',
    description: 'You excel at identifying and riding market trends. You believe in striking while the iron is hot and are quick to capitalize on momentum shifts.',
    traits: [
      'Momentum-focused investing',
      'Quick to act on trends',
      'Follows market sentiment',
      'Active trading approach',
      'Adapts to market conditions'
    ],
    strengths: [
      'Great at timing market movements',
      'Quick to capitalize on opportunities',
      'Strong pattern recognition',
      'Flexible and adaptable'
    ],
    risks: [
      'May chase performance',
      'Higher transaction costs',
      'Emotional decision making',
      'Could miss long-term value'
    ],
    idealHolding: '3 months - 2 years',
    riskTolerance: 'High',
    preferredSectors: ['Technology', 'Consumer Discretionary', 'Communication', 'Hot Sectors'],
    stockCriteria: {
      marketCap: ['Mid Cap', 'Large Cap'],
      volatility: 'Medium-High',
      dividendYield: 'Variable',
      peRatio: 'Growth Multiple',
      growth: 'High Momentum'
    },
    colors: {
      primary: 'text-orange-600',
      secondary: 'text-orange-400',
      gradient: 'from-orange-600 to-red-600'
    }
  },
  contrarian: {
    id: 'contrarian',
    name: 'The Contrarian',
    emoji: '🎭',
    title: 'Value Hunter',
    description: 'You buy when others are selling and find opportunity in pessimism. You believe the market overreacts and seek undervalued gems others overlook.',
    traits: [
      'Value-oriented investing',
      'Buys during market fear',
      'Independent thinking',
      'Fundamental analysis focus',
      'Contrarian market approach'
    ],
    strengths: [
      'Excellent at finding undervalued stocks',
      'Patient with turnaround stories',
      'Strong analytical skills',
      'Emotional discipline'
    ],
    risks: [
      'May catch falling knives',
      'Could be too early on timing',
      'Value traps potential',
      'May miss growth stocks'
    ],
    idealHolding: '2-7 years',
    riskTolerance: 'Medium',
    preferredSectors: ['Energy', 'Materials', 'Industrials', 'Financials', 'Cyclicals'],
    stockCriteria: {
      marketCap: ['All Sizes'],
      volatility: 'Medium',
      dividendYield: 'Medium-High',
      peRatio: 'Low/Undervalued',
      growth: 'Recovery/Turnaround'
    },
    colors: {
      primary: 'text-blue-600',
      secondary: 'text-blue-400',
      gradient: 'from-blue-600 to-indigo-600'
    }
  }
};

// Stock database organized by archetype
export const stockRecommendations: Record<string, StockRecommendation[]> = {
  explorer: [
    {
      ticker: 'TSLA',
      companyName: 'Tesla Inc.',
      sector: 'Electric Vehicles',
      reasoning: 'Revolutionary EV and energy company pushing boundaries in multiple industries',
      matchScore: 95,
      risk: 'High',
      timeframe: '2-5 years',
      keyMetrics: { price: 248.92, changePercent: -2.10, marketCap: '792B', peRatio: 65.2 }
    },
    {
      ticker: 'NVDA',
      companyName: 'NVIDIA Corporation',
      sector: 'AI/Semiconductors',
      reasoning: 'Leading the AI revolution with cutting-edge GPU technology',
      matchScore: 92,
      risk: 'High',
      timeframe: '1-3 years',
      keyMetrics: { price: 125.61, changePercent: 1.24, marketCap: '3.1T', peRatio: 73.8 }
    },
    {
      ticker: 'PLTR',
      companyName: 'Palantir Technologies',
      sector: 'Data Analytics',
      reasoning: 'Next-gen data analytics platform powering government and enterprise',
      matchScore: 88,
      risk: 'High',
      timeframe: '3-5 years',
      keyMetrics: { price: 38.45, changePercent: 5.67, marketCap: '83B', peRatio: 185.2 }
    }
  ],
  guardian: [
    {
      ticker: 'JNJ',
      companyName: 'Johnson & Johnson',
      sector: 'Healthcare',
      reasoning: 'Stable healthcare giant with consistent dividends and defensive characteristics',
      matchScore: 94,
      risk: 'Low',
      timeframe: '5+ years',
      keyMetrics: { price: 156.23, changePercent: 0.45, marketCap: '412B', peRatio: 15.8, dividendYield: 3.2 }
    },
    {
      ticker: 'KO',
      companyName: 'The Coca-Cola Company',
      sector: 'Consumer Staples',
      reasoning: 'Iconic brand with global presence and reliable dividend growth',
      matchScore: 91,
      risk: 'Low',
      timeframe: '10+ years',
      keyMetrics: { price: 62.84, changePercent: -0.23, marketCap: '271B', peRatio: 24.1, dividendYield: 3.1 }
    },
    {
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      sector: 'Technology',
      reasoning: 'Stable tech giant with recurring revenue and growing dividend',
      matchScore: 89,
      risk: 'Low',
      timeframe: '5+ years',
      keyMetrics: { price: 378.85, changePercent: 2.22, marketCap: '2.8T', peRatio: 28.5, dividendYield: 0.8 }
    }
  ],
  opportunist: [
    {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      sector: 'Technology',
      reasoning: 'Momentum leader with strong brand loyalty and innovation pipeline',
      matchScore: 93,
      risk: 'Medium',
      timeframe: '6 months - 2 years',
      keyMetrics: { price: 185.43, changePercent: 3.16, marketCap: '2.9T', peRatio: 30.2 }
    },
    {
      ticker: 'GOOGL',
      companyName: 'Alphabet Inc.',
      sector: 'Technology',
      reasoning: 'AI and search dominance with strong momentum in cloud services',
      matchScore: 90,
      risk: 'Medium',
      timeframe: '1-2 years',
      keyMetrics: { price: 162.87, changePercent: 1.89, marketCap: '2.0T', peRatio: 22.8 }
    },
    {
      ticker: 'META',
      companyName: 'Meta Platforms',
      sector: 'Social Media',
      reasoning: 'Metaverse and AI investments driving new growth momentum',
      matchScore: 87,
      risk: 'Medium',
      timeframe: '1-3 years',
      keyMetrics: { price: 498.23, changePercent: 4.12, marketCap: '1.3T', peRatio: 24.6 }
    }
  ],
  contrarian: [
    {
      ticker: 'XOM',
      companyName: 'Exxon Mobil Corporation',
      sector: 'Energy',
      reasoning: 'Undervalued energy giant benefiting from higher oil prices and efficiency gains',
      matchScore: 92,
      risk: 'Medium',
      timeframe: '2-5 years',
      keyMetrics: { price: 114.67, changePercent: -1.23, marketCap: '481B', peRatio: 13.1, dividendYield: 5.8 }
    },
    {
      ticker: 'INTC',
      companyName: 'Intel Corporation',
      sector: 'Semiconductors',
      reasoning: 'Beaten-down chip giant with turnaround potential and government support',
      matchScore: 88,
      risk: 'Medium',
      timeframe: '3-5 years',
      keyMetrics: { price: 22.45, changePercent: -0.89, marketCap: '96B', peRatio: 25.1, dividendYield: 2.1 }
    },
    {
      ticker: 'GOLD',
      companyName: 'Barrick Gold Corporation',
      sector: 'Precious Metals',
      reasoning: 'Unloved gold miner with strong fundamentals and inflation hedge potential',
      matchScore: 85,
      risk: 'Medium',
      timeframe: '2-4 years',
      keyMetrics: { price: 18.92, changePercent: 2.34, marketCap: '33B', peRatio: 16.8, dividendYield: 2.3 }
    }
  ]
};

class PersonalityMappingService {
  /**
   * Get archetype by ID
   */
  getArchetypeById(archetypeId: string): InvestmentArchetype | undefined {
    return investmentArchetypes[archetypeId];
  }

  /**
   * Analyze quiz responses and determine personality archetype
   */
  analyzePersonality(responses: any[]): PersonalityResult {
    // Calculate total scores for each archetype
    const totalScores = responses.reduce((acc, response) => {
      acc.explorer += response.points.explorer;
      acc.guardian += response.points.guardian;
      acc.opportunist += response.points.opportunist;
      acc.contrarian += response.points.contrarian;
      return acc;
    }, { explorer: 0, guardian: 0, opportunist: 0, contrarian: 0 });

    // Find dominant archetype
    const scoreValues = Object.values(totalScores) as number[];
    const maxScore = Math.max(...scoreValues);
    const dominantType = Object.entries(totalScores).find(([_, score]) => score === maxScore)?.[0] || 'guardian';
    
    // Find secondary type (highest score after dominant)
    const secondaryScores = { ...totalScores };
    delete (secondaryScores as any)[dominantType];
    const secondaryScoreValues = Object.values(secondaryScores) as number[];
    const secondaryScore = Math.max(...secondaryScoreValues);
    const secondaryType = Object.entries(secondaryScores).find(([_, score]) => score === secondaryScore)?.[0];

    // Calculate confidence (how much stronger is the dominant type)
    const totalPoints = scoreValues.reduce((sum: number, score: number) => sum + score, 0);
    const confidence = Math.round((maxScore / totalPoints) * 100);

    const archetype = investmentArchetypes[dominantType];
    const recommendations = this.getStockRecommendations(dominantType, totalScores);
    const personalizedMessage = this.generatePersonalizedMessage(archetype, confidence, secondaryType);

    return {
      archetype,
      scores: totalScores,
      confidence,
      secondaryType,
      recommendations,
      personalizedMessage
    };
  }

  /**
   * Get personalized stock recommendations based on archetype
   */
  private getStockRecommendations(archetype: string, scores: any): StockRecommendation[] {
    const baseRecommendations = stockRecommendations[archetype] || stockRecommendations.guardian;
    
    // Add some variety by including stocks from secondary archetype if scores are close
    const sortedTypes = Object.entries(scores).sort(([,a], [,b]) => (b as number) - (a as number));
    const secondaryType = sortedTypes[1]?.[0];
    const secondaryStrength = sortedTypes[1]?.[1] as number || 0;
    const primaryStrength = sortedTypes[0]?.[1] as number || 1;
    
    let recommendations = [...baseRecommendations];
    
    // If secondary type is strong (within 20% of primary), add one stock from that archetype
    if (secondaryStrength / primaryStrength > 0.8 && secondaryType && secondaryType !== archetype) {
      const secondaryStocks = stockRecommendations[secondaryType] || [];
      if (secondaryStocks.length > 0) {
        recommendations.push({
          ...secondaryStocks[0],
          reasoning: `[Secondary match] ${secondaryStocks[0].reasoning}`,
          matchScore: Math.round(secondaryStocks[0].matchScore * 0.85)
        });
      }
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  /**
   * Generate personalized message based on archetype and analysis
   */
  private generatePersonalizedMessage(archetype: InvestmentArchetype, confidence: number, secondaryType?: string): string {
    const messages: Record<string, string[]> = {
      explorer: [
        `🚀 You're a true innovation seeker! With ${confidence}% confidence, you're The Explorer who thrives on breakthrough companies and cutting-edge technology.`,
        `Your adventurous spirit in investing means you're not afraid to bet on the future. Companies like Tesla and NVIDIA align perfectly with your forward-thinking approach.`,
        `Remember: Explorers change the world, but the journey can be volatile. Diversify your revolutionary bets and stay patient with your convictions.`
      ],
      guardian: [
        `🛡️ You're The Guardian with ${confidence}% confidence! Your focus on stability and capital preservation shows wisdom in wealth building.`,
        `Your patient, long-term approach is perfect for dividend aristocrats and blue-chip companies that have weathered many storms.`,
        `Keep protecting and growing your wealth steadily. Companies like Johnson & Johnson and Coca-Cola match your defensive strategy perfectly.`
      ],
      opportunist: [
        `⚡ You're The Opportunist with ${confidence}% confidence! Your ability to spot and ride momentum makes you a formidable market participant.`,
        `Your quick-thinking nature and trend-spotting skills are perfect for capitalizing on market movements and popular growth stocks.`,
        `Strike while the iron is hot, but remember to take profits and manage risk. Your timing skills with companies like Apple can be very rewarding.`
      ],
      contrarian: [
        `🎭 You're The Contrarian with ${confidence}% confidence! Your independent thinking and value-hunting approach sets you apart from the crowd.`,
        `You have the rare ability to see opportunity where others see risk. This makes you excellent at buying quality companies at discounted prices.`,
        `Trust your analysis and be patient with your undervalued picks. Companies like Intel and Exxon may reward your contrarian patience.`
      ]
    };

    const baseMessage = messages[archetype.id] || messages.guardian;
    let personalizedMessage = baseMessage.join(' ');

    // Add secondary type influence if significant
    if (secondaryType && confidence < 60) {
      const secondaryArchetype = investmentArchetypes[secondaryType];
      personalizedMessage += ` You also show strong ${secondaryArchetype.name} tendencies, which gives you a well-rounded investment perspective.`;
    }

    return personalizedMessage;
  }

  /**
   * Get archetype by ID
   */
  getArchetype(id: string): InvestmentArchetype | null {
    return investmentArchetypes[id] || null;
  }

  /**
   * Get all archetypes
   */
  getAllArchetypes(): InvestmentArchetype[] {
    return Object.values(investmentArchetypes);
  }

  /**
   * Update stock recommendations with real-time data
   */
  async updateStockData(recommendations: StockRecommendation[]): Promise<StockRecommendation[]> {
    // This would integrate with real stock APIs in production
    // For now, return recommendations with simulated updates
    return recommendations.map(rec => ({
      ...rec,
      keyMetrics: {
        ...rec.keyMetrics,
        // Add some random variation to simulate real-time updates
        price: rec.keyMetrics.price ? rec.keyMetrics.price * (0.98 + Math.random() * 0.04) : undefined,
        changePercent: rec.keyMetrics.changePercent ? (Math.random() - 0.5) * 10 : undefined
      }
    }));
  }
}

// Export singleton instance
export const personalityMappingService = new PersonalityMappingService();
export default PersonalityMappingService;
