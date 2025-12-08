import {
  PrismaClient,
  UserRole,
  CourseEnrollmentRole,
  MentorStatus,
  QuizStatus,
  QuizQuestionType,
  QuizAttemptStatus,
} from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // 1) Bersihkan data (urut dari anak → induk)
  await prisma.quizAttemptQuestionAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizOptionAnswer.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();

  await prisma.schedule.deleteMany();
  await prisma.mentor.deleteMany();
  await prisma.modul.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.courseTransaction.deleteMany();

  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // 2) Seed USERS (5)
  const users = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.user.create({
        data: {
          id: randomUUID(),
          name: `User ${i + 1}`,
          username: `user${i + 1}`,
          email: `user${i + 1}@example.com`,
          phone_number: `+62812${(10000000 + i).toString()}`,
          password: `$2a$10$dummyhashforuser${i + 1}`, // placeholder; ganti sesuai kebutuhan
          profile_uri: `https://cdn.example.com/avatars/user${i + 1}.png`,
          role: i === 0 ? UserRole.ADMIN : UserRole.STUDENT,
          verified_at: new Date(`2025-01-${10 + i}T08:00:00.000Z`),
          deleted_at: new Date(`2030-01-01T00:00:00.000Z`), // tetap isi walau nullable (sesuai permintaan)
        },
      })
    )
  );

  // 3) Seed COURSES (5)
  const courses = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.course.create({
        data: {
          id: randomUUID(),
          title: `Course ${i + 1}`,
          description: `This is the description for Course ${i + 1}.`,
          content: `# Course ${i + 1}\nDetail content in markdown...`,
          code: `COURSE-${100 + i}`,
          cover_uri: `https://cdn.example.com/covers/course${i + 1}.jpg`,
          price: 99.99 + i,
          is_open_registration_member: i % 2 === 0,
          is_open_registration_mentor: i % 2 !== 0,
          deleted_at: new Date(`2030-06-0${(i % 5) + 1}T00:00:00.000Z`),
        },
      })
    )
  );

  // 4) Seed COURSE_TRANSACTIONS (5)
  const transactions = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.courseTransaction.create({
        data: {
          id: randomUUID(),
          transaction_token: `trx_token_${i + 1}`,
          redirect_url: `https://payment.example.com/redirect/${i + 1}`,
          payment_method: i % 2 === 0 ? "credit_card" : "bank_transfer",
          status: i % 2 === 0 ? "settlement" : "pending",
          settlement_time: new Date(`2025-02-0${(i % 5) + 1}T12:0${i}:00.000Z`),
          user_id: users[i].id,
          course_id: courses[i].id,
        },
      })
    )
  );

  // 5) Seed COURSE_ENROLLMENTS (5)
  const enrollments = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.courseEnrollment.create({
        data: {
          id: randomUUID(),
          joined_at: new Date(`2025-03-0${(i % 5) + 1}T09:00:00.000Z`),
          left_at: new Date(`2025-04-0${(i % 5) + 1}T09:00:00.000Z`), // diisi walau nullable
          role:
            i % 2 === 0
              ? CourseEnrollmentRole.MEMBER
              : CourseEnrollmentRole.MENTOR,
          user_id: users[i].id,
          course_id: courses[(i + 1) % courses.length].id,
        },
      })
    )
  );

  // 6) Seed MODULS (5)
  const moduls = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.modul.create({
        data: {
          id: randomUUID(),
          title: `Modul ${i + 1}`,
          description: `Description for Modul ${i + 1}`,
          file_name: `modul_${i + 1}.pdf`,
          modul_uri: `https://cdn.example.com/moduls/modul_${i + 1}.pdf`,
          course_id: courses[i].id,
        },
      })
    )
  );

  // 7) Seed MENTORS (5)
  const mentors = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.mentor.create({
        data: {
          id: randomUUID(),
          bio: `Mentor ${i + 1} bio`,
          reason: `Reason to mentor ${i + 1}`,
          motivation: `Motivation ${i + 1}`,
          cv_uri: `https://cdn.example.com/cv/mentor_${i + 1}.pdf`,
          portfolio_uri: `https://portfolio.example.com/mentor_${i + 1}`,
          status:
            i % 3 === 0
              ? MentorStatus.ACCEPTED
              : i % 3 === 1
              ? MentorStatus.REJECTED
              : MentorStatus.ON_REVIEW,
          user_id: users[(i + 1) % users.length].id,
          course_id: courses[(i + 2) % courses.length].id,
        },
      })
    )
  );

  // 8) Seed SCHEDULES (5)
  const schedules = await Promise.all(
    Array.from({ length: 5 }).map((_, i) => {
      const start = new Date(`2025-05-0${(i % 5) + 1}T13:00:00.000Z`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 jam
      return prisma.schedule.create({
        data: {
          id: randomUUID(),
          title: `Schedule ${i + 1}`,
          description: `Agenda for schedule ${i + 1}`,
          start_time: start,
          end_time: end,
          course_id: courses[(i + 3) % courses.length].id,
        },
      });
    })
  );

  // 9) Seed QUIZZES (5) – 1 quiz per course (pas 5)
  const quizzes = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.quiz.create({
        data: {
          id: randomUUID(),
          title: `Quiz ${i + 1}`,
          description: `Description for Quiz ${i + 1}`,
          status: i % 2 === 0 ? QuizStatus.PUBLISH : QuizStatus.DRAFT,
          show_review: i % 2 === 0,
          start_date: new Date(`2025-06-0${(i % 5) + 1}T07:00:00.000Z`),
          end_date: new Date(`2025-06-1${(i % 5) + 1}T07:00:00.000Z`),
          max_attempt: 3 + i,
          duration: 30 + i * 5, // menit
          course_id: courses[i].id,
        },
      })
    )
  );

  // 10) Seed QUIZ_QUESTIONS (5) – 1 question per quiz
  const questions = await Promise.all(
    quizzes.map((qz, i) =>
      prisma.quizQuestion.create({
        data: {
          id: randomUUID(),
          question: `Question ${i + 1} for ${qz.title}`,
          type:
            i % 2 === 0
              ? QuizQuestionType.MULTIPLE_CHOICE
              : QuizQuestionType.SINGLE_CHOICE,
          image_uri: `https://cdn.example.com/questions/q${i + 1}.png`, // diisi walau opsional
          quiz_id: qz.id,
        },
      })
    )
  );

  // 11) Seed QUIZ_OPTION_ANSWERS (5) – 1 option per question (semua is_correct=true agar konsisten)
  const options = await Promise.all(
    questions.map((qq, i) =>
      prisma.quizOptionAnswer.create({
        data: {
          id: randomUUID(),
          answer: `Option A for ${qq.question}`,
          image_uri: `https://cdn.example.com/options/o${i + 1}.png`, // diisi walau opsional
          is_correct: true,
          quiz_question_id: qq.id,
        },
      })
    )
  );

  // 12) Seed QUIZ_ATTEMPTS (5) – 1 attempt per quiz oleh user berbeda
  const attempts = await Promise.all(
    quizzes.map((qz, i) => {
      const start = new Date(`2025-07-0${(i % 5) + 1}T10:00:00.000Z`);
      const finish = new Date(start.getTime() + (20 + i) * 60 * 1000);
      return prisma.quizAttempt.create({
        data: {
          id: randomUUID(),
          status:
            i % 2 === 0
              ? QuizAttemptStatus.FINISHED
              : QuizAttemptStatus.ON_PROGRESS,
          start_at: start,
          finish_at: finish,
          quiz_id: qz.id,
          user_id: users[(i + 2) % users.length].id,
        },
      });
    })
  );

  // 13) Seed QUIZ_ATTEMPT_QUESTION_ANSWERS (5) – 1 jawaban per attempt (konsisten dengan pertanyaan dan option)
  const aqa = await Promise.all(
    attempts.map((att, i) =>
      prisma.quizAttemptQuestionAnswer.create({
        data: {
          id: randomUUID(),
          quiz_attempt_id: att.id,
          quiz_question_id: questions[i].id,
          quiz_option_answer_id: options[i].id,
        },
      })
    )
  );

  console.log("✅ Seeding complete.");
}

// main()
//   .catch((e) => {
//     console.error("❌ Seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
