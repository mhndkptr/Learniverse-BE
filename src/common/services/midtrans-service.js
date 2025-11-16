import Midtrans from "midtrans-client";

class MidtransService {
  constructor() {
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      throw new Error(
        "Midtrans Config Error: Server Key or Client Key is missing."
      );
    }

    const config = {
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    };

    this.snap = new Midtrans.Snap(config);
    this.core = new Midtrans.CoreApi(config);
  }

  async createSnapTransaction(params) {
    try {
      const transaction = await this.snap.createTransaction(params);
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async checkTransactionStatus(orderId) {
    try {
      const status = await this.core.transaction.status(orderId);
      return status;
    } catch (error) {
      throw error;
    }
  }
}

const midtransService = new MidtransService();
export default midtransService;
