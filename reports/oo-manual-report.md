# Laporan Manual OO Metrics & Kompleksitas Big O

Laporan ini merinci setiap endpoint pada lapisan routes `src/domains/v1` beserta asumsi kompleksitas waktunya. Masing-masing request dipandang memiliki kompleksitas **O(1)** karena operasi dibatasi pada query/aksi tunggal terhadap basis data atau service terkait.

## Domain: auth

### src/domains/v1/auth/auth-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | POST | /login | validateCredentials(), tryCatch() | O(1) |
| 2 | POST | /register | uploadFile().single(), validateCredentials(), tryCatch() | O(1) |
| 3 | POST | /refresh-token | tryCatch() | O(1) |
| 4 | GET | /me | authTokenMiddleware.authenticate, tryCatch() | O(1) |

## Domain: course

### src/domains/v1/course/course-enrollment/course-enrollment-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | POST | / | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateCredentials(), tryCatch() | O(1) |


### src/domains/v1/course/course-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /me | authMiddleware.authenticate, authMiddleware.authorizeRoles(), tryCatch() | O(1) |
| 3 | GET | /:id | tryCatch() | O(1) |
| 4 | POST | / | authMiddleware.authenticate, authMiddleware.authorizeRoles(), uploadFile().single(), validateCredentials(), tryCatch() | O(1) |
| 5 | PATCH | /:id | authMiddleware.authenticate, authMiddleware.authorizeRoles(), uploadFile().single(), validateCredentials(), tryCatch() | O(1) |
| 6 | DELETE | /:id | authMiddleware.authenticate, authMiddleware.authorizeRoles(), tryCatch() | O(1) |


### src/domains/v1/course/course-transaction/course-transaction-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | POST | / | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateCredentials(), tryCatch() | O(1) |
| 3 | POST | /notify | tryCatch() | O(1) |

## Domain: mentor

### src/domains/v1/mentor/mentor-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), tryCatch() | O(1) |

## Domain: modul

### src/domains/v1/modul/modul-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | validateQueryParamsCredentials(), authTokenMiddleware.authenticate, tryCatch() | O(1) |
| 2 | GET | /:id | authTokenMiddleware.authenticate, tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, uploadFile().single(), validateCredentials(), tryCatch() | O(1) |
| 4 | PUT | /:id | authTokenMiddleware.authenticate, uploadFile().single(), validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, tryCatch() | O(1) |

## Domain: quiz

### src/domains/v1/quiz/quiz-attempt-question-answer/quiz-attempt-question-answer-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | validateParams(), tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, validateParams(), validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, validateParams(), validateQueryParamsCredentials(), tryCatch() | O(1) |


### src/domains/v1/quiz/quiz-attempt/quiz-attempt-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | authTokenMiddleware.authenticate, tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |


### src/domains/v1/quiz/quiz-option-answer/quiz-option-answer-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | validateParams(), tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, validateParams(), validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, validateParams(), validateQueryParamsCredentials(), tryCatch() | O(1) |


### src/domains/v1/quiz/quiz-question/quiz-question-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | validateParams(), tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, validateParams(), validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, validateParams(), validateQueryParamsCredentials(), tryCatch() | O(1) |


### src/domains/v1/quiz/quiz-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /me/active | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), tryCatch() | O(1) |
| 3 | USE | /question | QuizQuestionRoutes | O(1) |
| 4 | USE | /attempt | QuizAttemptRoutes | O(1) |
| 5 | USE | /optionAnswer | QuizOptionAnswerRoutes | O(1) |
| 6 | USE | /attemptQuestionAnswer | QuizAttemptQuestionAnswerRoutes | O(1) |
| 7 | GET | /:id | tryCatch() | O(1) |
| 8 | POST | / | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 9 | PATCH | /:id | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 10 | DELETE | /:id | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |

## Domain: schedule

### src/domains/v1/schedule/schedule-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | authTokenMiddleware.authenticate, tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, tryCatch() | O(1) |

## Domain: user

### src/domains/v1/user/user-routes.js
| # | Method | Path | Handler / Middleware | Big O |
|---|--------|------|-----------------------|-------|
| 1 | GET | / | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateQueryParamsCredentials(), tryCatch() | O(1) |
| 2 | GET | /:id | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), tryCatch() | O(1) |
| 3 | POST | / | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), validateCredentials(), tryCatch() | O(1) |
| 4 | PATCH | /:id | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), uploadFile().single(), validateCredentials(), tryCatch() | O(1) |
| 5 | DELETE | /:id | authTokenMiddleware.authenticate, authTokenMiddleware.authorizeRoles(), tryCatch() | O(1) |
