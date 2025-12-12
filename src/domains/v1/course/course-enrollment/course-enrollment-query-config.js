const courseEnrollmentQueryConfig = {
  searchableFields: ["user.name", "user.email", "course.title", "course.code"],
  filterableFields: ["role", "user_id", "course_id"],
  relations: {
    user: true,
    course: true,
    course_transaction: true,
  },
  hasSoftDelete: false,
  omit: {},
};

export default courseEnrollmentQueryConfig;
