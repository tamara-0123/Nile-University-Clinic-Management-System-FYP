export const successResponse = (res, data, message = 'Request successful') => {
    res.status(200).json({
        success: true,
        message,
        data
    });
};