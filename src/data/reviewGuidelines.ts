export const AGENTS_MD_GUIDELINES = `
# Code Review Guidelines

**A comprehensive guide for AI agents performing code reviews**, organized by priority and impact.

---

## Table of Contents

### Security — **CRITICAL**
1. [SQL Injection Prevention](#sql-injection-prevention)
2. [XSS Prevention](#xss-prevention)

### Performance — **HIGH**
3. [Avoid N+1 Query Problem](#avoid-n-1-query-problem)

### Correctness — **HIGH**
4. [Proper Error Handling](#proper-error-handling)

### Maintainability — **MEDIUM**
5. [Use Meaningful Variable Names](#use-meaningful-variable-names)
6. [Add Type Hints](#add-type-hints)

---

## Security

### SQL Injection Prevention

**Impact: CRITICAL** | **Category: security** | **Tags:** sql, security, injection, database

Never construct SQL queries with string concatenation or f-strings. Always use parameterized queries to prevent SQL injection attacks.

#### Why This Matters

SQL injection is one of the most common and dangerous web vulnerabilities. Attackers can:
- Access unauthorized data
- Modify or delete database records
- Execute admin operations on the database

#### ❌ Incorrect

\`\`\`python
# DANGEROUS: Concatenation
query = "SELECT * FROM users WHERE username = '" + username + "'"
cursor.execute(query)

# DANGEROUS: f-string
query = f"SELECT * FROM users WHERE username = '{username}'"
cursor.execute(query)
\`\`\`

#### ✅ Correct

\`\`\`python
# SAFE: Parameterized query
query = "SELECT * FROM users WHERE username = %s"
cursor.execute(query, (username,))
\`\`\`

---

### XSS Prevention

**Impact: CRITICAL** | **Category: security** | **Tags:** xss, security, frontend

Never render user-provided content directly into the DOM without sanitization. Use built-in framework protections or dedicated libraries like DOMPurify.

#### Why This Matters

Cross-Site Scripting (XSS) allows attackers to execute malicious scripts in the victim's browser. This can lead to session theft, credential harvesting, or defacement.

#### ❌ Incorrect

\`\`\`javascript
// DANGEROUS: Direct innerHTML
element.innerHTML = userInput;
\`\`\`

#### ✅ Correct

\`\`\`javascript
// SAFE: Use textContent
element.textContent = userInput;

// SAFE: Use DOMPurify for HTML content
element.innerHTML = DOMPurify.sanitize(userInput);
\`\`\`

---

## Performance

### Avoid N+1 Query Problem

**Impact: HIGH** | **Category: performance** | **Tags:** sql, database, performance

When fetching data from a database, avoid executing a separate query for each item in a list. Use eager loading or join queries instead.

#### Why This Matters

The N+1 problem can significantly degrade application performance, especially as the number of items grows. It leads to excessive database roundtrips and latency.

#### ❌ Incorrect

\`\`\`python
# DANGEROUS: One query for all users, then N queries for each user's posts
users = User.query.all()
for user in users:
    print(user.posts)
\`\`\`

#### ✅ Correct

\`\`\`python
# SAFE: Eager load posts with users in a single query
users = User.query.options(db.joinedload('posts')).all()
for user in users:
    print(user.posts)
\`\`\`

---

## Correctness

### Proper Error Handling

**Impact: HIGH** | **Category: correctness** | **Tags:** error-handling, reliability

Always wrap potentially failing operations in try-except blocks. Avoid broad exception catching and provide meaningful error messages.

#### Why This Matters

Robust error handling prevents application crashes and provides clear guidance for debugging and user feedback.

#### ❌ Incorrect

\`\`\`python
# DANGEROUS: Broad exception catch without logging
try:
    process_data()
except:
    pass
\`\`\`

#### ✅ Correct

\`\`\`python
# SAFE: Specific exception catch with logging
try:
    process_data()
except ValueError as e:
    logger.error(f"Data processing failed: {e}")
    raise
\`\`\`

---

## Maintainability

### Use Meaningful Variable Names

**Impact: MEDIUM** | **Category: maintainability** | **Tags:** naming, clean-code

Use descriptive and unambiguous names for variables, functions, and classes. Avoid single-letter names except for loop counters.

#### Why This Matters

Meaningful names improve code readability and reduce cognitive load for developers.

#### ❌ Incorrect

\`\`\`python
def f(a, b):
    return a + b

x = 10
\`\`\`

#### ✅ Correct

\`\`\`python
def calculate_total_price(unit_price, quantity):
    return unit_price * quantity

max_retry_attempts = 10
\`\`\`

---

### Add Type Hints

**Impact: MEDIUM** | **Category: maintainability** | **Tags:** types, maintainability

Use type hints to specify the expected types of function arguments and return values.

#### Why This Matters

Type hints improve code documentation, enable better IDE support (e.g., autocompletion, type checking), and catch potential bugs early.

#### ❌ Incorrect

\`\`\`python
def get_user(id):
    """Fetch user by ID."""
    return users.get(id)
\`\`\`

#### ✅ Correct

\`\`\`python
def get_user(id: int) -> Optional[Dict[str, Any]]:
    """Fetch user by ID."""
    return users.get(id)
\`\`\`
`;
