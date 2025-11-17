const CourseTransactionStatus = Object.freeze({
  SETTLEMENT: "settlement",
  WAITING_PAYMENT: "waiting_payment",
  FAILED: "failed",
  EXPIRE: "expire",
  CANCEL: "cancel",
  PENDING: "pending",
  CAPTURE: "capture",
  DENY: "deny",
});

export default CourseTransactionStatus;
