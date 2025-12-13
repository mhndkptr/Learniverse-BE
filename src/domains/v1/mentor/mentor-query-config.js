const mentorQueryConfig = {
  searchableFields: ["bio", "reason", "motivation", "user.name", "user.email"],

  filterableFields: ["status", "user_id", "course_id"],

  relations: {
    user: {
      include: {
        mentors: true,
      },
    },
    course: {
      include: {
        mentors: true,
      },
    },
  },

  hasSoftDelete: false,

  omit: {},
};

export default mentorQueryConfig;
