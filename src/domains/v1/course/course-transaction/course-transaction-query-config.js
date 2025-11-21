const courseTransactionQueryConfig = {
  searchableFields: [],
  filterableFields: ["status", "user_id", "course_id", "course_enrollment_id"],
  relations: {
    user: true,
    course: true,
    course_enrollment: true,
  },
  hasSoftDelete: false,
  omit: {},
};

export default courseTransactionQueryConfig;
