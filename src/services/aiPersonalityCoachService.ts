import { PersonalityAnalysis, StockRecommendation, InvestmentArchetype } from '../types';

export interface CoachingInsight {
  id: string;
  title: string;
  message: string;
  type: 'tip' | 'warning' | 'opportunity' | 'achievement';
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  relatedStocks?: string[];
  marketCondition?: 'bull' | 'bear' | 'sideways';
}

export interface PersonalizedAdvice {
  dailyInsight: CoachingInsight;
  weeklyForecast: CoachingInsight[];
  behavioralTips: CoachingInsight[];
  marketOpportunities: CoachingInsight[];
  riskWarnings: CoachingInsight[];
}

export class AIPersonalityCoach {
  private readonly archetypeCoachingData = {
    explorer: {
      strengths: ['Innovation focus', 'Growth mindset', 'Risk tolerance', 'Future vision'],
      challenges: ['Volatility tolerance', 'Patience with returns', 'Diversification needs'],
      preferredSectors: ['Technology', 'Healthcare', 'Clean Energy', 'Biotech'],
      riskProfile: 'high',
      timeHorizon: 'long-term',
      behavioralBiases: ['Overconfidence', 'FOMO', 'Confirmation bias']
    },
    guardian: {
      strengths: ['Risk management', 'Steady approach', 'Long-term focus', 'Discipline'],
      challenges: ['Missing growth opportunities', 'Inflation risk', 'Over-conservatism'],
      preferredSectors: ['Utilities', 'Consumer Staples', 'Healthcare', 'Real Estate'],
      riskProfile: 'low',
      timeHorizon: 'long-term',
      behavioralBiases: ['Loss aversion', 'Status quo bias', 'Anchoring']
    },
    opportunist: {
      strengths: ['Timing skills', 'Adaptability', 'Trend recognition', 'Quick decisions'],
      challenges: ['Emotional trading', 'Overtrading', 'Short-term focus'],
      preferredSectors: ['Technology', 'Consumer Discretionary', 'Communication', 'Financials'],
      riskProfile: 'medium-high',
      timeHorizon: 'short-to-medium',
      behavioralBiases: ['Recency bias', 'Herding', 'Availability heuristic']
    },
    contrarian: {
      strengths: ['Independent thinking', 'Value focus', 'Patience', 'Research skills'],
      challenges: ['Timing market turns', 'Extended underperformance', 'Isolation'],
      preferredSectors: ['Energy', 'Materials', 'Industrials', 'Value stocks'],
      riskProfile: 'medium',
      timeHorizon: 'medium-to-long',
      behavioralBiases: ['Confirmation bias', 'Overconfidence', 'Hindsight bias']
    }
  };

  private readonly marketInsights = {
    bull: {
      explorer: 'Perfect time to explore emerging technologies and growth stocks. Your risk tolerance is an advantage in this environment.',
      guardian: 'Focus on quality dividend stocks that can grow with the market while providing stability.',
      opportunist: 'Ride the momentum but set stop-losses. Bull markets can create overconfidence.',
      contrarian: 'Be cautious of overvaluation. Look for quality companies that haven\'t joined the party yet.'
    },
    bear: {
      explorer: 'Time to research and accumulate innovative companies at discounted prices. Bear markets create the best opportunities for future growth.',
      guardian: 'Your defensive approach shines now. Focus on dividend aristocrats and defensive sectors.',
      opportunist: 'Perfect environment for your skills, but avoid catching falling knives. Wait for trend confirmation.',
      contrarian: 'Your time to shine! Look for fundamentally strong companies trading at steep discounts.'
    },
    sideways: {
      explorer: 'Use this consolidation phase to research next-generation companies and accumulate positions.',
      guardian: 'Perfect for your steady approach. Focus on income-generating assets and gradual accumulation.',
      opportunist: 'Range-bound markets require patience. Look for breakout opportunities and sector rotation.',
      contrarian: 'Great time to find overlooked value opportunities while the market lacks direction.'
    }
  };

  /**
   * Generate comprehensive personalized advice based on personality analysis
   */
  public generatePersonalizedAdvice(
    analysis: PersonalityAnalysis,
    marketCondition: 'bull' | 'bear' | 'sideways' = 'sideways',
    userPortfolio?: any[]
  ): PersonalizedAdvice {
    const archetype = analysis.primaryArchetype.id;
    const coachingData = this.archetypeCoachingData[archetype];

    return {
      dailyInsight: this.generateDailyInsight(analysis, marketCondition),
      weeklyForecast: this.generateWeeklyForecast(analysis, marketCondition),
      behavioralTips: this.generateBehavioralTips(analysis),
      marketOpportunities: this.generateMarketOpportunities(analysis, marketCondition),
      riskWarnings: this.generateRiskWarnings(analysis, marketCondition)
    };
  }

  /**
   * Generate daily coaching insight
   */
  private generateDailyInsight(
    analysis: PersonalityAnalysis,
    marketCondition: 'bull' | 'bear' | 'sideways'
  ): CoachingInsight {
    const archetype = analysis.primaryArchetype.id;
    const marketMessage = this.marketInsights[marketCondition][archetype];
    
    const insights = {
      explorer: {
        title: '🚀 Innovation Opportunity Alert',
        message: `${marketMessage} Consider researching companies in AI, quantum computing, or renewable energy sectors.`,
        type: 'opportunity' as const,
        priority: 'high' as const,
        relatedStocks: ['NVDA', 'TSLA', 'AMZN', 'GOOGL']
      },
      guardian: {
        title: '🛡️ Steady Wealth Building',
        message: `${marketMessage} Focus on companies with 20+ years of dividend growth and strong balance sheets.`,
        type: 'tip' as const,
        priority: 'medium' as const,
        relatedStocks: ['JNJ', 'PG', 'KO', 'VZ']
      },
      opportunist: {
        title: '⚡ Market Momentum Check',
        message: `${marketMessage} Monitor key technical indicators and sector rotation patterns.`,
        type: 'tip' as const,
        priority: 'high' as const,
        relatedStocks: ['AAPL', 'MSFT', 'QQQ', 'SPY']
      },
      contrarian: {
        title: '🎭 Value Hunting Opportunity',
        message: `${marketMessage} Look for companies with P/E ratios below industry average but strong fundamentals.`,
        type: 'opportunity' as const,
        priority: 'medium' as const,
        relatedStocks: ['INTC', 'XOM', 'BAC', 'CVX']
      }
    };

    const insight = insights[archetype];
    return {
      id: `daily-${Date.now()}`,
      ...insight,
      actionable: true,
      marketCondition
    };
  }

  /**
   * Generate weekly forecast insights
   */
  private generateWeeklyForecast(
    analysis: PersonalityAnalysis,
    marketCondition: 'bull' | 'bear' | 'sideways'
  ): CoachingInsight[] {
    const archetype = analysis.primaryArchetype.id;
    const confidence = analysis.confidence;

    const forecasts = {
      explorer: [
        {
          title: 'Tech Earnings Week Ahead',
          message: 'Major tech companies report this week. Your growth-focused approach should monitor cloud revenue and AI progress.',
          type: 'opportunity' as const,
          priority: 'high' as const
        },
        {
          title: 'Emerging Market Watch',
          message: 'Keep an eye on emerging market ETFs as global growth stories unfold.',
          type: 'tip' as const,
          priority: 'medium' as const
        }
      ],
      guardian: [
        {
          title: 'Dividend Declaration Season',
          message: 'Several dividend aristocrats announce payments this week. Perfect for your income-focused strategy.',
          type: 'opportunity' as const,
          priority: 'medium' as const
        },
        {
          title: 'Interest Rate Impact',
          message: 'Monitor how rate changes affect your bond and utility holdings.',
          type: 'warning' as const,
          priority: 'medium' as const
        }
      ],
      opportunist: [
        {
          title: 'Momentum Shift Signals',
          message: 'Watch for sector rotation patterns as institutional money moves between growth and value.',
          type: 'tip' as const,
          priority: 'high' as const
        },
        {
          title: 'Options Expiry Impact',
          message: 'Major options expiry this Friday could create volatility opportunities.',
          type: 'opportunity' as const,
          priority: 'high' as const
        }
      ],
      contrarian: [
        {
          title: 'Oversold Opportunities',
          message: 'Several quality names have reached oversold levels on technical indicators.',
          type: 'opportunity' as const,
          priority: 'medium' as const
        },
        {
          title: 'Value Catalyst Watch',
          message: 'Earnings reports from traditionally undervalued sectors could provide catalysts.',
          type: 'tip' as const,
          priority: 'medium' as const
        }
      ]
    };

    return forecasts[archetype].map((forecast, index) => ({
      id: `weekly-${index}-${Date.now()}`,
      ...forecast,
      actionable: true,
      marketCondition
    }));
  }

  /**
   * Generate behavioral coaching tips
   */
  private generateBehavioralTips(analysis: PersonalityAnalysis): CoachingInsight[] {
    const archetype = analysis.primaryArchetype.id;
    const coachingData = this.archetypeCoachingData[archetype];

    const behavioralTips = {
      explorer: [
        {
          title: '🧠 Manage Innovation Overconfidence',
          message: 'Your excitement for new technologies is great, but remember to diversify across time horizons and sectors.',
          bias: 'Overconfidence'
        },
        {
          title: '📊 Research Before FOMO',
          message: 'When you hear about the "next big thing," spend 24 hours researching before investing.',
          bias: 'FOMO'
        }
      ],
      guardian: [
        {
          title: '📈 Embrace Calculated Growth',
          message: 'Your conservative nature is wise, but don\'t let it prevent you from taking advantage of solid growth opportunities.',
          bias: 'Loss aversion'
        },
        {
          title: '🔄 Regular Strategy Review',
          message: 'Schedule quarterly reviews to ensure your strategy adapts to changing market conditions.',
          bias: 'Status quo bias'
        }
      ],
      opportunist: [
        {
          title: '😤 Control Emotional Trading',
          message: 'Set specific entry and exit rules before making trades. Stick to your plan even when excitement builds.',
          bias: 'Emotional trading'
        },
        {
          title: '📅 Long-term Perspective',
          message: 'Allocate at least 70% of your portfolio to longer-term positions to balance your short-term focus.',
          bias: 'Short-term focus'
        }
      ],
      contrarian: [
        {
          title: '⏰ Patience with Timing',
          message: 'Your contrarian instincts are valuable, but remember that markets can stay irrational longer than expected.',
          bias: 'Timing market turns'
        },
        {
          title: '👥 Seek Different Perspectives',
          message: 'Regularly engage with investors who have different viewpoints to challenge your assumptions.',
          bias: 'Confirmation bias'
        }
      ]
    };

    return behavioralTips[archetype].map((tip, index) => ({
      id: `behavioral-${index}-${Date.now()}`,
      title: tip.title,
      message: tip.message,
      type: 'tip' as const,
      priority: 'medium' as const,
      actionable: true
    }));
  }

  /**
   * Generate market opportunity insights
   */
  private generateMarketOpportunities(
    analysis: PersonalityAnalysis,
    marketCondition: 'bull' | 'bear' | 'sideways'
  ): CoachingInsight[] {
    const archetype = analysis.primaryArchetype.id;
    const recommendations = analysis.recommendations.slice(0, 3);

    return recommendations.map((stock, index) => ({
      id: `opportunity-${index}-${Date.now()}`,
      title: `💎 ${stock.symbol} Opportunity`,
      message: `${stock.company}: ${stock.reason} Match score: ${(stock.matchScore * 100).toFixed(0)}%`,
      type: 'opportunity' as const,
      priority: stock.matchScore > 0.8 ? 'high' as const : 'medium' as const,
      actionable: true,
      relatedStocks: [stock.symbol],
      marketCondition
    }));
  }

  /**
   * Generate risk warning insights
   */
  private generateRiskWarnings(
    analysis: PersonalityAnalysis,
    marketCondition: 'bull' | 'bear' | 'sideways'
  ): CoachingInsight[] {
    const archetype = analysis.primaryArchetype.id;
    const coachingData = this.archetypeCoachingData[archetype];

    const riskWarnings = {
      explorer: [
        {
          title: '⚠️ Volatility Alert',
          message: 'Growth stocks can be extra volatile in uncertain markets. Consider position sizing carefully.',
          condition: marketCondition === 'bear'
        },
        {
          title: '🎢 Diversification Check',
          message: 'Ensure you\'re not overconcentrated in high-growth sectors during market euphoria.',
          condition: marketCondition === 'bull'
        }
      ],
      guardian: [
        {
          title: '📉 Inflation Risk',
          message: 'Your conservative approach may underperform if inflation accelerates. Consider some inflation hedges.',
          condition: true
        },
        {
          title: '💰 Cash Drag Warning',
          message: 'Holding too much cash during bull markets can significantly impact long-term returns.',
          condition: marketCondition === 'bull'
        }
      ],
      opportunist: [
        {
          title: '🔄 Overtrading Alert',
          message: 'Frequent trading in volatile markets can erode returns through fees and emotional decisions.',
          condition: marketCondition !== 'sideways'
        },
        {
          title: '📊 Risk Management',
          message: 'Set stop-losses on momentum trades to protect against sudden reversals.',
          condition: true
        }
      ],
      contrarian: [
        {
          title: '⏳ Extended Patience Required',
          message: 'Value opportunities may take longer to materialize in momentum-driven markets.',
          condition: marketCondition === 'bull'
        },
        {
          title: '🔍 Quality Focus',
          message: 'In bear markets, distinguish between cheap stocks and value traps.',
          condition: marketCondition === 'bear'
        }
      ]
    };

    return riskWarnings[archetype]
      .filter(warning => warning.condition)
      .map((warning, index) => ({
        id: `warning-${index}-${Date.now()}`,
        title: warning.title,
        message: warning.message,
        type: 'warning' as const,
        priority: 'medium' as const,
        actionable: true,
        marketCondition
      }));
  }

  /**
   * Generate achievement-based coaching
   */
  public generateAchievementCoaching(
    analysis: PersonalityAnalysis,
    portfolioPerformance?: number,
    tradingHistory?: any[]
  ): CoachingInsight[] {
    const achievements: CoachingInsight[] = [];

    // High confidence match achievement
    if (analysis.confidence > 80) {
      achievements.push({
        id: `achievement-confidence-${Date.now()}`,
        title: '🎯 Strong Personality Match',
        message: `Excellent! Your ${analysis.confidence}% confidence score shows you have a clear investment identity. Use this clarity to make more confident decisions.`,
        type: 'achievement',
        priority: 'high',
        actionable: false
      });
    }

    // Portfolio performance coaching
    if (portfolioPerformance !== undefined) {
      if (portfolioPerformance > 15) {
        achievements.push({
          id: `achievement-performance-${Date.now()}`,
          title: '📈 Stellar Performance',
          message: `Your ${portfolioPerformance.toFixed(1)}% return showcases your ${analysis.primaryArchetype.name} approach working well!`,
          type: 'achievement',
          priority: 'high',
          actionable: false
        });
      } else if (portfolioPerformance < -10) {
        achievements.push({
          id: `coaching-recovery-${Date.now()}`,
          title: '💪 Recovery Strategy',
          message: `Down ${Math.abs(portfolioPerformance).toFixed(1)}%? Your ${analysis.primaryArchetype.name} strengths can help you recover. Focus on your core strategy.`,
          type: 'tip',
          priority: 'high',
          actionable: true
        });
      }
    }

    return achievements;
  }
}

// Export singleton instance
export const personalityCoach = new AIPersonalityCoach();
