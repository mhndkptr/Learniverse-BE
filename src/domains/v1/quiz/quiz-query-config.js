const quizQueryConfig = {
    searchableFields: ["title", "description"],
    filterableFields: ["course_id", "status", "show_review"],
    relations: {
      course: true,
      quiz_questions: {
        include: {
          quiz_options_answers: true,
        },
      },
      quiz_attempts: true,
    },
    hasSoftDelete: false,
    omit: {},
  };
  
  export default quizQueryConfig;
  