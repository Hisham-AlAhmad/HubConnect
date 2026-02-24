/**
 * Auth middleware placeholder.
 * Replace with real JWT / Supabase token verification.
 */
const authenticate = (req, _res, next) => {
    // TODO: Verify Supabase JWT from Authorization header
    // const token = req.headers.authorization?.split(' ')[1];
    // const user = verifyToken(token);
    // req.user = user;
    next();
};

export default authenticate;
