const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Payment = require("../models/Payment");
const Consultation = require("../models/Consultation");
const createNotification = require("../utils/createNotification");

const router = express.Router();

const populatePayment = (query) =>
  query
    .populate("patient", "firstName lastName email")
    .populate("consultation", "careTeam date time status paymentStatus")
    .sort({ createdAt: -1 });

// PATIENT: create a pending payment record for their own consultation.
router.post(
  "/",
  protect,
  authorizeRoles("patient"),
  async (req, res) => {
    try {
      const { consultation, amount, currency, method, description } = req.body;

      if (!consultation) {
        return res.status(400).json({ success: false, message: "Consultation is required" });
      }

      const consultationDoc = await Consultation.findOne({
        _id: consultation,
        patient: req.user.userId,
      });

      if (!consultationDoc) {
        return res.status(404).json({ success: false, message: "Consultation not found" });
      }

      if (consultationDoc.status === "Cancelled") {
        return res.status(400).json({ success: false, message: "Cancelled consultations cannot be paid" });
      }

      const existingPending = await Payment.findOne({
        consultation,
        patient: req.user.userId,
        status: "Pending",
      });

      if (existingPending) {
        const populated = await populatePayment(Payment.findById(existingPending._id));
        return res.status(200).json({ success: true, payment: populated[0], alreadyExists: true });
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount < 0) {
        return res.status(400).json({ success: false, message: "Invalid payment amount" });
      }

      const payment = await Payment.create({
        patient: req.user.userId,
        consultation,
        amount: numericAmount,
        currency: currency || "INR",
        method: method || "card",
        status: "Pending",
        description: description || "FitMax consultation payment",
      });

      consultationDoc.paymentStatus = "Pending";
      await consultationDoc.save();

      const populated = await populatePayment(Payment.findById(payment._id));
      return res.status(201).json({ success: true, payment: populated[0] });
    } catch (error) {
      console.error("Patient payment creation error:", error);
      return res.status(500).json({ success: false, message: "Unable to create payment record" });
    }
  }
);

// PATIENT: get their own payment history.
router.get(
  "/my",
  protect,
  authorizeRoles("patient"),
  async (req, res) => {
    try {
      const payments = await populatePayment(Payment.find({ patient: req.user.userId }));
      return res.json({ success: true, payments });
    } catch (error) {
      console.error("Patient payment fetch error:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch payments" });
    }
  }
);

// ADMIN: get all payments and summary statistics.
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const payments = await populatePayment(Payment.find());
      const stats = {
        total: payments.length,
        paid: payments.filter((p) => p.status === "Paid").length,
        pending: payments.filter((p) => p.status === "Pending").length,
        failed: payments.filter((p) => p.status === "Failed").length,
        refunded: payments.filter((p) => p.status === "Refunded").length,
        revenue: payments
          .filter((p) => p.status === "Paid")
          .reduce((sum, p) => sum + Number(p.amount || 0), 0),
      };

      return res.json({ success: true, payments, stats });
    } catch (error) {
      console.error("Admin payment fetch error:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch admin payments" });
    }
  }
);

// ADMIN: update payment status.
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["Pending", "Paid", "Failed", "Refunded"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid payment status" });
      }

      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      payment.status = status;
      payment.paidAt = status === "Paid" ? new Date() : null;
      await payment.save();

      if (payment.consultation) {
        await Consultation.findByIdAndUpdate(payment.consultation, {
          paymentStatus: status,
        });
      }

      await createNotification({
        recipient: payment.patient,
        sender: req.user.userId,
        type: "Payment",
        title: `Payment ${status.toLowerCase()}`,
        message: `Your payment of ₹${Number(payment.amount || 0).toLocaleString("en-IN")} is now ${status.toLowerCase()}.`,
        link: "/patient/payments",
      });

      const populated = await populatePayment(Payment.findById(payment._id));
      return res.json({ success: true, payment: populated[0] });
    } catch (error) {
      console.error("Payment status update error:", error);
      return res.status(500).json({ success: false, message: "Unable to update payment status" });
    }
  }
);

module.exports = router;
