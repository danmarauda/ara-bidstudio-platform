"""
Test Conversations for Token Efficiency Benchmark

5 realistic multi-session coding conversations covering:
1. Authentication implementation
2. Bug debugging session
3. Feature refactoring
4. Performance optimization
5. API integration

Each conversation simulates real developer-AI interactions
spanning multiple sessions with context retention needs.
"""

from typing import List, Dict, Any


class TestConversation:
    """Test conversation data structure"""

    def __init__(
        self,
        id: str,
        topic: str,
        sessions: int,
        total_turns: int,
        conversations: List[Dict[str, Any]],
        test_questions: List[Dict[str, str]],
    ):
        self.id = id
        self.topic = topic
        self.sessions = sessions
        self.total_turns = total_turns
        self.conversations = conversations
        self.test_questions = test_questions


# Conversation 1: Authentication Implementation
auth_conversations = [
    # Session 1: Planning (Turns 1-20)
    {
        "session": 1,
        "turn": 1,
        "user": "I need to add user authentication to our Node.js Express app. We have about 50k users.",
        "assistant": """Let's implement authentication with JWT tokens. Here's what I recommend:

1. **Auth Strategy**: JWT (JSON Web Tokens) with bcrypt for password hashing
2. **Storage**: Store hashed passwords in PostgreSQL
3. **Token Management**: Access tokens (15 min) + Refresh tokens (7 days)
4. **Security**: Rate limiting, HTTPS only, secure cookie storage

Would you like to start with the user model and database schema?""",
    },
    {
        "session": 1,
        "turn": 2,
        "user": "Yes, let's start with the database schema.",
        "assistant": """Here's the user schema for PostgreSQL:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

This schema supports:
- Email-based authentication
- Refresh token rotation
- Token revocation
- Email verification flow""",
    },
    {
        "session": 1,
        "turn": 3,
        "user": "Good. Now let's implement the registration endpoint.",
        "assistant": """Here's the registration endpoint with validation:

```javascript
// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();
const SALT_ROUNDS = 12;

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const result = await db.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
      );

      const user = result.rows[0];

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
```

Key features:
- Email validation and normalization
- Strong password requirements (8+ chars, upper, lower, digit)
- Bcrypt with 12 salt rounds
- Duplicate email check
- Proper error handling""",
    },
    # Session 2: Implementation continues (Turns 21-40)
    {
        "session": 2,
        "turn": 21,
        "user": "Now let's implement the login endpoint with JWT generation.",
        "assistant": """Here's the login endpoint with JWT token generation:

```javascript
// routes/auth.js (continued)
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query(
      'SELECT id, email, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

    // Store refresh token
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \\'7 days\\')',
      [user.id, refreshTokenHash]
    );

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Security features implemented:
- Constant-time password comparison
- Refresh token stored as hash (not plaintext)
- HTTP-only cookies for refresh tokens
- Secure flag in production
- SameSite cookie protection
- Last login tracking""",
    },
    # Session 3: Bug Fixes (Turns 41-60)
    {
        "session": 3,
        "turn": 41,
        "user": "Users are reporting that their tokens expire too quickly. Can we implement token refresh?",
        "assistant": """I'll add a token refresh endpoint that uses the refresh token to issue new access tokens:

```javascript
// routes/auth.js (continued)

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Find all non-revoked refresh tokens for verification
    const tokensResult = await db.query(
      `SELECT id, user_id, token_hash, expires_at
       FROM refresh_tokens
       WHERE revoked_at IS NULL AND expires_at > NOW()`
    );

    let validToken = null;
    let tokenRecord = null;

    // Check refresh token against stored hashes
    for (const record of tokensResult.rows) {
      const isValid = await bcrypt.compare(refreshToken, record.token_hash);
      if (isValid) {
        validToken = refreshToken;
        tokenRecord = record;
        break;
      }
    }

    if (!validToken) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user details
    const userResult = await db.query(
      'SELECT id, email, is_active FROM users WHERE id = $1',
      [tokenRecord.user_id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Token rotation: Generate new refresh token
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);

    // Revoke old refresh token and create new one (atomic)
    await db.query('BEGIN');
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [tokenRecord.id]);
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL \\'7 days\\')',
      [user.id, newRefreshTokenHash]
    );
    await db.query('COMMIT');

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

This implements:
- Refresh token rotation (new token on each refresh)
- Automatic revocation of old tokens
- Atomic database operations
- Token reuse detection""",
    },
]

# Conversation 2: Bug Debugging
bug_conversations = [
    {
        "session": 1,
        "turn": 1,
        "user": "Our React app is showing 'Cannot read property 'map' of undefined' error on the dashboard. Help me debug this.",
        "assistant": """Let's debug this systematically. The error indicates you're trying to call `.map()` on an undefined value. Let me help you trace it:

1. **Check your component state initialization**
2. **Verify API data loading**
3. **Add null checks before mapping**

Can you share the component code where the error occurs?""",
    },
    {
        "session": 1,
        "turn": 2,
        "user": """Here's the component:

```jsx
function Dashboard() {
  const [data, setData] = useState();

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  return (
    <div>
      {data.items.map(item => <Card key={item.id} data={item} />)}
    </div>
  );
}
```""",
        "assistant": """Found the issue! The problem is in your state initialization and data access. Here's what's wrong:

1. **State is undefined initially**: `useState()` with no argument
2. **No loading state**: Component renders before data arrives
3. **No null check**: Accessing `data.items` when `data` is undefined

Here's the fixed version:

```jsx
function Dashboard() {
  const [data, setData] = useState(null); // Initialize to null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData()
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Add null check and default to empty array
  const items = data?.items || [];

  return (
    <div>
      {items.length > 0 ? (
        items.map(item => <Card key={item.id} data={item} />)
      ) : (
        <div>No items to display</div>
      )}
    </div>
  );
}
```

Key fixes:
- Initialize state to `null` (not undefined)
- Add loading and error states
- Use optional chaining (`data?.items`)
- Provide fallback for empty arrays
- Show loading/error states properly""",
    },
]

# Conversation 3: Feature Refactoring
refactor_conversations = [
    {
        "session": 1,
        "turn": 1,
        "user": "We need to refactor our payment processing code. It's become a 500-line god function. Can you help break it down?",
        "assistant": """Absolutely! Let's refactor the payment processing into smaller, testable functions following Single Responsibility Principle.

First, can you share the current monolithic function? Then we'll:
1. Identify distinct responsibilities
2. Extract separate functions
3. Create a clear processing pipeline
4. Add proper error handling
5. Make it testable""",
    },
    {
        "session": 1,
        "turn": 2,
        "user": "Here's a simplified version of our current code. It handles validation, processing, and notifications all in one function.",
        "assistant": """I'll refactor this into a clean, modular architecture:

```javascript
// Before: One massive function
async function processPayment(paymentData) {
  // 500 lines of validation, processing, notifications...
}

// After: Modular architecture

// 1. Validation module
class PaymentValidator {
  validate(paymentData) {
    this.validateAmount(paymentData.amount);
    this.validatePaymentMethod(paymentData.method);
    this.validateCustomer(paymentData.customer);
    return { valid: true };
  }

  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (amount > 10000) {
      throw new Error('Amount exceeds limit');
    }
  }

  validatePaymentMethod(method) {
    const validMethods = ['card', 'paypal', 'bank_transfer'];
    if (!validMethods.includes(method)) {
      throw new Error('Invalid payment method');
    }
  }

  validateCustomer(customer) {
    if (!customer || !customer.id || !customer.email) {
      throw new Error('Invalid customer data');
    }
  }
}

// 2. Payment processor
class PaymentProcessor {
  constructor(gateway) {
    this.gateway = gateway;
  }

  async process(paymentData) {
    try {
      const result = await this.gateway.charge({
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        source: paymentData.paymentMethodId,
        customer: paymentData.customer.id,
      });

      return {
        success: true,
        transactionId: result.id,
        amount: result.amount,
        status: result.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// 3. Notification service
class PaymentNotificationService {
  async notifySuccess(payment, customer) {
    await Promise.all([
      this.sendEmailReceipt(customer.email, payment),
      this.sendWebhook(payment),
      this.updateAnalytics(payment),
    ]);
  }

  async notifyFailure(payment, customer, error) {
    await Promise.all([
      this.sendFailureEmail(customer.email, error),
      this.logFailure(payment, error),
    ]);
  }
}

// 4. Main orchestrator (clean and readable)
class PaymentService {
  constructor() {
    this.validator = new PaymentValidator();
    this.processor = new PaymentProcessor(stripeGateway);
    this.notifier = new PaymentNotificationService();
  }

  async processPayment(paymentData) {
    try {
      // Step 1: Validate
      this.validator.validate(paymentData);

      // Step 2: Process
      const result = await this.processor.process(paymentData);

      // Step 3: Notify
      if (result.success) {
        await this.notifier.notifySuccess(result, paymentData.customer);
      } else {
        await this.notifier.notifyFailure(paymentData, paymentData.customer, result.error);
      }

      return result;
    } catch (error) {
      await this.notifier.notifyFailure(paymentData, paymentData.customer, error);
      throw error;
    }
  }
}
```

Benefits:
- Each class has single responsibility
- Easy to test individual components
- Easy to swap payment gateways
- Clear flow in main orchestrator
- Reusable validation logic""",
    },
]

# Conversation 4: Performance Optimization
performance_conversations = [
    {
        "session": 1,
        "turn": 1,
        "user": "Our API is slow. The /users endpoint takes 3 seconds to return 1000 users. How can we optimize it?",
        "assistant": """3 seconds for 1000 users is definitely too slow. Let's optimize this systematically:

1. **Database query optimization** (likely the main issue)
2. **Add pagination** (don't return all 1000 users at once)
3. **Implement caching**
4. **Optimize JSON serialization**
5. **Add database indexes**

Can you share:
- The current endpoint code?
- The database query?
- User model structure?""",
    },
    {
        "session": 1,
        "turn": 2,
        "user": """Here's the current code:

```javascript
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  const enrichedUsers = await Promise.all(
    users.rows.map(async user => ({
      ...user,
      profile: await getProfile(user.id),
      posts: await getPosts(user.id),
    }))
  );
  res.json(enrichedUsers);
});
```""",
        "assistant": """I found multiple performance issues! This is a classic N+1 query problem. Here's the optimized version:

```javascript
// BEFORE: ~3000ms (1 + 1000 + 1000 queries)
// AFTER: ~150ms (3 queries total)

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

app.get('/users', async (req, res) => {
  try {
    // 1. Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // 2. Check cache
    const cacheKey = `users:page:${page}:limit:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 3. Optimized query with JOIN (no N+1)
    const result = await db.query(`
      SELECT
        u.id, u.email, u.name, u.created_at,
        json_build_object(
          'bio', p.bio,
          'avatar', p.avatar_url,
          'location', p.location
        ) as profile,
        (
          SELECT json_agg(json_build_object(
            'id', posts.id,
            'title', posts.title,
            'created_at', posts.created_at
          ))
          FROM posts
          WHERE posts.user_id = u.id
          ORDER BY posts.created_at DESC
          LIMIT 5
        ) as recent_posts
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.is_active = true
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // 4. Get total count for pagination
    const countResult = await db.query(
      'SELECT COUNT(*) FROM users WHERE is_active = true'
    );

    const response = {
      users: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    };

    // 5. Cache the result
    cache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add indexes for performance
// Run this in your database:
/*
CREATE INDEX idx_users_active_created ON users(is_active, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_profiles_user ON profiles(user_id);
*/
```

Optimizations implemented:
1. **Pagination**: Only return 20 users per page (not 1000)
2. **Single query**: Use JOINs instead of N+1 queries
3. **JSON aggregation**: Build nested JSON in database
4. **Caching**: Cache results for 5 minutes
5. **Indexes**: Added appropriate database indexes
6. **Limit posts**: Only 5 recent posts per user

Performance improvement:
- Before: 3000ms for 1000 users (3000 queries)
- After: 150ms for 20 users (2 queries)
- **95% reduction in response time**""",
    },
]

# Conversation 5: API Integration
api_conversations = [
    {
        "session": 1,
        "turn": 1,
        "user": "I need to integrate Stripe payment processing into our app. Never done this before. Where do I start?",
        "assistant": """I'll guide you through Stripe integration step by step. Here's the plan:

1. **Setup Stripe account** and get API keys
2. **Install Stripe SDK**
3. **Create payment intent** (server-side)
4. **Collect payment** (client-side)
5. **Handle webhooks** (for async events)
6. **Test with test mode**

Let's start:

```bash
# 1. Install Stripe
npm install stripe

# 2. Set up environment variables
echo "STRIPE_SECRET_KEY=sk_test_..." >> .env
echo "STRIPE_PUBLISHABLE_KEY=pk_test_..." >> .env
```

Ready to implement the server-side payment intent creation?""",
    },
    {
        "session": 1,
        "turn": 2,
        "user": "Yes, let's implement the server-side payment endpoint.",
        "assistant": """Here's the complete server-side Stripe integration:

```javascript
// server.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

// 1. Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least $0.50' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      metadata: {
        userId: req.user?.id, // Assuming you have auth middleware
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Webhook handler for payment events
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        await handleRefund(refund);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Helper functions
async function handlePaymentSuccess(paymentIntent) {
  const userId = paymentIntent.metadata.userId;

  // Update order status
  await db.query(
    'UPDATE orders SET status = $1, stripe_payment_id = $2 WHERE id = $3',
    ['paid', paymentIntent.id, paymentIntent.metadata.orderId]
  );

  // Send confirmation email
  await sendPaymentConfirmationEmail(userId, paymentIntent);

  console.log(`Payment succeeded: ${paymentIntent.id}`);
}

async function handlePaymentFailure(paymentIntent) {
  const userId = paymentIntent.metadata.userId;

  // Log failure
  await db.query(
    'INSERT INTO payment_failures (user_id, stripe_payment_id, error) VALUES ($1, $2, $3)',
    [userId, paymentIntent.id, paymentIntent.last_payment_error?.message]
  );

  // Notify user
  await sendPaymentFailureEmail(userId, paymentIntent);

  console.error(`Payment failed: ${paymentIntent.id}`);
}

async function handleRefund(charge) {
  await db.query(
    'UPDATE orders SET status = $1 WHERE stripe_payment_id = $2',
    ['refunded', charge.payment_intent]
  );

  console.log(`Refund processed: ${charge.id}`);
}

app.listen(3000, () => console.log('Server running on port 3000'));
```

Next steps:
1. Set up webhook endpoint in Stripe Dashboard
2. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Implement client-side with Stripe Elements (React/Vue)

Would you like me to show the client-side integration next?""",
    },
]

# Define all test conversations
TEST_CONVERSATIONS = [
    TestConversation(
        id="auth_implementation",
        topic="Implementing JWT authentication system",
        sessions=3,
        total_turns=60,
        conversations=auth_conversations,
        test_questions=[
            {
                "question": "What authentication strategy did we choose and why?",
                "answer": "JWT (JSON Web Tokens) with bcrypt password hashing. We chose this because it's stateless, scalable for 50k users, and provides good security with access tokens (15 min expiry) and refresh tokens (7 days).",
            },
            {
                "question": "How did we fix the token expiration issue?",
                "answer": "We implemented a token refresh endpoint with refresh token rotation. Each time a refresh token is used, it's revoked and a new one is issued, preventing token reuse attacks while keeping users logged in.",
            },
            {
                "question": "What security measures did we implement for password storage?",
                "answer": "We used bcrypt with 12 salt rounds to hash passwords, stored only the hash in the database, and implemented rate limiting. Passwords must be at least 8 characters with uppercase, lowercase, and digits.",
            },
        ],
    ),
    TestConversation(
        id="bug_debugging",
        topic="Debugging React 'Cannot read property' error",
        sessions=1,
        total_turns=20,
        conversations=bug_conversations,
        test_questions=[
            {
                "question": "What was the root cause of the 'Cannot read property map of undefined' error?",
                "answer": "The state was initialized as undefined (useState() with no argument), and the component tried to access data.items before the API call completed, causing the error.",
            },
            {
                "question": "What are the three key fixes we applied?",
                "answer": "1) Initialize state to null instead of undefined, 2) Add loading and error states, 3) Use optional chaining (data?.items) and provide fallback empty array.",
            },
        ],
    ),
    TestConversation(
        id="payment_refactoring",
        topic="Refactoring monolithic payment processing code",
        sessions=1,
        total_turns=30,
        conversations=refactor_conversations,
        test_questions=[
            {
                "question": "How did we break down the 500-line payment function?",
                "answer": "We split it into four modular classes: PaymentValidator (validation), PaymentProcessor (gateway interaction), PaymentNotificationService (notifications), and PaymentService (orchestrator). Each follows Single Responsibility Principle.",
            },
            {
                "question": "What are the benefits of the refactored architecture?",
                "answer": "Each class has single responsibility, components are testable in isolation, payment gateways are easily swappable, the main flow is clear and readable, and validation logic is reusable.",
            },
        ],
    ),
    TestConversation(
        id="performance_optimization",
        topic="Optimizing slow API endpoint",
        sessions=1,
        total_turns=25,
        conversations=performance_conversations,
        test_questions=[
            {
                "question": "What was the main performance problem with the /users endpoint?",
                "answer": "It was a classic N+1 query problem. The endpoint fetched 1000 users, then made 2000 additional queries (one for profile, one for posts per user), totaling 3001 queries taking 3 seconds.",
            },
            {
                "question": "What optimizations did we implement and what was the improvement?",
                "answer": "We added pagination (20 users per page), used JOINs to eliminate N+1 queries, implemented JSON aggregation in the database, added 5-minute caching, and created database indexes. This reduced response time from 3000ms to 150ms (95% improvement).",
            },
        ],
    ),
    TestConversation(
        id="stripe_integration",
        topic="Integrating Stripe payment processing",
        sessions=1,
        total_turns=30,
        conversations=api_conversations,
        test_questions=[
            {
                "question": "What are the main components of our Stripe integration?",
                "answer": "1) Payment intent creation endpoint (server-side), 2) Webhook handler for async events (payment success/failure/refunds), 3) Database updates for order status, 4) Email notifications for payment events.",
            },
            {
                "question": "Why do we need webhooks for Stripe integration?",
                "answer": "Webhooks handle asynchronous payment events (success, failure, refunds) that occur outside the initial request flow. They ensure our database stays in sync with Stripe's payment status and allow us to notify users of payment outcomes.",
            },
        ],
    ),
]


def get_test_conversations() -> List[TestConversation]:
    """Get all test conversations"""
    return TEST_CONVERSATIONS


def get_conversation_by_id(conversation_id: str) -> TestConversation:
    """Get specific conversation by ID"""
    for conv in TEST_CONVERSATIONS:
        if conv.id == conversation_id:
            return conv
    raise ValueError(f"Conversation {conversation_id} not found")
