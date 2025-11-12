const userQueryConfig = {
  // Field yang bisa digunakan untuk pencarian (search)
  searchableFields: ["name", "username", "email", "phone_number"],

  // Field yang bisa digunakan untuk filtering
  filterableFields: ["role", "verified_at", "deleted_at"],

  // Relasi antar model untuk include di Prisma query
  relations: {
    mentors: {
      include: {
        user: true,
      },
    },
    course_transactions: {
      include: {
        user: true,
        course: true,
      },
    },
    course_enrollments: {
      include: {
        user: true,
        course: true,
      },
    },
    quiz_attempts: {
      include: {
        user: true,
        quiz: true,
      },
    },
  },

  // User memiliki fitur soft delete (deleted_at)
  hasSoftDelete: true,

  // Field yang perlu diabaikan ketika menampilkan data (misalnya password)
  omit: {
    password: true,
  },
};

export default userQueryConfig;
