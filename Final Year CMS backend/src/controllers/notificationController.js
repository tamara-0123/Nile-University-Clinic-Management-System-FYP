import Notification from "../models/Notification.js";

// Get a list of notifications for a user
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification || notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
};

