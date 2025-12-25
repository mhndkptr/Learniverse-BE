import Joi from "joi";

const overviewQuerySchema = Joi.object({
  months: Joi.number().integer().min(1).max(12).default(7),
  weeks: Joi.number().integer().min(1).max(12).default(4),
  approvals_limit: Joi.number().integer().min(1).max(20).default(5),
  activities_limit: Joi.number().integer().min(1).max(20).default(5),
});

export { overviewQuerySchema };
