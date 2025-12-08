const quizAttemptQuestionAnswerQueryConfig = {
  searchableFields: [],
  
  filterableFields: [
    "quiz_attempt_id",
    "quiz_question_id",
    "quiz_option_answer_id"
  ],

  relations: {
    quiz_attempt: true,
    quiz_question: true,
    quiz_option_answer: true,
  },

  hasSoftDelete: false,
  
  omit: {},
};

export default quizAttemptQuestionAnswerQueryConfig;