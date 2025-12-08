const quizQuestionQueryConfig = {
  searchableFields: ["question"],
  filterableFields: ["quiz_id", "type"],
  relations: {
    quiz: true,
    quiz_option_answers: true,
    quiz_attempt_question_answers: true,
  },
  hasSoftDelete: false,
  omit: {},
};

export default quizQuestionQueryConfig;