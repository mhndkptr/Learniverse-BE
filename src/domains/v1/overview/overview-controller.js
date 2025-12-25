import { successResponse } from "../../../utils/response.js";
import OverviewService from "./overview-service.js";

class OverviewController {
  async getOverview(req, res) {
    const data = await OverviewService.getOverview(req.validatedQuery || {});
    return successResponse(res, data, "Overview retrieved successfully");
  }
}

export default new OverviewController();
