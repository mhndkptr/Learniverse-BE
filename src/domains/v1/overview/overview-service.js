import { PrismaService } from "../../../common/services/prisma-service.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatTimeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function percentChange(current, previous) {
  if (!previous && !current) return 0;
  if (!previous && current) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

class OverviewService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getOverview(options = {}) {
    const monthsCount = Number(options.months || 7);
    const weeksCount = Number(options.weeks || 4);
    const approvalsLimit = Number(options.approvals_limit || 5);
    const activitiesLimit = Number(options.activities_limit || 5);
    const now = new Date();
    const currentStart = new Date(now.getTime() - 30 * DAY_MS);
    const previousStart = new Date(now.getTime() - 60 * DAY_MS);

    const [
      totalUsers,
      activeCourses,
      enrollments,
      totalRevenueAgg,
      currentUsers,
      previousUsers,
      currentCourses,
      previousCourses,
      currentEnrollments,
      previousEnrollments,
      currentRevenueAgg,
      previousRevenueAgg,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deleted_at: null } }),
      this.prisma.course.count({ where: { deleted_at: null } }),
      this.prisma.courseEnrollment.count(),
      this.prisma.courseTransaction.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["settlement", "capture", "success"] } },
      }),
      this.prisma.user.count({ where: { created_at: { gte: currentStart } } }),
      this.prisma.user.count({
        where: { created_at: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.course.count({
        where: { created_at: { gte: currentStart } },
      }),
      this.prisma.course.count({
        where: { created_at: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.courseEnrollment.count({
        where: { created_at: { gte: currentStart } },
      }),
      this.prisma.courseEnrollment.count({
        where: { created_at: { gte: previousStart, lt: currentStart } },
      }),
      this.prisma.courseTransaction.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ["settlement", "capture", "success"] },
          created_at: { gte: currentStart },
        },
      }),
      this.prisma.courseTransaction.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ["settlement", "capture", "success"] },
          created_at: { gte: previousStart, lt: currentStart },
        },
      }),
    ]);

    const totalRevenue = totalRevenueAgg?._sum?.amount || 0;
    const currentRevenue = currentRevenueAgg?._sum?.amount || 0;
    const previousRevenue = previousRevenueAgg?._sum?.amount || 0;

    const stats = {
      totalUsers,
      activeCourses,
      totalRevenue,
      enrollments,
      changes: {
        users: percentChange(currentUsers, previousUsers),
        courses: percentChange(currentCourses, previousCourses),
        revenue: percentChange(currentRevenue, previousRevenue),
        enrollments: percentChange(currentEnrollments, previousEnrollments),
      },
    };

    const enrollmentStart = new Date(
      now.getFullYear(),
      now.getMonth() - (monthsCount - 1),
      1
    );
    const enrollmentsRecent = await this.prisma.courseEnrollment.findMany({
      where: { created_at: { gte: enrollmentStart } },
      select: { created_at: true },
    });

    const monthBuckets = [];
    for (let i = monthsCount - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        name: monthLabels[d.getMonth()],
        enrollments: 0,
      });
    }

    enrollmentsRecent.forEach((item) => {
      const key = `${item.created_at.getFullYear()}-${String(
        item.created_at.getMonth() + 1
      ).padStart(2, "0")}`;
      const bucket = monthBuckets.find((b) => b.key === key);
      if (bucket) bucket.enrollments += 1;
    });

    const enrollmentTrend = monthBuckets.map(({ name, enrollments }) => ({
      name,
      enrollments,
    }));

    const revenueStart = new Date(now.getTime() - (weeksCount - 1) * WEEK_MS);
    const revenueRecent = await this.prisma.courseTransaction.findMany({
      where: {
        status: { in: ["settlement", "capture", "success"] },
        created_at: { gte: revenueStart },
      },
      select: { created_at: true, amount: true },
    });

    const revenueTrend = Array.from({ length: weeksCount }, (_, idx) => ({
      name: `Week ${idx + 1}`,
      revenue: 0,
    }));

    revenueRecent.forEach((item) => {
      const weekIndex = Math.floor(
        (item.created_at.getTime() - revenueStart.getTime()) / WEEK_MS
      );
      if (weekIndex >= 0 && weekIndex < revenueTrend.length) {
        revenueTrend[weekIndex].revenue += item.amount || 0;
      }
    });

    const pendingApprovalsRaw = await this.prisma.mentor.findMany({
      where: { status: "ON_REVIEW" },
      orderBy: { created_at: "desc" },
      take: approvalsLimit,
      include: { user: true, course: true },
    });

    const pendingApprovals = pendingApprovalsRaw.map((item) => ({
      id: item.id,
      name: item.user?.name || "-",
      course: item.course?.title || "-",
      status: item.status,
    }));

    const [
      recentUsers,
      recentEnrollments,
      recentTransactions,
      recentQuizAttempts,
    ] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { created_at: "desc" },
        take: activitiesLimit,
      }),
      this.prisma.courseEnrollment.findMany({
        orderBy: { created_at: "desc" },
        take: activitiesLimit,
        include: { user: true, course: true },
      }),
      this.prisma.courseTransaction.findMany({
        orderBy: { created_at: "desc" },
        take: activitiesLimit,
        include: { user: true, course: true },
      }),
      this.prisma.quizAttempt.findMany({
        orderBy: { created_at: "desc" },
        take: activitiesLimit,
        include: { user: true, quiz: { include: { course: true } } },
      }),
    ]);

    const activities = [
      ...recentUsers.map((item) => ({
        id: `user-${item.id}`,
        action: "New user registration",
        user: item.name,
        created_at: item.created_at,
      })),
      ...recentEnrollments.map((item) => ({
        id: `enroll-${item.id}`,
        action: "Course enrollment",
        user: item.user?.name || "-",
        course: item.course?.title || null,
        created_at: item.created_at,
      })),
      ...recentTransactions.map((item) => ({
        id: `payment-${item.id}`,
        action: "Payment received",
        user: item.user?.name || "-",
        course: item.course?.title || null,
        created_at: item.created_at,
      })),
      ...recentQuizAttempts.map((item) => ({
        id: `quiz-${item.id}`,
        action: "Quiz attempt completed",
        user: item.user?.name || "-",
        course: item.quiz?.course?.title || null,
        created_at: item.created_at,
      })),
    ]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, activitiesLimit)
      .map((item) => ({
        id: item.id,
        action: item.action,
        user: item.user,
        course: item.course,
        time: formatTimeAgo(item.created_at),
      }));

    return {
      stats,
      enrollmentTrend,
      revenueTrend,
      pendingApprovals,
      recentActivities: activities,
    };
  }
}

export default new OverviewService();
