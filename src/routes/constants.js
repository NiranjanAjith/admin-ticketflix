const routes = {
  HOME: "/",
  VIEW_COUPON:"/view-coupon/:couponAndDocId",
  VIEW_TICKET:"/view-ticket/:ticketAndDocId",

  ADMIN_LOGIN: "/campaign-admin/login",
  ADMIN_DASHBOARD: "/campaign-admin",
  ADD_THEATRE: "/campaign-admin/theatres/add-theatre",
  ADD_MOVIE: "/campaign-admin/movies/add-movie",
  MANAGE_MOVIES: "/campaign-admin/movies",
  MANAGE_THEATRES: "/campaign-admin/theatres",
  MANAGE_EXECS: "/campaign-admin/manage-executives",
  MANAGE_SHOWS:"/campaign-admin/manage-shows/:movieId?",

  EXEC_LOGIN: "/executive/login",
  EXEC_SIGNUP: "/executive/signup",
  EXEC_DASHBOARD: "/executive",
  EXEC_ADD_TRANSACTION: "/executive/transaction-form",
  EXEC_COUPON_GEN: "/executive/coupon-generation",
};

export default routes;
