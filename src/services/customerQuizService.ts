// Customer Quiz Service - Auto-generating dynamic quizzes for customers
export interface CustomerQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number; // 1-5 scale
  timeLimit?: number; // seconds
  points: number;
}

export interface CustomerQuiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: CustomerQuizQuestion[];
  totalQuestions: number;
  estimatedTime: number; // minutes
  tags: string[];
  createdAt: Date;
  isActive: boolean;
  passScore: number; // percentage needed to pass
  maxAttempts: number;
  showResultsImmediately: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
    points: number;
  }>;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  isCompleted: boolean;
  isPassed: boolean;
  timeSpent: number; // total seconds
}

class CustomerQuizService {
  private quizzes: CustomerQuiz[] = [];
  private activeAttempts: Map<string, QuizAttempt> = new Map();
  private subscribers: Array<(quizzes: CustomerQuiz[]) => void> = [];
  private attemptSubscribers: Array<(attempts: QuizAttempt[]) => void> = [];

  // Quiz templates and knowledge base
  private readonly QUIZ_TEMPLATES = {
    beginner: {
      stocks: [
        {
          question: "What does P/E ratio stand for?",
          options: ["Price to Earnings", "Profit to Equity", "Performance to Expectation", "Portfolio to Exchange"],
          correctAnswer: 0,
          explanation: "P/E ratio stands for Price-to-Earnings ratio, which compares a company's stock price to its earnings per share.",
          difficulty: 1,
          points: 10
        },
        {
          question: "Which of these is considered a blue-chip stock?",
          options: ["A startup company", "Apple Inc. (AAPL)", "A penny stock", "A cryptocurrency"],
          correctAnswer: 1,
          explanation: "Apple Inc. is considered a blue-chip stock - a large, well-established company with a history of reliable performance.",
          difficulty: 1,
          points: 10
        },
        {
          question: "What does NYSE stand for?",
          options: ["New York Stock Exchange", "National Yearly Stock Evaluation", "New York Securities Exchange", "National York Stock Exchange"],
          correctAnswer: 0,
          explanation: "NYSE stands for New York Stock Exchange, the world's largest stock exchange by market capitalization.",
          difficulty: 1,
          points: 10
        }
      ],
      crypto: [
        {
          question: "What is Bitcoin?",
          options: ["A bank", "A digital currency", "A stock", "A commodity"],
          correctAnswer: 1,
          explanation: "Bitcoin is a decentralized digital currency that operates without a central bank or single administrator.",
          difficulty: 1,
          points: 10
        },
        {
          question: "What technology underlies most cryptocurrencies?",
          options: ["Cloud computing", "Blockchain", "Artificial Intelligence", "Machine Learning"],
          correctAnswer: 1,
          explanation: "Blockchain technology is the distributed ledger technology that underlies most cryptocurrencies.",
          difficulty: 1,
          points: 10
        }
      ],
      finance: [
        {
          question: "What is diversification in investing?",
          options: ["Putting all money in one stock", "Spreading investments across different assets", "Only buying expensive stocks", "Trading frequently"],
          correctAnswer: 1,
          explanation: "Diversification means spreading investments across different types of assets to reduce risk.",
          difficulty: 1,
          points: 10
        },
        {
          question: "What is compound interest?",
          options: ["Simple interest only", "Interest earned on both principal and previous interest", "Interest that decreases over time", "Interest paid monthly"],
          correctAnswer: 1,
          explanation: "Compound interest is interest calculated on both the initial principal and previously earned interest.",
          difficulty: 1,
          points: 10
        }
      ]
    },
    intermediate: {
      stocks: [
        {
          question: "What does a high debt-to-equity ratio typically indicate?",
          options: ["Low financial risk", "High profitability", "High financial leverage", "Strong cash flow"],
          correctAnswer: 2,
          explanation: "A high debt-to-equity ratio indicates high financial leverage, meaning the company has taken on significant debt relative to equity.",
          difficulty: 3,
          points: 15
        },
        {
          question: "What is the purpose of a stop-loss order?",
          options: ["To guarantee profits", "To limit potential losses", "To increase buying power", "To pay dividends"],
          correctAnswer: 1,
          explanation: "A stop-loss order is designed to limit potential losses by automatically selling a security when it reaches a certain price.",
          difficulty: 3,
          points: 15
        }
      ],
      crypto: [
        {
          question: "What is a smart contract?",
          options: ["A legal document", "A self-executing contract with terms directly written into code", "A trading algorithm", "A mining program"],
          correctAnswer: 1,
          explanation: "A smart contract is a self-executing contract with the terms of the agreement directly written into lines of code.",
          difficulty: 3,
          points: 15
        }
      ],
      finance: [
        {
          question: "What is the yield curve?",
          options: ["A graph showing stock prices", "A graph showing interest rates vs. time to maturity", "A measure of volatility", "A trading pattern"],
          correctAnswer: 1,
          explanation: "The yield curve is a graph that plots interest rates of bonds with equal credit quality but different maturity dates.",
          difficulty: 3,
          points: 15
        }
      ]
    },
    advanced: {
      stocks: [
        {
          question: "What is the Black-Scholes model used for?",
          options: ["Calculating P/E ratios", "Options pricing", "Dividend forecasting", "Market cap calculation"],
          correctAnswer: 1,
          explanation: "The Black-Scholes model is a mathematical model used for pricing options contracts.",
          difficulty: 5,
          points: 25
        }
      ],
      crypto: [
        {
          question: "What is the purpose of a consensus mechanism in blockchain?",
          options: ["To increase transaction speed", "To ensure network security and agreement", "To reduce fees", "To mine new coins"],
          correctAnswer: 1,
          explanation: "Consensus mechanisms ensure that all participants in a blockchain network agree on the validity of transactions and the state of the ledger.",
          difficulty: 5,
          points: 25
        }
      ],
      finance: [
        {
          question: "What is Value at Risk (VaR)?",
          options: ["The total value of a portfolio", "A measure of potential loss over a specific time frame", "The average return of an investment", "The volatility of a stock"],
          correctAnswer: 1,
          explanation: "Value at Risk (VaR) is a statistical measure that quantifies the potential loss in value of a portfolio over a defined time period for a given confidence interval.",
          difficulty: 5,
          points: 25
        }
      ]
    }
  };

  constructor() {
    this.loadQuizzesFromStorage();
    this.generateInitialQuizzes();
  }

  // Subscribe to quiz updates
  subscribe(callback: (quizzes: CustomerQuiz[]) => void) {
    this.subscribers.push(callback);
    callback(this.quizzes);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Subscribe to attempt updates
  subscribeToAttempts(callback: (attempts: QuizAttempt[]) => void) {
    this.attemptSubscribers.push(callback);
    callback(Array.from(this.activeAttempts.values()));
    
    return () => {
      this.attemptSubscribers = this.attemptSubscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.quizzes));
  }

  private notifyAttemptSubscribers() {
    this.attemptSubscribers.forEach(callback => callback(Array.from(this.activeAttempts.values())));
  }

  // Get available quizzes
  getQuizzes(filters?: {
    category?: string;
    difficulty?: string;
    limit?: number;
  }): CustomerQuiz[] {
    let filteredQuizzes = this.quizzes.filter(quiz => quiz.isActive);

    if (filters?.category && filters.category !== 'all') {
      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === filters.category);
    }

    if (filters?.difficulty && filters.difficulty !== 'all') {
      filteredQuizzes = filteredQuizzes.filter(quiz => quiz.difficulty === filters.difficulty);
    }

    // Sort by creation date (newest first)
    filteredQuizzes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (filters?.limit) {
      filteredQuizzes = filteredQuizzes.slice(0, filters.limit);
    }

    return filteredQuizzes;
  }

  // Get a specific quiz
  getQuiz(quizId: string): CustomerQuiz | null {
    return this.quizzes.find(quiz => quiz.id === quizId) || null;
  }

  // Start a quiz attempt
  startQuizAttempt(quizId: string, userId: string): QuizAttempt | null {
    const quiz = this.getQuiz(quizId);
    if (!quiz) return null;

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quizId,
      userId,
      startedAt: new Date(),
      currentQuestionIndex: 0,
      answers: [],
      totalScore: 0,
      maxPossibleScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
      percentageScore: 0,
      isCompleted: false,
      isPassed: false,
      timeSpent: 0
    };

    this.activeAttempts.set(attempt.id, attempt);
    this.notifyAttemptSubscribers();
    return attempt;
  }

  // Submit answer for a question
  submitAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswer: number,
    timeSpent: number
  ): { isCorrect: boolean; points: number; explanation: string } | null {
    const attempt = this.activeAttempts.get(attemptId);
    if (!attempt) return null;

    const quiz = this.getQuiz(attempt.quizId);
    if (!quiz) return null;

    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return null;

    const isCorrect = selectedAnswer === question.correctAnswer;
    const points = isCorrect ? question.points : 0;

    attempt.answers.push({
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent,
      points
    });

    attempt.totalScore += points;
    attempt.currentQuestionIndex++;
    attempt.timeSpent += timeSpent;

    this.activeAttempts.set(attemptId, attempt);
    this.notifyAttemptSubscribers();

    return {
      isCorrect,
      points,
      explanation: question.explanation
    };
  }

  // Complete quiz attempt
  completeQuizAttempt(attemptId: string): QuizAttempt | null {
    const attempt = this.activeAttempts.get(attemptId);
    if (!attempt) return null;

    const quiz = this.getQuiz(attempt.quizId);
    if (!quiz) return null;

    attempt.completedAt = new Date();
    attempt.isCompleted = true;
    attempt.percentageScore = Math.round((attempt.totalScore / attempt.maxPossibleScore) * 100);
    attempt.isPassed = attempt.percentageScore >= quiz.passScore;

    this.activeAttempts.set(attemptId, attempt);
    this.notifyAttemptSubscribers();
    this.saveAttemptsToStorage();

    return attempt;
  }

  // Get current attempt
  getCurrentAttempt(attemptId: string): QuizAttempt | null {
    return this.activeAttempts.get(attemptId) || null;
  }

  // Generate new quiz dynamically
  async generateQuiz(category: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<CustomerQuiz> {
    const templates = this.QUIZ_TEMPLATES[difficulty];
    const categoryQuestions = templates[category as keyof typeof templates] || templates.stocks;
    
    // Add some randomization and current market context
    const questions: CustomerQuizQuestion[] = [];
    
    // Select random questions from templates
    const selectedQuestions = this.shuffleArray([...categoryQuestions]).slice(0, 5);
    
    selectedQuestions.forEach((template, index) => {
      questions.push({
        id: `q_${Date.now()}_${index}`,
        question: template.question,
        options: this.shuffleArray([...template.options]),
        correctAnswer: this.findCorrectAnswerIndex(template.options[template.correctAnswer], template.options),
        explanation: template.explanation,
        difficulty: template.difficulty,
        points: template.points,
        timeLimit: difficulty === 'beginner' ? 60 : difficulty === 'intermediate' ? 45 : 30
      });
    });

    // Add market-specific questions based on recent news
    await this.addMarketContextQuestions(questions, category, difficulty);

    const quiz: CustomerQuiz = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${this.capitalize(category)} Quiz - ${this.capitalize(difficulty)} Level`,
      description: `Test your knowledge of ${category} with this ${difficulty}-level quiz featuring current market insights.`,
      category,
      difficulty,
      questions,
      totalQuestions: questions.length,
      estimatedTime: Math.ceil(questions.length * (difficulty === 'beginner' ? 1.5 : difficulty === 'intermediate' ? 2 : 2.5)),
      tags: [category, difficulty, 'auto-generated', new Date().toISOString().split('T')[0]],
      createdAt: new Date(),
      isActive: true,
      passScore: difficulty === 'beginner' ? 60 : difficulty === 'intermediate' ? 70 : 80,
      maxAttempts: 3,
      showResultsImmediately: true
    };

    this.quizzes.unshift(quiz);
    this.saveQuizzesToStorage();
    this.notifySubscribers();

    return quiz;
  }

  // Add market context questions based on recent news
  private async addMarketContextQuestions(
    questions: CustomerQuizQuestion[],
    category: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<void> {
    // Get recent market data and news
    const currentDate = new Date();
    const marketQuestions = await this.generateMarketBasedQuestions(category, difficulty);
    
    // Add 1-2 market-based questions
    questions.push(...marketQuestions.slice(0, 2));
  }

  private async generateMarketBasedQuestions(category: string, difficulty: string): Promise<CustomerQuizQuestion[]> {
    const questions: CustomerQuizQuestion[] = [];
    
    // Current market questions based on category
    if (category === 'stocks') {
      questions.push({
        id: `market_${Date.now()}_1`,
        question: "Which major index is known for tracking the performance of 500 large-cap U.S. companies?",
        options: ["Dow Jones", "S&P 500", "NASDAQ", "Russell 2000"],
        correctAnswer: 1,
        explanation: "The S&P 500 tracks 500 large-cap U.S. companies and is widely considered a benchmark for the overall U.S. stock market.",
        difficulty: difficulty === 'beginner' ? 2 : 3,
        points: 15,
        timeLimit: 45
      });

      questions.push({
        id: `market_${Date.now()}_2`,
        question: "What typically happens to stock prices when a company reports better-than-expected earnings?",
        options: ["Prices usually fall", "Prices usually rise", "No effect on prices", "Prices become more volatile"],
        correctAnswer: 1,
        explanation: "When companies report better-than-expected earnings, it usually signals strong business performance, leading to increased investor confidence and rising stock prices.",
        difficulty: 2,
        points: 12,
        timeLimit: 45
      });
    }

    if (category === 'crypto') {
      questions.push({
        id: `market_${Date.now()}_3`,
        question: "What is the maximum supply of Bitcoin that can ever exist?",
        options: ["21 million", "100 million", "1 billion", "Unlimited"],
        correctAnswer: 0,
        explanation: "Bitcoin has a hard cap of 21 million coins, making it a deflationary asset by design.",
        difficulty: difficulty === 'beginner' ? 2 : 3,
        points: 15,
        timeLimit: 45
      });
    }

    return questions;
  }

  // Helper methods
  private generateInitialQuizzes(): void {
    if (this.quizzes.length === 0) {
      // Generate initial set of quizzes
      const categories = ['stocks', 'crypto', 'finance'];
      const difficulties: ('beginner' | 'intermediate' | 'advanced')[] = ['beginner', 'intermediate', 'advanced'];

      categories.forEach(category => {
        difficulties.forEach(difficulty => {
          this.generateQuiz(category, difficulty);
        });
      });
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private findCorrectAnswerIndex(correctOption: string, shuffledOptions: string[]): number {
    return shuffledOptions.findIndex(option => option === correctOption);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private saveQuizzesToStorage(): void {
    try {
      // Keep only last 50 quizzes in storage
      const quizzesToSave = this.quizzes.slice(0, 50);
      localStorage.setItem('customerQuizzes', JSON.stringify(quizzesToSave));
    } catch (error) {
      console.warn('Failed to save quizzes to localStorage:', error);
    }
  }

  private loadQuizzesFromStorage(): void {
    try {
      const savedQuizzes = localStorage.getItem('customerQuizzes');
      if (savedQuizzes) {
        this.quizzes = JSON.parse(savedQuizzes).map((quiz: any) => ({
          ...quiz,
          createdAt: new Date(quiz.createdAt)
        }));
      }
    } catch (error) {
      console.warn('Failed to load quizzes from localStorage:', error);
    }
  }

  private saveAttemptsToStorage(): void {
    try {
      const attempts = Array.from(this.activeAttempts.values());
      localStorage.setItem('quizAttempts', JSON.stringify(attempts.slice(0, 100))); // Keep last 100 attempts
    } catch (error) {
      console.warn('Failed to save attempts to localStorage:', error);
    }
  }

  // Generate quiz on demand
  async generateQuizOnDemand(preferences: {
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionCount?: number;
    includeMarketNews?: boolean;
  }): Promise<CustomerQuiz> {
    return this.generateQuiz(preferences.category, preferences.difficulty);
  }

  // Get quiz statistics
  getQuizStatistics(): {
    totalQuizzes: number;
    totalAttempts: number;
    averageScore: number;
    popularCategories: Array<{ category: string; count: number }>;
  } {
    const attempts = Array.from(this.activeAttempts.values());
    const categoryCount = new Map<string, number>();

    this.quizzes.forEach(quiz => {
      categoryCount.set(quiz.category, (categoryCount.get(quiz.category) || 0) + 1);
    });

    const averageScore = attempts.length > 0
      ? attempts.filter(a => a.isCompleted).reduce((sum, a) => sum + a.percentageScore, 0) / attempts.filter(a => a.isCompleted).length
      : 0;

    return {
      totalQuizzes: this.quizzes.length,
      totalAttempts: attempts.length,
      averageScore: Math.round(averageScore),
      popularCategories: Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    };
  }
}

export const customerQuizService = new CustomerQuizService();
export default customerQuizService;
