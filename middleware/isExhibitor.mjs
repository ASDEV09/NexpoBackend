// 🛡 EXHIBITOR CHECK
const isExhibitor = (req, res, next) => {
  if (req.user.role !== "exhibitor") {
    return res.status(403).json({
      success: false,
      message: "Exhibitor access only"
    });
  }
  next();
};

export default isExhibitor;
