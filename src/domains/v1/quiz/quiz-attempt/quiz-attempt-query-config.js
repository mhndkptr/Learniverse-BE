const quizAttemptQueryConfig = {
  searchableFields: ["status"],
  filterableFields: ["quiz_id", "user_id", "status"],
  relations: {
    quiz: {
      include: {
        course: true,
        quiz_questions: {
          include: {
            quiz_option_answers: true,
          },
        },
      },
    },
    user: true,
    quiz_attempt_question_answers: {
      include: {
        quiz_question: {
          include: {
            quiz_option_answers: true,
          },
        },
        quiz_option_answer: true,
      },
    },
  },
  hasSoftDelete: false,
  omit: {},
};

export default quizAttemptQueryConfig;