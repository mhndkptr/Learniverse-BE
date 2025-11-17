const mentorQueryConfig = {
  // Field yang bisa digunakan untuk pencarian (search)
  searchableFields: ["bio", "reason", "motivation"],

  // Field yang bisa digunakan untuk filtering
  filterableFields: ["status", "user_id", "course_id"],

  // Relasi antar model untuk include di Prisma query
  relations: {
    user: {
      include: {
        mentors: true, // agar bisa melihat semua mentor milik user tersebut
      },
    },
    course: {
      include: {
        mentors: true, // agar bisa melihat semua mentor dari course tersebut
      },
    },
  },

  hasSoftDelete: false,

  omit: {},
};

export default mentorQueryConfig;
