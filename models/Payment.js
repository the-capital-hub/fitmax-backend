const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", trim: true, uppercase: true },
    method: { type: String, enum: ["card", "upi", "later"], default: "card" },
    status: { type: String, enum: ["Pending", "Paid", "Failed", "Refunded"], default: "Pending" },
    transactionId: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
