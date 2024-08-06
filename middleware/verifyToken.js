import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Generalized JWT verification middleware
export const verifyJWT = (model, secretKey) => asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, secretKey);
        
        if (!decodedToken?._id) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Find the user or entity by ID using the provided model
        const entity = await model.findById(decodedToken._id).select("-password -refreshToken");
        
        if (!entity) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = entity; // You may want to rename `req.user` to something more general if needed
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
