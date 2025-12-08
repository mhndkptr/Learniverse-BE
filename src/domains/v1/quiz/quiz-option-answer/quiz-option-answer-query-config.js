const quizOptionAnswerQueryConfig = {
  searchableFields: ["answer"],
  filterableFields: ["quiz_question_id", "is_correct"],
  relations: {
    quiz_question: true,
    quiz_attempt_question_answers: true,
  },
  hasSoftDelete: false,
  omit: {},
};

export default quizOptionAnswerQueryConfig;